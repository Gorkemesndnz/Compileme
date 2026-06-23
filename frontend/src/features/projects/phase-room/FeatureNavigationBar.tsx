import React from 'react'
import { ListChecks, GitBranch, Database, Webhook, FileText } from 'lucide-react'
import { Button as MovingBorderButton } from '../../../components/ui/moving-border'
import { cn } from '../../../lib/utils'

export type FeatureId = 'tasks' | 'subphases' | 'db_schema' | 'api_endpoints' | 'tech_memory'

export interface FeatureTab {
  id: FeatureId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export const ALL_FEATURES: FeatureTab[] = [
  { id: 'tasks', label: 'Faz Görevleri', icon: ListChecks },
  { id: 'subphases', label: 'Alt Fazlar (Control Room)', icon: GitBranch },
  { id: 'db_schema', label: 'DB Şeması', icon: Database },
  { id: 'api_endpoints', label: 'API & Endpointler', icon: Webhook },
  { id: 'tech_memory', label: 'Teknik Hafıza', icon: FileText },
]

interface FeatureNavigationBarProps {
  activeFeatures: FeatureId[]
  activeTab: FeatureId
  setActiveTab: (tab: FeatureId) => void
}

export const FeatureNavigationBar: React.FC<FeatureNavigationBarProps> = ({
  activeFeatures,
  activeTab,
  setActiveTab,
}) => {
  const visibleTabs = ALL_FEATURES.filter((tab) => activeFeatures.includes(tab.id))

  return (
    <section className="glass-panel rounded-3xl p-2.5 border border-zinc-200/60 dark:border-zinc-800/40 backdrop-blur-xl">
      <div className="flex gap-2.5 overflow-x-auto p-1 scrollbar-hide">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return isActive ? (
            <MovingBorderButton
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              borderRadius="0.875rem"
              duration={2000}
              containerClassName="h-10 shrink-0"
              className="px-4 font-bold text-xs flex items-center gap-2.5 !border-zinc-200/80 !bg-white text-neutral-900 dark:!border-zinc-800 dark:!bg-[#141414] dark:text-neutral-100"
            >
              <Icon className="h-4.5 w-4.5 text-neutral-700 dark:text-neutral-300" />
              {tab.label}
            </MovingBorderButton>
          ) : (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="h-10 inline-flex shrink-0 items-center gap-2.5 rounded-2xl border border-transparent px-4 text-xs font-bold text-zinc-500 transition-all hover:bg-slate-200/40 dark:hover:bg-white/5 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
            >
              <Icon className="h-4.5 w-4.5 text-zinc-400 dark:text-zinc-500" />
              {tab.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}
