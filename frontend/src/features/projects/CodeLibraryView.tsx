import React, { useState, useMemo } from 'react'
import { FileCode, Plus, Copy, Check } from 'lucide-react'
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
import { Select } from '../../components/ui/Select'

interface CodeLibraryViewProps {
  project: Project
}


const CATEGORY_OPTIONS = [
  { label: 'Frontend', value: 'FRONTEND' as SnippetCategory, badgeClass: 'bg-blue-100/60 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/20' },
  { label: 'Backend', value: 'BACKEND' as SnippetCategory, badgeClass: 'bg-purple-100/60 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/20' },
  { label: 'Veritabanı', value: 'DATABASE' as SnippetCategory, badgeClass: 'bg-amber-100/60 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/20' },
  { label: 'Diğer', value: 'OTHER' as SnippetCategory, badgeClass: 'bg-slate-100/70 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border border-slate-200/30' },
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
  const [isFormCodeCopied, setIsFormCodeCopied] = useState(false)


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
      toast.error('Kod parçacığı silinirken hata oluştu.')
    }
  }

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
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1.5">
                Kategori
              </label>
              <Select
                value={category}
                onChange={(val) => setCategory(val as SnippetCategory)}
                options={CATEGORY_OPTIONS}
              />
            </div>

            {/* Language Girdisi */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
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
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
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
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
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
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
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
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
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
