import React, { useState } from 'react'
import { ArrowRight, Lightbulb, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { cn } from '../../lib/utils'
import { IdeaResponse, useCreateIdea } from '../../api/ideas'

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
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-500">
            Baslik opsiyonel; bos kalirsa ilk cumleden olusur.
          </p>
        </div>
      </div>

      <div className={cn('grid gap-3', compact ? 'lg:grid-cols-[240px_1fr_auto]' : 'grid-cols-1')}>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Opsiyonel fikir basligi"
          className="h-11"
        />
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Aklina gelen fikri, problemi, hedef kitleyi veya ilk notu yaz..."
          className={cn('min-h-[96px]', compact && 'lg:min-h-[44px]')}
        />
        <Button
          type="submit"
          variant="primary"
          disabled={createIdea.isPending || (!title.trim() && !content.trim())}
          className={cn('gap-2', compact && 'self-start')}
        >
          {createIdea.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Kaydet
        </Button>
      </div>
    </form>
  )
}
