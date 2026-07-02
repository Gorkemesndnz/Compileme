import React, { useEffect, useState, useRef } from 'react'
import { Database, FileText, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PhaseSchemaTab } from '../PhaseSchemaTab'
import {
  Project,
  ProjectPhase,
  useProjectDocuments,
  useAddProjectDocument,
  useUpdateProjectDocument,
} from '../../../../api/projects'
import { Textarea } from '../../../../components/ui/Textarea'
import { cn } from '../../../../lib/utils'

interface DbSchemaViewProps {
  project: Project
  phase: ProjectPhase
}

export const DbSchemaView: React.FC<DbSchemaViewProps> = ({ project, phase }) => {
  const [subView, setSubView] = useState<'diagram' | 'notes'>('diagram')
  const [notesContent, setNotesContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const debounceTimerRef = useRef<any | null>(null)

  // Fetch documents for the project
  const { data: documents = [] } = useProjectDocuments(project.id)
  const addDocMutation = useAddProjectDocument()
  const updateDocMutation = useUpdateProjectDocument()

  const docTitle = `DB_SCHEMA_NOTES_PHASE_${phase.id}`
  const notesDoc = documents.find((doc) => doc.type === 'DB_SCHEMA' && doc.title === docTitle)

  // Sync state with fetched document
  useEffect(() => {
    if (notesDoc) {
      setNotesContent(notesDoc.content || '')
    }
  }, [notesDoc?.id, notesDoc?.content])

  // Handle note saving
  const saveNotes = async (content: string) => {
    setIsSaving(true)
    try {
      if (notesDoc) {
        await updateDocMutation.mutateAsync({
          documentId: notesDoc.id,
          request: {
            type: 'DB_SCHEMA',
            title: docTitle,
            content,
            contentFormat: 'MARKDOWN',
          },
        })
      } else {
        await addDocMutation.mutateAsync({
          projectId: project.id,
          request: {
            type: 'DB_SCHEMA',
            title: docTitle,
            content,
            contentFormat: 'MARKDOWN',
            orderIndex: 99,
          },
        })
      }
    } catch {
      toast.error('Veritabanı notları kaydedilirken hata oluştu.')
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-save debouncing
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setNotesContent(val)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      saveNotes(val)
    }, 1500)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* View Toggle Header */}
      <div className="flex justify-between items-center bg-white/20 dark:bg-black/20 border border-white/10 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setSubView('diagram')}
          className={cn(
            'px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer',
            subView === 'diagram'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-zinc-900 dark:text-neutral-100'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
          )}
        >
          <Database className="h-4 w-4" />
          Diyagram Görünümü
        </button>
        <button
          onClick={() => setSubView('notes')}
          className={cn(
            'px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer',
            subView === 'notes'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-zinc-900 dark:text-neutral-100'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
          )}
        >
          <FileText className="h-4 w-4" />
          Veritabanı Notları
        </button>
      </div>

      {/* View Content */}
      <div className="transition-all duration-300">
        {subView === 'diagram' ? (
          <PhaseSchemaTab project={project} phase={phase} />
        ) : (
          <div className="glass-panel rounded-3xl p-6 border border-zinc-200/60 dark:border-zinc-800/40 backdrop-blur-xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                  Veritabanı Notları ve Stratejileri
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  DB optimizasyonları, SQL/NoSQL veri modelleri ve indeks kararları. (Otomatik kaydedilir)
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    Kaydedildi
                  </>
                )}
              </div>
            </div>

            <Textarea
              value={notesContent}
              onChange={handleNotesChange}
              placeholder={`Örnek:
- Tablo indexleme stratejileri
- Query optimizasyon notları
- SQL/NoSQL şema geçiş taslakları...`}
              className="min-h-[400px] w-full bg-white/50 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm font-mono leading-relaxed"
            />
          </div>
        )}
      </div>
    </div>
  )
}
