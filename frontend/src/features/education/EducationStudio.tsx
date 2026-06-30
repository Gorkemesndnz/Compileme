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
  useEducation,
  useEducationPractices,
  useEducationResources,
  type Education as ApiEducation,
  type EducationPractice as ApiEducationPractice,
  type EducationResource as ApiEducationResource,
  type EducationResourceType as ApiEducationResourceType,
} from '@/api/education'
import { useUploadFile } from '@/api/files'
import { useCreateTask, useTasks, useToggleTaskComplete, useDeleteTask } from '@/api/tasks'
import { cn } from '@/lib/utils'
import { mockEducationPractices, mockEducationResources, mockEducations } from './mockEducationData'
import { DateTimePicker } from '@/features/dashboard/DateTimePicker'
import { ProjectDocument, useProjectDocuments, useProjects } from '@/api/projects'
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
import {
  parseCodeFiles,
  serializeCodeFiles,
  parseVocabulary,
  serializeVocabulary,
  parseCheatsheet,
  serializeCheatsheet,
  getPlatformIcon,
  getBrandIcon,
  getFileIcon,
  getTargetLabel,
  buildLineNumbers
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

export const EducationStudio: React.FC = () => {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const educationId = Number(params.id)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Mutasyon kancaları
  const createTaskMutation = useCreateTask()
  const toggleTaskMutation = useToggleTaskComplete()
  const deleteTaskMutation = useDeleteTask()
  const { data: projects = [] } = useProjects()
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

  // DB'den bu eğitime ait görevleri çek
  const { data: dbTasks = [] } = useTasks({ educationId })
  const { isPersistedEducation, persistedTaskIds } = useEducationPersistenceGuard(educationId, dbTasks)

  // Yerel veri durumları
  const [resources, setResources] = React.useState<EducationResource[]>([])
  const [practices, setPractices] = React.useState<EducationPractice[]>([])

  const [selectedResourceId, setSelectedResourceId] = React.useState<number | null | undefined>(null)
  const [selectedPracticeId, setSelectedPracticeId] = React.useState<number | null>(null)
  const [activeTab, setActiveTab] = React.useState<'overview' | 'files' | 'links' | 'reinforce' | 'primary' | 'notes'>('overview')
  const [notesDraft, setNotesDraft] = React.useState('')
  const [noteTitleDraft, setNoteTitleDraft] = React.useState('')
  const [activeResourceNoteId, setActiveResourceNoteId] = React.useState<string | null>(null)
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved'>('idle')

  // Modals & Dropdowns
  const [isImporterOpen, setIsImporterOpen] = React.useState(false)
  const [importText, setImportText] = React.useState('')
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)

  // Task Form State
  const [taskTitle, setTaskTitle] = React.useState('')
  const [taskDate, setTaskDate] = React.useState('')
  const [taskTime, setTaskTime] = React.useState('')

  // Interactive Task Scheduler State
  const [localTasks, setLocalTasks] = React.useState<any[]>([])
  const [editingTaskId, setEditingTaskId] = React.useState<number | string | null>(null)
  const [editingTaskTitle, setEditingTaskTitle] = React.useState('')

  // Code Studio States
  const [activeFileName, setActiveFileName] = React.useState('Main.java')

  // Language States
  const [activeLevel, setActiveLevel] = React.useState<LanguageLevel>('A1_A2')
  const [word, setWord] = React.useState('')
  const [meaning, setMeaning] = React.useState('')
  const [wordType, setWordType] = React.useState<VocabularyType>('Noun')
  const [isTranslateOpen, setIsTranslateOpen] = React.useState(false)
  const [translateInput, setTranslateInput] = React.useState('')
  const [translateResult, setTranslateResult] = React.useState('')
  const [flippedCards, setFlippedCards] = React.useState<Record<number, boolean>>({})

  // Cheatsheet States
  const [keyConcept, setKeyConcept] = React.useState('')
  const [conceptDescription, setConceptDescription] = React.useState('')

  // Folders State
  const [folders, setFolders] = React.useState<FolderData[]>([])
  const [foldersOpen, setFoldersOpen] = React.useState<Record<string, boolean>>({
    'folder-pdf': true,
    'folder-link': true
  })

  // Drag & Drop States
  const [draggedFolderIndex, setDraggedFolderIndex] = React.useState<number | null>(null)
  const [draggedResourceInfo, setDraggedResourceInfo] = React.useState<{ folderId: string; resourceId: number } | null>(null)

  // Links state
  const [newLinkName, setNewLinkName] = React.useState('')
  const [newLinkUrl, setNewLinkUrl] = React.useState('')
  const [isLinkAdderOpen, setIsLinkAdderOpen] = React.useState(false)

  // -- NEW TRACKING STATES & PERSISTENCE HELPER FUNCTIONS --
  const [completedResources, setCompletedResources] = React.useState<Record<number, boolean>>({})
  const [resourceNotes, setResourceNotes] = React.useState<Record<number | string, string>>({})
  const [resourceNoteItems, setResourceNoteItems] = React.useState<Record<string, ResourceNote[]>>({})
  const [activeNotesResourceId, setActiveNotesResourceId] = React.useState<number | null>(null)
  const [reinforcements, setReinforcements] = React.useState<Record<string, ReinforcementTask[]>>({})
  const [activeReinforceResourceId, setActiveReinforceResourceId] = React.useState<number | null>(null)
  const [selectedProjectId, setSelectedProjectId] = React.useState<number | undefined>(undefined)
  const [reinforcementSearch, setReinforcementSearch] = React.useState('')
  const [selectedReinforcementTargetId, setSelectedReinforcementTargetId] = React.useState('')
  const [newReinforcementTitle, setNewReinforcementTitle] = React.useState('')
  const [isFolderCreatorOpen, setIsFolderCreatorOpen] = React.useState(false)
  const [newFolderName, setNewFolderName] = React.useState('')
  const [replacingResourceId, setReplacingResourceId] = React.useState<number | null>(null)

  // UX Safety, Left Panel File Tree & CRUD State Declarations
  const [codeDraft, setCodeDraft] = React.useState<string | null>(null)
  const [selectedFolderIdForDropdown, setSelectedFolderIdForDropdown] = React.useState<string>('')
  const [treeExpandedNodes, setTreeExpandedNodes] = React.useState<Record<string, boolean>>({})
  const [treeLoadingNodes, setTreeLoadingNodes] = React.useState<Record<string, boolean>>({})
  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
    isOpen: boolean
    type: 'folder' | 'resource'
    targetId: string | number
    title: string
    warningText: string
  } | null>(null)

  const saveResources = (newResources: EducationResource[]) => {
    setResources(newResources)
    if (!isPersistedEducation) {
      localStorage.setItem(`resources-${educationId}`, JSON.stringify(newResources))
    }
  }

  const savePractices = (newPractices: EducationPractice[]) => {
    setPractices(newPractices)
    if (!isPersistedEducation) {
      localStorage.setItem(`practices-${educationId}`, JSON.stringify(newPractices))
    }
  }

  const saveFolders = (newFolders: FolderData[]) => {
    setFolders(newFolders)
    localStorage.setItem(`folders-${educationId}`, JSON.stringify(newFolders))
  }

  const saveCompletedResources = (newCompleted: Record<number, boolean>) => {
    setCompletedResources(newCompleted)
    localStorage.setItem(`completed-resources-${educationId}`, JSON.stringify(newCompleted))
  }

  const saveResourceNotes = (newNotes: Record<number | string, string>) => {
    setResourceNotes(newNotes)
    localStorage.setItem(`resource-notes-${educationId}`, JSON.stringify(newNotes))
  }

  const saveResourceNoteItems = (newItems: Record<string, ResourceNote[]>) => {
    setResourceNoteItems(newItems)
    localStorage.setItem(`resource-note-items-${educationId}`, JSON.stringify(newItems))
  }

  const saveReinforcements = (newReinforcements: Record<string, ReinforcementTask[]>) => {
    setReinforcements(newReinforcements)
    localStorage.setItem(`reinforcements-${educationId}`, JSON.stringify(newReinforcements))
  }

  // Eğitimin verilerini yerel state ile bağla
  React.useEffect(() => {
    if (!education) return

    if (isPersistedEducation && resourcesLoaded && practicesLoaded) {
      const initialResources = persistedResources.map(toLocalResource)
      const initialPractices = persistedPractices.map(toLocalPractice)
      setResources(initialResources)
      setPractices(initialPractices)

      const pdfIds = initialResources.filter(r => r.type === 'PDF' || r.type === 'SLIDE' || r.type === 'FILE').map(r => r.id)
      const linkIds = initialResources.filter(r => r.type === 'LINK').map(r => r.id)
      setFolders([
        { id: 'folder-pdf', name: 'Ders Kitaplari & Dokumanlar', resourceIds: pdfIds },
        { id: 'folder-link', name: 'Yardimci Web Kaynaklari & Baglantilar', resourceIds: linkIds }
      ])

      const completedMap: Record<number, boolean> = {}
      initialResources.forEach(res => {
        const resPractices = initialPractices.filter(p => p.resource_id === res.id)
        completedMap[res.id] = resPractices.length > 0 && resPractices.every(p => p.completed)
      })
      setCompletedResources(completedMap)

      const notesMap: Record<number | string, string> = {}
      const generalPractice = initialPractices.find(p => p.resource_id === null)
      if (generalPractice) notesMap.general = generalPractice.notes || ''
      initialPractices.forEach(p => {
        if (p.resource_id !== null) notesMap[p.resource_id] = p.notes || ''
      })
      setResourceNotes(notesMap)

      if (initialPractices.length > 0) {
        setSelectedPracticeId(initialPractices[0].id)
        setSelectedResourceId(initialPractices[0].resource_id)
      } else {
        setSelectedPracticeId(null)
        setSelectedResourceId(null)
      }
      return
    }

    // 1. Resources
    const savedResources = localStorage.getItem(`resources-${educationId}`)
    let initialResources: EducationResource[] = []
    if (savedResources) {
      initialResources = JSON.parse(savedResources)
    } else {
      initialResources = mockEducationResources.filter((r) => r.education_id === educationId)
      localStorage.setItem(`resources-${educationId}`, JSON.stringify(initialResources))
    }
    setResources(initialResources)

    // 2. Practices
    const savedPractices = localStorage.getItem(`practices-${educationId}`)
    let initialPractices: EducationPractice[] = []
    if (savedPractices) {
      initialPractices = JSON.parse(savedPractices)
    } else {
      initialPractices = mockEducationPractices.filter((p) => p.education_id === educationId)
      localStorage.setItem(`practices-${educationId}`, JSON.stringify(initialPractices))
    }
    setPractices(initialPractices)

    // 3. Folders
    const savedFolders = localStorage.getItem(`folders-${educationId}`)
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders))
    } else {
      const pdfIds = initialResources.filter(r => r.type === 'PDF').map(r => r.id)
      const linkIds = initialResources.filter(r => r.type === 'LINK').map(r => r.id)
      const defaultFolders = [
        { id: 'folder-pdf', name: 'Ders Kitapları & PDF Dokümanları', resourceIds: pdfIds },
        { id: 'folder-link', name: 'Yardımcı Web Kaynakları & Bağlantılar', resourceIds: linkIds }
      ]
      setFolders(defaultFolders)
      localStorage.setItem(`folders-${educationId}`, JSON.stringify(defaultFolders))
    }

    // 4. Completed Resources
    const savedCompleted = localStorage.getItem(`completed-resources-${educationId}`)
    if (savedCompleted) {
      setCompletedResources(JSON.parse(savedCompleted))
    } else {
      const completedMap: Record<number, boolean> = {}
      initialResources.forEach(res => {
        const resPractices = initialPractices.filter(p => p.resource_id === res.id)
        completedMap[res.id] = resPractices.length > 0 && resPractices.every(p => p.completed)
      })
      setCompletedResources(completedMap)
      localStorage.setItem(`completed-resources-${educationId}`, JSON.stringify(completedMap))
    }

    // 5. Resource Notes
    const savedNotes = localStorage.getItem(`resource-notes-${educationId}`)
    let notesMap: Record<number | string, string> = {}
    if (savedNotes) {
      notesMap = JSON.parse(savedNotes)
      setResourceNotes(notesMap)
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
      setResourceNotes(notesMap)
      localStorage.setItem(`resource-notes-${educationId}`, JSON.stringify(notesMap))
    }

    const savedNoteItems = localStorage.getItem(`resource-note-items-${educationId}`)
    if (savedNoteItems) {
      setResourceNoteItems(JSON.parse(savedNoteItems))
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
      setResourceNoteItems(noteItems)
      localStorage.setItem(`resource-note-items-${educationId}`, JSON.stringify(noteItems))
    }

    // 6. Reinforcements
    const savedReinforcements = localStorage.getItem(`reinforcements-${educationId}`)
    if (savedReinforcements) {
      setReinforcements(JSON.parse(savedReinforcements))
    } else {
      setReinforcements({})
    }

    if (initialPractices.length > 0) {
      setSelectedPracticeId(initialPractices[0].id)
      setSelectedResourceId(initialPractices[0].resource_id)
    } else {
      setSelectedPracticeId(null)
      setSelectedResourceId(null)
    }
  }, [educationId, education, isPersistedEducation, persistedPractices, persistedResources, practicesLoaded, resourcesLoaded])

  // Local tasks synchronizer
  React.useEffect(() => {
    const saved = localStorage.getItem(`local-tasks-${educationId}`)
    if (saved) {
      setLocalTasks(JSON.parse(saved))
    } else if (dbTasks && dbTasks.length > 0) {
      const mapped = dbTasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        scheduledDate: t.scheduledDate || '',
        scheduledTime: t.scheduledTime || '',
        tag: education?.title || 'Eğitim'
      }))
      setLocalTasks(mapped)
      localStorage.setItem(`local-tasks-${educationId}`, JSON.stringify(mapped))
    }
  }, [dbTasks, educationId, education?.title])

  const selectedPractice = React.useMemo(
    () => practices.find((p) => p.id === selectedPracticeId),
    [practices, selectedPracticeId]
  )

  React.useEffect(() => {
    if (selectedProjectId === undefined && projects.length > 0) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  const { data: projectDocuments = [] } = useProjectDocuments(selectedProjectId)

  const reinforcementTargets = React.useMemo<ReinforcementTarget[]>(() => {
    const resourceTargets = resources.map((resource) => ({
      id: `resource:${resource.id}`,
      type: 'resource' as const,
      label: resource.name,
      resource
    }))

    const selectedProject = projects.find((project) => project.id === selectedProjectId)
    const documentTargets = projectDocuments.map((document) => ({
      id: `project-document:${document.id}`,
      type: 'project-document' as const,
      label: document.title,
      projectName: selectedProject?.name || 'Proje',
      document
    }))

    return [...resourceTargets, ...documentTargets]
  }, [projectDocuments, projects, resources, selectedProjectId])

  React.useEffect(() => {
    if (!selectedReinforcementTargetId && reinforcementTargets.length > 0) {
      setSelectedReinforcementTargetId(reinforcementTargets[0].id)
    }
  }, [reinforcementTargets, selectedReinforcementTargetId])

  const selectedReinforcementTarget = React.useMemo(
    () => reinforcementTargets.find((target) => target.id === selectedReinforcementTargetId),
    [reinforcementTargets, selectedReinforcementTargetId]
  )

  const activeNoteResourceKey = selectedResourceId === null || selectedResourceId === undefined
    ? 'general'
    : String(selectedResourceId)

  const activeResourceNotes = React.useMemo(
    () => resourceNoteItems[activeNoteResourceKey] || [],
    [activeNoteResourceKey, resourceNoteItems]
  )
  const activeResourceNote = React.useMemo(
    () => activeResourceNotes.find((note) => note.id === activeResourceNoteId) || activeResourceNotes[0] || null,
    [activeResourceNoteId, activeResourceNotes]
  )

  // Not taslağını pratik değiştikçe güncelle
  React.useEffect(() => {
    if (activeResourceNote) {
      setActiveResourceNoteId(activeResourceNote.id)
      setNoteTitleDraft(activeResourceNote.title)
      setNotesDraft(activeResourceNote.content)
      return
    }
    setNoteTitleDraft('')
    setNotesDraft(selectedPractice?.notes ?? '')
  }, [activeNoteResourceKey, activeResourceNote?.id, selectedPracticeId, selectedPractice?.notes])

  // Debounced auto-save notlar için - PASSED (Manüel kayıt aktif)

  // Genel veri güncelleme handler'ı
  const handleUpdatePractice = React.useCallback(
    async (practiceId: number, updatedFields: Partial<EducationPractice>) => {
      const current = practices.find((p) => p.id === practiceId)
      if (!current) return

      const merged = { ...current, ...updatedFields }
      setPractices((prev) => prev.map((p) => (p.id === practiceId ? merged : p)))
      if (!isPersistedEducation) {
        return
      }

      try {
        await apiClient.patch(`/educations/practices/${practiceId}`, {
          title: merged.title,
          completed: merged.completed,
          code: merged.code,
          notes: merged.notes,
          resourceId: merged.resource_id,
          orderIndex: merged.order_index ?? 0,
        })
      } catch (error) {
        toast.error('Güncelleme arka planda saklanamadı.')
      }
    },
    [isPersistedEducation, practices]
  )

  const createPracticeFromDraft = React.useCallback(
    async (draft: Omit<EducationPractice, 'id'>) => {
      if (isPersistedEducation) {
        const created = await createPracticeMutation.mutateAsync({
          title: draft.title,
          completed: draft.completed,
          code: draft.code,
          notes: draft.notes,
          resourceId: draft.resource_id,
          orderIndex: draft.order_index,
        })
        return toLocalPractice(created)
      }

      return {
        ...draft,
        id: Date.now(),
      }
    },
    [createPracticeMutation, isPersistedEducation]
  )

  // Toplu Müfredat İçe Aktarma (Syllabus Parser)
  const handleImportCurriculum = async () => {
    const lines = importText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length === 0) {
      toast.error('Lütfen en az bir konu başlığı ekleyin.')
      return
    }

    const nextResourceId = Math.max(Date.now(), ...resources.map((r) => r.id)) + 1
    const newResources: EducationResource[] = []

    lines.forEach((line, idx) => {
      const urlRegex = /(https?:\/\/[^\s]+)/
      const match = line.match(urlRegex)
      let name = line
      let url = `imported://${line.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      let type: ApiEducationResourceType = 'FILE'

      if (match) {
        url = match[1]
        name = trimCurriculumLabel(line.replace(url, '').trim()) || url
        type = 'LINK'
      } else if (line.toLowerCase().includes('.pdf')) {
        type = 'PDF'
        url = `/files/${line.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`
      } else if (
        line.toLowerCase().includes('video') ||
        line.toLowerCase().includes('watch') ||
        line.toLowerCase().includes('youtube') ||
        line.toLowerCase().includes('oynatma')
      ) {
        type = 'LINK'
      }

      newResources.push({
        id: nextResourceId + idx,
        education_id: educationId,
        name,
        type,
        url_or_path: url,
      })
    })

    if (isPersistedEducation) {
      try {
        await Promise.all(newResources.map((resource, index) =>
          createResourceMutation.mutateAsync({
            name: resource.name,
            type: resource.type,
            urlOrPath: resource.url_or_path,
            orderIndex: resources.length + index,
          })
        ))
        setImportText('')
        setIsImporterOpen(false)
        toast.success(`${newResources.length} yeni kaynak mufredata eklendi!`)
      } catch {
        toast.error('Kaynaklar sunucuya kaydedilemedi.')
      }
      return
    }

    const updatedResources = [...resources, ...newResources]
    saveResources(updatedResources)

    const pdfIds = newResources.filter(r => r.type === 'PDF' || r.type === 'FILE' || r.type === 'SLIDE').map(r => r.id)
    const linkIds = newResources.filter(r => r.type === 'LINK').map(r => r.id)

    // Put them in folder-pdf or folder-link if folders exist, otherwise uncategorized
    const updatedFolders = folders.map(f => {
      if (f.id === 'folder-pdf') {
        return { ...f, resourceIds: [...f.resourceIds, ...pdfIds] }
      }
      if (f.id === 'folder-link') {
        return { ...f, resourceIds: [...f.resourceIds, ...linkIds] }
      }
      return f
    })
    saveFolders(updatedFolders)

    setImportText('')
    setIsImporterOpen(false)
    toast.success(`${newResources.length} yeni kaynak müfredata eklendi!`)
  }

  // Tekil Dosya Yükle
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (isPersistedEducation) {
      try {
        const uploaded = await uploadFileMutation.mutateAsync(file)
        await createResourceMutation.mutateAsync({
          name: file.name,
          type: getResourceTypeForFileName(file.name),
          urlOrPath: uploaded.downloadUrl || `/api/files/${uploaded.id}`,
          orderIndex: resources.length,
        })
        toast.success('Dosya basariyla yuklendi!')
      } catch {
        toast.error('Dosya sunucuya yuklenemedi.')
      }
      return
    }

    const newResource: EducationResource = {
      id: Date.now(),
      education_id: educationId,
      name: file.name,
      type: getResourceTypeForFileName(file.name),
      url_or_path: URL.createObjectURL(file)
    }

    const updatedResources = [...resources, newResource]
    saveResources(updatedResources)

    const targetFolderId = newResource.type === 'LINK' ? 'folder-link' : 'folder-pdf'
    const folderExists = folders.some(f => f.id === targetFolderId)

    if (folderExists) {
      const updatedFolders = folders.map(f => {
        if (f.id === targetFolderId) {
          return { ...f, resourceIds: [...f.resourceIds, newResource.id] }
        }
        return f
      })
      saveFolders(updatedFolders)
    }

    toast.success('Dosya başarıyla yüklendi!')
  }

  // Yeni Klasör Oluştur
  const handleCreateFolder = () => {
    const name = newFolderName.trim()
    if (!name) {
      toast.error('Klasör ismi boş olamaz.')
      return
    }
    const newFolder: FolderData = {
      id: `folder-${Date.now()}`,
      name,
      resourceIds: []
    }
    const updatedFolders = [...folders, newFolder]
    saveFolders(updatedFolders)
    setFoldersOpen(prev => ({ ...prev, [newFolder.id]: true }))
    setNewFolderName('')
    setIsFolderCreatorOpen(false)
    toast.success('Yeni klasör oluşturuldu.')
  }

  // Klasör Yeniden Adlandır
  const handleRenameFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) return
    const newName = window.prompt('Klasör için yeni bir isim girin:', folder.name)
    if (newName && newName.trim()) {
      const updated = folders.map(f => f.id === folderId ? { ...f, name: newName.trim() } : f)
      saveFolders(updated)
      toast.success('Klasör adı güncellendi.')
    }
  }

  // Klasör Sil (Cascade Warning Modal tetikler)
  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) return

    const fileCount = folder.resourceIds.length
    let taskCount = 0
    let noteCount = 0

    folder.resourceIds.forEach((resId) => {
      const actualTaskKey = reinforcements[`resource:${resId}`] ? `resource:${resId}` : (reinforcements[String(resId)] ? String(resId) : `resource:${resId}`)
      taskCount += (reinforcements[actualTaskKey] || []).length

      const actualNoteKey = resourceNoteItems[`resource:${resId}`] ? `resource:${resId}` : (resourceNoteItems[String(resId)] ? String(resId) : `resource:${resId}`)
      noteCount += (resourceNoteItems[actualNoteKey] || []).length
    })

    if (fileCount > 0 || taskCount > 0 || noteCount > 0) {
      setDeleteConfirmation({
        isOpen: true,
        type: 'folder',
        targetId: folderId,
        title: `"${folder.name}" Klasörünü Sil`,
        warningText: `Bu klasörü silmek altındaki ${fileCount} dosyayı, ${taskCount} pekiştirme görevini ve ${noteCount} notu kalıcı olarak silecektir. Devam etmek istiyor musunuz?`
      })
    } else {
      if (window.confirm('Bu boş klasörü silmek istediğinize emin misiniz?')) {
        void executeDeleteFolder(folderId)
      }
    }
  }

  const executeDeleteFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) return

    let updatedResources = [...resources]
    let updatedPractices = [...practices]
    let updatedReinforcements = { ...reinforcements }
    let updatedNoteItems = { ...resourceNoteItems }

    if (isPersistedEducation) {
      await Promise.all(folder.resourceIds.map((resId) => deleteResourceMutation.mutateAsync(resId)))
    }

    folder.resourceIds.forEach((resId) => {
      updatedResources = updatedResources.filter(r => r.id !== resId)
      updatedPractices = updatedPractices.filter(p => p.resource_id !== resId)
      delete updatedReinforcements[`resource:${resId}`]
      delete updatedReinforcements[String(resId)]
      delete updatedNoteItems[`resource:${resId}`]
      delete updatedNoteItems[String(resId)]
    })

    const updatedFolders = folders.filter(f => f.id !== folderId)
    saveFolders(updatedFolders)
    saveResources(updatedResources)
    savePractices(updatedPractices)
    saveReinforcements(updatedReinforcements)
    saveResourceNoteItems(updatedNoteItems)
    toast.success('Klasör ve altındaki tüm içerikler silindi.')
  }

  // Dosya Yeniden Adlandır
  const handleRenameResource = (resId: number) => {
    const res = resources.find(r => r.id === resId)
    if (!res) return
    const newName = window.prompt('Dosya için yeni bir isim girin:', res.name)
    if (newName && newName.trim()) {
      const updated = resources.map(r => r.id === resId ? { ...r, name: newName.trim() } : r)
      saveResources(updated)
      toast.success('Dosya adı güncellendi.')
    }
  }

  // Dosya Sil (Cascade Warning Modal tetikler)
  const handleDeleteResource = (resId: number) => {
    const res = resources.find(r => r.id === resId)
    if (!res) return

    const actualTaskKey = reinforcements[`resource:${resId}`] ? `resource:${resId}` : (reinforcements[String(resId)] ? String(resId) : `resource:${resId}`)
    const taskCount = (reinforcements[actualTaskKey] || []).length

    const actualNoteKey = resourceNoteItems[`resource:${resId}`] ? `resource:${resId}` : (resourceNoteItems[String(resId)] ? String(resId) : `resource:${resId}`)
    const noteCount = (resourceNoteItems[actualNoteKey] || []).length

    if (taskCount > 0 || noteCount > 0) {
      setDeleteConfirmation({
        isOpen: true,
        type: 'resource',
        targetId: resId,
        title: `"${res.name}" Dosyasını Sil`,
        warningText: `Bu dosyayı silmek bağlı olan ${taskCount} pekiştirme görevini ve ${noteCount} notu kalıcı olarak silecektir. Devam etmek istiyor musunuz?`
      })
    } else {
      if (window.confirm('Bu dosyayı silmek istediğinize emin misiniz?')) {
        void executeDeleteResource(resId)
      }
    }
  }

  const executeDeleteResource = async (resId: number) => {
    if (isPersistedEducation) {
      await deleteResourceMutation.mutateAsync(resId)
    }

    const updatedResources = resources.filter(r => r.id !== resId)
    const updatedPractices = practices.filter(p => p.resource_id !== resId)

    const updatedReinforcements = { ...reinforcements }
    delete updatedReinforcements[`resource:${resId}`]
    delete updatedReinforcements[String(resId)]

    const updatedNoteItems = { ...resourceNoteItems }
    delete updatedNoteItems[`resource:${resId}`]
    delete updatedNoteItems[String(resId)]

    const updatedFolders = folders.map(f => ({
      ...f,
      resourceIds: f.resourceIds.filter(id => id !== resId)
    }))

    saveFolders(updatedFolders)
    saveResources(updatedResources)
    savePractices(updatedPractices)
    saveReinforcements(updatedReinforcements)
    saveResourceNoteItems(updatedNoteItems)
    toast.success('Dosya ve tüm bağlı veriler silindi.')
  }

  // Dosyayı Değiştir (Replace Resource)
  const triggerReplaceFile = (resId: number) => {
    setReplacingResourceId(resId)
    const input = document.getElementById('replace-file-input') as HTMLInputElement
    if (input) {
      input.click()
    }
  }

  const handleFileReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || replacingResourceId === null) return

    const updated = resources.map(res => {
      if (res.id === replacingResourceId) {
        return {
          ...res,
          name: file.name,
          type: getResourceTypeForFileName(file.name),
          url_or_path: URL.createObjectURL(file)
        }
      }
      return res
    })
    saveResources(updated)
    setReplacingResourceId(null)
    toast.success('Dosya başarıyla değiştirildi!')
  }

  // Not Eylemleri
  const getNoteForResource = (resId: number | string) => {
    return resourceNotes[resId] || ''
  }

  const handleUpdateNoteForResource = (resId: number | string, content: string) => {
    const updated = { ...resourceNotes, [resId]: content }
    saveResourceNotes(updated)

    // Sync to practice if practice exists
    if (resId === 'general') {
      const generalPractice = practices.find(p => p.resource_id === null)
      if (generalPractice) {
        void handleUpdatePractice(generalPractice.id, { notes: content })
      }
    } else {
      const practice = practices.find(p => p.resource_id === Number(resId))
      if (practice) {
        void handleUpdatePractice(practice.id, { notes: content })
      }
    }
  }

  const handleCreateNoteForResource = (resourceKey: string, title?: string) => {
    const now = new Date().toISOString()
    const nextNote: ResourceNote = {
      id: `note-${resourceKey}-${Date.now()}`,
      resourceId: resourceKey === 'general' ? 'general' : Number(resourceKey),
      title: title?.trim() || 'Yeni Not',
      content: '',
      createdAt: now,
      updatedAt: now
    }
    const updated = {
      ...resourceNoteItems,
      [resourceKey]: [...(resourceNoteItems[resourceKey] || []), nextNote]
    }
    saveResourceNoteItems(updated)
    setActiveResourceNoteId(nextNote.id)
    setNoteTitleDraft(nextNote.title)
    setNotesDraft('')
    setActiveTab('notes')
    toast.success('Yeni not başlığı oluşturuldu.')
  }

  const handleDeleteNoteForResource = (resourceKey: string, noteId: string) => {
    const nextNotes = (resourceNoteItems[resourceKey] || []).filter((note) => note.id !== noteId)
    const updated = {
      ...resourceNoteItems,
      [resourceKey]: nextNotes
    }
    saveResourceNoteItems(updated)
    const fallback = nextNotes[0]
    setActiveResourceNoteId(fallback?.id || null)
    setNoteTitleDraft(fallback?.title || '')
    setNotesDraft(fallback?.content || '')
    saveResourceNotes({
      ...resourceNotes,
      [resourceKey]: nextNotes.map((note) => `# ${note.title}\n${note.content}`).join('\n\n')
    })
    toast.success('Not silindi.')
  }

  const handleOpenNotesForResource = (res: EducationResource) => {
    if (!confirmNavigation()) return
    const resourceKey = String(res.id)
    setSelectedResourceId(res.id)
    const notesForResource = resourceNoteItems[resourceKey] || []
    if (notesForResource.length > 0) {
      const firstNote = notesForResource[0]
      setActiveResourceNoteId(firstNote.id)
      setNoteTitleDraft(firstNote.title)
      setNotesDraft(firstNote.content)
    } else {
      handleCreateNoteForResource(resourceKey, `${res.name} Notu`)
    }
    setActiveTab('notes')
  }

  // Kod Editörüne Yönlendir
  const handleOpenCodeForResource = async (res: EducationResource) => {
    if (!confirmNavigation()) return
    let practice = practices.find(p => p.resource_id === res.id)
    if (!practice) {
      // Create new practice if not exists
      const newPractice = await createPracticeFromDraft({
        education_id: educationId,
        resource_id: res.id,
        title: `${res.name} Pratik & Kod`,
        completed: false,
        code: serializeCodeFiles([{
          name: 'Main.java',
          content: `// Pratik Kaynağı: ${res.name}\n// Bu kaynak için pratik kodlarınızı buraya yazın.\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("CompileMe pratik basariyla olusturuldu.");\n    }\n}`
        }]),
        notes: getNoteForResource(res.id),
        order_index: practices.length + 1
      })
      const updatedPractices = [...practices, newPractice]
      savePractices(updatedPractices)
      practice = newPractice
    }

    setSelectedPracticeId(practice.id)
    setSelectedResourceId(res.id)
    setActiveFileName('Main.java')
    setActiveTab('primary')
    toast.success(`Kod editörü açıldı: ${res.name}`)
  }

  // Pekiştirme Görevleri Eylemleri
  const handleAddReinforceTask = (targetId: string | number, title: string) => {
    const targetKey = typeof targetId === 'number' ? `resource:${targetId}` : targetId
    const taskList = reinforcements[targetKey] || []
    if (taskList.length >= 10) {
      toast.error('En fazla 10 pekiştirme görevi ekleyebilirsiniz.')
      return
    }
    const newTask: ReinforcementTask = {
      id: `reinforce-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      completed: false,
      codeFileName: `Pekistirme_${targetKey.replace(/[^a-zA-Z0-9]/g, '_')}_${taskList.length + 1}.java`
    }
    const updated = {
      ...reinforcements,
      [targetKey]: [...taskList, newTask]
    }
    saveReinforcements(updated)
    toast.success('Pekiştirme projesi eklendi.')
  }

  const handleToggleReinforceTask = (targetId: string | number, taskId: string) => {
    const targetKey = typeof targetId === 'number' ? `resource:${targetId}` : targetId
    const taskList = reinforcements[targetKey] || []
    const updatedList = taskList.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    const updated = {
      ...reinforcements,
      [targetKey]: updatedList
    }
    saveReinforcements(updated)
  }

  const handleDeleteReinforceTask = (targetId: string | number, taskId: string) => {
    const targetKey = typeof targetId === 'number' ? `resource:${targetId}` : targetId
    const taskList = reinforcements[targetKey] || []
    const updatedList = taskList.filter(t => t.id !== taskId)
    const updated = {
      ...reinforcements,
      [targetKey]: updatedList
    }
    saveReinforcements(updated)
    toast.success('Pekiştirme projesi silindi.')
  }

  const handleWriteCodeForReinforce = (res: EducationResource, task: ReinforcementTask) => {
    let practice = practices.find(p => p.resource_id === res.id)
    if (!practice) {
      const newPractice: EducationPractice = {
        id: Date.now(),
        education_id: educationId,
        resource_id: res.id,
        title: `${res.name} Pratik & Kod`,
        completed: false,
        code: serializeCodeFiles([{
          name: task.codeFileName,
          content: `// Pekiştirme Projesi: ${task.title}\n// Bu dosyadaki kod ve pratik projesi parent-child ilişkisiyle bağlıdır.\n\npublic class Pekistirme {\n    public static void main(String[] args) {\n        System.out.println("Pekiştirme projesi çalışıyor");\n    }\n}`
        }]),
        notes: getNoteForResource(res.id),
        order_index: practices.length + 1
      }
      const updatedPractices = [...practices, newPractice]
      savePractices(updatedPractices)
      practice = newPractice
    } else {
      const files = parseCodeFiles(practice.code)
      if (!files.some(f => f.name === task.codeFileName)) {
        files.push({
          name: task.codeFileName,
          content: `// Pekiştirme Projesi: ${task.title}\n// Bu dosyadaki kod ve pratik projesi parent-child ilişkisiyle bağlıdır.\n\npublic class Pekistirme {\n    public static void main(String[] args) {\n        System.out.println("Pekiştirme projesi çalışıyor");\n    }\n}`
        })
        const updatedPractice = { ...practice, code: serializeCodeFiles(files) }
        savePractices(practices.map(p => p.id === updatedPractice.id ? updatedPractice : p))
        practice = updatedPractice
      }
    }

    setSelectedPracticeId(practice.id)
    setSelectedResourceId(res.id)
    setActiveFileName(task.codeFileName)
    setActiveTab('primary')
    setActiveReinforceResourceId(null)
    toast.success(`Pekiştirme kod editöründe açıldı: ${task.codeFileName}`)
  }

  // Sürükle Bırak: Dosyayı Klasör Başlığına Bırak
  const ensurePracticeForTarget = (target: ReinforcementTarget, task?: ReinforcementTask) => {
    const targetLabel = getTargetLabel(target)
    let practice = target.type === 'resource'
      ? practices.find(p => p.resource_id === target.resource.id)
      : practices.find(p => p.title === `[Pekiştirme] ${targetLabel}`)

    if (!practice) {
      const newPractice: EducationPractice = {
        id: Date.now(),
        education_id: educationId,
        resource_id: target.type === 'resource' ? target.resource.id : null,
        title: target.type === 'resource' ? `${target.resource.name} Pratik & Kod` : `[Pekiştirme] ${targetLabel}`,
        completed: false,
        code: serializeCodeFiles([{
          name: task?.codeFileName || 'Main.java',
          content: `// Bağlı kaynak: ${targetLabel}\n${task ? `// Pekiştirme: ${task.title}\n` : ''}\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("CompileMe bağlı kod alanı");\n    }\n}`
        }]),
        notes: target.type === 'resource' ? getNoteForResource(target.resource.id) : target.document.content || '',
        order_index: practices.length + 1
      }
      const updatedPractices = [...practices, newPractice]
      savePractices(updatedPractices)
      practice = newPractice
    } else if (task) {
      const files = parseCodeFiles(practice.code)
      if (!files.some(f => f.name === task.codeFileName)) {
        files.push({
          name: task.codeFileName,
          content: `// Bağlı kaynak: ${targetLabel}\n// Pekiştirme: ${task.title}\n\npublic class Pekistirme {\n    public static void main(String[] args) {\n        System.out.println("Pekiştirme projesi çalışıyor");\n    }\n}`
        })
        const updatedPractice = { ...practice, code: serializeCodeFiles(files) }
        savePractices(practices.map(p => p.id === practice?.id ? updatedPractice : p))
        practice = updatedPractice
      }
    }

    return practice
  }

  const handleWriteCodeForTarget = (target: ReinforcementTarget, task?: ReinforcementTask) => {
    const practice = ensurePracticeForTarget(target, task)
    if (!practice) return

    setSelectedPracticeId(practice.id)
    setSelectedResourceId(target.type === 'resource' ? target.resource.id : null)
    setActiveFileName(task?.codeFileName || parseCodeFiles(practice.code)[0]?.name || 'Main.java')
    setActiveTab('primary')
    setActiveReinforceResourceId(null)
    toast.success(`Kod editöründe açıldı: ${task?.codeFileName || getTargetLabel(target)}`)
  }

  const handleDropdown1Change = (folderId: string) => {
    setSelectedFolderIdForDropdown(folderId)
  }

  const handleDropdown2Change = (targetId: string) => {
    const target = reinforcementTargets.find((item) => item.id === targetId)
    if (target) {
      handleWriteCodeForTarget(target)
    }
  }

  const handleDropdown3Change = (taskId: string) => {
    if (taskId === 'direct') return
    const target = reinforcementTargets.find((item) => item.id === `resource:${selectedResourceId}`)
    const task = selectedResourceId ? (reinforcements[`resource:${selectedResourceId}`] || []).find((item) => item.id === taskId) : undefined
    if (target && task) {
      handleWriteCodeForTarget(target, task)
    }
  }

  const handleDropResourceOnFolderHeader = (e: React.DragEvent, targetFolderId: string) => {
    const type = e.dataTransfer.getData('text/plain')
    if (type !== 'resource' || !draggedResourceInfo) return

    const { folderId: sourceFolderId, resourceId } = draggedResourceInfo
    if (sourceFolderId === targetFolderId) return

    let updatedFolders = [...folders]

    // Kaynaktan çıkar
    if (sourceFolderId !== 'uncategorized') {
      updatedFolders = updatedFolders.map(f => {
        if (f.id === sourceFolderId) {
          return { ...f, resourceIds: f.resourceIds.filter(id => id !== resourceId) }
        }
        return f
      })
    }

    // Hedefe ekle
    if (targetFolderId !== 'uncategorized') {
      updatedFolders = updatedFolders.map(f => {
        if (f.id === targetFolderId) {
          const newIds = [...f.resourceIds.filter(id => id !== resourceId), resourceId]
          return { ...f, resourceIds: newIds }
        }
        return f
      })
    }

    saveFolders(updatedFolders)
    setDraggedResourceInfo(null)
    toast.success('Dosya klasöre taşındı.')
  }

  // Görev Planlayıcı
  const handleAddTask = async (e: React.FormEvent) => {
    if (e) e.preventDefault()
    const title = taskTitle.trim()
    if (!title) {
      toast.error('Görev başlığı girmelisiniz.')
      return
    }

    const newTask = {
      id: Date.now(),
      title,
      status: 'TODO' as const,
      scheduledDate: taskDate,
      scheduledTime: taskTime,
      tag: education?.title || 'Java Spring Boot'
    }

    const updated = [newTask, ...localTasks]
    setLocalTasks(updated)
    localStorage.setItem(`local-tasks-${educationId}`, JSON.stringify(updated))

    if (isPersistedEducation) {
    try {
      await createTaskMutation.mutateAsync({
        title,
        notes: `${education?.title || 'Java Spring Boot'} / ${selectedPractice?.title || 'Genel Etüt'}`,
        status: 'TODO',
        kind: 'EDUCATION',
        scheduledDate: taskDate || undefined,
        scheduledTime: taskTime || undefined,
        planningBucket: taskDate ? 'DAY' : 'UNSCHEDULED',
        educationId: educationId,
      })
    } catch {
      // Suppress backend error to remain fully responsive locally
    }
    } else {
      toast.info('Bu egitim henuz veritabaninda yok; gorev yerel demo listesine eklendi.')
    }

    setTaskTitle('')
    setTaskDate('')
    setTaskTime('')
    toast.success('Çalışma görevi eklendi.')
  }

  // Görev Toggles, Edits & Deletions
  const handleToggleLocalTask = async (id: number | string) => {
    const updated = localTasks.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'DONE' ? 'TODO' : 'DONE' }
      }
      return t
    })
    setLocalTasks(updated)
    localStorage.setItem(`local-tasks-${educationId}`, JSON.stringify(updated))
    toast.success('Görev durumu güncellendi.')

    if (typeof id === 'number' && persistedTaskIds.has(id)) {
      try {
        await toggleTaskMutation.mutateAsync(id)
      } catch {
        // Silently allow local state only
      }
    }
  }

  const handleSaveLocalTaskEdit = (id: number | string) => {
    const title = editingTaskTitle.trim()
    if (!title) {
      toast.error('Görev başlığı boş olamaz.')
      return
    }
    const updated = localTasks.map(t => {
      if (t.id === id) {
        return { ...t, title }
      }
      return t
    })
    setLocalTasks(updated)
    localStorage.setItem(`local-tasks-${educationId}`, JSON.stringify(updated))
    setEditingTaskId(null)
    toast.success('Görev güncellendi.')
  }

  const handleDeleteLocalTask = async (id: number | string) => {
    const updated = localTasks.filter(t => t.id !== id)
    setLocalTasks(updated)
    localStorage.setItem(`local-tasks-${educationId}`, JSON.stringify(updated))
    toast.success('Görev silindi.')

    if (typeof id === 'number' && persistedTaskIds.has(id)) {
      try {
        await deleteTaskMutation.mutateAsync(id)
      } catch {
        // Silently allow local state only
      }
    }
  }

  // Links tab adder helper
  const handleAddLink = () => {
    const name = newLinkName.trim()
    let url = newLinkUrl.trim()
    if (!name || !url) {
      toast.error('Lütfen tüm alanları doldurun.')
      return
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    const newResource: EducationResource = {
      id: Date.now(),
      education_id: educationId,
      name,
      type: 'LINK',
      url_or_path: url
    }

    setResources(prev => [...prev, newResource])
    setNewLinkName('')
    setNewLinkUrl('')
    setIsLinkAdderOpen(false)
    toast.success('Yeni platform bağlantısı eklendi!')
  }

  // Dropdown Actions: Sil ve İndir
  const handleDeleteEducation = () => {
    if (!education) return
    if (window.confirm('Bu eğitimi silmek istediğinize emin misiniz?')) {
      const idx = mockEducations.findIndex((item) => item.id === educationId)
      if (idx !== -1) {
        mockEducations.splice(idx, 1)
        toast.success('Eğitim başarıyla silindi.')
        navigate('/education')
      }
    }
  }

  const handleDownloadMarkdown = () => {
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
    practices.forEach((p) => {
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
  }

  const cycleStatus = () => {
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
  }

  const getStatusLabel = (status: string) => {
    if (status === 'PAUSED') return 'Duraklatildi'
    if (status === 'ACTIVE') return 'Çalışılıyor'
    if (status === 'DONE') return 'Tamamlandı'
    return 'Çalışılıyor'
  }

  // Drag and drop handlers
  const handleDragStartFolder = (e: React.DragEvent, index: number) => {
    setDraggedFolderIndex(index)
    e.dataTransfer.setData('text/plain', 'folder')
  }

  const handleDropFolder = (e: React.DragEvent, targetIndex: number) => {
    const type = e.dataTransfer.getData('text/plain')
    if (type !== 'folder' || draggedFolderIndex === null) return

    const updated = [...folders]
    const [removed] = updated.splice(draggedFolderIndex, 1)
    updated.splice(targetIndex, 0, removed)
    saveFolders(updated)
    setDraggedFolderIndex(null)
    toast.success('Klasör sırası güncellendi.')
  }

  const handleDragStartResource = (e: React.DragEvent, folderId: string, resourceId: number) => {
    setDraggedResourceInfo({ folderId, resourceId })
    e.dataTransfer.setData('text/plain', 'resource')
  }

  const handleDropResource = (e: React.DragEvent, targetFolderId: string, targetIndex: number) => {
    const type = e.dataTransfer.getData('text/plain')
    if (type !== 'resource' || !draggedResourceInfo) return

    const { folderId: sourceFolderId, resourceId } = draggedResourceInfo

    let updatedFolders = [...folders]

    // 1. Remove resource from source folder if source is a folder
    if (sourceFolderId !== 'uncategorized') {
      updatedFolders = updatedFolders.map(f => {
        if (f.id === sourceFolderId) {
          return { ...f, resourceIds: f.resourceIds.filter(id => id !== resourceId) }
        }
        return f
      })
    }

    // 2. Add resource to target folder if target is a folder
    if (targetFolderId !== 'uncategorized') {
      updatedFolders = updatedFolders.map(f => {
        if (f.id === targetFolderId) {
          const newIds = [...f.resourceIds]
          // Remove duplicates
          const filtered = newIds.filter(id => id !== resourceId)
          filtered.splice(targetIndex, 0, resourceId)
          return { ...f, resourceIds: filtered }
        }
        return f
      })
    }

    saveFolders(updatedFolders)
    setDraggedResourceInfo(null)
    toast.success('Dosya başarıyla taşındı.')
  }

  // Stat calculations
  const totalTasks = dbTasks.length
  const completedTasks = dbTasks.filter((t) => t.status === 'DONE').length
  const weeklyTaskRatio = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const totalResources = resources.length
  const completedResourcesCount = resources.filter((res) => !!completedResources[res.id]).length

  const dynamicProgressPercent = totalResources > 0 ? Math.round((completedResourcesCount / totalResources) * 100) : 0
  if (education) {
    education.progress_percent = dynamicProgressPercent
  }

  const totalCodeFiles = practices.reduce((sum, p) => sum + parseCodeFiles(p.code).length, 0)
  const totalVocabWords = practices.reduce((sum, p) => sum + parseVocabulary(p.code).length, 0)
  const totalCheatItems = practices.reduce((sum, p) => sum + parseCheatsheet(p.code).length, 0)

  if (!education) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-900 dark:text-white font-bold">
        Eğitim bulunamadı.
      </div>
    )
  }

  const tabOptions = [
    { id: 'overview' as const, label: '📊 Overview' },
    { id: 'files' as const, label: '📂 Dosyalar' },
    { id: 'links' as const, label: '🔗 Linkler' },
    { id: 'reinforce' as const, label: 'Pekistirmeler' },
    {
      id: 'primary' as const,
      label:
        education.type === 'PROGRAMMING'
          ? '💻 Code'
          : education.type === 'LANGUAGE'
            ? '🎴 Kelimeler'
            : '💡 Kavramlar',
    },
    { id: 'notes' as const, label: '📝 Notlar' },
  ]

  // Code Studio Files Helper
  const codeFiles = parseCodeFiles(selectedPractice?.code ?? '')
  const activeFile = codeFiles.find((f) => f.name === activeFileName) || codeFiles[0] || { name: 'Main.java', content: '' }

  // --- UX SAFETY NAVIGATION CONTROLS & HELPERS ---
  const isCodeDirty = codeDraft !== null && codeDraft !== activeFile.content

  const isNotesDirty = React.useMemo(() => {
    if (!activeResourceNote) return false
    return notesDraft !== activeResourceNote.content || noteTitleDraft !== activeResourceNote.title
  }, [activeResourceNote, notesDraft, noteTitleDraft])

  const confirmNavigation = (): boolean => {
    if (isCodeDirty || isNotesDirty) {
      return window.confirm('Kaydedilmemiş değişiklikleriniz var. Ayrılmak istediğinize emin misiniz?')
    }
    return true
  }

  const handleTabChange = (tab: any) => {
    if (!confirmNavigation()) return
    setActiveTab(tab)
  }

  const handleFileTabChange = (fileName: string) => {
    if (!confirmNavigation()) return
    setActiveFileName(fileName)
    setCodeDraft(null)
  }

  const handleToggleTreeNode = async (nodeId: string) => {
    if (treeExpandedNodes[nodeId]) {
      setTreeExpandedNodes((prev) => ({ ...prev, [nodeId]: false }))
    } else {
      setTreeLoadingNodes((prev) => ({ ...prev, [nodeId]: true }))
      await new Promise((resolve) => setTimeout(resolve, 300))
      setTreeLoadingNodes((prev) => ({ ...prev, [nodeId]: false }))
      setTreeExpandedNodes((prev) => ({ ...prev, [nodeId]: true }))
    }
  }

  const handleTreeNodeClick = (type: 'file' | 'task' | 'note', targetId: string, itemId?: string | number) => {
    if (!confirmNavigation()) return

    if (type === 'file') {
      const numId = Number(targetId)
      setSelectedResourceId(numId)
      const match = practices.find((p) => p.resource_id === numId)
      if (match) {
        setSelectedPracticeId(match.id)
      }
      setActiveTab('files')
    } else if (type === 'task') {
      const resId = Number(targetId.replace('resource:', ''))
      setSelectedResourceId(resId)
      const match = practices.find((p) => p.resource_id === resId)
      if (match) {
        setSelectedPracticeId(match.id)
        const tasks = reinforcements[targetId] || []
        const task = tasks.find(t => t.id === itemId)
        if (task && task.codeFileName) {
          setActiveFileName(task.codeFileName)
        }
      }
      setActiveTab('primary')
      setCodeDraft(null)
    } else if (type === 'note') {
      const resId = targetId === 'general' ? null : Number(targetId.replace('resource:', ''))
      setSelectedResourceId(resId)
      const match = practices.find((p) => p.resource_id === resId)
      if (match) {
        setSelectedPracticeId(match.id)
      }
      if (itemId) {
        setActiveResourceNoteId(String(itemId))
        const notes = resourceNoteItems[targetId] || []
        const note = notes.find(n => n.id === itemId)
        if (note) {
          setNoteTitleDraft(note.title)
          setNotesDraft(note.content)
        }
      }
      setActiveTab('notes')
    }
  }

  // --- CRUD ACTIONS FOR TASKS & NOTES ---
  const handleRenameTask = (actualKey: string, taskId: string) => {
    const list = reinforcements[actualKey] || []
    const task = list.find(t => t.id === taskId)
    if (!task) return
    const newTitle = window.prompt('Pekiştirme görevi için yeni bir başlık girin:', task.title)
    if (newTitle && newTitle.trim()) {
      const updated = list.map(t => t.id === taskId ? { ...t, title: newTitle.trim() } : t)
      const updatedReinforcements = { ...reinforcements, [actualKey]: updated }
      saveReinforcements(updatedReinforcements)
      toast.success('Pekiştirme görevi adı güncellendi.')
    }
  }

  const handleDeleteTask = (actualKey: string, taskId: string) => {
    if (!window.confirm('Bu pekiştirme görevini silmek istediğinize emin misiniz?')) return
    const list = reinforcements[actualKey] || []
    const updated = list.filter(t => t.id !== taskId)
    const updatedReinforcements = { ...reinforcements, [actualKey]: updated }
    saveReinforcements(updatedReinforcements)
    toast.success('Pekiştirme görevi silindi.')
  }

  const handleRenameNote = (actualKey: string, noteId: string) => {
    const list = resourceNoteItems[actualKey] || []
    const note = list.find(n => n.id === noteId)
    if (!note) return
    const newTitle = window.prompt('Not için yeni bir başlık girin:', note.title)
    if (newTitle && newTitle.trim()) {
      const updated = list.map(n => n.id === noteId ? { ...n, title: newTitle.trim(), updatedAt: new Date().toISOString() } : n)
      const updatedNoteItems = { ...resourceNoteItems, [actualKey]: updated }
      saveResourceNoteItems(updatedNoteItems)
      if (activeResourceNoteId === noteId) {
        setNoteTitleDraft(newTitle.trim())
      }
      toast.success('Not adı güncellendi.')
    }
  }

  const handleDeleteNote = (actualKey: string, noteId: string) => {
    if (!window.confirm('Bu notu silmek istediğinize emin misiniz?')) return
    const list = resourceNoteItems[actualKey] || []
    const updated = list.filter(n => n.id !== noteId)
    const updatedNoteItems = { ...resourceNoteItems, [actualKey]: updated }
    saveResourceNoteItems(updatedNoteItems)
    if (activeResourceNoteId === noteId) {
      setActiveResourceNoteId(null)
      setNoteTitleDraft('')
      setNotesDraft('')
    }
    toast.success('Not silindi.')
  }

  const handleNoteTopicChange = (val: string) => {
    if (!confirmNavigation()) return
    if (val === 'general') {
      setSelectedResourceId(null)
      const match = practices.find((p) => p.resource_id === null)
      if (match) setSelectedPracticeId(match.id)
    } else {
      const numId = Number(val)
      setSelectedResourceId(numId)
      const match = practices.find((p) => p.resource_id === numId)
      if (match) setSelectedPracticeId(match.id)
    }
  }

  const handleNoteItemClick = (noteId: string) => {
    if (!confirmNavigation()) return
    setActiveResourceNoteId(noteId)
    const currentNotes = resourceNoteItems[activeNoteResourceKey] || []
    const note = currentNotes.find(n => n.id === noteId)
    if (note) {
      setNoteTitleDraft(note.title)
      setNotesDraft(note.content)
    }
  }

  const handleSaveNotes = async () => {
    if (!activeResourceNoteId) return
    setSaveState('saving')
    const now = new Date().toISOString()
    const currentNotes = resourceNoteItems[activeNoteResourceKey] || []
    const updatedNotesForResource = currentNotes.map((note) =>
      note.id === activeResourceNoteId
        ? {
            ...note,
            title: noteTitleDraft.trim() || 'Başlıksız Not',
            content: notesDraft,
            updatedAt: now
          }
        : note
    )
    const updatedNoteItems = {
      ...resourceNoteItems,
      [activeNoteResourceKey]: updatedNotesForResource
    }
    saveResourceNoteItems(updatedNoteItems)

    const mergedContent = updatedNotesForResource
      .map((note) => `# ${note.title}\n\n${note.content}`)
      .join('\n\n---\n\n')
    const updatedLegacyNotes = { ...resourceNotes, [activeNoteResourceKey]: mergedContent }
    saveResourceNotes(updatedLegacyNotes)

    const practiceForNotes = activeNoteResourceKey === 'general'
      ? practices.find(p => p.resource_id === null)
      : practices.find(p => p.resource_id === Number(activeNoteResourceKey))

    if (!practiceForNotes) {
      setSaveState('saved')
      toast.success('Not kaydedildi.')
      return
    }

    if (!isPersistedEducation) {
      setPractices((prev) =>
        prev.map((p) => (p.id === practiceForNotes.id ? { ...p, notes: mergedContent } : p))
      )
      setSaveState('saved')
      toast.success('Not kaydedildi.')
      return
    }

    try {
      await apiClient.patch(`/educations/practices/${practiceForNotes.id}`, {
        title: practiceForNotes.title,
        completed: practiceForNotes.completed,
        code: practiceForNotes.code,
        notes: mergedContent,
        resourceId: practiceForNotes.resource_id,
        orderIndex: practiceForNotes.order_index ?? 0,
      })
      setPractices((prev) =>
        prev.map((p) => (p.id === practiceForNotes.id ? { ...p, notes: mergedContent } : p))
      )
      setSaveState('saved')
      toast.success('Not başarıyla kaydedildi.')
    } catch {
      setSaveState('saved')
      toast.error('Not kaydedilirken bir hata oluştu.')
    }
  }

  const handleCodeChange = (newVal: string) => {
    if (!selectedPractice) return
    const updated = codeFiles.map((f) => (f.name === activeFile.name ? { ...f, content: newVal } : f))
    void handleUpdatePractice(selectedPractice.id, { code: serializeCodeFiles(updated) })
  }

  const handleAddNewFile = () => {
    if (!selectedPractice) return
    const name = window.prompt('Dosya ismi girin (Örn: Model.java):', 'Model.java')?.trim()
    if (!name) return

    if (codeFiles.some((f) => f.name === name)) {
      toast.error('Aynı isimde başka bir dosya zaten mevcut.')
      return
    }

    const updated = [...codeFiles, { name, content: '// ' + name + ' dosyası oluşturuldu.' }]
    void handleUpdatePractice(selectedPractice.id, { code: serializeCodeFiles(updated) })
    setActiveFileName(name)
    toast.success('Yeni kod dosyası oluşturuldu.')
  }

  const handleSaveCodeDirectly = () => {
    if (!selectedPractice) return
    const targetContent = codeDraft ?? activeFile.content
    const updated = codeFiles.map((f) => (f.name === activeFile.name ? { ...f, content: targetContent } : f))
    void handleUpdatePractice(selectedPractice.id, { code: serializeCodeFiles(updated) })
    setCodeDraft(null)
    toast.success('Kod değişiklikleri kaydedildi.')
  }

  // Language Vocabulary Helpers
  const vocabulary = parseVocabulary(selectedPractice?.code ?? '')
  const levelVocabulary = vocabulary
  const getNextReviewDate = (box: VocabularyCard['box']) => {
    const daysByBox: Record<VocabularyCard['box'], number> = {
      1: 1,
      2: 3,
      3: 7,
    }
    const next = new Date()
    next.setDate(next.getDate() + daysByBox[box])
    return next.toISOString().slice(0, 10)
  }

  const handleAddVocabWord = () => {
    if (!selectedPractice) return
    const w = word.trim()
    const m = meaning.trim()
    if (!w || !m) {
      toast.error('Kelime ve Türkçe karşılığı doldurulmalıdır.')
      return
    }

    const newCard: VocabularyCard = {
      id: Date.now(),
      word: w,
      meaning: m,
      type: wordType,
      box: 1,
      nextReview: getNextReviewDate(1),
    }

    const updated = [...vocabulary, newCard]
    void handleUpdatePractice(selectedPractice.id, { code: serializeVocabulary(updated) })
    setWord('')
    setMeaning('')
    toast.success('Yeni kelime desteye eklendi.')
  }

  const handleLeitnerResult = (vocabId: number, boxUpdate: 'known' | 'forgot') => {
    if (!selectedPractice) return
    const updated = vocabulary.map((v) => {
      if (v.id !== vocabId) return v
      const nextBox = boxUpdate === 'known' ? (Math.min(3, v.box + 1) as VocabularyCard['box']) : 1
      return {
        ...v,
        box: nextBox,
        nextReview: getNextReviewDate(nextBox),
      }
    })
    void handleUpdatePractice(selectedPractice.id, { code: serializeVocabulary(updated) })
    toast.success(
      boxUpdate === 'known' ? 'Kelime bir üst kutuya taşındı!' : 'Kelime 1. Kutuya geri döndü.'
    )
  }

  const handleQuickTranslate = async () => {
    const text = translateInput.trim()
    if (!text) return
    setTranslateResult('Çeviriliyor...')
    setTimeout(() => {
      setTranslateResult(`İngilizce: "${text}"\nTürkçe: "[Simüle Çeviri] ${text} öğreniminde pratik yapıyorum."`)
    }, 500)
  }

  // Cheatsheet Helpers
  const cheatsheet = parseCheatsheet(selectedPractice?.code ?? '')

  const handleAddCheatItem = () => {
    if (!selectedPractice) return
    const c = keyConcept.trim()
    const d = conceptDescription.trim()
    if (!c || !d) {
      toast.error('Kavram ve açıklama alanları doldurulmalıdır.')
      return
    }

    const newItem: CheatsheetItem = {
      id: Date.now(),
      keyConcept: c,
      description: d,
    }
    const updated = [...cheatsheet, newItem]
    void handleUpdatePractice(selectedPractice.id, { code: serializeCheatsheet(updated) })
    setKeyConcept('')
    setConceptDescription('')
    toast.success('Hap bilgi eklendi.')
  }

  const handleDeleteCheatItem = (itemId: number) => {
    if (!selectedPractice) return
    const updated = cheatsheet.filter((item) => item.id !== itemId)
    void handleUpdatePractice(selectedPractice.id, { code: serializeCheatsheet(updated) })
    toast.success('Hap bilgi silindi.')
  }

  const toggleFolderState = (folderId: string) => {
    setFoldersOpen(prev => ({ ...prev, [folderId]: !prev[folderId] }))
  }

  // Sub-tab renders
  // --- 4-LEVEL LEFT FILE TREE ---
  const renderTabContent = () => {
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
            practices={practices}
            localTasks={localTasks}
            taskTitle={taskTitle}
            setTaskTitle={setTaskTitle}
            taskDate={taskDate}
            setTaskDate={setTaskDate}
            taskTime={taskTime}
            setTaskTime={setTaskTime}
            handleAddTask={handleAddTask}
            handleToggleLocalTask={handleToggleLocalTask}
            editingTaskId={editingTaskId}
            setEditingTaskId={setEditingTaskId}
            editingTaskTitle={editingTaskTitle}
            setEditingTaskTitle={setEditingTaskTitle}
            handleSaveLocalTaskEdit={handleSaveLocalTaskEdit}
            handleDeleteLocalTask={handleDeleteLocalTask}
          />
        )
      case 'files':
        return (
          <DosyalarTab
            {...commonProps}
            folders={folders}
            foldersOpen={foldersOpen}
            toggleFolderState={toggleFolderState}
            completedResources={completedResources}
            saveCompletedResources={saveCompletedResources}
            handleRenameFolder={handleRenameFolder}
            handleDeleteFolder={handleDeleteFolder}
            handleRenameResource={handleRenameResource}
            handleDeleteResource={handleDeleteResource}
            handleOpenNotesForResource={handleOpenNotesForResource}
            handleOpenCodeForResource={handleOpenCodeForResource}
            triggerReplaceFile={triggerReplaceFile}
            setActiveReinforceResourceId={setActiveReinforceResourceId}
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            handleFileReplace={handleFileReplace}
            setIsFolderCreatorOpen={setIsFolderCreatorOpen}
            setIsImporterOpen={setIsImporterOpen}
            handleDragStartFolder={handleDragStartFolder}
            handleDragStartResource={handleDragStartResource}
            handleDropFolder={handleDropFolder}
            handleDropResource={handleDropResource}
            handleDropResourceOnFolderHeader={handleDropResourceOnFolderHeader}
          />
        )
      case 'links':
        return (
          <LinklerTab
            {...commonProps}
            isLinkAdderOpen={isLinkAdderOpen}
            setIsLinkAdderOpen={setIsLinkAdderOpen}
            newLinkName={newLinkName}
            setNewLinkName={setNewLinkName}
            newLinkUrl={newLinkUrl}
            setNewLinkUrl={setNewLinkUrl}
            handleAddLink={handleAddLink}
          />
        )
      case 'reinforce':
        return (
          <ReinforcementsTab
            {...commonProps}
            reinforcementTargets={reinforcementTargets}
            reinforcementSearch={reinforcementSearch}
            setReinforcementSearch={setReinforcementSearch}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            projects={projects}
            selectedReinforcementTargetId={selectedReinforcementTargetId}
            setSelectedReinforcementTargetId={setSelectedReinforcementTargetId}
            reinforcements={reinforcements}
            newReinforcementTitle={newReinforcementTitle}
            setNewReinforcementTitle={setNewReinforcementTitle}
            handleAddReinforceTask={handleAddReinforceTask}
            handleToggleReinforceTask={handleToggleReinforceTask}
            handleDeleteReinforceTask={handleDeleteReinforceTask}
            handleWriteCodeForTarget={handleWriteCodeForTarget}
          />
        )
      case 'primary':
        if (education.type === 'PROGRAMMING') {
          return (
            <StudioModePanel type={education.type}>
              <CodeTab
                {...commonProps}
                selectedPractice={selectedPractice}
                codeFiles={codeFiles}
                activeFile={activeFile}
                codeDraft={codeDraft}
                setCodeDraft={setCodeDraft}
                activeFileName={activeFileName}
                handleFileTabChange={handleFileTabChange}
                handleSaveCodeDirectly={handleSaveCodeDirectly}
                isCodeDirty={isCodeDirty}
                folders={folders}
                reinforcementTargets={reinforcementTargets}
                reinforcements={reinforcements}
                selectedFolderIdForDropdown={selectedFolderIdForDropdown}
                handleDropdown1Change={handleDropdown1Change}
                handleDropdown2Change={handleDropdown2Change}
                handleDropdown3Change={handleDropdown3Change}
              />
            </StudioModePanel>
          )
        } else if (education.type === 'LANGUAGE') {
          return (
            <StudioModePanel type={education.type}>
              <VocabularyTab
                vocabularyCards={vocabulary}
                activeLevel={activeLevel}
                setActiveLevel={setActiveLevel}
                word={word}
                setWord={setWord}
                meaning={meaning}
                setMeaning={setMeaning}
                wordType={wordType}
                setWordType={setWordType}
                handleAddVocabWord={handleAddVocabWord}
                handleLeitnerResult={handleLeitnerResult}
                flippedCards={flippedCards}
                setFlippedCards={setFlippedCards}
              />
            </StudioModePanel>
          )
        } else {
          return (
            <StudioModePanel type={education.type}>
              <CheatsheetTab
                cheatsheetItems={cheatsheet}
                keyConcept={keyConcept}
                setKeyConcept={setKeyConcept}
                conceptDescription={conceptDescription}
                setConceptDescription={setConceptDescription}
                handleAddCheatItem={handleAddCheatItem}
                handleDeleteCheatItem={handleDeleteCheatItem}
              />
            </StudioModePanel>
          )
        }
      case 'notes':
        return (
          <NotlarTab
            {...commonProps}
            selectedResourceId={selectedResourceId}
            handleNoteTopicChange={handleNoteTopicChange}
            saveState={saveState}
            isNotesDirty={isNotesDirty}
            handleSaveNotes={handleSaveNotes}
            activeNoteResourceKey={activeNoteResourceKey}
            resourceNoteItems={resourceNoteItems}
            handleNoteItemClick={handleNoteItemClick}
            activeResourceNoteId={activeResourceNoteId}
            handleCreateNoteForResource={handleCreateNoteForResource}
            handleDeleteNoteForResource={handleDeleteNoteForResource}
            noteTitleDraft={noteTitleDraft}
            setNoteTitleDraft={setNoteTitleDraft}
            notesDraft={notesDraft}
            setNotesDraft={setNotesDraft}
            translateInput={translateInput}
            setTranslateInput={setTranslateInput}
            translateResult={translateResult}
            handleQuickTranslate={handleQuickTranslate}
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

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ──────────────────────────────────────────────────────────────────
          ÜST GRUP (HEADER & STATS PANEL)
          ────────────────────────────────────────────────────────────────── */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/20 backdrop-blur-xl shadow-2xl flex flex-col gap-6 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Sol Üst Köşe - Şık ChevronLeft Geri Butonu */}
            <button
              onClick={() => navigate('/education')}
              className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 border border-slate-200/50 dark:border-zinc-800/50 text-slate-900 dark:text-zinc-350 hover:text-slate-950 dark:hover:text-white transition-all backdrop-blur-md shadow-md"
              aria-label="Geri git"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Üst Merkez - Eğitim Başlığı & Durum Rozeti */}
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>{education.title}</span>
              <button
                onClick={cycleStatus}
                className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border transition-all duration-300 bg-amber-500/10 text-amber-500 border-amber-500/20"
              >
                {getStatusLabel(education.status)}
              </button>
            </h1>
          </div>

          {/* Sağ Üst Köşe - Üç Nokta Dropdown Butonu */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 border border-slate-200/50 dark:border-zinc-800/50 text-slate-900 dark:text-zinc-350 hover:text-slate-950 dark:hover:text-white transition-all backdrop-blur-md shadow-md"
              aria-label="Daha fazla seçenek"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200/60 dark:border-zinc-800/40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-2xl p-2 z-50 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false)
                        handleDownloadMarkdown()
                      }}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 transition-all flex items-center gap-2"
                    >
                      <span>Markdown Olarak İndir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false)
                        handleDeleteEducation()
                      }}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-500 hover:bg-rose-500/10 transition-all flex items-center gap-2"
                    >
                      <span>Eğitimi Sil</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
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
                style={{ width: `${education.progress_percent}%` }}
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
              folders={folders}
              resources={resources}
              selectedResourceId={selectedResourceId}
              activeTab={activeTab}
              activeFileName={activeFileName}
              activeResourceNoteId={activeResourceNoteId}
              reinforcements={reinforcements}
              resourceNoteItems={resourceNoteItems}
              treeExpandedNodes={treeExpandedNodes}
              treeLoadingNodes={treeLoadingNodes}
              handleToggleTreeNode={handleToggleTreeNode}
              handleTreeNodeClick={handleTreeNodeClick}
              handleRenameFolder={handleRenameFolder}
              handleDeleteFolder={handleDeleteFolder}
              handleRenameResource={handleRenameResource}
              handleDeleteResource={handleDeleteResource}
              handleRenameTask={handleRenameTask}
              handleDeleteTask={handleDeleteTask}
              handleRenameNote={handleRenameNote}
              handleDeleteNote={handleDeleteNote}
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
        isOpen={!!deleteConfirmation?.isOpen}
        title={deleteConfirmation?.title || ''}
        warningText={deleteConfirmation?.warningText || ''}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={() => {
          if (deleteConfirmation) {
            if (deleteConfirmation.type === 'folder') {
              void executeDeleteFolder(String(deleteConfirmation.targetId))
            } else {
              void executeDeleteResource(Number(deleteConfirmation.targetId))
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
                <p className="text-xs text-slate-900 dark:text-zinc-350 leading-relaxed">
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
                <button
                  onClick={() => setIsImporterOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all"
                >
                  İptal
                </button>
                <button
                  onClick={handleImportCurriculum}
                  className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 text-xs font-bold transition-all"
                >
                  Müfredatı Böl
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────────────
          FOLDER CREATOR MODAL
          ────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isFolderCreatorOpen && (
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
                  onClick={() => setIsFolderCreatorOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400 tracking-wider">Klasör Adı</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Örn: SQL Egzersizleri, Proje Notları..."
                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-cyan-500/50 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder()
                  }}
                />
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setIsFolderCreatorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:bg-cyan-600 transition-all cursor-pointer border-none"
                >
                  Oluştur
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────────────
          DOCUMENT NOTES MODAL
          ────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeNotesResourceId !== null && (() => {
          const res = resources.find(r => r.id === activeNotesResourceId)
          if (!res) return null
          const noteText = getNoteForResource(res.id)
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
                    onClick={() => setActiveNotesResourceId(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  value={noteText}
                  onChange={(e) => handleUpdateNoteForResource(res.id, e.target.value)}
                  placeholder="Bu dökümana veya ders kaynağına ait notlarınızı buraya kaydedin (Otomatik kaydedilir)..."
                  className="w-full h-56 resize-none p-3 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-black/20 text-xs font-bold leading-5 text-slate-950 dark:text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setActiveNotesResourceId(null)}
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
        {activeReinforceResourceId !== null && (() => {
          const res = resources.find(r => r.id === activeReinforceResourceId)
          if (!res) return null
          const taskList = reinforcements[`resource:${res.id}`] || reinforcements[res.id] || []
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
                    onClick={() => setActiveReinforceResourceId(null)}
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
                            handleAddReinforceTask(res.id, val)
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
                          handleAddReinforceTask(res.id, val)
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
                        <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })()}

                {/* Tasks List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {taskList.length === 0 ? (
                    <p className="text-xs text-slate-900 dark:text-zinc-350 text-center py-6">
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
                            onChange={() => handleToggleReinforceTask(res.id, task.id)}
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
                            onClick={() => handleWriteCodeForReinforce(res, task)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold"
                          >
                            <Code2 className="h-3 w-3" />
                            <span>Kod Yaz</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReinforceTask(res.id, task.id)}
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
                    onClick={() => setActiveReinforceResourceId(null)}
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
