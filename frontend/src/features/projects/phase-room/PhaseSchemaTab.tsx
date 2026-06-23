import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Database,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import mermaid from 'mermaid'
import {
  Project,
  ProjectPhase,
  ProjectDocument,
  DocumentType,
  DocumentFormat,
  useProjectDocuments,
  useAddProjectDocument,
  useUpdateProjectDocument,
} from '../../../api/projects'
import { Button as MovingBorderButton } from '../../../components/ui/moving-border'
import { SketchButton } from '../../../components/ui/SketchButton'
import { Input } from '../../../components/ui/Input'
import { cn } from '../../../lib/utils'
import type { DbSchemaDocument, SchemaView } from './types'
import {
  emptySchema,
  parseSchemaDocument,
  generateMermaid,
  addTable,
  removeTable,
  renameTable,
  addColumn,
  updateColumn,
  removeColumn,
} from './schema-utils'

// ── Mermaid initialization ──────────────────────────────────────────

let mermaidInitialized = false

function initMermaid(isDark: boolean) {
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    er: {
      useMaxWidth: true,
      layoutDirection: 'TB',
    },
    securityLevel: 'loose',
  })
  mermaidInitialized = true
}

// ── Component ───────────────────────────────────────────────────────

interface PhaseSchemaTabProps {
  project: Project
  phase: ProjectPhase
}

export const PhaseSchemaTab: React.FC<PhaseSchemaTabProps> = ({
  project,
  phase,
}) => {
  const [schemaView, setSchemaView] = useState<SchemaView>('diagram')

  // ── Data ──────────────────────────────────────────────────────────
  const { data: documents = [] } = useProjectDocuments(project.id)
  const addDocumentMutation = useAddProjectDocument()
  const updateDocumentMutation = useUpdateProjectDocument()

  const dbSchemaDoc = useMemo(
    () =>
      documents.find(
        (doc) =>
          doc.type === 'DB_SCHEMA' &&
          doc.title === `DB_SCHEMA_PHASE_${phase.id}`
      ),
    [documents, phase.id]
  )

  const [schema, setSchema] = useState<DbSchemaDocument>(emptySchema)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setSchema(parseSchemaDocument(dbSchemaDoc?.content))
  }, [dbSchemaDoc?.id, dbSchemaDoc?.content])

  const mermaidCode = useMemo(() => generateMermaid(schema), [schema])

  // ── Mermaid SVG render ────────────────────────────────────────────
  const diagramRef = useRef<HTMLDivElement>(null)
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')

  useEffect(() => {
    if (schemaView !== 'diagram' || schema.tables.length === 0) return

    const renderDiagram = async () => {
      if (!mermaidInitialized || isDark !== (mermaid as any)._config?.theme === 'dark') {
        initMermaid(isDark)
      }

      try {
        const id = `mermaid-er-${phase.id}-${Date.now()}`
        const { svg } = await mermaid.render(id, mermaidCode)
        if (diagramRef.current) {
          diagramRef.current.innerHTML = svg
          // Style SVG for responsive
          const svgEl = diagramRef.current.querySelector('svg')
          if (svgEl) {
            svgEl.style.maxWidth = '100%'
            svgEl.style.height = 'auto'
          }
        }
      } catch (err) {
        if (diagramRef.current) {
          diagramRef.current.innerHTML = `<p class="text-xs text-zinc-400 italic p-4">Diyagram oluşturulamadı. Tablo veya ilişki verilerini kontrol edin.</p>`
        }
      }
    }

    renderDiagram()
  }, [schemaView, mermaidCode, phase.id, isDark, schema.tables.length])

  // ── Save handler ──────────────────────────────────────────────────

  const handleSaveSchema = async () => {
    if (isSaving) return
    setIsSaving(true)

    const request = {
      type: 'DB_SCHEMA' as DocumentType,
      title: `DB_SCHEMA_PHASE_${phase.id}`,
      content: JSON.stringify(schema, null, 2),
      contentFormat: 'SQL' as DocumentFormat,
      orderIndex: dbSchemaDoc?.orderIndex ?? documents.length,
    }

    try {
      if (dbSchemaDoc) {
        await updateDocumentMutation.mutateAsync({
          documentId: dbSchemaDoc.id,
          request,
        })
        toast.success('Şema güncellendi.')
      } else {
        await addDocumentMutation.mutateAsync({
          projectId: project.id,
          request,
        })
        toast.success('Şema başarıyla kaydedildi.')
      }
    } catch {
      toast.error('Şema kaydedilirken hata oluştu.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 backdrop-blur-xl space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header + View Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/60 dark:border-zinc-800/40 pb-4">
        <div className="flex items-center gap-2.5">
          <Database className="h-5 w-5 text-cyan-600 dark:text-cyan-500" />
          <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
            DB Schema Studio
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* View Tabs */}
          <div className="inline-flex rounded-xl border border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-950/40 p-1">
            {(['diagram', 'code', 'tables'] as SchemaView[]).map((view) => (
              <button
                key={view}
                onClick={() => setSchemaView(view)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-black transition-all',
                  schemaView === view
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-200'
                    : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-white'
                )}
              >
                {view === 'diagram'
                  ? 'Diyagram'
                  : view === 'code'
                  ? 'Kod'
                  : 'Tablolar'}
              </button>
            ))}
          </div>

          <MovingBorderButton
            onClick={() => setSchema((s) => addTable(s))}
            borderRadius="0.5rem"
            duration={1800}
            containerClassName="h-9 cursor-pointer"
            className="px-3 font-bold flex items-center gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Tablo
          </MovingBorderButton>

          <MovingBorderButton
            onClick={handleSaveSchema}
            borderRadius="0.5rem"
            duration={2200}
            containerClassName="h-9 cursor-pointer"
            className="px-3 font-bold flex items-center gap-1.5 text-xs"
            disabled={isSaving}
          >
            <Check className="h-3.5 w-3.5" />
            Şemayı Kaydet
          </MovingBorderButton>
        </div>
      </div>

      {/* ── VIEW: Diagram (Live Mermaid SVG) ────────────────────────── */}
      {schemaView === 'diagram' && (
        <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800/50 bg-white dark:bg-zinc-950/20 p-5">
          {schema.tables.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
              <p className="text-xs text-zinc-400 italic">
                Henüz tablo eklenmemiş. Sağ üstteki "+ Tablo" butonuyla
                başlayın.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Mermaid SVG Container */}
              <div
                ref={diagramRef}
                className="w-full overflow-x-auto [&_svg]:mx-auto"
              />

              {/* Tablo Kartları (Görsel özet) */}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {schema.tables.map((table) => (
                  <div
                    key={table.id}
                    className="overflow-hidden rounded-xl border border-zinc-200/80 dark:border-cyan-400/25 bg-white dark:bg-zinc-950/80 shadow-sm dark:shadow-md"
                  >
                    <div className="border-b border-zinc-200/60 dark:border-cyan-400/20 bg-zinc-50 dark:bg-cyan-400/10 px-3 py-2 text-center text-xs font-black uppercase tracking-widest text-zinc-600 dark:text-cyan-100">
                      {table.name}
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                      {table.columns.map((column) => (
                        <div
                          key={column.id}
                          className="grid grid-cols-[80px_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-xs"
                        >
                          <span className="font-mono text-zinc-400">
                            {column.type}
                          </span>
                          <span className="truncate font-bold text-zinc-700 dark:text-zinc-100">
                            {column.name}
                          </span>
                          <span className="flex gap-1">
                            {column.isPrimary && (
                              <span className="rounded bg-amber-100 dark:bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-black text-amber-700 dark:text-amber-200">
                                PK
                              </span>
                            )}
                            {column.isForeign && (
                              <span className="rounded bg-cyan-100 dark:bg-cyan-400/15 px-1.5 py-0.5 text-[9px] font-black text-cyan-700 dark:text-cyan-200">
                                FK
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* FK İlişkileri Özeti */}
              {schema.tables.some((t) =>
                t.columns.some((c) => c.isForeign && c.referencesTable)
              ) && (
                <div className="border-t border-zinc-200/40 dark:border-zinc-800/20 pt-4">
                  <h4 className="text-xs font-bold text-zinc-400 mb-2">
                    Foreign Key İlişkileri
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {schema.tables.flatMap((table) =>
                      table.columns
                        .filter((c) => c.isForeign && c.referencesTable)
                        .map((c, index) => (
                          <span
                            key={`${table.name}-${c.name}-${index}`}
                            className="rounded-full border border-cyan-200 dark:border-cyan-400/20 bg-cyan-50 dark:bg-cyan-400/10 px-3 py-1 text-[10px] font-black text-cyan-700 dark:text-cyan-100"
                          >
                            {`${c.referencesTable} → ${table.name}.${c.name}`}
                          </span>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── VIEW: Code (Mermaid text) ────────────────────────────────── */}
      {schemaView === 'code' && (
        <pre className="max-h-[500px] overflow-auto rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-950/70 p-4 text-xs leading-relaxed text-zinc-700 dark:text-cyan-100 font-mono">
          {mermaidCode}
        </pre>
      )}

      {/* ── VIEW: Tables (Editable) ──────────────────────────────────── */}
      {schemaView === 'tables' && (
        <div className="space-y-4">
          {schema.tables.map((table) => (
            <div
              key={table.id}
              className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/35 p-4 space-y-4"
            >
              <div className="flex items-center gap-2">
                <Input
                  value={table.name}
                  onChange={(e) =>
                    setSchema((s) => renameTable(s, table.id, e.target.value))
                  }
                  className="bg-zinc-50 dark:bg-zinc-900 font-black text-sm"
                />

                <MovingBorderButton
                  onClick={() => setSchema((s) => addColumn(s, table.id))}
                  borderRadius="0.5rem"
                  duration={1500}
                  containerClassName="h-9 cursor-pointer shrink-0"
                  className="px-3 text-xs font-bold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Kolon
                </MovingBorderButton>

                <SketchButton
                  type="button"
                  onClick={() => setSchema((s) => removeTable(s, table.id))}
                  tone="destructive"
                  className="h-9 w-9 p-0 flex items-center justify-center shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </SketchButton>
              </div>

              <div className="space-y-2">
                {table.columns.map((column) => (
                  <div
                    key={column.id}
                    className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.5fr_1fr_60px_60px_1.5fr_1.5fr_auto] items-center"
                  >
                    <Input
                      value={column.name}
                      onChange={(e) =>
                        setSchema((s) =>
                          updateColumn(s, table.id, column.id, {
                            name: e.target.value,
                          })
                        )
                      }
                      placeholder="Kolon Adı"
                      className="h-9 bg-zinc-50 dark:bg-zinc-900 text-xs"
                    />
                    <Input
                      value={column.type}
                      onChange={(e) =>
                        setSchema((s) =>
                          updateColumn(s, table.id, column.id, {
                            type: e.target.value,
                          })
                        )
                      }
                      placeholder="Tip"
                      className="h-9 bg-zinc-50 dark:bg-zinc-900 text-xs"
                    />

                    <label className="flex h-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-[10px] font-black text-zinc-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={column.isPrimary}
                        onChange={(e) =>
                          setSchema((s) =>
                            updateColumn(s, table.id, column.id, {
                              isPrimary: e.target.checked,
                            })
                          )
                        }
                        className="mr-1 accent-cyan-500"
                      />
                      PK
                    </label>

                    <label className="flex h-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-[10px] font-black text-zinc-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={column.isForeign}
                        onChange={(e) =>
                          setSchema((s) =>
                            updateColumn(s, table.id, column.id, {
                              isForeign: e.target.checked,
                            })
                          )
                        }
                        className="mr-1 accent-cyan-500"
                      />
                      FK
                    </label>

                    <Input
                      value={column.referencesTable || ''}
                      onChange={(e) =>
                        setSchema((s) =>
                          updateColumn(s, table.id, column.id, {
                            referencesTable: e.target.value || undefined,
                          })
                        )
                      }
                      placeholder="Ref Tablo"
                      className="h-9 bg-zinc-50 dark:bg-zinc-900 text-xs"
                      disabled={!column.isForeign}
                    />
                    <Input
                      value={column.referencesColumn || ''}
                      onChange={(e) =>
                        setSchema((s) =>
                          updateColumn(s, table.id, column.id, {
                            referencesColumn: e.target.value || undefined,
                          })
                        )
                      }
                      placeholder="Ref Kolon"
                      className="h-9 bg-zinc-50 dark:bg-zinc-900 text-xs"
                      disabled={!column.isForeign}
                    />

                    <SketchButton
                      type="button"
                      onClick={() =>
                        setSchema((s) =>
                          removeColumn(s, table.id, column.id)
                        )
                      }
                      tone="destructive"
                      className="h-9 w-9 p-0 flex items-center justify-center shrink-0 lg:col-span-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </SketchButton>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {schema.tables.length === 0 && (
            <div className="text-center py-12 border border-dashed border-zinc-200/60 dark:border-zinc-800/40 rounded-xl">
              <p className="text-xs text-zinc-400 italic">
                Henüz tablo eklenmemiş.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
