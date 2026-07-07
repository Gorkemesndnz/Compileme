import React, { useState } from 'react'
import { CalendarDays, Check, Loader2, MoreVertical, Pencil, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button as MovingBorderButton } from '../../components/ui/moving-border'
import { SketchButton } from '../../components/ui/SketchButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/DropdownMenu'
import { Textarea } from '../../components/ui/Textarea'
import { cn } from '../../lib/utils'
import { IdeaEntry, useAddIdeaEntry, useDeleteIdeaEntry, useUpdateIdeaEntry } from '../../api/ideas'
import { IDEA_TEXTAREA_CLASS } from './ideaStyles'

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
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const addEntry = useAddIdeaEntry(ideaId)
  const updateEntry = useUpdateIdeaEntry(ideaId)
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

  const startEdit = (entry: IdeaEntry) => {
    setEditingEntryId(entry.id)
    setEditingContent(entry.content)
  }

  const cancelEdit = () => {
    setEditingEntryId(null)
    setEditingContent('')
  }

  const saveEdit = async (entryId: number) => {
    if (!editingContent.trim()) return
    try {
      await updateEntry.mutateAsync({
        entryId,
        request: { content: editingContent.trim() },
      })
      cancelEdit()
      toast.success('Gelisim girdisi guncellendi.')
    } catch {
      toast.error('Girdi guncellenemedi.')
    }
  }

  const removeEntry = (entryId: number) => {
    deleteEntry.mutate(entryId, {
      onSuccess: () => {
        if (editingEntryId === entryId) cancelEdit()
        toast.success('Gelisim girdisi silindi.')
      },
      onError: () => toast.error('Girdi silinemedi.'),
    })
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
          className={cn('min-h-[110px]', IDEA_TEXTAREA_CLASS)}
        />
        <div className="flex justify-end">
          <MovingBorderButton
            type="submit"
            disabled={addEntry.isPending || !content.trim()}
            borderRadius="0.875rem"
            duration={2600}
            containerClassName="h-10 min-w-[132px] disabled:cursor-not-allowed disabled:opacity-50"
            className="gap-2 px-4 font-bold text-slate-950 dark:text-white"
          >
            {addEntry.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Girdi ekle
          </MovingBorderButton>
        </div>
      </form>

      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm font-semibold text-zinc-500 dark:border-zinc-800">
            Henuz gelisim girdisi yok.
          </div>
        ) : (
          entries.map((entry) => {
            const isEditing = editingEntryId === entry.id

            return (
              <article key={entry.id} className="relative pl-6">
                <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.75)]" />
                <span className="absolute bottom-0 left-[5px] top-5 w-px bg-zinc-200 dark:bg-zinc-800" />
                <div className="rounded-xl border border-zinc-200/70 bg-white/65 p-4 dark:border-zinc-800/60 dark:bg-black/25">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-500">{formatDate(entry.createdAt)}</span>
                    {!isEditing && (
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger
                          disabled={deleteEntry.isPending || updateEntry.isPending}
                          className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Gelisim girdisi aksiyonlari"
                        >
                          <MovingBorderButton
                            as="div"
                            borderRadius="0.625rem"
                            duration={2200}
                            containerClassName="h-8 w-8"
                            className="p-0"
                          >
                            <MoreVertical className="h-4 w-4 text-slate-600 dark:text-zinc-300" />
                          </MovingBorderButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={8} className="w-44 rounded-xl border-border/70 bg-popover/90 p-1.5 shadow-2xl backdrop-blur-xl">
                          <DropdownMenuItem onSelect={() => startEdit(entry)} className="rounded-lg py-2.5">
                            <Pencil className="mr-2 h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                            Duzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => removeEntry(entry.id)} className="rounded-lg py-2.5 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-300">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editingContent}
                        onChange={(event) => setEditingContent(event.target.value)}
                        className={cn('min-h-[120px]', IDEA_TEXTAREA_CLASS)}
                      />
                      <div className="flex flex-wrap justify-end gap-2">
                        <SketchButton type="button" onClick={cancelEdit}>
                          <X className="mr-2 h-4 w-4" />
                          Vazgec
                        </SketchButton>
                        <SketchButton
                          type="button"
                          disabled={updateEntry.isPending || !editingContent.trim()}
                          onClick={() => void saveEdit(entry.id)}
                        >
                          {updateEntry.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                          Kaydet
                        </SketchButton>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700 dark:text-zinc-300">{entry.content}</p>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
