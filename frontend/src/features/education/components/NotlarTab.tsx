import React from 'react'
import { Save, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ResourceNote, EducationResource, Education } from '../types'

interface NotlarTabProps {
  selectedResourceId: number | null | undefined
  handleNoteTopicChange: (val: string) => void
  resources: EducationResource[]
  saveState: 'idle' | 'saving' | 'saved'
  isNotesDirty: boolean
  handleSaveNotes: () => void
  activeNoteResourceKey: string
  resourceNoteItems: Record<string, ResourceNote[]>
  handleNoteItemClick: (noteId: string) => void
  activeResourceNoteId: string | null
  handleCreateNoteForResource: (resourceKey: string) => void
  handleDeleteNoteForResource: (resourceKey: string, noteId: string) => void
  noteTitleDraft: string
  setNoteTitleDraft: (val: string) => void
  notesDraft: string
  setNotesDraft: (val: string) => void
  education: Education | undefined
  translateInput: string
  setTranslateInput: (val: string) => void
  translateResult: string
  handleQuickTranslate: () => void
}

export const NotlarTab: React.FC<NotlarTabProps> = ({
  selectedResourceId,
  handleNoteTopicChange,
  resources,
  saveState,
  isNotesDirty,
  handleSaveNotes,
  activeNoteResourceKey,
  resourceNoteItems,
  handleNoteItemClick,
  activeResourceNoteId,
  handleCreateNoteForResource,
  handleDeleteNoteForResource,
  noteTitleDraft,
  setNoteTitleDraft,
  notesDraft,
  setNotesDraft,
  education,
  translateInput,
  setTranslateInput,
  translateResult,
  handleQuickTranslate,
}) => {
  const activeResourceNotes = resourceNoteItems[activeNoteResourceKey] || []

  return (
    <div className="flex flex-col h-full min-h-[350px]">
      {/* Dropdown Topic Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-zinc-350">
            Konu Seçimi:
          </label>
          <select
            value={selectedResourceId === null || selectedResourceId === undefined ? 'general' : selectedResourceId}
            onChange={(e) => handleNoteTopicChange(e.target.value)}
            className="h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white outline-none"
          >
            <option value="general">Kurs Genel Notları</option>
            {resources.map((res) => (
              <option key={res.id} value={res.id}>
                {res.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-extrabold uppercase text-cyan-600 dark:text-cyan-400">
            {saveState === 'saving'
              ? 'Kaydediliyor...'
              : isNotesDirty
                ? 'Kaydedilmemiş Değişiklikler Var'
                : 'Tüm Değişiklikler Kaydedildi'}
          </span>
          <Button
            type="button"
            onClick={handleSaveNotes}
            variant="glass"
            size="sm"
            className={cn(
              "h-9 px-3 py-1.5 text-xs font-black uppercase rounded-xl transition-all cursor-pointer border",
              isNotesDirty
                ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse"
                : "bg-slate-100 dark:bg-zinc-850 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700/50 cursor-default"
            )}
            disabled={saveState === 'saving' || !isNotesDirty}
          >
            <Save className="h-3.5 w-3.5" />
            <span>Kaydet</span>
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-4 flex-1 min-h-0">
        <aside className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/55 dark:bg-zinc-950/25 backdrop-blur-xl p-3 shadow-md flex flex-col gap-3 min-h-[260px]">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-zinc-800/60 pb-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Not basliklari
              </p>
              <p className="text-[11px] font-bold text-slate-905 dark:text-white">
                {activeResourceNotes.length} not
              </p>
            </div>
            <Button
              type="button"
              onClick={() => handleCreateNoteForResource(activeNoteResourceKey)}
              variant="outline"
              size="sm"
              className="h-7 text-[10px] px-2 rounded-full font-bold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>Yeni</span>
            </Button>
          </div>

          <div className="space-y-2 overflow-y-auto pr-1">
            {activeResourceNotes.length === 0 ? (
              <button
                type="button"
                onClick={() => handleCreateNoteForResource(activeNoteResourceKey)}
                className="w-full rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 p-4 text-left text-xs font-bold text-slate-700 dark:text-zinc-350 hover:border-cyan-500/40 hover:text-cyan-700 dark:hover:text-cyan-300"
              >
                Bu kaynak için ilk notu ekle.
              </button>
            ) : (
              activeResourceNotes.map((note) => {
                const active = activeResourceNoteId === note.id
                return (
                  <div
                    key={note.id}
                    className={cn(
                      'group flex items-center gap-2 rounded-xl border p-2 transition-all',
                      active
                        ? 'border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_12px_rgba(6,182,212,0.14)]'
                        : 'border-slate-200/70 dark:border-zinc-800/70 bg-white/50 dark:bg-zinc-900/30 hover:bg-white/80 dark:hover:bg-zinc-900/50'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleNoteItemClick(note.id)}
                      className="min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <p className="truncate text-xs font-black text-slate-905 dark:text-white">
                        {note.title || 'Başlıksız Not'}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[10px] font-semibold text-slate-500 dark:text-zinc-500">
                        {note.content || 'Boş not'}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNoteForResource(activeNoteResourceKey, note.id)}
                      className="rounded-lg p-1 text-slate-400 opacity-100 transition-all hover:bg-red-500/10 hover:text-red-500 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </aside>

        {/* Text Editor Area */}
        <div className="flex flex-col min-h-[320px]">
          <Input
            value={noteTitleDraft}
            onChange={(e) => setNoteTitleDraft(e.target.value)}
            placeholder="Not basligi..."
            className="mb-3 h-11 text-sm font-black"
          />
          {education?.type === 'LANGUAGE' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
              <div className="lg:col-span-8 flex flex-col">
                <Textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Write your technical summary or speaking diary in English..."
                  className="w-full flex-1 min-h-[250px] text-xs font-bold leading-6"
                />
              </div>

              <div className="lg:col-span-4 glass-panel p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/20 backdrop-blur-xl flex flex-col gap-3">
                <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  Çeviri & Sözlük Asistanı
                </h5>
                <Textarea
                  value={translateInput}
                  onChange={(e) => setTranslateInput(e.target.value)}
                  placeholder="Çevirilecek ifadeyi girin..."
                  className="w-full h-20 text-xs"
                />
                <Button
                  type="button"
                  onClick={handleQuickTranslate}
                  className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold transition-all"
                >
                  Çevir
                </Button>
                {translateResult && (
                  <div className="mt-2 p-3 rounded-xl bg-white/60 dark:bg-black/35 text-[11px] font-semibold text-slate-900 dark:text-zinc-350 leading-relaxed whitespace-pre-line border border-slate-200 dark:border-zinc-800">
                    {translateResult}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="# Cornell Not Alma Metodu&#10;&#10;## Kavramlar & İpuçları&#10;- Terim 1: Kısaca ipucu...&#10;&#10;## Detaylı Ders Notları&#10;- Buraya döküman veya videodaki tüm önemli yerleri yazın...&#10;&#10;## Özet&#10;- Konuyu kendi kelimelerinizle 2 satırda özetleyin..."
              className="w-full flex-1 min-h-[300px] text-xs font-bold leading-6"
            />
          )}
        </div>
      </div>
    </div>
  )
}
