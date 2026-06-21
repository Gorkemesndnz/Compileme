import React from 'react'
import { cn } from '../../lib/utils'
import { Project } from '../../api/projects'
import { Education } from '../../api/education'
import { IdeaResponse } from '../../api/ideas'

interface TerminalMetricsProps {
  completedTodayCount: number
  totalTodayCount: number
  completedWeekCount: number
  totalWeekCount: number
  completedMonthCount: number
  totalMonthCount: number
  activeProjects: Project[]
  educations: Education[]
  ideas: IdeaResponse[]
}

interface TerminalWindowProps {
  fileName: string
  command: string
  children: React.ReactNode
}

const TerminalWindow: React.FC<TerminalWindowProps> = ({
  fileName,
  command,
  children,
}) => {
  return (
    <div
      className={cn(
        'glass-panel flex h-[190px] flex-col overflow-hidden rounded-[20px] border transition-all duration-300',
        'border-zinc-200/80 bg-white/75 text-zinc-800 backdrop-blur-md shadow-sm',
        'dark:border-zinc-800/80 dark:bg-zinc-950/75 dark:text-emerald-400/90 dark:shadow-md'
      )}
    >
      {/* Window Title Bar */}
      <div
        className={cn(
          'flex select-none items-center justify-between border-b px-4 py-2 text-[10px] font-mono',
          'border-zinc-200/60 bg-zinc-50/50 text-zinc-500',
          'dark:border-zinc-800/40 dark:bg-zinc-900/30 dark:text-zinc-500'
        )}
      >
        {/* macOS Window Controls */}
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
        </div>
        <span>{fileName}</span>
      </div>

      {/* Terminal Area */}
      <div className="flex flex-grow flex-col justify-start overflow-hidden p-4 font-mono text-xs leading-relaxed">
        {/* Input line */}
        <div className="mb-2 flex items-center gap-1.5">
          <span className="text-zinc-400 dark:text-zinc-600">$</span>
          <span className="font-bold text-zinc-950 dark:text-zinc-200">
            {command}
          </span>
        </div>
        {/* Output Area */}
        <div className="flex-grow overflow-hidden text-zinc-700 dark:text-emerald-400/80 whitespace-pre">
          {children}
        </div>
      </div>
    </div>
  )
}

export const TerminalMetrics: React.FC<TerminalMetricsProps> = ({
  completedTodayCount,
  totalTodayCount,
  completedWeekCount,
  totalWeekCount,
  completedMonthCount,
  totalMonthCount,
  activeProjects,
  educations,
  ideas,
}) => {
  // Name alignment helper
  const padName = (name: string, len = 10) => {
    if (name.length >= len) {
      return name.substring(0, len - 1) + ' '
    }
    return name + ' '.repeat(len - name.length)
  }

  // Label padding helper for Monospace alignment
  const padLabel = (label: string, len = 8) => {
    return label + ' '.repeat(Math.max(0, len - label.length))
  }

  // 15-character progress bar helper
  const getProgressBar = (percent: number) => {
    const total = 15
    const filled = Math.max(0, Math.min(total, Math.round((percent / 100) * total)))
    const empty = total - filled
    return `[${'='.repeat(filled)}${'-'.repeat(empty)}]`
  }

  // 1. Task Progress Calculations
  const dayPercent =
    totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 0
  
  const weekPercent =
    totalWeekCount > 0 ? Math.round((completedWeekCount / totalWeekCount) * 100) : 0

  const monthPercent =
    totalMonthCount > 0 ? Math.round((completedMonthCount / totalMonthCount) * 100) : 0

  // 2. Active Projects Progress
  const activeProjectsList = activeProjects.slice(0, 2).map((p, idx) => ({
    name: p.name,
    percent: (p.id * 13) % 40 + 20, // simulate a consistent percentage based on project id e.g. between 20% and 60%
  }))

  // 3. Education JSON serialization
  const eduData: Record<string, string> = {}
  const activeEducations = educations.filter((e) => e.status === 'ACTIVE')
  const educationsToDisplay = activeEducations.length > 0 ? activeEducations : educations

  if (educationsToDisplay.length > 0) {
    educationsToDisplay.slice(0, 2).forEach((e) => {
      const key = e.title.replace(/\s+/g, '_').substring(0, 14)
      eduData[key] = `${e.progressPercent}%`
    })
  }
  const educationJsonString = JSON.stringify(eduData, null, 2)

  // 4. Ideas Havuzu Summary
  const totalIdeas = ideas.length
  const planlamaCount = ideas.filter((i) => i.status === 'RAW').length
  const projeCount = ideas.filter((i) => i.status === 'CONVERTED').length
  const arsivCount = ideas.filter((i) => i.status === 'DEVELOPING').length

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: tasks.sh */}
      <TerminalWindow fileName="tasks.sh" command="./check_progress.sh --tasks">
        <div className="space-y-1">
          <div>
            {padLabel('[DAY]', 8)}{getProgressBar(dayPercent)} {dayPercent}% ({completedTodayCount}/{totalTodayCount})
          </div>
          <div>
            {padLabel('[WEEK]', 8)}{getProgressBar(weekPercent)} {weekPercent}% ({completedWeekCount}/{totalWeekCount})
          </div>
          <div>
            {padLabel('[MONTH]', 8)}{getProgressBar(monthPercent)} {monthPercent}% ({completedMonthCount}/{totalMonthCount})
          </div>
        </div>
      </TerminalWindow>

      {/* Card 2: projects.py */}
      <TerminalWindow fileName="projects.py" command="python3 get_active_projects.py">
        <div className="space-y-1">
          {activeProjectsList.length > 0 ? (
            activeProjectsList.map((p, idx) => (
              <div key={idx} className="whitespace-nowrap">
                &gt; {padName(p.name)} {getProgressBar(p.percent)} {p.percent}%
              </div>
            ))
          ) : (
            <div className="text-zinc-400 dark:text-zinc-600/70">
              No active projects.
            </div>
          )}
        </div>
      </TerminalWindow>

      {/* Card 3: education.json */}
      <TerminalWindow fileName="education.json" command="cat current_courses.json">
        <pre className="m-0 p-0 text-[11px] leading-tight select-none font-mono">
          {educationJsonString}
        </pre>
      </TerminalWindow>

      {/* Card 4: ideas.conf */}
      <TerminalWindow fileName="ideas.conf" command="ideas --summary">
        <div className="space-y-1">
          <div>{padLabel('Total Fikir', 12)}: {totalIdeas}</div>
          <div>{padLabel('[Planlama]', 12)}: {planlamaCount}</div>
          <div>{padLabel('[Proje]', 12)}: {projeCount}</div>
          <div>{padLabel('[Arşiv]', 12)}: {arsivCount}</div>
        </div>
      </TerminalWindow>
    </div>
  )
}
