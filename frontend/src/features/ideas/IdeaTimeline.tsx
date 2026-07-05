import React, { useState } from 'react'
import { CalendarDays, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Textarea'
import { IdeaEntry, useAddIdeaEntry, useDeleteIdeaEntry } from '../../api/ideas'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export const IdeaTimeline: React.FC<{ ideaId: number; entries: IdeaEntry[] }> = ({ ideaId, entries }) => {
  const [content, setContent] = useState('')
  const addEntry = useAddIdeaEntry(ideaId)
  const deleteEntry = useDeleteIdeaEntry(ideaId)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!content.trim()) return
    try {
      await addEntry.mutateAsync({ content: content.trim() })
      setContent('')
      toast.success('Gelisim girdisi eklendi.')
    } catch {
      toast.error('Girdi eklenemedi.')
    }
  }

  return (
    <section className="glass-panel rounded-2xl border border-zinc-200/70 bg-white/70 p-5 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/70">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Gelisim gunlugu</p>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Fikrin zaman cizgisi</h2>
        </div>
        <CalendarDays className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
      </div>

      <form onSubmit={handleSubmit} className="mb-5 space-y-3">
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Bugun bu fikre ne eklendi? Ozellik, hedef kitle, risk, not..."
          className="min-h-[110px]"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={addEntry.isPending || !content.trim()} className="gap-2">
            {addEntry.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Girdi ekle
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm font-semibold text-zinc-500 dark:border-zinc-800">
            Henuz gelisim girdisi yok.
          </div>
        ) : (
          entries.map((entry) => (
            <article key={entry.id} className="relative pl-6">
              <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.75)]" />
              <span className="absolute bottom-0 left-[5px] top-5 w-px bg-zinc-200 dark:bg-zinc-800" />
              <div className="rounded-xl border border-zinc-200/70 bg-white/65 p-4 dark:border-zinc-800/60 dark:bg-black/25">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-500">{formatDate(entry.createdAt)}</span>
                  <Button
                    type="button"
                    variant="dangerGhost"
                    size="icon"
                    onClick={() => deleteEntry.mutate(entry.id)}
                    title="Girdiyi sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700 dark:text-zinc-300">{entry.content}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
