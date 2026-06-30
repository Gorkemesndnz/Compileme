import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getBrandIcon, getGlowColor } from './studioHelpers'
import { EducationResource } from '../types'
import { toast } from 'sonner'

interface LinklerTabProps {
  resources: EducationResource[]
  isLinkAdderOpen: boolean
  setIsLinkAdderOpen: React.Dispatch<React.SetStateAction<boolean>>
  newLinkName: string
  setNewLinkName: (val: string) => void
  newLinkUrl: string
  setNewLinkUrl: (val: string) => void
  handleAddLink: () => void
}

export const LinklerTab: React.FC<LinklerTabProps> = ({
  resources,
  isLinkAdderOpen,
  setIsLinkAdderOpen,
  newLinkName,
  setNewLinkName,
  newLinkUrl,
  setNewLinkUrl,
  handleAddLink,
}) => {
  const linkResources = resources.filter((r) => r.type === 'LINK')

  return (
    <div className="space-y-6">
      {/* Hızlı Link Ekleme Modülü */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Harici Platform Fırlatma Rampası
          </h3>
          <p className="text-[11px] text-slate-900 dark:text-zinc-300 mt-0.5">
            Udemy, YouTube, GitHub bağlantılarınızı tek merkezden fırlatın
          </p>
        </div>
        <Button
          onClick={() => setIsLinkAdderOpen((prev) => !prev)}
          variant="glass"
          size="sm"
          className="text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 px-3.5 py-1.5 rounded-full"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Bağlantı Ekle</span>
        </Button>
      </div>

      <AnimatePresence>
        {isLinkAdderOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-950/10 backdrop-blur-xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <label className="block text-[9px] font-extrabold uppercase text-slate-900 dark:text-zinc-300 tracking-wider mb-1">
                  Platform Adı (Örn: GitHub Repom)
                </label>
                <Input
                  type="text"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  placeholder="Örn: GitHub Deposu..."
                  className="w-full h-10 px-3 text-xs font-bold"
                />
              </div>
              <div className="sm:col-span-5">
                <label className="block text-[9px] font-extrabold uppercase text-slate-900 dark:text-zinc-300 tracking-wider mb-1">
                  Bağlantı URL'si
                </label>
                <Input
                  type="text"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="github.com/username/repo..."
                  className="w-full h-10 px-3 text-xs font-bold"
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  onClick={handleAddLink}
                  className="w-full h-10 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold transition-all"
                >
                  Ekle
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Eklenti Kart Izgarası */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {linkResources.map((link) => (
          <div
            key={link.id}
            onClick={() => {
              window.open(link.url_or_path, '_blank')
              toast.success('Platform fırlatıldı!')
            }}
            className={cn(
              'p-5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/40 bg-white/60 dark:bg-zinc-900/60 cursor-pointer flex flex-col justify-between h-32 group relative overflow-hidden transition-all duration-300',
              getGlowColor(link.url_or_path)
            )}
          >
            <div className="absolute -right-4 -top-4 w-12 h-12 bg-cyan-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-850 text-slate-700 dark:text-zinc-300">
                {getBrandIcon(link.url_or_path)}
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                {link.name}
              </span>
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-slate-900 dark:text-zinc-300 truncate max-w-[150px] font-mono">
                {link.url_or_path}
              </span>
              <ExternalLink className="h-4 w-4 text-slate-400 dark:text-zinc-650 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
