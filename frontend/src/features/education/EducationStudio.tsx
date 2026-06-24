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
  CheckSquare
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { apiClient } from '@/api/client'
import { useCreateTask, useTasks, useToggleTaskComplete, useDeleteTask } from '@/api/tasks'
import { cn } from '@/lib/utils'
import { mockEducationPractices, mockEducationResources, mockEducations } from './mockEducationData'
import { DateTimePicker } from '@/features/dashboard/DateTimePicker'
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
} from './types'

interface FolderData {
  id: string
  name: string
  resourceIds: number[]
}

interface ReinforcementTask {
  id: string
  title: string
  completed: boolean
  codeFileName: string
}

const LANGUAGE_LEVELS: Array<{ id: LanguageLevel; label: string; shortLabel: string }> = [
  { id: 'A1_A2', label: 'A1-A2 Başlangıç', shortLabel: 'A1-A2' },
  { id: 'B1', label: 'B1 Orta Seviye', shortLabel: 'B1' },
  { id: 'B2', label: 'B2 İleri Orta', shortLabel: 'B2' },
  { id: 'C1_C2', label: 'C1-C2 İleri', shortLabel: 'C1-C2' },
]

const VOCABULARY_TYPES: VocabularyType[] = ['Noun', 'Verb', 'Adj']

const defaultCodeFiles: CodeFile[] = [
  {
    name: 'Main.java',
    content: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("CompileMe practice");\n    }\n}',
  },
]

const parseCodeFiles = (rawCode: string): CodeFile[] => {
  if (!rawCode || !rawCode.trim()) {
    return defaultCodeFiles
  }
  try {
    const parsed = JSON.parse(rawCode)
    if (Array.isArray(parsed)) {
      return parsed as CodeFile[]
    }
  } catch {
    return [{ name: 'Main.java', content: rawCode }]
  }
  return [{ name: 'Main.java', content: rawCode }]
}

const serializeCodeFiles = (files: CodeFile[]): string => {
  try {
    return JSON.stringify(files)
  } catch {
    return '[]'
  }
}

const parseVocabulary = (rawCode: string): VocabularyCard[] => {
  if (!rawCode || !rawCode.trim()) return []
  try {
    const parsed = JSON.parse(rawCode)
    if (Array.isArray(parsed)) return parsed as VocabularyCard[]
  } catch {
    return []
  }
  return []
}

const serializeVocabulary = (cards: VocabularyCard[]): string => {
  try {
    return JSON.stringify(cards)
  } catch {
    return '[]'
  }
}

const parseCheatsheet = (rawCode: string): CheatsheetItem[] => {
  if (!rawCode || !rawCode.trim()) return []
  try {
    const parsed = JSON.parse(rawCode)
    if (Array.isArray(parsed)) return parsed as CheatsheetItem[]
  } catch {
    return []
  }
  return []
}

const serializeCheatsheet = (items: CheatsheetItem[]): string => {
  try {
    return JSON.stringify(items)
  } catch {
    return '[]'
  }
}

const getPlatformIcon = (source: string) => {
  const normalized = source.toLowerCase()
  if (normalized.includes('youtube')) return <Youtube className="h-4 w-4 text-red-500" />
  if (normalized.includes('udemy')) return <Tv className="h-4 w-4 text-purple-500" />
  return <GraduationCap className="h-4 w-4 text-cyan-500" />
}

const getBrandIcon = (url: string) => {
  const lower = url.toLowerCase()
  if (lower.includes('github')) return <Github className="h-5 w-5 text-slate-900 dark:text-white" />
  if (lower.includes('udemy')) return <MonitorPlay className="h-5 w-5 text-purple-500" />
  if (lower.includes('youtube')) return <Youtube className="h-5 w-5 text-red-500" />
  return <Globe className="h-5 w-5 text-cyan-500" />
}

const getGlowColor = (url: string) => {
  const lower = url.toLowerCase()
  if (lower.includes('github')) return 'hover:shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:border-slate-400'
  if (lower.includes('udemy')) return 'hover:shadow-[0_0_24px_rgba(168,85,247,0.3)] hover:border-purple-500/50'
  if (lower.includes('youtube')) return 'hover:shadow-[0_0_24px_rgba(239,68,68,0.3)] hover:border-red-500/50'
  return 'hover:shadow-[0_0_24px_rgba(6,182,212,0.3)] hover:border-cyan-500/50'
}

const getFileIcon = (fileName: string, fileType: string) => {
  const name = fileName.toLowerCase()
  if (fileType === 'PDF' || name.endsWith('.pdf')) {
    return <FileText className="h-4 w-4 text-red-500 shrink-0" />
  }
  if (fileType === 'LINK' || name.startsWith('http')) {
    return <LinkIcon className="h-4 w-4 text-sky-500 shrink-0" />
  }
  if (fileType === 'VIDEO' || name.includes('video') || name.includes('youtube')) {
    return <Play className="h-4 w-4 text-purple-500 shrink-0" />
  }
  if (name.endsWith('.ppt') || name.endsWith('.pptx') || name.endsWith('.presentation')) {
    return <Presentation className="h-4 w-4 text-orange-500 shrink-0" />
  }
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.gif')) {
    return <Image className="h-4 w-4 text-blue-500 shrink-0" />
  }
  return <FileText className="h-4 w-4 text-cyan-500 shrink-0" />
}

const buildLineNumbers = (content: string) => {
  const count = Math.max(content.split('\n').length, 14)
  return Array.from({ length: count }, (_, idx) => idx + 1)
}

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate.toISOString().slice(0, 10)
}

const getNextReviewDate = (box: VocabularyCard['box']) => {
  const intervals: Record<VocabularyCard['box'], number> = {
    1: 1,
    2: 3,
    3: 7,
  }
  return addDays(new Date(), intervals[box] || 1)
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

  // Eğitimi bul
  const education = React.useMemo(
    () => mockEducations.find((item) => item.id === educationId),
    [educationId]
  )

  // DB'den bu eğitime ait görevleri çek
  const { data: dbTasks = [] } = useTasks({ educationId })
  const { isPersistedEducation, persistedTaskIds } = useEducationPersistenceGuard(educationId, dbTasks)

  // Yerel veri durumları
  const [resources, setResources] = React.useState<EducationResource[]>([])
  const [practices, setPractices] = React.useState<EducationPractice[]>([])

  const [selectedResourceId, setSelectedResourceId] = React.useState<number | null | undefined>(null)
  const [selectedPracticeId, setSelectedPracticeId] = React.useState<number | null>(null)
  const [activeTab, setActiveTab] = React.useState<'overview' | 'files' | 'links' | 'primary' | 'notes'>('overview')
  const [notesDraft, setNotesDraft] = React.useState('')
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
  const [activeNotesResourceId, setActiveNotesResourceId] = React.useState<number | null>(null)
  const [reinforcements, setReinforcements] = React.useState<Record<number, ReinforcementTask[]>>({})
  const [activeReinforceResourceId, setActiveReinforceResourceId] = React.useState<number | null>(null)
  const [isFolderCreatorOpen, setIsFolderCreatorOpen] = React.useState(false)
  const [newFolderName, setNewFolderName] = React.useState('')
  const [replacingResourceId, setReplacingResourceId] = React.useState<number | null>(null)

  const saveResources = (newResources: EducationResource[]) => {
    setResources(newResources)
    localStorage.setItem(`resources-${educationId}`, JSON.stringify(newResources))
  }

  const savePractices = (newPractices: EducationPractice[]) => {
    setPractices(newPractices)
    localStorage.setItem(`practices-${educationId}`, JSON.stringify(newPractices))
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

  const saveReinforcements = (newReinforcements: Record<number, ReinforcementTask[]>) => {
    setReinforcements(newReinforcements)
    localStorage.setItem(`reinforcements-${educationId}`, JSON.stringify(newReinforcements))
  }

  // Eğitimin verilerini yerel state ile bağla
  React.useEffect(() => {
    if (!education) return

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
    if (savedNotes) {
      setResourceNotes(JSON.parse(savedNotes))
    } else {
      const notesMap: Record<number | string, string> = {}
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
  }, [educationId, education])

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

  // Not taslağını pratik değiştikçe güncelle
  React.useEffect(() => {
    setNotesDraft(selectedPractice?.notes ?? '')
  }, [selectedPracticeId, selectedPractice?.notes])

  // Debounced auto-save notlar için
  React.useEffect(() => {
    if (!selectedPracticeId || !selectedPractice) return
    if (notesDraft === selectedPractice.notes) return

    setSaveState('saving')
    const timer = setTimeout(async () => {
      if (!isPersistedEducation) {
        setPractices((prev) =>
          prev.map((p) => (p.id === selectedPracticeId ? { ...p, notes: notesDraft } : p))
        )
        setSaveState('saved')
        return
      }
      try {
        await apiClient.patch(`/educations/practices/${selectedPracticeId}`, {
          title: selectedPractice.title,
          completed: selectedPractice.completed,
          code: selectedPractice.code,
          notes: notesDraft,
          resourceId: selectedPractice.resource_id,
          orderIndex: selectedPractice.order_index ?? 0,
        })
        setPractices((prev) =>
          prev.map((p) => (p.id === selectedPracticeId ? { ...p, notes: notesDraft } : p))
        )
        setSaveState('saved')
        toast.success('Notlar otomatik kaydedildi.')
      } catch {
        setSaveState('saved')
      }
    }, 1200)

    return () => clearTimeout(timer)
  }, [isPersistedEducation, notesDraft, selectedPracticeId])

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

  // Toplu Müfredat İçe Aktarma (Syllabus Parser)
  const handleImportCurriculum = () => {
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
      let type: 'PDF' | 'LINK' | 'VIDEO' | 'DOC' = 'DOC'

      if (match) {
        url = match[1]
        name = line.replace(url, '').trim().replace(/^[-:|]+|[-:|]+$/g, '').trim() || url
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
        type = 'VIDEO'
      }

      newResources.push({
        id: nextResourceId + idx,
        education_id: educationId,
        name,
        type,
        url_or_path: url,
      })
    })

    const updatedResources = [...resources, ...newResources]
    saveResources(updatedResources)

    const pdfIds = newResources.filter(r => r.type === 'PDF' || r.type === 'DOC').map(r => r.id)
    const linkIds = newResources.filter(r => r.type === 'LINK' || r.type === 'VIDEO').map(r => r.id)

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
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const newResource: EducationResource = {
      id: Date.now(),
      education_id: educationId,
      name: file.name,
      type: file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC',
      url_or_path: URL.createObjectURL(file)
    }

    const updatedResources = [...resources, newResource]
    saveResources(updatedResources)

    const targetFolderId = newResource.type === 'PDF' ? 'folder-pdf' : 'folder-link'
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

  // Klasör Sil
  const handleDeleteFolder = (folderId: string) => {
    if (window.confirm('Bu klasörü silmek istediğinize emin misiniz? (Klasörün içindeki dökümanlar silinmez, klasörsüz kalır)')) {
      const updated = folders.filter(f => f.id !== folderId)
      saveFolders(updated)
      toast.success('Klasör silindi.')
    }
  }

  // Klasör Yeniden Adlandır
  const handleRenameFolder = (folderId: string) => {
    const currentFolder = folders.find(f => f.id === folderId)
    if (!currentFolder) return
    const newName = window.prompt('Klasör ismini düzenleyin:', currentFolder.name)?.trim()
    if (newName) {
      const updated = folders.map(f => f.id === folderId ? { ...f, name: newName } : f)
      saveFolders(updated)
      toast.success('Klasör ismi güncellendi.')
    }
  }

  // Dosya Kaldır (Delete Resource)
  const handleDeleteResource = (resId: number) => {
    if (window.confirm('Bu kaynağı silmek istediğinize emin misiniz?')) {
      const updatedResources = resources.filter(r => r.id !== resId)
      saveResources(updatedResources)

      // Remove from folders
      const updatedFolders = folders.map(f => ({
        ...f,
        resourceIds: f.resourceIds.filter(id => id !== resId)
      }))
      saveFolders(updatedFolders)

      // Clean metadata
      const updatedCompleted = { ...completedResources }
      delete updatedCompleted[resId]
      saveCompletedResources(updatedCompleted)

      const updatedNotes = { ...resourceNotes }
      delete updatedNotes[resId]
      saveResourceNotes(updatedNotes)

      const updatedReinforce = { ...reinforcements }
      delete updatedReinforce[resId]
      saveReinforcements(updatedReinforce)

      toast.success('Kaynak silindi.')
    }
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
          type: file.name.toLowerCase().endsWith('.pdf') ? ('PDF' as const) : ('DOC' as const),
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

  // Kod Editörüne Yönlendir
  const handleOpenCodeForResource = (res: EducationResource) => {
    let practice = practices.find(p => p.resource_id === res.id)
    if (!practice) {
      // Create new practice if not exists
      const newPractice: EducationPractice = {
        id: Date.now(),
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
      }
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
  const handleAddReinforceTask = (resId: number, title: string) => {
    const taskList = reinforcements[resId] || []
    if (taskList.length >= 10) {
      toast.error('En fazla 10 pekiştirme görevi ekleyebilirsiniz.')
      return
    }
    const newTask: ReinforcementTask = {
      id: `reinforce-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      completed: false,
      codeFileName: `Pekistirme_${resId}_${taskList.length + 1}.java`
    }
    const updated = {
      ...reinforcements,
      [resId]: [...taskList, newTask]
    }
    saveReinforcements(updated)
    toast.success('Pekiştirme projesi eklendi.')
  }

  const handleToggleReinforceTask = (resId: number, taskId: string) => {
    const taskList = reinforcements[resId] || []
    const updatedList = taskList.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    const updated = {
      ...reinforcements,
      [resId]: updatedList
    }
    saveReinforcements(updated)
  }

  const handleDeleteReinforceTask = (resId: number, taskId: string) => {
    const taskList = reinforcements[resId] || []
    const updatedList = taskList.filter(t => t.id !== taskId)
    const updated = {
      ...reinforcements,
      [resId]: updatedList
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
        practice.code = serializeCodeFiles(files)
        savePractices(practices.map(p => p.id === practice.id ? practice : p))
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
    const statusCycle: Record<string, 'PLANNING' | 'ACTIVE' | 'DONE'> = {
      PLANNING: 'ACTIVE',
      ACTIVE: 'DONE',
      DONE: 'PLANNING',
    }
    const next = statusCycle[education.status] || 'ACTIVE'
    education.status = next
    toast.success(`Eğitim durumu "${next === 'PLANNING' ? 'Planlama' : next === 'ACTIVE' ? 'Çalışılıyor' : 'Tamamlandı'}" olarak güncellendi!`)
    setResources([...resources])
  }

  const getStatusLabel = (status: string) => {
    if (status === 'PLANNING') return 'Planlama'
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
    setFolders(updated)
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
    void handleUpdatePractice(selectedPractice.id, { code: serializeCodeFiles(codeFiles) })
    toast.success('Kod değişiklikleri kaydedildi.')
  }

  // Language Vocabulary Helpers
  const vocabulary = parseVocabulary(selectedPractice?.code ?? '')
  const levelVocabulary = vocabulary

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
  const renderOverviewTab = () => {
    return (
      <div className="grid grid-cols-12 gap-6 h-full overflow-hidden">
        {/* Roadmap - Sol Blok */}
        <div className="col-span-12 lg:col-span-7 h-full flex flex-col min-h-[300px]">
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/20 backdrop-blur-xl h-full flex flex-col">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-4 flex items-center gap-1.5 shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
              <span>Eğitim Yol Haritası (Roadmap)</span>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pl-2 relative border-l border-slate-200 dark:border-zinc-800 ml-3">
              {resources.map((res) => {
                const resPractices = practices.filter((p) => p.resource_id === res.id)
                const isCompleted = resPractices.length > 0 && resPractices.every((p) => p.completed)
                return (
                  <div key={res.id} className="relative pl-6">
                    <div
                      className={cn(
                        'absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border transition-all duration-300',
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                          : 'bg-slate-200 border-slate-300 dark:bg-zinc-900 dark:border-zinc-700'
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-200">{res.name}</span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5">{res.url_or_path}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bugünün İşleri ve Karalama Defteri - Sağ Blok */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 h-full overflow-hidden">
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/20 backdrop-blur-xl flex flex-col shrink-0">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-cyan-500" />
              <span>Bugünkü Eğitim İşleri</span>
            </h3>

            {/* Hızlı Görev Ekleme Barı - Genişletilmiş Task Card Formatı */}
            <form onSubmit={handleAddTask} className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-black/15 border border-slate-200/50 dark:border-zinc-800/50 mb-4 shadow-sm">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-500 tracking-wider">Görev Başlığı</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Örn: Spring Boot JPA Çalışması..."
                  className="h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-500 tracking-wider">Tarih Seç</label>
                  <input
                    type="date"
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    className="h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-500 tracking-wider">Saat Seç</label>
                  <input
                    type="time"
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    className="h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-cyan-500 text-white text-xs font-black shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:bg-cyan-600 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
              >
                <Plus className="h-4 w-4" />
                <span>+ Ekle</span>
              </button>
            </form>

            {/* Görev Listesi */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {localTasks.length === 0 ? (
                <p className="text-[11px] text-slate-900 dark:text-zinc-300 text-center py-4">
                  Bugün için planlanmış proje görevi yok.
                </p>
              ) : (
                localTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-zinc-900/35 border border-slate-200/50 dark:border-zinc-800/50 gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={t.status === 'DONE'}
                        onChange={() => void handleToggleLocalTask(t.id)}
                        className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-zinc-700 bg-transparent cursor-pointer"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        {editingTaskId === t.id ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <input
                              type="text"
                              value={editingTaskTitle}
                              onChange={(e) => setEditingTaskTitle(e.target.value)}
                              className="h-7 px-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:border-cyan-500/50 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveLocalTaskEdit(t.id)}
                              className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold"
                            >
                              Kaydet
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTaskId(null)}
                              className="px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[10px] font-bold"
                            >
                              İptal
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className={cn(
                              "text-xs font-bold text-slate-900 dark:text-zinc-300 truncate",
                              t.status === 'DONE' && "line-through opacity-50"
                            )}>
                              {t.title}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {/* Dynamic Course Title Tag */}
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
                                {t.tag}
                              </span>
                              {(t.scheduledDate || t.scheduledTime) && (
                                <span className="text-[9px] font-semibold text-slate-500 dark:text-zinc-500 flex items-center gap-0.5 shrink-0">
                                  <Calendar className="h-2.5 w-2.5" />
                                  <span>{t.scheduledDate} {t.scheduledTime}</span>
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {editingTaskId !== t.id && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTaskId(t.id)
                            setEditingTaskTitle(t.title)
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                          title="Görevi Düzenle"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteLocalTask(t.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                          title="Görevi Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Scratchpad */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/20 backdrop-blur-xl flex flex-col flex-grow min-h-[140px]">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-cyan-500" />
              <span>Anlık Karalama Defteri</span>
            </h3>
            <textarea
              defaultValue={localStorage.getItem(`education-scratch-${educationId}`) || ''}
              onChange={(e) => localStorage.setItem(`education-scratch-${educationId}`, e.target.value)}
              placeholder="Hızlı notlarınızı buraya karalayın (Otomatik kaydedilir)..."
              className="w-full flex-grow resize-none bg-transparent text-xs font-semibold leading-relaxed text-slate-900 dark:text-zinc-300 outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>
      </div>
    )
  }
  const renderDosyalarTab = () => {
    const folderResourceIds = new Set(folders.flatMap((f) => f.resourceIds))
    const uncategorizedResources = resources.filter((r) => !folderResourceIds.has(r.id))

    return (
      <div className="space-y-6">
        {/* Hidden inputs for replacement */}
        <input
          type="file"
          id="replace-file-input"
          onChange={handleFileReplace}
          className="hidden"
        />

        {/* Üst Kontrol & Batch Importer */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4 gap-3">
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.gif"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 px-4 py-2 rounded-full transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tekil Dosya Yükle</span>
            </button>
            <button
              onClick={() => setIsFolderCreatorOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 px-4 py-2 rounded-full transition-all cursor-pointer"
            >
              <FolderPlus className="h-3.5 w-3.5 text-amber-500" />
              <span>Yeni Klasör</span>
            </button>
          </div>
          <button
            onClick={() => setIsImporterOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-black text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-all bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 px-4 py-2 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.08)] cursor-pointer"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Müfredat Yapıştır</span>
          </button>
        </div>

        {/* Klasörleme Yapısı ve Drag & Drop */}
        <div className="space-y-4">
          {folders.map((folder, folderIdx) => {
            const isOpen = !!foldersOpen[folder.id]
            const folderResources = folder.resourceIds
              .map(id => resources.find(r => r.id === id))
              .filter((r): r is EducationResource => !!r)

            return (
              <div
                key={folder.id}
                draggable
                onDragStart={(e) => handleDragStartFolder(e, folderIdx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const type = e.dataTransfer.getData('text/plain')
                  if (type === 'resource') {
                    handleDropResourceOnFolderHeader(e, folder.id)
                  } else {
                    handleDropFolder(e, folderIdx)
                  }
                }}
                className="border border-slate-200 dark:border-zinc-850 rounded-2xl bg-white/20 dark:bg-zinc-950/10 overflow-hidden shadow-sm"
              >
                {/* Folder Header */}
                <div
                  onClick={() => toggleFolderState(folder.id)}
                  className="w-full flex items-center justify-between p-4 bg-slate-100/50 dark:bg-zinc-900/30 text-xs font-bold text-slate-900 dark:text-white cursor-pointer select-none group/folder"
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span>{folder.name} ({folderResources.length} Öğe)</span>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleRenameFolder(folder.id)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-cyan-500 transition-colors"
                      title="Yeniden Adlandır"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-red-500 transition-colors"
                      title="Klasörü Sil"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <ChevronRight className={cn('h-4 w-4 text-slate-400 transition-transform duration-300 ml-1', isOpen && 'rotate-90')} />
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-slate-200 dark:border-zinc-800"
                    >
                      <div className="p-3 space-y-2">
                        {folderResources.length === 0 ? (
                          <p className="text-xs text-slate-900 dark:text-zinc-350 p-3">Bu klasör henüz boş. Dosyaları buraya sürükleyebilirsiniz.</p>
                        ) : (
                          <div className="relative border-l border-slate-200 dark:border-zinc-800 ml-3 pl-4 space-y-2">
                            {folderResources.map((res, resIdx) => (
                              <div
                                key={res.id}
                                draggable
                                onDragStart={(e) => handleDragStartResource(e, folder.id, res.id)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleDropResource(e, folder.id, resIdx)
                                }}
                                className="flex items-center justify-between p-3 bg-white/40 dark:bg-zinc-900/35 border border-slate-200/50 dark:border-zinc-800/50 rounded-xl hover:bg-slate-100/40 dark:hover:bg-zinc-900/20 transition-all cursor-pointer group"
                              >
                                {/* Left: Checkbox + Icon + Link Title */}
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={!!completedResources[res.id]}
                                    onChange={(e) => {
                                      e.stopPropagation()
                                      const updated = { ...completedResources, [res.id]: !completedResources[res.id] }
                                      saveCompletedResources(updated)
                                      toast.success(updated[res.id] ? 'Kaynak tamamlandı!' : 'Kaynak işareti kaldırıldı.')
                                    }}
                                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-zinc-700 bg-transparent cursor-pointer shrink-0"
                                  />
                                  <div
                                    onClick={() => {
                                      window.open(res.url_or_path, '_blank')
                                      toast.success('Belge yeni sekmede açıldı!')
                                    }}
                                    className="flex items-center gap-2 cursor-pointer hover:underline min-w-0 flex-1"
                                  >
                                    {getFileIcon(res.name, res.type)}
                                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                      {res.name}
                                    </span>
                                  </div>
                                </div>

                                {/* Right: Interactive Actions */}
                                <div className="flex items-center gap-1 shrink-0 ml-4 opacity-75 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => setActiveNotesResourceId(res.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                                    title="Notlar"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenCodeForResource(res)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                                    title="Kodlama Editörü"
                                  >
                                    <Code2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => triggerReplaceFile(res.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                                    title="Değiştir"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setActiveReinforceResourceId(res.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                                    title="Pekiştirme Projeleri"
                                  >
                                    <Zap className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteResource(res.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                    title="Kaldır"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {/* Klasörlenmemiş Kaynaklar Bölümü */}
        {uncategorizedResources.length > 0 && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleDropResource(e, 'uncategorized', uncategorizedResources.length)
            }}
            className="border border-dashed border-slate-300 dark:border-zinc-800 rounded-2xl bg-slate-50/20 dark:bg-black/10 p-4 space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              <FolderOpen className="h-4 w-4 text-slate-400" />
              <span>Klasörlenmemiş Dosyalar ({uncategorizedResources.length} Öğe)</span>
            </div>
            <div className="space-y-2 pl-4 border-l border-slate-200 dark:border-zinc-800">
              {uncategorizedResources.map((res, resIdx) => (
                <div
                  key={res.id}
                  draggable
                  onDragStart={(e) => handleDragStartResource(e, 'uncategorized', res.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDropResource(e, 'uncategorized', resIdx)
                  }}
                  className="flex items-center justify-between p-3 bg-white/40 dark:bg-zinc-900/35 border border-slate-200/50 dark:border-zinc-800/50 rounded-xl hover:bg-slate-100/40 dark:hover:bg-zinc-900/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={!!completedResources[res.id]}
                      onChange={(e) => {
                        e.stopPropagation()
                        const updated = { ...completedResources, [res.id]: !completedResources[res.id] }
                        saveCompletedResources(updated)
                        toast.success(updated[res.id] ? 'Kaynak tamamlandı!' : 'Kaynak işareti kaldırıldı.')
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-zinc-700 bg-transparent cursor-pointer shrink-0"
                    />
                    <div
                      onClick={() => {
                        window.open(res.url_or_path, '_blank')
                        toast.success('Belge yeni sekmede açıldı!')
                      }}
                      className="flex items-center gap-2 cursor-pointer hover:underline min-w-0 flex-1"
                    >
                      {getFileIcon(res.name, res.type)}
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {res.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-4 opacity-75 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setActiveNotesResourceId(res.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                      title="Notlar"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenCodeForResource(res)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                      title="Kodlama Editörü"
                    >
                      <Code2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => triggerReplaceFile(res.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                      title="Değiştir"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setActiveReinforceResourceId(res.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                      title="Pekiştirme Projeleri"
                    >
                      <Zap className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteResource(res.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                      title="Kaldır"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }


  const renderLinklerTab = () => {
    const linkResources = resources.filter((r) => r.type === 'LINK')

    return (
      <div className="space-y-6">
        {/* Hızlı Link Ekleme Modülü */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Harici Platform Fırlatma Rampası
            </h3>
            <p className="text-[11px] text-slate-900 dark:text-zinc-300 mt-0.5">
              Udemy, YouTube, GitHub bağlantılarınızı tek merkezden fırlatın
            </p>
          </div>
          <button
            onClick={() => setIsLinkAdderOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-black text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-all bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 px-3.5 py-1.5 rounded-full"
          >
            <Plus className="h-4 w-4" />
            <span>Bağlantı Ekle</span>
          </button>
        </div>

        <AnimatePresence>
          {isLinkAdderOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-955/10 backdrop-blur-xl"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-5">
                  <label className="block text-[9px] font-extrabold uppercase text-slate-900 dark:text-zinc-300 tracking-wider mb-1">
                    Platform Adı (Örn: GitHub Repom)
                  </label>
                  <input
                    type="text"
                    value={newLinkName}
                    onChange={(e) => setNewLinkName(e.target.value)}
                    placeholder="Örn: GitHub Deposu..."
                    className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-cyan-500/50 outline-none"
                  />
                </div>
                <div className="sm:col-span-5">
                  <label className="block text-[9px] font-extrabold uppercase text-slate-900 dark:text-zinc-300 tracking-wider mb-1">
                    Bağlantı URL'si
                  </label>
                  <input
                    type="text"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="github.com/username/repo..."
                    className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-cyan-500/50 outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="w-full h-10 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold transition-all"
                  >
                    + Ekle
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Eklenti Kart Izgarası */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {linkResources.map((link) => (
            <div
              key={link.id}
              onClick={() => {
                window.open(link.url_or_path, '_blank')
                toast.success('Platform fırlatıldı!')
              }}
              className={cn(
                'p-5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/40 bg-white/60 dark:bg-zinc-900/60 cursor-pointer flex flex-col justify-between h-32 group relative overflow-hidden transition-all duration-300',
                getGlowColor(link.url_or_path)
              )}
            >
              <div className="absolute -right-4 -top-4 w-12 h-12 bg-cyan-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-850 text-slate-700 dark:text-zinc-300">
                  {getBrandIcon(link.url_or_path)}
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {link.name}
                </span>
              </div>

              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] text-slate-900 dark:text-zinc-300 truncate max-w-[150px] font-mono">
                  {link.url_or_path}
                </span>
                <ExternalLink className="h-4 w-4 text-slate-400 dark:text-zinc-650 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderCodeTab = () => {
    if (!selectedPractice) {
      return (
        <div className="text-center py-12 text-xs text-slate-900 dark:text-zinc-350">
          Lütfen önce sol döküman listesinden bir pratik odası seçin.
        </div>
      )
    }

    return (
      <div className="flex flex-col h-full min-h-[400px] w-full rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-slate-950">
        {/* IDE Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {codeFiles.map((file) => (
              <button
                key={file.name}
                type="button"
                onClick={() => setActiveFileName(file.name)}
                className={cn(
                  'px-3 py-1.5 rounded-t-lg text-xs font-mono font-bold transition-all relative',
                  activeFile.name === file.name
                    ? 'bg-slate-955 text-cyan-400 font-extrabold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                )}
              >
                {file.name}
                {activeFile.name === file.name && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
                )}
              </button>
            ))}
            <button
              onClick={handleAddNewFile}
              className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
              title="Yeni Dosya Ekle"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <button
            onClick={handleSaveCodeDirectly}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400 hover:text-white hover:bg-cyan-500/10 border border-cyan-500/30 rounded transition-all"
          >
            <Save className="h-3 w-3" />
            <span>Kaydet</span>
          </button>
        </div>

        {/* Editor Layout */}
        <div className="flex-1 grid grid-cols-[3.5rem_1fr] bg-black/50 backdrop-blur-md border border-white/5 relative min-h-[300px]">
          {/* Line Numbers */}
          <div className="select-none border-r border-zinc-850 text-right pr-3 pl-1 py-4 font-mono text-[11px] leading-6 text-zinc-500 bg-slate-950/60">
            {buildLineNumbers(activeFile.content).map((num) => (
              <div key={num}>{num}</div>
            ))}
          </div>

          {/* Code Input */}
          <textarea
            value={activeFile.content}
            onChange={(e) => handleCodeChange(e.target.value)}
            spellCheck={false}
            className="w-full h-full min-h-[300px] resize-none bg-transparent py-4 px-4 font-mono text-xs leading-6 text-cyan-50/90 outline-none placeholder:text-zinc-750 focus:ring-1 focus:ring-cyan-500/20"
            placeholder="// Kodlarınızı buraya yazın..."
          />
        </div>
      </div>
    )
  }

  const renderVocabularyTab = () => {
    return (
      <div className="space-y-6">
        {/* Level Selector */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3">
          {LANGUAGE_LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => setActiveLevel(level.id)}
              className={cn(
                'px-3 py-1.5 text-xs font-bold rounded-xl transition-all border',
                activeLevel === level.id
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-400'
                  : 'bg-transparent border-transparent text-slate-800 dark:text-zinc-400 hover:bg-slate-100/50 dark:hover:bg-zinc-900/40'
              )}
            >
              {level.label}
            </button>
          ))}
        </div>

        {/* Word Adder */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/20 backdrop-blur-xl">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-3">
            Kelime Haznesi Ekle
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5">
              <label className="block text-[9px] font-extrabold uppercase text-slate-900 dark:text-zinc-300 tracking-wider mb-1">İngilizce Kelime</label>
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="English word..."
                className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 text-slate-950 dark:text-white"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-[9px] font-extrabold uppercase text-slate-900 dark:text-zinc-300 tracking-wider mb-1">Türkçe Karşılığı</label>
              <input
                type="text"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder="Türkçe karşılığı..."
                className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 text-slate-950 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[9px] font-extrabold uppercase text-slate-900 dark:text-zinc-300 tracking-wider mb-1">Kelime Tipi</label>
              <select
                value={wordType}
                onChange={(e) => setWordType(e.target.value as VocabularyType)}
                className="w-full h-10 px-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 text-slate-950 dark:text-white"
              >
                {VOCABULARY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddVocabWord}
              className="sm:col-span-1 h-10 w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/15 flex items-center justify-center transition-all"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Cards List */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {levelVocabulary.map((card) => {
            const isFlipped = !!flippedCards[card.id]
            return (
              <div key={card.id} className="flex flex-col gap-2">
                <button
                  onClick={() =>
                    setFlippedCards((prev) => ({ ...prev, [card.id]: !prev[card.id] }))
                  }
                  className="h-32 w-full [perspective:800px] text-left outline-none"
                >
                  <div
                    className={cn(
                      'relative w-full h-full rounded-2xl border border-slate-200/60 dark:border-zinc-800/40 bg-white/60 dark:bg-zinc-900/60 transition-transform duration-500 [transform-style:preserve-3d]',
                      isFlipped && '[transform:rotateY(180deg)]'
                    )}
                  >
                    {/* Front Side */}
                    <div className="absolute inset-0 flex flex-col justify-between p-4 [backface-visibility:hidden] overflow-hidden">
                      <span className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {card.word}
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase">
                          {card.type}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                          Box {card.box}
                        </span>
                      </div>
                    </div>

                    {/* Back Side */}
                    <div className="absolute inset-0 flex flex-col justify-between p-4 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 overflow-hidden">
                      <span className="text-sm font-black truncate">
                        {card.meaning}
                      </span>
                      <span className="text-[9px] font-medium opacity-80">
                        Tarih: {card.nextReview}
                      </span>
                    </div>
                  </div>
                </button>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleLeitnerResult(card.id, 'known')}
                    className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase transition-all"
                  >
                    Biliyorum
                  </button>
                  <button
                    onClick={() => handleLeitnerResult(card.id, 'forgot')}
                    className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase transition-all"
                  >
                    Unuttum
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderCheatsheetTab = () => {
    return (
      <div className="space-y-6">
        {/* Cheatsheet Adder */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/20 backdrop-blur-xl">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-3">
            Kilit Teknik Kavram Ekle (Cheatsheet)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4">
              <label className="block text-[9px] font-extrabold uppercase text-slate-900 dark:text-zinc-300 tracking-wider mb-1">Anahtar Terim / Konsept</label>
              <input
                type="text"
                value={keyConcept}
                onChange={(e) => setKeyConcept(e.target.value)}
                placeholder="Örn: ACID Standartları..."
                className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 text-slate-950 dark:text-white"
              />
            </div>
            <div className="md:col-span-7">
              <label className="block text-[9px] font-extrabold uppercase text-slate-900 dark:text-zinc-300 tracking-wider mb-1">Özet Teknik Açıklama</label>
              <input
                type="text"
                value={conceptDescription}
                onChange={(e) => setConceptDescription(e.target.value)}
                placeholder="Kısa ve net ezber bilgisi..."
                className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 text-slate-950 dark:text-white"
              />
            </div>
            <button
              onClick={handleAddCheatItem}
              className="md:col-span-1 h-10 w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/15 flex items-center justify-center transition-all"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Cheatsheet Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cheatsheet.map((item) => (
            <div
              key={item.id}
              className="relative p-4 pr-10 rounded-xl border border-slate-200/60 dark:border-zinc-800/40 bg-white/60 dark:bg-zinc-900/60 flex flex-col gap-1.5 animate-in fade-in duration-300"
            >
              <button
                onClick={() => handleDeleteCheatItem(item.id)}
                className="absolute right-3 top-3 p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:text-zinc-650 hover:bg-red-500/10 transition-all"
                title="Sil"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {item.keyConcept}
              </span>
              <p className="text-[11px] font-medium text-slate-650 dark:text-zinc-350 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderNotlarTab = () => {
    return (
      <div className="flex flex-col h-full min-h-[350px]">
        {/* Dropdown Topic Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-zinc-350">
              Konu Seçimi:
            </label>
            <select
              value={selectedResourceId === null || selectedResourceId === undefined ? 'general' : selectedResourceId}
              onChange={(e) => {
                const val = e.target.value
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
              }}
              className="h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 text-slate-950 dark:text-white outline-none"
            >
              <option value="general">Kurs Genel Notları</option>
              {resources.map((res) => (
                <option key={res.id} value={res.id}>
                  {res.name}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[10px] font-extrabold uppercase text-cyan-600 dark:text-cyan-400">
            {saveState === 'saving' ? 'Kaydediliyor...' : 'Otomatik Kayıt Aktif'}
          </span>
        </div>

        {/* Text Editor Area */}
        <div className="flex-1 mt-4 flex flex-col">
          {education.type === 'LANGUAGE' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
              <div className="lg:col-span-8 flex flex-col">
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Write your technical summary or speaking diary in English..."
                  className="w-full flex-1 min-h-[250px] resize-none bg-white/50 dark:bg-black/20 p-4 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold leading-6 text-slate-950 dark:text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                />
              </div>

              <div className="lg:col-span-4 glass-panel p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/20 backdrop-blur-xl flex flex-col gap-3">
                <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  Çeviri & Sözlük Asistanı
                </h5>
                <textarea
                  value={translateInput}
                  onChange={(e) => setTranslateInput(e.target.value)}
                  placeholder="Çevirilecek ifadeyi girin..."
                  className="w-full h-20 resize-none rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 p-2.5 text-xs text-slate-950 dark:text-white outline-none focus:border-cyan-500/40"
                />
                <button
                  type="button"
                  onClick={handleQuickTranslate}
                  className="w-full py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold transition-all"
                >
                  Çevir
                </button>
                {translateResult && (
                  <div className="mt-2 p-3 rounded-xl bg-white/60 dark:bg-black/35 text-[11px] font-semibold text-slate-900 dark:text-zinc-350 leading-relaxed whitespace-pre-line border border-slate-200 dark:border-zinc-800">
                    {translateResult}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="# Cornell Not Alma Metodu&#10;&#10;## Kavramlar & İpuçları&#10;- Terim 1: Kısaca ipucu...&#10;&#10;## Detaylı Ders Notları&#10;- Buraya döküman veya videodaki tüm önemli yerleri yazın...&#10;&#10;## Özet&#10;- Konuyu kendi kelimelerinizle 2 satırda özetleyin..."
              className="w-full flex-1 min-h-[300px] resize-none bg-white/50 dark:bg-black/20 p-4 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold leading-6 text-slate-950 dark:text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
            />
          )}
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab()
      case 'files':
        return renderDosyalarTab()
      case 'links':
        return renderLinklerTab()
      case 'primary':
        if (education.type === 'PROGRAMMING') {
          return <StudioModePanel type={education.type}>{renderCodeTab()}</StudioModePanel>
        } else if (education.type === 'LANGUAGE') {
          return <StudioModePanel type={education.type}>{renderVocabularyTab()}</StudioModePanel>
        } else {
          return <StudioModePanel type={education.type}>{renderCheatsheetTab()}</StudioModePanel>
        }
      case 'notes':
        return renderNotlarTab()
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
              onClick={() => setActiveTab(option.id)}
              className={getMovieButtonClass(activeTab === option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Ana Gövde (Body) */}
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
          const taskList = reinforcements[res.id] || []
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
