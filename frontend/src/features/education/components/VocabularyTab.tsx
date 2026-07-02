import React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { VocabularyCard, LanguageLevel, VocabularyType } from '../types'

interface VocabularyTabProps {
  vocabularyCards: VocabularyCard[]
  activeLevel: LanguageLevel
  setActiveLevel: (level: LanguageLevel) => void
  word: string
  setWord: (val: string) => void
  meaning: string
  setMeaning: (val: string) => void
  wordType: VocabularyType
  setWordType: (val: VocabularyType) => void
  handleAddVocabWord: () => void
  handleLeitnerResult: (cardId: number, result: 'known' | 'forgot') => void
  flippedCards: Record<number, boolean>
  setFlippedCards: React.Dispatch<React.SetStateAction<Record<number, boolean>>>
}

const LANGUAGE_LEVELS: Array<{ id: LanguageLevel; label: string; shortLabel: string }> = [
  { id: 'A1_A2', label: 'A1-A2 Başlangıç', shortLabel: 'A1-A2' },
  { id: 'B1', label: 'B1 Orta Seviye', shortLabel: 'B1' },
  { id: 'B2', label: 'B2 İleri Orta', shortLabel: 'B2' },
  { id: 'C1_C2', label: 'C1-C2 İleri', shortLabel: 'C1-C2' },
]

const VOCABULARY_TYPES: VocabularyType[] = ['Noun', 'Verb', 'Adj']

const VocabularyTabComponent: React.FC<VocabularyTabProps> = ({
  vocabularyCards,
  activeLevel,
  setActiveLevel,
  word,
  setWord,
  meaning,
  setMeaning,
  wordType,
  setWordType,
  handleAddVocabWord,
  handleLeitnerResult,
  flippedCards,
  setFlippedCards,
}) => {
  const levelVocabulary = vocabularyCards.filter((card) => {
    // If cards have a level mapping (we check based on level selection)
    // Here we can either filter by activeLevel or show all. The original code filtered by:
    // const levelVocabulary = vocabularyCards
    return true // In original code it filtered or showed all; let's filter if levels are mapped,
    // actually, let's see how levelVocabulary was defined in clean EducationStudio.tsx.
  })

  // Wait! Let's make sure we filter levelVocabulary by level if applicable, or we can just filter it.
  // In the original: levelVocabulary = vocabularyCards. (we will write that exactly)

  return (
    <div className="space-y-6">
      {/* Level Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3">
        {LANGUAGE_LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => setActiveLevel(level.id)}
            className={cn(
              'px-3 py-1.5 text-xs font-bold rounded-xl transition-all border cursor-pointer',
              activeLevel === level.id
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-400'
                : 'bg-transparent border-transparent text-slate-800 dark:text-zinc-400 hover:bg-slate-100/50 dark:hover:bg-zinc-900/40'
            )}
          >
            {level.label}
          </button>
        ))}
      </div>

      {/* Word Adder */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/20 backdrop-blur-xl">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-3">
          Kelime Haznesi Ekle
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="block text-[9px] font-extrabold uppercase text-slate-900 dark:text-zinc-300 tracking-wider mb-1">İngilizce Kelime</label>
            <Input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="English word..."
              className="w-full h-10 px-3 text-xs font-bold"
            />
          </div>
          <div className="sm:col-span-4">
            <label className="block text-[9px] font-extrabold uppercase text-slate-900 dark:text-zinc-300 tracking-wider mb-1">Türkçe Karşılığı</label>
            <Input
              type="text"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="Türkçe karşılığı..."
              className="w-full h-10 px-3 text-xs font-bold"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[9px] font-extrabold uppercase text-slate-900 dark:text-zinc-300 tracking-wider mb-1">Kelime Tipi</label>
            <select
              value={wordType}
              onChange={(e) => setWordType(e.target.value as VocabularyType)}
              className="w-full h-10 px-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white outline-none focus:border-cyan-500/50"
            >
              {VOCABULARY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleAddVocabWord}
            className="sm:col-span-1 h-10 w-full bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center transition-all"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {levelVocabulary.map((card) => {
          const isFlipped = !!flippedCards[card.id]
          return (
            <div key={card.id} className="flex flex-col gap-2">
              <button
                onClick={() =>
                  setFlippedCards((prev) => ({ ...prev, [card.id]: !prev[card.id] }))
                }
                className="h-32 w-full [perspective:800px] text-left outline-none cursor-pointer"
              >
                <div
                  className={cn(
                    'relative w-full h-full rounded-2xl border border-slate-200/60 dark:border-zinc-800/40 bg-white/60 dark:bg-zinc-900/60 transition-transform duration-500 [transform-style:preserve-3d]',
                    isFlipped && '[transform:rotateY(180deg)]'
                  )}
                >
                  {/* Front Side */}
                  <div className="absolute inset-0 flex flex-col justify-between p-4 [backface-visibility:hidden] overflow-hidden">
                    <span className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {card.word}
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase">
                        {card.type}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                        Box {card.box}
                      </span>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 flex flex-col justify-between p-4 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 overflow-hidden">
                    <span className="text-sm font-black truncate">
                      {card.meaning}
                    </span>
                    <span className="text-[9px] font-medium opacity-80">
                      Tarih: {card.nextReview}
                    </span>
                  </div>
                </div>
              </button>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleLeitnerResult(card.id, 'known')}
                  className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase transition-all cursor-pointer"
                >
                  Biliyorum
                </button>
                <button
                  type="button"
                  onClick={() => handleLeitnerResult(card.id, 'forgot')}
                  className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase transition-all cursor-pointer"
                >
                  Unuttum
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const VocabularyTab = React.memo(VocabularyTabComponent)
