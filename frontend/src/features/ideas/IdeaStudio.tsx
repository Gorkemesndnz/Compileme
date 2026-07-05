import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '../../components/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../lib/utils'
import { IdeaStatus, useDeleteIdea, useIdea, useUpdateIdea } from '../../api/ideas'
import { IdeaTimeline } from './IdeaTimeline'
import { IdeaResearchPanel } from './IdeaResearchPanel'
import { IdeaTaskPanel } from './IdeaTaskPanel'
import { IdeaConvertPanel } from './IdeaConvertPanel'

const STATUS_LABELS: Record<IdeaStatus, string> = {
  RAW: 'Ham fikir',
  DEVELOPING: 'Gelistiriliyor',
  CONVERTED: 'Projeye donustu',
}

const STATUS_DOT: Record<IdeaStatus, string> = {
  RAW: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]',
  DEVELOPING: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]',
  CONVERTED: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]',
}

export const IdeaStudio: React.FC<{ ideaId: number }> = ({ ideaId }) => {
  const navigate = useNavigate()
  const { data, isLoading } = useIdea(ideaId)
  const updateIdea = useUpdateIdea()
  const deleteIdea = useDeleteIdea()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (data?.idea) {
      setTitle(data.idea.title || '')
      setContent(data.idea.content || '')
    }
  }, [data?.idea])

  const handleSave = async () => {
    if (!data?.idea) return
    try {
      await updateIdea.mutateAsync({
        id: data.idea.id,
        request: {
          title: title.trim() || undefined,
          content: content.trim() || undefined,
          status: data.idea.status,
          tags: data.idea.tags,
        },
      })
      toast.success('Fikir guncellendi.')
    } catch {
      toast.error('Fikir guncellenemedi.')
    }
  }

  const handleDelete = async () => {
    if (!data?.idea) return
    if (!window.confirm('Bu fikri kalici olarak silmek istiyor musun?')) return
    try {
      await deleteIdea.mutateAsync(data.idea.id)
      toast.success('Fikir silindi.')
      navigate('/ideas')
    } catch {
      toast.error('Fikir silinemedi.')
    }
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Fikir Stüdyosu" subtitle="Fikir yukleniyor." />
        <Skeleton className="h-52 rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    )
  }

  const { idea, entries, research, tasks } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate('/ideas')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Fikirler
        </Button>
        <Button type="button" variant="dangerGhost" onClick={handleDelete} disabled={deleteIdea.isPending} className="gap-2">
          <Trash2 className="h-4 w-4" />
          Sil
        </Button>
      </div>

      <section className="glass-panel overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/75 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/75">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className={cn('h-2.5 w-2.5 rounded-full', STATUS_DOT[idea.status])} />
              <Badge variant={idea.status === 'CONVERTED' ? 'success' : idea.status === 'RAW' ? 'warning' : 'default'}>
                {STATUS_LABELS[idea.status]}
              </Badge>
            </div>

            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Fikir basligi"
              className="h-auto border-none bg-transparent px-0 py-0 text-3xl font-black shadow-none focus:shadow-none dark:bg-transparent sm:text-4xl"
            />
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Fikrin ana aciklamasi..."
              className="min-h-[110px] border-none bg-transparent px-0 text-sm leading-6 shadow-none focus:ring-0 dark:bg-transparent"
            />
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-2 lg:w-72">
            <HeaderMetric label="Girdi" value={entries.length} />
            <HeaderMetric label="Kaynak" value={research.length} />
            <HeaderMetric label="Gorev" value={tasks.length} />
          </div>
        </div>

        <div className="flex justify-end border-t border-border/60 p-4">
          <Button type="button" onClick={handleSave} disabled={updateIdea.isPending} className="gap-2">
            {updateIdea.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Kaydet
          </Button>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <IdeaTimeline ideaId={idea.id} entries={entries} />
        <div className="space-y-6">
          <IdeaConvertPanel idea={idea} />
          <IdeaResearchPanel ideaId={idea.id} research={research} />
          <IdeaTaskPanel ideaId={idea.id} entries={entries} tasks={tasks} />
        </div>
      </div>
    </div>
  )
}

const HeaderMetric: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-xl border border-zinc-200/70 bg-white/60 p-3 text-center dark:border-zinc-800/60 dark:bg-black/25">
    <p className="text-xl font-black text-slate-950 dark:text-white">{value}</p>
    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{label}</p>
  </div>
)
