import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Database,
  Plus,
  Trash2,
  GitCommit,
  Copy,
  Check,
  Loader2,
  FileText,
  HelpCircle,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { cn } from '../../lib/utils'
import { SketchButton } from '../../components/ui/SketchButton'
import { Select } from '../../components/ui/Select'
import {
  Project,
  useProjectDocuments,
  useAddProjectDocument,
  useUpdateProjectDocument,
} from '../../api/projects'

export interface DbColumn {
  id: string
  name: string
  type: string
  isPrimary: boolean
  isForeign: boolean
  referencesTable?: string
  referencesColumn?: string
}

export interface DbTable {
  id: string
  name: string
  columns: DbColumn[]
}

export interface DbSchemaDocument {
  version: 1
  tables: DbTable[]
}

interface DbSchemaStudioProps {
  project: Project
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// Default initial schema when none exists
const emptySchema = (): DbSchemaDocument => ({
  version: 1,
  tables: [
    {
      id: makeId(),
      name: 'APP_USER',
      columns: [
        { id: makeId(), name: 'id', type: 'bigint', isPrimary: true, isForeign: false },
        { id: makeId(), name: 'display_name', type: 'varchar', isPrimary: false, isForeign: false },
      ],
    },
    {
      id: makeId(),
      name: 'PROJECT',
      columns: [
        { id: makeId(), name: 'id', type: 'bigint', isPrimary: true, isForeign: false },
        { id: makeId(), name: 'user_id', type: 'bigint', isPrimary: false, isForeign: true, referencesTable: 'APP_USER', referencesColumn: 'id' },
        { id: makeId(), name: 'name', type: 'varchar', isPrimary: false, isForeign: false },
      ],
    },
  ],
})

// ── CUSTOM MERMAID erDiagram PARSER ───────────────────────────────────
function parseMermaidToSchema(code: string): DbSchemaDocument {
  const lines = code.split('\n')
  const tables: DbTable[] = []
  let currentTable: DbTable | null = null
  const relations: Array<{ from: string; to: string; column: string }> = []

  for (let line of lines) {
    line = line.trim()
    if (!line || line.startsWith('%%') || line === 'erDiagram') continue

    // Relationship matching: E.g. APP_USER ||--o{ PROJECT : "user_id"
    const relMatch = line.match(/^(\w+)\s+[\|o\-{}<>\d]+[\|o\-{}<>\d]+\s+(\w+)\s*:\s*["']?([\w_]+)["']?/)
    if (relMatch) {
      relations.push({
        from: relMatch[1].toUpperCase(),
        to: relMatch[2].toUpperCase(),
        column: relMatch[3].toLowerCase(),
      })
      continue
    }

    // Table block start: E.g. APP_USER {
    const tableStartMatch = line.match(/^(\w+)\s*\{/)
    if (tableStartMatch) {
      const tableName = tableStartMatch[1].toUpperCase()
      let table = tables.find((t) => t.name === tableName)
      if (!table) {
        table = { id: makeId(), name: tableName, columns: [] }
        tables.push(table)
      }
      currentTable = table
      continue
    }

    // Table block end: }
    if (line === '}') {
      currentTable = null
      continue
    }

    // Column inside table block: E.g. bigint id PK
    if (currentTable) {
      const colMatch = line.match(/^([\w_]+)\s+([\w_]+)(?:\s+([\w_,\s]+))?/)
      if (colMatch) {
        const type = colMatch[1]
        const name = colMatch[2]
        const flagsStr = colMatch[3] || ''
        const isPrimary = /\bPK\b/i.test(flagsStr)
        const isForeign = /\bFK\b/i.test(flagsStr)

        if (!currentTable.columns.some((c) => c.name === name)) {
          currentTable.columns.push({
            id: makeId(),
            name,
            type,
            isPrimary,
            isForeign,
          })
        }
      }
    } else {
      // Table declaration outside block
      const tableOnlyMatch = line.match(/^(\w+)$/)
      if (tableOnlyMatch) {
        const tableName = tableOnlyMatch[1].toUpperCase()
        if (!tables.some((t) => t.name === tableName)) {
          tables.push({ id: makeId(), name: tableName, columns: [] })
        }
      }
    }
  }

  // Map references for Foreign Keys
  relations.forEach((rel) => {
    const targetTable = tables.find((t) => t.name === rel.to)
    if (targetTable) {
      let col = targetTable.columns.find((c) => c.name === rel.column)
      if (!col) {
        col = {
          id: makeId(),
          name: rel.column,
          type: 'bigint',
          isPrimary: false,
          isForeign: true,
          referencesTable: rel.from,
          referencesColumn: 'id',
        }
        targetTable.columns.push(col)
      } else {
        col.isForeign = true;
        col.referencesTable = rel.from
        col.referencesColumn = col.referencesColumn || 'id'
      }
    }
  })

  return {
    version: 1,
    tables,
  }
}

// ── CUSTOM MARKDOWN RENDERER ──────────────────────────────────────────
function renderMarkdown(md: string) {
  if (!md) return <p className="text-slate-400 dark:text-slate-500 italic">Not girilmemiş...</p>

  const lines = md.split('\n')
  const rendered: React.ReactNode[] = []
  let inCodeBlock = false
  let codeLines: string[] = []

  lines.forEach((line, idx) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false
        rendered.push(
          <pre key={`code-${idx}`} className="bg-slate-950/90 dark:bg-black/50 border border-slate-200/10 dark:border-slate-800/40 p-4 font-mono text-xs text-cyan-400 rounded-2xl my-3 overflow-x-auto shadow-inner">
            <code>{codeLines.join('\n')}</code>
          </pre>
        )
        codeLines = []
      } else {
        inCodeBlock = true
      }
      return
    }

    if (inCodeBlock) {
      codeLines.push(line)
      return
    }

    if (line.startsWith('# ')) {
      rendered.push(<h1 key={idx} className="text-lg font-black text-slate-900 dark:text-slate-100 mt-4 mb-2 border-b border-slate-200/20 pb-1">{line.substring(2)}</h1>)
    } else if (line.startsWith('## ')) {
      rendered.push(<h2 key={idx} className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-3 mb-1.5">{line.substring(3)}</h2>)
    } else if (line.startsWith('### ')) {
      rendered.push(<h3 key={idx} className="text-xs font-bold text-slate-900 dark:text-slate-200 mt-3 mb-1">{line.substring(4)}</h3>)
    } else if (line.startsWith('- ')) {
      rendered.push(<li key={idx} className="text-xs text-slate-700 dark:text-slate-300 ml-4 list-disc font-medium">{line.substring(2)}</li>)
    } else if (line.trim() === '') {
      rendered.push(<div key={idx} className="h-2" />)
    } else {
      rendered.push(<p key={idx} className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed font-medium">{line}</p>)
    }
  })

  return <div className="space-y-1.5">{rendered}</div>
}

export const DbSchemaStudio: React.FC<DbSchemaStudioProps> = ({ project }) => {
  const [activeTab, setActiveTab] = useState<'diagram' | 'code' | 'tables' | 'notes'>('diagram')
  const [isCopied, setIsCopied] = useState(false)

  // ── DATA FETCHING ──────────────────────────────────────────────────
  const { data: documents = [] } = useProjectDocuments(project.id)
  const addDocMutation = useAddProjectDocument()
  const updateDocMutation = useUpdateProjectDocument()

  const structTitle = `DB_SCHEMA_STRUCTURE_PROJECT_${project.id}`
  const notesTitle = `DB_SCHEMA_NOTES_PROJECT_${project.id}`

  const structDoc = documents.find(
    (d) => d.type === 'DB_SCHEMA' && (d.title === structTitle || d.title === 'Veritabani Semasi')
  )
  const notesDoc = documents.find(
    (d) => d.type === 'TECH_DOC' && d.title === notesTitle
  )

  // ── CENTRAL SCHEMA STATE ───────────────────────────────────────────
  const [schemaData, setSchemaData] = useState<DbSchemaDocument>(emptySchema)
  const [localMermaid, setLocalMermaid] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [isSavingSchema, setIsSavingSchema] = useState(false)

  // Sync schemaData from backend doc
  useEffect(() => {
    if (structDoc && structDoc.content) {
      try {
        const parsed = JSON.parse(structDoc.content)
        if (parsed.version === 1 && Array.isArray(parsed.tables)) {
          setSchemaData(parsed)
        }
      } catch {
        console.error('Failed to parse database schema JSON')
      }
    }
  }, [structDoc?.id, structDoc?.content])

  // ── CENTRAL NOTES STATE ────────────────────────────────────────────
  const [localNotes, setLocalNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const notesTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (notesDoc) {
      setLocalNotes(notesDoc.content || '')
    }
  }, [notesDoc?.id, notesDoc?.content])

  // ── MERMAID COMPILER (UI -> Kod) ──────────────────────────────────
  const generatedMermaid = useMemo(() => {
    const normalizeIdentifier = (value: string) => {
      return value.trim().replace(/[^a-zA-Z0-9_]/g, '_') || 'unnamed'
    }

    const tableBlocks = schemaData.tables.map((table) => {
      const columns = table.columns.map((column) => {
        const flags = [column.isPrimary ? 'PK' : '', column.isForeign ? 'FK' : ''].filter(Boolean).join(', ')
        return `    ${normalizeIdentifier(column.type)} ${normalizeIdentifier(column.name)}${flags ? ` ${flags}` : ''}`
      })
      return `  ${normalizeIdentifier(table.name).toUpperCase()} {\n${columns.join('\n')}\n  }`
    })

    const relationsList = schemaData.tables.flatMap((table) =>
      table.columns
        .filter((column) => column.isForeign && column.referencesTable)
        .map(
          (column) =>
            `  ${normalizeIdentifier(column.referencesTable || '').toUpperCase()} ||--o{ ${normalizeIdentifier(
              table.name
            ).toUpperCase()} : "${normalizeIdentifier(column.name)}"`
        )
    )

    return ['erDiagram', ...relationsList, ...tableBlocks].join('\n')
  }, [schemaData])

  // Sync editor value when schemaData updates
  useEffect(() => {
    setLocalMermaid(generatedMermaid)
  }, [generatedMermaid])

  // ── RELATIONSHIPS LIST ─────────────────────────────────────────────
  const relations = useMemo(() => {
    return schemaData.tables.flatMap((table) =>
      table.columns
        .filter((column) => column.isForeign && column.referencesTable)
        .map((column) => ({
          from: column.referencesTable || '',
          to: table.name,
          column: column.name,
        }))
    )
  }, [schemaData])

  // ── SAVE SCHEMA ACTION (UI -> Backend) ─────────────────────────────
  const handleSaveSchema = async () => {
    setIsSavingSchema(true)
    const content = JSON.stringify(schemaData, null, 2)
    try {
      if (structDoc) {
        await updateDocMutation.mutateAsync({
          documentId: structDoc.id,
          request: {
            type: 'DB_SCHEMA',
            title: structTitle,
            content,
            contentFormat: 'CODE',
          },
        })
      } else {
        await addDocMutation.mutateAsync({
          projectId: project.id,
          request: {
            type: 'DB_SCHEMA',
            title: structTitle,
            content,
            contentFormat: 'CODE',
            orderIndex: 70,
          },
        })
      }
      toast.success('Veritabanı şeması başarıyla kaydedildi. 🚀')
    } catch {
      toast.error('Şema kaydedilirken hata oluştu.')
    } finally {
      setIsSavingSchema(false)
    }
  }

  // ── AUTO-SAVE DB NOTES (1200ms Debounce) ───────────────────────────
  const handleSaveNotes = async (content: string) => {
    setIsSavingNotes(true)
    try {
      if (notesDoc) {
        await updateDocMutation.mutateAsync({
          documentId: notesDoc.id,
          request: {
            type: 'TECH_DOC',
            title: notesTitle,
            content,
            contentFormat: 'MARKDOWN',
          },
        })
      } else {
        await addDocMutation.mutateAsync({
          projectId: project.id,
          request: {
            type: 'TECH_DOC',
            title: notesTitle,
            content,
            contentFormat: 'MARKDOWN',
            orderIndex: 90,
          },
        })
      }
    } catch {
      toast.error('Notlar kaydedilemedi.')
    } finally {
      setIsSavingNotes(false)
    }
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setLocalNotes(val)

    if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
    notesTimerRef.current = setTimeout(() => {
      handleSaveNotes(val)
    }, 1200)
  }

  // Cleanup notes timer on unmount
  useEffect(() => {
    return () => {
      if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
    }
  }, [])

  // ── MERMAID EDITOR CHANGE (Kod -> UI) ──────────────────────────────
  const handleMermaidChange = (val: string) => {
    setLocalMermaid(val)
    if (!val.trim()) {
      setParseError('Boş kod girdisi.')
      return
    }

    try {
      const parsed = parseMermaidToSchema(val)
      if (parsed.tables.length > 0) {
        setSchemaData(parsed)
        setParseError(null)
      } else {
        setParseError('Tablo şeması ayrıştırılamadı. Sözdizimini kontrol edin.')
      }
    } catch (e: any) {
      setParseError(e.message || 'Geçersiz Mermaid ER sözdizimi.')
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(localMermaid)
    setIsCopied(true)
    toast.success('Mermaid ER kodu kopyalandı!')
    setTimeout(() => setIsCopied(false), 2000)
  }

  // ── INTERACTIVE EDIT ACTIONS ───────────────────────────────────────
  const addTable = () => {
    const updated: DbSchemaDocument = {
      ...schemaData,
      tables: [
        ...schemaData.tables,
        {
          id: makeId(),
          name: `TABLE_${schemaData.tables.length + 1}`,
          columns: [{ id: makeId(), name: 'id', type: 'bigint', isPrimary: true, isForeign: false }],
        },
      ],
    }
    setSchemaData(updated)
    toast.success('Yeni tablo eklendi.')
  }

  const renameTable = (tableId: string, name: string) => {
    const updated: DbSchemaDocument = {
      ...schemaData,
      tables: schemaData.tables.map((table) =>
        table.id === tableId ? { ...table, name: name.toUpperCase().replace(/[^A-Z0-9_]/g, '_') } : table
      ),
    }
    setSchemaData(updated)
  }

  const deleteTable = (tableId: string) => {
    const updated: DbSchemaDocument = {
      ...schemaData,
      tables: schemaData.tables.filter((table) => table.id !== tableId),
    }
    setSchemaData(updated)
    toast.success('Tablo kaldırıldı.')
  }

  const addColumn = (tableId: string) => {
    const updated: DbSchemaDocument = {
      ...schemaData,
      tables: schemaData.tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              columns: [
                ...table.columns,
                { id: makeId(), name: `COLUMN_${table.columns.length + 1}`, type: 'varchar', isPrimary: false, isForeign: false },
              ],
            }
          : table
      ),
    }
    setSchemaData(updated)
  }

  const updateColumn = (tableId: string, columnId: string, patch: Partial<DbColumn>) => {
    const updated: DbSchemaDocument = {
      ...schemaData,
      tables: schemaData.tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              columns: table.columns.map((column) => (column.id === columnId ? { ...column, ...patch } : column)),
            }
          : table
      ),
    }
    setSchemaData(updated)
  }

  const deleteColumn = (tableId: string, columnId: string) => {
    const updated: DbSchemaDocument = {
      ...schemaData,
      tables: schemaData.tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              columns: table.columns.filter((column) => column.id !== columnId),
            }
          : table
      ),
    }
    setSchemaData(updated)
  }

  return (
    <div className="bg-white/60 dark:bg-black/40 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-md rounded-3xl p-6 space-y-6">
      
      {/* ── 1. TABS & ACTIONS HEADER ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/40 pb-4">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-inner">
            <Database className="h-5 w-5 animate-pulse" />
          </div>
          <h2 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            Veri Mimarisi Stüdyosu
          </h2>
        </div>

        {/* Minimalist Tabs */}
        <div className="flex items-center gap-6 overflow-x-auto py-1.5 scrollbar-hide">
          {(['diagram', 'code', 'tables', 'notes'] as const).map((view) => {
            const isActive = activeTab === view
            const labelMap = {
              diagram: 'Diyagram',
              code: 'Kod',
              tables: 'Tablolar',
              notes: 'Veritabanı Notları',
            }

            return (
              <button
                key={view}
                onClick={() => setActiveTab(view)}
                className={cn(
                  'relative py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                  isActive
                    ? 'text-cyan-700 dark:text-cyan-400 font-black'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                )}
              >
                {labelMap[view]}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] rounded-full" />
                )}
              </button>
            )
          })}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={addTable}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-black/30 backdrop-blur-md rounded-xl text-xs font-black text-slate-800 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-black/50 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 text-cyan-500" />
            Tablo Ekle
          </button>

          <button
            onClick={handleSaveSchema}
            disabled={isSavingSchema}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200/80 dark:border-slate-800 bg-cyan-500/10 dark:bg-cyan-500/20 backdrop-blur-md rounded-xl text-xs font-black text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 dark:hover:bg-cyan-500/30 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isSavingSchema ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Şemayı Kaydet
          </button>
        </div>
      </div>

      {/* ── 2. WORKSPACE PANELS ───────────────────────────────────────── */}
      <div className="transition-all duration-300">

        {/* ── MODÜL A: DIAGRAM VIEW ──────────────────────────────────── */}
        {activeTab === 'diagram' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schemaData.tables.map((table) => (
                <div
                  key={table.id}
                  className="bg-white/50 dark:bg-black/30 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md"
                >
                  {/* Table Header */}
                  <div className="border-b border-slate-200 dark:border-slate-900 bg-slate-50/20 dark:bg-zinc-950/10 px-4 py-3">
                    <h4 className="text-slate-950 dark:text-slate-100 tracking-wider font-extrabold text-sm uppercase">
                      {table.name}
                    </h4>
                  </div>

                  {/* Columns List */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-900/50">
                    {table.columns.map((column) => (
                      <div
                        key={column.id}
                        className="flex items-center justify-between py-2.5 px-4 border-b border-slate-100 dark:border-slate-900 last:border-0"
                      >
                        <div className="flex items-center min-w-0">
                          <span className="font-mono text-xs text-slate-400 dark:text-slate-500 mr-3 shrink-0">
                            {column.type}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-200 truncate">
                            {column.name}
                          </span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {column.isPrimary && (
                            <span className="bg-amber-100/70 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              PK
                            </span>
                          )}
                          {column.isForeign && (
                            <span className="bg-cyan-100/70 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              FK
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {schemaData.tables.length === 0 && (
                <div className="col-span-full border-dashed border-2 border-slate-250 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-12 text-center">
                  <Database className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                  <span className="text-xs text-zinc-400 italic font-medium">
                    Henüz veritabanı tablosu eklenmedi. Sağ üstten tablo ekleyebilirsiniz.
                  </span>
                </div>
              )}
            </div>

            {/* Relationship tokens */}
            {relations.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
                <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  İlişkiler
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {relations.map((rel, index) => (
                    <span
                      key={`${rel.from}-${rel.to}-${index}`}
                      className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs px-3.5 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-800 inline-flex items-center gap-1.5 font-bold shadow-sm"
                    >
                      <GitCommit className="h-4 w-4 text-cyan-500 animate-pulse" />
                      <span>
                        {rel.from.toLowerCase()} &rarr; {rel.to.toLowerCase()}.{rel.column.toLowerCase()}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MODÜL B: MERMAID CODE VIEW ─────────────────────────────── */}
        {activeTab === 'code' && (
          <div className="space-y-3 animate-in fade-in duration-300">
            {/* Status indicators */}
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Mermaid erDiagram Editörü
              </span>
              <div className="flex items-center gap-3">
                {parseError ? (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    Sözdizimi Hatası: {parseError}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Şema Derlendi
                  </span>
                )}
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                >
                  {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  Kopyala
                </button>
              </div>
            </div>

            {/* Developer terminal input */}
            <div className="bg-slate-950/80 dark:bg-black/60 backdrop-blur-md border border-slate-200/10 dark:border-slate-800 rounded-2xl p-5 font-mono text-sm shadow-inner relative">
              <textarea
                value={localMermaid}
                onChange={(e) => handleMermaidChange(e.target.value)}
                placeholder={`erDiagram
  APP_USER ||--o{ PROJECT : "user_id"
  APP_USER {
    bigint id PK
    varchar display_name
  }
  PROJECT {
    bigint id PK
    bigint user_id FK
    varchar name
  }`}
                className="bg-transparent border-0 outline-none w-full min-h-[350px] text-emerald-400 dark:text-cyan-400 resize-y font-mono text-xs leading-relaxed focus:ring-0"
              />
            </div>
          </div>
        )}

        {/* ── MODÜL C: INTERACTIVE TABLES EDITOR ─────────────────────── */}
        {activeTab === 'tables' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {schemaData.tables.map((table) => (
              <div
                key={table.id}
                className="bg-white/50 dark:bg-black/30 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4"
              >
                {/* Table Title Editor */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/50 dark:border-slate-900/50">
                  <div className="flex-1 max-w-sm">
                    <Input
                      value={table.name}
                      onChange={(e) => renameTable(table.id, e.target.value)}
                      placeholder="TABLO_ADI"
                      className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-950 dark:text-slate-100 font-extrabold text-sm focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all uppercase"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addColumn(table.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-zinc-950/20 backdrop-blur-sm rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-zinc-950/45 transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Kolon Ekle
                    </button>
                    <SketchButton
                      tone="destructive"
                      onClick={() => deleteTable(table.id)}
                      className="h-9 w-9 p-0 rounded-xl"
                      title="Tabloyu Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </SketchButton>
                  </div>
                </div>

                {/* Column list */}
                <div className="space-y-3">
                  {table.columns.map((column) => (
                    <div
                      key={column.id}
                      className="flex flex-col gap-2 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/30 bg-white/20 dark:bg-zinc-950/10"
                    >
                      {/* Grid columns */}
                      <div className="grid gap-3 grid-cols-1 md:grid-cols-12 items-center">
                        {/* Name input */}
                        <div className="md:col-span-3">
                          <Input
                            value={column.name}
                            onChange={(e) => updateColumn(table.id, column.id, { name: e.target.value.toLowerCase() })}
                            placeholder="Kolon adı"
                            className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-950 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all font-semibold"
                          />
                        </div>

                        {/* Type input */}
                        <div className="md:col-span-2">
                          <Input
                            value={column.type}
                            onChange={(e) => updateColumn(table.id, column.id, { type: e.target.value.toLowerCase() })}
                            placeholder="Tip (bigint, varchar)"
                            className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-950 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all font-semibold"
                          />
                        </div>

                        {/* PK Checkbox container */}
                        <div className="md:col-span-1">
                          <label
                            className={cn(
                              'flex h-9 items-center justify-center rounded-xl border text-xs font-black cursor-pointer select-none transition-all shadow-sm',
                              column.isPrimary
                                ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                : 'border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-black/10 text-slate-500 dark:text-slate-400'
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={column.isPrimary}
                              onChange={(e) => updateColumn(table.id, column.id, { isPrimary: e.target.checked })}
                              className="mr-1 accent-amber-500"
                            />
                            PK
                          </label>
                        </div>

                        {/* FK Checkbox container */}
                        <div className="md:col-span-1">
                          <label
                            className={cn(
                              'flex h-9 items-center justify-center rounded-xl border text-xs font-black cursor-pointer select-none transition-all shadow-sm',
                              column.isForeign
                                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400'
                                : 'border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-black/10 text-slate-500 dark:text-slate-400'
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={column.isForeign}
                              onChange={(e) => {
                                const checked = e.target.checked
                                updateColumn(table.id, column.id, {
                                  isForeign: checked,
                                  referencesTable: checked ? '' : undefined,
                                  referencesColumn: checked ? '' : undefined,
                                })
                              }}
                              className="mr-1 accent-cyan-500"
                            />
                            FK
                          </label>
                        </div>

                        {/* Akıllı FK Seçimi (Cascading Dropdowns) */}
                        {column.isForeign && (
                          <div className="md:col-span-2">
                            <Select
                              value={column.referencesTable || ''}
                              onChange={(val) => {
                                const targetTableObj = schemaData.tables.find((t) => t.name === val)
                                const firstCol =
                                  targetTableObj && targetTableObj.columns.length > 0
                                    ? targetTableObj.columns[0].name
                                    : 'id'
                                updateColumn(table.id, column.id, {
                                  referencesTable: val,
                                  referencesColumn: firstCol,
                                })
                              }}
                              options={[
                                { label: '-- Hedef Tablo --', value: '' },
                                ...schemaData.tables.map((t) => ({ label: t.name, value: t.name })),
                              ]}
                              triggerClassName="py-1 min-h-[32px] rounded-lg"
                            />
                          </div>
                        )}

                        {column.isForeign && (
                          <div className="md:col-span-2">
                            <Select
                              value={column.referencesColumn || ''}
                              onChange={(val) => updateColumn(table.id, column.id, { referencesColumn: val })}
                              disabled={!column.referencesTable}
                              options={[
                                { label: '-- Hedef Kolon --', value: '' },
                                ...(column.referencesTable
                                  ? (schemaData.tables
                                      .find((t) => t.name === column.referencesTable)
                                      ?.columns.map((c) => ({ label: c.name, value: c.name })) || [])
                                  : []),
                              ]}
                              triggerClassName="py-1 min-h-[32px] rounded-lg"
                            />
                          </div>
                        )}

                        {/* Placeholder if not FK */}
                        {!column.isForeign && <div className="md:col-span-4" />}

                        {/* Delete Column button */}
                        <div className="md:col-span-1 flex justify-end">
                          <SketchButton
                            tone="destructive"
                            onClick={() => deleteColumn(table.id, column.id)}
                            className="h-8 w-8 p-0 rounded-xl"
                            title="Kolonu Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </SketchButton>
                        </div>
                      </div>

                      {/* Relationship Summary Badge */}
                      {column.isForeign && column.referencesTable && column.referencesColumn && (
                        <div className="mt-1 px-1 border-t border-slate-200/20 pt-1.5 animate-in fade-in duration-200">
                          <div className="bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 text-[10px] px-3 py-1 rounded-lg border border-cyan-100/50 dark:border-cyan-900/30 inline-flex items-center gap-2 font-bold shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-ping shrink-0" />
                            İlişki: <span className="font-mono">{table.name.toLowerCase()}.{column.name.toLowerCase()}</span> ➔ <span className="font-mono">{column.referencesTable.toLowerCase()}.{column.referencesColumn.toLowerCase()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {table.columns.length === 0 && (
                    <p className="text-[10px] text-zinc-400 italic text-center py-2">Kolon eklenmemiş.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── MODÜL D: VERİTABANI NOTLARI VIEW ───────────────────────── */}
        {activeTab === 'notes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
            {/* Left: Editor */}
            <div className="lg:col-span-6 space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Not Defteri (Markdown)
                </span>
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-450 italic flex items-center gap-1.5">
                  {isSavingNotes ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      Otomatik Kaydedildi
                    </>
                  )}
                </span>
              </div>
              <Textarea
                value={localNotes}
                onChange={handleNotesChange}
                placeholder={`# Veritabanı Mimarisi

- Optimizasyonlar:
  - user_id kolonu indekslenmeli.

\`\`\`sql
CREATE INDEX idx_project_user ON project(user_id);
\`\`\``}
                className="w-full min-h-[400px] bg-white/50 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 text-slate-950 dark:text-slate-100 text-xs font-mono leading-relaxed focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all"
              />
            </div>

            {/* Right: Rendered Preview */}
            <div className="lg:col-span-6 space-y-2">
              <span className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">
                Doküman Önizleme
              </span>
              <div className="w-full min-h-[400px] bg-slate-50/30 dark:bg-black/20 border border-slate-200/50 dark:border-slate-900 rounded-3xl p-6 overflow-y-auto max-h-[500px]">
                {renderMarkdown(localNotes)}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
