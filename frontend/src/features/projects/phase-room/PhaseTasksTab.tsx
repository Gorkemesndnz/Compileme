import React, { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Plus,
  Square,
  StickyNote,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Project, ProjectPhase } from '../../../api/projects'
import {
  Task,
  useTasks,
  useCreateTask,
  useToggleTaskComplete,
  useDeleteTask,
  useUpdateTask,
} from '../../../api/tasks'
import { Button as MovingBorderButton } from '../../../components/ui/moving-border'
import { SketchButton } from '../../../components/ui/SketchButton'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import { DateTimePicker } from '../../dashboard/DateTimePicker'
import { cn } from '../../../lib/utils'
import { Sparkles } from 'lucide-react'

interface PhaseTasksTabProps {
  project: Project
  phase: ProjectPhase
}

export const PhaseTasksTab: React.FC<PhaseTasksTabProps> = ({
  project,
  phase,
}) => {
  // ── Data queries ──────────────────────────────────────────────────
  const { data: projectTasks = [] } = useTasks({ projectId: project.id })
  const phaseTasks = useMemo(
    () => projectTasks.filter((t) => t.phaseId === phase.id),
    [projectTasks, phase.id]
  )

  // ── Mutations ─────────────────────────────────────────────────────
  const createTaskMutation = useCreateTask()
  const toggleTaskMutation = useToggleTaskComplete()
  const deleteTaskMutation = useDeleteTask()
  const updateTaskMutation = useUpdateTask()

  // ── Form state ────────────────────────────────────────────────────
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDate, setTaskDate] = useState('')
  const [taskTime, setTaskTime] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Expandable notes ──────────────────────────────────────────────
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)
  const [taskNotes, setTaskNotes] = useState<Record<number, string>>({})

  useEffect(() => {
    const notesMap: Record<number, string> = {}
    phaseTasks.forEach((t) => {
      notesMap[t.id] = t.notes || ''
    })
    setTaskNotes(notesMap)
  }, [phaseTasks])

  // ── Handlers ──────────────────────────────────────────────────────

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim() || isSubmitting) return
    setIsSubmitting(true)

    try {
      await createTaskMutation.mutateAsync({
        title: taskTitle.trim(),
        status: 'TODO',
        kind: 'PROJECT',
        projectId: project.id,
        phaseId: phase.id,
        scheduledDate: taskDate || undefined,
        scheduledTime: taskTime || undefined,
        planningBucket: taskDate ? 'DAY' : 'UNSCHEDULED',
      })
      setTaskTitle('')
      setTaskDate('')
      setTaskTime('')
      toast.success('Görev bu faza eklendi ve takvime senkronize edildi.')
    } catch {
      toast.error('Görev eklenirken bir hata oluştu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveNotes = async (taskId: number) => {
    const noteContent = taskNotes[taskId] || ''
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        request: { notes: noteContent },
      })
      toast.success('Mühendislik notları kaydedildi.')
    } catch {
      toast.error('Notlar kaydedilirken hata oluştu.')
    }
  }

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="grid gap-6 lg:grid-cols-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Görev Ekleme ve Liste (2/3) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-zinc-200/60 dark:border-zinc-800/40 pb-3">
            <ListChecks className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
            <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
              Faz Görev Listesi
            </h3>
          </div>

          {/* Hızlı Görev Formu */}
          <form onSubmit={handleAddTask} className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Görev başlığını girin..."
                className="bg-zinc-50 dark:bg-zinc-950/50"
                disabled={isSubmitting}
              />
              <MovingBorderButton
                borderRadius="0.75rem"
                duration={2000}
                containerClassName="h-10 w-20 cursor-pointer shrink-0"
                className="font-bold"
                type="submit"
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4" />
              </MovingBorderButton>
            </div>

            {/* Tarih & Saat (isteğe bağlı) */}
            <div className="flex flex-wrap items-center gap-3">
              <DateTimePicker
                date={taskDate}
                time={taskTime}
                onDateChange={setTaskDate}
                onTimeChange={setTaskTime}
                showTime={!!taskDate}
                align="left"
              />
              {taskDate && (
                <button
                  type="button"
                  onClick={() => {
                    setTaskDate('')
                    setTaskTime('')
                  }}
                  className="text-[10px] font-bold text-zinc-400 hover:text-red-500 transition-colors"
                >
                  Tarihi Temizle
                </button>
              )}
              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                {taskDate
                  ? `Bucket: DAY → Anasayfa'ya yansır`
                  : `Bucket: UNSCHEDULED → Sadece faz içinde`}
              </span>
            </div>
          </form>

          {/* Görevler Listesi */}
          <div className="space-y-3">
            {phaseTasks.map((task) => {
              const isExpanded = expandedTaskId === task.id
              return (
                <div
                  key={task.id}
                  className="rounded-xl border border-zinc-200/60 dark:border-zinc-800/40 bg-white/60 dark:bg-zinc-900/45 p-4 space-y-3 backdrop-blur-sm transition-all hover:border-cyan-500/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleTaskMutation.mutate(task.id)}
                        className="mt-0.5 shrink-0 text-zinc-400 hover:text-cyan-500 transition-colors"
                      >
                        {task.status === 'DONE' ? (
                          <CheckSquare className="h-5 w-5 text-cyan-500" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <p
                          className={cn(
                            'font-bold text-sm text-zinc-800 dark:text-zinc-100 break-words leading-relaxed',
                            task.status === 'DONE' &&
                              'line-through text-zinc-400 dark:text-zinc-500'
                          )}
                        >
                          {task.title}
                        </p>

                        {task.scheduledDate && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                            <Calendar className="h-3 w-3" />
                            <span>{task.scheduledDate}</span>
                            {task.scheduledTime && (
                              <span className="text-zinc-300 dark:text-zinc-600">
                                {' '}
                                · {task.scheduledTime}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTaskId(isExpanded ? null : task.id)
                        }
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
                        title="Mühendislik Notlarını Göster"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>

                      <SketchButton
                        type="button"
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                        tone="destructive"
                        className="h-7 w-7 p-0 flex items-center justify-center"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </SketchButton>
                    </div>
                  </div>

                  {/* Genişletilebilir Not Alanı */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-zinc-200/40 dark:border-zinc-800/30 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <StickyNote className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                        <span className="font-bold">
                          Mühendislik Notları / AI Context Notu
                        </span>
                      </div>

                      <Textarea
                        value={taskNotes[task.id] || ''}
                        onChange={(e) =>
                          setTaskNotes({
                            ...taskNotes,
                            [task.id]: e.target.value,
                          })
                        }
                        placeholder="Bu görevle ilgili AR-GE bulgularını veya notları yazın..."
                        className="h-24 text-xs font-mono bg-zinc-50/50 dark:bg-zinc-950/40"
                      />

                      <div className="flex justify-end">
                        <SketchButton
                          type="button"
                          onClick={() => handleSaveNotes(task.id)}
                        >
                          Notları Kaydet
                        </SketchButton>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {phaseTasks.length === 0 && (
              <div className="text-center py-10 border border-dashed border-zinc-200/60 dark:border-zinc-800/40 rounded-xl">
                <p className="text-xs text-zinc-400 italic">
                  Bu faza ait görev eklenmedi. Yukarıdaki formdan hızlıca
                  ekleyebilirsiniz.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rehber Paneli (1/3) */}
      <div className="space-y-6">
        <div className="glass-panel p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-200/60 dark:border-zinc-800/40 pb-3">
            <Sparkles className="h-5 w-5 text-cyan-600 dark:text-cyan-400 animate-pulse" />
            <h4 className="font-bold text-xs tracking-wider uppercase text-zinc-700 dark:text-zinc-200">
              Komuta Odası Kılavuzu
            </h4>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Bu alana eklediğiniz görevler backend'deki takvim ve günlük todo
            listeleriyle entegre olur.
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            <strong>Tarih seçerseniz</strong> → görev anasayfanızın o günkü
            listesinde de görünür.{' '}
            <strong>Tarih seçmezseniz</strong> → görev sadece bu faz
            içinde kalır.
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Her görevin altındaki{' '}
            <strong>Mühendislik Notları</strong> alanına ekleyeceğiniz kod, db
            veya test analizleri{' '}
            <strong>AI Context Copy</strong> ile tek tıkla kopyalanır.
          </p>
        </div>
      </div>
    </div>
  )
}
