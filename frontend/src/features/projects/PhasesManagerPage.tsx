import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  CalendarDays,
  ChevronRight,
  GitBranch,
  Plus,
  Trash2,
  Clock,
  Menu,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { Project, ProjectPhase, ProjectStatus } from '../../api/projects'
import { Task } from '../../api/tasks'
import { Button as MovingBorderButton } from '../../components/ui/moving-border'
import { SketchButton } from '../../components/ui/SketchButton'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import { DateTimePicker } from '../dashboard/DateTimePicker'

interface PhasesManagerPageProps {
  project: Project
  phases: ProjectPhase[]
  projectTasks: Task[]
  onEnterRoom: (phaseId: number) => void
  onAddPhase: (request: {
    name: string
    description?: string
    status: ProjectStatus
    startDate?: string
    endDate?: string
    orderIndex: number
  }) => Promise<void>
  onDeletePhase: (phaseId: number) => Promise<void>
  onReorderPhases: (reordered: ProjectPhase[]) => void
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: 'Planlama',
  ACTIVE: 'Aktif',
  PAUSED: 'Beklemede',
  DONE: 'Tamamlandı',
}

const STATUS_STYLES: Record<ProjectStatus, string> = {
  PLANNING: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  ACTIVE: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  PAUSED: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  DONE: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string; icon: string }[] = [
  { value: 'PLANNING', label: 'Planlama', icon: '🟡' },
  { value: 'ACTIVE', label: 'Aktif', icon: '🟢' },
  { value: 'PAUSED', label: 'Beklemede', icon: '🔵' },
  { value: 'DONE', label: 'Tamamlandı', icon: '🟣' },
]

export const PhasesManagerPage: React.FC<PhasesManagerPageProps> = ({
  project,
  phases,
  projectTasks,
  onEnterRoom,
  onAddPhase,
  onDeletePhase,
  onReorderPhases,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [localPhases, setLocalPhases] = useState<ProjectPhase[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const statusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!statusOpen) return
    const handleOutsideClick = (e: MouseEvent) => {
      if (!statusRef.current?.contains(e.target as Node)) {
        setStatusOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [statusOpen])

  const [form, setForm] = useState<{
    name: string
    description: string
    status: ProjectStatus
    startDate: string
    endDate: string
  }>({
    name: '',
    description: '',
    status: 'PLANNING',
    startDate: '',
    endDate: '',
  })

  // Sync state with phases prop
  useEffect(() => {
    setLocalPhases([...phases].sort((a, b) => a.orderIndex - b.orderIndex))
  }, [phases])

  // Drag and drop reorder
  const handleReorder = (newOrder: ProjectPhase[]) => {
    setLocalPhases(newOrder)
    onReorderPhases(newOrder)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || isSubmitting) return
    setIsSubmitting(true)

    try {
      await onAddPhase({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        orderIndex: phases.length,
      })
      setForm({ name: '', description: '', status: 'PLANNING', startDate: '', endDate: '' })
      setDrawerOpen(false)
      setStatusOpen(false)
      toast.success('Yeni proje fazı başarıyla oluşturuldu.')
    } catch {
      toast.error('Faz eklenirken bir hata oluştu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (phaseId: number) => {
    if (!window.confirm('Bu fazı silmek istediğinizden emin misiniz?')) return
    try {
      await onDeletePhase(phaseId)
      toast.success('Faz başarıyla silindi.')
    } catch {
      toast.error('Faz silinirken bir hata oluştu.')
    }
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
      
      {/* Header and Creator Trigger */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-cyan-500" />
          <h2 className="font-bold text-sm tracking-wide text-neutral-900 dark:text-neutral-100">
            Proje Fazları ve Roadmap Yönetimi
          </h2>
        </div>
        
        <MovingBorderButton
          onClick={() => setDrawerOpen(true)}
          borderRadius="0.75rem"
          duration={2400}
          containerClassName="h-10 cursor-pointer"
          className="px-4 font-bold text-xs flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Yeni Faz Oluştur
        </MovingBorderButton>
      </div>

      {/* Reorderable List */}
      <div className="space-y-4">
        <Reorder.Group values={localPhases} onReorder={handleReorder} className="space-y-4">
          {localPhases.map((phase, index) => {
            const phaseTasks = projectTasks.filter((t) => t.phaseId === phase.id)
            const totalTasks = phaseTasks.length
            const completedTasks = phaseTasks.filter((t) => t.status === 'DONE').length
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

            return (
              <Reorder.Item
                key={phase.id}
                value={phase}
                className="group relative select-none rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-5 backdrop-blur-xl shadow-sm transition-all hover:border-cyan-500/25 flex flex-col md:flex-row md:items-center md:justify-between gap-4 cursor-grab active:cursor-grabbing"
              >
                {/* Sol Taraf: Sıra No ve Bilgiler */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Drag Handle */}
                  <div className="mt-1 text-neutral-400 hover:text-neutral-200 cursor-grab shrink-0">
                    <Menu className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-500 bg-cyan-400/5 px-2 py-0.5 rounded border border-cyan-400/10">
                        FAZ {String(index + 1).padStart(2, '0')}
                      </span>
                      <Badge className={cn('text-[10px] font-black', STATUS_STYLES[phase.status])}>
                        {STATUS_LABELS[phase.status]}
                      </Badge>
                      
                      {(phase.startDate || phase.endDate) && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-neutral-400">
                          <Clock className="h-3 w-3" />
                          {phase.startDate || 'Başlangıç yok'} - {phase.endDate || 'Bitiş yok'}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2.5 text-lg font-black text-neutral-900 dark:text-white truncate">
                      {phase.name}
                    </h3>
                    
                    {phase.description && (
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                        {phase.description}
                      </p>
                    )}

                    {/* Progress indicator */}
                    <div className="mt-4 max-w-sm space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 font-bold">
                        <span>{completedTasks}/{totalTasks} Görev Tamamlandı</span>
                        <span>%{completionRate}</span>
                      </div>
                      <div className="h-1 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${completionRate}%` } as any}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sağ Taraf: Eylemler */}
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  <SketchButton
                    type="button"
                    onClick={() => handleDelete(phase.id)}
                    tone="destructive"
                    className="h-9 w-9 p-0 flex items-center justify-center"
                    title="Fazı Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </SketchButton>

                  <MovingBorderButton
                    onClick={() => onEnterRoom(phase.id)}
                    borderRadius="0.75rem"
                    duration={2000}
                    containerClassName="h-10 cursor-pointer"
                    className="px-4 font-bold text-xs flex items-center gap-1.5"
                  >
                    Control Room'u Aç 🚀
                  </MovingBorderButton>
                </div>
              </Reorder.Item>
            )
          })}
        </Reorder.Group>

        {localPhases.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/50 rounded-2xl">
            <GitBranch className="h-10 w-10 text-neutral-400 mb-3" />
            <h3 className="font-bold text-sm text-neutral-700 dark:text-neutral-300">Henüz Faz Tanımlanmadı</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Sağ üstteki butona tıklayarak projenize ilk fazı ekleyebilirsiniz.
            </p>
          </div>
        )}
      </div>

      {/* Drawer: Yeni Faz Oluştur */}
      {createPortal(
        <AnimatePresence>
          {drawerOpen && (
            <>
              {/* Backdrop overlay */}
              <motion.div
                key="drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm transition-opacity duration-300"
              />

              {/* Sliding Drawer Container */}
              <motion.div
                key="drawer-container"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-neutral-200/40 bg-white/80 p-6 shadow-[-10px_0_30px_rgba(0,0,0,0.15)] backdrop-blur-2xl dark:border-neutral-800/40 dark:bg-neutral-950/80 dark:shadow-[-10px_0_30px_rgba(6,182,212,0.04)] flex flex-col gap-5 overflow-y-auto"
              >
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-neutral-200/50 dark:border-zinc-800/50 pb-4">
                  <div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
                      Phase Initialization
                    </span>
                    <h3 className="text-xl font-black text-neutral-900 dark:text-white mt-0.5">
                      Yeni Faz Oluştur
                    </h3>
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-lg border border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700 bg-white/50 dark:bg-neutral-950/50 px-3 py-1.5 text-xs font-black text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-all shadow-sm"
                  >
                    Kapat
                  </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-zinc-500 block mb-1">
                      Faz Adı
                    </label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Örn: Faz 1 - API Geliştirmeleri"
                      required
                      disabled={isSubmitting}
                      className="bg-white/40 dark:bg-neutral-950/40 border-neutral-200 dark:border-neutral-800 text-neutral-950 dark:text-white rounded-xl placeholder:text-neutral-500/70 focus-visible:border-cyan-500/50 focus-visible:ring-0 focus-visible:shadow-[0_0_15px_rgba(6,182,212,0.12)]"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-zinc-500 block mb-1">
                      Detay / Açıklama
                    </label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Bu faz kapsamında yapılacak teknik işleri yazın..."
                      rows={4}
                      disabled={isSubmitting}
                      className="bg-white/40 dark:bg-neutral-950/40 border-neutral-200 dark:border-neutral-800 text-neutral-950 dark:text-white rounded-xl placeholder:text-neutral-500/70 focus-visible:border-cyan-500/50 focus-visible:ring-0 focus-visible:shadow-[0_0_15px_rgba(6,182,212,0.12)] resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-zinc-500 block mb-1">
                      Faz Durumu
                    </label>
                    <div ref={statusRef} className="relative w-full">
                      <button
                        type="button"
                        onClick={() => setStatusOpen((prev) => !prev)}
                        disabled={isSubmitting}
                        className={cn(
                          "flex h-11 w-full items-center justify-between gap-3 rounded-full border px-4 text-left outline-none transition-colors",
                          "border-neutral-300 bg-white/80 text-neutral-800 hover:border-neutral-400 hover:bg-white",
                          "dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-900",
                          statusOpen && "border-cyan-500 ring-2 ring-cyan-500/15 dark:border-cyan-400",
                          isSubmitting && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="text-sm shrink-0">
                            {STATUS_OPTIONS.find((opt) => opt.value === form.status)?.icon}
                          </span>
                          <span className="truncate text-xs font-bold">
                            {STATUS_OPTIONS.find((opt) => opt.value === form.status)?.label}
                          </span>
                        </span>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 text-neutral-400 dark:text-zinc-500 transition-transform duration-200 shrink-0",
                            statusOpen && "rotate-90"
                          )}
                        />
                      </button>

                      <AnimatePresence>
                        {statusOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-[calc(100%+0.5rem)] left-0 right-0 z-[60] rounded-xl border border-neutral-200 bg-white p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_18px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                          >
                            <div className="flex flex-col gap-1">
                              {STATUS_OPTIONS.map((opt) => {
                                const isSelected = form.status === opt.value
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      setForm({ ...form, status: opt.value })
                                      setStatusOpen(false)
                                    }}
                                    className={cn(
                                      "flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold rounded-lg transition-colors text-left",
                                      "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white",
                                      isSelected && "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-300 hover:bg-cyan-500/15 dark:hover:bg-cyan-400/15"
                                    )}
                                  >
                                    <span className="text-sm shrink-0">{opt.icon}</span>
                                    <span className="flex-grow">{opt.label}</span>
                                    {isSelected && (
                                      <Check className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-zinc-500 block mb-1">
                        Başlangıç Tarihi
                      </label>
                      <DateTimePicker
                        date={form.startDate}
                        onDateChange={(date) => setForm((f) => ({ ...f, startDate: date }))}
                        showTime={false}
                        align="left"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-zinc-500 block mb-1">
                        Bitiş Tarihi
                      </label>
                      <DateTimePicker
                        date={form.endDate}
                        onDateChange={(date) => setForm((f) => ({ ...f, endDate: date }))}
                        showTime={false}
                        align="right"
                      />
                    </div>
                  </div>

                  {/* Submit Actions */}
                  <div className="flex justify-end items-center gap-3 pt-5 border-t border-neutral-200/50 dark:border-zinc-800/50 mt-5">
                    <SketchButton
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      disabled={isSubmitting}
                      className="h-9 px-4 text-xs font-bold"
                    >
                      İptal
                    </SketchButton>

                    <MovingBorderButton
                      borderRadius="0.75rem"
                      duration={1800}
                      containerClassName="h-9 cursor-pointer"
                      className="px-6 font-bold text-xs"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      Oluştur
                    </MovingBorderButton>
                  </div>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
