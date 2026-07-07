import { IdeaStatus } from '../../api/ideas'

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  RAW: 'Ham fikir',
  DEVELOPING: 'Gelistiriliyor',
  CONVERTED: 'Projeye aktarildi',
}

export const IDEA_STATUS_OPTIONS: IdeaStatus[] = ['RAW', 'DEVELOPING', 'CONVERTED']

export const IDEA_STATUS_DOT: Record<IdeaStatus, string> = {
  RAW: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]',
  DEVELOPING: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]',
  CONVERTED: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]',
}

export const IDEA_FIELD_CLASS =
  'border-slate-300/80 bg-white/80 text-slate-950 placeholder:text-slate-500 shadow-sm ring-0 focus:border-cyan-500/70 focus:ring-0 focus:shadow-[0_0_16px_rgba(6,182,212,0.18)] dark:border-zinc-800/90 dark:bg-zinc-950/65 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-cyan-400/60'

export const IDEA_TEXTAREA_CLASS =
  'border-slate-300/80 bg-white/80 text-slate-950 placeholder:text-slate-500 shadow-sm ring-0 focus:border-cyan-500/70 focus:ring-0 focus:shadow-[0_0_16px_rgba(6,182,212,0.18)] dark:border-zinc-800/90 dark:bg-zinc-950/65 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-cyan-400/60'

export const IDEA_INLINE_TITLE_CLASS =
  'h-auto border-0 bg-transparent px-0 py-0 text-3xl font-black shadow-none ring-0 focus:border-transparent focus:ring-0 focus:shadow-none dark:bg-transparent sm:text-4xl'

export const IDEA_INLINE_TEXTAREA_CLASS =
  'min-h-[110px] border-0 bg-transparent px-0 text-sm leading-6 shadow-none ring-0 focus:border-transparent focus:ring-0 focus:shadow-none dark:bg-transparent'

export function ideaBadgeVariant(status: IdeaStatus) {
  if (status === 'CONVERTED') return 'success'
  if (status === 'RAW') return 'warning'
  return 'default'
}
