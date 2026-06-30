import React from 'react'
import { Search, FileText, BookOpen, Code2, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getTargetLabel } from './studioHelpers'
import { ReinforcementTarget, ReinforcementTask } from '../types'

interface ReinforcementsTabProps {
  reinforcementTargets: ReinforcementTarget[]
  reinforcementSearch: string
  setReinforcementSearch: (val: string) => void
  selectedProjectId: number | undefined
  setSelectedProjectId: (val: number | undefined) => void
  projects: any[]
  selectedReinforcementTargetId: string
  setSelectedReinforcementTargetId: (val: string) => void
  reinforcements: Record<string, ReinforcementTask[]>
  newReinforcementTitle: string
  setNewReinforcementTitle: (val: string) => void
  handleAddReinforceTask: (targetId: string, title: string) => void
  handleToggleReinforceTask: (targetId: string, taskId: string) => void
  handleDeleteReinforceTask: (targetId: string, taskId: string) => void
  handleWriteCodeForTarget: (target: ReinforcementTarget, task?: ReinforcementTask) => void
}

export const ReinforcementsTab: React.FC<ReinforcementsTabProps> = ({
  reinforcementTargets,
  reinforcementSearch,
  setReinforcementSearch,
  selectedProjectId,
  setSelectedProjectId,
  projects,
  selectedReinforcementTargetId,
  setSelectedReinforcementTargetId,
  reinforcements,
  newReinforcementTitle,
  setNewReinforcementTitle,
  handleAddReinforceTask,
  handleToggleReinforceTask,
  handleDeleteReinforceTask,
  handleWriteCodeForTarget,
}) => {
  const filteredTargets = reinforcementTargets.filter((target) => {
    const search = reinforcementSearch.trim().toLowerCase()
    if (!search) return true
    return getTargetLabel(target).toLowerCase().includes(search)
  })

  const selectedReinforcementTarget = reinforcementTargets.find(t => t.id === selectedReinforcementTargetId)
  const selectedTargetTasks = selectedReinforcementTarget
    ? reinforcements[selectedReinforcementTarget.id] || []
    : []

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 min-h-[430px]">
      <div className="xl:col-span-4 glass-panel p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/25 backdrop-blur-xl shadow-md flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-cyan-500 shrink-0" />
          <Input
            value={reinforcementSearch}
            onChange={(e) => setReinforcementSearch(e.target.value)}
            placeholder="Kaynak, dokuman veya baslik ara..."
            className="h-10 flex-1 text-xs font-bold"
          />
        </div>

        <select
          value={selectedProjectId ?? ''}
          onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : undefined)}
          className="h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/70 dark:bg-black/20 px-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-cyan-500/50"
        >
          <option value="">Proje dokumanlari yok</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredTargets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 p-4 text-xs font-bold text-slate-700 dark:text-zinc-350">
              Eslesen kaynak bulunamadi.
            </div>
          ) : (
            filteredTargets.map((target) => {
              const active = selectedReinforcementTargetId === target.id
              const taskCount = (reinforcements[target.id] || []).length
              return (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => setSelectedReinforcementTargetId(target.id)}
                  className={cn(
                    'w-full text-left rounded-xl border p-3 transition-all cursor-pointer',
                    active
                      ? 'border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_14px_rgba(6,182,212,0.18)]'
                      : 'border-slate-200/70 dark:border-zinc-800/70 bg-white/50 dark:bg-zinc-900/30 hover:bg-white/80 dark:hover:bg-zinc-900/50'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-slate-900 dark:text-white">
                        {getTargetLabel(target)}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                        {target.type === 'resource' ? target.resource.type : 'PROJECT DOC'} / {taskCount} pekistirme
                      </p>
                    </div>
                    {target.type === 'resource' ? (
                      <FileText className="h-4 w-4 shrink-0 text-cyan-500" />
                    ) : (
                      <BookOpen className="h-4 w-4 shrink-0 text-violet-500" />
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      <div className="xl:col-span-8 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/25 backdrop-blur-xl shadow-md flex flex-col gap-4">
        {selectedReinforcementTarget ? (
          <>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {getTargetLabel(selectedReinforcementTarget)}
                </h3>
                <p className="mt-1 text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                  Dokuman, mufredat basligi veya proje dokumani icin bagli pekistirme calismalari.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => handleWriteCodeForTarget(selectedReinforcementTarget)}
                variant="glass"
                size="sm"
                className="text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 px-4 py-2 rounded-full font-bold shadow-[0_0_12px_rgba(6,182,212,0.08)] cursor-pointer"
              >
                <Code2 className="h-3.5 w-3.5 mr-1.5" />
                <span>Kod Alanini Ac</span>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={newReinforcementTitle}
                onChange={(e) => setNewReinforcementTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' || !selectedReinforcementTarget) return
                  const title = newReinforcementTitle.trim()
                  if (!title) return
                  handleAddReinforceTask(selectedReinforcementTarget.id, title)
                  setNewReinforcementTitle('')
                }}
                placeholder="Yeni pekistirme basligi yazin..."
                className="h-11 flex-1 text-xs font-bold"
              />
              <Button
                type="button"
                onClick={() => {
                  if (!selectedReinforcementTarget) return
                  const title = newReinforcementTitle.trim()
                  if (!title) return
                  handleAddReinforceTask(selectedReinforcementTarget.id, title)
                  setNewReinforcementTitle('')
                }}
                className="h-11 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold px-4"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                <span>Ekle</span>
              </Button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1">
              {selectedTargetTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 p-6 text-center text-xs font-bold text-slate-700 dark:text-zinc-350">
                  Bu kaynak icin henuz pekistirme yok.
                </div>
              ) : (
                selectedTargetTasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 dark:border-zinc-800/70 bg-white/55 dark:bg-zinc-900/35 p-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleReinforceTask(selectedReinforcementTarget.id, task.id)}
                        className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-zinc-700 bg-transparent cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <p className={cn('truncate text-xs font-black text-slate-900 dark:text-white', task.completed && 'line-through opacity-50')}>
                          {index + 1}. {task.title}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] font-mono text-slate-500 dark:text-zinc-500">
                          {task.codeFileName}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleWriteCodeForTarget(selectedReinforcementTarget, task)}
                        className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1.5 text-[10px] font-black text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/15"
                      >
                        <Code2 className="h-3 w-3" />
                        <span>Kod</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReinforceTask(selectedReinforcementTarget.id, task.id)}
                        className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-350">
            Once bir kaynak veya proje dokumani secin.
          </div>
        )}
      </div>
    </div>
  )
}
