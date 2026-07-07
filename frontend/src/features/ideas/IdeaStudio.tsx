import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Loader2, MoreVertical, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '../../components/PageHeader'
import { Button as MovingBorderButton } from '../../components/ui/moving-border'
import { SketchButton } from '../../components/ui/SketchButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/DropdownMenu'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../lib/utils'
import { IdeaDetailResponse, IdeaStatus, useDeleteIdea, useIdea, useUpdateIdea } from '../../api/ideas'
import { IdeaTimeline } from './IdeaTimeline'
import { IdeaResearchPanel } from './IdeaResearchPanel'
import { IdeaTaskPanel } from './IdeaTaskPanel'
import { IdeaConvertPanel } from './IdeaConvertPanel'
import {
  IDEA_INLINE_TEXTAREA_CLASS,
  IDEA_INLINE_TITLE_CLASS,
  IDEA_STATUS_DOT,
  IDEA_STATUS_LABELS,
  IDEA_STATUS_OPTIONS,
} from './ideaStyles'

function formatDate(value?: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function slugifyFilename(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'idea'
}

function buildIdeaMarkdown(data: IdeaDetailResponse, titleOverride: string, contentOverride: string) {
  const title = titleOverride.trim() || data.idea.title || `idea-${data.idea.id}`
  const content = contentOverride.trim() || data.idea.content || ''
  const orderedEntries = [...data.entries].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const orderedResearch = [...data.research].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  return [
    `# ${title}`,
    '',
    content || '_Fikir aciklamasi eklenmemis._',
    '',
    `- Durum: ${IDEA_STATUS_LABELS[data.idea.status]}`,
    `- Olusturuldu: ${formatDate(data.idea.createdAt)}`,
    `- Guncellendi: ${formatDate(data.idea.updatedAt)}`,
    ...(data.idea.convertedProjectId ? [`- Proje ID: ${data.idea.convertedProjectId}`] : []),
    '',
    '## Gelisim Gunlugu',
    '',
    ...(orderedEntries.length > 0
      ? orderedEntries.flatMap((entry) => [
          `### ${formatDate(entry.createdAt)}`,
          entry.content,
          '',
        ])
      : ['_Gelisim girdisi yok._', '']),
    '## Arastirmalar',
    '',
    ...(orderedResearch.length > 0
      ? orderedResearch.flatMap((item) => (
          item.notes
            ? [`- **${item.title}** (${item.type})${item.url ? ` - ${item.url}` : ''}`, `  - ${item.notes}`]
            : [`- **${item.title}** (${item.type})${item.url ? ` - ${item.url}` : ''}`]
        ))
      : ['_Arastirma kaydi yok._']),
    '',
    '## Gorevler',
    '',
    ...(data.tasks.length > 0
      ? data.tasks.map((link) => {
          const date = [link.task.scheduledDate, link.task.scheduledTime].filter(Boolean).join(' ')
          return `- [${link.task.status}] ${link.task.title}${date ? ` - ${date}` : ''}${link.entryId ? ` (girdi #${link.entryId})` : ''}`
        })
      : ['_Bu fikirden gorev uretilmedi._']),
    '',
  ].join('\n')
}

function downloadMarkdown(filename: string, markdown: string) {
  const blobUrl = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = blobUrl
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(blobUrl)
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

  const handleStatusChange = async (status: IdeaStatus) => {
    if (!data?.idea || status === data.idea.status || updateIdea.isPending) return
    try {
      await updateIdea.mutateAsync({
        id: data.idea.id,
        request: {
          title: title.trim() || undefined,
          content: content.trim() || undefined,
          status,
          tags: data.idea.tags,
        },
      })
      toast.success(`Fikir durumu: ${IDEA_STATUS_LABELS[status]}`)
    } catch {
      toast.error('Fikir durumu guncellenemedi.')
    }
  }

  const handleExportMarkdown = () => {
    if (!data?.idea) return
    const exportTitle = title.trim() || data.idea.title || `idea-${data.idea.id}`
    downloadMarkdown(`${slugifyFilename(exportTitle)}-idea-memory.md`, buildIdeaMarkdown(data, title, content))
    toast.success('Fikir hafizasi Markdown olarak indirildi.')
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
        <PageHeader title="Fikir Studyosu" subtitle="Fikir yukleniyor." />
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
        <MovingBorderButton
          type="button"
          onClick={() => navigate('/ideas')}
          borderRadius="0.75rem"
          duration={2400}
          containerClassName="h-10 min-w-[112px]"
          className="gap-2 px-4 font-bold text-slate-950 dark:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Fikirler
        </MovingBorderButton>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            disabled={deleteIdea.isPending}
            className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fikir aksiyonlari"
          >
            <MovingBorderButton
              as="div"
              borderRadius="0.75rem"
              duration={2600}
              containerClassName="h-10 w-10"
              className="p-0"
            >
              <MoreVertical className="h-4 w-4 text-slate-600 dark:text-zinc-300" />
            </MovingBorderButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-60 rounded-xl border-border/70 bg-popover/90 p-1.5 shadow-2xl backdrop-blur-xl">
            <DropdownMenuItem onSelect={handleExportMarkdown} className="rounded-lg py-2.5">
              <Download className="mr-2 h-4 w-4 text-cyan-600 dark:text-cyan-300" />
              Markdown olarak indir
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void handleDelete()} className="rounded-lg py-2.5 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-300">
              <Trash2 className="mr-2 h-4 w-4" />
              Fikri sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <section className="glass-panel overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/75 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/75">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={updateIdea.isPending}
                className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MovingBorderButton
                  as="div"
                  borderRadius="0.75rem"
                  duration={2600}
                  containerClassName="h-10 min-w-[168px]"
                  className="gap-2 px-4 font-bold text-slate-950 dark:text-white"
                >
                  <span className={cn('h-2.5 w-2.5 rounded-full', IDEA_STATUS_DOT[idea.status])} />
                  {IDEA_STATUS_LABELS[idea.status]}
                </MovingBorderButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={8} className="w-56 rounded-xl border-border/70 bg-popover/90 p-1.5 shadow-2xl backdrop-blur-xl">
                <DropdownMenuRadioGroup value={idea.status} onValueChange={(value) => void handleStatusChange(value as IdeaStatus)}>
                  {IDEA_STATUS_OPTIONS.map((status) => (
                    <DropdownMenuRadioItem key={status} value={status} className="rounded-lg py-2.5 font-semibold">
                      <span className={cn('mr-2 h-2.5 w-2.5 rounded-full', IDEA_STATUS_DOT[status])} />
                      {IDEA_STATUS_LABELS[status]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Fikir basligi"
              className={IDEA_INLINE_TITLE_CLASS}
            />
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Fikrin ana aciklamasi..."
              className={IDEA_INLINE_TEXTAREA_CLASS}
            />
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-2 lg:w-72">
            <HeaderMetric label="Girdi" value={entries.length} />
            <HeaderMetric label="Kaynak" value={research.length} />
            <HeaderMetric label="Gorev" value={tasks.length} />
          </div>
        </div>

        <div className="flex justify-end border-t border-border/60 p-4">
          <SketchButton type="button" onClick={handleSave} disabled={updateIdea.isPending}>
            {updateIdea.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Kaydet
          </SketchButton>
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
