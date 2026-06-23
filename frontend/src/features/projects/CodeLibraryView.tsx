import React, { useState, useMemo, useRef, useEffect } from 'react'
import { FileCode, Plus, Copy, Check, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import {
  Project,
  SnippetCategory,
  useProjectSnippets,
  useAddProjectSnippet,
  useDeleteProjectSnippet,
} from '../../api/projects'
import { SnippetCard } from './SnippetCard'
import { cn } from '../../lib/utils'

interface CodeLibraryViewProps {
  project: Project
}


const CATEGORY_OPTIONS = [
  { label: 'Frontend', value: 'FRONTEND' as SnippetCategory },
  { label: 'Backend', value: 'BACKEND' as SnippetCategory },
  { label: 'Diğer', value: 'OTHER' as SnippetCategory },
]

export const CodeLibraryView: React.FC<CodeLibraryViewProps> = ({ project }) => {
  const { data: snippets = [], isLoading } = useProjectSnippets(project.id)
  const addSnippetMutation = useAddProjectSnippet()
  const deleteSnippetMutation = useDeleteProjectSnippet(project.id)

  // Local Form states
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('')
  const [category, setCategory] = useState<SnippetCategory>('BACKEND')
  const [description, setDescription] = useState('')
  const [referenceUrl, setReferenceUrl] = useState('')
  const [code, setCode] = useState('')

  const [isAdding, setIsAdding] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isFormCodeCopied, setIsFormCodeCopied] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCopyFormCode = () => {
    if (!code) return
    navigator.clipboard.writeText(code)
    setIsFormCodeCopied(true)
    toast.success('Editördeki kod kopyalandı!')
    setTimeout(() => setIsFormCodeCopied(false), 2000)
  }

  const handleCreateSnippet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !code.trim() || isAdding) return
    setIsAdding(true)

    // Encode description and optional reference url as JSON string
    const finalDescription = referenceUrl.trim()
      ? JSON.stringify({ description: description.trim(), referenceUrl: referenceUrl.trim() })
      : description.trim()

    try {
      await addSnippetMutation.mutateAsync({
        projectId: project.id,
        request: {
          title: title.trim(),
          language: language.trim() || 'plain',
          code: code.trim(),
          category,
          description: finalDescription,
        },
      })
      setTitle('')
      setLanguage('')
      setDescription('')
      setReferenceUrl('')
      setCode('')
      toast.success('Kod parçacığı başarıyla eklendi.')
    } catch {
      toast.error('Kod parçacığı eklenirken hata oluştu.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteSnippet = async (id: number) => {
    try {
      await deleteSnippetMutation.mutateAsync(id)
      toast.success('Kod parçacığı silindi.')
    } catch {
      toast.error('Silinemedi.')
    }
  }

  const selectedCategoryLabel = CATEGORY_OPTIONS.find((o) => o.value === category)?.label || 'Backend'

  const isDevOpsLang = useMemo(() => {
    const lang = (language || '').toLowerCase().trim()
    return ['docker', 'dockerfile', 'bash', 'shell', 'sh', 'yaml', 'yml', 'kubernetes', 'k8s'].includes(lang)
  }, [language])

  const ideTextColorClass = isDevOpsLang ? 'text-emerald-400' : 'text-cyan-400'

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ── SNIPPET FORM PANEL (Glassmorphic) ────────────────────────── */}
      <section className="bg-white/70 dark:bg-black/30 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md">
        <h3 className="text-sm font-black text-slate-950 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileCode className="h-4.5 w-4.5 text-cyan-500 animate-pulse" />
          Kütüphaneye Kod Ekle
        </h3>

        <form onSubmit={handleCreateSnippet} className="space-y-4">
          
          {/* Top Row Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Custom Category Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                Kategori
              </label>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 w-full flex items-center justify-between text-slate-950 dark:text-slate-100 text-xs font-bold transition-all hover:bg-white/75 dark:hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <span>{selectedCategoryLabel}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-slate-500 transition-transform duration-200',
                    isDropdownOpen && 'transform rotate-180'
                  )}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-50 mt-2 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {CATEGORY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setCategory(opt.value)
                        setIsDropdownOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded-lg transition-colors cursor-pointer',
                        category === opt.value
                          ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-black'
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-white/5 font-semibold'
                      )}
                    >
                      <span>{opt.label}</span>
                      {category === opt.value && <Check className="h-3.5 w-3.5 text-cyan-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Girdisi */}
            <div>
              <label className="block text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                Programlama Dili / Teknoloji
              </label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="Örn: React, Docker, SQL"
                className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all font-semibold"
                required
              />
            </div>

            {/* Başlık Girdisi */}
            <div>
              <label className="block text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                Snippet Başlığı
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Axios JWT Interceptor"
                className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all font-semibold"
                required
              />
            </div>
          </div>

          {/* Description & Reference URL Girdileri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                Açıklama
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kod parçacığı ne amaçla kullanılıyor..."
                className="w-full h-10 min-h-[40px] bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all resize-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                Referans / Repo URL (Opsiyonel)
              </label>
              <input
                type="text"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder="Örn: https://github.com/..."
                className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all font-semibold"
              />
            </div>
          </div>

          {/* IDE Textarea Simulator */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest">
              Kod Editörü
            </label>
            <div className="bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 font-mono text-sm relative">
              {/* Form Copy Button */}
              {code.trim() && (
                <button
                  type="button"
                  onClick={handleCopyFormCode}
                  className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer text-[10px] font-bold shadow-sm"
                  title="Kodu Kopyala"
                >
                  {isFormCodeCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400 animate-bounce" />
                      <span className="text-emerald-400">Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Kopyala</span>
                    </>
                  )}
                </button>
              )}

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Buraya kodu yapıştırın..."
                className={cn(
                  "bg-transparent border-0 outline-none w-full min-h-[160px] resize-y font-mono text-xs leading-relaxed focus:ring-0 focus:outline-none",
                  ideTextColorClass
                )}
                required
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isAdding || !title.trim() || !code.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-black shadow-md shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Snippet Ekle
            </button>
          </div>
        </form>
      </section>

      {/* ── SNIPPET CARDS LIST GRID ─────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider px-1">
          Kod Kütüphanesi ({snippets.length})
        </h3>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <span className="text-xs text-zinc-400 italic">Yükleniyor...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {snippets.map((snip) => (
              <SnippetCard
                key={snip.id}
                snippet={snip}
                onDelete={handleDeleteSnippet}
              />
            ))}

            {snippets.length === 0 && (
              <div className="col-span-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                <FileCode className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                <span className="text-xs text-zinc-400 italic">
                  Henüz bir kod parçacığı eklenmemiş. Yukarıdan kütüphaneyi doldurabilirsiniz.
                </span>
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  )
}
