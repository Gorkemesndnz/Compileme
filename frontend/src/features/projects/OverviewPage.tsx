import React, { useState, useEffect } from 'react'
import {
  GitBranch,
  ListChecks,
  Plus,
  Trash2,
  StickyNote,
  CheckSquare,
  Square,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Project, ProjectPhase, ProjectStatus } from '../../api/projects'
import { Task } from '../../api/tasks'
import { Button as MovingBorderButton } from '../../components/ui/moving-border'
import { SketchButton } from '../../components/ui/SketchButton'
import { cn } from '../../lib/utils'


interface OverviewPageProps {
  project: Project
  phases: ProjectPhase[]
  projectTasks: Task[]
  todayTasks: Task[]
  onTaskStatusChange: (taskId: number) => void
  onAddTask?: (title: string) => void
  onDeleteTask?: (taskId: number) => void
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: 'Planlama',
  ACTIVE: 'Aktif',
  PAUSED: 'Beklemede',
  DONE: 'Tamamlandı',
}

const STATUS_DOT_STYLES: Record<ProjectStatus, string> = {
  PLANNING: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] dark:shadow-[0_0_12px_rgba(251,191,36,0.8)]',
  ACTIVE: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] dark:shadow-[0_0_12px_rgba(52,211,153,0.8)]',
  PAUSED: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)] dark:shadow-[0_0_12px_rgba(56,189,248,0.8)]',
  DONE: 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)] dark:shadow-[0_0_12px_rgba(167,139,250,0.8)]',
}

const STATUS_BORDER_COLORS: Record<ProjectStatus, string> = {
  PLANNING: 'border-amber-400/20 hover:border-amber-400/40',
  ACTIVE: 'border-emerald-400/20 hover:border-emerald-400/40',
  PAUSED: 'border-sky-400/20 hover:border-sky-400/40',
  DONE: 'border-violet-400/20 hover:border-violet-400/40',
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  project,
  phases,
  projectTasks,
  todayTasks,
  onTaskStatusChange,
  onAddTask,
  onDeleteTask,
}) => {
  const [scratchNotes, setScratchNotes] = useState(() => {
    return localStorage.getItem(`project_notes_${project.id}`) || ''
  })
  const [quickTaskTitle, setQuickTaskTitle] = useState('')


  // Sync notes when project changes
  useEffect(() => {
    setScratchNotes(localStorage.getItem(`project_notes_${project.id}`) || '')
  }, [project.id])

  const handleNotesChange = (value: string) => {
    setScratchNotes(value)
    localStorage.setItem(`project_notes_${project.id}`, value)
  }

  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTaskTitle.trim() || !onAddTask) return
    onAddTask(quickTaskTitle.trim())
    setQuickTaskTitle('')
  }

  // Sort phases by orderIndex
  const sortedPhases = [...phases].sort((a, b) => a.orderIndex - b.orderIndex)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* A) Sol Geniş Alan (2 Kutu Kaplayacak): Roadmap & Task Creation */}
      <div className="lg:col-span-2 space-y-6">
        {/* Proje Yol Haritası */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-border/40 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
            <div className="flex items-center gap-2.5">
              <GitBranch className="h-5 w-5 text-cyan-500" />
              <h2 className="font-bold text-sm tracking-wide text-neutral-900 dark:text-neutral-100">
                Proje Yol Haritası (Roadmap)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 font-bold bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-md">
              {phases.length} Faz
            </span>
          </div>

          <div className="relative pl-1">
            {sortedPhases.map((phase, index) => {
              const phaseTasks = projectTasks.filter((task) => task.phaseId === phase.id)
              const totalTasks = phaseTasks.length
              const completedTasks = phaseTasks.filter((task) => task.status === 'DONE').length
              const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

              return (
                <div key={phase.id} className="relative pl-8 pb-8 last:pb-0 group">
                  {/* Metro timeline connector line */}
                  {index < sortedPhases.length - 1 && (
                    <div className="absolute left-[7px] top-6 bottom-0 w-[2px] bg-gradient-to-b from-cyan-500/30 via-emerald-500/20 to-neutral-200/10 dark:to-neutral-800/10 transition-colors" />
                  )}

                  {/* Metro station indicator dot */}
                  <div className="absolute left-0 top-1.5 z-10 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-background border border-border/70 dark:border-neutral-800 transition-colors">
                    <span className={cn('h-2 w-2 rounded-full', STATUS_DOT_STYLES[phase.status])} />
                  </div>

                  {/* Compact station card */}
                  <div className={cn(
                    'rounded-xl border bg-card/45 p-4 backdrop-blur-xl transition-all duration-300',
                    STATUS_BORDER_COLORS[phase.status]
                  )}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                          {phase.name}
                        </h3>
                        {phase.description && (
                          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                            {phase.description}
                          </p>
                        )}
                        {(phase.startDate || phase.endDate) && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-neutral-400">
                            <Clock className="h-3 w-3" />
                            <span>
                              {phase.startDate || 'Başlangıç yok'} - {phase.endDate || 'Bitiş yok'}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border border-border/40 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-500 dark:text-neutral-400">
                        {STATUS_LABELS[phase.status]}
                      </span>
                    </div>

                    {/* Metro station progress bar */}
                    <div className="mt-4 pt-3 border-t border-border/20">
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-neutral-400 mb-1">
                        <span>{completedTasks}/{totalTasks} Görev</span>
                        <span className="text-cyan-600 dark:text-cyan-400">%{percent}</span>
                      </div>
                      <div className="h-1 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {sortedPhases.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-border/60">
                <Sparkles className="h-8 w-8 text-neutral-400 mb-3" />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">
                  Faz eklenince proje yolculuğu burada görünecek.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* B) Sağ Dar Alan (1 Kutu Kaplayacak): Bugünkü Proje İşleri & Karalama Defteri */}
      <div className="space-y-6">
        
        {/* Bugünkü Proje İşleri */}
        <div className="glass-panel p-5 rounded-2xl border border-border/40 backdrop-blur-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-emerald-500" />
              <h2 className="font-bold text-sm tracking-wide text-neutral-900 dark:text-neutral-100">
                Bugünkü Proje İşleri
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-450">
              {todayTasks.filter(t => t.status === 'DONE').length}/{todayTasks.length} Done
            </span>
          </div>

          {/* Quick task adder form inside component */}
          {onAddTask && (
            <form onSubmit={handleQuickTaskSubmit} className="flex gap-2">
              <input
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Bugün için hızlı görev ekle..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-black/30 backdrop-blur-sm px-3 py-2 text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all"
              />
              <MovingBorderButton
                borderRadius="0.75rem"
                duration={2200}
                containerClassName="h-8 w-12 cursor-pointer shrink-0"
                className="p-0"
                type="submit"
              >
                <Plus className="h-3.5 w-3.5" />
              </MovingBorderButton>
            </form>
          )}

          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between gap-2 p-2.5 rounded-xl border border-border/30 bg-neutral-500/5 hover:bg-neutral-500/10 dark:bg-neutral-900/10 dark:hover:bg-neutral-900/25 transition-all font-mono text-xs group/item"
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => onTaskStatusChange(task.id)}
                    className="mt-0.5 shrink-0 text-zinc-400 hover:text-cyan-500 transition-colors"
                  >
                    {task.status === 'DONE' ? (
                      <CheckSquare className="h-4 w-4 text-cyan-500" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      'font-semibold break-words leading-relaxed text-neutral-800 dark:text-neutral-200',
                      task.status === 'DONE' && 'line-through text-neutral-400 dark:text-neutral-500'
                    )}>
                      {task.title}
                    </p>
                    {task.notes && (
                      <p className="mt-1 text-[10px] text-neutral-400 font-sans leading-normal">
                        {task.notes}
                      </p>
                    )}
                  </div>
                </div>

                {onDeleteTask && (
                  <SketchButton
                    type="button"
                    onClick={() => onDeleteTask(task.id)}
                    tone="destructive"
                    className="h-6 w-6 p-0 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200"
                  >
                    <Trash2 className="h-3 w-3" />
                  </SketchButton>
                )}
              </div>
            ))}

            {todayTasks.length === 0 && (
              <div className="text-center py-8 border border-dashed border-border/40 rounded-xl">
                <p className="text-xs text-neutral-400 italic">
                  Bugün için planlanmış proje görevi yok.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Karalama Defteri (Auto-saved notes) */}
        <div className="glass-panel p-5 rounded-2xl border border-border/40 backdrop-blur-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <StickyNote className="h-5 w-5 text-violet-500" />
            <h2 className="font-bold text-sm tracking-wide text-neutral-900 dark:text-neutral-100">
              Anlık Karalama Defteri
            </h2>
          </div>
          <textarea
            value={scratchNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Yarın şunu yapacağım...&#10;Şu linki buraya bırakayım...&#10;(Otomatik olarak kaydedilir)"
            className="w-full h-40 resize-none border-none bg-neutral-500/5 focus:bg-neutral-500/10 p-3 text-xs leading-relaxed text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 outline-none rounded-xl focus:ring-1 focus:ring-violet-400/20 transition-all font-mono"
          />
        </div>

      </div>

    </div>
  )
}
