import React, { useState } from 'react'
import { ArrowDown, ArrowUp, CheckCircle2, Circle, Clock, FileText, Folder, Link as LinkIcon, Pencil, Plus, Sparkles, Trash2, Calendar, GripVertical, ExternalLink, Tag, FileCode, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DateTimePicker } from '../../dashboard/DateTimePicker'
import { Education, EducationPractice, EducationResource, FolderData } from '../types'
import { useCreateEducationResource, useDeleteEducationResource, useReorderEducationResources, type EducationResourceType } from '@/api/education'
import { toast } from 'sonner'

interface EducationTaskContext {
  folderId?: string
  resourceId?: number
}

interface OverviewTabProps {
  education: Education | undefined
  resources: EducationResource[]
  folders: FolderData[]
  practices: EducationPractice[]
  localTasks: any[]
  taskTitle: string
  setTaskTitle: (val: string) => void
  taskFolderId: string
  setTaskFolderId: (val: string) => void
  taskResourceId: number | undefined
  setTaskResourceId: (val: number | undefined) => void
  completedResources: Record<number, boolean>
  toggleResourceCompleted: (resourceId: number) => void
  moveResourceWithinFolder: (folderId: string, resourceId: number, direction: 'up' | 'down') => void
  taskContexts: Record<string, EducationTaskContext>
  getTaskContextLabel: (context?: EducationTaskContext) => string
  taskDate: string
  setTaskDate: (val: string) => void
  taskTime: string
  setTaskTime: (val: string) => void
  handleAddTask: (e: React.FormEvent) => void
  handleToggleLocalTask: (id: number | string) => void
  editingTaskId: number | string | null
  setEditingTaskId: (val: number | string | null) => void
  editingTaskTitle: string
  setEditingTaskTitle: (val: string) => void
  handleSaveLocalTaskEdit: (id: number | string) => void
  handleDeleteLocalTask: (id: number | string) => void
  educationId: number
}

const OverviewTabComponent: React.FC<OverviewTabProps> = ({
  education,
  resources,
  folders,
  practices,
  localTasks,
  taskTitle,
  setTaskTitle,
  taskFolderId,
  setTaskFolderId,
  taskResourceId,
  setTaskResourceId,
  completedResources,
  toggleResourceCompleted,
  moveResourceWithinFolder,
  taskContexts,
  getTaskContextLabel,
  taskDate,
  setTaskDate,
  taskTime,
  setTaskTime,
  handleAddTask,
  handleToggleLocalTask,
  editingTaskId,
  setEditingTaskId,
  editingTaskTitle,
  setEditingTaskTitle,
  handleSaveLocalTaskEdit,
  handleDeleteLocalTask,
  educationId,
}) => {
  const createResourceMutation = useCreateEducationResource(educationId)
  const deleteResourceMutation = useDeleteEducationResource(educationId)
  const reorderResourcesMutation = useReorderEducationResources(educationId)

  const [showAddStepForm, setShowAddStepForm] = useState(false)
  const [newStepName, setNewStepName] = useState('')
  const [newStepType, setNewStepType] = useState<EducationResourceType>('PDF')
  const [newStepUrl, setNewStepUrl] = useState('')
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [dragPosition, setDragPosition] = useState<'above' | 'below'>('above')

  const folderResourceIds = React.useMemo(() => new Set(folders.flatMap((folder) => folder.resourceIds)), [folders])
  const taskResourceOptions = React.useMemo(() => {
    if (!taskFolderId) return resources
    if (taskFolderId === 'uncategorized') {
      return resources.filter((resource) => !folderResourceIds.has(resource.id))
    }
    const folder = folders.find((item) => item.id === taskFolderId)
    if (!folder) return []
    return folder.resourceIds
      .map((resourceId) => resources.find((resource) => resource.id === resourceId))
      .filter((resource): resource is EducationResource => !!resource)
  }, [folderResourceIds, folders, resources, taskFolderId])

  const handleDoubleClickResource = (res: EducationResource) => {
    if (!res.url_or_path || res.url_or_path === '#') return
    let targetUrl = res.url_or_path
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && !targetUrl.startsWith('/api/')) {
      targetUrl = `/api/files/${targetUrl}`
    }
    window.open(targetUrl, '_blank')
  }

  const handleDropResource = (dropIndex: number) => {
    if (draggedIdx === null) return
    let targetIdx = dragPosition === 'below' ? dropIndex + 1 : dropIndex
    if (draggedIdx < targetIdx) targetIdx -= 1
    if (draggedIdx === targetIdx) {
      setDraggedIdx(null)
      setDragOverIdx(null)
      return
    }

    const updated = [...resources]
    const [moved] = updated.splice(draggedIdx, 1)
    updated.splice(targetIdx, 0, moved)

    const reorderPayload = updated.map((item, idx) => ({
      id: item.id,
      orderIndex: idx,
    }))

    setDraggedIdx(null)
    setDragOverIdx(null)

    reorderResourcesMutation.mutate(reorderPayload, {
      onSuccess: () => {
        toast.success('Yol haritası sırası güncellendi.')
      },
    })
  }

  const handleCreateStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStepName.trim()) {
      toast.error('Lütfen bir adım veya başlık adı girin.')
      return
    }

    createResourceMutation.mutate(
      {
        name: newStepName.trim(),
        type: newStepType,
        urlOrPath: newStepUrl.trim() || '#',
        orderIndex: resources.length,
      },
      {
        onSuccess: () => {
          toast.success('Yeni adım yol haritasına eklendi!')
          setNewStepName('')
          setNewStepUrl('')
          setShowAddStepForm(false)
        },
      }
    )
  }

  const handleDeleteResource = (e: React.MouseEvent, resId: number, name: string) => {
    e.stopPropagation()
    if (window.confirm(`"${name}" adımını yol haritasından kaldırmak istediğinize emin misiniz?`)) {
      deleteResourceMutation.mutate(resId, {
        onSuccess: () => toast.success('Adım yol haritasından kaldırıldı.'),
      })
    }
  }

  const getStepTypeIcon = (type: EducationResourceType) => {
    switch (type) {
      case 'PDF':
        return <FileText className="h-3.5 w-3.5 text-rose-500 shrink-0" />
      case 'SLIDE':
        return <FileCode className="h-3.5 w-3.5 text-amber-500 shrink-0" />
      case 'LINK':
        return <LinkIcon className="h-3.5 w-3.5 text-purple-500 shrink-0" />
      case 'FILE':
      default:
        return <Tag className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
    }
  }

  return (
    <div className="grid grid-cols-12 gap-6 h-full overflow-hidden">
      {/* Roadmap - Sol Blok */}
      <div className="col-span-12 lg:col-span-7 h-full flex flex-col min-h-[300px]">
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/60 backdrop-blur-xl h-full flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
              <span>Eğitim Yol Haritası (Roadmap)</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddStepForm(!showAddStepForm)}
              className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              {showAddStepForm ? 'Kapat' : 'Adım / Başlık Ekle'}
            </button>
          </div>

          {/* Inline Step Creation Form */}
          {showAddStepForm && (
            <form onSubmit={handleCreateStep} className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-black/30 border border-slate-200 dark:border-zinc-800 mb-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <Input
                  value={newStepName}
                  onChange={(e) => setNewStepName(e.target.value)}
                  placeholder="Örn: Bölüm 1: Spring Core veya Ödev #1..."
                  className="h-8 text-xs font-semibold flex-1"
                />
                <select
                  value={newStepType}
                  onChange={(e) => setNewStepType(e.target.value as EducationResourceType)}
                  className="h-8 px-2 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100"
                >
                  <option value="PDF">📄 PDF / Döküman</option>
                  <option value="SLIDE">📊 Slayt / Sunum</option>
                  <option value="LINK">🔗 Link / URL</option>
                  <option value="FILE">📝 Ödev / Pratik Görev</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newStepUrl}
                  onChange={(e) => setNewStepUrl(e.target.value)}
                  placeholder="URL veya Dosya Yolu (opsiyonel)..."
                  className="h-8 text-xs font-medium flex-1"
                />
                <Button type="submit" variant="primary" size="sm" className="h-8 text-xs font-bold px-3" disabled={createResourceMutation.isPending}>
                  Ekle
                </Button>
              </div>
            </form>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 pl-2 relative border-l-2 border-cyan-500/20 dark:border-cyan-500/30 ml-3 pt-1">
            {resources.length === 0 ? (
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 py-6 text-center">
                Henüz yol haritası adımı yok. "+ Adım / Başlık Ekle" butonunu kullanarak veya dosya yükleyerek oluşturun.
              </p>
            ) : (
              resources.map((res, index) => {
                const resPractices = practices.filter((p) => p.resource_id === res.id)
                const isCompleted = resPractices.length > 0 && resPractices.every((p) => p.completed)
                const isDragging = draggedIdx === index
                const isDragOverAbove = dragOverIdx === index && dragPosition === 'above' && draggedIdx !== index
                const isDragOverBelow = dragOverIdx === index && dragPosition === 'below' && draggedIdx !== index

                return (
                  <React.Fragment key={res.id}>
                    {/* Drop zone gap above */}
                    {isDragOverAbove && (
                      <div className="my-1.5 py-2.5 px-4 rounded-xl border-2 border-dashed border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-extrabold text-[11px] text-center shadow-md animate-pulse flex items-center justify-center gap-1.5 transition-all">
                        <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                        <span>Buraya Bırak</span>
                      </div>
                    )}

                    <div
                      draggable
                      onDragStart={(e) => {
                        setDraggedIdx(index)
                        e.dataTransfer.setData('text/plain', String(index))
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        if (draggedIdx === null || draggedIdx === index) return
                        const rect = e.currentTarget.getBoundingClientRect()
                        const midY = rect.top + rect.height / 2
                        const pos = e.clientY < midY ? 'above' : 'below'
                        if (dragOverIdx !== index || dragPosition !== pos) {
                          setDragOverIdx(index)
                          setDragPosition(pos)
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverIdx === index) setDragOverIdx(null)
                      }}
                      onDragEnd={() => {
                        setDraggedIdx(null)
                        setDragOverIdx(null)
                      }}
                      onDrop={() => handleDropResource(index)}
                      onDoubleClick={() => handleDoubleClickResource(res)}
                      className={cn(
                        'group relative pl-6 pr-3 py-2 rounded-xl border transition-all duration-200 cursor-pointer select-none flex items-center justify-between',
                        isDragging
                          ? 'opacity-40 border-dashed border-cyan-500 bg-cyan-500/5 scale-[0.98]'
                          : 'bg-white/80 dark:bg-zinc-900/40 border-slate-200/80 dark:border-zinc-800/80 hover:border-cyan-500/40 hover:bg-slate-50 dark:hover:bg-zinc-900/60 shadow-sm'
                      )}
                    >
                      {/* Node Dot Indicator */}
                      <div
                        className={cn(
                          'absolute -left-[27px] top-3.5 w-4 h-4 rounded-full border-2 transition-all duration-300 flex items-center justify-center',
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                            : 'bg-white border-slate-300 dark:bg-zinc-900 dark:border-zinc-700'
                        )}
                      >
                        {isCompleted && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </div>

                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <GripVertical className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0" />
                        {getStepTypeIcon(res.type)}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                            {res.name}
                          </span>
                          {res.url_or_path && res.url_or_path !== '#' && (
                            <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 truncate mt-0.5 flex items-center gap-1">
                              <span>{res.url_or_path}</span>
                              <ExternalLink className="h-2.5 w-2.5 text-cyan-500 opacity-60 inline" />
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteResource(e, res.id, res.name)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2"
                        title="Adımı Kaldır"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Drop zone gap below */}
                    {isDragOverBelow && (
                      <div className="my-1.5 py-2.5 px-4 rounded-xl border-2 border-dashed border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-extrabold text-[11px] text-center shadow-md animate-pulse flex items-center justify-center gap-1.5 transition-all">
                        <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                        <span>Buraya Bırak</span>
                      </div>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Bugünün İşleri ve Karalama Defteri - Sağ Blok */}
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 h-full overflow-hidden">
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/60 backdrop-blur-xl flex flex-col shrink-0 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-cyan-500" />
            <span>Bugünkü Eğitim İşleri</span>
          </h3>

          {/* Hızlı Görev Ekleme Barı - Genişletilmiş Task Card Formatı */}
          <form onSubmit={handleAddTask} className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-black/15 border border-slate-200/50 dark:border-zinc-800/50 mb-4 shadow-sm">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-500 tracking-wider">Görev Başlığı</label>
              <Input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Örn: Spring Boot JPA Çalışması..."
                className="h-10 px-3 text-xs font-bold"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-500 tracking-wider">Klasör Seç</label>
                <select
                  value={taskFolderId}
                  onChange={(e) => {
                    setTaskFolderId(e.target.value)
                    setTaskResourceId(undefined)
                  }}
                  className="h-10 rounded-xl border border-slate-200 bg-white/70 px-3 text-xs font-bold text-slate-900 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-100"
                >
                  <option value="">Tüm kaynaklar</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                  {resources.some((resource) => !folderResourceIds.has(resource.id)) && (
                    <option value="uncategorized">Klasörsüz kaynaklar</option>
                  )}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-500 tracking-wider">Dosya/Link Seç</label>
                <select
                  value={taskResourceId ?? ''}
                  onChange={(e) => setTaskResourceId(e.target.value ? Number(e.target.value) : undefined)}
                  className="h-10 rounded-xl border border-slate-200 bg-white/70 px-3 text-xs font-bold text-slate-900 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-100"
                >
                  <option value="">Kaynak seçilmedi</option>
                  {taskResourceOptions.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-500 tracking-wider flex items-center gap-1">
                <Calendar className="h-3 w-3 text-cyan-500" /> Planlanan Tarih & Saat
              </label>
              <div className="relative">
                <DateTimePicker
                  date={taskDate}
                  time={taskTime}
                  onDateChange={setTaskDate}
                  onTimeChange={setTaskTime}
                  showTime={true}
                  align="left"
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full h-10 font-bold"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span>Ekle</span>
            </Button>
          </form>

          {/* Görev Listesi */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {localTasks.length === 0 ? (
              <p className="text-[11px] text-slate-900 dark:text-zinc-300 text-center py-4">
                Bugün için planlanmış proje görevi yok.
              </p>
            ) : (
              localTasks.map((t) => {
                const resourceLabel = getTaskContextLabel(taskContexts[String(t.id)])
                return (
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
                          <Input
                            type="text"
                            value={editingTaskTitle}
                            onChange={(e) => setEditingTaskTitle(e.target.value)}
                            className="h-7 px-2 text-xs font-bold flex-1"
                          />
                          <Button
                            type="button"
                            onClick={() => handleSaveLocalTaskEdit(t.id)}
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] px-2"
                          >
                            Kaydet
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setEditingTaskId(null)}
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] px-2 text-slate-600"
                          >
                            İptal
                          </Button>
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
                              {resourceLabel || t.tag}
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
                )
              })
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

export const OverviewTab = React.memo(OverviewTabComponent)
