import React from 'react'
import { ArrowLeft, Settings, Check, Sparkles } from 'lucide-react'
import { Project, ProjectPhase } from '../../../api/projects'
import { cn } from '../../../lib/utils'

interface ControlRoomHeaderProps {
  project: Project
  phase: ProjectPhase
  onBack: () => void
  onOpenSettings: () => void
  onCopyData: () => void
  completionPercent: number
}

export const ControlRoomHeader: React.FC<ControlRoomHeaderProps> = ({
  project,
  phase,
  onBack,
  onOpenSettings,
  onCopyData,
  completionPercent,
}) => {
  return (
    <header className="glass-panel rounded-3xl p-6 border border-zinc-200/60 dark:border-zinc-800/40 backdrop-blur-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left Section: Back button and Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl border border-zinc-200/50 bg-zinc-50/50 hover:bg-zinc-100 hover:text-zinc-900 transition-all dark:border-zinc-800/50 dark:bg-zinc-950/20 dark:text-zinc-400 dark:hover:bg-zinc-900/30 dark:hover:text-zinc-100"
            title="Geri Dön"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">
                {project.name}
              </span>
              <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Control Room
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
              {phase.name}
            </h1>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-3 sm:self-center">
          <span
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold border uppercase tracking-wider',
              phase.status === 'DONE'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                : phase.status === 'ACTIVE'
                ? 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20'
                : 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20'
            )}
          >
            {phase.status === 'DONE' ? 'Tamamlandı' : phase.status === 'ACTIVE' ? 'Aktif' : 'Planlama'}
          </span>

          {/* Copy Phase Memory */}
          <button
            onClick={onCopyData}
            className="p-2.5 rounded-xl border border-zinc-200/50 bg-zinc-50/50 hover:bg-zinc-100 hover:text-zinc-900 transition-all dark:border-zinc-800/50 dark:bg-zinc-950/20 dark:text-zinc-400 dark:hover:bg-zinc-900/30 dark:hover:text-zinc-100"
            title="Faz Hafızasını Kopyala"
          >
            <Sparkles className="h-4.5 w-4.5 text-cyan-500 dark:text-cyan-400" />
          </button>

          {/* Settings gear */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl border border-zinc-200/50 bg-zinc-50/50 hover:bg-zinc-100 hover:text-zinc-900 transition-all dark:border-zinc-800/50 dark:bg-zinc-950/20 dark:text-zinc-400 dark:hover:bg-zinc-900/30 dark:hover:text-zinc-100"
            title="Özellik Ayarları"
          >
            <Settings className="h-4.5 w-4.5 hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-zinc-500 dark:text-zinc-400">Faz Tamamlanma Oranı</span>
          <span className="font-black text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
            <Check className="h-3.5 w-3.5" />%{completionPercent}
          </span>
        </div>
        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-900/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)] transition-all duration-500 ease-out"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>
    </header>
  )
}
