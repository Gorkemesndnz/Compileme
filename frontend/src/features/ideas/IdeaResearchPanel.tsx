import React, { useState } from 'react'
import { ExternalLink, Loader2, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button as MovingBorderButton } from '../../components/ui/moving-border'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { IdeaResearch, IdeaResearchType, useAddIdeaResearch, useDeleteIdeaResearch } from '../../api/ideas'
import { IDEA_FIELD_CLASS, IDEA_TEXTAREA_CLASS } from './ideaStyles'

const researchTypeOptions: Array<{ label: string; value: IdeaResearchType }> = [
  { label: 'Referans', value: 'REFERENCE' },
  { label: 'Rakip', value: 'COMPETITOR' },
  { label: 'Pazar', value: 'MARKET' },
  { label: 'Ilham', value: 'INSPIRATION' },
  { label: 'Diger', value: 'OTHER' },
]

export const IdeaResearchPanel: React.FC<{ ideaId: number; research: IdeaResearch[] }> = ({ ideaId, research }) => {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState<IdeaResearchType>('REFERENCE')
  const [notes, setNotes] = useState('')
  const addResearch = useAddIdeaResearch(ideaId)
  const deleteResearch = useDeleteIdeaResearch(ideaId)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    try {
      await addResearch.mutateAsync({
        title: title.trim(),
        url: url.trim() || undefined,
        type,
        notes: notes.trim() || undefined,
      })
      setTitle('')
      setUrl('')
      setType('REFERENCE')
      setNotes('')
      toast.success('Arastirma kaydi eklendi.')
    } catch {
      toast.error('Arastirma eklenemedi.')
    }
  }

  return (
    <section className="glass-panel rounded-2xl border border-zinc-200/70 bg-white/70 p-5 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/70">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Research vault</p>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Ornekler ve kaynaklar</h2>
        </div>
        <Search className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Kaynak basligi" className={IDEA_FIELD_CLASS} />
        <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="URL" className={IDEA_FIELD_CLASS} />
        <Select value={type} onChange={setType} options={researchTypeOptions} />
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Bu kaynak fikre ne anlatiyor?" className={IDEA_TEXTAREA_CLASS} />
        <MovingBorderButton
          type="submit"
          disabled={addResearch.isPending || !title.trim()}
          borderRadius="0.875rem"
          duration={2600}
          containerClassName="h-10 w-full disabled:cursor-not-allowed disabled:opacity-50"
          className="gap-2 px-4 font-bold text-slate-950 dark:text-white"
        >
          {addResearch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Kaynak ekle
        </MovingBorderButton>
      </form>

      <div className="mt-5 space-y-3">
        {research.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs font-semibold text-zinc-500 dark:border-zinc-800">
            Arastirma kaydi yok.
          </div>
        ) : (
          research.map((item) => (
            <article key={item.id} className="rounded-xl border border-zinc-200/70 bg-white/65 p-4 dark:border-zinc-800/60 dark:bg-black/25">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950 dark:text-white">{item.title}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">{item.type}</p>
                </div>
                <MovingBorderButton
                  type="button"
                  onClick={() => deleteResearch.mutate(item.id)}
                  borderRadius="0.625rem"
                  duration={2200}
                  containerClassName="h-8 w-8 shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                  className="p-0"
                  disabled={deleteResearch.isPending}
                  title="Kaynagi sil"
                >
                  <Trash2 className="h-4 w-4" />
                </MovingBorderButton>
              </div>
              {item.notes && <p className="mt-2 line-clamp-3 text-xs font-medium leading-5 text-zinc-500 dark:text-zinc-400">{item.notes}</p>}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 hover:underline dark:text-cyan-300"
                >
                  Kaynagi ac <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  )
}
