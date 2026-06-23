import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
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
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { OverviewPage } from './OverviewPage'
import { TaskCreationForm } from './TaskCreationForm'
import { PhasesManagerPage } from './PhasesManagerPage'
import { PhaseDetailRoom } from './PhaseDetailRoom'
import { ProjectTechStack } from '../../components/dashboard/ProjectTechStack'
import { DbSchemaStudio } from './DbSchemaStudio'
import { DocumentsView } from './DocumentsView'
import { CodeLibraryView } from './CodeLibraryView'
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
  const { id: urlProjectId, phaseId: urlPhaseId } = useParams<{ id?: string; phaseId?: string }>()
  const navigate = useNavigate()
  const {
    activeProjectId: selectedProjectId,
    projectOnboardingOpen,
    setActiveProjectId: setSelectedProjectId,
    setProjectOnboardingOpen,
  } = useUiStore()
  const [activeTab, setActiveTab] = useState<ProjectTab>('overview')
  const [activePhaseId, setActivePhaseId] = useState<number | null>(null)

  useEffect(() => {
    if (urlProjectId) {
      const parsedId = parseInt(urlProjectId, 10)
      if (!isNaN(parsedId) && selectedProjectId !== parsedId) {
        setSelectedProjectId(parsedId)
      }
    }
  }, [urlProjectId, selectedProjectId, setSelectedProjectId])

  useEffect(() => {
    if (urlPhaseId) {
      const parsedPhaseId = parseInt(urlPhaseId, 10)
      if (!isNaN(parsedPhaseId)) {
        setActivePhaseId(parsedPhaseId)
      }
    } else {
      setActivePhaseId(null)
    }
  }, [urlPhaseId])


  const [projectForm, setProjectForm] = useState<ProjectOnboardingForm>(emptyProjectOnboardingForm)
  const [isProvisioningProject, setIsProvisioningProject] = useState(false)
  const [editProjectForm, setEditProjectForm] = useState<ProjectRequest>({ name: '', description: '', status: 'PLANNING' })
  const [editingField, setEditingField] = useState<'name' | 'description' | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const cancelledEditRef = useRef<'name' | 'description' | null>(null)
  const [phaseForm, setPhaseForm] = useState({ name: '', description: '', status: 'PLANNING' as ProjectStatus, startDate: '', endDate: '' })
  const [techForm, setTechForm] = useState({ category: 'FRONTEND' as TechnologyCategory, title: '', technology: '', notes: '' })


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
  const refactorDocs = documents.filter((document) => document.type === 'REFACTOR_PLAN')

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
    if (!urlProjectId && !projectsLoading && projects.length > 0 && !selectedProject && !projectOnboardingOpen) {
      setSelectedProjectId(projects[0].id)
    }
  }, [urlProjectId, projectsLoading, projects, selectedProject, projectOnboardingOpen, setSelectedProjectId])

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
      <main className="w-full">
        <AnimatePresence mode="wait">
          {selectedPhase ? (
            <motion.div
              key="phase-control-room"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="space-y-6"
            >
              <PhaseDetailRoom
                project={selectedProject}
                phase={selectedPhase}
                phaseIndex={phases.findIndex((p) => p.id === selectedPhase.id)}
                onBack={() => navigate('/projects')}
              />
            </motion.div>
          ) : (
            <motion.div
              key="project-dashboard"
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="space-y-6"
            >
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

            <section className="glass-panel rounded-2xl p-2 border border-zinc-200/60 dark:border-zinc-800/40 backdrop-blur-xl">
              <div className="flex gap-2 overflow-x-auto p-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return isActive ? (
                    <MovingBorderButton
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      borderRadius="0.75rem"
                      containerClassName="h-9 shrink-0"
                      className="px-3.5 font-bold text-xs flex items-center gap-2 !border-zinc-200/80 !bg-white text-neutral-900 dark:!border-zinc-800 dark:!bg-[#141414] dark:text-neutral-100"
                    >
                      <Icon className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                      {tab.label}
                    </MovingBorderButton>
                  ) : (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="h-9 inline-flex shrink-0 items-center gap-2 rounded-xl border border-zinc-200/40 bg-zinc-100/50 px-3.5 text-xs font-bold text-zinc-500 transition-all hover:bg-zinc-200/70 hover:text-zinc-900 dark:border-zinc-800/40 dark:bg-zinc-900/30 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100"
                    >
                      <Icon className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
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
              <div className="space-y-6">
                <TaskCreationForm project={selectedProject} phases={sortedPhases} />
                <Panel title="Proje Görevleri" icon={ListChecks}>
                  <div className="mt-2">
                    <TaskList tasks={projectTasks} onToggle={(id) => toggleTaskMutation.mutate(id)} onDelete={(id) => deleteTaskMutation.mutate(id)} />
                  </div>
                </Panel>
              </div>
            )}

            {activeTab === 'stack' && (
              <ProjectTechStack project={selectedProject} />
            )}

            {activeTab === 'schema' && (
              <DbSchemaStudio project={selectedProject} />
            )}

            {activeTab === 'documents' && (
              <DocumentsView project={selectedProject} />
            )}

            {activeTab === 'snippets' && (
              <CodeLibraryView project={selectedProject} />
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
          </motion.div>
        )}
      </AnimatePresence>
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
        <div key={task.id} className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/40 bg-white/50 dark:bg-black/30 backdrop-blur-sm p-3">
          <div className="flex min-w-0 items-start gap-3">
            <button
              onClick={() => onToggle(task.id)}
              className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all duration-200',
                task.status === 'DONE' ? 'border-emerald-500 bg-emerald-500 text-white dark:text-black' : 'border-zinc-350 dark:border-zinc-700 hover:border-cyan-550 dark:hover:border-cyan-400'
              )}
            >
              {task.status === 'DONE' && <Check className="h-3.5 w-3.5" />}
            </button>
            <div className="min-w-0">
              <p className={cn('truncate font-bold', dense ? 'text-xs' : 'text-sm', task.status === 'DONE' ? 'text-zinc-400 dark:text-zinc-550 line-through' : 'text-slate-800 dark:text-zinc-100')}>
                {task.title}
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-550">
                {task.scheduledDate || 'backlog'} {task.scheduledTime || ''}
              </p>
              {task.notes && <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-450">{task.notes}</p>}
            </div>
          </div>
          <button onClick={() => onDelete(task.id)} className="text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

const EmptyLine: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800/60 bg-zinc-500/5 dark:bg-black/20 p-4 text-center text-xs font-semibold text-zinc-400 dark:text-zinc-500">
    {text}
  </div>
)



// Obsolete inline schema helpers removed

export default ProjectsPage
