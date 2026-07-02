import React from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Education, EducationResource, ResourceNote } from '../types'

interface NotlarTabProps {
  selectedResourceId: number | null | undefined
  resources: EducationResource[]
  saveState: 'idle' | 'saving' | 'saved'
  isNotesDirty: boolean
  handleSaveNotes: () => void
  activeNoteResourceKey: string
  resourceNoteItems: Record<string, ResourceNote[]>
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

const NotlarTabComponent: React.FC<NotlarTabProps> = ({
  selectedResourceId,
  resources,
  saveState,
  isNotesDirty,
  handleSaveNotes,
  activeNoteResourceKey,
  resourceNoteItems,
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
  const selectedResource = selectedResourceId
    ? resources.find((resource) => resource.id === selectedResourceId)
    : undefined
  const activeResourceNotes = resourceNoteItems[activeNoteResourceKey] || []
  const hasActiveNote = !!activeResourceNoteId || activeResourceNotes.length > 0
  const contextLabel = selectedResource?.name || 'Kurs genel notları'

  return (
    <div className="flex h-full min-h-[350px] min-w-0 flex-col">
      <div className="flex shrink-0 flex-col justify-between gap-3 border-b border-slate-200 pb-3 dark:border-zinc-800 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-500">
            Not bağlamı
          </p>
          <h3 className="mt-1 truncate text-sm font-black text-slate-900 dark:text-white">
            {contextLabel}
          </h3>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
            Not seçimi sol kaynak ağacından yapılır.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase text-cyan-600 dark:text-cyan-400">
            {saveState === 'saving'
              ? 'Kaydediliyor...'
              : isNotesDirty
                ? 'Kaydedilmemiş değişiklikler var'
                : 'Tüm değişiklikler kaydedildi'}
          </span>
          <Button
            type="button"
            onClick={() => handleCreateNoteForResource(activeNoteResourceKey)}
            variant="secondary"
            size="sm"
            className="h-9 font-bold"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            <span>Yeni Not</span>
          </Button>
          <Button
            type="button"
            onClick={handleSaveNotes}
            variant="secondary"
            size="sm"
            className={cn(
              'h-9 text-xs font-black uppercase',
              isNotesDirty
                ? 'border-emerald-600 bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:bg-emerald-600'
                : 'cursor-default text-slate-500 dark:text-zinc-400'
            )}
            disabled={saveState === 'saving' || !isNotesDirty}
          >
            <Save className="h-3.5 w-3.5" />
            <span>Kaydet</span>
          </Button>
        </div>
      </div>

      {!hasActiveNote ? (
        <div className="mt-4 flex min-h-[320px] flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/55 p-8 text-center text-xs font-bold text-slate-700 dark:border-zinc-800 dark:bg-zinc-950/25 dark:text-zinc-300">
          Soldan bir not seçin veya bu kaynak için yeni not oluşturun.
        </div>
      ) : (
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <div className="mb-3 flex items-center gap-2">
            <Input
              value={noteTitleDraft}
              onChange={(event) => setNoteTitleDraft(event.target.value)}
              placeholder="Not başlığı..."
              className="h-11 flex-1 text-sm font-black"
            />
            {activeResourceNoteId && (
              <Button
                type="button"
                onClick={() => handleDeleteNoteForResource(activeNoteResourceKey, activeResourceNoteId)}
                variant="dangerGhost"
                size="icon"
                className="h-11 w-11"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {education?.type === 'LANGUAGE' ? (
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="flex min-h-0 flex-col lg:col-span-8">
                <Textarea
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                  placeholder="Write your technical summary or speaking diary in English..."
                  className="min-h-[250px] w-full flex-1 text-xs font-bold leading-6"
                />
              </div>

              <div className="glass-panel flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/30 p-4 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/20 lg:col-span-4">
                <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  Çeviri & Sözlük Asistanı
                </h5>
                <Textarea
                  value={translateInput}
                  onChange={(event) => setTranslateInput(event.target.value)}
                  placeholder="Çevrilecek ifadeyi girin..."
                  className="h-20 w-full text-xs"
                />
                <Button type="button" onClick={handleQuickTranslate} variant="primary" className="w-full text-xs font-bold">
                  Çevir
                </Button>
                {translateResult && (
                  <div className="mt-2 whitespace-pre-line rounded-xl border border-slate-200 bg-white/60 p-3 text-[11px] font-semibold leading-relaxed text-slate-900 dark:border-zinc-800 dark:bg-black/35 dark:text-zinc-300">
                    {translateResult}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Textarea
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              placeholder="# Cornell Not Alma Metodu&#10;&#10;## Kavramlar & İpuçları&#10;- Terim 1: Kısaca ipucu...&#10;&#10;## Detaylı Ders Notları&#10;- Buraya doküman veya videodaki tüm önemli yerleri yazın...&#10;&#10;## Özet&#10;- Konuyu kendi kelimelerinizle 2 satırda özetleyin..."
              className="min-h-[300px] w-full flex-1 text-xs font-bold leading-6"
            />
          )}
        </div>
      )}
    </div>
  )
}

export const NotlarTab = React.memo(NotlarTabComponent)
