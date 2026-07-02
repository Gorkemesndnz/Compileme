import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CheatsheetItem } from '../types'

interface CheatsheetTabProps {
  cheatsheetItems: CheatsheetItem[]
  keyConcept: string
  setKeyConcept: (val: string) => void
  conceptDescription: string
  setConceptDescription: (val: string) => void
  handleAddCheatItem: () => void
  handleDeleteCheatItem: (conceptId: number) => void
}

const CheatsheetTabComponent: React.FC<CheatsheetTabProps> = ({
  cheatsheetItems,
  keyConcept,
  setKeyConcept,
  conceptDescription,
  setConceptDescription,
  handleAddCheatItem,
  handleDeleteCheatItem,
}) => {
  return (
    <div className="space-y-6">
      {/* Cheatsheet Adder */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/20 backdrop-blur-xl">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-3">
          Kilit Teknik Kavram Ekle (Cheatsheet)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4">
            <label className="block text-[9px] font-extrabold uppercase text-slate-900 dark:text-zinc-300 tracking-wider mb-1">Anahtar Terim / Konsept</label>
            <Input
              type="text"
              value={keyConcept}
              onChange={(e) => setKeyConcept(e.target.value)}
              placeholder="Örn: ACID Standartları..."
              className="w-full h-10 px-3 text-xs font-bold"
            />
          </div>
          <div className="md:col-span-7">
            <label className="block text-[9px] font-extrabold uppercase text-slate-900 dark:text-zinc-300 tracking-wider mb-1">Özet Teknik Açıklama</label>
            <Input
              type="text"
              value={conceptDescription}
              onChange={(e) => setConceptDescription(e.target.value)}
              placeholder="Kısa ve net ezber bilgisi..."
              className="w-full h-10 px-3 text-xs font-bold"
            />
          </div>
          <Button
            onClick={handleAddCheatItem}
            className="md:col-span-1 h-10 w-full bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center transition-all"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cheatsheet Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cheatsheetItems.map((item) => (
          <div
            key={item.id}
            className="relative p-4 pr-10 rounded-xl border border-slate-200/60 dark:border-zinc-800/40 bg-white/60 dark:bg-zinc-900/60 flex flex-col gap-1.5 animate-in fade-in duration-300"
          >
            <button
              onClick={() => handleDeleteCheatItem(item.id)}
              className="absolute right-3 top-3 p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:text-zinc-600 hover:bg-red-500/10 transition-all cursor-pointer"
              title="Sil"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-black text-slate-900 dark:text-white">
              {item.keyConcept}
            </span>
            <p className="text-[11px] font-medium text-slate-600 dark:text-zinc-300 leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export const CheatsheetTab = React.memo(CheatsheetTabComponent)
