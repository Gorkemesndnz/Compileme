import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowUp,
  ArrowDown,
  CalendarDays,
  Check,
  Clipboard,
  Code2,
  Copy,
  Cpu,
  Database,
  Download,
  FileArchive,
  FileCode,
  FileText,
  Folder,
  GitBranch,
  Github,
  Layers3,
  Link as LinkIcon,
  ListChecks,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import { OverviewPage } from './OverviewPage'
import { PhasesManagerPage } from './PhasesManagerPage'
import { PhaseDetailRoom } from './PhaseDetailRoom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { GlassButton } from '../../components/ui/glass-button'
import { Button as MovingBorderButton } from '../../components/ui/moving-border'
import { SketchButton } from '../../components/ui/SketchButton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/Dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/DropdownMenu'
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
import { useUiStore } from '../../store/useUiStore'

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

interface ProjectOnboardingForm extends ProjectRequest {
  repositoryUrl: string
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: 'Planlama',
  ACTIVE: 'Aktif',
  PAUSED: 'Beklemede',
  DONE: 'Tamamlandı',
}

const STATUS_STYLES: Record<ProjectStatus, string> = {
  PLANNING: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  ACTIVE: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  PAUSED: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  DONE: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
}

const STATUS_DOT_STYLES: Record<ProjectStatus, string> = {
  PLANNING: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]',
  ACTIVE: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]',
  PAUSED: 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.7)]',
  DONE: 'bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]',
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

function emptyProjectOnboardingForm(): ProjectOnboardingForm {
  return {
    name: '',
    description: '',
    status: 'PLANNING',
    repositoryUrl: '',
  }
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
  const shouldReduceMotion = useReducedMotion()
  const {
    activeProjectId: selectedProjectId,
    projectOnboardingOpen,
    setActiveProjectId: setSelectedProjectId,
    setProjectOnboardingOpen,
  } = useUiStore()
  const [activeTab, setActiveTab] = useState<ProjectTab>('overview')
  const [activePhaseId, setActivePhaseId] = useState<number | null>(null)
  const [schemaView, setSchemaView] = useState<SchemaView>('diagram')
  const [schema, setSchema] = useState<DbSchemaDocument>(emptySchema)

  const [projectForm, setProjectForm] = useState<ProjectOnboardingForm>(emptyProjectOnboardingForm)
  const [isProvisioningProject, setIsProvisioningProject] = useState(false)
  const [editProjectForm, setEditProjectForm] = useState<ProjectRequest>({ name: '', description: '', status: 'PLANNING' })
  const [editingField, setEditingField] = useState<'name' | 'description' | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const cancelledEditRef = useRef<'name' | 'description' | null>(null)
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
  const selectedPhase = useMemo(
    () => phases.find((phase) => phase.id === activePhaseId),
    [phases, activePhaseId]
  )
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

  const technologiesByCategory = useMemo(() => {
    return (Object.keys(TECHNOLOGY_LABELS) as TechnologyCategory[]).map((category) => ({
      category,
      technologies: technologies.filter((technology) => technology.category === category),
    }))
  }, [technologies])

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

  useEffect(() => {
    if (!projectsLoading && projects.length > 0 && !selectedProject && !projectOnboardingOpen) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projectsLoading, projects, selectedProject, projectOnboardingOpen, setSelectedProjectId])

  const handleCreateProject = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!projectForm.name.trim() || !projectForm.description?.trim() || isProvisioningProject) return

    setIsProvisioningProject(true)
    try {
      const project = await createProjectMutation.mutateAsync({
        name: projectForm.name.trim(),
        description: projectForm.description?.trim() || undefined,
        status: projectForm.status,
      })

      let repositoryFailed = false
      if (projectForm.repositoryUrl.trim()) {
        try {
          await addLinkMutation.mutateAsync({
            projectId: project.id,
            request: {
              title: 'GitHub Repository',
              url: projectForm.repositoryUrl.trim(),
              type: 'REPO',
              category: 'OTHER',
              orderIndex: 0,
            },
          })
        } catch {
          repositoryFailed = true
        }
      }

      setProjectForm(emptyProjectOnboardingForm())
      setSelectedProjectId(project.id)
      setProjectOnboardingOpen(false)
      setActiveTab('overview')

      if (repositoryFailed) {
        toast.warning('Proje oluşturuldu; GitHub bağlantısı eklenemedi.')
      } else {
        toast.success('Project Control Room hazır.')
      }
    } catch {
      toast.error('Proje oluşturulamadı. Bilgileri kontrol edip tekrar deneyin.')
    } finally {
      setIsProvisioningProject(false)
    }
  }

  const cancelInlineEdit = (field: 'name' | 'description') => {
    if (!selectedProject) return
    cancelledEditRef.current = field
    setEditProjectForm((form) => ({
      ...form,
      [field]: field === 'name' ? selectedProject.name : selectedProject.description || '',
    }))
    setEditingField(null)
  }

  const saveInlineField = async (field: 'name' | 'description') => {
    if (!selectedProject) return
    if (cancelledEditRef.current === field) {
      cancelledEditRef.current = null
      return
    }

    const nextName = editProjectForm.name.trim()
    const nextDescription = editProjectForm.description?.trim() || ''
    if (!nextName) {
      toast.error('Proje adı boş bırakılamaz.')
      cancelInlineEdit('name')
      return
    }

    const previousValue = field === 'name' ? selectedProject.name : selectedProject.description || ''
    const nextValue = field === 'name' ? nextName : nextDescription
    setEditingField(null)
    if (nextValue === previousValue) return

    try {
      const updatedProject = await updateProjectMutation.mutateAsync({
        id: selectedProject.id,
        request: {
          name: nextName,
          description: nextDescription || undefined,
          status: editProjectForm.status,
        },
      })
      setEditProjectForm({
        name: updatedProject.name,
        description: updatedProject.description || '',
        status: updatedProject.status,
      })
      toast.success(field === 'name' ? 'Proje adı güncellendi.' : 'Proje açıklaması güncellendi.')
    } catch {
      setEditProjectForm((form) => ({ ...form, [field]: previousValue }))
      toast.error('Değişiklik kaydedilemedi.')
    }
  }

  const handleStatusChange = async (status: ProjectStatus) => {
    if (!selectedProject || status === selectedProject.status || updateProjectMutation.isPending || editingField) return
    const previousStatus = selectedProject.status
    setEditProjectForm((form) => ({ ...form, status }))

    try {
      await updateProjectMutation.mutateAsync({
        id: selectedProject.id,
        request: {
          name: selectedProject.name,
          description: selectedProject.description,
          status,
        },
      })
      toast.success(`Proje durumu: ${STATUS_LABELS[status]}`)
    } catch {
      setEditProjectForm((form) => ({ ...form, status: previousStatus }))
      toast.error('Proje durumu güncellenemedi.')
    }
  }

  const handleDeleteProject = async () => {
    if (!selectedProject || deleteProjectMutation.isPending) return
    try {
      await deleteProjectMutation.mutateAsync(selectedProject.id)
      setDeleteDialogOpen(false)
      setSelectedProjectId(undefined)
      toast.success('Proje silindi.')
    } catch {
      toast.error('Proje silinemedi.')
    }
  }

  const handleExportMarkdown = () => {
    if (!selectedProject) return
    const completedTasks = projectTasks.filter((task) => task.status === 'DONE').length
    const markdown = [
      `# ${selectedProject.name}`,
      '',
      selectedProject.description || '_Proje açıklaması eklenmemiş._',
      '',
      `- Durum: ${STATUS_LABELS[selectedProject.status]}`,
      `- Tamamlanma: %${completionPercent(projectTasks)}`,
      `- Görevler: ${completedTasks}/${projectTasks.length}`,
      '',
      '## Fazlar',
      '',
      ...sortedPhases.flatMap((phase) => [
        `### ${phase.name}`,
        phase.description || '_Açıklama yok._',
        `- Durum: ${STATUS_LABELS[phase.status]}`,
        `- Tarih: ${phase.startDate || '-'} / ${phase.endDate || '-'}`,
        '',
      ]),
      '## Teknoloji Stack',
      '',
      ...technologies.map((technology) => `- **${TECHNOLOGY_LABELS[technology.category]}:** ${technology.technology}${technology.notes ? ` — ${technology.notes}` : ''}`),
      '',
      '## Dokümanlar',
      '',
      ...documents.flatMap((document) => [
        `### ${document.title} (${DOCUMENT_LABELS[document.type]})`,
        document.content || '_İçerik yok._',
        '',
      ]),
      '## Kod Parçacıkları',
      '',
      ...snippets.flatMap((snippet) => [
        `### ${snippet.title}`,
        snippet.description || '',
        `\`\`\`${snippet.language || 'text'}`,
        snippet.code,
        '\`\`\`',
        '',
      ]),
      '## Kaynaklar',
      '',
      ...links.map((link) => `- [${link.title}](${link.url}) — ${LINK_TYPE_LABELS[link.type]}`),
      '',
    ].join('\n')

    const blobUrl = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.download = `${selectedProject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project'}-technical-memory.md`
    anchor.click()
    URL.revokeObjectURL(blobUrl)
    toast.success('Teknik hafıza Markdown olarak indirildi.')
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

  const handleQuickAddTaskForToday = (title: string) => {
    if (!selectedProjectId) return
    createTaskMutation.mutate(
      {
        title: title.trim(),
        status: 'TODO',
        kind: 'PROJECT',
        projectId: selectedProjectId,
        scheduledDate: today,
        planningBucket: 'DAY',
      },
      {
        onSuccess: () => {
          toast.success('Bugünkü proje görevi eklendi.')
        },
      }
    )
  }

  const handleAddPhaseFromManager = async (req: {
    name: string
    description?: string
    status: ProjectStatus
    startDate?: string
    endDate?: string
    orderIndex: number
  }) => {
    await addPhaseMutation.mutateAsync(req)
  }

  const handleDeletePhaseFromManager = async (phaseId: number) => {
    await deletePhaseMutation.mutateAsync(phaseId)
  }

  const handleReorderPhasesFromManager = (newPhases: ProjectPhase[]) => {
    reorderPhasesMutation.mutate(
      newPhases.map((item, index) => ({ id: item.id, orderIndex: index }))
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

  if (projectsLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  if (projects.length === 0 || projectOnboardingOpen || !selectedProject) {
    return (
      <div className="space-y-6">
        <PageHeader title="Projeler" titleClassName="text-neutral-950 dark:text-white" subtitle="Bir projenin teknik hafizasini, roadmap'ini ve gorevlerini tek yerden yonet." />
        <section className="glass-panel mx-auto w-full max-w-3xl overflow-hidden rounded-3xl p-5 sm:p-8">
          <div className="text-center">
            <motion.div
              animate={shouldReduceMotion ? undefined : { opacity: [0.72, 1, 0.72], scale: [1, 1.04, 1] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/25 bg-cyan-500/10 text-cyan-600 shadow-[0_0_30px_rgba(6,182,212,0.12)] dark:text-cyan-300"
            >
              <Cpu className="h-7 w-7" />
            </motion.div>
            <p className="mt-5 font-mono text-[10px] font-bold uppercase text-cyan-700 dark:text-cyan-300">
              Control room initialization
            </p>
            <h2 className="mt-2 text-2xl font-black text-neutral-950 sm:text-3xl dark:text-white">
              İlk proje odanı kur
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
              Projenin adını, amacını ve varsa GitHub deposunu ekleyerek çalışma alanını oluştur.
            </p>
          </div>

          <form onSubmit={handleCreateProject} className="mt-7 space-y-4 text-left">
            <div className="space-y-2">
              <label htmlFor="onboarding-project-name" className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Proje adı <span className="text-cyan-600 dark:text-cyan-300">*</span>
              </label>
              <Input
                id="onboarding-project-name"
                required
                autoFocus
                autoComplete="off"
                value={projectForm.name}
                onChange={(event) => setProjectForm((form) => ({ ...form, name: event.target.value }))}
                placeholder="Örn. IyonTree"
                className="h-12 rounded-xl border-neutral-300 bg-white/70 text-neutral-950 placeholder:text-neutral-500 focus-visible:border-cyan-500/60 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-[0_0_18px_rgba(6,182,212,0.16)] dark:border-neutral-800 dark:bg-neutral-950/65 dark:text-white dark:placeholder:text-neutral-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="onboarding-project-description" className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Projenin amacı <span className="text-cyan-600 dark:text-cyan-300">*</span>
              </label>
              <Textarea
                id="onboarding-project-description"
                required
                value={projectForm.description}
                onChange={(event) => setProjectForm((form) => ({ ...form, description: event.target.value }))}
                placeholder="Ne inşa ediyorsun, hangi problemi çözüyor?"
                className="min-h-[108px] rounded-xl border-neutral-300 bg-white/70 text-neutral-950 placeholder:text-neutral-500 focus-visible:border-cyan-500/60 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-[0_0_18px_rgba(6,182,212,0.16)] dark:border-neutral-800 dark:bg-neutral-950/65 dark:text-white dark:placeholder:text-neutral-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="onboarding-repository" className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                GitHub / Repo URL <span className="font-normal text-neutral-500 dark:text-neutral-400">(isteğe bağlı)</span>
              </label>
              <div className="relative">
                <Github className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <Input
                  id="onboarding-repository"
                  type="url"
                  value={projectForm.repositoryUrl}
                  onChange={(event) => setProjectForm((form) => ({ ...form, repositoryUrl: event.target.value }))}
                  placeholder="https://github.com/kullanici/proje"
                  className="h-12 rounded-xl border-neutral-300 bg-white/70 pl-10 text-neutral-950 placeholder:text-neutral-500 focus-visible:border-cyan-500/60 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-[0_0_18px_rgba(6,182,212,0.16)] dark:border-neutral-800 dark:bg-neutral-950/65 dark:text-white dark:placeholder:text-neutral-500"
                />
              </div>
            </div>

            <MovingBorderButton
              type="submit"
              disabled={isProvisioningProject || !projectForm.name.trim() || !projectForm.description?.trim()}
              borderRadius="0.875rem"
              duration={2600}
              containerClassName="h-12 w-full disabled:cursor-not-allowed disabled:opacity-50"
              className="gap-2 border-neutral-200 font-bold text-neutral-950 dark:border-neutral-800 dark:text-white"
            >
              {isProvisioningProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
              {isProvisioningProject ? 'Control Room kuruluyor...' : 'Project Control Room Kur ve Giriş Yap'}
            </MovingBorderButton>
          </form>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <main className="w-full space-y-6">
        <section className="glass-panel overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
                Project Control Room
              </p>

              {editingField === 'name' ? (
                <input
                  autoFocus
                  value={editProjectForm.name}
                  onChange={(event) => setEditProjectForm((form) => ({ ...form, name: event.target.value }))}
                  onBlur={() => void saveInlineField('name')}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      event.currentTarget.blur()
                    }
                    if (event.key === 'Escape') cancelInlineEdit('name')
                  }}
                  aria-label="Proje adını düzenle"
                  className="mt-2 w-full border-none bg-transparent p-0 text-3xl font-black text-neutral-950 outline-none focus:ring-0 sm:text-4xl dark:text-white"
                />
              ) : (
                <div className="group/name relative mt-2 inline-flex items-center gap-3">
                  <h1 className="truncate text-3xl font-black text-neutral-950 sm:text-4xl dark:text-white">
                    {selectedProject.name}
                  </h1>
                  <MovingBorderButton
                    onClick={() => setEditingField('name')}
                    borderRadius="0.5rem"
                    duration={2000}
                    containerClassName="h-8 w-8 shrink-0 translate-y-[2px] opacity-0 transition-all duration-200 group-hover/name:opacity-100"
                    className="p-0"
                    title="Proje adını düzenle"
                  >
                    <Pencil className="h-4 w-4 text-zinc-400" />
                  </MovingBorderButton>
                </div>
              )}

              {editingField === 'description' ? (
                <textarea
                  autoFocus
                  value={editProjectForm.description || ''}
                  onChange={(event) => setEditProjectForm((form) => ({ ...form, description: event.target.value }))}
                  onBlur={() => void saveInlineField('description')}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      event.currentTarget.blur()
                    }
                    if (event.key === 'Escape') cancelInlineEdit('description')
                  }}
                  aria-label="Proje açıklamasını düzenle"
                  rows={3}
                  className="mt-3 w-full resize-none border-none bg-transparent p-0 text-sm leading-6 text-neutral-700 outline-none focus:ring-0 dark:text-neutral-300"
                />
              ) : (
                <div className="group/desc relative mt-2.5 flex items-start gap-3">
                  <span className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                    {selectedProject.description || 'Proje açıklaması eklenmemiş.'}
                  </span>
                  <MovingBorderButton
                    onClick={() => setEditingField('description')}
                    borderRadius="0.5rem"
                    duration={2000}
                    containerClassName="h-7 w-7 shrink-0 opacity-0 transition-all duration-200 group-hover/desc:opacity-100"
                    className="p-0"
                    title="Proje açıklamasını düzenle"
                  >
                    <Pencil className="h-3.5 w-3.5 text-zinc-400" />
                  </MovingBorderButton>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={updateProjectMutation.isPending || !!editingField}
                  className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <MovingBorderButton
                    as="div"
                    borderRadius="0.75rem"
                    duration={2600}
                    containerClassName="h-10 min-w-[142px]"
                    className="gap-2 px-4 font-bold"
                  >
                    <span className={cn('h-2.5 w-2.5 rounded-full', STATUS_DOT_STYLES[editProjectForm.status || selectedProject.status])} />
                    {STATUS_LABELS[editProjectForm.status || selectedProject.status]}
                  </MovingBorderButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-52 rounded-xl border-border/70 bg-popover/90 p-1.5 shadow-2xl backdrop-blur-xl">
                  <DropdownMenuRadioGroup value={editProjectForm.status} onValueChange={(value) => void handleStatusChange(value as ProjectStatus)}>
                    {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((status) => (
                      <DropdownMenuRadioItem key={status} value={status} className="rounded-lg py-2.5 font-semibold">
                        <span className={cn('mr-2 h-2.5 w-2.5 rounded-full', STATUS_DOT_STYLES[status])} />
                        {STATUS_LABELS[status]}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  disabled={updateProjectMutation.isPending || !!editingField}
                  className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Proje ayarları"
                >
                  <MovingBorderButton
                    as="div"
                    borderRadius="0.75rem"
                    duration={2600}
                    containerClassName="h-10 w-10"
                    className="p-0"
                  >
                    <MoreVertical className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                  </MovingBorderButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-60 rounded-xl border-border/70 bg-popover/90 p-1.5 shadow-2xl backdrop-blur-xl">
                  <DropdownMenuItem onSelect={handleExportMarkdown} className="rounded-lg py-2.5">
                    <Download className="mr-2 h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                    Markdown olarak dışa aktar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setDeleteDialogOpen(true)} className="rounded-lg py-2.5 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-300">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Projeyi sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-border/60 md:grid-cols-4 md:divide-x md:divide-border/60">
            <HeaderMetric label="Bugün" value={`${todayTasks.length} görev`} icon={CalendarDays} accent="text-emerald-500" />
            <HeaderMetric label="Aktif Faz" value={activePhase?.name || 'Yok'} icon={GitBranch} accent="text-cyan-500" />
            <HeaderMetric
              label="Teknik Hafıza"
              value={`${documents.length + snippets.length + links.length} öğe`}
              detail={`${refactorDocs.length} refactor planı`}
              icon={FileArchive}
              accent="text-violet-500"
            />
            <HeaderMetric label="Tamamlanma" value={`%${completionPercent(projectTasks)}`} icon={Check} accent="text-amber-500" />
          </div>
          <div className="h-1 bg-neutral-200/70 dark:bg-neutral-900/80">
            <motion.div
              initial={false}
              animate={{ width: `${completionPercent(projectTasks)}%` }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.45, ease: 'easeOut' }}
              className="h-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.75)]"
            />
          </div>
        </section>

        {selectedPhase ? (
          <PhaseDetailRoom
            project={selectedProject}
            phase={selectedPhase}
            onClose={() => setActivePhaseId(null)}
          />
        ) : (
          <>
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
              <OverviewPage
                project={selectedProject}
                phases={sortedPhases}
                projectTasks={projectTasks}
                todayTasks={todayTasks}
                onTaskStatusChange={(id) => toggleTaskMutation.mutate(id)}
                onAddTask={handleQuickAddTaskForToday}
                onDeleteTask={(id) => deleteTaskMutation.mutate(id)}
              />
            )}

            {activeTab === 'phases' && (
              <PhasesManagerPage
                project={selectedProject}
                phases={sortedPhases}
                projectTasks={projectTasks}
                onEnterRoom={(id) => setActivePhaseId(id)}
                onAddPhase={handleAddPhaseFromManager}
                onDeletePhase={handleDeletePhaseFromManager}
                onReorderPhases={handleReorderPhasesFromManager}
              />
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
          </>
        )}
      </main>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-red-500/20">
          <DialogHeader>
            <DialogTitle>Projeyi kalıcı olarak sil</DialogTitle>
            <DialogDescription className="pt-2 leading-6">
              <strong className="text-foreground">{selectedProject.name}</strong> ve projeye bağlı fazlar, teknik notlar ve kaynaklar silinecek. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-3 gap-3 sm:space-x-0">
            <Button type="button" variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              İptal et
            </Button>
            <SketchButton type="button" tone="destructive" disabled={deleteProjectMutation.isPending} onClick={() => void handleDeleteProject()}>
              {deleteProjectMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Evet, projeyi sil
            </SketchButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

const HeaderMetric: React.FC<{
  label: string
  value: string
  detail?: string
  icon: React.ElementType
  accent: string
}> = ({ label, value, detail, icon: Icon, accent }) => (
  <div className="min-w-0 border-b border-border/60 p-4 odd:border-r [&:nth-child(3)]:border-b-0 last:border-b-0 md:border-b-0 md:odd:border-r-0">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">{label}</p>
        <p className="mt-1 truncate text-base font-black text-neutral-950 dark:text-white">{value}</p>
        {detail && <p className="mt-0.5 truncate text-[10px] font-semibold text-neutral-500">{detail}</p>}
      </div>
      <Icon className={cn('h-5 w-5', accent)} />
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
