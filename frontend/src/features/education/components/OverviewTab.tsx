import React from 'react'
import { Sparkles, Clock, Plus, Pencil, Trash2, Calendar, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DateTimePicker } from '../../dashboard/DateTimePicker'
import { Education, EducationPractice, EducationResource, FolderData } from '../types'

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
