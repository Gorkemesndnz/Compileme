import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowUp,
  ArrowDown,
  Braces,
  CalendarDays,
  Check,
  Clipboard,
  Code2,
  Copy,
  Database,
  FileArchive,
  FileCode,
  FileText,
  Folder,
  GitBranch,
  Layers3,
  Link as LinkIcon,
  ListChecks,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  SquarePen,
  Trash2,
  Upload,
} from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { GlassButton } from '../../components/ui/glass-button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { cn } from '../../lib/utils'
import {
  DocumentFormat,
  DocumentType,
  LinkCategory,
  LinkType,
  Project,
  ProjectDocument,
  ProjectPhase,
  ProjectRequest,
  ProjectStatus,
  SnippetCategory,
  TechnologyCategory,
  useAddProjectDocument,
  useAddProjectLink,
  useAddProjectPhase,
  useAddProjectSnippet,
  useAddProjectTechnology,
  useCreateProject,
  useDeleteProject,
  useDeleteProjectDocument,
  useDeleteProjectLink,
  useDeleteProjectPhase,
  useDeleteProjectSnippet,
  useDeleteProjectTechnology,
  useProjectDocuments,
  useProjectLinks,
  useProjectPhases,
  useProjectSnippets,
  useProjectTechnologies,
  useProjects,
  useReorderProjectPhases,
  useUpdateProject,
  useUpdateProjectDocument,
  useUpdateProjectPhase,
} from '../../api/projects'
import {
  PlanningBucket,
  Task,
  useCreateTask,
  useDeleteTask,
  useTasks,
  useToggleTaskComplete,
} from '../../api/tasks'
import { useUploadFile } from '../../api/files'

type ProjectTab = 'overview' | 'phases' | 'tasks' | 'stack' | 'schema' | 'documents' | 'snippets' | 'resources'
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

const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: 'Planlama',
  ACTIVE: 'Aktif',
  PAUSED: 'Beklemede',
  DONE: 'Tamamlandi',
}

const STATUS_STYLES: Record<ProjectStatus, string> = {
  PLANNING: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  ACTIVE: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  PAUSED: 'border-neutral-400/30 bg-neutral-400/10 text-neutral-300',
  DONE: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
}

const TECHNOLOGY_LABELS: Record<TechnologyCategory, string> = {
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  MOBILE: 'Mobile',
  DATABASE: 'Database',
  DEVOPS: 'DevOps',
  OTHER: 'Other',
}

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  DB_SCHEMA: 'DB Schema',
  REFACTOR_PLAN: 'Refactor Plan',
  FUTURE_FEATURES: 'Gelecek Ozellik',
  TECH_DOC: 'Tech Doc',
  GENERAL: 'Genel Not',
}

const LINK_TYPE_LABELS: Record<LinkType, string> = {
  DESIGN: 'Design',
  REFERENCE: 'Reference',
  REPO: 'Repo',
  OTHER: 'Other',
}

const tabs: Array<{ id: ProjectTab; label: string; icon: React.ElementType }> = [
  { id: 'overview', label: 'Overview', icon: Folder },
  { id: 'phases', label: 'Fazlar', icon: GitBranch },
  { id: 'tasks', label: 'Gorevler', icon: ListChecks },
  { id: 'stack', label: 'Stack', icon: Layers3 },
  { id: 'schema', label: 'DB Semasi', icon: Database },
  { id: 'documents', label: 'Dokumanlar', icon: FileText },
  { id: 'snippets', label: 'Kodlar', icon: Code2 },
  { id: 'resources', label: 'Kaynaklar', icon: LinkIcon },
]

const emptySchema = (): DbSchemaDocument => ({
  version: 1,
  tables: [
    {
      id: makeId(),
      name: 'app_user',
      columns: [
        { id: makeId(), name: 'id', type: 'bigint', isPrimary: true, isForeign: false },
        { id: makeId(), name: 'display_name', type: 'varchar', isPrimary: false, isForeign: false },
      ],
    },
    {
      id: makeId(),
      name: 'project',
      columns: [
        { id: makeId(), name: 'id', type: 'bigint', isPrimary: true, isForeign: false },
        {
          id: makeId(),
          name: 'user_id',
          type: 'bigint',
          isPrimary: false,
          isForeign: true,
          referencesTable: 'app_user',
          referencesColumn: 'id',
        },
        { id: makeId(), name: 'name', type: 'varchar', isPrimary: false, isForeign: false },
      ],
    },
  ],
})

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function todayString() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().split('T')[0]
}

function normalizeIdentifier(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9_]/g, '_') || 'unnamed'
}

function parseSchemaDocument(content?: string): DbSchemaDocument {
  if (!content) return emptySchema()
  try {
    const parsed = JSON.parse(content) as Partial<DbSchemaDocument>
    if (parsed.version === 1 && Array.isArray(parsed.tables)) {
      return {
        version: 1,
        tables: parsed.tables.map((table) => ({
          id: table.id || makeId(),
          name: table.name || 'table',
          columns: Array.isArray(table.columns)
            ? table.columns.map((column) => ({
                id: column.id || makeId(),
                name: column.name || 'column',
                type: column.type || 'string',
                isPrimary: !!column.isPrimary,
                isForeign: !!column.isForeign,
                referencesTable: column.referencesTable,
                referencesColumn: column.referencesColumn,
              }))
            : [],
        })),
      }
    }
  } catch {
    return emptySchema()
  }
  return emptySchema()
}

function generateMermaid(schema: DbSchemaDocument) {
  const tableBlocks = schema.tables.map((table) => {
    const columns = table.columns.map((column) => {
      const flags = [column.isPrimary ? 'PK' : '', column.isForeign ? 'FK' : ''].filter(Boolean).join(', ')
      return `    ${normalizeIdentifier(column.type)} ${normalizeIdentifier(column.name)}${flags ? ` ${flags}` : ''}`
    })
    return `  ${normalizeIdentifier(table.name).toUpperCase()} {\n${columns.join('\n')}\n  }`
  })

  const relations = schema.tables.flatMap((table) =>
    table.columns
      .filter((column) => column.isForeign && column.referencesTable)
      .map(
        (column) =>
          `  ${normalizeIdentifier(column.referencesTable || '').toUpperCase()} ||--o{ ${normalizeIdentifier(
            table.name
          ).toUpperCase()} : "${normalizeIdentifier(column.name)}"`
      )
  )

  return ['erDiagram', ...relations, ...tableBlocks].join('\n')
}

function getActivePhase(phases: ProjectPhase[]) {
  return phases.find((phase) => phase.status === 'ACTIVE') || phases[0]
}

function completionPercent(tasks: Task[]) {
  if (tasks.length === 0) return 0
  return Math.round((tasks.filter((task) => task.status === 'DONE').length / tasks.length) * 100)
}

function sortByOrder<T extends { orderIndex: number }>(items: T[]) {
  return [...items].sort((a, b) => a.orderIndex - b.orderIndex)
}

export const ProjectsPage: React.FC = () => {
  const today = todayString()
  const [selectedProjectId, setSelectedProjectId] = useState<number>()
  const [activeTab, setActiveTab] = useState<ProjectTab>('overview')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [schemaView, setSchemaView] = useState<SchemaView>('diagram')
  const [schema, setSchema] = useState<DbSchemaDocument>(emptySchema)

  const [projectForm, setProjectForm] = useState<ProjectRequest>({ name: '', description: '', status: 'PLANNING' })
  const [editProjectForm, setEditProjectForm] = useState<ProjectRequest>({ name: '', description: '', status: 'PLANNING' })
  const [phaseForm, setPhaseForm] = useState({ name: '', description: '', status: 'PLANNING' as ProjectStatus, startDate: '', endDate: '' })
  const [taskForm, setTaskForm] = useState({ title: '', notes: '', phaseId: '', scheduledDate: '', scheduledTime: '' })
  const [techForm, setTechForm] = useState({ category: 'FRONTEND' as TechnologyCategory, title: '', technology: '', notes: '' })
  const [documentForm, setDocumentForm] = useState({
    title: '',
    type: 'GENERAL' as DocumentType,
    contentFormat: 'MARKDOWN' as DocumentFormat,
    content: '',
  })
  const [snippetForm, setSnippetForm] = useState({ title: '', language: '', code: '', description: '', category: 'BACKEND' as SnippetCategory })
  const [linkForm, setLinkForm] = useState({ title: '', url: '', type: 'REFERENCE' as LinkType, category: 'OTHER' as LinkCategory, notes: '' })

  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId]
  )
  const { data: phases = [] } = useProjectPhases(selectedProjectId)
  const { data: technologies = [] } = useProjectTechnologies(selectedProjectId)
  const { data: snippets = [] } = useProjectSnippets(selectedProjectId)
  const { data: links = [] } = useProjectLinks(selectedProjectId)
  const { data: documents = [] } = useProjectDocuments(selectedProjectId)
  const { data: projectTasks = [] } = useTasks(selectedProjectId ? { projectId: selectedProjectId } : {})
  const { data: todayTasks = [] } = useTasks(selectedProjectId ? { projectId: selectedProjectId, date: today } : {})

  const createProjectMutation = useCreateProject()
  const updateProjectMutation = useUpdateProject()
  const deleteProjectMutation = useDeleteProject()
  const addPhaseMutation = useAddProjectPhase()
  const updatePhaseMutation = useUpdateProjectPhase()
  const deletePhaseMutation = useDeleteProjectPhase(selectedProjectId)
  const reorderPhasesMutation = useReorderProjectPhases(selectedProjectId)
  const createTaskMutation = useCreateTask()
  const toggleTaskMutation = useToggleTaskComplete()
  const deleteTaskMutation = useDeleteTask()
  const addTechnologyMutation = useAddProjectTechnology()
  const deleteTechnologyMutation = useDeleteProjectTechnology(selectedProjectId)
  const addDocumentMutation = useAddProjectDocument()
  const updateDocumentMutation = useUpdateProjectDocument()
  const deleteDocumentMutation = useDeleteProjectDocument(selectedProjectId)
  const addSnippetMutation = useAddProjectSnippet()
  const deleteSnippetMutation = useDeleteProjectSnippet(selectedProjectId)
  const addLinkMutation = useAddProjectLink()
  const deleteLinkMutation = useDeleteProjectLink(selectedProjectId)
  const uploadFileMutation = useUploadFile()

  const sortedPhases = useMemo(() => sortByOrder(phases), [phases])
  const activePhase = getActivePhase(sortedPhases)
  const dbSchemaDoc = documents.find((document) => document.type === 'DB_SCHEMA')
  const refactorDocs = documents.filter((document) => document.type === 'REFACTOR_PLAN')
  const mermaidCode = useMemo(() => generateMermaid(schema), [schema])

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase()
    return projects.filter((project) => {
      const matchesStatus = statusFilter === 'ALL' || project.status === statusFilter
      const matchesSearch =
        !query ||
        project.name.toLowerCase().includes(query) ||
        (project.description || '').toLowerCase().includes(query)
      return matchesStatus && matchesSearch
    })
  }, [projects, search, statusFilter])

  const technologiesByCategory = useMemo(() => {
    return (Object.keys(TECHNOLOGY_LABELS) as TechnologyCategory[]).map((category) => ({
      category,
      technologies: technologies.filter((technology) => technology.category === category),
    }))
  }, [technologies])

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  useEffect(() => {
    if (selectedProject) {
      setEditProjectForm({
        name: selectedProject.name,
        description: selectedProject.description || '',
        status: selectedProject.status,
      })
    }
  }, [selectedProject])

  useEffect(() => {
    setSchema(parseSchemaDocument(dbSchemaDoc?.content))
  }, [dbSchemaDoc?.id, dbSchemaDoc?.content])

  const handleCreateProject = (event: React.FormEvent) => {
    event.preventDefault()
    if (!projectForm.name.trim()) return
    createProjectMutation.mutate(
      {
        name: projectForm.name.trim(),
        description: projectForm.description || undefined,
        status: projectForm.status,
      },
      {
        onSuccess: (project) => {
          setProjectForm({ name: '', description: '', status: 'PLANNING' })
          setSelectedProjectId(project.id)
          toast.success('Proje olusturuldu.')
        },
      }
    )
  }

  const handleUpdateProject = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedProject || !editProjectForm.name.trim()) return
    updateProjectMutation.mutate(
      {
        id: selectedProject.id,
        request: {
          name: editProjectForm.name.trim(),
          description: editProjectForm.description || undefined,
          status: editProjectForm.status,
        },
      },
      { onSuccess: () => toast.success('Proje guncellendi.') }
    )
  }

  const handleDeleteProject = () => {
    if (!selectedProject || !window.confirm(`${selectedProject.name} projesi silinsin mi?`)) return
    deleteProjectMutation.mutate(selectedProject.id, {
      onSuccess: () => {
        setSelectedProjectId(undefined)
        toast.success('Proje silindi.')
      },
    })
  }

  const handleAddPhase = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedProjectId || !phaseForm.name.trim()) return
    addPhaseMutation.mutate(
      {
        projectId: selectedProjectId,
        request: {
          name: phaseForm.name.trim(),
          description: phaseForm.description || undefined,
          status: phaseForm.status,
          startDate: phaseForm.startDate || undefined,
          endDate: phaseForm.endDate || undefined,
          orderIndex: sortedPhases.length,
        },
      },
      {
        onSuccess: () => {
          setPhaseForm({ name: '', description: '', status: 'PLANNING', startDate: '', endDate: '' })
          toast.success('Faz eklendi.')
        },
      }
    )
  }

  const handleUpdatePhaseStatus = (phase: ProjectPhase, status: ProjectStatus) => {
    updatePhaseMutation.mutate({
      phaseId: phase.id,
      request: {
        name: phase.name,
        description: phase.description,
        status,
        startDate: phase.startDate,
        endDate: phase.endDate,
        orderIndex: phase.orderIndex,
      },
    })
  }

  const handleMovePhase = (phase: ProjectPhase, direction: -1 | 1) => {
    const currentIndex = sortedPhases.findIndex((item) => item.id === phase.id)
    const swapIndex = currentIndex + direction
    if (swapIndex < 0 || swapIndex >= sortedPhases.length) return
    const reordered = [...sortedPhases]
    const target = reordered[swapIndex]
    reordered[currentIndex] = target
    reordered[swapIndex] = phase
    reorderPhasesMutation.mutate(
      reordered.map((item, index) => ({ id: item.id, orderIndex: index })),
      { onSuccess: () => toast.success('Faz sirasi guncellendi.') }
    )
  }

  const handleAddTask = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedProjectId || !taskForm.title.trim()) return
    const phaseId = taskForm.phaseId ? Number(taskForm.phaseId) : undefined
    const planningBucket: PlanningBucket = taskForm.scheduledDate ? 'DAY' : 'UNSCHEDULED'
    createTaskMutation.mutate(
      {
        title: taskForm.title.trim(),
        notes: taskForm.notes || undefined,
        status: 'TODO',
        kind: 'PROJECT',
        projectId: selectedProjectId,
        phaseId,
        scheduledDate: taskForm.scheduledDate || undefined,
        scheduledTime: taskForm.scheduledTime || undefined,
        planningBucket,
      },
      {
        onSuccess: () => {
          setTaskForm({ title: '', notes: '', phaseId: '', scheduledDate: '', scheduledTime: '' })
          toast.success('Proje gorevi eklendi.')
        },
      }
    )
  }

  const handleAddTechnology = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedProjectId || !techForm.title.trim() || !techForm.technology.trim()) return
    addTechnologyMutation.mutate(
      {
        projectId: selectedProjectId,
        request: {
          category: techForm.category,
          title: techForm.title.trim(),
          technology: techForm.technology.trim(),
          notes: techForm.notes || undefined,
          orderIndex: technologies.length,
        },
      },
      {
        onSuccess: () => {
          setTechForm({ category: 'FRONTEND', title: '', technology: '', notes: '' })
          toast.success('Teknoloji eklendi.')
        },
      }
    )
  }

  const handleAddDocument = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedProjectId || !documentForm.title.trim()) return
    addDocumentMutation.mutate(
      {
        projectId: selectedProjectId,
        request: {
          title: documentForm.title.trim(),
          type: documentForm.type,
          content: documentForm.content || undefined,
          contentFormat: documentForm.contentFormat,
          orderIndex: documents.length,
        },
      },
      {
        onSuccess: () => {
          setDocumentForm({ title: '', type: 'GENERAL', contentFormat: 'MARKDOWN', content: '' })
          toast.success('Dokuman eklendi.')
        },
      }
    )
  }

  const handleSaveSchema = () => {
    if (!selectedProjectId) return
    const request = {
      type: 'DB_SCHEMA' as DocumentType,
      title: 'Veritabani Semasi',
      content: JSON.stringify(schema, null, 2),
      contentFormat: 'CODE' as DocumentFormat,
      orderIndex: dbSchemaDoc?.orderIndex ?? documents.length,
    }
    if (dbSchemaDoc) {
      updateDocumentMutation.mutate(
        { documentId: dbSchemaDoc.id, request },
        { onSuccess: () => toast.success('DB semasi kaydedildi.') }
      )
    } else {
      addDocumentMutation.mutate(
        { projectId: selectedProjectId, request },
        { onSuccess: () => toast.success('DB semasi olusturuldu.') }
      )
    }
  }

  const handleAddSnippet = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedProjectId || !snippetForm.title.trim() || !snippetForm.code.trim()) return
    addSnippetMutation.mutate(
      {
        projectId: selectedProjectId,
        request: {
          title: snippetForm.title.trim(),
          language: snippetForm.language || undefined,
          code: snippetForm.code,
          description: snippetForm.description || undefined,
          category: snippetForm.category,
        },
      },
      {
        onSuccess: () => {
          setSnippetForm({ title: '', language: '', code: '', description: '', category: 'BACKEND' })
          toast.success('Kod parcasi eklendi.')
        },
      }
    )
  }

  const handleCopySnippet = async (code: string) => {
    await navigator.clipboard.writeText(code)
    toast.success('Kod kopyalandi.')
  }

  const handleAddLink = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedProjectId || !linkForm.title.trim() || !linkForm.url.trim()) return
    addLinkMutation.mutate(
      {
        projectId: selectedProjectId,
        request: {
          title: linkForm.title.trim(),
          url: linkForm.url.trim(),
          type: linkForm.type,
          category: linkForm.category,
          notes: linkForm.notes || undefined,
          orderIndex: links.length,
        },
      },
      {
        onSuccess: () => {
          setLinkForm({ title: '', url: '', type: 'REFERENCE', category: 'OTHER', notes: '' })
          toast.success('Kaynak eklendi.')
        },
      }
    )
  }

  const handleUploadFile = async (file?: File) => {
    if (!selectedProjectId || !file) return
    try {
      const uploaded = await uploadFileMutation.mutateAsync(file)
      await addLinkMutation.mutateAsync({
        projectId: selectedProjectId,
        request: {
          title: uploaded.originalName,
          url: uploaded.downloadUrl,
          type: 'REFERENCE',
          category: 'OTHER',
          notes: `${uploaded.contentType || 'file'} - ${Math.round(uploaded.fileSize / 1024)} KB`,
          orderIndex: links.length,
        },
      })
      toast.success('Dosya yuklendi ve proje kaynagi olarak eklendi.')
    } catch {
      toast.error('Dosya yuklenemedi.')
    }
  }

  const addSchemaTable = () => {
    setSchema((current) => ({
      ...current,
      tables: [
        ...current.tables,
        {
          id: makeId(),
          name: `table_${current.tables.length + 1}`,
          columns: [{ id: makeId(), name: 'id', type: 'bigint', isPrimary: true, isForeign: false }],
        },
      ],
    }))
  }

  const updateSchemaTable = (tableId: string, name: string) => {
    setSchema((current) => ({
      ...current,
      tables: current.tables.map((table) => (table.id === tableId ? { ...table, name } : table)),
    }))
  }

  const deleteSchemaTable = (tableId: string) => {
    setSchema((current) => ({
      ...current,
      tables: current.tables.filter((table) => table.id !== tableId),
    }))
  }

  const addSchemaColumn = (tableId: string) => {
    setSchema((current) => ({
      ...current,
      tables: current.tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              columns: [
                ...table.columns,
                { id: makeId(), name: `column_${table.columns.length + 1}`, type: 'varchar', isPrimary: false, isForeign: false },
              ],
            }
          : table
      ),
    }))
  }

  const updateSchemaColumn = (tableId: string, columnId: string, patch: Partial<DbColumn>) => {
    setSchema((current) => ({
      ...current,
      tables: current.tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              columns: table.columns.map((column) => (column.id === columnId ? { ...column, ...patch } : column)),
            }
          : table
      ),
    }))
  }

  const deleteSchemaColumn = (tableId: string, columnId: string) => {
    setSchema((current) => ({
      ...current,
      tables: current.tables.map((table) =>
        table.id === tableId ? { ...table, columns: table.columns.filter((column) => column.id !== columnId) } : table
      ),
    }))
  }

  const renderProjectList = () => (
    <aside className="glass-panel rounded-2xl p-4 h-fit lg:sticky lg:top-8">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Project Library</p>
          <h2 className="text-lg font-black text-neutral-950 dark:text-white">Projeler</h2>
        </div>
        <Badge variant="outline">{projects.length}</Badge>
      </div>

      <div className="mt-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Projelerde ara"
            className="h-9 pl-9 bg-white/70 dark:bg-neutral-950/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as ProjectStatus | 'ALL')}
          className="h-9 w-full rounded-lg border border-border bg-white/70 px-3 text-xs font-semibold text-neutral-900 outline-none dark:bg-neutral-950/50 dark:text-white"
        >
          <option value="ALL">Tum durumlar</option>
          {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleCreateProject} className="mt-4 rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-3 space-y-2">
        <Input
          value={projectForm.name}
          onChange={(event) => setProjectForm((form) => ({ ...form, name: event.target.value }))}
          placeholder="Yeni proje adi"
          className="h-9 bg-neutral-950/50 text-white"
        />
        <Textarea
          value={projectForm.description}
          onChange={(event) => setProjectForm((form) => ({ ...form, description: event.target.value }))}
          placeholder="Kisa not"
          className="min-h-[62px] bg-neutral-950/50 text-white"
        />
        <GlassButton size="sm" contentClassName="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Proje ekle
        </GlassButton>
      </form>

      <div className="mt-4 space-y-2 max-h-[58vh] overflow-y-auto pr-1">
        {projectsLoading && <p className="text-xs text-neutral-400">Projeler yukleniyor...</p>}
        {filteredProjects.map((project) => {
          const isActive = project.id === selectedProjectId
          const stack = technologies.filter((technology) => technology.projectId === project.id).slice(0, 3)
          return (
            <button
              key={project.id}
              onClick={() => {
                setSelectedProjectId(project.id)
                setActiveTab('overview')
              }}
              className={cn(
                'w-full rounded-xl border p-3 text-left transition-all',
                isActive
                  ? 'border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,0.08)]'
                  : 'border-white/10 bg-white/5 hover:border-cyan-400/25 hover:bg-white/10'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-neutral-950 dark:text-white">{project.name}</div>
                  <p className="line-clamp-2 text-[11px] leading-4 text-neutral-500 dark:text-neutral-400">
                    {project.description || 'Not eklenmedi.'}
                  </p>
                </div>
                <span className={cn('rounded-full border px-2 py-0.5 text-[9px] font-bold', STATUS_STYLES[project.status])}>
                  {STATUS_LABELS[project.status]}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {stack.length === 0 ? (
                  <span className="text-[10px] text-neutral-500">Stack bekliyor</span>
                ) : (
                  stack.map((item) => (
                    <span key={item.id} className="rounded-full bg-neutral-900/50 px-2 py-0.5 text-[9px] font-bold text-cyan-200">
                      {item.technology}
                    </span>
                  ))
                )}
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )

  if (projects.length === 0 && !projectsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Projeler" subtitle="Bir projenin teknik hafizasini, roadmap'ini ve gorevlerini tek yerden yonet." />
        <div className="glass-panel mx-auto max-w-2xl rounded-2xl p-8 text-center">
          <Folder className="mx-auto h-12 w-12 text-cyan-300" />
          <h2 className="mt-4 text-2xl font-black text-neutral-950 dark:text-white">Ilk proje odani olustur</h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Fazlar, DB semasi, teknoloji stack'i, refactor planlari ve kaynaklar bu odada toplanacak.
          </p>
          <form onSubmit={handleCreateProject} className="mt-6 space-y-3 text-left">
            <Input
              value={projectForm.name}
              onChange={(event) => setProjectForm((form) => ({ ...form, name: event.target.value }))}
              placeholder="Proje adi"
              className="bg-neutral-950/50 text-white"
            />
            <Textarea
              value={projectForm.description}
              onChange={(event) => setProjectForm((form) => ({ ...form, description: event.target.value }))}
              placeholder="Projenin amaci"
              className="bg-neutral-950/50 text-white"
            />
            <GlassButton contentClassName="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Project Control Room ac
            </GlassButton>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projeler"
        subtitle="Roadmap, teknik hafiza, proje gorevleri, DB semasi ve kaynaklar."
        action={
          <Badge variant="outline" className="border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
            FE-2 Control Room
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        {renderProjectList()}

        {selectedProject ? (
          <main className="space-y-6">
            <section className="glass-panel rounded-2xl p-5">
              <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
                <form onSubmit={handleUpdateProject} className="space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-black', STATUS_STYLES[selectedProject.status])}>
                          {STATUS_LABELS[selectedProject.status]}
                        </span>
                        <span className="rounded-full border border-white/10 bg-neutral-950/40 px-2.5 py-1 text-[10px] font-bold text-neutral-300">
                          {technologies.length} teknoloji
                        </span>
                        <span className="rounded-full border border-white/10 bg-neutral-950/40 px-2.5 py-1 text-[10px] font-bold text-neutral-300">
                          {documents.length} dokuman
                        </span>
                      </div>
                      <Input
                        value={editProjectForm.name}
                        onChange={(event) => setEditProjectForm((form) => ({ ...form, name: event.target.value }))}
                        className="h-auto border-transparent bg-transparent px-0 text-3xl font-black tracking-tight text-neutral-950 shadow-none focus-visible:ring-0 dark:text-white"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={editProjectForm.status}
                        onChange={(event) => setEditProjectForm((form) => ({ ...form, status: event.target.value as ProjectStatus }))}
                        className="h-9 rounded-lg border border-border bg-neutral-950/50 px-3 text-xs font-bold text-white outline-none"
                      >
                        {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm" variant="outline">
                        <SquarePen className="mr-2 h-3.5 w-3.5" />
                        Kaydet
                      </Button>
                      <Button type="button" size="sm" variant="destructive" onClick={handleDeleteProject}>
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Sil
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={editProjectForm.description}
                    onChange={(event) => setEditProjectForm((form) => ({ ...form, description: event.target.value }))}
                    placeholder="Proje notlari, amaci, kapsam disi kararlar..."
                    className="min-h-[96px] bg-neutral-950/40 text-white"
                  />
                </form>

                <aside className="rounded-2xl border border-white/10 bg-neutral-950/35 p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Hafiza Paneli</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <SummaryTile label="Bugun" value={`${todayTasks.length}`} icon={CalendarDays} />
                    <SummaryTile label="Aktif Faz" value={activePhase?.name || '-'} icon={GitBranch} />
                    <SummaryTile label="Progress" value={`%${completionPercent(projectTasks)}`} icon={RefreshCcw} />
                    <SummaryTile label="Refactor" value={`${refactorDocs.length}`} icon={Braces} />
                  </div>
                </aside>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <MetricCard title="Bugun" value={`${todayTasks.length} gorev`} icon={CalendarDays} accent="text-emerald-300" />
              <MetricCard title="Aktif Faz" value={activePhase?.name || 'Yok'} icon={GitBranch} accent="text-cyan-300" />
              <MetricCard title="Teknik Hafiza" value={`${documents.length + snippets.length + links.length} oge`} icon={FileArchive} accent="text-violet-300" />
              <MetricCard title="Tamamlanma" value={`%${completionPercent(projectTasks)}`} icon={Check} accent="text-amber-300" />
            </section>

            <section className="glass-panel rounded-2xl p-3">
              <div className="flex gap-2 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition-all',
                        activeTab === tab.id
                          ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200'
                          : 'border-white/10 bg-neutral-950/30 text-neutral-400 hover:text-white'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </section>

            {activeTab === 'overview' && (
              <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
                <Panel title="Roadmap" icon={GitBranch}>
                  <div className="space-y-3">
                    {sortedPhases.slice(0, 4).map((phase, index) => (
                      <PhaseRoadmapCard key={phase.id} phase={phase} index={index} tasks={projectTasks.filter((task) => task.phaseId === phase.id)} />
                    ))}
                    {sortedPhases.length === 0 && <EmptyLine text="Faz eklenince proje yolculugu burada gorunecek." />}
                  </div>
                </Panel>
                <Panel title="Bugunku Proje Isleri" icon={ListChecks}>
                  <TaskList tasks={todayTasks} onToggle={(id) => toggleTaskMutation.mutate(id)} onDelete={(id) => deleteTaskMutation.mutate(id)} />
                </Panel>
              </div>
            )}

            {activeTab === 'phases' && (
              <Panel title="Fazlar ve Roadmap" icon={GitBranch}>
                <form onSubmit={handleAddPhase} className="grid gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-3 lg:grid-cols-[1fr_1fr_140px_140px_auto]">
                  <Input value={phaseForm.name} onChange={(event) => setPhaseForm((form) => ({ ...form, name: event.target.value }))} placeholder="Faz adi" className="bg-neutral-950/50 text-white" />
                  <Input value={phaseForm.description} onChange={(event) => setPhaseForm((form) => ({ ...form, description: event.target.value }))} placeholder="Detay" className="bg-neutral-950/50 text-white" />
                  <Input type="date" value={phaseForm.startDate} onChange={(event) => setPhaseForm((form) => ({ ...form, startDate: event.target.value }))} className="bg-neutral-950/50 text-white" />
                  <Input type="date" value={phaseForm.endDate} onChange={(event) => setPhaseForm((form) => ({ ...form, endDate: event.target.value }))} className="bg-neutral-950/50 text-white" />
                  <GlassButton size="sm" contentClassName="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Ekle
                  </GlassButton>
                </form>
                <div className="mt-6 space-y-4">
                  {sortedPhases.map((phase, index) => {
                    const phaseTasks = projectTasks.filter((task) => task.phaseId === phase.id)
                    return (
                      <div key={phase.id} className="relative rounded-2xl border border-white/10 bg-neutral-950/35 p-4 shadow-xl" style={{ marginLeft: `${Math.min(index, 4) * 14}px` }}>
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-black text-cyan-300">{String(index + 1).padStart(2, '0')}</span>
                              <Badge className={STATUS_STYLES[phase.status]}>{STATUS_LABELS[phase.status]}</Badge>
                              <span className="text-[10px] text-neutral-400">{phaseTasks.length} gorev</span>
                            </div>
                            <h3 className="mt-2 text-xl font-black text-neutral-950 dark:text-white">{phase.name}</h3>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{phase.description || 'Faz detayi eklenmedi.'}</p>
                            <p className="mt-2 text-[11px] font-semibold text-neutral-500">
                              {phase.startDate || 'baslangic yok'} - {phase.endDate || 'bitis yok'}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <select
                              value={phase.status}
                              onChange={(event) => handleUpdatePhaseStatus(phase, event.target.value as ProjectStatus)}
                              className="h-8 rounded-lg border border-border bg-neutral-950/50 px-2 text-xs text-white outline-none"
                            >
                              {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((status) => (
                                <option key={status} value={status}>
                                  {STATUS_LABELS[status]}
                                </option>
                              ))}
                            </select>
                            <Button type="button" size="icon" variant="ghost" onClick={() => handleMovePhase(phase, -1)} disabled={index === 0}>
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost" onClick={() => handleMovePhase(phase, 1)} disabled={index === sortedPhases.length - 1}>
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button type="button" size="icon" variant="destructive" onClick={() => deletePhaseMutation.mutate(phase.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4">
                          <TaskList tasks={phaseTasks} onToggle={(id) => toggleTaskMutation.mutate(id)} onDelete={(id) => deleteTaskMutation.mutate(id)} dense />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Panel>
            )}

            {activeTab === 'tasks' && (
              <Panel title="Proje Gorevleri" icon={ListChecks}>
                <form onSubmit={handleAddTask} className="grid gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-3 lg:grid-cols-[1fr_180px_150px_120px_auto]">
                  <Input value={taskForm.title} onChange={(event) => setTaskForm((form) => ({ ...form, title: event.target.value }))} placeholder="Gorev basligi" className="bg-neutral-950/50 text-white" />
                  <select value={taskForm.phaseId} onChange={(event) => setTaskForm((form) => ({ ...form, phaseId: event.target.value }))} className="h-10 rounded-lg border border-border bg-neutral-950/50 px-3 text-sm text-white outline-none">
                    <option value="">Faz yok</option>
                    {sortedPhases.map((phase) => (
                      <option key={phase.id} value={phase.id}>
                        {phase.name}
                      </option>
                    ))}
                  </select>
                  <Input type="date" value={taskForm.scheduledDate} onChange={(event) => setTaskForm((form) => ({ ...form, scheduledDate: event.target.value }))} className="bg-neutral-950/50 text-white" />
                  <Input type="time" value={taskForm.scheduledTime} onChange={(event) => setTaskForm((form) => ({ ...form, scheduledTime: event.target.value }))} className="bg-neutral-950/50 text-white" />
                  <GlassButton size="sm" contentClassName="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Gorev
                  </GlassButton>
                  <Textarea value={taskForm.notes} onChange={(event) => setTaskForm((form) => ({ ...form, notes: event.target.value }))} placeholder="Not" className="lg:col-span-5 bg-neutral-950/50 text-white" />
                </form>
                <div className="mt-5">
                  <TaskList tasks={projectTasks} onToggle={(id) => toggleTaskMutation.mutate(id)} onDelete={(id) => deleteTaskMutation.mutate(id)} />
                </div>
              </Panel>
            )}

            {activeTab === 'stack' && (
              <Panel title="Teknoloji Stack'i" icon={Layers3}>
                <form onSubmit={handleAddTechnology} className="grid gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-3 lg:grid-cols-[150px_1fr_1fr_auto]">
                  <select value={techForm.category} onChange={(event) => setTechForm((form) => ({ ...form, category: event.target.value as TechnologyCategory }))} className="h-10 rounded-lg border border-border bg-neutral-950/50 px-3 text-sm text-white outline-none">
                    {(Object.keys(TECHNOLOGY_LABELS) as TechnologyCategory[]).map((category) => (
                      <option key={category} value={category}>
                        {TECHNOLOGY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                  <Input value={techForm.title} onChange={(event) => setTechForm((form) => ({ ...form, title: event.target.value }))} placeholder="Baslik: UI Framework" className="bg-neutral-950/50 text-white" />
                  <Input value={techForm.technology} onChange={(event) => setTechForm((form) => ({ ...form, technology: event.target.value }))} placeholder="Teknoloji: React" className="bg-neutral-950/50 text-white" />
                  <GlassButton size="sm">Ekle</GlassButton>
                  <Textarea value={techForm.notes} onChange={(event) => setTechForm((form) => ({ ...form, notes: event.target.value }))} placeholder="Not" className="lg:col-span-4 bg-neutral-950/50 text-white" />
                </form>
                <div className="mt-5 grid gap-4 xl:grid-cols-5">
                  {technologiesByCategory.map(({ category, technologies: items }) => (
                    <div key={category} className="rounded-2xl border border-white/10 bg-neutral-950/35 p-3">
                      <h3 className="text-sm font-black text-cyan-200">{TECHNOLOGY_LABELS[category]}</h3>
                      <div className="mt-3 space-y-2">
                        {items.map((technology) => (
                          <div key={technology.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-black text-white">{technology.technology}</p>
                                <p className="text-[10px] text-neutral-400">{technology.title}</p>
                              </div>
                              <button onClick={() => deleteTechnologyMutation.mutate(technology.id)} className="text-neutral-500 hover:text-red-300">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {technology.notes && <p className="mt-2 text-[11px] leading-4 text-neutral-400">{technology.notes}</p>}
                          </div>
                        ))}
                        {items.length === 0 && <EmptyLine text="Bos" />}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {activeTab === 'schema' && (
              <Panel title="DB Schema Studio" icon={Database} action={<Button size="sm" variant="outline" onClick={handleSaveSchema}>Semayi Kaydet</Button>}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex rounded-xl border border-white/10 bg-neutral-950/40 p-1">
                    {(['diagram', 'code', 'tables'] as SchemaView[]).map((view) => (
                      <button
                        key={view}
                        onClick={() => setSchemaView(view)}
                        className={cn('rounded-lg px-3 py-1.5 text-xs font-black transition-all', schemaView === view ? 'bg-cyan-400/15 text-cyan-200' : 'text-neutral-400 hover:text-white')}
                      >
                        {view === 'diagram' ? 'Diyagram' : view === 'code' ? 'Kod' : 'Tablolar'}
                      </button>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" onClick={addSchemaTable}>
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Tablo
                  </Button>
                </div>
                {schemaView === 'diagram' && <SchemaDiagram schema={schema} />}
                {schemaView === 'code' && (
                  <pre className="max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-neutral-950/70 p-4 text-xs leading-5 text-cyan-100">
                    {mermaidCode}
                  </pre>
                )}
                {schemaView === 'tables' && (
                  <SchemaTableEditor
                    schema={schema}
                    onRenameTable={updateSchemaTable}
                    onDeleteTable={deleteSchemaTable}
                    onAddColumn={addSchemaColumn}
                    onUpdateColumn={updateSchemaColumn}
                    onDeleteColumn={deleteSchemaColumn}
                  />
                )}
              </Panel>
            )}

            {activeTab === 'documents' && (
              <Panel title="Dokumanlar ve Refactor Planlari" icon={FileText}>
                <form onSubmit={handleAddDocument} className="grid gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-3 lg:grid-cols-[180px_180px_1fr_auto]">
                  <select value={documentForm.type} onChange={(event) => setDocumentForm((form) => ({ ...form, type: event.target.value as DocumentType }))} className="h-10 rounded-lg border border-border bg-neutral-950/50 px-3 text-sm text-white outline-none">
                    {(Object.keys(DOCUMENT_LABELS) as DocumentType[]).map((type) => (
                      <option key={type} value={type}>
                        {DOCUMENT_LABELS[type]}
                      </option>
                    ))}
                  </select>
                  <select value={documentForm.contentFormat} onChange={(event) => setDocumentForm((form) => ({ ...form, contentFormat: event.target.value as DocumentFormat }))} className="h-10 rounded-lg border border-border bg-neutral-950/50 px-3 text-sm text-white outline-none">
                    <option value="MARKDOWN">Markdown</option>
                    <option value="CODE">Code</option>
                    <option value="SQL">SQL</option>
                  </select>
                  <Input value={documentForm.title} onChange={(event) => setDocumentForm((form) => ({ ...form, title: event.target.value }))} placeholder="Dokuman basligi" className="bg-neutral-950/50 text-white" />
                  <GlassButton size="sm">Ekle</GlassButton>
                  <Textarea value={documentForm.content} onChange={(event) => setDocumentForm((form) => ({ ...form, content: event.target.value }))} placeholder="Icerik" className="lg:col-span-4 min-h-[110px] bg-neutral-950/50 text-white" />
                </form>
                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  {documents.map((document) => (
                    <DocumentCard key={document.id} document={document} onDelete={(id) => deleteDocumentMutation.mutate(id)} />
                  ))}
                </div>
              </Panel>
            )}

            {activeTab === 'snippets' && (
              <Panel title="Kod Kutuphanesi" icon={FileCode}>
                <form onSubmit={handleAddSnippet} className="grid gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-3 lg:grid-cols-[160px_150px_1fr_auto]">
                  <select value={snippetForm.category} onChange={(event) => setSnippetForm((form) => ({ ...form, category: event.target.value as SnippetCategory }))} className="h-10 rounded-lg border border-border bg-neutral-950/50 px-3 text-sm text-white outline-none">
                    <option value="FRONTEND">Frontend</option>
                    <option value="BACKEND">Backend</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <Input value={snippetForm.language} onChange={(event) => setSnippetForm((form) => ({ ...form, language: event.target.value }))} placeholder="Dil" className="bg-neutral-950/50 text-white" />
                  <Input value={snippetForm.title} onChange={(event) => setSnippetForm((form) => ({ ...form, title: event.target.value }))} placeholder="Baslik" className="bg-neutral-950/50 text-white" />
                  <GlassButton size="sm">Ekle</GlassButton>
                  <Textarea value={snippetForm.description} onChange={(event) => setSnippetForm((form) => ({ ...form, description: event.target.value }))} placeholder="Aciklama" className="lg:col-span-4 bg-neutral-950/50 text-white" />
                  <Textarea value={snippetForm.code} onChange={(event) => setSnippetForm((form) => ({ ...form, code: event.target.value }))} placeholder="Kod" className="lg:col-span-4 min-h-[160px] font-mono bg-neutral-950/70 text-cyan-100" />
                </form>
                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  {snippets.map((snippet) => (
                    <div key={snippet.id} className="rounded-2xl border border-white/10 bg-neutral-950/35 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-black text-white">{snippet.title}</h3>
                          <p className="text-xs text-neutral-400">{snippet.language || 'plain'} - {snippet.category}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleCopySnippet(snippet.code)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="destructive" onClick={() => deleteSnippetMutation.mutate(snippet.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {snippet.description && <p className="mt-2 text-xs text-neutral-400">{snippet.description}</p>}
                      <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-black/60 p-3 text-xs leading-5 text-cyan-100">{snippet.code}</pre>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {activeTab === 'resources' && (
              <Panel title="Linkler ve Dosyalar" icon={LinkIcon}>
                <form onSubmit={handleAddLink} className="grid gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-3 lg:grid-cols-[150px_1fr_1fr_auto]">
                  <select value={linkForm.type} onChange={(event) => setLinkForm((form) => ({ ...form, type: event.target.value as LinkType }))} className="h-10 rounded-lg border border-border bg-neutral-950/50 px-3 text-sm text-white outline-none">
                    {(Object.keys(LINK_TYPE_LABELS) as LinkType[]).map((type) => (
                      <option key={type} value={type}>{LINK_TYPE_LABELS[type]}</option>
                    ))}
                  </select>
                  <Input value={linkForm.title} onChange={(event) => setLinkForm((form) => ({ ...form, title: event.target.value }))} placeholder="Baslik" className="bg-neutral-950/50 text-white" />
                  <Input value={linkForm.url} onChange={(event) => setLinkForm((form) => ({ ...form, url: event.target.value }))} placeholder="URL" className="bg-neutral-950/50 text-white" />
                  <GlassButton size="sm">Ekle</GlassButton>
                  <Textarea value={linkForm.notes} onChange={(event) => setLinkForm((form) => ({ ...form, notes: event.target.value }))} placeholder="Not" className="lg:col-span-4 bg-neutral-950/50 text-white" />
                </form>
                <div className="mt-4 rounded-xl border border-dashed border-cyan-400/20 bg-neutral-950/35 p-4">
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center text-sm text-neutral-400">
                    {uploadFileMutation.isPending ? <Loader2 className="h-6 w-6 animate-spin text-cyan-300" /> : <Upload className="h-6 w-6 text-cyan-300" />}
                    Dosya yukle; kaynak linki olarak projeye baglanir.
                    <input type="file" className="hidden" onChange={(event) => handleUploadFile(event.target.files?.[0])} />
                  </label>
                </div>
                <div className="mt-5 grid gap-3 xl:grid-cols-2">
                  {links.map((link) => (
                    <div key={link.id} className="rounded-2xl border border-white/10 bg-neutral-950/35 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <a href={link.url} target="_blank" rel="noreferrer" className="font-black text-cyan-200 hover:underline">
                            {link.title}
                          </a>
                          <p className="truncate text-xs text-neutral-500">{link.url}</p>
                        </div>
                        <Button size="icon" variant="destructive" onClick={() => deleteLinkMutation.mutate(link.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="outline">{LINK_TYPE_LABELS[link.type]}</Badge>
                        {link.category && <Badge variant="outline">{link.category}</Badge>}
                      </div>
                      {link.notes && <p className="mt-2 text-xs text-neutral-400">{link.notes}</p>}
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </main>
        ) : (
          <div className="glass-panel rounded-2xl p-8 text-center">
            <Folder className="mx-auto h-10 w-10 text-cyan-300" />
            <p className="mt-3 text-sm text-neutral-400">Bir proje sec veya yeni proje olustur.</p>
          </div>
        )}
      </div>
    </div>
  )
}

const Panel: React.FC<{
  title: string
  icon: React.ElementType
  action?: React.ReactNode
  children: React.ReactNode
}> = ({ title, icon: Icon, action, children }) => (
  <section className="glass-panel rounded-2xl p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-cyan-300">
        <Icon className="h-5 w-5" />
        <h2 className="text-base font-black text-neutral-950 dark:text-white">{title}</h2>
      </div>
      {action}
    </div>
    {children}
  </section>
)

const MetricCard: React.FC<{
  title: string
  value: string
  icon: React.ElementType
  accent: string
}> = ({ title, value, icon: Icon, accent }) => (
  <div className="glass-panel rounded-2xl p-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">{title}</p>
        <p className="mt-1 truncate text-lg font-black text-neutral-950 dark:text-white">{value}</p>
      </div>
      <Icon className={cn('h-5 w-5', accent)} />
    </div>
  </div>
)

const SummaryTile: React.FC<{
  label: string
  value: string
  icon: React.ElementType
}> = ({ label, value, icon: Icon }) => (
  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
    <Icon className="h-4 w-4 text-cyan-300" />
    <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-neutral-500">{label}</p>
    <p className="truncate text-sm font-black text-white">{value}</p>
  </div>
)

const PhaseRoadmapCard: React.FC<{ phase: ProjectPhase; index: number; tasks: Task[] }> = ({ phase, index, tasks }) => (
  <div className="rounded-2xl border border-white/10 bg-neutral-950/35 p-4" style={{ transform: `translateX(${Math.min(index, 3) * 8}px)` }}>
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-black text-cyan-300">FAZ {String(index + 1).padStart(2, '0')}</p>
        <h3 className="font-black text-white">{phase.name}</h3>
      </div>
      <Badge className={STATUS_STYLES[phase.status]}>{STATUS_LABELS[phase.status]}</Badge>
    </div>
    <p className="mt-2 line-clamp-2 text-xs text-neutral-400">{phase.description || 'Detay bekliyor.'}</p>
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-800">
      <div className="h-full rounded-full bg-cyan-400" style={{ width: `${completionPercent(tasks)}%` }} />
    </div>
  </div>
)

const TaskList: React.FC<{
  tasks: Task[]
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  dense?: boolean
}> = ({ tasks, onToggle, onDelete, dense = false }) => {
  if (tasks.length === 0) return <EmptyLine text="Gorev yok." />
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-neutral-950/35 p-3">
          <div className="flex min-w-0 items-start gap-3">
            <button
              onClick={() => onToggle(task.id)}
              className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                task.status === 'DONE' ? 'border-emerald-400 bg-emerald-400 text-black' : 'border-neutral-600'
              )}
            >
              {task.status === 'DONE' && <Check className="h-3.5 w-3.5" />}
            </button>
            <div className="min-w-0">
              <p className={cn('truncate font-bold text-white', dense ? 'text-xs' : 'text-sm', task.status === 'DONE' && 'text-neutral-500 line-through')}>
                {task.title}
              </p>
              <p className="text-[10px] text-neutral-500">
                {task.scheduledDate || 'backlog'} {task.scheduledTime || ''}
              </p>
              {task.notes && <p className="mt-1 line-clamp-2 text-xs text-neutral-400">{task.notes}</p>}
            </div>
          </div>
          <button onClick={() => onDelete(task.id)} className="text-neutral-500 hover:text-red-300">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

const EmptyLine: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-xl border border-dashed border-white/10 bg-neutral-950/25 p-4 text-center text-xs font-semibold text-neutral-500">
    {text}
  </div>
)

const DocumentCard: React.FC<{ document: ProjectDocument; onDelete: (id: number) => void }> = ({ document, onDelete }) => (
  <div className="rounded-2xl border border-white/10 bg-neutral-950/35 p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <Badge variant="outline">{DOCUMENT_LABELS[document.type]}</Badge>
        <h3 className="mt-2 font-black text-white">{document.title}</h3>
        <p className="text-xs text-neutral-500">{document.contentFormat}</p>
      </div>
      <Button size="icon" variant="destructive" onClick={() => onDelete(document.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
    {document.content && (
      <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-black/50 p-3 text-xs leading-5 text-neutral-300">
        {document.type === 'DB_SCHEMA' ? 'DB Schema Studio verisi. Diyagram sekmesinden duzenleyin.' : document.content}
      </pre>
    )}
  </div>
)

const SchemaDiagram: React.FC<{ schema: DbSchemaDocument }> = ({ schema }) => {
  const relations = schema.tables.flatMap((table) =>
    table.columns
      .filter((column) => column.isForeign && column.referencesTable)
      .map((column) => ({ from: column.referencesTable || '', to: table.name, column: column.name }))
  )
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {schema.tables.map((table) => (
          <div key={table.id} className="overflow-hidden rounded-xl border border-cyan-400/25 bg-neutral-950/80 shadow-[0_0_28px_rgba(34,211,238,0.06)]">
            <div className="border-b border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-center text-xs font-black uppercase tracking-widest text-cyan-100">
              {table.name}
            </div>
            <div className="divide-y divide-white/10">
              {table.columns.map((column) => (
                <div key={column.id} className="grid grid-cols-[80px_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-xs">
                  <span className="font-mono text-neutral-500">{column.type}</span>
                  <span className="truncate font-bold text-neutral-100">{column.name}</span>
                  <span className="flex gap-1">
                    {column.isPrimary && <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-black text-amber-200">PK</span>}
                    {column.isForeign && <span className="rounded bg-cyan-400/15 px-1.5 py-0.5 text-[9px] font-black text-cyan-200">FK</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {relations.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {relations.map((relation, index) => (
            <span key={`${relation.from}-${relation.to}-${index}`} className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black text-cyan-100">
              {`${relation.from} -> ${relation.to}.${relation.column}`}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

const SchemaTableEditor: React.FC<{
  schema: DbSchemaDocument
  onRenameTable: (tableId: string, name: string) => void
  onDeleteTable: (tableId: string) => void
  onAddColumn: (tableId: string) => void
  onUpdateColumn: (tableId: string, columnId: string, patch: Partial<DbColumn>) => void
  onDeleteColumn: (tableId: string, columnId: string) => void
}> = ({ schema, onRenameTable, onDeleteTable, onAddColumn, onUpdateColumn, onDeleteColumn }) => (
  <div className="space-y-4">
    {schema.tables.map((table) => (
      <div key={table.id} className="rounded-2xl border border-white/10 bg-neutral-950/35 p-4">
        <div className="flex items-center gap-2">
          <Input value={table.name} onChange={(event) => onRenameTable(table.id, event.target.value)} className="bg-neutral-950/50 font-black text-white" />
          <Button size="sm" variant="outline" onClick={() => onAddColumn(table.id)}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            Kolon
          </Button>
          <Button size="icon" variant="destructive" onClick={() => onDeleteTable(table.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {table.columns.map((column) => (
            <div key={column.id} className="grid gap-2 lg:grid-cols-[1fr_130px_70px_70px_1fr_1fr_auto]">
              <Input value={column.name} onChange={(event) => onUpdateColumn(table.id, column.id, { name: event.target.value })} className="h-9 bg-neutral-950/50 text-white" />
              <Input value={column.type} onChange={(event) => onUpdateColumn(table.id, column.id, { type: event.target.value })} className="h-9 bg-neutral-950/50 text-white" />
              <label className="flex h-9 items-center justify-center rounded-lg border border-white/10 bg-neutral-950/40 text-xs font-black text-neutral-300">
                <input type="checkbox" checked={column.isPrimary} onChange={(event) => onUpdateColumn(table.id, column.id, { isPrimary: event.target.checked })} className="mr-1" />
                PK
              </label>
              <label className="flex h-9 items-center justify-center rounded-lg border border-white/10 bg-neutral-950/40 text-xs font-black text-neutral-300">
                <input type="checkbox" checked={column.isForeign} onChange={(event) => onUpdateColumn(table.id, column.id, { isForeign: event.target.checked })} className="mr-1" />
                FK
              </label>
              <Input value={column.referencesTable || ''} onChange={(event) => onUpdateColumn(table.id, column.id, { referencesTable: event.target.value })} placeholder="ref table" className="h-9 bg-neutral-950/50 text-white" />
              <Input value={column.referencesColumn || ''} onChange={(event) => onUpdateColumn(table.id, column.id, { referencesColumn: event.target.value })} placeholder="ref column" className="h-9 bg-neutral-950/50 text-white" />
              <Button size="icon" variant="destructive" onClick={() => onDeleteColumn(table.id, column.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
)

export default ProjectsPage
