import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  MoreVertical,
  Code2,
  MonitorPlay,
  Zap,
  BookOpen,
  Braces,
  Calendar,
  Clock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderOpen,
  Folder,
  FolderPlus,
  Lightbulb,
  Link as LinkIcon,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  Tv,
  Youtube,
  Play,
  Pause,
  GraduationCap,
  Presentation,
  Image,
  Globe,
  ExternalLink,
  Github,
  Pencil,
  RefreshCw,
  ClipboardList,
  CheckSquare,
  Search
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { apiClient } from '@/api/client'
import {
  useCreateEducationPractice,
  useCreateEducationResource,
  useDeleteEducationResource,
  useDeleteEducation,
  useEducation,
  useEducationPractices,
  useEducationResources,
  useUpdateEducation,
  type Education as ApiEducation,
  type EducationPractice as ApiEducationPractice,
  type EducationResource as ApiEducationResource,
  type EducationResourceType as ApiEducationResourceType,
  type EducationStatus as ApiEducationStatus,
} from '@/api/education'
import { useUploadFile } from '@/api/files'
import { useCreateTask, useTasks, useToggleTaskComplete, useDeleteTask } from '@/api/tasks'
import { cn } from '@/lib/utils'
import { mockEducationPractices, mockEducationResources, mockEducations } from './mockEducationData'
import { StudioModePanel } from './studio/modes'
import { useEducationPersistenceGuard } from './studio/useEducationPersistenceGuard'
import {
  CodeFile,
  CheatsheetItem,
  Education,
  EducationPractice,
  EducationResource,
  LanguageLevel,
  VocabularyCard,
  VocabularyType,
  FolderData,
  ReinforcementTask,
  ResourceNote,
  ReinforcementTarget
} from './types'

import { SketchButton } from '@/components/ui/SketchButton'
import { Button as MovingBorderButton } from '@/components/ui/moving-border'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { LeftFileTree } from './components/LeftFileTree'
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal'
import { OverviewTab } from './components/OverviewTab'
import { DosyalarTab } from './components/DosyalarTab'
import { LinklerTab } from './components/LinklerTab'
import { ReinforcementsTab } from './components/ReinforcementsTab'
import { CodeTab } from './components/CodeTab'
import { VocabularyTab } from './components/VocabularyTab'
import { CheatsheetTab } from './components/CheatsheetTab'
import { NotlarTab } from './components/NotlarTab'
import { useStudioFolders } from './studio/hooks/useStudioFolders'
import { useStudioTasks } from './studio/hooks/useStudioTasks'
import { useStudioNotes } from './studio/hooks/useStudioNotes'
import { useStudioCode } from './studio/hooks/useStudioCode'
import { useStudioLanguage } from './studio/hooks/useStudioLanguage'
import {
  parseCodeFiles,
  serializeCodeFiles,
  parseVocabulary,
  serializeVocabulary,
  parseCheatsheet,
  serializeCheatsheet,
  getTargetLabel,
} from './components/studioHelpers'

const toLocalEducation = (education: ApiEducation): Education => ({
  id: education.id,
  title: education.title,
  source: education.source || '',
  description: education.description || '',
  type: education.type,
  progress_percent: education.progressPercent ?? 0,
  status: education.status || 'ACTIVE',
  next_study_date: education.nextStudyDate || null,
  custom_category: education.customCategory || null,
  start_date: education.startDate || null,
  end_date: education.endDate || null,
})

const toLocalResource = (resource: ApiEducationResource): EducationResource => ({
  id: resource.id,
  education_id: resource.educationId,
  name: resource.name,
  type: resource.type,
  url_or_path: resource.urlOrPath,
})

const toLocalPractice = (practice: ApiEducationPractice): EducationPractice => ({
  id: practice.id,
  education_id: practice.educationId,
  resource_id: practice.resourceId,
  title: practice.title,
  completed: practice.completed,
  code: practice.code || '',
  notes: practice.notes || '',
  order_index: practice.orderIndex,
})

const getResourceTypeForFileName = (fileName: string): ApiEducationResourceType => {
  const normalized = fileName.toLowerCase()
  if (normalized.endsWith('.pdf')) return 'PDF'
  if (normalized.endsWith('.ppt') || normalized.endsWith('.pptx')) return 'SLIDE'
  return 'FILE'
}

const isCurriculumLabelSeparator = (char: string) => char === '-' || char === ':' || char === '|'

const trimCurriculumLabel = (value: string) => {
  let start = 0
  let end = value.length

  while (start < end && isCurriculumLabelSeparator(value[start])) {
    start += 1
  }

  while (end > start && isCurriculumLabelSeparator(value[end - 1])) {
    end -= 1
  }

  return value.slice(start, end).trim()
}

type EducationTaskContext = {
  folderId?: string
  resourceId?: number
}

const getDefaultFolderIdForResource = (resource: Pick<EducationResource, 'type'>) =>
  resource.type === 'LINK' ? 'folder-link' : 'folder-pdf'

const reconcileFoldersWithResources = (savedFolders: FolderData[], currentResources: EducationResource[]) => {
  const resourceIds = new Set(currentResources.map((resource) => resource.id))
  return savedFolders.map((folder) => ({
    ...folder,
    resourceIds: folder.resourceIds.filter((resourceId) => resourceIds.has(resourceId)),
  }))
}

const EDU_STATUS_LABELS: Record<ApiEducationStatus, string> = {
  ACTIVE: 'Çalışılıyor',
  PAUSED: 'Duraklatıldı',
  DONE: 'Tamamlandı',
}

const EDU_STATUS_DOT_STYLES: Record<ApiEducationStatus, string> = {
  ACTIVE: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]',
  PAUSED: 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.7)]',
  DONE: 'bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]',
}

export const EducationStudio: React.FC = () => {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const educationId = Number(params.id)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Mutasyon kancaları
  const createTaskMutation = useCreateTask()
  const toggleTaskMutation = useToggleTaskComplete()
  const deleteTaskMutation = useDeleteTask()
  const deleteEducationMutation = useDeleteEducation()
  const { data: persistedEducation } = useEducation(Number.isFinite(educationId) ? educationId : undefined)
  const { data: persistedResources = [], isSuccess: resourcesLoaded } = useEducationResources(educationId)
  const { data: persistedPractices = [], isSuccess: practicesLoaded } = useEducationPractices(educationId)
  const uploadFileMutation = useUploadFile()
  const createResourceMutation = useCreateEducationResource(educationId)
  const deleteResourceMutation = useDeleteEducationResource(educationId)
  const createPracticeMutation = useCreateEducationPractice(educationId)

  // Eğitimi bul
  const fallbackEducation = React.useMemo(
    () => mockEducations.find((item) => item.id === educationId),
    [educationId]
  )
  const education = React.useMemo(
    () => persistedEducation ? toLocalEducation(persistedEducation) : fallbackEducation,
    [fallbackEducation, persistedEducation]
  )
const { data: dbTasks = [] } = useTasks({ educationId })
  const { isPersistedEducation, persistedTaskIds } = useEducationPersistenceGuard(educationId, dbTasks)

  // Shared source-of-truth states
  const [resources, setResources] = React.useState<EducationResource[]>([])
  const [selectedResourceId, setSelectedResourceId] = React.useState<number | null | undefined>(null)
  const [activeTab, setActiveTab] = React.useState<'overview' | 'files' | 'links' | 'reinforce' | 'primary' | 'notes'>('overview')

  // UI state
  const [isImporterOpen, setIsImporterOpen] = React.useState(false)
  const [importText, setImportText] = React.useState('')
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)

  // ── Inline Edit State (title, description, source) ──
  const updateEducationMutation = useUpdateEducation()
  const [editingField, setEditingField] = React.useState<'title' | 'description' | 'source' | null>(null)
  const [editForm, setEditForm] = React.useState({ title: '', description: '', source: '' })
  const cancelledEditRef = React.useRef<string | null>(null)

  // Sync editForm when education data loads
  React.useEffect(() => {
    if (education) {
      setEditForm({
        title: education.title,
        description: education.description || '',
        source: education.source || '',
      })
    }
  }, [education])

  const cancelInlineEdit = React.useCallback((field: 'title' | 'description' | 'source') => {
    if (!education) return
    cancelledEditRef.current = field
    setEditForm((f) => ({
      ...f,
      [field]: field === 'title' ? education.title : field === 'description' ? (education.description || '') : (education.source || ''),
    }))
    setEditingField(null)
  }, [education])

  const saveInlineField = React.useCallback(async (field: 'title' | 'description' | 'source') => {
    if (!education) return
    if (cancelledEditRef.current === field) {
      cancelledEditRef.current = null
      return
    }
    const nextTitle = editForm.title.trim()
    const nextDescription = editForm.description.trim()
    const nextSource = editForm.source.trim()
    if (!nextTitle) {
      toast.error('Eğitim başlığı boş bırakılamaz.')
      cancelInlineEdit('title')
      return
    }
    const previousValue = field === 'title' ? education.title : field === 'description' ? (education.description || '') : (education.source || '')
    const nextValue = field === 'title' ? nextTitle : field === 'description' ? nextDescription : nextSource
    setEditingField(null)
    if (nextValue === previousValue) return

    try {
      await updateEducationMutation.mutateAsync({
        id: educationId,
        request: {
          title: nextTitle,
          source: nextSource || undefined,
          type: education.type,
          description: nextDescription || undefined,
        },
      })
      toast.success(
        field === 'title' ? 'Eğitim başlığı güncellendi.' :
        field === 'description' ? 'Açıklama güncellendi.' :
        'Kaynak güncellendi.'
      )
    } catch {
      setEditForm((f) => ({ ...f, [field]: previousValue }))
      toast.error('Değişiklik kaydedilemedi.')
    }
  }, [education, editForm, educationId, cancelInlineEdit, updateEducationMutation])

  const handleStatusChange = React.useCallback(async (status: ApiEducationStatus) => {
    if (!education || status === education.status || updateEducationMutation.isPending) return
    const previousStatus = education.status
    try {
      await updateEducationMutation.mutateAsync({
        id: educationId,
        request: {
          title: education.title,
          type: education.type,
          status,
        },
      })
      toast.success(`Eğitim durumu: ${EDU_STATUS_LABELS[status]}`)
    } catch {
      toast.error('Durum güncellenemedi.')
    }
  }, [education, educationId, updateEducationMutation])

  // UX Safety & Navigation Guard
  const isDirtyRef = React.useRef(false)

  const confirmNavigation = React.useCallback(() => {
    if (isDirtyRef.current) {
      return window.confirm('Kaydedilmemiş değişiklikleriniz var. Ayrılmak istediğinizden emin misiniz?')
    }
    return true
  }, [])

  // Call the custom hooks
  const notesState = useStudioNotes({
    educationId,
    isPersistedEducation,
    education,
    resources,
    selectedResourceId,
    setSelectedResourceId,
    activeTab,
    setActiveTab,
    setActiveFileName: (name) => {
      if (typeof name === 'function') {
        codeState.setActiveFileName(name)
      } else {
        codeState.setActiveFileName(name)
      }
    },
    setCodeDraft: (draft) => {
      if (typeof draft === 'function') {
        codeState.setCodeDraft(draft)
      } else {
        codeState.setCodeDraft(draft)
      }
    },
    confirmNavigation,
    createPracticeMutation,
  })

  const foldersState = useStudioFolders({
    educationId,
    isPersistedEducation,
    resources,
    setResources,
    practices: notesState.practices,
    setPractices: notesState.setPractices,
    selectedResourceId,
    setSelectedResourceId,
    selectedPracticeId: notesState.selectedPracticeId,
    setSelectedPracticeId: notesState.setSelectedPracticeId,
    activeTab,
    setActiveTab,
    reinforcements: notesState.reinforcements,
    setReinforcements: notesState.setReinforcements,
    resourceNoteItems: notesState.resourceNoteItems,
    setResourceNoteItems: notesState.setResourceNoteItems,
    createResourceMutation,
    deleteResourceMutation,
    uploadFileMutation,
    activeResourceNoteId: notesState.activeResourceNoteId,
    setActiveResourceNoteId: notesState.setActiveResourceNoteId,
    setNoteTitleDraft: notesState.setNoteTitleDraft,
    setNotesDraft: notesState.setNotesDraft,
  })

  const tasksState = useStudioTasks({
    educationId,
    isPersistedEducation,
    education,
    selectedPractice: notesState.selectedPractice,
    folders: foldersState.folders,
    resources,
    dbTasks,
    persistedTaskIds,
    createTaskMutation,
    toggleTaskMutation,
    deleteTaskMutation,
  })

  const codeState = useStudioCode({
    selectedPractice: notesState.selectedPractice,
    handleUpdatePractice: notesState.handleUpdatePractice,
    confirmNavigation,
  })

  const languageState = useStudioLanguage({
    selectedPractice: notesState.selectedPractice,
    handleUpdatePractice: notesState.handleUpdatePractice,
  })

  // Statistics counters and memoized properties
  const completedTasks = React.useMemo(() => {
    return tasksState.localTasks.filter(t => t.status === 'DONE').length
  }, [tasksState.localTasks])

  const totalTasks = React.useMemo(() => {
    return tasksState.localTasks.length
  }, [tasksState.localTasks])

  const weeklyTaskRatio = React.useMemo(() => {
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  }, [completedTasks, totalTasks])

  const completedResourcesCount = React.useMemo(() => {
    return resources.filter(r => foldersState.completedResources[r.id]).length
  }, [resources, foldersState.completedResources])

  const totalResources = React.useMemo(() => {
    return resources.length
  }, [resources])

  const totalCodeFiles = React.useMemo(() => {
    let count = 0
    notesState.practices.forEach(p => {
      try {
        const files = JSON.parse(p.code || '[]')
        if (Array.isArray(files)) count += files.length
      } catch {}
    })
    return count
  }, [notesState.practices])

  const totalVocabWords = React.useMemo(() => {
    let count = 0
    notesState.practices.forEach(p => {
      try {
        const cards = JSON.parse(p.code || '[]')
        if (Array.isArray(cards)) count += cards.length
      } catch {}
    })
    return count
  }, [notesState.practices])

  const totalCheatItems = React.useMemo(() => {
    let count = 0
    notesState.practices.forEach(p => {
      try {
        const items = JSON.parse(p.code || '[]')
        if (Array.isArray(items)) count += items.length
      } catch {}
    })
    return count
  }, [notesState.practices])

  const tabOptions = React.useMemo(() => {
    const base = [
      { id: 'overview', label: 'Plan & Müfredat' },
      { id: 'files', label: 'Dosyalar' },
      { id: 'links', label: 'Bağlantılar' },
      { id: 'reinforce', label: 'Pekiştirme' },
    ]
    if (education?.type === 'PROGRAMMING') {
      base.push({ id: 'primary', label: 'Kod Yaz' })
    } else if (education?.type === 'LANGUAGE') {
      base.push({ id: 'primary', label: 'Kelime Pratiği' })
    } else {
      base.push({ id: 'primary', label: 'Hap Bilgiler' })
    }
    return base
  }, [education?.type])

  const handleTabChange = React.useCallback((tabId: any) => {
    if (!confirmNavigation()) return
    setActiveTab(tabId)
  }, [confirmNavigation])

  // Synchronize dirty reference state
  React.useEffect(() => {
    isDirtyRef.current = codeState.isCodeDirty || notesState.notesDraft.trim() !== ''
  }, [codeState.isCodeDirty, notesState.notesDraft])

  // Sync data from db or local storage to state
  React.useEffect(() => {
    if (!education) return

    if (isPersistedEducation && resourcesLoaded && practicesLoaded) {
      const initialResources = persistedResources.map(toLocalResource)
      const initialPractices = persistedPractices.map(toLocalPractice)
      setResources(initialResources)
      notesState.setPractices(initialPractices)

      const savedFolders = localStorage.getItem(`folders-${educationId}`)
      if (savedFolders) {
        foldersState.setFolders(reconcileFoldersWithResources(JSON.parse(savedFolders), initialResources))
      } else {
        const pdfIds = initialResources.filter(r => r.type === 'PDF' || r.type === 'SLIDE' || r.type === 'FILE').map(r => r.id)
        const linkIds = initialResources.filter(r => r.type === 'LINK').map(r => r.id)
        foldersState.setFolders([
          { id: 'folder-pdf', name: 'Ders Kitaplari & Dokumanlar', resourceIds: pdfIds },
          { id: 'folder-link', name: 'Yardimci Web Kaynaklari & Baglantilar', resourceIds: linkIds }
        ])
      }

      const completedMap: Record<number, boolean> = {}
      initialResources.forEach(res => {
        const resPractices = initialPractices.filter(p => p.resource_id === res.id)
        completedMap[res.id] = resPractices.length > 0 && resPractices.every(p => p.completed)
      })
      foldersState.setCompletedResources(completedMap)

      const notesMap: Record<number | string, string> = {}
      const generalPractice = initialPractices.find(p => p.resource_id === null)
      if (generalPractice) notesMap.general = generalPractice.notes || ''
      initialPractices.forEach(p => {
        if (p.resource_id !== null) notesMap[p.resource_id] = p.notes || ''
      })
      notesState.setResourceNotes(notesMap)

      if (initialPractices.length > 0) {
        notesState.setSelectedPracticeId(initialPractices[0].id)
        setSelectedResourceId(initialPractices[0].resource_id)
      } else {
        notesState.setSelectedPracticeId(null)
        setSelectedResourceId(null)
      }
      return
    }

    // Local Storage Loading
    const savedResources = localStorage.getItem(`resources-${educationId}`)
    let initialResources: EducationResource[] = []
    if (savedResources) {
      initialResources = JSON.parse(savedResources)
    } else {
      initialResources = mockEducationResources.filter((r) => r.education_id === educationId)
      localStorage.setItem(`resources-${educationId}`, JSON.stringify(initialResources))
    }
    setResources(initialResources)

    const savedPractices = localStorage.getItem(`practices-${educationId}`)
    let initialPractices: EducationPractice[] = []
    if (savedPractices) {
      initialPractices = JSON.parse(savedPractices)
    } else {
      initialPractices = mockEducationPractices.filter((p) => p.education_id === educationId)
      localStorage.setItem(`practices-${educationId}`, JSON.stringify(initialPractices))
    }
    notesState.setPractices(initialPractices)

    const savedFolders = localStorage.getItem(`folders-${educationId}`)
    if (savedFolders) {
      foldersState.setFolders(JSON.parse(savedFolders))
    } else {
      const pdfIds = initialResources.filter(r => r.type === 'PDF').map(r => r.id)
      const linkIds = initialResources.filter(r => r.type === 'LINK').map(r => r.id)
      const defaultFolders = [
        { id: 'folder-pdf', name: 'Ders Kitapları & PDF Dokümanları', resourceIds: pdfIds },
        { id: 'folder-link', name: 'Yardımcı Web Kaynakları & Bağlantılar', resourceIds: linkIds }
      ]
      foldersState.setFolders(defaultFolders)
      localStorage.setItem(`folders-${educationId}`, JSON.stringify(defaultFolders))
    }

    const savedCompleted = localStorage.getItem(`completed-resources-${educationId}`)
    if (savedCompleted) {
      foldersState.setCompletedResources(JSON.parse(savedCompleted))
    } else {
      const completedMap: Record<number, boolean> = {}
      initialResources.forEach(res => {
        const resPractices = initialPractices.filter(p => p.resource_id === res.id)
        completedMap[res.id] = resPractices.length > 0 && resPractices.every(p => p.completed)
      })
      foldersState.setCompletedResources(completedMap)
      localStorage.setItem(`completed-resources-${educationId}`, JSON.stringify(completedMap))
    }

    const savedNotes = localStorage.getItem(`resource-notes-${educationId}`)
    let notesMap: Record<number | string, string> = {}
    if (savedNotes) {
      notesMap = JSON.parse(savedNotes)
      notesState.setResourceNotes(notesMap)
    } else {
      const generalPractice = initialPractices.find(p => p.resource_id === null)
      if (generalPractice) {
        notesMap['general'] = generalPractice.notes || ''
      }
      initialPractices.forEach(p => {
        if (p.resource_id !== null) {
          notesMap[p.resource_id] = p.notes || ''
        }
      })
      notesState.setResourceNotes(notesMap)
      localStorage.setItem(`resource-notes-${educationId}`, JSON.stringify(notesMap))
    }

    const savedNoteItems = localStorage.getItem(`resource-note-items-${educationId}`)
    if (savedNoteItems) {
      notesState.setResourceNoteItems(JSON.parse(savedNoteItems))
    } else {
      const now = new Date().toISOString()
      const noteItems: Record<string, ResourceNote[]> = {}
      Object.entries(notesMap).forEach(([resourceKey, content]) => {
        if (!content?.trim()) return
        noteItems[resourceKey] = [{
          id: `note-${resourceKey}-${Date.now()}`,
          resourceId: resourceKey === 'general' ? 'general' : Number(resourceKey),
          title: resourceKey === 'general' ? 'Genel Notlar' : 'Döküman Notu',
          content,
          createdAt: now,
          updatedAt: now
        }]
      })
      notesState.setResourceNoteItems(noteItems)
      localStorage.setItem(`resource-note-items-${educationId}`, JSON.stringify(noteItems))
    }

    const savedReinforcements = localStorage.getItem(`reinforcements-${educationId}`)
    if (savedReinforcements) {
      notesState.setReinforcements(JSON.parse(savedReinforcements))
    } else {
      notesState.setReinforcements({})
    }

    if (initialPractices.length > 0) {
      notesState.setSelectedPracticeId(initialPractices[0].id)
      setSelectedResourceId(initialPractices[0].resource_id)
    } else {
      notesState.setSelectedPracticeId(null)
      setSelectedResourceId(null)
    }
  }, [educationId, education, isPersistedEducation, persistedPractices, persistedResources, practicesLoaded, resourcesLoaded])

  // Local tasks sync
  React.useEffect(() => {
    const savedContexts = localStorage.getItem(`education-task-context-${educationId}`)
    tasksState.setTaskContexts(savedContexts ? JSON.parse(savedContexts) : {})

    const saved = localStorage.getItem(`local-tasks-${educationId}`)
    if (saved) {
      tasksState.setLocalTasks(JSON.parse(saved))
    } else if (dbTasks && dbTasks.length > 0) {
      const mapped = dbTasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        scheduledDate: t.scheduledDate || '',
        scheduledTime: t.scheduledTime || '',
        tag: education?.title || 'Eğitim'
      }))
      tasksState.setLocalTasks(mapped)
      localStorage.setItem(`local-tasks-${educationId}`, JSON.stringify(mapped))
    }
  }, [dbTasks, educationId, education?.title])

  const handleTreeNodeClick = React.useCallback((nodeId: string) => {
    if (!confirmNavigation()) return

    if (nodeId === 'study-plan' || nodeId === 'study-cheatsheet') {
      setSelectedResourceId(null)
      notesState.setSelectedPracticeId(null)
      setActiveTab(nodeId === 'study-plan' ? 'overview' : 'primary')
      return
    }

    if (nodeId.startsWith('folder-')) {
      return
    }

    const resourceId = Number(nodeId)
    const resource = resources.find((r) => r.id === resourceId)
    if (!resource) return

    setSelectedResourceId(resourceId)

    if (resource.type === 'LINK') {
      setActiveTab('links')
      return
    }

    if (resource.type === 'PDF' || resource.type === 'SLIDE' || resource.type === 'FILE') {
      setActiveTab('files')
    }
  }, [confirmNavigation, resources, notesState.setSelectedPracticeId])

  const handleCreateFolderRequest = React.useCallback(() => {
    foldersState.setIsFolderCreatorOpen(true)
  }, [foldersState])

  const handleUploadFileRequest = React.useCallback((folderId?: string) => {
    foldersState.setSelectedFolderId(folderId || 'uncategorized')
    foldersState.setReplacingResourceId(null)
    fileInputRef.current?.click()
  }, [foldersState])

  const handleReplaceFileRequest = React.useCallback((resId: number) => {
    foldersState.setReplacingResourceId(resId)
    const replaceInput = document.getElementById('replace-file-input') as HTMLInputElement
    replaceInput?.click()
  }, [foldersState])

  const handleAddLinkRequest = React.useCallback((folderId?: string) => {
    foldersState.setSelectedFolderId(folderId || 'uncategorized')
    foldersState.setIsLinkAdderOpen(true)
  }, [foldersState])

  const handleImportCurriculumRequest = React.useCallback(() => {
    setImportText('')
    setIsImporterOpen(true)
  }, [])

  const handleImportCurriculumSubmit = React.useCallback(() => {
    void foldersState.handleImportCurriculum(importText)
    setIsImporterOpen(false)
  }, [foldersState, importText])

  const handleToggleTaskComplete = React.useCallback((id: number | string) => {
    void tasksState.handleToggleLocalTask(id)
  }, [tasksState])

  const handleSaveTaskEdit = React.useCallback((id: number | string) => {
    void tasksState.handleSaveLocalTaskEdit(id)
  }, [tasksState])

  const handleDeleteTaskRequest = React.useCallback((id: number | string) => {
    void tasksState.handleDeleteLocalTask(id)
  }, [tasksState])

  const handleTreeNodeDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleTreeNodeDrop = React.useCallback((e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault()
    if (!foldersState.draggedResourceInfo) return
    const { folderId: sourceFolderId, resourceId } = foldersState.draggedResourceInfo

    if (sourceFolderId === targetFolderId) {
      foldersState.setDraggedResourceInfo(null)
      return
    }

    let updatedFolders = [...foldersState.folders]

    if (sourceFolderId !== 'uncategorized') {
      updatedFolders = updatedFolders.map((f) => {
        if (f.id === sourceFolderId) {
          return {
            ...f,
            resourceIds: f.resourceIds.filter((id) => id !== resourceId)
          }
        }
        return f
      })
    }

    if (targetFolderId !== 'uncategorized') {
      updatedFolders = updatedFolders.map((f) => {
        if (f.id === targetFolderId) {
          const newIds = Array.from(new Set([...f.resourceIds, resourceId]))
          return { ...f, resourceIds: newIds }
        }
        return f
      })
    }

    foldersState.saveFolders(updatedFolders)
    foldersState.setDraggedResourceInfo(null)
    toast.success('Dosya klasöre taşındı.')
  }, [foldersState])

  const cycleStatus = React.useCallback(() => {
    if (!education) return
    const statusCycle: Record<string, 'ACTIVE' | 'PAUSED' | 'DONE'> = {
      PAUSED: 'ACTIVE',
      ACTIVE: 'DONE',
      DONE: 'PAUSED',
    }
    const next = statusCycle[education.status] || 'ACTIVE'
    education.status = next
    toast.success(`Eğitim durumu "${next === 'PAUSED' ? 'Duraklatıldı' : next === 'ACTIVE' ? 'Çalışılıyor' : 'Tamamlandı'}" olarak güncellendi!`)
    setResources([...resources])
  }, [education, resources])

  const getStatusLabel = React.useCallback((status: string) => {
    if (status === 'PAUSED') return 'Duraklatildi'
    if (status === 'ACTIVE') return 'Çalışılıyor'
    if (status === 'DONE') return 'Tamamlandı'
    return 'Çalışılıyor'
  }, [])

  const handleDeleteEducation = React.useCallback(() => {
    if (!education) return
    if (window.confirm('Bu eğitimi silmek istediğinize emin misiniz?')) {
      deleteEducationMutation.mutate(educationId, {
        onSuccess: () => {
          toast.success('Eğitim başarıyla silindi.')
          navigate('/education')
        },
        onError: () => {
          toast.error('Eğitim silinirken bir hata oluştu.')
        }
      })
    }
  }, [education, educationId, navigate, deleteEducationMutation])

  const handleDownloadMarkdown = React.useCallback(() => {
    if (!education) return
    let md = `# ${education.title}\n`
    md += `**Kaynak:** ${education.source}\n`
    md += `**Durum:** ${education.status}\n`
    md += `**İlerleme:** %${education.progress_percent}\n\n`

    md += `## Müfredat ve Kaynaklar\n`
    resources.forEach((r) => {
      md += `- [${r.name}](${r.url_or_path}) (${r.type})\n`
    })
    md += `\n`

    md += `## Notlar & Pratikler\n`
    notesState.practices.forEach((p) => {
      md += `### ${p.title}\n`
      if (p.completed) {
        md += `*Durum: Tamamlandı*\n`
      }
      if (p.notes) {
        md += `#### Notlar:\n${p.notes}\n\n`
      }
      if (p.code) {
        try {
          const files = JSON.parse(p.code)
          if (Array.isArray(files)) {
            md += `#### Kod Dosyaları:\n`
            files.forEach((f: any) => {
              md += `##### ${f.name}\n\`\`\`java\n${f.content}\n\`\`\`\n\n`
            })
          } else {
            md += `#### Kod:\n\`\`\`\n${p.code}\n\`\`\`\n\n`
          }
        } catch {
          md += `#### Kod:\n\`\`\`\n${p.code}\n\`\`\`\n\n`
        }
      }
    })

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${education.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-notlari.md`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Ders notları Markdown olarak indirildi!')
  }, [education, resources, notesState.practices])

  // Sub-tab renders
  // --- 4-LEVEL LEFT FILE TREE ---
  const renderTabContent = () => {
    if (!education) return null
    const commonProps = {
      resources,
      education,
      educationId,
    }

    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            {...commonProps}
            practices={notesState.practices}
            localTasks={tasksState.localTasks}
            taskTitle={tasksState.taskTitle}
            setTaskTitle={tasksState.setTaskTitle}
            folders={foldersState.folders}
            taskFolderId={tasksState.taskFolderId}
            setTaskFolderId={tasksState.setTaskFolderId}
            taskResourceId={tasksState.taskResourceId}
            setTaskResourceId={tasksState.setTaskResourceId}
            taskContexts={tasksState.taskContexts}
            getTaskContextLabel={tasksState.getTaskContextLabel}
            taskDate={tasksState.taskDate}
            setTaskDate={tasksState.setTaskDate}
            taskTime={tasksState.taskTime}
            setTaskTime={tasksState.setTaskTime}
            handleAddTask={tasksState.handleAddTask}
            handleToggleLocalTask={handleToggleTaskComplete}
            editingTaskId={tasksState.editingTaskId}
            setEditingTaskId={tasksState.setEditingTaskId}
            editingTaskTitle={tasksState.editingTaskTitle}
            setEditingTaskTitle={tasksState.setEditingTaskTitle}
            handleSaveLocalTaskEdit={handleSaveTaskEdit}
            handleDeleteLocalTask={handleDeleteTaskRequest}
          />
        )
      case 'files':
        return (
          <DosyalarTab
            {...commonProps}
            folders={foldersState.folders}
            selectedResourceId={selectedResourceId}
            completedResources={foldersState.completedResources}
            saveCompletedResources={foldersState.saveCompletedResources}
            handleRenameResource={foldersState.handleRenameResource}
            handleDeleteResource={foldersState.handleDeleteResource}
            handleOpenNotesForResource={notesState.handleOpenNotesForResource}
            handleOpenCodeForResource={notesState.handleOpenCodeForResource}
            triggerReplaceFile={handleReplaceFileRequest}
            setActiveReinforceResourceId={notesState.setActiveReinforceResourceId}
          />
        )
      case 'links':
        return (
          <LinklerTab
            {...commonProps}
            isLinkAdderOpen={foldersState.isLinkAdderOpen}
            setIsLinkAdderOpen={foldersState.setIsLinkAdderOpen}
            newLinkName={foldersState.newLinkName}
            setNewLinkName={foldersState.setNewLinkName}
            newLinkUrl={foldersState.newLinkUrl}
            setNewLinkUrl={foldersState.setNewLinkUrl}
            handleAddLink={foldersState.handleAddLink}
          />
        )
      case 'reinforce':
        return (
          <ReinforcementsTab
            {...commonProps}
            selectedResourceId={selectedResourceId}
            reinforcements={notesState.reinforcements}
            newReinforcementTitle={notesState.newReinforcementTitle}
            setNewReinforcementTitle={notesState.setNewReinforcementTitle}
            handleAddReinforceTask={notesState.handleAddReinforceTask}
            handleToggleReinforceTask={notesState.handleToggleReinforceTask}
            handleDeleteReinforceTask={notesState.handleDeleteReinforceTask}
            handleWriteCodeForTarget={notesState.handleWriteCodeForTarget}
          />
        )
      case 'primary':
        if (education.type === 'PROGRAMMING') {
          return (
            <StudioModePanel type={education.type}>
              <CodeTab
                {...commonProps}
                selectedPractice={notesState.selectedPractice}
                activeFile={codeState.activeFile}
                codeDraft={codeState.codeDraft}
                setCodeDraft={codeState.setCodeDraft}
                activeFileName={codeState.activeFileName}
                handleSaveCodeDirectly={codeState.handleSaveCodeDirectly}
                isCodeDirty={codeState.isCodeDirty}
                folders={foldersState.folders}
                reinforcements={notesState.reinforcements}
              />
            </StudioModePanel>
          )
        } else if (education.type === 'LANGUAGE') {
          return (
            <StudioModePanel type={education.type}>
              <VocabularyTab
                vocabularyCards={languageState.vocabulary}
                activeLevel={languageState.activeLevel}
                setActiveLevel={languageState.setActiveLevel}
                word={languageState.word}
                setWord={languageState.setWord}
                meaning={languageState.meaning}
                setMeaning={languageState.setMeaning}
                wordType={languageState.wordType}
                setWordType={languageState.setWordType}
                handleAddVocabWord={languageState.handleAddVocabWord}
                handleLeitnerResult={languageState.handleLeitnerResult}
                flippedCards={languageState.flippedCards}
                setFlippedCards={languageState.setFlippedCards}
              />
            </StudioModePanel>
          )
        } else {
          return (
            <StudioModePanel type={education.type}>
              <CheatsheetTab
                cheatsheetItems={languageState.cheatsheet}
                keyConcept={languageState.keyConcept}
                setKeyConcept={languageState.setKeyConcept}
                conceptDescription={languageState.conceptDescription}
                setConceptDescription={languageState.setConceptDescription}
                handleAddCheatItem={languageState.handleAddCheatItem}
                handleDeleteCheatItem={languageState.handleDeleteCheatItem}
              />
            </StudioModePanel>
          )
        }
      case 'notes':
        return (
          <NotlarTab
            {...commonProps}
            selectedResourceId={selectedResourceId}
            saveState={notesState.saveState}
            isNotesDirty={notesState.notesDraft.trim() !== ''}
            handleSaveNotes={notesState.handleSaveNotes}
            activeNoteResourceKey={notesState.activeNotesResourceId ? String(notesState.activeNotesResourceId) : ''}
            resourceNoteItems={notesState.resourceNoteItems}
            activeResourceNoteId={notesState.activeResourceNoteId}
            handleCreateNoteForResource={notesState.handleCreateNoteForResource}
            handleDeleteNoteForResource={notesState.handleDeleteNoteForResource}
            noteTitleDraft={notesState.noteTitleDraft}
            setNoteTitleDraft={notesState.setNoteTitleDraft}
            notesDraft={notesState.notesDraft}
            setNotesDraft={notesState.setNotesDraft}
            translateInput={languageState.translateInput}
            setTranslateInput={languageState.setTranslateInput}
            translateResult={languageState.translateResult}
            handleQuickTranslate={languageState.handleQuickTranslate}
          />
        )
      default:
        return null
    }
  }

  const getMovieButtonClass = (isActive: boolean) => {
    return cn(
      "relative px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 backdrop-blur-xl border select-none cursor-pointer outline-none",
      isActive
        ? "bg-cyan-500/20 border-cyan-500 text-slate-950 dark:text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-1 ring-cyan-500/30"
        : "bg-white/40 border-slate-200/60 text-slate-800 dark:bg-zinc-950/20 dark:border-zinc-800/40 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-900/35 hover:text-slate-950 dark:hover:text-white"
    )
  }

  if (!education) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-500">
        Eğitim yükleniyor veya bulunamadı...
      </div>
    )
  }

  return (
    <div className="education-studio flex flex-col gap-6 w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={foldersState.handleFileUpload}
        className="hidden"
        accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.gif"
      />
      <input
        type="file"
        id="replace-file-input"
        onChange={foldersState.handleFileUpload}
        className="hidden"
      />
      {/* ──────────────────────────────────────────────────────────────────
          ÜST GRUP (HEADER & STATS PANEL)
          ────────────────────────────────────────────────────────────────── */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/20 backdrop-blur-xl shadow-2xl flex flex-col gap-6 shrink-0">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          {/* Sol: Geri + Başlık + Açıklama + Kaynak */}
          <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
              Eğitim Çalışma Odası
            </p>

            {/* ─── Başlık (inline edit) ─── */}
            <div className="flex items-center gap-3 mt-2 w-full">
              <button
                onClick={() => navigate('/education')}
                className="flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-white/10 hover:bg-white/20 border border-slate-200/50 dark:border-zinc-800/50 text-slate-900 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition-all backdrop-blur-md shadow-md"
                aria-label="Geri git"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {editingField === 'title' ? (
                <input
                  autoFocus
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  onBlur={() => void saveInlineField('title')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() }
                    if (e.key === 'Escape') cancelInlineEdit('title')
                  }}
                  aria-label="Eğitim başlığını düzenle"
                  className="w-full border-none bg-transparent p-0 text-2xl font-black text-neutral-950 outline-none focus:ring-0 sm:text-3xl dark:text-white"
                />
              ) : (
                <div className="group/name relative inline-flex items-center gap-3 min-w-0">
                  <h1 className="truncate text-2xl font-black text-neutral-950 sm:text-3xl dark:text-white">
                    {education.title}
                  </h1>
                  <MovingBorderButton
                    onClick={() => setEditingField('title')}
                    borderRadius="0.5rem"
                    duration={2000}
                    containerClassName="h-8 w-8 shrink-0 translate-y-[2px] opacity-0 transition-all duration-200 group-hover/name:opacity-100"
                    className="p-0"
                    title="Eğitim başlığını düzenle"
                  >
                    <Pencil className="h-4 w-4 text-zinc-400" />
                  </MovingBorderButton>
                </div>
              )}
            </div>

            {/* ─── Açıklama (inline edit) ─── */}
            {editingField === 'description' ? (
              <textarea
                autoFocus
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                onBlur={() => void saveInlineField('description')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur() }
                  if (e.key === 'Escape') cancelInlineEdit('description')
                }}
                aria-label="Açıklamayı düzenle"
                rows={2}
                className="mt-1 w-full resize-none border-none bg-transparent p-0 text-sm leading-6 text-neutral-700 outline-none focus:ring-0 dark:text-neutral-300 ml-[52px]"
              />
            ) : (
              <div className="group/desc relative mt-1 flex items-start gap-3 ml-[52px]">
                <span className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                  {education.description || 'Açıklama eklenmemiş. Tıklayarak ekleyebilirsiniz.'}
                </span>
                <MovingBorderButton
                  onClick={() => setEditingField('description')}
                  borderRadius="0.5rem"
                  duration={2000}
                  containerClassName="h-7 w-7 shrink-0 opacity-0 transition-all duration-200 group-hover/desc:opacity-100"
                  className="p-0"
                  title="Açıklamayı düzenle"
                >
                  <Pencil className="h-3.5 w-3.5 text-zinc-400" />
                </MovingBorderButton>
              </div>
            )}

            {/* ─── Kaynak (inline edit) ─── */}
            {editingField === 'source' ? (
              <input
                autoFocus
                value={editForm.source}
                onChange={(e) => setEditForm((f) => ({ ...f, source: e.target.value }))}
                onBlur={() => void saveInlineField('source')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() }
                  if (e.key === 'Escape') cancelInlineEdit('source')
                }}
                aria-label="Kaynağı düzenle"
                placeholder="Kaynak adı girin..."
                className="mt-0.5 w-full border-none bg-transparent p-0 text-xs leading-5 text-cyan-700 outline-none focus:ring-0 dark:text-cyan-300 ml-[52px]"
              />
            ) : education.source ? (
              <div className="group/src relative mt-0.5 flex items-center gap-2 ml-[52px]">
                <BookOpen className="h-3.5 w-3.5 text-cyan-600/60 dark:text-cyan-400/60 shrink-0" />
                <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">
                  {education.source}
                </span>
                <MovingBorderButton
                  onClick={() => setEditingField('source')}
                  borderRadius="0.5rem"
                  duration={2000}
                  containerClassName="h-6 w-6 shrink-0 opacity-0 transition-all duration-200 group-hover/src:opacity-100"
                  className="p-0"
                  title="Kaynağı düzenle"
                >
                  <Pencil className="h-3 w-3 text-zinc-400" />
                </MovingBorderButton>
              </div>
            ) : (
              <div className="group/src relative mt-0.5 flex items-center gap-2 ml-[52px]">
                <span className="text-xs text-neutral-500 dark:text-neutral-500 italic">
                  Kaynak eklenmemiş
                </span>
                <MovingBorderButton
                  onClick={() => setEditingField('source')}
                  borderRadius="0.5rem"
                  duration={2000}
                  containerClassName="h-6 w-6 shrink-0 opacity-0 transition-all duration-200 group-hover/src:opacity-100"
                  className="p-0"
                  title="Kaynak ekle"
                >
                  <Pencil className="h-3 w-3 text-zinc-400" />
                </MovingBorderButton>
              </div>
            )}
          </div>

          {/* Sağ: Durum Dropdown + Üç Nokta Menü */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Status Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={updateEducationMutation.isPending || !!editingField}
                className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MovingBorderButton
                  as="div"
                  borderRadius="0.75rem"
                  duration={2600}
                  containerClassName="h-10 min-w-[142px]"
                  className="gap-2 px-4 font-bold"
                >
                  <span className={cn('h-2.5 w-2.5 rounded-full', EDU_STATUS_DOT_STYLES[education.status as ApiEducationStatus])} />
                  {EDU_STATUS_LABELS[education.status as ApiEducationStatus]}
                </MovingBorderButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-52 rounded-xl border-border/70 bg-popover/90 p-1.5 shadow-2xl backdrop-blur-xl">
                <DropdownMenuRadioGroup value={education.status} onValueChange={(value) => void handleStatusChange(value as ApiEducationStatus)}>
                  {(Object.keys(EDU_STATUS_LABELS) as ApiEducationStatus[]).map((status) => (
                    <DropdownMenuRadioItem key={status} value={status} className="rounded-lg py-2.5 font-semibold">
                      <span className={cn('mr-2 h-2.5 w-2.5 rounded-full', EDU_STATUS_DOT_STYLES[status])} />
                      {EDU_STATUS_LABELS[status]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Üç Nokta Menü */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                disabled={updateEducationMutation.isPending || !!editingField}
                className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Eğitim ayarları"
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
                <DropdownMenuItem onSelect={handleDownloadMarkdown} className="rounded-lg py-2.5">
                  <FileText className="mr-2 h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                  Markdown olarak dışa aktar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleDeleteEducation} className="rounded-lg py-2.5 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-300">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eğitimi sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 4'lü İstatistik Kartları Şeridi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {/* Card 1 */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/20 backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase text-slate-900 dark:text-zinc-400 tracking-wider">Haftalık Görevler</span>
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">{completedTasks}/{totalTasks}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono">%{weeklyTaskRatio} Bitti</span>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/20 backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase text-slate-900 dark:text-zinc-400 tracking-wider">Müfredat Düzeyi</span>
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">{completedResourcesCount}/{totalResources}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">Konu Bitti</span>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/20 backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                <Code2 className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase text-slate-900 dark:text-zinc-400 tracking-wider">
                  {education.type === 'PROGRAMMING' ? 'Teknik Sınıflar' : education.type === 'LANGUAGE' ? 'Kayıtlı Kelimeler' : 'Teknik Kavramlar'}
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {education.type === 'PROGRAMMING' ? totalCodeFiles : education.type === 'LANGUAGE' ? totalVocabWords : totalCheatItems}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">Hafıza</span>
          </div>

          {/* Card 4 */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/20 backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase text-slate-900 dark:text-zinc-400 tracking-wider">İlerleme Durumu</span>
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">%{education.progress_percent}</span>
              </div>
            </div>
            <div className="w-20 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden shrink-0">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-[0_0_10px_#06b6d4] transition-all duration-500"
                style={{ width: `${education.progress_percent}%` } as any}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          ALT GRUP (SUB-NAV & BODY PANEL)
          ────────────────────────────────────────────────────────────────── */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/20 backdrop-blur-xl shadow-2xl flex flex-col gap-6 flex-grow overflow-hidden">
        {/* Sub-Navigation Pills (MovieButton stili) */}
        <div className="flex border-b border-slate-200 dark:border-zinc-800 pb-3 gap-2 shrink-0 overflow-x-auto">
          {tabOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleTabChange(option.id)}
              className={getMovieButtonClass(activeTab === option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Ana Gövde (Body) */}
        <div className="flex-grow overflow-hidden relative flex gap-6">
          {/* Sol Panel: File Tree */}
          <div className="w-80 shrink-0 hidden md:block h-full overflow-hidden">
            <LeftFileTree
              folders={foldersState.folders}
              resources={resources}
              selectedFolderId={foldersState.selectedFolderId}
              handleSelectFolder={foldersState.setSelectedFolderId}
              selectedResourceId={selectedResourceId}
              activeTab={activeTab}
              activeFileName={codeState.activeFileName}
              activeResourceNoteId={notesState.activeResourceNoteId}
              reinforcements={notesState.reinforcements}
              resourceNoteItems={notesState.resourceNoteItems}
              treeExpandedNodes={foldersState.treeExpandedNodes}
              treeLoadingNodes={foldersState.treeLoadingNodes}
              handleToggleTreeNode={foldersState.handleToggleTreeNode}
              handleTreeNodeClick={handleTreeNodeClick}
              handleRenameFolder={foldersState.handleRenameFolder}
              handleDeleteFolder={foldersState.handleDeleteFolder}
              handleRenameResource={foldersState.handleRenameResource}
              handleDeleteResource={foldersState.handleDeleteResource}
              handleRenameTask={notesState.handleRenameTask}
              handleDeleteTask={notesState.handleDeleteTask}
              handleRenameNote={notesState.handleRenameNote}
              handleDeleteNote={notesState.handleDeleteNote}
              handleCreateFolderRequest={handleCreateFolderRequest}
              handleUploadFileRequest={handleUploadFileRequest}
              handleAddLinkRequest={handleAddLinkRequest}
              handleImportCurriculumRequest={handleImportCurriculumRequest}
              handleCreateReinforcementForResource={notesState.handleCreateReinforcementForResource}
              handleCreateNoteForResource={notesState.handleCreateNoteForResource}
            />
          </div>

          {/* Sağ Panel: Tab İçeriği */}
          <div className="flex-grow overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto pr-1"
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Cascade Deletion Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!foldersState.deleteConfirmation?.isOpen}
        title={foldersState.deleteConfirmation?.title || ''}
        warningText={foldersState.deleteConfirmation?.warningText || ''}
        onClose={() => foldersState.setDeleteConfirmation(null)}
        onConfirm={() => {
          if (foldersState.deleteConfirmation) {
            if (foldersState.deleteConfirmation.type === 'folder') {
              void foldersState.executeDeleteFolder(String(foldersState.deleteConfirmation.targetId))
            } else {
              void foldersState.executeDeleteResource(Number(foldersState.deleteConfirmation.targetId))
            }
          }
        }}
      />

      {/* ──────────────────────────────────────────────────────────────────
          CURRICULUM BATCH IMPORTER MODAL
          ────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isImporterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Toplu Müfredat Bölücü (Batch Importer)
                </h3>
                <button
                  onClick={() => setIsImporterOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-900 dark:text-zinc-300 leading-relaxed">
                  Gemini veya diğer LLM modellerinden aldığınız konu başlığı metnini aşağıya yapıştırın.
                  Her bir satır dinamik olarak check-list konusuna dönüştürülecektir.
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Örn:&#10;Spring Boot Validation Girdileri&#10;JPA Entity Relationships&#10;Flyway DB Schema Migrations..."
                  className="w-full h-44 resize-none p-3 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-black/20 text-xs font-bold leading-5 text-slate-950 dark:text-white outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <SketchButton
                  type="button"
                  tone="default"
                  onClick={() => setIsImporterOpen(false)}
                >
                  İptal
                </SketchButton>
                <SketchButton
                  type="button"
                  onClick={handleImportCurriculumSubmit}
                  className="border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                >
                  Müfredatı Böl
                </SketchButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────────────
          FOLDER CREATOR MODAL
          ────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {foldersState.isFolderCreatorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  📁 Yeni Klasör Oluştur
                </h3>
                <button
                  onClick={() => foldersState.setIsFolderCreatorOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400 tracking-wider">Klasör Adı</label>
                <input
                  type="text"
                  value={foldersState.newFolderName}
                  onChange={(e) => foldersState.setNewFolderName(e.target.value)}
                  placeholder="Örn: SQL Egzersizleri, Proje Notları..."
                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-cyan-500/50 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') foldersState.handleCreateFolder()
                  }}
                />
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <SketchButton
                  type="button"
                  tone="default"
                  onClick={() => foldersState.setIsFolderCreatorOpen(false)}
                >
                  İptal
                </SketchButton>
                <SketchButton
                  type="button"
                  onClick={foldersState.handleCreateFolder}
                  className="bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:bg-cyan-600 border-cyan-600"
                >
                  Oluştur
                </SketchButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────────────
          DOCUMENT NOTES MODAL
          ────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {notesState.activeNotesResourceId !== null && (() => {
          const res = resources.find(r => r.id === notesState.activeNotesResourceId)
          if (!res) return null
          const noteText = notesState.getNoteForResource(res.id)
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl flex flex-col gap-4"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white truncate pr-4">
                    📝 Belge Notları: {res.name}
                  </h3>
                  <button
                    onClick={() => notesState.setActiveNotesResourceId(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  value={noteText}
                  onChange={(e) => notesState.handleUpdateNoteForResource(res.id, e.target.value)}
                  placeholder="Bu dökümana veya ders kaynağına ait notlarınızı buraya kaydedin (Otomatik kaydedilir)..."
                  className="w-full h-56 resize-none p-3 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-black/20 text-xs font-bold leading-5 text-slate-950 dark:text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => notesState.setActiveNotesResourceId(null)}
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:bg-cyan-600 transition-all cursor-pointer border-none"
                  >
                    Kapat
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────────────
          REINFORCEMENT MODAL
          ────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {notesState.activeReinforceResourceId !== null && (() => {
          const res = resources.find(r => r.id === notesState.activeReinforceResourceId)
          if (!res) return null
          const taskList = notesState.reinforcements[`resource:${res.id}`] || notesState.reinforcements[res.id] || []
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl flex flex-col gap-4"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                      🚀 Pekiştirme Projeleri (Max 10)
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                      {res.name}
                    </p>
                  </div>
                  <button
                    onClick={() => notesState.setActiveReinforceResourceId(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Quick Add Form */}
                {taskList.length < 10 ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="new-reinforce-input"
                      placeholder="Proje görevi yazın (örn: Validation test senaryosu ekle)..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim()
                          if (val) {
                            notesState.handleAddReinforceTask(res.id, val)
                            ;(e.target as HTMLInputElement).value = ''
                          }
                        }
                      }}
                      className="flex-grow h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-cyan-500/50 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('new-reinforce-input') as HTMLInputElement
                        const val = input?.value.trim()
                        if (val) {
                          notesState.handleAddReinforceTask(res.id, val)
                          input.value = ''
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:bg-cyan-600 transition-all cursor-pointer border-none flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Ekle</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                    ⚠️ Maksimum 10 pekiştirme projesine ulaştınız.
                  </p>
                )}

                {/* Progress bar */}
                {taskList.length > 0 && (() => {
                  const compCount = taskList.filter(t => t.completed).length
                  const pct = Math.round((compCount / taskList.length) * 100)
                  return (
                    <div className="space-y-1 bg-slate-50/50 dark:bg-black/10 p-3 rounded-xl border border-slate-200/50 dark:border-zinc-800/50">
                      <div className="flex items-center justify-between text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                        <span>Pekiştirme İlerlemesi</span>
                        <span>{compCount}/{taskList.length} (%{pct})</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${pct}%` } as any} />
                      </div>
                    </div>
                  )
                })()}

                {/* Tasks List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {taskList.length === 0 ? (
                    <p className="text-xs text-slate-900 dark:text-zinc-300 text-center py-6">
                      Henüz bir pekiştirme projesi yazmadınız.
                    </p>
                  ) : (
                    taskList.map((task, idx) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 dark:bg-zinc-900/35 border border-slate-200/40 dark:border-zinc-800/40 gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => notesState.handleToggleReinforceTask(res.id, task.id)}
                            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-zinc-700 bg-transparent cursor-pointer"
                          />
                          <span className={cn(
                            "text-xs font-bold text-slate-900 dark:text-white truncate",
                            task.completed && "line-through opacity-50"
                          )}>
                            {idx + 1}. {task.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => notesState.handleWriteCodeForTarget({ id: String(res.id), type: 'resource', label: res.name, resource: res }, task)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold"
                          >
                            <Code2 className="h-3 w-3" />
                            <span>Kod Yaz</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => notesState.handleDeleteReinforceTask(res.id, task.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-zinc-800">
                  <button
                    onClick={() => notesState.setActiveReinforceResourceId(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-white text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all cursor-pointer border-none"
                  >
                    Kapat
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
