import React, { useEffect, useState, useRef, useMemo } from 'react'
import {
  Layers3,
  Bookmark,
  FileText,
  Plus,
  Trash2,
  Check,
  Loader2,
  ExternalLink,
  Palette,
  BookOpen,
  Library,
  Wrench,
  HelpCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Project,
  ProjectPhase,
  useProjectDocuments,
  useAddProjectDocument,
  useUpdateProjectDocument,
  useProjectLinks,
  useAddProjectLink,
  useDeleteProjectLink,
  LinkType,
  LinkCategory,
  TechnologyCategory,
} from '../../../../api/projects'
import { Input } from '../../../../components/ui/Input'
import { Textarea } from '../../../../components/ui/Textarea'
import { cn } from '../../../../lib/utils'

interface TechItem {
  id: string
  name: string
  adrReason: string
  category: TechnologyCategory
  title: string
}

interface TechnicalMemoryViewProps {
  project: Project
  phase: ProjectPhase
}

type SubTab = 'tech_stack' | 'link_hub' | 'eng_notes'

const CATEGORY_LABELS: Record<TechnologyCategory, string> = {
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  MOBILE: 'Mobile',
  DATABASE: 'Database',
  DEVOPS: 'DevOps',
  OTHER: 'Other',
}

export const TechnicalMemoryView: React.FC<TechnicalMemoryViewProps> = ({
  project,
  phase,
}) => {
  const [subTab, setSubTab] = useState<SubTab>('tech_stack')
  const [isSaving, setIsSaving] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ── DATA FETCHING ──────────────────────────────────────────────────
  const { data: documents = [] } = useProjectDocuments(project.id)
  const addDocMutation = useAddProjectDocument()
  const updateDocMutation = useUpdateProjectDocument()

  const { data: links = [] } = useProjectLinks(project.id)
  const addLinkMutation = useAddProjectLink()
  const deleteLinkMutation = useDeleteProjectLink(project.id)

  // ── A) TECH STACK & ADR STATE ──────────────────────────────────────
  const [techList, setTechList] = useState<TechItem[]>([])
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null)
  const [newTechName, setNewTechName] = useState('')
  const [newTechTitle, setNewTechTitle] = useState('')
  const [newTechCategory, setNewTechCategory] = useState<TechnologyCategory>('FRONTEND')

  const techDocTitle = `TECH_STACK_ADR_PHASE_${phase.id}`
  const techDoc = documents.find((d) => d.type === 'TECH_DOC' && d.title === techDocTitle)

  useEffect(() => {
    if (techDoc && techDoc.content) {
      try {
        const parsed = JSON.parse(techDoc.content)
        if (Array.isArray(parsed)) {
          // Backward compatibility for old simple items
          const normalized: TechItem[] = parsed.map((item: any) => ({
            id: item.id || `${Date.now()}-${Math.random()}`,
            name: item.name || '',
            adrReason: item.adrReason || '',
            category: item.category || 'OTHER',
            title: item.title || 'Mühendislik Bileşeni',
          }))
          setTechList(normalized)
          if (normalized.length > 0 && !selectedTechId) {
            setSelectedTechId(normalized[0].id)
          }
        }
      } catch {
        console.error('Failed to parse tech stack JSON')
      }
    }
  }, [techDoc?.id, techDoc?.content])

  const saveTechList = async (list: TechItem[]) => {
    setIsSaving(true)
    const content = JSON.stringify(list)
    try {
      if (techDoc) {
        await updateDocMutation.mutateAsync({
          documentId: techDoc.id,
          request: {
            type: 'TECH_DOC',
            title: techDocTitle,
            content,
            contentFormat: 'MARKDOWN',
          },
        })
      } else {
        await addDocMutation.mutateAsync({
          projectId: project.id,
          request: {
            type: 'TECH_DOC',
            title: techDocTitle,
            content,
            contentFormat: 'MARKDOWN',
            orderIndex: 85,
          },
        })
      }
    } catch {
      toast.error('Teknoloji yığını kaydedilirken hata oluştu.')
    } finally {
      setIsSaving(false)
    }
  }

  const triggerTechAutoSave = (updated: TechItem[]) => {
    setTechList(updated)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      saveTechList(updated)
    }, 1200) // sync with debounced auto-save standards
  }

  const handleAddTech = () => {
    if (!newTechName.trim() || !newTechTitle.trim()) {
      toast.error('Lütfen teknoloji adını ve başlığını/rolünü girin.')
      return
    }

    const newItem: TechItem = {
      id: `${Date.now()}`,
      name: newTechName.trim(),
      adrReason: '',
      category: newTechCategory,
      title: newTechTitle.trim(),
    }
    const updated = [...techList, newItem]
    triggerTechAutoSave(updated)
    setSelectedTechId(newItem.id)
    setNewTechName('')
    setNewTechTitle('')
    setNewTechCategory('FRONTEND')
    toast.success(`${newItem.name} teknoloji yığınına eklendi.`)
  }

  const handleDeleteTech = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = techList.filter((t) => t.id !== id)
    triggerTechAutoSave(updated)
    if (selectedTechId === id) {
      setSelectedTechId(updated.length > 0 ? updated[0].id : null)
    }
    toast.success('Teknoloji silindi.')
  }

  const handleUpdateTechAdr = (id: string, reason: string) => {
    const updated = techList.map((t) => (t.id === id ? { ...t, adrReason: reason } : t))
    triggerTechAutoSave(updated)
  }

  const selectedTech = techList.find((t) => t.id === selectedTechId)

  // ── B) LINK HUB STATE ──────────────────────────────────────────────
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkCategory, setLinkCategory] = useState<string>('DESIGN') // DESIGN, REFERENCE, LIBRARY, TOOL
  const [linkPersonalNote, setLinkPersonalNote] = useState('')

  const phaseLinks = useMemo(() => {
    const prefix = `[PHASE_LINK:${phase.id}]`
    return links
      .filter((l) => l.notes?.startsWith(prefix))
      .map((l) => {
        const rawNote = l.notes || ''
        const personalNote = rawNote.substring(prefix.length).trim()
        return {
          id: l.id,
          title: l.title,
          url: l.url,
          category: l.category || 'OTHER',
          type: l.type,
          personalNote,
        }
      })
  }, [links, phase.id])

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkTitle.trim() || !linkUrl.trim()) return

    setIsSaving(true)
    try {
      const formattedNotes = `[PHASE_LINK:${phase.id}] ${linkPersonalNote.trim()}`
      await addLinkMutation.mutateAsync({
        projectId: project.id,
        request: {
          title: linkTitle.trim(),
          url: linkUrl.trim(),
          type: linkCategory as LinkType,
          category: 'OTHER',
          notes: formattedNotes,
        },
      })
      setLinkTitle('')
      setLinkUrl('')
      setLinkPersonalNote('')
      toast.success('Yer imi başarıyla eklendi.')
    } catch {
      toast.error('Yer imi eklenemedi.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteLink = async (id: number) => {
    try {
      await deleteLinkMutation.mutateAsync(id)
      toast.success('Yer imi silindi.')
    } catch {
      toast.error('Yer imi silinemedi.')
    }
  }

  // ── C) ENGINEERING NOTES STATE ─────────────────────────────────────
  const [engNotesContent, setEngNotesContent] = useState('')
  const engNotesDocTitle = `ENG_NOTES_PHASE_${phase.id}`
  const engNotesDoc = documents.find((d) => d.type === 'TECH_DOC' && d.title === engNotesDocTitle)

  useEffect(() => {
    if (engNotesDoc) {
      setEngNotesContent(engNotesDoc.content || '')
    }
  }, [engNotesDoc?.id, engNotesDoc?.content])

  const saveEngNotes = async (content: string) => {
    setIsSaving(true)
    try {
      if (engNotesDoc) {
        await updateDocMutation.mutateAsync({
          documentId: engNotesDoc.id,
          request: {
            type: 'TECH_DOC',
            title: engNotesDocTitle,
            content,
            contentFormat: 'MARKDOWN',
          },
        })
      } else {
        await addDocMutation.mutateAsync({
          projectId: project.id,
          request: {
            type: 'TECH_DOC',
            title: engNotesDocTitle,
            content,
            contentFormat: 'MARKDOWN',
            orderIndex: 95,
          },
        })
      }
    } catch {
      toast.error('Mühendislik notları kaydedilemedi.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEngNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setEngNotesContent(val)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      saveEngNotes(val)
    }, 1200) // sync with debounced auto-save standards
  }

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Sub Tabs Toggle */}
      <div className="flex flex-wrap gap-2.5 items-center bg-white/20 dark:bg-black/20 border border-white/10 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setSubTab('tech_stack')}
          className={cn(
            'px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer',
            subTab === 'tech_stack'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-zinc-900 dark:text-neutral-100'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
          )}
        >
          <Layers3 className="h-4 w-4" />
          Teknoloji Yığını & ADR
        </button>
        <button
          onClick={() => setSubTab('link_hub')}
          className={cn(
            'px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer',
            subTab === 'link_hub'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-zinc-900 dark:text-neutral-100'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
          )}
        >
          <Bookmark className="h-4 w-4" />
          Yer İmleri & Tasarımlar
        </button>
        <button
          onClick={() => setSubTab('eng_notes')}
          className={cn(
            'px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer',
            subTab === 'eng_notes'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-zinc-900 dark:text-neutral-100'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
          )}
        >
          <FileText className="h-4 w-4" />
          Mühendislik Notları
        </button>

        {isSaving && (
          <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 ml-4 pr-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Kaydediliyor...
          </span>
        )}
      </div>

      {/* SUB-TABS VIEWS */}
      <div className="transition-all duration-300">
        
        {/* A) TECH STACK & ADR */}
        {subTab === 'tech_stack' && (
          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/25 dark:border-black/15 shadow-sm rounded-3xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                Teknoloji Yığını & Mimari Karar Gerekçeleri (ADR)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Bu fazda kullanılan araçları ekleyin ve neden seçildiğini dökümante edin. Eklediğiniz teknolojiler otomatik olarak global panoya yansır.
              </p>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 max-w-3xl">
              <div className="sm:col-span-4">
                <Input
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                  placeholder="Teknoloji (Örn: Redis, Spring Boot)"
                  className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTech()}
                />
              </div>
              <div className="sm:col-span-4">
                <Input
                  value={newTechTitle}
                  onChange={(e) => setNewTechTitle(e.target.value)}
                  placeholder="Rolü / Başlığı (Örn: NoSQL DB, API Framework)"
                  className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTech()}
                />
              </div>
              <div className="sm:col-span-4 flex gap-2">
                <select
                  value={newTechCategory}
                  onChange={(e) => setNewTechCategory(e.target.value as TechnologyCategory)}
                  className="flex-1 bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all font-bold"
                >
                  {Object.keys(CATEGORY_LABELS).map((cat) => (
                    <option key={cat} value={cat} className="dark:bg-zinc-900">
                      {CATEGORY_LABELS[cat as TechnologyCategory]}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddTech}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-black shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Ekle
                </button>
              </div>
            </div>

            {/* Chips & Details */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
              
              {/* Chips container */}
              <div className="md:col-span-4 flex flex-wrap gap-2.5 content-start">
                {techList.map((t) => {
                  const isSelected = t.id === selectedTechId
                  const initial = t.name.charAt(0).toUpperCase()

                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTechId(t.id)}
                      className={cn(
                        'flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer group',
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500 text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-black shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                          : 'border-zinc-200 bg-zinc-50/55 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-300'
                      )}
                    >
                      <span
                        className={cn(
                          'h-5 w-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0',
                          isSelected
                            ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                            : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        )}
                      >
                        {initial}
                      </span>
                      <div className="text-left">
                        <span className="block font-bold">{t.name}</span>
                        <span className="block text-[8px] text-zinc-400 dark:text-zinc-550 group-hover:text-zinc-300">
                          {CATEGORY_LABELS[t.category] || 'Other'}
                        </span>
                      </div>
                      <span
                        onClick={(e) => handleDeleteTech(t.id, e)}
                        className={cn(
                          'p-0.5 rounded hover:bg-red-500/10 text-red-500 dark:text-red-400 cursor-pointer ml-1 opacity-0 group-hover:opacity-100 transition-opacity',
                          isSelected && 'text-white hover:bg-white/10 dark:text-black dark:hover:bg-black/10'
                        )}
                        title="Sil"
                      >
                        <Trash2 className="h-3 w-3" />
                      </span>
                    </button>
                  )
                })}

                {techList.length === 0 && (
                  <p className="text-xs text-zinc-400 italic py-4">Teknoloji yığını henüz boş.</p>
                )}
              </div>

              {/* ADR Textarea */}
              <div className="md:col-span-8">
                {selectedTech ? (
                  <div className="space-y-3 p-5 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/40 bg-zinc-50/10 dark:bg-zinc-900/10">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center justify-between">
                      <span>{selectedTech.name} — Mimari Karar Gerekçesi (ADR)</span>
                      <span className="text-[10px] text-zinc-400 font-bold lowercase italic">Otomatik kaydedilir</span>
                    </h4>
                    <Textarea
                      value={selectedTech.adrReason}
                      onChange={(e) => handleUpdateTechAdr(selectedTech.id, e.target.value)}
                      placeholder={`Neden ${selectedTech.name} teknolojisi seçildi? Teknik gerekçeler, alternatifler ve hedefler...`}
                      className="min-h-[180px] w-full bg-white/50 dark:bg-black/35 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-800 dark:text-slate-100 text-xs leading-relaxed focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all"
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-zinc-250 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center">
                    <HelpCircle className="h-9 w-9 text-zinc-300 dark:text-zinc-700 mb-2" />
                    <p className="text-xs text-zinc-400 italic">ADR yazmak için soldan bir teknoloji seçin.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* B) LINK HUB */}
        {subTab === 'link_hub' && (
          <div className="space-y-6">
            {/* Form Glass card */}
            <form
              onSubmit={handleAddLink}
              className="bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/25 dark:border-black/15 shadow-sm rounded-3xl p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
            >
              <div className="md:col-span-3">
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Başlık
                </label>
                <Input
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Örn: Spring Security Dökümantasyonu"
                  className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  URL (Adres)
                </label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://spring.io/projects/spring-security"
                  className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-850 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Kategori
                </label>
                <select
                  value={linkCategory}
                  onChange={(e) => setLinkCategory(e.target.value)}
                  className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-bold text-slate-800 dark:text-slate-250"
                >
                  <option value="DESIGN" className="dark:bg-zinc-900">Tasarım</option>
                  <option value="REFERENCE" className="dark:bg-zinc-900">Dokümantasyon</option>
                  <option value="LIBRARY" className="dark:bg-zinc-900">Kütüphane</option>
                  <option value="OTHER" className="dark:bg-zinc-900">Araç / Diğer</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Geliştirici Notu
                </label>
                <div className="flex gap-2">
                  <Input
                    value={linkPersonalNote}
                    onChange={(e) => setLinkPersonalNote(e.target.value)}
                    placeholder="Örn: Security mimarisini buradan aldık"
                    className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all flex-1"
                  />
                  <button
                    type="submit"
                    className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>

            {/* Grid of Glass Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {phaseLinks.map((l) => {
                const categoryIcons = {
                  DESIGN: Palette,
                  REFERENCE: BookOpen,
                  LIBRARY: Library,
                  OTHER: Wrench,
                }
                const CatIcon = categoryIcons[l.type as keyof typeof categoryIcons] || categoryIcons.OTHER
                const categoryLabels = {
                  DESIGN: 'Tasarım',
                  REFERENCE: 'Dökümantasyon',
                  LIBRARY: 'Kütüphane',
                  OTHER: 'Araç / Diğer',
                }

                return (
                  <div
                    key={l.id}
                    className="bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/25 dark:border-black/15 shadow-sm rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg flex flex-col justify-between min-h-[160px] relative group"
                  >
                    <button
                      onClick={() => handleDeleteLink(l.id)}
                      className="absolute right-3 top-3 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <div>
                      {/* Icon & Category */}
                      <div className="flex items-center gap-1.5">
                        <CatIcon className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
                        <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                          {categoryLabels[l.type as keyof typeof categoryLabels] || 'Diğer'}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mt-2 line-clamp-1">
                        {l.title}
                      </h4>

                      {/* Personal Notes */}
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic mt-1 line-clamp-2">
                        {l.personalNote || 'Geliştirici notu eklenmemiş.'}
                      </p>
                    </div>

                    {/* Go Link */}
                    <div className="flex justify-between items-center pt-2 mt-auto border-t border-white/5">
                      <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 truncate max-w-[200px]">
                        {l.url}
                      </span>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-black text-cyan-600 dark:text-cyan-400 hover:underline shrink-0"
                      >
                        Dışarı Git
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )
              })}

              {phaseLinks.length === 0 && (
                <div className="col-span-1 md:col-span-2 text-center py-12 border border-dashed border-zinc-200/50 dark:border-zinc-800/40 rounded-3xl bg-zinc-50/10 dark:bg-zinc-900/10">
                  <p className="text-xs text-zinc-400 italic">Yer imi henüz eklenmemiş.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* C) ENGINEERING NOTES */}
        {subTab === 'eng_notes' && (
          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/25 dark:border-black/15 shadow-sm rounded-3xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                Mühendislik Notları & Taslak Defteri
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Faz geneline ait serbest kod blokları, mimari algoritmalar ve matematiksel formüller. (Markdown, otomatik kaydedilir)
              </p>
            </div>

            <Textarea
              value={engNotesContent}
              onChange={handleEngNotesChange}
              placeholder={`### Mühendislik Notları
 
- Algoritma Tasarımları:
  1. Adım X...
  2. Adım Y...

\`\`\`typescript
// Örnek Kod Bloğu
const calculateMetrics = (data) => {
  return data.map(...);
}
\`\`\``}
              className="min-h-[400px] w-full bg-white/50 dark:bg-black/35 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-850 dark:text-slate-100 text-xs font-mono leading-relaxed focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all"
            />
          </div>
        )}

      </div>
    </div>
  )
}
