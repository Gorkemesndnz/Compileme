import React, { useState } from 'react'
import { ArrowRight, Lightbulb, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Button as MovingBorderButton } from '../../components/ui/moving-border'
import { cn } from '../../lib/utils'
import { IdeaResponse, useCreateIdea } from '../../api/ideas'
import { IDEA_FIELD_CLASS, IDEA_TEXTAREA_CLASS } from './ideaStyles'

interface IdeaComposerProps {
  compact?: boolean
  onCreated?: (idea: IdeaResponse) => void
  className?: string
}

export const IdeaComposer: React.FC<IdeaComposerProps> = ({ compact = false, onCreated, className }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const createIdea = useCreateIdea()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() && !content.trim()) return

    try {
      const idea = await createIdea.mutateAsync({
        title: title.trim() || undefined,
        content: content.trim() || title.trim(),
        status: 'RAW',
      })
      setTitle('')
      setContent('')
      toast.success('Fikir kaydedildi.')
      onCreated?.(idea)
    } catch {
      toast.error('Fikir kaydedilemedi.')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'glass-panel rounded-2xl border border-zinc-200/70 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/70',
        !compact && 'mx-auto max-w-3xl p-6',
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
            Fikir yakala
          </p>
        </div>
      </div>

      <div className={cn('grid gap-3', compact ? 'lg:grid-cols-[240px_minmax(0,1fr)_auto] lg:items-end' : 'grid-cols-1')}>
        <label className="space-y-2">
          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
            Fikir basligi <span className="text-cyan-600 dark:text-cyan-300">*</span>
          </span>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Fikir basligi"
            className={cn('h-11', IDEA_FIELD_CLASS)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Ilk not</span>
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Aklina gelen fikri, problemi, hedef kitleyi veya ilk notu yaz..."
            className={cn('min-h-[96px]', IDEA_TEXTAREA_CLASS, compact && 'lg:min-h-[44px]')}
          />
        </label>
        <MovingBorderButton
          type="submit"
          disabled={createIdea.isPending || (!title.trim() && !content.trim())}
          borderRadius="0.875rem"
          duration={2600}
          containerClassName={cn('h-11 disabled:cursor-not-allowed disabled:opacity-50', compact ? 'lg:w-[132px]' : 'w-full')}
          className="gap-2 px-4 font-bold text-slate-950 dark:text-white"
        >
          {createIdea.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Kaydet
        </MovingBorderButton>
      </div>
    </form>
  )
}
