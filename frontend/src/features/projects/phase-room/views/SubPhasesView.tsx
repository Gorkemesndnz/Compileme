import React, { useEffect, useState, useMemo, useRef } from 'react'
import {
  Plus,
  Trash2,
  Check,
  Loader2,
  FileText,
  ListChecks,
  Code,
  Link as LinkIcon,
  GitBranch,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Project,
  ProjectPhase,
  DocumentType,
  DocumentFormat,
  useProjectDocuments,
  useAddProjectDocument,
  useUpdateProjectDocument,
  useDeleteProjectDocument,
  useProjectSnippets,
  useAddProjectSnippet,
  useDeleteProjectSnippet,
  useProjectLinks,
  useAddProjectLink,
  useDeleteProjectLink,
} from '../../../../api/projects'
import {
  useTasks,
  useCreateTask,
  useToggleTaskComplete,
  useDeleteTask,
} from '../../../../api/tasks'
import { Input } from '../../../../components/ui/Input'
import { Textarea } from '../../../../components/ui/Textarea'
import { cn } from '../../../../lib/utils'
import { SketchButton } from '../../../../components/ui/SketchButton'
import { Select } from '../../../../components/ui/Select'

const SUB_PREFIX = (phaseId: number) => `[PHASE:${phaseId}:SUB:`
const SUB_REGEX = /^\[PHASE:(\d+):SUB:(\d+)(?::STATUS:(\w+))?\]\s*(.*)$/
const SUB_PHASE_STATUSES = ['PLANNING', 'DEVELOPMENT', 'TEST', 'COMPLETED'] as const
type SubPhaseStatus = (typeof SUB_PHASE_STATUSES)[number]

const STATUS_OPTIONS = [
  { label: 'Planlama', value: 'PLANNING', badgeClass: 'bg-amber-100/60 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/20' },
  { label: 'Geliştirme', value: 'DEVELOPMENT', badgeClass: 'bg-sky-100/60 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border border-sky-200/20' },
  { label: 'Test', value: 'TEST', badgeClass: 'bg-purple-100/60 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/20' },
  { label: 'Tamamlandı', value: 'COMPLETED', badgeClass: 'bg-emerald-100/60 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/20' },
]

const STATUS_COLORS: Record<SubPhaseStatus, string> = {
  PLANNING: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]',
  DEVELOPMENT: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]',
  TEST: 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.7)]',
  COMPLETED: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]',
}

function normalizeSubPhaseStatus(status?: string): SubPhaseStatus {
  return SUB_PHASE_STATUSES.includes(status as SubPhaseStatus)
    ? (status as SubPhaseStatus)
    : 'PLANNING'
}

function encodeSubTitle(phaseId: number, subIndex: number, label: string, status: string = 'PLANNING') {
  return `[PHASE:${phaseId}:SUB:${subIndex}:STATUS:${status}] ${label}`
}

function decodeSubTitle(
  title: string
): { phaseId: number; subIndex: number; status: SubPhaseStatus; label: string } | null {
  const match = title.match(SUB_REGEX)
  if (!match) return null
  return {
    phaseId: parseInt(match[1], 10),
    subIndex: parseInt(match[2], 10),
    status: normalizeSubPhaseStatus(match[3]),
    label: match[4],
  }
}

interface SubPhasesViewProps {
  project: Project
  phase: ProjectPhase
  phaseIndex: number
}

export const SubPhasesView: React.FC<SubPhasesViewProps> = ({
  project,
  phase,
  phaseIndex,
}) => {
  // ── API DATA FETCHING ──────────────────────────────────────────────
  const { data: documents = [] } = useProjectDocuments(project.id)
  const addDocMutation = useAddProjectDocument()
  const updateDocMutation = useUpdateProjectDocument()
  const deleteDocMutation = useDeleteProjectDocument(project.id)

  const { data: tasks = [] } = useTasks({ projectId: project.id })
  const createTaskMutation = useCreateTask()
  const toggleTaskMutation = useToggleTaskComplete()
  const deleteTaskMutation = useDeleteTask()

  const { data: snippets = [] } = useProjectSnippets(project.id)
  const addSnippetMutation = useAddProjectSnippet()
  const deleteSnippetMutation = useDeleteProjectSnippet(project.id)

  const { data: links = [] } = useProjectLinks(project.id)
  const addLinkMutation = useAddProjectLink()
  const deleteLinkMutation = useDeleteProjectLink(project.id)

  // ── SUB-PHASES TREE SIMULATION ─────────────────────────────────────
  const subPhases = useMemo(() => {
    const prefix = SUB_PREFIX(phase.id)
    return documents
      .filter((d) => d.title && d.title.startsWith(prefix))
      .map((d) => {
        const decoded = decodeSubTitle(d.title)
        return decoded
          ? {
              docId: d.id,
              subIndex: decoded.subIndex,
              status: decoded.status,
              label: decoded.label,
              content: d.content || '',
            }
          : null
      })
      .filter(Boolean)
      .sort((a, b) => a!.subIndex - b!.subIndex) as {
      docId: number
      subIndex: number
      status: SubPhaseStatus
      label: string
      content: string
    }[]
  }, [documents, phase.id])

  // ── LOCAL STATES ───────────────────────────────────────────────────
  const [selectedSubDocId, setSelectedSubDocId] = useState<number | null>(null)
  const [newSubPhaseName, setNewSubPhaseName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  // Selected sub-phase detail state
  const selectedSub = subPhases.find((sp) => sp.docId === selectedSubDocId)
  const [localContent, setLocalContent] = useState('')
  const [localLabel, setLocalLabel] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Sync selected detail fields
  useEffect(() => {
    if (selectedSub) {
      setLocalContent(selectedSub.content)
      setLocalLabel(selectedSub.label)
      setSaveStatus('idle')
    } else {
      setLocalContent('')
      setLocalLabel('')
      setSaveStatus('idle')
    }
  }, [selectedSub?.docId])

  // Keep selection valid for the current phase and optional URL subPhaseId.
  useEffect(() => {
    const urlSubPhaseId = new URLSearchParams(window.location.search).get('subPhaseId')
    const parsedUrlSubPhaseId = urlSubPhaseId ? parseInt(urlSubPhaseId, 10) : NaN
    const urlSubPhase = subPhases.find((sp) => sp.docId === parsedUrlSubPhaseId)

    if (urlSubPhase) {
      if (selectedSubDocId !== urlSubPhase.docId) {
        setSelectedSubDocId(urlSubPhase.docId)
      }
      return
    }

    const selectedStillExists = subPhases.some((sp) => sp.docId === selectedSubDocId)
    if (!selectedStillExists) {
      setSelectedSubDocId(subPhases[0]?.docId ?? null)
    }
  }, [subPhases, selectedSubDocId])

  // ── SUB-PHASE ACTIONS ──────────────────────────────────────────────
  const handleAddSubPhase = async () => {
    if (!newSubPhaseName.trim() || isAdding) return
    setIsAdding(true)

    const nextIndex =
      subPhases.length > 0 ? Math.max(...subPhases.map((sp) => sp.subIndex)) + 1 : 1

    try {
      const title = encodeSubTitle(phase.id, nextIndex, newSubPhaseName.trim())
      const doc = await addDocMutation.mutateAsync({
        projectId: project.id,
        request: {
          type: 'TECH_DOC',
          title,
          content: '',
          contentFormat: 'MARKDOWN',
          orderIndex: documents.length,
        },
      })
      setNewSubPhaseName('')
      setSelectedSubDocId(doc.id)
      toast.success(`Alt faz "Faz ${phaseIndex + 1}.${nextIndex}" oluşturuldu.`)
    } catch {
      toast.error('Alt faz oluşturulurken hata oluştu.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteSubPhase = async (docId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteDocMutation.mutateAsync(docId)
      toast.success('Alt faz silindi.')
      if (selectedSubDocId === docId) {
        setSelectedSubDocId(subPhases.find((sp) => sp.docId !== docId)?.docId ?? null)
      }
    } catch {
      toast.error('Alt faz silinemedi.')
    }
  }

  const handleUpdateSubPhaseStatus = async (newStatus: string) => {
    if (!selectedSubDocId || !selectedSub) return
    const status = normalizeSubPhaseStatus(newStatus)
    setSaveStatus('saving')
    try {
      await updateDocMutation.mutateAsync({
        documentId: selectedSubDocId,
        request: {
          type: 'TECH_DOC',
          title: encodeSubTitle(phase.id, selectedSub.subIndex, localLabel, status),
          content: localContent,
          contentFormat: 'MARKDOWN',
        },
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1500)
    } catch {
      setSaveStatus('error')
      toast.error('Alt faz durumu güncellenemedi.')
    }
  }

  // ── AUTOSAVE DEBOUNCE ──────────────────────────────────────────────
  const triggerAutoSave = (content: string, label: string) => {
    if (!selectedSubDocId || !selectedSub) return
    setSaveStatus('idle')

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        // 1. Update the sub-phase document itself
        await updateDocMutation.mutateAsync({
          documentId: selectedSubDocId,
          request: {
            type: 'TECH_DOC',
            title: encodeSubTitle(phase.id, selectedSub.subIndex, label, selectedSub.status),
            content,
            contentFormat: 'MARKDOWN',
          },
        })

        // 2. Automatically sync to DOC_SUBPHASE_${selectedSubDocId} with meta comments
        const subPhaseDocTitle = `DOC_SUBPHASE_${selectedSubDocId}`
        const existingSubPhaseDoc = documents.find((d) => d.title === subPhaseDocTitle)
        
        const metadata = {
          phaseId: phase.id,
          subPhaseId: selectedSubDocId,
          subIndex: selectedSub.subIndex,
          phaseIndex: phaseIndex,
        }
        const richContent = `<!-- CM_METADATA: ${JSON.stringify(metadata)} -->\n${content}`

        if (existingSubPhaseDoc) {
          await updateDocMutation.mutateAsync({
            documentId: existingSubPhaseDoc.id,
            request: {
              type: 'TECH_DOC',
              title: subPhaseDocTitle,
              content: richContent,
              contentFormat: 'MARKDOWN',
            },
          })
        } else {
          await addDocMutation.mutateAsync({
            projectId: project.id,
            request: {
              type: 'TECH_DOC',
              title: subPhaseDocTitle,
              content: richContent,
              contentFormat: 'MARKDOWN',
              orderIndex: documents.length,
            },
          })
        }

        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 1500)
      } catch {
        setSaveStatus('error')
        toast.error('Alt faz kaydedilemedi.')
      }
    }, 1200) // Debounce autosave to 1200ms
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setLocalContent(val)
    triggerAutoSave(val, localLabel)
  }

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocalLabel(val)
    triggerAutoSave(localContent, val)
  }

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  // ── MICRO MODULES (Associated with selectedSubDocId) ───────────────
  
  // 1. Alt Faz Görevleri (Checklist - [SUB_PHASE:{id}] filtered)
  const subTasks = useMemo(() => {
    if (!selectedSubDocId) return []
    const prefix = `[SUB_PHASE:${selectedSubDocId}]`
    return tasks.filter((t) => t.phaseId === phase.id && t.notes?.startsWith(prefix))
  }, [tasks, phase.id, selectedSubDocId])

  const [newTaskTitle, setNewTaskTitle] = useState('')

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim() || !selectedSubDocId) return

    try {
      await createTaskMutation.mutateAsync({
        title: newTaskTitle.trim(),
        status: 'TODO',
        kind: 'PROJECT',
        projectId: project.id,
        phaseId: phase.id,
        notes: `[SUB_PHASE:${selectedSubDocId}] Alt faz görevi`,
        planningBucket: 'UNSCHEDULED',
      })
      setNewTaskTitle('')
      toast.success('Alt faz görevi eklendi.')
    } catch {
      toast.error('Görev eklenemedi.')
    }
  }

  // 2. Alt Faz Kod & Kaynaklar ([SUB_PHASE:{id}] filtered for consistency)
  const subSnippets = useMemo(() => {
    if (!selectedSubDocId) return []
    const prefix = `[SUB_PHASE:${selectedSubDocId}]`
    return snippets.filter((s) => s.description?.startsWith(prefix))
  }, [snippets, selectedSubDocId])

  const subLinks = useMemo(() => {
    if (!selectedSubDocId) return []
    const prefix = `[SUB_PHASE:${selectedSubDocId}]`
    return links.filter((l) => l.notes?.startsWith(prefix))
  }, [links, selectedSubDocId])

  const [snippetTitle, setSnippetTitle] = useState('')
  const [snippetLang, setSnippetLang] = useState('javascript')
  const [snippetCode, setSnippetCode] = useState('')
  const [isAddingCode, setIsAddingCode] = useState(false)

  const handleAddSnippet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!snippetTitle.trim() || !snippetCode.trim() || !selectedSubDocId) return

    try {
      await addSnippetMutation.mutateAsync({
        projectId: project.id,
        request: {
          title: snippetTitle.trim(),
          language: snippetLang,
          code: snippetCode.trim(),
          category: 'OTHER',
          description: `[SUB_PHASE:${selectedSubDocId}] Alt faz kod parçası`,
        },
      })
      setSnippetTitle('')
      setSnippetCode('')
      setIsAddingCode(false)
      toast.success('Kod parçacığı eklendi.')
    } catch {
      toast.error('Kod parçacığı eklenemedi.')
    }
  }

  const [linkLabel, setLinkLabel] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [isAddingLink, setIsAddingLink] = useState(false)

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkLabel.trim() || !linkUrl.trim() || !selectedSubDocId) return

    try {
      await addLinkMutation.mutateAsync({
        projectId: project.id,
        request: {
          title: linkLabel.trim(),
          url: linkUrl.trim(),
          type: 'REFERENCE',
          notes: `[SUB_PHASE:${selectedSubDocId}] Alt faz yer imi`,
        },
      })
      setLinkLabel('')
      setLinkUrl('')
      setIsAddingLink(false)
      toast.success('Kaynak linki eklendi.')
    } catch {
      toast.error('Kaynak eklenemedi.')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Panel: Sub-Phase Roadmap */}
      <section className="lg:col-span-4 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/25 dark:border-black/15 shadow-sm rounded-3xl p-5 flex flex-col h-[750px]">
        <div className="space-y-1.5 mb-4">
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <GitBranch className="h-4.5 w-4.5 text-cyan-500" />
            Alt Fazlar & Yol Haritası
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Dikey ağaç yapısında sıralı alt faz planı.
          </p>
        </div>

        {/* Add sub-phase Form */}
        <div className="flex gap-2 mb-4">
          <Input
            value={newSubPhaseName}
            onChange={(e) => setNewSubPhaseName(e.target.value)}
            placeholder="Örn: Auth Entegrasyonu"
            className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubPhase()}
          />
          <button
            onClick={handleAddSubPhase}
            disabled={isAdding || !newSubPhaseName.trim()}
            className="px-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>

        {/* List of sub-phases */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin">
          {subPhases.map((sp) => {
            const isSelected = selectedSubDocId === sp.docId
            const status = normalizeSubPhaseStatus(sp.status)

            return (
              <div
                key={sp.docId}
                onClick={() => setSelectedSubDocId(sp.docId)}
                className={cn(
                  'p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group',
                  isSelected
                    ? 'border-cyan-500 bg-cyan-50/10 dark:border-cyan-500/40 dark:bg-cyan-950/20 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                    : 'border-zinc-200/50 bg-zinc-50/20 dark:border-zinc-800/40 dark:bg-zinc-900/10 hover:bg-zinc-50 dark:hover:bg-zinc-900/20'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg shrink-0">
                    Faz {phaseIndex + 1}.{sp.subIndex}
                  </span>
                  
                  {/* C) Status Dot */}
                  <span
                    className={cn('h-2 w-2 rounded-full shrink-0', STATUS_COLORS[status])}
                    title={
                      status === 'DEVELOPMENT'
                        ? 'Geliştirme'
                        : status === 'TEST'
                        ? 'Test'
                        : status === 'COMPLETED'
                        ? 'Tamamlandı'
                        : 'Planlama'
                    }
                  />

                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {sp.label}
                  </span>
                </div>
                
                <SketchButton
                  tone="destructive"
                  onClick={(e) => handleDeleteSubPhase(sp.docId, e)}
                  className="h-7 w-7 p-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  title="Alt Fazı Sil"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </SketchButton>
              </div>
            )
          })}

          {subPhases.length === 0 && (
            <div className="text-center py-12 border border-dashed border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl">
              <p className="text-xs text-zinc-400 italic">Henüz alt faz eklenmemiş.</p>
            </div>
          )}
        </div>
      </section>

      {/* Right Panel: Selected Sub-phase Control Room */}
      <section className="lg:col-span-8 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/25 dark:border-black/15 shadow-sm rounded-3xl p-6 h-[750px] flex flex-col overflow-y-auto scrollbar-thin">
        {selectedSub ? (
          <div className="space-y-6">
            {/* A) Minimalist Breadcrumb Navigasyonu */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold mb-1">
              <span>Projeler</span>
              <span>/</span>
              <span>{project.name}</span>
              <span>/</span>
              <span>{phase.name}</span>
              <span>/</span>
              <span className="text-cyan-600 dark:text-cyan-400">Faz {phaseIndex + 1}.{selectedSub.subIndex}</span>
            </div>

            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-150 dark:border-zinc-900">
              <div className="flex-1 mr-4">
                <input
                  value={localLabel}
                  onChange={handleLabelChange}
                  className="text-base font-black text-slate-800 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-cyan-500 focus:outline-none w-full transition-all py-0.5"
                  placeholder="Alt Faz Başlığı"
                />
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-wider">
                    Alt Modül - Faz {phaseIndex + 1}.{selectedSub.subIndex}
                  </span>

                  <Select
                    value={selectedSub.status || 'PLANNING'}
                    onChange={(val) => handleUpdateSubPhaseStatus(val)}
                    options={STATUS_OPTIONS}
                    className="max-w-[140px]"
                    triggerClassName="py-0.5 min-h-[28px] rounded-lg text-[10px]"
                  />
                </div>
              </div>

              {/* Save Indicator */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                    <span className="text-amber-500 font-bold">Kaydediliyor...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-bold">Kaydedildi</span>
                  </>
                )}
                {saveStatus === 'idle' && (
                  <>
                    <Check className="h-3.5 w-3.5 text-zinc-450" />
                    <span className="text-zinc-450 font-bold">Kaydedildi</span>
                  </>
                )}
              </div>
            </div>

            {/* Markdown Rich Text Note area */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Mühendislik Notları & Yol Haritası (Markdown)
              </label>
              <Textarea
                value={localContent}
                onChange={handleNotesChange}
                placeholder="Örn: Bu alt fazda yapılacak entegrasyonun adımları, veri akış şemaları ve mimari kararlar..."
                className="min-h-[180px] w-full bg-white/50 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-850 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all"
              />
            </div>

            {/* Micro Modules: Split Task list vs Code Snippets & Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Checklist Panel */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-cyan-500" />
                  [Alt Faz Görevleri]
                </h4>

                {/* Add task form */}
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Hızlı görev ekle..."
                    className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 text-[11px] focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className="px-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-black transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    Ekle
                  </button>
                </form>

                {/* Checklist */}
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {subTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-250/30 dark:border-zinc-800/30 text-[11px] group"
                    >
                      <label className="flex items-center gap-2 cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          checked={t.status === 'DONE'}
                          onChange={() => toggleTaskMutation.mutate(t.id)}
                          className="accent-cyan-500 h-3.5 w-3.5 shrink-0"
                        />
                        <span
                          className={cn(
                            'font-bold text-slate-800 dark:text-slate-350 truncate',
                            t.status === 'DONE' && 'line-through text-zinc-400 dark:text-zinc-500'
                          )}
                        >
                          {t.title}
                        </span>
                      </label>
                      <SketchButton
                        tone="destructive"
                        onClick={() => deleteTaskMutation.mutate(t.id)}
                        className="h-6 w-6 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        title="Görevi Sil"
                      >
                        <Trash2 className="h-3 w-3" />
                      </SketchButton>
                    </div>
                  ))}

                  {subTasks.length === 0 && (
                    <p className="text-[10px] text-zinc-400 italic text-center py-4">Görev eklenmemiş.</p>
                  )}
                </div>
              </div>

              {/* Code & Links Panel */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Code className="h-4 w-4 text-cyan-500" />
                  [Alt Faz Kod & Kaynaklar]
                </h4>

                <div className="space-y-3.5">
                  {/* Snippets Area */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Kod Parçacıkları ({subSnippets.length})
                      </span>
                      <button
                        onClick={() => setIsAddingCode(!isAddingCode)}
                        className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                      >
                        {isAddingCode ? 'İptal' : '+ Kod Ekle'}
                      </button>
                    </div>

                    {isAddingCode && (
                      <form onSubmit={handleAddSnippet} className="p-2.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/30 space-y-2">
                        <Input
                          value={snippetTitle}
                          onChange={(e) => setSnippetTitle(e.target.value)}
                          placeholder="Başlık"
                          className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-850 dark:text-slate-100 text-[10px] focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all"
                          required
                        />
                        <div className="flex gap-2">
                          <Input
                            value={snippetLang}
                            onChange={(e) => setSnippetLang(e.target.value)}
                            placeholder="Dil (örn: typescript, java)"
                            className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-850 dark:text-slate-100 text-[10px] focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all flex-1"
                          />
                          <button
                            type="submit"
                            className="px-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-[10px] font-black cursor-pointer"
                          >
                            Kaydet
                          </button>
                        </div>
                        <Textarea
                          value={snippetCode}
                          onChange={(e) => setSnippetCode(e.target.value)}
                          placeholder="Kod..."
                          className="min-h-[70px] w-full bg-white/50 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-xl p-2 font-mono text-[10px] focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all"
                          required
                        />
                      </form>
                    )}

                    {/* Snippet List */}
                    <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                      {subSnippets.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-250/30 dark:border-zinc-800/30 text-[10px] group"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                              {s.title}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-mono block mt-0.5">{s.language || 'text'}</span>
                          </div>
                          <SketchButton
                            tone="destructive"
                            onClick={() => deleteSnippetMutation.mutate(s.id)}
                            className="h-6 w-6 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            title="Kod Parçasını Sil"
                          >
                            <Trash2 className="h-3 w-3" />
                          </SketchButton>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Links Area */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Kaynak Linkleri ({subLinks.length})
                      </span>
                      <button
                        onClick={() => setIsAddingLink(!isAddingLink)}
                        className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                      >
                        {isAddingLink ? 'İptal' : '+ Link Ekle'}
                      </button>
                    </div>

                    {isAddingLink && (
                      <form onSubmit={handleAddLink} className="p-2.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/30 space-y-2">
                        <Input
                          value={linkLabel}
                          onChange={(e) => setLinkLabel(e.target.value)}
                          placeholder="Başlık"
                          className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-850 dark:text-slate-100 text-[10px] focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all"
                          required
                        />
                        <div className="flex gap-2">
                          <Input
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="URL (https://...)"
                            className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-850 dark:text-slate-100 text-[10px] focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all flex-1"
                            required
                          />
                          <button
                            type="submit"
                            className="px-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-[10px] font-black cursor-pointer"
                          >
                            Ekle
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Links List */}
                    <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                      {subLinks.map((l) => (
                        <div
                          key={l.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-250/30 dark:border-zinc-800/30 text-[10px] group"
                        >
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline truncate mr-2 flex items-center gap-1 min-w-0"
                          >
                            <LinkIcon className="h-3 w-3 shrink-0" />
                            <span className="truncate">{l.title}</span>
                          </a>
                          <SketchButton
                            tone="destructive"
                            onClick={() => deleteLinkMutation.mutate(l.id)}
                            className="h-6 w-6 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            title="Kaynak Linkini Sil"
                          >
                            <Trash2 className="h-3 w-3" />
                          </SketchButton>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <FileText className="h-10 w-10 text-zinc-305 dark:text-zinc-705 mb-3 animate-pulse" />
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
              Seçili Alt Faz Yok
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 font-medium">
              Hiyerarşik yol haritası notlarını, görevlerini ve kod parçalarını düzenlemek için soldan bir alt faz seçin veya yeni bir tane oluşturun.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
