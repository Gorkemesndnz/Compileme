import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckSquare, Clock, FileText, Search } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import { IdeaResponse, IdeaStatus } from '../../api/ideas'

const STATUS_LABELS: Record<IdeaStatus, string> = {
  RAW: 'Ham fikir',
  DEVELOPING: 'Gelistiriliyor',
  CONVERTED: 'Projeye donustu',
}

const STATUS_CLASSES: Record<IdeaStatus, string> = {
  RAW: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.65)]',
  DEVELOPING: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.65)]',
  CONVERTED: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.65)]',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export const IdeaCard: React.FC<{ idea: IdeaResponse }> = ({ idea }) => {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(`/ideas/${idea.id}`)}
      className="group flex min-h-[230px] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/70 text-left shadow-md backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/35 hover:bg-white/85 dark:border-zinc-800/50 dark:bg-black/45 dark:hover:border-cyan-500/30"
    >
      <div className="flex items-center justify-between border-b border-zinc-200/60 bg-zinc-50/80 px-4 py-2.5 dark:border-zinc-800/60 dark:bg-zinc-950/60">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
        </div>
        <span className="font-mono text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
          idea-{idea.id}.md
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 rounded-full', STATUS_CLASSES[idea.status])} />
          <Badge variant={idea.status === 'CONVERTED' ? 'success' : idea.status === 'RAW' ? 'warning' : 'default'}>
            {STATUS_LABELS[idea.status]}
          </Badge>
        </div>

        <h3 className="line-clamp-2 text-lg font-black text-slate-950 dark:text-white">{idea.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-slate-600 dark:text-zinc-400">
          {idea.content || 'Bu fikir icin aciklama eklenmemis.'}
        </p>

        <div className="mt-auto grid grid-cols-3 gap-2 pt-5">
          <Metric icon={FileText} label="Girdi" value={idea.entryCount} />
          <Metric icon={Search} label="Arastirma" value={idea.researchCount} />
          <Metric icon={CheckSquare} label="Gorev" value={idea.taskCount} />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-zinc-200/60 pt-3 text-[11px] font-bold text-zinc-500 dark:border-zinc-800/60 dark:text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(idea.updatedAt)}
          </span>
          <span className="inline-flex items-center gap-1 text-cyan-700 opacity-0 transition-opacity group-hover:opacity-100 dark:text-cyan-300">
            Ac <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </button>
  )
}

const Metric: React.FC<{ icon: React.ElementType; label: string; value: number }> = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-zinc-200/70 bg-white/60 p-2 dark:border-zinc-800/60 dark:bg-zinc-950/50">
    <Icon className="mb-1 h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />
    <p className="text-sm font-black text-slate-950 dark:text-white">{value}</p>
    <p className="truncate text-[10px] font-bold text-zinc-500">{label}</p>
  </div>
)
