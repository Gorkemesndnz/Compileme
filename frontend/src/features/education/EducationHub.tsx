import React from 'react'
import {
  BookOpen,
  CheckCircle2,
  FileUp,
  Layers3,
  Link2,
  PlayCircle,
  Plus,
  UploadCloud,
  Sparkles,
  Code2,
  Globe,
  Clock,
  Calendar,
  X,
  FileText,
  Info,
  FolderPlus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageHeader } from '@/components/PageHeader'
import { useEducations, useCreateEducation, type EducationResourceType } from '@/api/education'
import { apiClient } from '@/api/client'
import { AddEducationCard, EducationCard } from './EducationCard'
import { EducationType, FolderData, EducationResource } from './types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { DateTimePicker } from '../dashboard/DateTimePicker'
import { Button as MovingBorderButton } from '@/components/ui/moving-border'

const categoryOptions: EducationType[] = ['PROGRAMMING', 'LANGUAGE', 'FRONTEND', 'MOBILE', 'OTHER']

const EDUCATION_TYPE_LABELS: Record<string, string> = {
  PROGRAMMING: 'Yazılım / Programlama',
  LANGUAGE: 'Yabancı Dil',
  FRONTEND: 'Frontend Geliştirme',
  MOBILE: 'Mobil Geliştirme',
  OTHER: 'Diğer Konular',
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  PROGRAMMING: <Code2 className="h-4 w-4" />,
  LANGUAGE: <Globe className="h-4 w-4" />,
  FRONTEND: <Layers3 className="h-4 w-4" />,
  MOBILE: <Code2 className="h-4 w-4" />,
  OTHER: <Sparkles className="h-4 w-4" />,
}

const getResourceTypeForFileName = (fileName: string): EducationResourceType => {
  const normalized = fileName.toLowerCase()
  if (normalized.endsWith('.pdf')) return 'PDF'
  if (normalized.endsWith('.ppt') || normalized.endsWith('.pptx')) return 'SLIDE'
  return 'FILE'
}

const uploadFileDirect = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post('/files', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data as { id: number; downloadUrl?: string }
}

const createResourceDirect = async (
  educationId: number,
  request: { name: string; type: EducationResourceType; urlOrPath: string; orderIndex?: number }
) => {
  const response = await apiClient.post(`/educations/${educationId}/resources`, request)
  return response.data as { id: number }
}

const EmptyEducationOnboarding: React.FC<{ onCreated: () => void }> = ({ onCreated }) => {
  const [category, setCategory] = React.useState<EducationType>('PROGRAMMING')
  const [customCategory, setCustomCategory] = React.useState('')
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const [source, setSource] = React.useState('')
  const [sourceUrl, setSourceUrl] = React.useState('')
  const [createFolder, setCreateFolder] = React.useState(true)
  const [folderName, setFolderName] = React.useState('Ders Kaynakları')
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([])
  const [dragActive, setDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const createMutation = useCreateEducation()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesArray = Array.from(e.dataTransfer.files)
      setUploadedFiles(prev => [...prev, ...filesArray])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const filesArray = Array.from(e.target.files)
      setUploadedFiles(prev => [...prev, ...filesArray])
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreate = () => {
    if (!title.trim()) {
      toast.error('Lütfen bir eğitim başlığı girin.')
      return
    }

    if (category === 'OTHER' && !customCategory.trim()) {
      toast.error('Lütfen özel kategori adını girin.')
      return
    }

    createMutation.mutate({
      title: title.trim(),
      source: source.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      type: category,
      status: 'ACTIVE',
      customCategory: category === 'OTHER' ? customCategory.trim() : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      description: description.trim() || undefined,
    }, {
      onSuccess: async (newEdu) => {
        const foldersList: FolderData[] = []
        const folderResourceIds: number[] = []

        if (createFolder) {
          const folderId = `folder-${Date.now()}`
          foldersList.push({
            id: folderId,
            name: folderName.trim() || 'Kaynaklar',
            resourceIds: []
          })

          for (const [index, file] of uploadedFiles.entries()) {
            const uploaded = await uploadFileDirect(file)
            const resource = await createResourceDirect(newEdu.id, {
              name: file.name,
              type: getResourceTypeForFileName(file.name),
              urlOrPath: uploaded.downloadUrl || `/api/files/${uploaded.id}`,
              orderIndex: index,
            })
            folderResourceIds.push(resource.id)
          }

          if (sourceUrl.trim()) {
            const linkRes = await createResourceDirect(newEdu.id, {
              name: source.trim() || 'Kaynak Bağlantısı',
              type: 'LINK',
              urlOrPath: sourceUrl.trim(),
              orderIndex: uploadedFiles.length,
            })
            folderResourceIds.push(linkRes.id)
          }

          foldersList[0].resourceIds = folderResourceIds
        }

        localStorage.setItem(`folders-${newEdu.id}`, JSON.stringify(foldersList))

        toast.success('Eğitim odası başarıyla kuruldu!')
        onCreated()
      },
      onError: () => {
        toast.error('Eğitim odası oluşturulurken sunucu hatası oluştu.')
      }
    })
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-5xl rounded-3xl border border-slate-200/60 bg-white/50 p-8 shadow-2xl backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/20 text-slate-800 dark:text-zinc-200"
    >
      <div className="flex items-start gap-4 border-b border-slate-100 dark:border-zinc-800/60 pb-5">
        <div className="grid h-12 w-12 shrink-0 place-content-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white font-sans">İlk Çalışma ve Eğitim Odanı Kur</h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-1">
            Eğitim adını, kategorisini, başlangıç ve bitiş tarihlerini belirleyerek eğitim komuta merkezine ilk girişi yapın.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-12">
        {/* Sol Kolon */}
        <div className="md:col-span-7 space-y-5">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Eğitim Kategorisi *</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {categoryOptions.map((type) => {
                const isSelected = category === type
                if (isSelected) {
                  return (
                    <MovingBorderButton
                      key={type}
                      type="button"
                      borderRadius="1rem"
                      duration={2500}
                      onClick={() => setCategory(type)}
                      containerClassName="w-full h-[76px] cursor-pointer select-none"
                      className="flex flex-col items-center justify-center gap-1.5 w-full h-full font-bold text-cyan-600 dark:text-cyan-400 border-cyan-500/40 dark:border-cyan-400/30"
                    >
                      {CATEGORY_ICONS[type]}
                      <span className="text-[10px] text-center leading-none">{EDUCATION_TYPE_LABELS[type]}</span>
                    </MovingBorderButton>
                  )
                }
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCategory(type)}
                    className="flex flex-col items-center justify-center gap-1.5 w-full h-[76px] rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/30 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:border-slate-350 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer select-none"
                  >
                    {CATEGORY_ICONS[type]}
                    <span className="text-[10px] text-center leading-none">{EDUCATION_TYPE_LABELS[type]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <AnimatePresence>
            {category === 'OTHER' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5 overflow-hidden"
              >
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Özel Kategori Adı *</span>
                <Input
                  placeholder="Örn: Mobil Uygulama, Yapay Zeka..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="font-semibold bg-white/80 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Eğitim Adı *</span>
            <Input
              placeholder="Örn: Java Spring Boot"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-semibold bg-white/80 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>

          {/* Tarih Seçimi */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-cyan-500" /> Başlangıç Tarihi
              </span>
              <div className="relative">
                <DateTimePicker
                  date={startDate}
                  onDateChange={setStartDate}
                  showTime={false}
                  align="left"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-cyan-500" /> Bitiş Tarihi
              </span>
              <div className="relative">
                <DateTimePicker
                  date={endDate}
                  onDateChange={setEndDate}
                  showTime={false}
                  align="right"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Eğitim Açıklaması / Planı</span>
            <Textarea
              placeholder="Öğrenmek istediğiniz detayları buraya not edin..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] font-medium bg-white/80 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Sağ Kolon */}
        <div className="md:col-span-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Kaynak Platform</span>
                <Input
                  placeholder="Udemy, YouTube..."
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="font-semibold bg-white/80 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Platform URL</span>
                <Input
                  placeholder="https://..."
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="font-semibold bg-white/80 dark:bg-zinc-955/40 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                />
              </div>
            </div>

            {/* Dosya / Klasör Oluşturma */}
            <div className="space-y-4 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 p-4 bg-slate-50/50 dark:bg-zinc-900/10">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createFolder}
                  onChange={(e) => setCreateFolder(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-350 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <FolderPlus className="h-4 w-4 text-cyan-500" /> Kaynaklar için Klasör Oluştur
                </span>
              </label>

              <AnimatePresence>
                {createFolder && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden space-y-3.5"
                  >
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Klasör Adı</span>
                      <Input
                        placeholder="Örn: Ders Kaynakları ve Notlar"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        className="font-semibold bg-white/80 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Dosya Yükle</span>
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 bg-white/60 dark:bg-zinc-900/30 text-center cursor-pointer select-none"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          multiple
                          onChange={handleFileSelect}
                        />
                        <UploadCloud className="h-6 w-6 text-cyan-500 animate-pulse mb-1.5" />
                        <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-400">Dosyaları Sürükle Bırak veya Tıkla</span>
                        <span className="text-[8px] text-slate-500 dark:text-zinc-500 mt-0.5">PDF, Word, Slayt, Görsel vb.</span>
                      </div>

                      {uploadedFiles.length > 0 && (
                        <div className="mt-2 max-h-[100px] overflow-y-auto space-y-1.5 pr-1">
                          {uploadedFiles.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 rounded-xl bg-white/80 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50 text-[10px] font-bold"
                            >
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                <FileText className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                                <span className="truncate max-w-[170px] text-slate-700 dark:text-zinc-300">{file.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeFile(idx)
                                }}
                                className="p-0.5 text-slate-400 hover:text-red-500 rounded-md"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={handleCreate}
              className="px-5 py-2.5 rounded-xl border border-black bg-white text-black text-xs font-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none cursor-pointer select-none"
            >
              {createMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

export const EducationHub: React.FC = () => {
  const { data: rawEducations = [], refetch } = useEducations()
  const createMutation = useCreateEducation()

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [modalCategory, setModalCategory] = React.useState<EducationType>('PROGRAMMING')
  const [modalCustomCategory, setModalCustomCategory] = React.useState('')
  const [newTitle, setNewTitle] = React.useState('')
  const [newSource, setNewSource] = React.useState('')
  const [newSourceUrl, setNewSourceUrl] = React.useState('')
  const [newDescription, setNewDescription] = React.useState('')
  const [newStartDate, setNewStartDate] = React.useState('')
  const [newEndDate, setNewEndDate] = React.useState('')
  const [modalCreateFolder, setModalCreateFolder] = React.useState(true)
  const [modalFolderName, setModalFolderName] = React.useState('Ders Kaynakları')
  const [modalUploadedFiles, setModalUploadedFiles] = React.useState<File[]>([])
  const [modalDragActive, setModalDragActive] = React.useState(false)
  const modalFileInputRef = React.useRef<HTMLInputElement>(null)

  const educations = React.useMemo(() => {
    return rawEducations.map((edu: any) => ({
      id: edu.id,
      title: edu.title,
      source: edu.source || '',
      description: edu.description || '',
      durationHours: edu.durationHours || null,
      type: edu.type,
      progress_percent: edu.progressPercent ?? 0,
      status: edu.status || 'ACTIVE',
      next_study_date: edu.nextStudyDate || null,
      custom_category: edu.customCategory || null,
      start_date: edu.startDate || null,
      end_date: edu.endDate || null,
    }))
  }, [rawEducations])

  const activeCount = React.useMemo(
    () => educations.filter((education) => education.status === 'ACTIVE').length,
    [educations]
  )

  const averageProgress = React.useMemo(() => {
    if (educations.length === 0) {
      return 0
    }
    return Math.round(educations.reduce((sum, item) => sum + item.progress_percent, 0) / educations.length)
  }, [educations])

  const handleOpenCreateModal = (category: EducationType) => {
    setModalCategory(category)
    setModalCustomCategory('')
    setNewTitle('')
    setNewSource('')
    setNewSourceUrl('')
    setNewDescription('')
    setNewStartDate('')
    setNewEndDate('')
    setModalCreateFolder(true)
    setModalFolderName('Ders Kaynakları')
    setModalUploadedFiles([])
    setIsCreateModalOpen(true)
  }

  const handleModalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setModalUploadedFiles(Array.from(e.target.files))
    }
  }

  const handleModalCreate = () => {
    if (!newTitle.trim()) {
      toast.error('Lütfen bir eğitim başlığı girin.')
      return
    }

    if (modalCategory === 'OTHER' && !modalCustomCategory.trim()) {
      toast.error('Lütfen özel kategori adını girin.')
      return
    }

    createMutation.mutate({
      title: newTitle.trim(),
      source: newSource.trim() || undefined,
      sourceUrl: newSourceUrl.trim() || undefined,
      type: modalCategory,
      status: 'ACTIVE',
      customCategory: modalCategory === 'OTHER' ? modalCustomCategory.trim() : undefined,
      startDate: newStartDate || undefined,
      endDate: newEndDate || undefined,
      description: newDescription.trim() || undefined,
    }, {
      onSuccess: async (newEdu) => {
        const foldersList: FolderData[] = []
        const folderResourceIds: number[] = []

        if (modalCreateFolder) {
          const folderId = `folder-${Date.now()}`
          foldersList.push({
            id: folderId,
            name: modalFolderName.trim() || 'Kaynaklar',
            resourceIds: []
          })

          for (const [index, file] of modalUploadedFiles.entries()) {
            const uploaded = await uploadFileDirect(file)
            const resource = await createResourceDirect(newEdu.id, {
              name: file.name,
              type: getResourceTypeForFileName(file.name),
              urlOrPath: uploaded.downloadUrl || `/api/files/${uploaded.id}`,
              orderIndex: index,
            })
            folderResourceIds.push(resource.id)
          }

          if (newSourceUrl.trim()) {
            const linkRes = await createResourceDirect(newEdu.id, {
              name: newSource.trim() || 'Kaynak Bağlantısı',
              type: 'LINK',
              urlOrPath: newSourceUrl.trim(),
              orderIndex: modalUploadedFiles.length,
            })
            folderResourceIds.push(linkRes.id)
          }

          foldersList[0].resourceIds = folderResourceIds
        }

        localStorage.setItem(`folders-${newEdu.id}`, JSON.stringify(foldersList))

        toast.success('Eğitim odası başarıyla oluşturuldu!')
        setIsCreateModalOpen(false)
        refetch()
      },
      onError: () => {
        toast.error('Eğitim odası oluşturulurken sunucu hatası oluştu.')
      }
    })
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Eğitim Komuta Merkezi"
        subtitle="Kaynaklar, pratikler ve modüler çalışma odaları için ana yönetim üssü."
      />

      {educations.length === 0 ? (
        <EmptyEducationOnboarding onCreated={refetch} />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Aktif Eğitim', value: activeCount, icon: PlayCircle },
              { label: 'Toplam Kategori', value: categoryOptions.length, icon: Layers3 },
              { label: 'Ortalama İlerleme', value: `${averageProgress}%`, icon: CheckCircle2 },
            ].map((metric) => {
              const Icon = metric.icon
              return (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-slate-200 bg-white/70 p-5 text-slate-950 shadow-md backdrop-blur-2xl dark:border-zinc-800/50 dark:bg-zinc-900/20 dark:text-zinc-100 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_50px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">{metric.label}</span>
                    <Icon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{metric.value}</div>
                </div>
              )
            })}
          </section>

          <section className="space-y-10">
            {categoryOptions.map((type) => {
              const groupEducations = educations.filter((e) => e.type === type)
              const groupLabel = EDUCATION_TYPE_LABELS[type] || type
              return (
                <div key={type} className="space-y-5">
                  <div className="flex items-center gap-2 text-slate-950 dark:text-slate-100 font-sans">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                      {CATEGORY_ICONS[type]}
                    </div>
                    <h2 className="text-lg font-black">{groupLabel}</h2>
                    <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-0.5 text-[10px] font-black text-muted-foreground dark:border-zinc-800 dark:bg-zinc-900/40">
                      {groupEducations.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
                    <AddEducationCard
                      categoryLabel={groupLabel}
                      onClick={() => handleOpenCreateModal(type)}
                    />
                    {groupEducations.map((education) => (
                      <EducationCard key={education.id} education={education} />
                    ))}
                  </div>
                </div>
              )
            })}
          </section>
        </>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                {CATEGORY_ICONS[modalCategory]}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white font-sans">Yeni Çalışma Odası Oluştur</h3>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
                  Kategori: {EDUCATION_TYPE_LABELS[modalCategory] || modalCategory}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Eğitim Adı *</span>
                  <Input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Örn: Java Spring Boot"
                    className="font-semibold bg-white/80 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                  />
                </div>

                {modalCategory === 'OTHER' && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Özel Kategori Adı *</span>
                    <Input
                      type="text"
                      value={modalCustomCategory}
                      onChange={(e) => setModalCustomCategory(e.target.value)}
                      placeholder="Örn: Mobil, Tasarım..."
                      className="font-semibold bg-white/80 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    />
                  </div>
                )}

                {/* Tarih Seçimi */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Başlangıç Tarihi</span>
                    <div className="relative">
                      <DateTimePicker
                        date={newStartDate}
                        onDateChange={setNewStartDate}
                        showTime={false}
                        align="left"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Bitiş Tarihi</span>
                    <div className="relative">
                      <DateTimePicker
                        date={newEndDate}
                        onDateChange={setNewEndDate}
                        showTime={false}
                        align="right"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Plan / Açıklama</span>
                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Eğitim hedefleri..."
                    className="min-h-[85px] font-medium bg-white/80 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Kaynak</span>
                    <Input
                      type="text"
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      placeholder="Udemy, Kitap..."
                      className="font-semibold bg-white/80 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Kaynak URL</span>
                    <Input
                      type="text"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      placeholder="https://..."
                      className="font-semibold bg-white/80 dark:bg-zinc-955/40 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    />
                  </div>
                </div>

                {/* Dosya / Klasör Oluşturma */}
                <div className="space-y-3 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 p-3.5 bg-slate-50/50 dark:bg-zinc-900/10">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalCreateFolder}
                      onChange={(e) => setModalCreateFolder(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-350 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Kaynaklar için Klasör Oluştur
                    </span>
                  </label>

                  {modalCreateFolder && (
                    <div className="space-y-2 text-left animate-fadeIn">
                      <Input
                        placeholder="Klasör Adı (Örn: Dökümanlar)"
                        value={modalFolderName}
                        onChange={(e) => setModalFolderName(e.target.value)}
                        className="h-9 text-xs font-semibold bg-white/80 dark:bg-zinc-955/40 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />

                      <div
                        onClick={() => modalFileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white/60 dark:bg-zinc-900/30 cursor-pointer select-none text-center"
                      >
                        <input
                          type="file"
                          ref={modalFileInputRef}
                          className="hidden"
                          multiple
                          onChange={handleModalFileSelect}
                        />
                        <UploadCloud className="h-4 w-4 text-cyan-500 mb-1" />
                        <span className="text-[9px] font-bold text-slate-600 dark:text-zinc-400">Döküman Yükle (Dosyalar)</span>
                        {modalUploadedFiles.length > 0 && (
                          <span className="text-[8px] text-cyan-500 font-extrabold mt-0.5 truncate max-w-[180px]">
                            {modalUploadedFiles.length} dosya seçildi
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5 border-t border-slate-100 dark:border-zinc-800/60 pt-4 font-sans">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80 transition duration-200 cursor-pointer select-none"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={createMutation.isPending}
                onClick={handleModalCreate}
                className="px-5 py-2.5 rounded-xl border border-black bg-white text-black text-xs font-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none cursor-pointer select-none"
              >
                {createMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
