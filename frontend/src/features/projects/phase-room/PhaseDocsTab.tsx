import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  Save,
  Trash2,
  Check,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Project,
  ProjectPhase,
  ProjectDocument,
  DocumentType,
  DocumentFormat,
  useProjectDocuments,
  useAddProjectDocument,
  useUpdateProjectDocument,
  useDeleteProjectDocument,
} from '../../../api/projects'
import { Button as MovingBorderButton } from '../../../components/ui/moving-border'
import { SketchButton } from '../../../components/ui/SketchButton'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import { cn } from '../../../lib/utils'
import type { SubPhaseNode, SaveStatus } from './types'

// ── Title convention ────────────────────────────────────────────────
// Sub-phases are stored as project_document with title pattern:
//   [PHASE:{phaseId}:SUB:{subIndex}] Label
// This allows frontend-only tree simulation without a DB parent_id column.

const SUB_PREFIX = (phaseId: number) => `[PHASE:${phaseId}:SUB:`
const SUB_REGEX = /^\[PHASE:(\d+):SUB:(\d+)\]\s*(.*)$/

function encodeSubTitle(phaseId: number, subIndex: number, label: string) {
  return `[PHASE:${phaseId}:SUB:${subIndex}] ${label}`
}

function decodeSubTitle(
  title: string
): { phaseId: number; subIndex: number; label: string } | null {
  const match = title.match(SUB_REGEX)
  if (!match) return null
  return {
    phaseId: parseInt(match[1], 10),
    subIndex: parseInt(match[2], 10),
    label: match[3],
  }
}

// ── Component ───────────────────────────────────────────────────────

interface PhaseDocsTabProps {
  project: Project
  phase: ProjectPhase
  /** 0-based phase index for display (e.g., 0 → "Faz 0.1, 0.2, …") */
  phaseIndex: number
}

export const PhaseDocsTab: React.FC<PhaseDocsTabProps> = ({
  project,
  phase,
  phaseIndex,
}) => {
  // ── Data ──────────────────────────────────────────────────────────
  const { data: documents = [] } = useProjectDocuments(project.id)
  const addDocMutation = useAddProjectDocument()
  const updateDocMutation = useUpdateProjectDocument()
  const deleteDocMutation = useDeleteProjectDocument(project.id)

  // Filter documents that belong to this phase as sub-nodes
  const subDocs = useMemo(() => {
    const prefix = SUB_PREFIX(phase.id)
    return documents
      .filter((d) => d.title.startsWith(prefix))
      .map((d) => {
        const decoded = decodeSubTitle(d.title)
        return decoded
          ? {
              docId: d.id,
              subIndex: decoded.subIndex,
              label: decoded.label,
              content: d.content || '',
              isDirty: false,
              orderIndex: d.orderIndex,
            }
          : null
      })
      .filter(Boolean)
      .sort((a, b) => a!.subIndex - b!.subIndex) as (SubPhaseNode & {
      orderIndex: number
    })[]
  }, [documents, phase.id])

  // ── Local state ───────────────────────────────────────────────────
  const [selectedSubIndex, setSelectedSubIndex] = useState<number | null>(null)
  const [localContent, setLocalContent] = useState('')
  const [localLabel, setLocalLabel] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newLabel, setNewLabel] = useState('')

  // Debounce timer ref
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Select first sub-phase on load
  useEffect(() => {
    if (subDocs.length > 0 && selectedSubIndex === null) {
      setSelectedSubIndex(subDocs[0].subIndex)
    }
  }, [subDocs, selectedSubIndex])

  // Sync local content when selection changes
  const selectedDoc = useMemo(
    () => subDocs.find((d) => d.subIndex === selectedSubIndex),
    [subDocs, selectedSubIndex]
  )

  useEffect(() => {
    if (selectedDoc) {
      setLocalContent(selectedDoc.content)
      setLocalLabel(selectedDoc.label)
      setSaveStatus('idle')
    }
  }, [selectedDoc?.docId, selectedDoc?.content, selectedDoc?.label])

  // ── Auto-save (1.5s debounce) ─────────────────────────────────────

  const triggerAutoSave = useCallback(
    (content: string, label: string) => {
      if (!selectedDoc?.docId) return

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      setSaveStatus('idle')

      saveTimerRef.current = setTimeout(async () => {
        setSaveStatus('saving')
        try {
          await updateDocMutation.mutateAsync({
            documentId: selectedDoc.docId!,
            request: {
              type: 'TECH_DOC' as DocumentType,
              title: encodeSubTitle(phase.id, selectedDoc.subIndex, label),
              content,
              contentFormat: 'MARKDOWN' as DocumentFormat,
              orderIndex: (selectedDoc as any).orderIndex ?? 0,
            },
          })
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        } catch {
          setSaveStatus('error')
          toast.error('Otomatik kayıt başarısız oldu.')
        }
      }, 1500)
    },
    [selectedDoc, phase.id, updateDocMutation]
  )

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const handleContentChange = (value: string) => {
    setLocalContent(value)
    triggerAutoSave(value, localLabel)
  }

  const handleLabelChange = (value: string) => {
    setLocalLabel(value)
    triggerAutoSave(localContent, value)
  }

  // ── Add new sub-phase ─────────────────────────────────────────────

  const handleAddSubPhase = async () => {
    if (!newLabel.trim() || isAddingNew) return
    setIsAddingNew(true)

    const nextIndex =
      subDocs.length > 0
        ? Math.max(...subDocs.map((d) => d.subIndex)) + 1
        : 1

    try {
      await addDocMutation.mutateAsync({
        projectId: project.id,
        request: {
          type: 'TECH_DOC' as DocumentType,
          title: encodeSubTitle(phase.id, nextIndex, newLabel.trim()),
          content: '',
          contentFormat: 'MARKDOWN' as DocumentFormat,
          orderIndex: documents.length,
        },
      })
      setNewLabel('')
      setSelectedSubIndex(nextIndex)
      toast.success(`Alt modül "Faz ${phaseIndex}.${nextIndex}" eklendi.`)
    } catch {
      toast.error('Alt modül eklenirken hata oluştu.')
    } finally {
      setIsAddingNew(false)
    }
  }

  const handleDeleteSubPhase = async (docId: number, subIndex: number) => {
    try {
      await deleteDocMutation.mutateAsync(docId)
      if (selectedSubIndex === subIndex) {
        setSelectedSubIndex(null)
        setLocalContent('')
        setLocalLabel('')
      }
      toast.success('Alt modül silindi.')
    } catch {
      toast.error('Silme işlemi başarısız.')
    }
  }

  // ── Save status indicator ─────────────────────────────────────────

  const SaveIndicator = () => {
    if (saveStatus === 'idle') return null
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-[10px] font-bold transition-opacity duration-300',
          saveStatus === 'saving' && 'text-amber-500 dark:text-amber-400',
          saveStatus === 'saved' && 'text-emerald-500 dark:text-emerald-400',
          saveStatus === 'error' && 'text-red-500 dark:text-red-400'
        )}
      >
        {saveStatus === 'saving' && (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Kaydediliyor...
          </>
        )}
        {saveStatus === 'saved' && (
          <>
            <Check className="h-3 w-3" />
            Kaydedildi
          </>
        )}
        {saveStatus === 'error' && (
          <>
            <AlertCircle className="h-3 w-3" />
            Kayıt hatası
          </>
        )}
      </span>
    )
  }

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="grid gap-0 lg:grid-cols-[280px_1fr] w-full min-h-[500px] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* ── Sol Panel: Alt Faz Listesi ───────────────────────────────── */}
      <div className="border-r border-zinc-200/60 dark:border-zinc-800/40 bg-zinc-50/80 dark:bg-zinc-950/60 flex flex-col">
        {/* Panel Header */}
        <div className="p-4 border-b border-zinc-200/60 dark:border-zinc-800/40">
          <h4 className="font-bold text-xs text-zinc-700 dark:text-zinc-200 uppercase tracking-wider mb-3">
            Alt Modüller
          </h4>

          {/* Yeni Alt Faz Ekleme */}
          <div className="flex gap-1.5">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Modül adı..."
              className="h-8 text-xs bg-white dark:bg-zinc-900"
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubPhase()}
              disabled={isAddingNew}
            />
            <MovingBorderButton
              onClick={handleAddSubPhase}
              borderRadius="0.5rem"
              duration={1500}
              containerClassName="h-8 w-8 cursor-pointer shrink-0"
              className="font-bold"
              disabled={isAddingNew}
            >
              <Plus className="h-3.5 w-3.5" />
            </MovingBorderButton>
          </div>
        </div>

        {/* Sub-phase List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {subDocs.map((sub) => {
            const isActive = selectedSubIndex === sub.subIndex
            return (
              <div
                key={sub.subIndex}
                className={cn(
                  'group flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs cursor-pointer transition-all',
                  isActive
                    ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-200'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border border-transparent'
                )}
                onClick={() => setSelectedSubIndex(sub.subIndex)}
              >
                <ChevronRight
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 transition-transform',
                    isActive && 'rotate-90 text-cyan-500'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 mr-1.5">
                    {phaseIndex}.{sub.subIndex}
                  </span>
                  <span className="font-bold truncate">{sub.label}</span>
                </div>

                {/* Delete (hover-only) */}
                {sub.docId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSubPhase(sub.docId!, sub.subIndex)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            )
          })}

          {subDocs.length === 0 && (
            <div className="text-center py-8 px-4">
              <FileText className="h-8 w-8 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
              <p className="text-[10px] text-zinc-400 italic leading-relaxed">
                Henüz alt modül yok. Yukarıdan ekleyerek başlayın.
              </p>
              <p className="text-[10px] text-zinc-300 dark:text-zinc-600 mt-1">
                Örn: "API Endpointleri", "DB Mimarisi"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Sağ Panel: Döküman Editörü ───────────────────────────────── */}
      <div className="flex flex-col bg-white dark:bg-zinc-950/30">
        {selectedDoc ? (
          <>
            {/* Editor Header */}
            <div className="flex items-center justify-between gap-3 p-4 border-b border-zinc-200/60 dark:border-zinc-800/40">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400 font-bold shrink-0">
                  Faz {phaseIndex}.{selectedDoc.subIndex}
                </span>
                <Input
                  value={localLabel}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  className="h-8 text-sm font-bold bg-transparent border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 focus:border-cyan-500 transition-colors"
                />
              </div>
              <SaveIndicator />
            </div>

            {/* Editor Content */}
            <div className="flex-1 p-4">
              <Textarea
                value={localContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={`Faz ${phaseIndex}.${selectedDoc.subIndex} hakkında detayları yazın...\n\nMarkdown desteklenir:\n# Başlık\n## Alt başlık\n- Liste öğesi\n\`\`\`sql\nSELECT * FROM table;\n\`\`\`\n\nBu alan 1.5 saniye yazma duraksanızda otomatik kaydedilir.`}
                className="h-full min-h-[400px] resize-none text-sm font-mono leading-relaxed bg-transparent border-zinc-200/40 dark:border-zinc-800/30 focus:border-cyan-500/40"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-8">
              <FileText className="h-12 w-12 mx-auto text-zinc-200 dark:text-zinc-800 mb-4" />
              <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500">
                {subDocs.length === 0
                  ? 'Alt modül ekleyerek başlayın'
                  : 'Soldaki listeden bir alt modül seçin'}
              </p>
              <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-2 max-w-xs mx-auto">
                Her alt modül, o faza ait teknik dökümanlarınızı (API tasarımı,
                DB şemaları, mimari kararlar) tutar ve AI Context Export'a dahil
                edilir.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
