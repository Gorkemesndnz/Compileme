import React from 'react'
import { Code2, FileText, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EducationResource, ReinforcementTarget, ReinforcementTask } from '../types'

interface ReinforcementsTabProps {
  resources: EducationResource[]
  selectedResourceId: number | null | undefined
  reinforcements: Record<string, ReinforcementTask[]>
  newReinforcementTitle: string
  setNewReinforcementTitle: (val: string) => void
  handleAddReinforceTask: (targetId: string, title: string) => void
  handleToggleReinforceTask: (targetId: string, taskId: string) => void
  handleDeleteReinforceTask: (targetId: string, taskId: string) => void
  handleWriteCodeForTarget: (target: ReinforcementTarget, task?: ReinforcementTask) => void
}

const ReinforcementsTabComponent: React.FC<ReinforcementsTabProps> = ({
  resources,
  selectedResourceId,
  reinforcements,
  newReinforcementTitle,
  setNewReinforcementTitle,
  handleAddReinforceTask,
  handleToggleReinforceTask,
  handleDeleteReinforceTask,
  handleWriteCodeForTarget,
}) => {
  const selectedResource = selectedResourceId
    ? resources.find((resource) => resource.id === selectedResourceId)
    : undefined
  const selectedTarget = selectedResource
    ? {
        id: `resource:${selectedResource.id}`,
        type: 'resource' as const,
        label: selectedResource.name,
        resource: selectedResource,
      }
    : undefined
  const selectedTargetTasks = selectedTarget ? reinforcements[selectedTarget.id] || [] : []

  const addTask = () => {
    if (!selectedTarget) return
    const title = newReinforcementTitle.trim()
    if (!title) return
    handleAddReinforceTask(selectedTarget.id, title)
    setNewReinforcementTitle('')
  }

  if (!selectedTarget) {
    return (
      <div className="flex min-h-[430px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center text-xs font-bold text-slate-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/25 dark:text-zinc-300">
        Soldan bir kaynak seçin.
      </div>
    )
  }

  return (
    <div className="min-h-[430px] min-w-0 rounded-2xl border border-slate-200 bg-white/60 p-5 shadow-md backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/25">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-zinc-800 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-cyan-500" />
            <h3 className="truncate text-sm font-black text-slate-900 dark:text-white">
              {selectedTarget.resource.name}
            </h3>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
            Bu kaynak için bağlı pekiştirme çalışmaları.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => handleWriteCodeForTarget(selectedTarget)}
          variant="secondary"
          size="sm"
          className="shrink-0 font-bold text-cyan-700 dark:text-cyan-300"
        >
          <Code2 className="mr-1.5 h-3.5 w-3.5" />
          <span>Kod Alanını Aç</span>
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          value={newReinforcementTitle}
          onChange={(event) => setNewReinforcementTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') addTask()
          }}
          placeholder="Yeni pekiştirme başlığı yazın..."
          className="h-11 flex-1 text-xs font-bold"
        />
        <Button type="button" onClick={addTask} variant="primary" className="h-11 px-4 font-bold">
          <Plus className="mr-1.5 h-4 w-4" />
          <span>Ekle</span>
        </Button>
      </div>

      <div className="mt-4 space-y-2 overflow-y-auto pr-1">
        {selectedTargetTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs font-bold text-slate-700 dark:border-zinc-800 dark:text-zinc-300">
            Bu kaynak için henüz pekiştirme yok.
          </div>
        ) : (
          selectedTargetTasks.map((task, index) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white/55 p-3 dark:border-zinc-800/70 dark:bg-zinc-900/35"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleReinforceTask(selectedTarget.id, task.id)}
                  className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 bg-transparent text-cyan-600 focus:ring-cyan-500 dark:border-zinc-700"
                />
                <div className="min-w-0">
                  <p className={cn('truncate text-xs font-black text-slate-900 dark:text-white', task.completed && 'line-through opacity-50')}>
                    {index + 1}. {task.title}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500 dark:text-zinc-500">
                    {task.codeFileName}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  onClick={() => handleWriteCodeForTarget(selectedTarget, task)}
                  variant="secondary"
                  size="sm"
                  className="h-8 px-2.5 text-[10px] font-black text-cyan-700 dark:text-cyan-300"
                >
                  <Code2 className="mr-1 h-3 w-3" />
                  <span>Kod</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => handleDeleteReinforceTask(selectedTarget.id, task.id)}
                  variant="dangerGhost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export const ReinforcementsTab = React.memo(ReinforcementsTabComponent)
