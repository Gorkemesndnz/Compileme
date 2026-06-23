import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/Dialog'
import { ALL_FEATURES, FeatureId } from './FeatureNavigationBar'
import { Check } from 'lucide-react'
import { cn } from '../../../lib/utils'

interface FeatureToggleModalProps {
  isOpen: boolean
  onClose: () => void
  activeFeatures: FeatureId[]
  onToggleFeature: (id: FeatureId) => void
}

export const FeatureToggleModal: React.FC<FeatureToggleModalProps> = ({
  isOpen,
  onClose,
  activeFeatures,
  onToggleFeature,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border border-zinc-200/60 dark:border-zinc-800/40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Control Room Özellikleri
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Bu fazın kontrol odasında aktif olarak kullanmak istediğiniz modülleri seçin. Pasif yapılan modüllerin verileri kaybolmaz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {ALL_FEATURES.map((feature) => {
            const Icon = feature.icon
            const isChecked = activeFeatures.includes(feature.id)

            return (
              <button
                key={feature.id}
                onClick={() => onToggleFeature(feature.id)}
                className={cn(
                  'w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-200',
                  isChecked
                    ? 'border-cyan-500/30 bg-cyan-50/50 dark:border-cyan-400/20 dark:bg-cyan-950/20 hover:bg-cyan-50 dark:hover:bg-cyan-950/30'
                    : 'border-zinc-200/60 bg-zinc-50/30 hover:bg-zinc-50 dark:border-zinc-800/50 dark:bg-zinc-900/10 dark:hover:bg-zinc-900/20'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-xl transition-colors',
                      isChecked
                        ? 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400'
                        : 'bg-zinc-150/50 text-zinc-400 dark:bg-zinc-800/50 dark:text-zinc-500'
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-800 dark:text-slate-200">
                      {feature.label}
                    </span>
                    <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {feature.id === 'tasks' && 'Fazın ana yapılacaklar ve görevler listesi.'}
                      {feature.id === 'subphases' && 'Faz altındaki Notion stili iç içe sayfalar.'}
                      {feature.id === 'db_schema' && 'Mermaid ER diyagramı ve veritabanı notları.'}
                      {feature.id === 'api_endpoints' && 'Endpointler, şemalar ve geliştirici notları.'}
                      {feature.id === 'tech_memory' && 'Teknoloji yığını, ADR kararları, yer imleri ve notlar.'}
                    </span>
                  </div>
                </div>

                <div
                  className={cn(
                    'h-5 w-5 rounded-lg border flex items-center justify-center transition-all',
                    isChecked
                      ? 'border-cyan-500 bg-cyan-500 text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-black shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                      : 'border-zinc-300 dark:border-zinc-700 bg-transparent'
                  )}
                >
                  {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-150 dark:border-zinc-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-400 dark:hover:bg-zinc-900/30 transition-all cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
