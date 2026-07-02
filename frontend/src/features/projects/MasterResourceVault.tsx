import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FileText,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ExternalLink,
  Code,
  Link as LinkIcon,
  Upload,
  Globe,
  Loader2,
  FileCode,
  Lock,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Project,
  ProjectPhase,
  DocumentType,
  LinkType,
  useProjectDocuments,
  useAddProjectDocument,
  useDeleteProjectDocument,
  useUpdateProjectDocument,
  useProjectLinks,
  useAddProjectLink,
  useDeleteProjectLink,
  useProjectPhases,
} from '../../api/projects'
import {
  useTasks,
  useCreateTask,
  useToggleTaskComplete,
  useDeleteTask,
} from '../../api/tasks'
import { useUploadFile } from '../../api/files'
import { DocumentsSelector } from './DocumentsSelector'
import { cn } from '../../lib/utils'
import { SketchButton } from '../../components/ui/SketchButton'
import { Select } from '../../components/ui/Select'

interface MasterResourceVaultProps {
  project: Project
  currentPhaseId?: number
  currentSubPhaseId?: number
  defaultSelectedDocId?: number
}

const SUB_REGEX = /^\[PHASE:(\d+):SUB:(\d+)(?::STATUS:(\w+))?\]\s*(.*)$/
const SUB_PHASE_STATUSES = ['PLANNING', 'DEVELOPMENT', 'TEST', 'COMPLETED'] as const
type SubPhaseStatus = (typeof SUB_PHASE_STATUSES)[number]

function decodeSubTitle(
  title: string
): { phaseId: number; subIndex: number; status: SubPhaseStatus; label: string } | null {
  const match = title.match(SUB_REGEX)
  if (!match) return null
  return {
    phaseId: parseInt(match[1], 10),
    subIndex: parseInt(match[2], 10),
    status: (match[3] || 'PLANNING') as SubPhaseStatus,
    label: match[4],
  }
}

export const MasterResourceVault: React.FC<MasterResourceVaultProps> = ({
  project,
  currentPhaseId,
  currentSubPhaseId,
  defaultSelectedDocId,
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlDocId = searchParams.get('docId')
  const activeDocId = urlDocId ? parseInt(urlDocId, 10) : defaultSelectedDocId

  // API Data
  const { data: documents = [], isLoading: docsLoading } = useProjectDocuments(project.id)
  const { data: links = [], isLoading: linksLoading } = useProjectLinks(project.id)
  const { data: phases = [] } = useProjectPhases(project.id)
  const { data: tasks = [] } = useTasks({ projectId: project.id })

  const addDocMutation = useAddProjectDocument()
  const deleteDocMutation = useDeleteProjectDocument(project.id)
  const updateDocMutation = useUpdateProjectDocument()

  const addLinkMutation = useAddProjectLink()
  const deleteLinkMutation = useDeleteProjectLink(project.id)

  const uploadFileMutation = useUploadFile()

  const createTaskMutation = useCreateTask()
  const toggleTaskMutation = useToggleTaskComplete()
  const deleteTaskMutation = useDeleteTask()

  // Form State
  const [formMode, setFormMode] = useState<'document' | 'link'>('document')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [docType, setDocType] = useState<DocumentType>('TECH_DOC')

  const [linkUrl, setLinkUrl] = useState('')
  const [linkNotes, setLinkNotes] = useState('')

  const [selectedPhaseId, setSelectedPhaseId] = useState<number | 'none'>('none')
  const [selectedSubPhaseId, setSelectedSubPhaseId] = useState<number | 'none'>('none')

  const [isAdding, setIsAdding] = useState(false)
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null)

  // Drag over dropzone state
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)

  // Lock phase context if passed from props
  useEffect(() => {
    if (currentSubPhaseId) {
      setSelectedSubPhaseId(currentSubPhaseId)
      // find parent phase of this subphase
      const subPhaseObj = documents.find(d => d.id === currentSubPhaseId)
      if (subPhaseObj) {
        const decoded = decodeSubTitle(subPhaseObj.title)
        if (decoded) {
          setSelectedPhaseId(decoded.phaseId)
        }
      }
    } else if (currentPhaseId) {
      setSelectedPhaseId(currentPhaseId)
      setSelectedSubPhaseId('none')
    }
  }, [currentPhaseId, currentSubPhaseId, documents])

  // Decode subphases from document list
  const decodedSubPhases = useMemo(() => {
    return documents
      .map((d) => {
        const decoded = decodeSubTitle(d.title)
        if (!decoded) return null
        return {
          ...decoded,
          id: d.id,
        }
      })
      .filter(Boolean) as Array<{ phaseId: number; subIndex: number; status: SubPhaseStatus; label: string; id: number }>
  }, [documents])

  // Filtered subphases for the currently selected phase
  const subPhasesForSelectedPhase = useMemo(() => {
    if (selectedPhaseId === 'none') return []
    return decodedSubPhases.filter((sp) => sp.phaseId === selectedPhaseId)
  }, [decodedSubPhases, selectedPhaseId])

  const phaseOptions = useMemo(() => {
    const opts: Array<{ label: string; value: number | 'none' }> = [
      { label: 'Global (Faza Bağlı Olmayan)', value: 'none' }
    ]
    phases.forEach((p, idx) => {
      opts.push({
        label: `Faz ${idx} — ${p.name}`,
        value: p.id
      })
    })
    return opts
  }, [phases])

  const subPhaseOptions = useMemo(() => {
    const opts: Array<{ label: string; value: number | 'none' }> = [
      { label: 'Alt Faza Bağlı Olmayan', value: 'none' }
    ]
    subPhasesForSelectedPhase.forEach((sp) => {
      const parentIdx = phases.findIndex(p => p.id === selectedPhaseId)
      const displayIdx = parentIdx !== -1 ? parentIdx : ''
      opts.push({
        label: `Faz ${displayIdx}.${sp.subIndex} — ${sp.label}`,
        value: sp.id
      })
    })
    return opts
  }, [subPhasesForSelectedPhase, selectedPhaseId, phases])

  // Merge & Format Documents and Links
  const allResources = useMemo(() => {
    const docs = documents
      .filter((d) => !d.title.match(/^\[PHASE:\d+:SUB:\d+/)) // Filter subphase definition docs
      .map((d) => {
        let phaseId: number | null = null
        let subPhaseId: number | null = null

        const phaseMatch = d.title.match(/\[PHASE_REF:(\d+)\]/)
        const subPhaseMatch = d.title.match(/\[SUBPHASE_REF:(\d+)\]/)

        if (subPhaseMatch) {
          subPhaseId = parseInt(subPhaseMatch[1], 10)
        } else if (phaseMatch) {
          phaseId = parseInt(phaseMatch[1], 10)
        }

        if (d.title.startsWith('DOC_SUBPHASE_')) {
          const idStr = d.title.replace('DOC_SUBPHASE_', '')
          subPhaseId = parseInt(idStr, 10)
        }

        if (d.title.startsWith('TECH_STACK_ADR_PHASE_')) {
          const pIdStr = d.title.replace('TECH_STACK_ADR_PHASE_', '')
          phaseId = parseInt(pIdStr, 10)
        }

        return {
          id: d.id,
          uid: `doc-${d.id}`,
          title: d.title,
          content: d.content,
          type: d.type as DocumentType,
          resourceType: 'document' as const,
          phaseId,
          subPhaseId,
          createdAt: d.createdAt || '',
        }
      })

    const lnks = links.map((l) => {
      let phaseId: number | null = null
      let subPhaseId: number | null = null

      const phaseMatch = l.title.match(/\[PHASE_REF:(\d+)\]/)
      const subPhaseMatch = l.title.match(/\[SUBPHASE_REF:(\d+)\]/)

      if (subPhaseMatch) {
        subPhaseId = parseInt(subPhaseMatch[1], 10)
      } else if (phaseMatch) {
        phaseId = parseInt(phaseMatch[1], 10)
      }

      const isFile = l.url.includes('/files') || l.url.includes('/api/files')

      return {
        id: l.id,
        uid: `link-${l.id}`,
        title: l.title,
        url: l.url,
        type: l.type,
        category: l.category,
        notes: l.notes,
        resourceType: isFile ? 'file' as const : 'link' as const,
        phaseId,
        subPhaseId,
        createdAt: l.createdAt || '',
      }
    })

    return [...docs, ...lnks].sort((a, b) => b.id - a.id)
  }, [documents, links])

  // Select default resource from URL param
  useEffect(() => {
    if (activeDocId && allResources.length > 0) {
      const found = allResources.find((r) => r.id === activeDocId && r.resourceType === 'document')
      if (found) {
        setSelectedResourceId(found.uid)
      }
    }
  }, [activeDocId, allResources])

  const selectedResource = useMemo(() => {
    return allResources.find((r) => r.uid === selectedResourceId) || null
  }, [allResources, selectedResourceId])
  const selectedResourceUrl = selectedResource && selectedResource.resourceType !== 'document'
    ? selectedResource.url
    : undefined

  // Clean Title Masking
  const getCleanTitle = (title: string) => {
    let clean = title.replace(/\[(PHASE_REF|SUBPHASE_REF):\d+\]\s*/g, '')

    if (clean.startsWith('TECH_STACK_ADR_PHASE_')) {
      const phaseNum = clean.replace('TECH_STACK_ADR_PHASE_', '')
      return `Faz ${phaseNum} — Teknoloji Yığını & ADR`
    }

    if (clean.startsWith('DOC_SUBPHASE_')) {
      const subId = parseInt(clean.replace('DOC_SUBPHASE_', ''), 10)
      const subObj = decodedSubPhases.find((sp) => sp.id === subId)
      if (subObj) {
        return `${subObj.label} Notu`
      }
      return `Alt Faz Notu (ID: ${subId})`
    }

    return clean
  }

  // Get Phase Relation Badge text
  const getRelationBadge = (resource: any) => {
    if (resource.subPhaseId) {
      const subObj = decodedSubPhases.find((sp) => sp.id === resource.subPhaseId)
      if (subObj) {
        const parentIdx = phases.findIndex((p) => p.id === subObj.phaseId)
        const displayPhase = parentIdx !== -1 ? parentIdx : subObj.phaseId
        return `Faz ${displayPhase}.${subObj.subIndex}`
      }
      return 'Alt Faz'
    }

    if (resource.phaseId) {
      const phaseIdx = phases.findIndex((p) => p.id === resource.phaseId)
      const displayPhase = phaseIdx !== -1 ? phaseIdx : resource.phaseId
      return `Faz ${displayPhase}`
    }

    return null
  }

  // File dropzone handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      await handleFileUpload(files[0])
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    const loadToast = toast.loading(`Dosya yükleniyor: ${file.name}...`)
    try {
      const res = await uploadFileMutation.mutateAsync(file)
      setUploadedFileUrl(res.downloadUrl)
      setUploadedFileName(file.name)
      if (!title) {
        setTitle(file.name)
      }
      toast.dismiss(loadToast)
      toast.success('Dosya başarıyla yüklendi.')
    } catch {
      toast.dismiss(loadToast)
      toast.error('Dosya yüklenirken hata oluştu.')
    }
  }

  // Submit Handler
  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isAdding) return
    setIsAdding(true)

    // Build context tags
    let prefix = ''
    if (selectedSubPhaseId !== 'none') {
      prefix = `[SUBPHASE_REF:${selectedSubPhaseId}] `
    } else if (selectedPhaseId !== 'none') {
      prefix = `[PHASE_REF:${selectedPhaseId}] `
    }

    const finalTitle = prefix + title.trim()

    try {
      if (formMode === 'document') {
        const newDoc = await addDocMutation.mutateAsync({
          projectId: project.id,
          request: {
            type: docType,
            title: finalTitle,
            content: content.trim(),
            contentFormat: 'MARKDOWN',
            orderIndex: documents.length,
          },
        })
        setTitle('')
        setContent('')
        setSelectedResourceId(`doc-${newDoc.id}`)
        toast.success('Doküman başarıyla oluşturuldu.')
      } else {
        const finalUrl = uploadedFileUrl || linkUrl.trim()
        if (!finalUrl) {
          toast.error('Lütfen bir bağlantı adresi girin veya dosya yükleyin.')
          setIsAdding(false)
          return
        }

        const newLink = await addLinkMutation.mutateAsync({
          projectId: project.id,
          request: {
            title: finalTitle,
            url: finalUrl,
            type: (uploadedFileUrl ? 'REFERENCE' : 'REPO') as LinkType,
            notes: linkNotes.trim() || undefined,
            orderIndex: links.length,
          },
        })
        setTitle('')
        setLinkUrl('')
        setLinkNotes('')
        setUploadedFileUrl(null)
        setUploadedFileName(null)
        setSelectedResourceId(`link-${newLink.id}`)
        toast.success('Bağlantı/Dosya başarıyla eklendi.')
      }
    } catch {
      toast.error('Kaynak eklenirken bir sorun oluştu.')
    } finally {
      setIsAdding(false)
    }
  }

  // Delete Handler
  const handleDeleteResource = async (resource: any) => {
    const confirmed = window.confirm(`"${getCleanTitle(resource.title)}" kaynağını silmek istediğinize emin misiniz?`)
    if (!confirmed) return

    try {
      if (resource.resourceType === 'document') {
        await deleteDocMutation.mutateAsync(resource.id)
        toast.success('Doküman silindi.')
      } else {
        await deleteLinkMutation.mutateAsync(resource.id)
        toast.success('Bağlantı/Dosya silindi.')
      }
      if (selectedResourceId === resource.uid) {
        setSelectedResourceId(null)
      }
    } catch {
      toast.error('Silme işlemi başarısız oldu.')
    }
  }

  // Tasks related to currently selected document
  const documentTasks = useMemo(() => {
    if (!selectedResource) return []
    return tasks.filter((t) => t.title.startsWith(`[DOC_REF:${selectedResource.id}]`))
  }, [tasks, selectedResource])

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const handleAddDocTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim() || !selectedResource) return

    const taskTitleWithRef = `[DOC_REF:${selectedResource.id}] ${newTaskTitle.trim()}`
    try {
      await createTaskMutation.mutateAsync({
        title: taskTitleWithRef,
        status: 'TODO',
        kind: 'PROJECT',
        planningBucket: 'UNSCHEDULED',
        projectId: project.id,
        phaseId: selectedResource.phaseId || undefined,
      })
      setNewTaskTitle('')
      toast.success('Görev dökümana bağlandı ve oluşturuldu.')
    } catch {
      toast.error('Görev oluşturulamadı.')
    }
  }

  // Tonal badge classes mapping for document types
  const getDocTypeBadgeClass = (type: DocumentType) => {
    switch (type) {
      case 'DB_SCHEMA':
        return 'bg-blue-100/60 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/20'
      case 'REFACTOR_PLAN':
        return 'bg-purple-100/60 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/20'
      case 'FUTURE_FEATURES':
        return 'bg-amber-100/60 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/20'
      case 'TECH_DOC':
        return 'bg-emerald-100/60 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/20'
      default:
        return 'bg-slate-100/70 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border border-slate-200/30'
    }
  };

  const getDocTypeLabel = (type: DocumentType) => {
    switch (type) {
      case 'DB_SCHEMA': return 'DB Schema'
      case 'REFACTOR_PLAN': return 'Refactor Plan'
      case 'FUTURE_FEATURES': return 'Gelecek Özellik'
      case 'TECH_DOC': return 'Tech Doc'
      default: return 'Genel Not'
    }
  }

  // Update resource's phase context
  const handleUpdateResourceContext = async (phaseId: number | 'none', subPhaseId: number | 'none') => {
    if (!selectedResource) return

    let prefix = ''
    if (subPhaseId !== 'none') {
      prefix = `[SUBPHASE_REF:${subPhaseId}] `
    } else if (phaseId !== 'none') {
      prefix = `[PHASE_REF:${phaseId}] `
    }

    const rawClean = selectedResource.title.replace(/\[(PHASE_REF|SUBPHASE_REF):\d+\]\s*/g, '')
    const finalTitle = prefix + rawClean

    try {
      if (selectedResource.resourceType === 'document') {
        await updateDocMutation.mutateAsync({
          documentId: selectedResource.id,
          request: {
            title: finalTitle,
            content: selectedResource.content || '',
            type: selectedResource.type,
            contentFormat: 'MARKDOWN',
          }
        })
      } else {
        // We cannot update links directly through useUpdateLink as it's not exported,
        // so we drop and warn or notify if link update is supported.
        toast.info('Bağlantıların faz bağlamını güncellemek için lütfen yeniden oluşturun.')
        return
      }
      toast.success('Kaynak bağlamı güncellendi.')
    } catch {
      toast.error('Bağlam güncellenemedi.')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ── BİLEŞEN A: MASTER ADDITION FORM (Glassmorphic) ────────────────── */}
      <section className="bg-white/70 dark:bg-black/30 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-sm font-black text-slate-950 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-cyan-500 animate-pulse" />
            Master Resource Vault Girişi
          </h3>

          {/* Form Mode Toggle */}
          <div className="flex bg-slate-100 dark:bg-zinc-900/60 p-1 rounded-xl border border-slate-200/50 dark:border-zinc-800 max-w-fit">
            <button
              type="button"
              onClick={() => { setFormMode('document'); setUploadedFileUrl(null); setUploadedFileName(null); }}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                formMode === 'document'
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-white/5'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              Yazılı Doküman
            </button>
            <button
              type="button"
              onClick={() => { setFormMode('link'); setUploadedFileUrl(null); setUploadedFileName(null); }}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                formMode === 'link'
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-white/5'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              Dosya & Link Hub
            </button>
          </div>
        </div>

        <form onSubmit={handleCreateResource} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Title / Name Input */}
            <div className={cn("grid grid-cols-1 gap-4", formMode === 'document' ? 'md:col-span-8' : 'md:col-span-12')}>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Kaynak Adı / Başlık
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={formMode === 'document' ? "Örn: DB İlişkileri Taslak Planı" : "Örn: Docker Compose Kurulum Dosyası"}
                  className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all font-semibold"
                  required
                />
              </div>
            </div>

            {/* Document Type Dropdown (Only for Documents) */}
            {formMode === 'document' && (
              <div className="md:col-span-4">
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Doküman Türü
                </label>
                <DocumentsSelector
                  value={docType}
                  onChange={(val) => setDocType(val)}
                />
              </div>
            )}
          </div>

          {/* Context Mapping Row (Phase / SubPhase Selectors) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Phase Selector */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                İlişkili Proje Fazı
                {currentPhaseId && <Lock className="h-3 w-3 text-slate-400" />}
              </label>
              <Select
                value={selectedPhaseId}
                onChange={(val) => {
                  setSelectedPhaseId(val)
                  setSelectedSubPhaseId('none')
                }}
                options={phaseOptions}
                disabled={!!currentPhaseId || !!currentSubPhaseId}
              />
            </div>

            {/* SubPhase Selector */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                İlişkili Alt Faz
                {currentSubPhaseId && <Lock className="h-3 w-3 text-slate-400" />}
              </label>
              <Select
                value={selectedSubPhaseId}
                onChange={(val) => setSelectedSubPhaseId(val)}
                options={subPhaseOptions}
                disabled={!!currentSubPhaseId || selectedPhaseId === 'none'}
                placeholder={selectedPhaseId === 'none' ? 'Önce Faz Seçin' : 'Alt Faza Bağlı Olmayan'}
              />
            </div>

          </div>

          {/* Form Mode Specific Fields */}
          {formMode === 'document' ? (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Markdown Doküman İçeriği
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="# Doküman İçeriği&#10;&#10;İçeriğinizi markdown formatında yazabilirsiniz..."
                className="w-full min-h-[140px] bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-slate-100 text-xs font-mono leading-relaxed focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all resize-y"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Link input & notes */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                    Harici Bağlantı Adresi (URL)
                  </label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    disabled={!!uploadedFileUrl}
                    placeholder={uploadedFileUrl ? "Dosya yüklendi, URL otomatik dolduruldu" : "Örn: https://github.com/..."}
                    className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all font-semibold disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                    Açıklama / Notlar (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={linkNotes}
                    onChange={(e) => setLinkNotes(e.target.value)}
                    placeholder="Bu kaynak hakkında kısa bir not girin..."
                    className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Right Column: Premium Dropzone */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Dosya Yükle (PDF, Görsel, veya Genel)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] bg-white/20 dark:bg-black/10 backdrop-blur-sm",
                    isDragOver
                      ? "border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
                      : "border-slate-300 dark:border-slate-800 hover:border-cyan-500/40"
                  )}
                >
                  <input
                    type="file"
                    id="vault-file-upload"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="vault-file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    {uploadFileMutation.isPending ? (
                      <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
                    ) : (
                      <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500 animate-bounce" />
                    )}
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {uploadedFileName ? `Seçilen: ${uploadedFileName}` : "Dosyayı buraya sürükleyin veya tıklayarak seçin"}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-450 font-medium">
                      PDF, PNG, JPG vb. (Maks 10MB)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isAdding || !title.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-black shadow-md shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {formMode === 'document' ? 'Doküman Kaydet' : 'Kaynak Ekle'}
            </button>
          </div>
        </form>
      </section>

      {/* ── BİLEŞEN B: SPLIT-VIEW DÜZEN ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sol Liste Paneli (col-span-5) */}
        <section className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider px-1">
            Vault Kaynakları ({allResources.length})
          </h3>

          <div className="space-y-3 max-h-[700px] overflow-y-auto scrollbar-thin pr-1">
            {allResources.map((res) => {
              const isSelected = selectedResourceId === res.uid
              const badgeText = getRelationBadge(res)
              
              return (
                <div
                  key={res.uid}
                  onClick={() => setSelectedResourceId(res.uid)}
                  className={cn(
                    "cursor-pointer transition-all duration-300 border rounded-2xl p-4 flex items-start justify-between gap-3 relative group",
                    isSelected
                      ? "bg-white/90 dark:bg-slate-900/60 border-cyan-500/60 shadow-md shadow-cyan-500/5 translate-x-1"
                      : "bg-white/50 dark:bg-black/30 border-slate-200 dark:border-slate-800/80 hover:bg-white/70 dark:hover:bg-zinc-900/40"
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200/50 dark:border-slate-800 shrink-0">
                      {res.resourceType === 'document' ? (
                        <FileText className="h-4 w-4 text-cyan-500" />
                      ) : res.resourceType === 'file' ? (
                        <Upload className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Globe className="h-4 w-4 text-purple-500" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <h4 className="text-xs font-bold text-slate-950 dark:text-slate-100 leading-tight truncate pr-4">
                        {getCleanTitle(res.title)}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {res.resourceType === 'document' && (
                          <span className={cn("px-1.5 py-0.2 rounded text-[9px] font-bold border", getDocTypeBadgeClass(res.type))}>
                            {getDocTypeLabel(res.type)}
                          </span>
                        )}
                        {res.resourceType === 'file' && (
                          <span className="bg-emerald-100/60 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/20 px-1.5 py-0.2 rounded text-[9px] font-bold">
                            Dosya
                          </span>
                        )}
                        {res.resourceType === 'link' && (
                          <span className="bg-purple-100/60 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/20 px-1.5 py-0.2 rounded text-[9px] font-bold">
                            Bağlantı
                          </span>
                        )}
                        {badgeText && (
                          <span className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wide">
                            {badgeText}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center shrink-0">
                    <SketchButton
                      tone="destructive"
                      onClick={(e) => { e.stopPropagation(); handleDeleteResource(res); }}
                      className="h-7 w-7 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Kaynağı Sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </SketchButton>
                  </div>
                </div>
              )
            })}

            {allResources.length === 0 && (
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                <FileText className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                <span className="text-xs text-zinc-400 italic">
                  Henüz bir kaynak yüklenmemiş.
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Sağ Detay ve Önizleme Paneli (col-span-7) */}
        <section className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider px-1">
            Detay & Önizleme
          </h3>

          {selectedResource ? (
            <div className="bg-white/70 dark:bg-black/30 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-6 animate-in fade-in duration-300">
              
              {/* Header Title & Badge */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200/50 dark:border-slate-800/40">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {selectedResource.resourceType === 'document' && (
                      <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border", getDocTypeBadgeClass(selectedResource.type))}>
                        {getDocTypeLabel(selectedResource.type)}
                      </span>
                    )}
                    {selectedResource.resourceType === 'file' && (
                      <span className="bg-emerald-100/60 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/20 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        Yüklenmiş Dosya
                      </span>
                    )}
                    {selectedResource.resourceType === 'link' && (
                      <span className="bg-purple-100/60 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/20 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        Harici Bağlantı
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-slate-950 dark:text-slate-100">
                    {getCleanTitle(selectedResource.title)}
                  </h4>
                </div>

                <div className="flex items-center gap-1">
                  {selectedResourceUrl && (
                    <a
                      href={selectedResourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                      title="Dış Bağlantıyı Aç"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Katman Entegrasyon Seçici */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-zinc-900/40 p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faz İlişkisi</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200 block">
                    {selectedResource.phaseId === null ? 'Global' : `Faz ${phases.findIndex(p => p.id === selectedResource.phaseId) !== -1 ? phases.findIndex(p => p.id === selectedResource.phaseId) : selectedResource.phaseId}`}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alt Faz İlişkisi</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200 block">
                    {selectedResource.subPhaseId === null ? 'Yok' : decodedSubPhases.find(sp => sp.id === selectedResource.subPhaseId)?.label || 'Bilinmeyen'}
                  </span>
                </div>
              </div>

              {/* Inline Media Player (Preview Area) */}
              <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-slate-900 rounded-2xl p-4 overflow-hidden min-h-[160px] flex flex-col justify-center">
                {selectedResource.resourceType === 'document' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-300 font-medium text-xs whitespace-pre-wrap leading-relaxed">
                    {selectedResource.content || <span className="italic text-zinc-400">İçerik boş...</span>}
                  </div>
                ) : selectedResource.resourceType === 'file' ? (
                  <div className="space-y-3 w-full text-center py-4">
                    {selectedResourceUrl?.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                      <img
                        src={selectedResourceUrl}
                        alt={selectedResource.title}
                        className="max-h-80 mx-auto rounded-xl border border-slate-200/50 shadow-md object-contain"
                      />
                    ) : selectedResourceUrl?.match(/\.pdf$/i) ? (
                      <iframe
                        src={`${selectedResourceUrl}#toolbar=0`}
                        title={selectedResource.title}
                        className="w-full h-96 rounded-xl border border-slate-200 dark:border-slate-900"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Upload className="h-10 w-10 text-emerald-500" />
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                          Önizleme desteklenmiyor. Dosyayı indirip görüntüleyebilirsiniz.
                        </span>
                        <a
                          href={selectedResourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 inline-flex items-center gap-1.5"
                        >
                          <Upload className="h-4 w-4" />
                          Dosyayı İndir
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 flex flex-col items-center gap-3">
                    <Globe className="h-10 w-10 text-purple-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                      Harici web veya Github deposu bağlantısı.
                    </span>
                    {selectedResource.notes && (
                      <p className="text-[10px] text-slate-500 max-w-sm italic">
                        Not: {selectedResource.notes}
                      </p>
                    )}
                    <a
                      href={selectedResourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 inline-flex items-center gap-1.5"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Bağlantıya Git
                    </a>
                  </div>
                )}
              </div>

              {/* Döküman İçi Görev Komuta Merkezi */}
              <div className="border-t border-slate-200/50 dark:border-slate-800/40 pt-4 space-y-4">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                  Bağlı Görev Komuta Merkezi
                </span>

                <form onSubmit={handleAddDocTask} className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Bu dokümanla ilgili yeni bir görev başlığı girin..."
                    className="flex-1 bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-black shadow-md shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                  >
                    Ekle
                  </button>
                </form>

                {/* List of related tasks */}
                <div className="space-y-2">
                  {documentTasks.map((t) => {
                    const isDone = t.status === 'DONE'
                    const cleanTask = t.title.replace(/\[DOC_REF:\d+\]\s*/g, '')
                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-3 bg-white/30 dark:bg-zinc-900/30 border border-slate-200/50 dark:border-slate-800 p-2.5 rounded-xl text-xs font-bold"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleTaskMutation.mutate(t.id)}
                            className={cn(
                              "h-4 w-4 rounded border flex items-center justify-center cursor-pointer transition-colors",
                              isDone
                                ? "bg-cyan-500 border-cyan-500 text-white"
                                : "border-slate-300 dark:border-slate-700 hover:border-cyan-500"
                            )}
                          >
                            {isDone && <Check className="h-3 w-3" />}
                          </button>
                          <span className={cn(isDone && "line-through text-slate-400 dark:text-slate-500")}>
                            {cleanTask}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteTaskMutation.mutate(t.id)}
                          className="text-red-500 hover:text-red-600 p-1 cursor-pointer transition-colors"
                          title="Görevi Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })}

                  {documentTasks.length === 0 && (
                    <span className="text-[10px] text-zinc-400 italic block text-center py-2">
                      Bu dokümana bağlanmış herhangi bir görev bulunmuyor.
                    </span>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-20 text-center flex flex-col items-center justify-center bg-white/30 dark:bg-black/10 backdrop-blur-sm min-h-[400px]">
              <FileText className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4 animate-bounce" />
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">Önizleme Aktif Değil</h4>
              <span className="text-[10px] text-zinc-400 italic">
                Lütfen sol listeden detayını veya önizlemesini görüntülemek istediğiniz bir kaynak seçin.
              </span>
            </div>
          )}
        </section>

      </div>

    </div>
  )
}
