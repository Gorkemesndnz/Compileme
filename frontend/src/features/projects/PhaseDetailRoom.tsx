import React, { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckSquare,
  Copy,
  Database,
  FileCode,
  FileText,
  Link2,
  ListChecks,
  Plus,
  Square,
  Trash2,
  StickyNote,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Code2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Project,
  ProjectPhase,
  ProjectDocument,
  DocumentType,
  DocumentFormat,
  ProjectSnippet,
  SnippetCategory,
  ProjectLink,
  LinkType,
  LinkCategory,
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
} from '../../api/projects'
import {
  Task,
  useTasks,
  useCreateTask,
  useToggleTaskComplete,
  useDeleteTask,
  useUpdateTask,
} from '../../api/tasks'
import { Button as MovingBorderButton } from '../../components/ui/moving-border'
import { SketchButton } from '../../components/ui/SketchButton'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { cn } from '../../lib/utils'

interface PhaseDetailRoomProps {
  project: Project
  phase: ProjectPhase
  onClose: () => void
}

type DetailTab = 'tasks' | 'schema' | 'docs'
type SchemaView = 'diagram' | 'code' | 'tables'

interface DbColumn {
  id: string
  name: string
  type: string
  isPrimary: boolean
  isForeign: boolean
  referencesTable?: string
  referencesColumn?: string
}

interface DbTable {
  id: string
  name: string
  columns: DbColumn[]
}

interface DbSchemaDocument {
  version: 1
  tables: DbTable[]
}

const emptySchema = (): DbSchemaDocument => ({
  version: 1,
  tables: [],
})

function parseSchemaDocument(content?: string): DbSchemaDocument {
  if (!content) return emptySchema()
  try {
    const parsed = JSON.parse(content) as Partial<DbSchemaDocument>
    return {
      version: 1,
      tables: Array.isArray(parsed.tables) ? parsed.tables : [],
    }
  } catch (error) {
    return emptySchema()
  }
}

function generateMermaid(schema: DbSchemaDocument) {
  if (schema.tables.length === 0) return '%% Tablo bulunmamaktadır'
  const tableBlocks = schema.tables.map((table) => {
    const cols = table.columns
      .map((col) => {
        const pk = col.isPrimary ? 'PK' : ''
        const fk = col.isForeign ? 'FK' : ''
        const key = [pk, fk].filter(Boolean).join(',')
        return `    ${col.type} ${col.name} ${key ? `"${key}"` : ''}`
      })
      .join('\n')
    return `  ${table.name} {\n${cols}\n  }`
  })

  const relations = schema.tables.flatMap((table) =>
    table.columns
      .filter((column) => column.isForeign && column.referencesTable)
      .map((column) => `  ${column.referencesTable} ||--|{ ${table.name} : "${column.name}"`)
  )

  return `erDiagram\n${tableBlocks.join('\n')}\n${relations.join('\n')}`
}

function parseDatePart(part: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part

  const dotMatch = part.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/)
  if (dotMatch) {
    const day = dotMatch[1].padStart(2, '0')
    const month = dotMatch[2].padStart(2, '0')
    let year = dotMatch[3]
    if (year.length === 2) year = '20' + year
    return `${year}-${month}-${day}`
  }

  const months: Record<string, string> = {
    ocak: '01', subat: '02', mart: '03', nisan: '04', mayis: '05', haziran: '06',
    temmuz: '07', agustos: '08', eylul: '09', ekim: '10', kasim: '11', aralik: '12'
  }
  const lower = part.toLowerCase()
  for (const [mName, mNum] of Object.entries(months)) {
    if (lower.includes(mName)) {
      const dayMatch = lower.match(/\d+/)
      if (dayMatch) {
        const day = dayMatch[0].padStart(2, '0')
        const year = new Date().getFullYear().toString()
        return `${year}-${mNum}-${day}`
      }
    }
  }
  return null
}

export const PhaseDetailRoom: React.FC<PhaseDetailRoomProps> = ({
  project,
  phase,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('tasks')
  const [schemaView, setSchemaView] = useState<SchemaView>('diagram')

  // Queries
  const { data: projectTasks = [] } = useTasks({ projectId: project.id })
  const { data: documents = [] } = useProjectDocuments(project.id)
  const { data: snippets = [] } = useProjectSnippets(project.id)
  const { data: links = [] } = useProjectLinks(project.id)

  // Mutations
  const createTaskMutation = useCreateTask()
  const toggleTaskMutation = useToggleTaskComplete()
  const deleteTaskMutation = useDeleteTask()
  const updateTaskMutation = useUpdateTask()

  const addDocumentMutation = useAddProjectDocument()
  const updateDocumentMutation = useUpdateProjectDocument()
  const deleteDocumentMutation = useDeleteProjectDocument(project.id)

  const addSnippetMutation = useAddProjectSnippet()
  const deleteSnippetMutation = useDeleteProjectSnippet(project.id)

  const addLinkMutation = useAddProjectLink()
  const deleteLinkMutation = useDeleteProjectLink(project.id)

  // Filter tasks to this phase
  const phaseTasks = useMemo(() => {
    return projectTasks.filter((t) => t.phaseId === phase.id)
  }, [projectTasks, phase.id])

  // DB Schema Document specific to this phase
  const dbSchemaDoc = useMemo(() => {
    return documents.find(
      (doc) => doc.type === 'DB_SCHEMA' && doc.title === `DB_SCHEMA_PHASE_${phase.id}`
    )
  }, [documents, phase.id])

  const [schema, setSchema] = useState<DbSchemaDocument>(emptySchema)
  const mermaidCode = useMemo(() => generateMermaid(schema), [schema])

  // Sync schema state when document loads
  useEffect(() => {
    setSchema(parseSchemaDocument(dbSchemaDoc?.content))
  }, [dbSchemaDoc?.id, dbSchemaDoc?.content])

  // Form states
  const [taskInput, setTaskInput] = useState('')
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)
  const [taskNotes, setTaskNotes] = useState<Record<number, string>>({})

  // Resources forms states
  const [snippetTitle, setSnippetTitle] = useState('')
  const [snippetLanguage, setSnippetLanguage] = useState('typescript')
  const [snippetCode, setSnippetCode] = useState('')
  const [snippetDesc, setSnippetDesc] = useState('')
  const [snippetCat, setSnippetCat] = useState<SnippetCategory>('BACKEND')

  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkType, setLinkType] = useState<LinkType>('REFERENCE')
  const [linkCat, setLinkCat] = useState<LinkCategory>('OTHER')
  const [linkNotes, setLinkNotes] = useState('')

  // Loading states for submissions
  const [isSubmittingTask, setIsSubmittingTask] = useState(false)
  const [isSavingSchema, setIsSavingSchema] = useState(false)
  const [isSubmittingSnippet, setIsSubmittingSnippet] = useState(false)
  const [isSubmittingLink, setIsSubmittingLink] = useState(false)

  // Sync task notes local state
  useEffect(() => {
    const notesMap: Record<number, string> = {}
    phaseTasks.forEach((t) => {
      notesMap[t.id] = t.notes || ''
    })
    setTaskNotes(notesMap)
  }, [phaseTasks])

  // Phase specific snippets & links (prefixed with [Faz: phase.id])
  const phaseSnippets = useMemo(() => {
    return snippets.filter((s) => s.title.startsWith(`[Faz: ${phase.id}]`))
  }, [snippets, phase.id])

  const phaseLinks = useMemo(() => {
    return links.filter((l) => l.title.startsWith(`[Faz: ${phase.id}]`))
  }, [links, phase.id])

  // AI Context Copy
  const handleExportAiContext = () => {
    let markdown = `# Proje: ${project.name}\n`
    markdown += `## Faz: ${phase.name}\n`
    if (phase.description) {
      markdown += `**Açıklama:** ${phase.description}\n\n`
    }

    markdown += `### Görevler ve Durumları\n`
    if (phaseTasks.length > 0) {
      phaseTasks.forEach((task, idx) => {
        const statusSymbol = task.status === 'DONE' ? '[x]' : '[ ]'
        markdown += `${idx + 1}. ${statusSymbol} ${task.title}\n`
        if (task.notes) {
          markdown += `   - **Mühendislik Notları:** ${task.notes}\n`
        }
      })
    } else {
      markdown += `*Bu faz için henüz görev eklenmemiştir.*\n`
    }
    markdown += `\n`

    markdown += `### Veritabanı Şeması (Mermaid ER)\n`
    if (schema.tables.length > 0) {
      markdown += '```mermaid\n' + mermaidCode + '\n```\n\n'
    } else {
      markdown += `*Bu faz için tanımlanmış veritabanı tablosu bulunmamaktadır.*\n\n`
    }

    if (phaseSnippets.length > 0) {
      markdown += `### Kod Parçacıkları (Snippets)\n`
      phaseSnippets.forEach((snippet) => {
        const displayTitle = snippet.title.replace(`[Faz: ${phase.id}] `, '')
        markdown += `#### ${displayTitle} (${snippet.language || 'text'})\n`
        if (snippet.description) {
          markdown += `*Açıklama: ${snippet.description}*\n`
        }
        markdown += `\`\`\`${snippet.language || ''}\n${snippet.code}\n\`\`\`\n\n`
      })
    }

    if (phaseLinks.length > 0) {
      markdown += `### Referans Kaynaklar ve Bağlantılar\n`
      phaseLinks.forEach((link) => {
        const displayTitle = link.title.replace(`[Faz: ${phase.id}] `, '')
        markdown += `- [${displayTitle}](${link.url})${link.notes ? ` - *${link.notes}*` : ''}\n`
      })
    }

    navigator.clipboard
      .writeText(markdown)
      .then(() => {
        toast.success('Faz hafızası Markdown olarak panoya kopyalandı! 🚀')
      })
      .catch(() => {
        toast.error('Kopyalama başarısız oldu.')
      })
  }

  // Tasks handlers
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskInput.trim() || isSubmittingTask) return
    setIsSubmittingTask(true)

    const todayStr = new Date().toLocaleDateString('sv-SE')
    let title = taskInput.trim()
    let dateStr = todayStr

    if (taskInput.includes('|')) {
      const parts = taskInput.split('|')
      const datePart = parts[0].trim()
      title = parts[1].trim()
      dateStr = parseDatePart(datePart) || todayStr
    }

    try {
      await createTaskMutation.mutateAsync({
        title,
        status: 'TODO',
        kind: 'PROJECT',
        projectId: project.id,
        phaseId: phase.id,
        scheduledDate: dateStr,
        planningBucket: 'DAY',
      })
      setTaskInput('')
      toast.success('Görev bu faza eklendi ve takvime senkronize edildi.')
    } catch {
      toast.error('Görev eklenirken bir hata oluştu.')
    } finally {
      setIsSubmittingTask(false)
    }
  }

  const handleSaveNotes = async (taskId: number) => {
    const noteContent = taskNotes[taskId] || ''
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        request: { notes: noteContent },
      })
      toast.success('Mühendislik notları kaydedildi.')
    } catch {
      toast.error('Notlar kaydedilirken hata oluştu.')
    }
  }

  // DB Schema Handlers
  const handleSaveSchema = async () => {
    if (isSavingSchema) return
    setIsSavingSchema(true)

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
        await addDocumentMutation.mutateAsync(request)
        toast.success('Şema başarıyla kaydedildi.')
      }
    } catch {
      toast.error('Şema kaydedilirken hata oluştu.')
    } finally {
      setIsSavingSchema(false)
    }
  }

  const addSchemaTable = () => {
    setSchema((current) => ({
      ...current,
      tables: [
        ...current.tables,
        {
          id: Math.random().toString(36).substring(2, 9),
          name: 'yeni_tablo',
          columns: [
            {
              id: Math.random().toString(36).substring(2, 9),
              name: 'id',
              type: 'INTEGER',
              isPrimary: true,
              isForeign: false,
            },
          ],
        },
      ],
    }))
  }

  const updateSchemaTable = (tableId: string, name: string) => {
    setSchema((current) => ({
      ...current,
      tables: current.tables.map((t) => (t.id === tableId ? { ...t, name } : t)),
    }))
  }

  const deleteSchemaTable = (tableId: string) => {
    setSchema((current) => ({
      ...current,
      tables: current.tables.filter((t) => t.id !== tableId),
    }))
  }

  const addSchemaColumn = (tableId: string) => {
    setSchema((current) => ({
      ...current,
      tables: current.tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              columns: [
                ...t.columns,
                {
                  id: Math.random().toString(36).substring(2, 9),
                  name: 'yeni_kolon',
                  type: 'VARCHAR',
                  isPrimary: false,
                  isForeign: false,
                },
              ],
            }
          : t
      ),
    }))
  }

  const updateSchemaColumn = (tableId: string, columnId: string, patch: Partial<DbColumn>) => {
    setSchema((current) => ({
      ...current,
      tables: current.tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              columns: t.columns.map((c) => (c.id === columnId ? { ...c, ...patch } : c)),
            }
          : t
      ),
    }))
  }

  const deleteSchemaColumn = (tableId: string, columnId: string) => {
    setSchema((current) => ({
      ...current,
      tables: current.tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              columns: t.columns.filter((c) => c.id !== columnId),
            }
          : t
      ),
    }))
  }

  // Snippets Handlers
  const handleAddSnippet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!snippetTitle.trim() || !snippetCode.trim() || isSubmittingSnippet) return
    setIsSubmittingSnippet(true)

    try {
      await addSnippetMutation.mutateAsync({
        title: `[Faz: ${phase.id}] ${snippetTitle.trim()}`,
        language: snippetLanguage,
        code: snippetCode,
        description: snippetDesc || undefined,
        category: snippetCat,
      })
      setSnippetTitle('')
      setSnippetCode('')
      setSnippetDesc('')
      toast.success('Kod parçacığı faza eklendi.')
    } catch {
      toast.error('Kod parçacığı eklenirken hata oluştu.')
    } finally {
      setIsSubmittingSnippet(false)
    }
  }

  // Links Handlers
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkTitle.trim() || !linkUrl.trim() || isSubmittingLink) return
    setIsSubmittingLink(true)

    try {
      await addLinkMutation.mutateAsync({
        title: `[Faz: ${phase.id}] ${linkTitle.trim()}`,
        url: linkUrl.trim(),
        type: linkType,
        category: linkCat,
        notes: linkNotes || undefined,
      })
      setLinkTitle('')
      setLinkUrl('')
      setLinkNotes('')
      toast.success('Referans kaynak faza eklendi.')
    } catch {
      toast.error('Kaynak eklenirken hata oluştu.')
    } finally {
      setIsSubmittingLink(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => toast.success('Kod kopyalandı!'))
      .catch(() => toast.error('Kopyalanamadı.'))
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Üst Bar Hiyerarşi ve Hafıza Kopyalama */}
      <div className="flex flex-col gap-4 border-b border-border/40 pb-5">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Proje Anasayfasına Dön
        </button>
        
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
              <span>{project.name}</span>
              <span>&gt;</span>
              <span className="text-cyan-500 dark:text-cyan-400 font-bold">{phase.name}</span>
            </div>
            <h2 className="mt-2 text-2xl font-black text-neutral-900 dark:text-white">
              {phase.name} Komuta Odası
            </h2>
          </div>

          <MovingBorderButton
            onClick={handleExportAiContext}
            borderRadius="0.75rem"
            duration={2500}
            containerClassName="h-10 px-4 cursor-pointer mt-2 sm:mt-0"
            className="font-bold flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-cyan-400" />
            Faz Hafızasını Kopyala
          </MovingBorderButton>
        </div>
      </div>

      {/* Oda Sekmeleri */}
      <section className="glass-panel rounded-2xl p-1.5 flex gap-2 w-fit max-w-full overflow-x-auto border border-border/40 backdrop-blur-xl">
        {[
          { id: 'tasks', label: 'Görevler & Yapılacaklar', icon: ListChecks },
          { id: 'schema', label: 'DB Schema Studio', icon: Database },
          { id: 'docs', label: 'Teknik Hafıza & Kaynaklar', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DetailTab)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black transition-all',
                activeTab === tab.id
                  ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200'
                  : 'border-transparent bg-transparent text-neutral-400 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </section>

      {/* SEKME 1: Görev Çizelgesi */}
      {activeTab === 'tasks' && (
        <div className="grid gap-6 lg:grid-cols-3 w-full">
          {/* Görev Ekleme ve Liste (2/3 Genişlik) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-border/40 backdrop-blur-xl space-y-5">
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <ListChecks className="h-5 w-5 text-emerald-500" />
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  Faz Görev Listesi
                </h3>
              </div>

              {/* Hızlı Tarihli Görev Formu */}
              <form onSubmit={handleAddTask} className="flex gap-2">
                <Input
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="Örn: 22 Haziran | OpenWeatherMap API'sini incele..."
                  className="bg-neutral-50 dark:bg-neutral-950/50"
                  disabled={isSubmittingTask}
                />
                <MovingBorderButton
                  borderRadius="0.75rem"
                  duration={2000}
                  containerClassName="h-10 w-20 cursor-pointer shrink-0"
                  className="font-bold"
                  type="submit"
                  disabled={isSubmittingTask}
                >
                  <Plus className="h-4 w-4" />
                </MovingBorderButton>
              </form>

              {/* Görevler Listesi */}
              <div className="space-y-3">
                {phaseTasks.map((task) => {
                  const isExpanded = expandedTaskId === task.id
                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-border/40 bg-card/45 p-4 space-y-3 backdrop-blur-sm transition-all hover:border-cyan-500/20"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleTaskMutation.mutate(task.id)}
                            className="mt-0.5 shrink-0 text-zinc-400 hover:text-cyan-500 transition-colors"
                          >
                            {task.status === 'DONE' ? (
                              <CheckSquare className="h-5 w-5 text-cyan-500" />
                            ) : (
                              <Square className="h-5 w-5" />
                            )}
                          </button>
                          
                          <div className="min-w-0">
                            <p className={cn(
                              'font-bold text-sm text-neutral-900 dark:text-neutral-100 break-words leading-relaxed',
                              task.status === 'DONE' && 'line-through text-neutral-400 dark:text-neutral-500'
                            )}>
                              {task.title}
                            </p>
                            
                            {task.scheduledDate && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-neutral-400">
                                <Calendar className="h-3 w-3" />
                                <span>{task.scheduledDate}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                            className="p-1 rounded hover:bg-neutral-500/10 text-neutral-400 hover:text-white transition-colors"
                            title="Mühendislik Notlarını Göster"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          
                          <SketchButton
                            type="button"
                            onClick={() => deleteTaskMutation.mutate(task.id)}
                            tone="destructive"
                            className="h-7 w-7 p-0 flex items-center justify-center"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </SketchButton>
                        </div>
                      </div>

                      {/* Genişletilebilir Not Alanı */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-border/20 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                            <StickyNote className="h-3.5 w-3.5 text-violet-400" />
                            <span className="font-bold">Mühendislik Notları / AI Context Notu</span>
                          </div>
                          
                          <Textarea
                            value={taskNotes[task.id] || ''}
                            onChange={(e) => setTaskNotes({ ...taskNotes, [task.id]: e.target.value })}
                            placeholder="Bu görevle ilgili AR-GE bulgularını veya notları yazın..."
                            className="h-24 text-xs font-mono bg-neutral-50/50 dark:bg-neutral-950/40"
                          />
                          
                          <div className="flex justify-end">
                            <SketchButton
                              type="button"
                              onClick={() => handleSaveNotes(task.id)}
                            >
                              Notları Kaydet
                            </SketchButton>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {phaseTasks.length === 0 && (
                  <div className="text-center py-10 border border-dashed border-border/40 rounded-xl">
                    <p className="text-xs text-neutral-400 italic">
                      Bu faza ait görev eklenmedi. Yukarıdaki kutudan hızlıca ekleyebilirsiniz.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Notları Açıklama (1/3 Genişlik) */}
          <div className="space-y-6">
            <div className="glass-panel p-5 rounded-2xl border border-border/40 backdrop-blur-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
                <h4 className="font-bold text-xs tracking-wider uppercase text-neutral-800 dark:text-neutral-200">
                  Komuta Odası Kılavuzu
                </h4>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Bu alana eklediğiniz görevler backend'deki takvim ve günlük todo listeleriyle entegre olur.
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Her görevin altındaki <strong>Mühendislik Notları</strong> alanına ekleyeceğiniz kod, db veya test analizleri <strong>AI Context Copy</strong> ile tek tıkla kopyalanır ve yapay zeka ile geliştirme yaparken en doğru yönlendirmeyi yapmanızı sağlar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SEKME 2: DB Schema Studio */}
      {activeTab === 'schema' && (
        <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-border/40 backdrop-blur-xl space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
            <div className="flex items-center gap-2.5">
              <Database className="h-5 w-5 text-cyan-500" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                DB Schema Studio
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-xl border border-border/60 bg-neutral-950/40 p-1">
                {(['diagram', 'code', 'tables'] as SchemaView[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => setSchemaView(view)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-black transition-all',
                      schemaView === view
                        ? 'bg-cyan-400/15 text-cyan-200'
                        : 'text-neutral-400 hover:text-white'
                    )}
                  >
                    {view === 'diagram' ? 'Diyagram' : view === 'code' ? 'Kod' : 'Tablolar'}
                  </button>
                ))}
              </div>

              <MovingBorderButton
                onClick={addSchemaTable}
                borderRadius="0.5rem"
                duration={1800}
                containerClassName="h-9 px-3 cursor-pointer"
                className="font-bold flex items-center gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Tablo
              </MovingBorderButton>

              <MovingBorderButton
                onClick={handleSaveSchema}
                borderRadius="0.5rem"
                duration={2200}
                containerClassName="h-9 px-3 cursor-pointer"
                className="font-bold flex items-center gap-1.5 text-xs"
                disabled={isSavingSchema}
              >
                <Check className="h-3.5 w-3.5" />
                Şemayı Kaydet
              </MovingBorderButton>
            </div>
          </div>

          {/* Görünümler */}
          {schemaView === 'diagram' && (
            <div className="rounded-2xl border border-border/50 bg-white/[0.02] dark:bg-black/20 p-5">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {schema.tables.map((table) => (
                  <div
                    key={table.id}
                    className="overflow-hidden rounded-xl border border-cyan-400/25 bg-neutral-50 dark:bg-neutral-950/80 shadow-md"
                  >
                    <div className="border-b border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-center text-xs font-black uppercase tracking-widest text-cyan-700 dark:text-cyan-100">
                      {table.name}
                    </div>
                    <div className="divide-y divide-border/40">
                      {table.columns.map((column) => (
                        <div
                          key={column.id}
                          className="grid grid-cols-[80px_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-xs"
                        >
                          <span className="font-mono text-neutral-400">{column.type}</span>
                          <span className="truncate font-bold text-neutral-800 dark:text-neutral-100">{column.name}</span>
                          <span className="flex gap-1">
                            {column.isPrimary && (
                              <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-black text-amber-600 dark:text-amber-200">
                                PK
                              </span>
                            )}
                            {column.isForeign && (
                              <span className="rounded bg-cyan-400/15 px-1.5 py-0.5 text-[9px] font-black text-cyan-600 dark:text-cyan-200">
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

              {/* İlişkiler Özeti */}
              {schema.tables.some((t) => t.columns.some((c) => c.isForeign && c.referencesTable)) && (
                <div className="mt-5 border-t border-border/20 pt-4">
                  <h4 className="text-xs font-bold text-neutral-400 mb-2">Foreign Key İlişkileri</h4>
                  <div className="flex flex-wrap gap-2">
                    {schema.tables.flatMap((table) =>
                      table.columns
                        .filter((c) => c.isForeign && c.referencesTable)
                        .map((c, index) => (
                          <span
                            key={`${table.name}-${c.name}-${index}`}
                            className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black text-cyan-700 dark:text-cyan-100"
                          >
                            {`${c.referencesTable} -> ${table.name}.${c.name}`}
                          </span>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {schemaView === 'code' && (
            <pre className="max-h-[500px] overflow-auto rounded-2xl border border-border/60 bg-neutral-50 dark:bg-neutral-950/70 p-4 text-xs leading-relaxed text-neutral-800 dark:text-cyan-100 font-mono">
              {mermaidCode}
            </pre>
          )}

          {schemaView === 'tables' && (
            <div className="space-y-4">
              {schema.tables.map((table) => (
                <div
                  key={table.id}
                  className="rounded-2xl border border-zinc-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-950/35 p-4 space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={table.name}
                      onChange={(e) => updateSchemaTable(table.id, e.target.value)}
                      className="bg-background font-black text-sm"
                    />
                    
                    <MovingBorderButton
                      onClick={() => addSchemaColumn(table.id)}
                      borderRadius="0.5rem"
                      duration={1500}
                      containerClassName="h-9 px-3 cursor-pointer shrink-0"
                      className="text-xs font-bold"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Kolon
                    </MovingBorderButton>

                    <SketchButton
                      type="button"
                      onClick={() => deleteSchemaTable(table.id)}
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
                            updateSchemaColumn(table.id, column.id, { name: e.target.value })
                          }
                          placeholder="Kolon Adı"
                          className="h-9 bg-background text-xs"
                        />
                        <Input
                          value={column.type}
                          onChange={(e) =>
                            updateSchemaColumn(table.id, column.id, { type: e.target.value })
                          }
                          placeholder="Tip"
                          className="h-9 bg-background text-xs"
                        />
                        
                        <label className="flex h-9 items-center justify-center rounded-lg border border-border bg-neutral-100 dark:bg-neutral-900 text-[10px] font-black text-neutral-500 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={column.isPrimary}
                            onChange={(e) =>
                              updateSchemaColumn(table.id, column.id, { isPrimary: e.target.checked })
                            }
                            className="mr-1 accent-cyan-500"
                          />
                          PK
                        </label>
                        
                        <label className="flex h-9 items-center justify-center rounded-lg border border-border bg-neutral-100 dark:bg-neutral-900 text-[10px] font-black text-neutral-500 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={column.isForeign}
                            onChange={(e) =>
                              updateSchemaColumn(table.id, column.id, { isForeign: e.target.checked })
                            }
                            className="mr-1 accent-cyan-500"
                          />
                          FK
                        </label>

                        <Input
                          value={column.referencesTable || ''}
                          onChange={(e) =>
                            updateSchemaColumn(table.id, column.id, {
                              referencesTable: e.target.value || undefined,
                            })
                          }
                          placeholder="Ref Tablo"
                          className="h-9 bg-background text-xs"
                          disabled={!column.isForeign}
                        />
                        <Input
                          value={column.referencesColumn || ''}
                          onChange={(e) =>
                            updateSchemaColumn(table.id, column.id, {
                              referencesColumn: e.target.value || undefined,
                            })
                          }
                          placeholder="Ref Kolon"
                          className="h-9 bg-background text-xs"
                          disabled={!column.isForeign}
                        />

                        <SketchButton
                          type="button"
                          onClick={() => deleteSchemaColumn(table.id, column.id)}
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
            </div>
          )}
        </div>
      )}

      {/* SEKME 3: Teknik Hafıza & Kaynaklar */}
      {activeTab === 'docs' && (
        <div className="grid gap-6 lg:grid-cols-2 w-full">
          {/* Snippets Bölümü */}
          <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-border/40 backdrop-blur-xl space-y-5">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <FileCode className="h-5 w-5 text-cyan-500" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Kod Parçacıkları (Snippets)
              </h3>
            </div>

            {/* Yeni Snippet Formu */}
            <form onSubmit={handleAddSnippet} className="space-y-3 border border-border/30 bg-neutral-500/5 p-4 rounded-xl">
              <div className="grid gap-2 grid-cols-2">
                <Input
                  value={snippetTitle}
                  onChange={(e) => setSnippetTitle(e.target.value)}
                  placeholder="Kod Başlığı"
                  className="bg-background text-xs h-9"
                  disabled={isSubmittingSnippet}
                />
                <Input
                  value={snippetLanguage}
                  onChange={(e) => setSnippetLanguage(e.target.value)}
                  placeholder="Dil (örn: java, ts, sql)"
                  className="bg-background text-xs h-9"
                  disabled={isSubmittingSnippet}
                />
              </div>
              <Input
                value={snippetDesc}
                onChange={(e) => setSnippetDesc(e.target.value)}
                placeholder="Açıklama"
                className="bg-background text-xs h-9"
                disabled={isSubmittingSnippet}
              />
              <Textarea
                value={snippetCode}
                onChange={(e) => setSnippetCode(e.target.value)}
                placeholder="Kodları yapıştırın..."
                className="h-28 text-xs font-mono bg-background"
                disabled={isSubmittingSnippet}
              />
              <div className="flex items-center justify-between">
                <select
                  value={snippetCat}
                  onChange={(e) => setSnippetCat(e.target.value as SnippetCategory)}
                  className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none text-neutral-700 dark:text-neutral-300"
                  disabled={isSubmittingSnippet}
                >
                  <option value="BACKEND">Backend</option>
                  <option value="FRONTEND">Frontend</option>
                  <option value="OTHER">Diğer</option>
                </select>
                
                <SketchButton type="submit" disabled={isSubmittingSnippet}>
                  Snippet Ekle
                </SketchButton>
              </div>
            </form>

            {/* Snippet Listesi */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {phaseSnippets.map((snippet) => {
                const displayTitle = snippet.title.replace(`[Faz: ${phase.id}] `, '')
                return (
                  <div
                    key={snippet.id}
                    className="rounded-xl border border-border/40 bg-card/45 p-4 space-y-2 relative group/snip"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                          {displayTitle}
                        </h4>
                        {snippet.description && (
                          <p className="text-[10px] text-neutral-400 mt-0.5">{snippet.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(snippet.code)}
                          className="p-1 rounded hover:bg-neutral-500/10 text-neutral-400 hover:text-white transition-colors"
                          title="Kodu Kopyala"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <SketchButton
                          type="button"
                          onClick={() => deleteSnippetMutation.mutate(snippet.id)}
                          tone="destructive"
                          className="h-6 w-6 p-0 flex items-center justify-center shrink-0 opacity-0 group-hover/snip:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </SketchButton>
                      </div>
                    </div>
                    
                    <pre className="max-h-32 overflow-auto rounded bg-black/40 p-2.5 text-[10px] leading-4 text-cyan-200/90 font-mono">
                      {snippet.code}
                    </pre>
                  </div>
                )
              })}

              {phaseSnippets.length === 0 && (
                <div className="text-center py-8 border border-dashed border-border/40 rounded-xl">
                  <p className="text-xs text-neutral-400 italic">Henüz kod parçası eklenmemiş.</p>
                </div>
              )}
            </div>
          </div>

          {/* Kaynaklar / Bağlantılar Bölümü */}
          <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-border/40 backdrop-blur-xl space-y-5">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <Link2 className="h-5 w-5 text-emerald-500" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Kaynaklar & Referans Linkleri
              </h3>
            </div>

            {/* Yeni Link Formu */}
            <form onSubmit={handleAddLink} className="space-y-3 border border-border/30 bg-neutral-500/5 p-4 rounded-xl">
              <div className="grid gap-2 grid-cols-2">
                <Input
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Başlık (örn: API Dökümanı)"
                  className="bg-background text-xs h-9"
                  disabled={isSubmittingLink}
                />
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="URL (https://...)"
                  className="bg-background text-xs h-9"
                  disabled={isSubmittingLink}
                />
              </div>
              <Input
                value={linkNotes}
                onChange={(e) => setLinkNotes(e.target.value)}
                placeholder="Özel Notlar"
                className="bg-background text-xs h-9"
                disabled={isSubmittingLink}
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <select
                    value={linkType}
                    onChange={(e) => setLinkType(e.target.value as LinkType)}
                    className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none text-neutral-700 dark:text-neutral-300"
                    disabled={isSubmittingLink}
                  >
                    <option value="REFERENCE">Referans</option>
                    <option value="DESIGN">Tasarım</option>
                    <option value="REPO">Repo</option>
                    <option value="OTHER">Diğer</option>
                  </select>
                  <select
                    value={linkCat}
                    onChange={(e) => setLinkCat(e.target.value as LinkCategory)}
                    className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none text-neutral-700 dark:text-neutral-300"
                    disabled={isSubmittingLink}
                  >
                    <option value="BACKEND">Backend</option>
                    <option value="FRONTEND">Frontend</option>
                    <option value="OTHER">Diğer</option>
                  </select>
                </div>

                <SketchButton type="submit" disabled={isSubmittingLink}>
                  Kaynak Ekle
                </SketchButton>
              </div>
            </form>

            {/* Link Listesi */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {phaseLinks.map((link) => {
                const displayTitle = link.title.replace(`[Faz: ${phase.id}] `, '')
                return (
                  <div
                    key={link.id}
                    className="rounded-xl border border-border/40 bg-card/45 p-3 flex items-center justify-between gap-3 group/link hover:border-emerald-500/20 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-xs text-neutral-800 dark:text-neutral-200 hover:text-cyan-500 transition-colors flex items-center gap-1 truncate"
                        >
                          {displayTitle}
                          <ExternalLink className="h-3 w-3 inline shrink-0" />
                        </a>
                        <span className="rounded-full bg-neutral-100 dark:bg-neutral-900 border border-border/40 px-2 py-0.5 text-[8px] font-bold text-neutral-400 uppercase">
                          {link.type}
                        </span>
                      </div>
                      {link.notes && (
                        <p className="text-[10px] text-neutral-400 mt-1 font-mono">{link.notes}</p>
                      )}
                    </div>

                    <SketchButton
                      type="button"
                      onClick={() => deleteLinkMutation.mutate(link.id)}
                      tone="destructive"
                      className="h-7 w-7 p-0 flex items-center justify-center shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </SketchButton>
                  </div>
                )
              })}

              {phaseLinks.length === 0 && (
                <div className="text-center py-8 border border-dashed border-border/40 rounded-xl">
                  <p className="text-xs text-neutral-400 italic">Henüz kaynak/referans eklenmemiş.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
