import React, { useState } from 'react'
import { CheckSquare, Lightbulb } from 'lucide-react'
import { cn } from '../../lib/utils'

export type QuickAddMode = 'idea' | 'task'

interface IdeaTaskToggleProps {
  value?: QuickAddMode
  onValueChange?: (value: QuickAddMode) => void
  className?: string
}

export const IdeaTaskToggle: React.FC<IdeaTaskToggleProps> = ({
  value,
  onValueChange,
  className,
}) => {
  const [internalMode, setInternalMode] = useState<QuickAddMode>('idea')
  const activeMode = value ?? internalMode

  const selectMode = (mode: QuickAddMode) => {
    if (value === undefined) setInternalMode(mode)
    onValueChange?.(mode)
  }

  return (
    <div
      role="group"
      aria-label="Hızlı giriş türü"
      className={cn(
        'relative grid h-11 w-40 shrink-0 grid-cols-2 rounded-full border border-zinc-200 bg-white p-1 shadow-sm',
        'dark:border-zinc-800 dark:bg-zinc-950',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-1 top-1 h-9 w-[calc(50%-0.25rem)] rounded-full bg-gray-200 shadow-sm transition-transform duration-300 ease-out',
          'dark:bg-zinc-800',
          activeMode === 'task' && 'translate-x-full',
        )}
      />

      <button
        type="button"
        onClick={() => selectMode('idea')}
        aria-pressed={activeMode === 'idea'}
        className={cn(
          'relative z-10 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-colors',
          activeMode === 'idea'
            ? 'text-amber-700 dark:text-white'
            : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white',
        )}
      >
        <Lightbulb className="h-3.5 w-3.5" />
        Fikir
      </button>

      <button
        type="button"
        onClick={() => selectMode('task')}
        aria-pressed={activeMode === 'task'}
        className={cn(
          'relative z-10 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-colors',
          activeMode === 'task'
            ? 'text-emerald-700 dark:text-white'
            : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white',
        )}
      >
        <CheckSquare className="h-3.5 w-3.5" />
        Görev
      </button>
    </div>
  )
}

