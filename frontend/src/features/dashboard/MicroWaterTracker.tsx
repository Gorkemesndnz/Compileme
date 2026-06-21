import React, { useState, useEffect, useRef } from 'react'
import { Droplet, Undo, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'

interface MicroWaterTrackerProps {
  waterAmount: number
  waterGoal: number
  waterPercentage: number
  onAddWater: (source: 'GLASS_300' | 'HALF_500' | 'BOTTLE_1500' | 'CUSTOM', amount?: number) => void
  onUndoWater: () => void
  onResetDay: () => void
  hasLogs: boolean
}

export const MicroWaterTracker: React.FC<MicroWaterTrackerProps> = ({
  waterAmount,
  waterGoal,
  waterPercentage,
  onAddWater,
  onUndoWater,
  onResetDay,
  hasLogs
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Preset definitions
  const presets = [
    { label: '+300ml', type: 'GLASS_300' as const, sub: 'Bardak' },
    { label: '+470ml', type: 'CUSTOM' as const, amount: 470, sub: 'Stanley' },
    { label: '+500ml', type: 'HALF_500' as const, sub: 'Yarım' },
    { label: '+1500ml', type: 'BOTTLE_1500' as const, sub: 'Şişe' }
  ]

  return (
    <div className="relative inline-block select-none" ref={popoverRef}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 cursor-pointer group text-neutral-800 dark:text-neutral-200 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors py-2"
        title="Su Takibi"
      >
        <div className="relative">
          <Droplet 
            className={cn(
              "h-5 w-5 stroke-[1.8] transition-transform duration-300 group-hover:scale-110",
              waterPercentage > 0 ? "fill-cyan-500 text-cyan-500" : "text-neutral-500 dark:text-neutral-400"
            )}
          />
          {waterPercentage > 0 && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          )}
        </div>
        <span className="font-mono text-sm font-bold tracking-tight">
          {waterAmount}ml / {waterGoal}ml ({waterPercentage}%)
        </span>
      </div>

      {/* Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              "absolute right-0 mt-2 z-50 w-72 p-4",
              "rounded-2xl shadow-2xl glass-panel text-neutral-800 dark:text-white"
            )}
          >
            {/* Top Section: Thin Progress Bar */}
            <div className="space-y-1 mb-4">
              <div className="flex justify-between items-center text-[11px] font-bold tracking-wider text-neutral-500 dark:text-zinc-400 uppercase">
                <span>Günlük İlerleme</span>
                <span className="font-mono">{waterPercentage}%</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-cyan-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${waterPercentage}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Middle Section: Quick Add Capsule Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => onAddWater(preset.type, preset.amount)}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-3 rounded-full border transition duration-200",
                    "border-neutral-200 bg-white/50 hover:bg-cyan-50 hover:border-cyan-200 text-neutral-800",
                    "dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-cyan-950/20 dark:hover:border-cyan-900/40 dark:text-zinc-200"
                  )}
                >
                  <span className="text-xs font-bold font-mono">{preset.label}</span>
                  <span className="text-[9px] font-medium text-neutral-500 dark:text-zinc-500">{preset.sub}</span>
                </button>
              ))}
            </div>

            {/* Bottom Section: Undo & Reset Buttons with Heavy Shadow Retro Effect */}
            <div className="flex gap-2 justify-between border-t border-neutral-100 dark:border-zinc-800/60 pt-4">
              <button
                onClick={onUndoWater}
                disabled={!hasLogs}
                className={cn(
                  "flex items-center justify-center gap-1.5 flex-1",
                  "px-4 py-2 rounded-md text-xs font-bold transition duration-200 border",
                  "disabled:opacity-40 disabled:hover:shadow-none disabled:cursor-not-allowed",
                  // Light Mode
                  "border-black bg-white text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)]",
                  // Dark Mode uyarlaması
                  "dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)]"
                )}
                title="Son eklenen suyu geri al"
              >
                <Undo className="h-3 w-3" />
                Geri Al
              </button>

              <button
                onClick={onResetDay}
                disabled={!hasLogs}
                className={cn(
                  "flex items-center justify-center gap-1.5 flex-1",
                  "px-4 py-2 rounded-md text-xs font-bold transition duration-200 border",
                  "disabled:opacity-40 disabled:hover:shadow-none disabled:cursor-not-allowed",
                  // Light Mode
                  "border-black bg-white text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)]",
                  // Dark Mode uyarlaması
                  "dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)]"
                )}
                title="Bugünkü tüm su geçmişini temizle"
              >
                <RotateCcw className="h-3 w-3" />
                Sıfırla
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
