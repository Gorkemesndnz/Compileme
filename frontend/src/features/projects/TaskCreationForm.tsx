import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, Check, Loader2, Calendar, Clock, Sparkles, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { toast } from 'sonner'
import {
  Project,
  ProjectPhase,
  useProjectDocuments,
} from '../../api/projects'
import { useCreateTask } from '../../api/tasks'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { cn } from '../../lib/utils'
import { DateTimePicker } from '../dashboard/DateTimePicker'

interface TaskCreationFormProps {
  project: Project
  phases: ProjectPhase[]
  onSuccess?: () => void
}

const CATEGORIES = ['Frontend', 'Backend', 'Veritabanı', 'Güvenlik', 'DevOps', 'UI/UX']

const PRIORITIES = [
  { value: 'LOW', label: 'Düşük', color: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' },
  { value: 'MEDIUM', label: 'Orta', color: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' },
  { value: 'HIGH', label: 'Yüksek', color: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' },
]

export const TaskCreationForm: React.FC<TaskCreationFormProps> = ({
  project,
  phases,
  onSuccess,
}) => {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null)
  const [selectedSubPhaseId, setSelectedSubPhaseId] = useState<number | null>(null)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')

  const createTaskMutation = useCreateTask()

  // Fetch documents to load sub-phases dynamically
  const { data: documents = [] } = useProjectDocuments(project.id)

  const subPhases = useMemo(() => {
    if (!selectedPhaseId) return []
    const prefix = `[PHASE:${selectedPhaseId}:SUB:`
    return documents
      .filter((d) => d.title && d.title.startsWith(prefix))
      .map((d) => {
        const match = d.title.match(/^\[PHASE:(\d+):SUB:(\d+)\]\s*(.*)$/)
        return match
          ? {
              id: d.id,
              subIndex: parseInt(match[2], 10),
              label: match[3],
            }
          : null
      })
      .filter(Boolean)
      .sort((a, b) => a!.subIndex - b!.subIndex) as {
      id: number
      subIndex: number
      label: string
    }[]
  }, [documents, selectedPhaseId])

  // Reset sub-phase if selected phase changes
  useEffect(() => {
    setSelectedSubPhaseId(null)
  }, [selectedPhaseId])

  const [isPhaseOpen, setIsPhaseOpen] = useState(false)
  const [isSubPhaseOpen, setIsSubPhaseOpen] = useState(false)
  const phaseRef = useRef<HTMLDivElement>(null)
  const subPhaseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isPhaseOpen && phaseRef.current && !phaseRef.current.contains(e.target as Node)) {
        setIsPhaseOpen(false)
      }
      if (isSubPhaseOpen && subPhaseRef.current && !subPhaseRef.current.contains(e.target as Node)) {
        setIsSubPhaseOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isPhaseOpen, isSubPhaseOpen])


  const handleToggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !notes.trim()) return

    // Formatting notes to save categories, priority, and sub-phase reference
    let formattedNotes = ''
    
    // Add sub-phase reference
    if (selectedSubPhaseId) {
      formattedNotes += `[SUB:${selectedSubPhaseId}] `
    }

    // Add priority and categories metadata
    const priorityLabel = PRIORITIES.find((p) => p.value === priority)?.label || 'Orta'
    formattedNotes += `[Öncelik: ${priorityLabel}]`
    if (selectedCategories.length > 0) {
      formattedNotes += ` [Etiketler: ${selectedCategories.join(', ')}]`
    }

    formattedNotes += `\n\n${notes.trim()}`

    try {
      await createTaskMutation.mutateAsync({
        title: title.trim(),
        notes: formattedNotes,
        status: 'TODO',
        kind: 'PROJECT',
        projectId: project.id,
        phaseId: selectedPhaseId || undefined,
        scheduledDate: scheduledDate || undefined,
        scheduledTime: scheduledTime || undefined,
        planningBucket: scheduledDate ? 'DAY' : 'UNSCHEDULED',
      })

      setTitle('')
      setNotes('')
      setSelectedPhaseId(null)
      setSelectedSubPhaseId(null)
      setScheduledDate('')
      setScheduledTime('')
      setSelectedCategories([])
      setPriority('MEDIUM')
      
      toast.success('Yeni proje görevi başarıyla eklendi!')
      if (onSuccess) onSuccess()
    } catch {
      toast.error('Görev eklenirken hata oluştu.')
    }
  }

  const isFormValid = title.trim() !== '' && notes.trim() !== ''

  return (
    <div className="glass-panel p-6 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/40 backdrop-blur-xl flex flex-col gap-6">
      <div>
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-cyan-500" />
          Proje Görevleri (Yeni Görev Planla)
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Hiyerarşik fazlar, yer imleri ve önceliklerle entegre çalışan görev ekleme modülü.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* ── Row 1: Başlık (5) + Faz (3) + Tarih&Saat (4) — sabit 3 sütun ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end relative" style={{ zIndex: 30 } as any}>
          {/* Görev Başlığı — lg:col-span-5 */}
          <div className="lg:col-span-5">
            <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Görev Başlığı <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Auth controller testlerini yaz"
              className="h-11 bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-xs focus:ring-2 focus:ring-cyan-500/50 text-slate-950 dark:text-slate-100"
            />
          </div>

          {/* Faz Seçimi — lg:col-span-3 (sabit) */}
          <div ref={phaseRef} className="lg:col-span-3 relative">
            <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Faz Seçimi
            </label>
            <button
              type="button"
              onClick={() => setIsPhaseOpen((prev) => !prev)}
              className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white/50 dark:bg-black/20 backdrop-blur-sm border-slate-200 dark:border-slate-800 px-4 text-xs font-bold text-slate-950 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500/50 outline-none text-left transition-all"
            >
              <span className="truncate">
                {selectedPhaseId
                  ? `Faz ${phases.findIndex((p) => p.id === selectedPhaseId) + 1}: ${
                      phases.find((p) => p.id === selectedPhaseId)?.name
                    }`
                  : 'Faz Yok'}
              </span>
              <ChevronDown className={cn("h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-transform shrink-0", isPhaseOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isPhaseOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-[calc(100%+0.5rem)] left-0 right-0 z-[60] rounded-xl border border-neutral-200 bg-white p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_18px_50px_rgba(0,0,0,0.5)] max-h-60 overflow-y-auto"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => { setSelectedPhaseId(null); setIsPhaseOpen(false) }}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 text-xs font-bold rounded-lg transition-colors text-left",
                        "text-neutral-700 hover:bg-neutral-100 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white",
                        !selectedPhaseId && "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-300"
                      )}
                    >
                      <span>Faz Yok</span>
                      {!selectedPhaseId && <Check className="h-3.5 w-3.5" />}
                    </button>
                    {phases.map((ph, idx) => {
                      const isSelected = selectedPhaseId === ph.id
                      return (
                        <button
                          key={ph.id}
                          type="button"
                          onClick={() => { setSelectedPhaseId(ph.id); setIsPhaseOpen(false) }}
                          className={cn(
                            "flex items-center justify-between w-full px-3 py-2 text-xs font-bold rounded-lg transition-colors text-left",
                            "text-neutral-700 hover:bg-neutral-100 dark:text-zinc-300 dark:hover:bg-zinc-855 dark:hover:text-white",
                            isSelected && "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-300"
                          )}
                        >
                          <span className="truncate">Faz {idx + 1}: {ph.name}</span>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Planlanan Tarih & Saat — lg:col-span-4 */}
          <div className="lg:col-span-4">
            <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-cyan-500" /> Tarih & Saat
            </label>
            <div className="flex items-center gap-2">
              <DateTimePicker
                date={scheduledDate}
                time={scheduledTime}
                onDateChange={setScheduledDate}
                onTimeChange={setScheduledTime}
                showTime={true}
                align="right"
                alignY="bottom"
              />
              {scheduledDate && (
                <button
                  type="button"
                  onClick={() => { setScheduledDate(''); setScheduledTime('') }}
                  className="text-[10px] font-bold text-zinc-400 hover:text-red-500 transition-colors whitespace-nowrap"
                >
                  Temizle
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Alt Faz Seçimi (Faz seçilince ayrı satırda görünür) ── */}
        {selectedPhaseId && (
          <div ref={subPhaseRef} className="relative max-w-xs animate-in fade-in slide-in-from-left-2 duration-300" style={{ zIndex: 25 } as any}>
            <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Alt Faz Seçimi
            </label>
            <button
              type="button"
              onClick={() => setIsSubPhaseOpen((prev) => !prev)}
              className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white/50 dark:bg-black/20 backdrop-blur-sm border-slate-200 dark:border-slate-800 px-4 text-xs font-bold text-slate-950 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500/50 outline-none text-left transition-all"
            >
              <span className="truncate">
                {selectedSubPhaseId
                  ? subPhases.find((sp) => sp.id === selectedSubPhaseId)?.label || 'Alt Faz Yok'
                  : 'Alt Faz Yok'}
              </span>
              <ChevronDown className={cn("h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-transform shrink-0", isSubPhaseOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isSubPhaseOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-[calc(100%+0.5rem)] left-0 right-0 z-[60] rounded-xl border border-neutral-200 bg-white p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_18px_50px_rgba(0,0,0,0.5)] max-h-60 overflow-y-auto"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => { setSelectedSubPhaseId(null); setIsSubPhaseOpen(false) }}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 text-xs font-bold rounded-lg transition-colors text-left",
                        "text-neutral-700 hover:bg-neutral-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white",
                        !selectedSubPhaseId && "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-300"
                      )}
                    >
                      <span>Alt Faz Yok</span>
                      {!selectedSubPhaseId && <Check className="h-3.5 w-3.5" />}
                    </button>
                    {subPhases.map((sp) => {
                      const isSelected = selectedSubPhaseId === sp.id
                      return (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => { setSelectedSubPhaseId(sp.id); setIsSubPhaseOpen(false) }}
                          className={cn(
                            "flex items-center justify-between w-full px-3 py-2 text-xs font-bold rounded-lg transition-colors text-left",
                            "text-neutral-700 hover:bg-neutral-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white",
                            isSelected && "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-300"
                          )}
                        >
                          <span className="truncate">Alt Faz {sp.subIndex}: {sp.label}</span>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Row 3: Detaylar / Görev Notu ── */}
        <div className="relative" style={{ zIndex: 10 } as any}>
          <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
            Detaylar / Görev Notu <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Görevle ilgili teknik notlar, hedefler, alt maddeler..."
            className="min-h-[110px] bg-white/50 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs focus:ring-2 focus:ring-cyan-500/50 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* ── Row 4: Etiketler + Öncelik + Gönder ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/40">
          
          {/* Chip selectors (Categories) */}
          <div className="space-y-2">
            <span className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Konu Seçimi (Etiketler)
            </span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat)
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleToggleCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer select-none',
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)] font-black'
                        : 'border-zinc-200 bg-zinc-50/20 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800/50 dark:bg-zinc-900/10 dark:text-zinc-450 dark:hover:bg-zinc-900/25'
                    )}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right side: Priority & Add task button */}
          <div className="flex items-center gap-6 justify-between md:justify-end shrink-0">
            {/* Priority selection */}
            <div className="space-y-2">
              <span className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right md:text-left">
                Öncelik Seçimi
              </span>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p.value
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value as any)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer',
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/10 text-slate-800 dark:text-slate-100 shadow-[0_0_10px_rgba(6,182,212,0.1)] font-black'
                          : 'border-zinc-200 bg-zinc-50/10 text-zinc-500 dark:border-zinc-800/40 dark:bg-zinc-900/10 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-900/25'
                      )}
                    >
                      <span className={cn('h-2 w-2 rounded-full', p.color)} />
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="self-end pt-1">
              <button
                type="submit"
                disabled={!isFormValid || createTaskMutation.isPending}
                className={cn(
                  'h-11 px-5 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-black shadow-[0_0_15px_rgba(6,182,212,0.45)] transition-all flex items-center gap-2 cursor-pointer select-none active:scale-[0.98]',
                  !isFormValid && 'opacity-40 pointer-events-none shadow-none bg-zinc-300 dark:bg-zinc-800 text-zinc-500'
                )}
              >
                {createTaskMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ekleniyor...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 stroke-[3]" />
                    Görev Ekle
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </form>
    </div>
  )
}
