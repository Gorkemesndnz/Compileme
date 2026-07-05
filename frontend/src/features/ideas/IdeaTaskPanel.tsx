import React, { useMemo, useState } from 'react'
import { CheckSquare, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { DateTimePicker } from '../dashboard/DateTimePicker'
import { IdeaEntry, IdeaTaskLink, useCreateIdeaTask } from '../../api/ideas'

export const IdeaTaskPanel: React.FC<{ ideaId: number; entries: IdeaEntry[]; tasks: IdeaTaskLink[] }> = ({ ideaId, entries, tasks }) => {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [entryId, setEntryId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const createTask = useCreateIdeaTask(ideaId)

  const entryOptions = useMemo(
    () => [
      { label: 'Fikir geneli', value: '' },
      ...entries.map((entry) => ({ label: entry.content.slice(0, 48), value: String(entry.id) })),
    ],
    [entries],
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    try {
      await createTask.mutateAsync({
        title: title.trim(),
        notes: notes.trim() || undefined,
        entryId: entryId ? Number(entryId) : undefined,
        scheduledDate: date || undefined,
        scheduledTime: time || undefined,
        planningBucket: date ? 'DAY' : 'UNSCHEDULED',
      })
      setTitle('')
      setNotes('')
      setEntryId('')
      setDate('')
      setTime('')
      toast.success('Gorev olusturuldu.')
    } catch {
      toast.error('Gorev olusturulamadi.')
    }
  }

  return (
    <section className="glass-panel rounded-2xl border border-zinc-200/70 bg-white/70 p-5 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/70">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Action items</p>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Fikirden gorev uret</h2>
        </div>
        <CheckSquare className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Gorev basligi" />
        <Select value={entryId} onChange={setEntryId} options={entryOptions} />
        <DateTimePicker date={date} time={time} onDateChange={setDate} onTimeChange={setTime} />
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Gorev notu opsiyonel" />
        <Button type="submit" disabled={createTask.isPending || !title.trim()} className="w-full gap-2">
          {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Gorev olustur
        </Button>
      </form>

      <div className="mt-5 space-y-2">
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs font-semibold text-zinc-500 dark:border-zinc-800">
            Bu fikirden gorev uretilmedi.
          </div>
        ) : (
          tasks.map((link) => (
            <div key={link.id} className="rounded-xl border border-zinc-200/70 bg-white/65 p-3 dark:border-zinc-800/60 dark:bg-black/25">
              <p className="text-sm font-black text-slate-950 dark:text-white">{link.task.title}</p>
              <p className="mt-1 text-[11px] font-bold text-zinc-500">
                {link.task.scheduledDate || 'Backlog'} {link.task.scheduledTime || ''}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
