import React, { useState, useMemo } from 'react'
import { FileText, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import {
  Project,
  DocumentType,
  useProjectDocuments,
  useAddProjectDocument,
  useDeleteProjectDocument,
} from '../../api/projects'
import { DocumentsSelector } from './DocumentsSelector'
import { DocCards } from './DocCards'

interface DocumentsViewProps {
  project: Project
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ project }) => {
  const { data: documents = [], isLoading } = useProjectDocuments(project.id)
  const addDocMutation = useAddProjectDocument()
  const deleteDocMutation = useDeleteProjectDocument(project.id)

  // Local Form states
  const [title, setTitle] = useState('')
  const [uiType, setUiType] = useState<DocumentType>('TECH_DOC')
  const [content, setContent] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  // Filtering out internal database schemas
  const filteredDocuments = useMemo(() => {
    return documents.filter((d) => {
      return d.title && !d.title.startsWith('DB_SCHEMA_')
    })
  }, [documents])

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isAdding) return
    setIsAdding(true)

    try {
      await addDocMutation.mutateAsync({
        projectId: project.id,
        request: {
          type: uiType,
          title: title.trim(),
          content: content.trim(),
          contentFormat: 'MARKDOWN',
          orderIndex: documents.length,
        },
      })
      setTitle('')
      setContent('')
      toast.success('Döküman başarıyla oluşturuldu.')
    } catch {
      toast.error('Döküman oluşturulurken bir hata oluştu.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteDocument = async (docId: number) => {
    try {
      await deleteDocMutation.mutateAsync(docId)
      toast.success('Döküman başarıyla silindi.')
    } catch {
      toast.error('Döküman silinemedi.')
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ── ÜST EKLEME FORMU (Glassmorphic) ─────────────────────────── */}
      <section className="bg-white/60 dark:bg-black/30 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-md">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText className="h-4.5 w-4.5 text-cyan-500" />
          Yeni Doküman Oluştur
        </h3>
        
        <form onSubmit={handleCreateDocument} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Title Input */}
            <div className="md:col-span-8">
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1.5">
                Doküman Başlığı
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Microservices Geçiş Planı"
                className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-950 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all"
                required
              />
            </div>

            {/* Custom Dropdown Selector */}
            <div className="md:col-span-4">
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1.5">
                Doküman Türü
              </label>
              <DocumentsSelector
                value={uiType}
                onChange={(val) => setUiType(val)}
              />
            </div>
          </div>

          {/* Content Textarea */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest">
              Markdown İçerik
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Proje Mimarisi&#10;&#10;Buraya döküman içeriğini yazabilirsiniz (Markdown formatı desteklenir)..."
              className="min-h-[140px] w-full bg-white/50 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-950 dark:text-slate-100 text-xs font-mono leading-relaxed focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all"
            />
          </div>

          {/* Action button */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isAdding || !title.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-black shadow-md shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Doküman Ekle
            </button>
          </div>
        </form>
      </section>

      {/* ── DOKÜMAN KARTLARI IZGARASI ────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider px-1">
          Doküman Arşivi ({filteredDocuments.length})
        </h3>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <span className="text-xs text-zinc-400 italic">Yükleniyor...</span>
          </div>
        ) : (
          <DocCards
            documents={filteredDocuments}
            projectId={project.id}
            onDelete={handleDeleteDocument}
          />
        )}
      </section>

    </div>
  )
}
