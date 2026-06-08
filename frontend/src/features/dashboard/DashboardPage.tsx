import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '../../components/PageHeader'
import { 
  useTasks, 
  useCreateTask, 
  useToggleTaskComplete, 
  useMoveTaskToTomorrow, 
  useDeleteTask, 
  useUpdateTask 
} from '../../api/tasks'
import { 
  useWaterSummary, 
  useAddWaterLog, 
  useDeleteWaterLog 
} from '../../api/water'
import { useProjects } from '../../api/projects'
import { useEducations } from '../../api/education'
import { useIdeas, useCreateIdea } from '../../api/ideas'
import { 
  Droplet, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft,
  Check, 
  Activity, 
  Cpu, 
  Database, 
  Lightbulb,
  Clock,
  ChevronDown,
  ChevronUp,
  Undo,
  RotateCcw,
  Minus,
  Edit2
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'

export const DashboardPage: React.FC = () => {
  // Local dates helpers
  const getLocalDateString = (daysOffset = 0) => {
    const d = new Date()
    d.setDate(d.getDate() + daysOffset)
    const offset = d.getTimezoneOffset()
    const local = new Date(d.getTime() - (offset * 60 * 1000))
    return local.toISOString().split('T')[0]
  }

  const today = getLocalDateString(0)
  const tomorrow = getLocalDateString(1)
  
  // States for Quick Add Bar
  const [quickAddType, setQuickAddType] = useState<'idea' | 'task'>('idea')
  const [quickAddText, setQuickAddText] = useState('')
  const [quickAddDate, setQuickAddDate] = useState(today)
  const [quickAddTime, setQuickAddTime] = useState('')
  const quickAddInputRef = useRef<HTMLInputElement>(null)

  // States for Stepper & Add forms
  const [customStepperMl, setCustomStepperMl] = useState(300)
  const [showAddFormToday, setShowAddFormToday] = useState(false)
  const [showAddFormTomorrow, setShowAddFormTomorrow] = useState(false)

  // States for Task Add Form inputs
  const [todayFormTime, setTodayFormTime] = useState('')
  const [todayFormTitle, setTodayFormTitle] = useState('')
  const [todayFormNotes, setTodayFormNotes] = useState('')

  const [tomorrowFormTime, setTomorrowFormTime] = useState('')
  const [tomorrowFormTitle, setTomorrowFormTitle] = useState('')
  const [tomorrowFormNotes, setTomorrowFormNotes] = useState('')

  // State for inline task editing
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editNotes, setEditNotes] = useState('')

  // Query Hooks
  const { data: todayTasks = [], isLoading: loadingToday } = useTasks({ date: today })
  const { data: tomorrowTasks = [], isLoading: loadingTomorrow } = useTasks({ date: tomorrow })
  const { data: projects = [] } = useProjects()
  const { data: educations = [] } = useEducations()
  const { data: ideas = [] } = useIdeas()
  const { data: waterSummary } = useWaterSummary(today)
  
  // Mutations
  const createTaskMutation = useCreateTask()
  const toggleTaskCompleteMutation = useToggleTaskComplete()
  const moveTaskToTomorrowMutation = useMoveTaskToTomorrow()
  const deleteTaskMutation = useDeleteTask()
  const updateTaskMutation = useUpdateTask()
  const createIdeaMutation = useCreateIdea()
  
  const addWaterMutation = useAddWaterLog()
  const deleteWaterMutation = useDeleteWaterLog(today)

  // Keyboard shortcut: Pressing "/" focuses on the quick add input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' && 
        document.activeElement !== quickAddInputRef.current && 
        !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault()
        quickAddInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle Quick Add Submit
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickAddText.trim()) return

    if (quickAddType === 'idea') {
      createIdeaMutation.mutate({
        title: quickAddText,
        status: 'RAW'
      }, {
        onSuccess: () => {
          setQuickAddText('')
          toast.success('Fikir başarıyla eklendi.')
        }
      })
    } else {
      createTaskMutation.mutate({
        title: quickAddText,
        status: 'TODO',
        kind: 'GENERAL',
        scheduledDate: quickAddDate || today,
        scheduledTime: quickAddTime || undefined,
        planningBucket: 'DAY'
      }, {
        onSuccess: () => {
          setQuickAddText('')
          setQuickAddTime('')
          toast.success('Görev başarıyla eklendi.')
        }
      })
    }
  }

  // Handle task adding inside Bugün column
  const handleAddTodayTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!todayFormTitle.trim()) return

    createTaskMutation.mutate({
      title: todayFormTitle,
      status: 'TODO',
      kind: 'GENERAL',
      scheduledDate: today,
      scheduledTime: todayFormTime || undefined,
      notes: todayFormNotes || undefined,
      planningBucket: 'DAY'
    }, {
      onSuccess: () => {
        setTodayFormTitle('')
        setTodayFormTime('')
        setTodayFormNotes('')
        setShowAddFormToday(false)
        toast.success('Görev eklendi.')
      }
    })
  }

  // Handle task adding inside Yarın column
  const handleAddTomorrowTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tomorrowFormTitle.trim()) return

    createTaskMutation.mutate({
      title: tomorrowFormTitle,
      status: 'TODO',
      kind: 'GENERAL',
      scheduledDate: tomorrow,
      scheduledTime: tomorrowFormTime || undefined,
      notes: tomorrowFormNotes || undefined,
      planningBucket: 'DAY'
    }, {
      onSuccess: () => {
        setTomorrowFormTitle('')
        setTomorrowFormTime('')
        setTomorrowFormNotes('')
        setShowAddFormTomorrow(false)
        toast.success('Görev eklendi.')
      }
    })
  }

  // Handle Water Presets
  const handleAddWater = (source: 'GLASS_300' | 'HALF_500' | 'BOTTLE_1500' | 'CUSTOM', amount?: number) => {
    let finalAmount = amount
    if (source === 'GLASS_300') finalAmount = 300 // Bardak (300 ml)
    if (source === 'HALF_500') finalAmount = 500 // Yarım Şişe (500 ml)
    if (source === 'BOTTLE_1500') finalAmount = 1500 // Şişe (1.5L)

    if (source === 'CUSTOM') {
      if (amount !== undefined) {
        finalAmount = amount
      } else {
        finalAmount = 250 // default fallback
      }
    }

    addWaterMutation.mutate({
      amountMl: finalAmount,
      source: source,
      logDate: today
    }, {
      onSuccess: () => {
        toast.success(`${finalAmount} ml su eklendi.`)
      }
    })
  }

  // Undo / Reset Water functions
  const handleUndoWater = () => {
    if (waterSummary && waterSummary.logs && waterSummary.logs.length > 0) {
      const lastLog = waterSummary.logs[0]
      deleteWaterMutation.mutate(lastLog.id, {
        onSuccess: () => {
          toast.success(`${lastLog.amountMl} ml su kaydı geri alındı.`)
        }
      })
    } else {
      toast.error('Geri alınacak su tüketim kaydı bulunamadı.')
    }
  }

  const handleResetDay = async () => {
    if (waterSummary && waterSummary.logs && waterSummary.logs.length > 0) {
      if (window.confirm('Bugünkü tüm su tüketim geçmişini sıfırlamak istediğinize emin misiniz?')) {
        try {
          await Promise.all(waterSummary.logs.map(log => deleteWaterMutation.mutateAsync(log.id)))
          toast.success('Bugünkü su tüketim verileri sıfırlandı.')
        } catch (e) {
          toast.error('Sıfırlama sırasında bir hata oluştu.')
        }
      }
    } else {
      toast.error('Sıfırlanacak veri bulunamadı.')
    }
  }

  // Handle task inline edit activation
  const startEditing = (task: any) => {
    setEditingTaskId(task.id)
    setEditTitle(task.title || '')
    setEditTime(task.scheduledTime || '')
    setEditNotes(task.notes || '')
  }

  // Handle task inline update submit
  const saveTaskEdit = (id: number) => {
    if (!editTitle.trim()) return

    updateTaskMutation.mutate({
      id,
      request: {
        title: editTitle,
        scheduledTime: editTime || undefined,
        notes: editNotes || undefined
      }
    }, {
      onSuccess: () => {
        setEditingTaskId(null)
        toast.success('Görev güncellendi.')
      }
    })
  }

  // Reschedule task (Bugün -> Yarın / Yarın -> Bugün)
  const shiftTask = (id: number, date: string) => {
    updateTaskMutation.mutate({
      id,
      request: {
        scheduledDate: date
      }
    }, {
      onSuccess: () => {
        toast.success('Görev planlanan tarihi güncellendi.')
      }
    })
  }

  // Date and stats calculations
  const completedTodayCount = todayTasks.filter(t => t.status === 'DONE').length
  const totalTodayCount = todayTasks.length
  
  const completedTomorrowCount = tomorrowTasks.filter(t => t.status === 'DONE').length
  const totalTomorrowCount = tomorrowTasks.length

  const activeProjectsCount = projects.filter(p => p.status === 'ACTIVE').length

  // Water stats
  const waterAmount = waterSummary?.amountMl || 0
  const waterGoal = waterSummary?.goalMl || 3000
  const waterPercentage = Math.min(100, Math.round((waterAmount / waterGoal) * 100))

  // Time based dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Günaydın ☀️'
    if (hour >= 12 && hour < 18) return 'Tünaydın ☀️'
    if (hour >= 18 && hour < 22) return 'İyi akşamlar 🌙'
    return 'İyi geceler 👏'
  }

  // Turkish date formatting helper
  const formatTurkishDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
  }

  const fullFormattedDate = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Simple Markdown Renderer
  const renderMarkdown = (text: string) => {
    if (!text) return null
    return text.split('\n').map((line, i) => {
      let formatted = line
      const boldRegex = /\*\*(.*?)\*\*/g
      const boldParts = []
      let lastIndex = 0
      let match
      while ((match = boldRegex.exec(line)) !== null) {
        boldParts.push(line.substring(lastIndex, match.index))
        boldParts.push(<strong key={match.index}>{match[1]}</strong>)
        lastIndex = boldRegex.lastIndex
      }
      boldParts.push(line.substring(lastIndex))

      if (line.trim().startsWith('- ')) {
        return (
          <ul key={i} className="list-disc list-inside ml-2">
            <li>{boldParts.length > 1 ? boldParts : line.substring(2)}</li>
          </ul>
        )
      }
      return (
        <p key={i} className="min-h-[1.2rem] leading-relaxed">
          {boldParts.length > 1 ? boldParts : line}
        </p>
      )
    })
  }

  return (
    <div className="space-y-6">
      
      {/* Time-based dynamic greeting and title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{getGreeting()}</h1>
        <p className="text-sm text-neutral-400 mt-1">
          {fullFormattedDate} · bugüne odaklan, gerisini akışa bırak
        </p>
      </div>

      {/* Quick Add Bar */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-3">
        {/* Fikir / Görev toggles */}
        <div className="flex bg-neutral-900/40 p-1 rounded-xl border border-neutral-800/40 shrink-0">
          <button
            onClick={() => setQuickAddType('idea')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              quickAddType === 'idea' 
                ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(0,255,255,0.05)]" 
                : "text-neutral-400 hover:text-neutral-200 border border-transparent"
            )}
          >
            💡 Fikir
          </button>
          <button
            onClick={() => setQuickAddType('task')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              quickAddType === 'task' 
                ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(0,255,255,0.05)]" 
                : "text-neutral-400 hover:text-neutral-200 border border-transparent"
            )}
          >
            ✓ Görev
          </button>
        </div>

        {/* Input Bar Form */}
        <form onSubmit={handleQuickAddSubmit} className="flex-grow flex items-center gap-3 w-full">
          <Input
            ref={quickAddInputRef}
            value={quickAddText}
            onChange={(e) => setQuickAddText(e.target.value)}
            placeholder={
              quickAddType === 'idea' 
                ? "Aklına bir fikir mi geldi? Yaz ve Enter'a bas..." 
                : "Yeni bir görev ekle..."
            }
            className="flex-grow bg-transparent border-none focus-visible:ring-0 p-0 text-sm placeholder:text-neutral-500 text-neutral-800 dark:text-neutral-200"
          />

          {/* Task specifics inline settings */}
          {quickAddType === 'task' && (
            <div className="flex items-center gap-2 shrink-0 animate-fade-in">
              <input
                type="date"
                value={quickAddDate}
                onChange={(e) => setQuickAddDate(e.target.value)}
                className="bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/40 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-cyan-500/50 transition-colors cursor-pointer"
              />
              <input
                type="time"
                value={quickAddTime}
                onChange={(e) => setQuickAddTime(e.target.value)}
                className="bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/40 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-cyan-500/50 transition-colors cursor-pointer"
              />
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline text-[10px] text-neutral-500 font-bold px-2 py-1 rounded bg-neutral-900/40 border border-neutral-800/40 select-none">
              / ile odaklan
            </span>
            <Button type="submit" variant="glass" size="sm" className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1" /> Ekle
            </Button>
          </div>
        </form>
      </div>

      {/* Horizontal Stats summary row (4 small cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Check className="h-3 w-3 text-cyan-400" /> Bugünkü görev
            </div>
            <div className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">
              {completedTodayCount}/{totalTodayCount}
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Cpu className="h-3 w-3 text-cyan-400" /> Aktif proje
            </div>
            <div className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">
              {activeProjectsCount}
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Database className="h-3 w-3 text-cyan-400" /> Eğitim
            </div>
            <div className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">
              {educations.length}
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Lightbulb className="h-3 w-3 text-cyan-400" /> Fikir
            </div>
            <div className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">
              {ideas.length}
            </div>
          </div>
        </div>
      </div>

      {/* 3 Column Layout (Today, Tomorrow, Water Tracker) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Bugün (Today's Tasks) */}
        <div className="glass-panel rounded-2xl p-5 space-y-4 flex flex-col justify-between min-h-[400px]">
          <div className="space-y-4 w-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-neutral-900 dark:text-white">Bugün</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-900/40 text-neutral-400 border border-neutral-800/40">
                  {formatTurkishDate(today)}
                </span>
              </div>
            </div>

            {/* List */}
            {loadingToday ? (
              <div className="space-y-2 py-4 animate-pulse">
                <div className="h-10 bg-neutral-800/20 rounded-xl" />
                <div className="h-10 bg-neutral-800/20 rounded-xl" />
              </div>
            ) : todayTasks.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-12 select-none">Henüz görev yok.</p>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {todayTasks.map((task) => {
                  const isEditing = editingTaskId === task.id
                  return (
                    <div 
                      key={task.id}
                      className={cn(
                        "rounded-xl border border-neutral-200/10 bg-neutral-900/5 hover:bg-neutral-900/10 p-3.5 transition-all select-none",
                        isEditing && "border-cyan-500/40 bg-neutral-900/10"
                      )}
                    >
                      {isEditing ? (
                        /* Inline Edit Form */
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="flex-grow bg-neutral-800/40 border border-neutral-700/30 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-cyan-500/50"
                              placeholder="Görev başlığı..."
                            />
                            <input
                              type="time"
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              className="bg-neutral-800/40 border border-neutral-700/30 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-cyan-500/50 cursor-pointer"
                            />
                          </div>
                          
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full bg-neutral-800/40 border border-neutral-700/30 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cyan-500/50 min-h-[60px] resize-y font-mono"
                            placeholder="Not ekle (markdown)..."
                          />

                          {/* Live preview */}
                          {editNotes && (
                            <div className="p-2.5 rounded-lg bg-neutral-950/20 text-[10px] text-neutral-400 border border-neutral-800/30">
                              <span className="block font-bold text-[8px] uppercase tracking-wider text-neutral-500 mb-1">Not Önizleme</span>
                              <div className="prose prose-sm prose-invert">{renderMarkdown(editNotes)}</div>
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingTaskId(null)}
                              className="px-2.5 py-1 rounded text-[10px] font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer"
                            >
                              İptal
                            </button>
                            <Button
                              onClick={() => saveTaskEdit(task.id)}
                              variant="glass"
                              size="sm"
                              className="h-6"
                            >
                              Kaydet
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Default Card Row View */
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3 group/row">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <button 
                                onClick={() => toggleTaskCompleteMutation.mutate(task.id)}
                                className={cn(
                                  "h-4 w-4 rounded border border-neutral-400/30 flex items-center justify-center hover:border-cyan-500/60 transition-colors cursor-pointer shrink-0",
                                  task.status === 'DONE' && "bg-cyan-500/10 border-cyan-500 text-cyan-400"
                                )}
                              >
                                {task.status === 'DONE' && <Check className="h-3 w-3 stroke-[3px]" />}
                              </button>
                              
                              {task.scheduledTime && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                  <Clock className="h-2 w-2" /> {task.scheduledTime}
                                </span>
                              )}

                              <span 
                                onClick={() => startEditing(task)}
                                className={cn(
                                  "text-xs font-medium truncate cursor-pointer hover:underline",
                                  task.status === 'DONE' ? 'line-through text-neutral-500' : 'text-neutral-800 dark:text-neutral-200'
                                )}
                              >
                                {task.title}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEditing(task)}
                                className="h-6 w-6 rounded hover:bg-neutral-800/40 border border-transparent hover:border-neutral-700/20 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                                title="Görevi Düzenle"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              {task.status !== 'DONE' && (
                                <button
                                  onClick={() => shiftTask(task.id, tomorrow)}
                                  className="h-6 w-6 rounded hover:bg-neutral-800/40 border border-transparent hover:border-neutral-700/20 text-neutral-400 hover:text-cyan-400 flex items-center justify-center transition-all cursor-pointer"
                                  title="Yarına Aktar"
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteTaskMutation.mutate(task.id)}
                                className="h-6 w-6 rounded hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                                title="Sil"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {/* Notes Preview if exists */}
                          {task.notes && (
                            <div 
                              onClick={() => startEditing(task)}
                              className="mt-1.5 p-2 rounded bg-neutral-950/10 border border-neutral-800/10 text-[10px] text-neutral-500 cursor-pointer hover:border-neutral-700/20 transition-all font-mono"
                            >
                              <div className="prose prose-sm prose-invert">{renderMarkdown(task.notes)}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bottom inline add task toggle form */}
          <div className="w-full pt-3 mt-4 border-t border-neutral-200/10">
            {showAddFormToday ? (
              <form onSubmit={handleAddTodayTask} className="glass-panel border-cyan-500/20 rounded-xl p-3.5 space-y-3 animate-fade-in">
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={todayFormTime}
                    onChange={(e) => setTodayFormTime(e.target.value)}
                    className="bg-neutral-800/40 border border-neutral-700/30 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-cyan-500/50 cursor-pointer w-24 shrink-0"
                  />
                  <input
                    type="text"
                    value={todayFormTitle}
                    onChange={(e) => setTodayFormTitle(e.target.value)}
                    className="flex-grow bg-neutral-800/40 border border-neutral-700/30 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-cyan-500/50"
                    placeholder="Görev başlığı..."
                    required
                  />
                </div>
                
                <textarea
                  value={todayFormNotes}
                  onChange={(e) => setTodayFormNotes(e.target.value)}
                  className="w-full bg-neutral-800/40 border border-neutral-700/30 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-500/50 min-h-[50px] resize-y"
                  placeholder="Not (opsiyonel) - markdown destekler..."
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddFormToday(false)}
                    className="px-3 py-1 rounded text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    İptal
                  </button>
                  <Button type="submit" variant="glass" size="sm" className="h-8">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Ekle
                  </Button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddFormToday(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-neutral-400/20 hover:border-cyan-500/40 hover:bg-cyan-500/5 text-xs text-neutral-500 hover:text-cyan-400 transition-all cursor-pointer font-medium"
              >
                <Plus className="h-3.5 w-3.5" /> Görev ekle
              </button>
            )}
          </div>
        </div>

        {/* Column 2: Yarın (Tomorrow's Tasks) */}
        <div className="glass-panel rounded-2xl p-5 space-y-4 flex flex-col justify-between min-h-[400px]">
          <div className="space-y-4 w-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-neutral-900 dark:text-white">Yarın</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-900/40 text-neutral-400 border border-neutral-800/40">
                  {formatTurkishDate(tomorrow)}
                </span>
              </div>
              <Badge variant="outline" className="border-neutral-800 text-[10px] text-neutral-400">
                {completedTomorrowCount} / {totalTomorrowCount}
              </Badge>
            </div>

            {/* List */}
            {loadingTomorrow ? (
              <div className="space-y-2 py-4 animate-pulse">
                <div className="h-10 bg-neutral-800/20 rounded-xl" />
              </div>
            ) : tomorrowTasks.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-12 select-none">Henüz görev yok.</p>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {tomorrowTasks.map((task) => {
                  const isEditing = editingTaskId === task.id
                  return (
                    <div 
                      key={task.id}
                      className={cn(
                        "rounded-xl border border-neutral-200/10 bg-neutral-900/5 hover:bg-neutral-900/10 p-3.5 transition-all select-none",
                        isEditing && "border-cyan-500/40 bg-neutral-900/10"
                      )}
                    >
                      {isEditing ? (
                        /* Inline Edit Form */
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="flex-grow bg-neutral-800/40 border border-neutral-700/30 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-cyan-500/50"
                              placeholder="Görev başlığı..."
                            />
                            <input
                              type="time"
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              className="bg-neutral-800/40 border border-neutral-700/30 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-cyan-500/50 cursor-pointer"
                            />
                          </div>
                          
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full bg-neutral-800/40 border border-neutral-700/30 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cyan-500/50 min-h-[60px] resize-y font-mono"
                            placeholder="Not ekle (markdown)..."
                          />

                          {/* Live preview */}
                          {editNotes && (
                            <div className="p-2.5 rounded-lg bg-neutral-950/20 text-[10px] text-neutral-400 border border-neutral-800/30">
                              <span className="block font-bold text-[8px] uppercase tracking-wider text-neutral-500 mb-1">Not Önizleme</span>
                              <div className="prose prose-sm prose-invert">{renderMarkdown(editNotes)}</div>
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingTaskId(null)}
                              className="px-2.5 py-1 rounded text-[10px] font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer"
                            >
                              İptal
                            </button>
                            <Button
                              onClick={() => saveTaskEdit(task.id)}
                              variant="glass"
                              size="sm"
                              className="h-6"
                            >
                              Kaydet
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Default Card Row View */
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3 group/row">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <button 
                                onClick={() => toggleTaskCompleteMutation.mutate(task.id)}
                                className={cn(
                                  "h-4 w-4 rounded border border-neutral-400/30 flex items-center justify-center hover:border-cyan-500/60 transition-colors cursor-pointer shrink-0",
                                  task.status === 'DONE' && "bg-cyan-500/10 border-cyan-500 text-cyan-400"
                                )}
                              >
                                {task.status === 'DONE' && <Check className="h-3 w-3 stroke-[3px]" />}
                              </button>
                              
                              {task.scheduledTime && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                  <Clock className="h-2 w-2" /> {task.scheduledTime}
                                </span>
                              )}

                              <span 
                                onClick={() => startEditing(task)}
                                className={cn(
                                  "text-xs font-medium truncate cursor-pointer hover:underline",
                                  task.status === 'DONE' ? 'line-through text-neutral-500' : 'text-neutral-800 dark:text-neutral-200'
                                )}
                              >
                                {task.title}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEditing(task)}
                                className="h-6 w-6 rounded hover:bg-neutral-800/40 border border-transparent hover:border-neutral-700/20 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                                title="Görevi Düzenle"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => shiftTask(task.id, today)}
                                className="h-6 w-6 rounded hover:bg-neutral-800/40 border border-transparent hover:border-neutral-700/20 text-neutral-400 hover:text-cyan-400 flex items-center justify-center transition-all cursor-pointer"
                                title="Bugüne Taşı"
                              >
                                <ArrowLeft className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => deleteTaskMutation.mutate(task.id)}
                                className="h-6 w-6 rounded hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                                title="Sil"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {/* Notes Preview if exists */}
                          {task.notes && (
                            <div 
                              onClick={() => startEditing(task)}
                              className="mt-1.5 p-2 rounded bg-neutral-950/10 border border-neutral-800/10 text-[10px] text-neutral-500 cursor-pointer hover:border-neutral-700/20 transition-all font-mono"
                            >
                              <div className="prose prose-sm prose-invert">{renderMarkdown(task.notes)}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bottom inline add task toggle form */}
          <div className="w-full pt-3 mt-4 border-t border-neutral-200/10">
            {showAddFormTomorrow ? (
              <form onSubmit={handleAddTomorrowTask} className="glass-panel border-cyan-500/20 rounded-xl p-3.5 space-y-3 animate-fade-in">
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={tomorrowFormTime}
                    onChange={(e) => setTomorrowFormTime(e.target.value)}
                    className="bg-neutral-800/40 border border-neutral-700/30 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-cyan-500/50 cursor-pointer w-24 shrink-0"
                  />
                  <input
                    type="text"
                    value={tomorrowFormTitle}
                    onChange={(e) => setTomorrowFormTitle(e.target.value)}
                    className="flex-grow bg-neutral-800/40 border border-neutral-700/30 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-cyan-500/50"
                    placeholder="Görev başlığı..."
                    required
                  />
                </div>
                
                <textarea
                  value={tomorrowFormNotes}
                  onChange={(e) => setTomorrowFormNotes(e.target.value)}
                  className="w-full bg-neutral-800/40 border border-neutral-700/30 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-500/50 min-h-[50px] resize-y"
                  placeholder="Not (opsiyonel) - markdown destekler..."
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddFormTomorrow(false)}
                    className="px-3 py-1 rounded text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    İptal
                  </button>
                  <Button type="submit" variant="glass" size="sm" className="h-8">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Ekle
                  </Button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddFormTomorrow(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-neutral-400/20 hover:border-cyan-500/40 hover:bg-cyan-500/5 text-xs text-neutral-500 hover:text-cyan-400 transition-all cursor-pointer font-medium"
              >
                <Plus className="h-3.5 w-3.5" /> Görev ekle
              </button>
            )}
          </div>
        </div>

        {/* Column 3: Premium Water Tracker Widget (1/3 width) */}
        <div className="glass-panel rounded-2xl p-5 space-y-5 relative overflow-hidden flex flex-col justify-between min-h-[400px]">
          <div className="space-y-4 w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <Droplet className="h-5 w-5 fill-primary text-cyan-400 animate-pulse" />
                <h3 className="font-extrabold text-base text-neutral-900 dark:text-white">Su Takibi</h3>
              </div>
              <Badge variant="outline" className="border-cyan-500/20 text-cyan-400 bg-cyan-500/5 font-semibold text-[10px]">
                {Math.max(0, (waterGoal - waterAmount) / 1000).toFixed(1)}L kaldı
              </Badge>
            </div>

            {/* Circular wave tracker */}
            <div className="flex items-center gap-6 py-2 border-b border-neutral-200/10 pb-4">
              {/* Animated wave circle (using top styling to prevent animation collision) */}
              <div className="relative h-28 w-28 rounded-full border-[3px] border-cyan-500/20 flex items-center justify-center overflow-hidden bg-neutral-950/20 shrink-0 shadow-[0_0_20px_rgba(0,255,255,0.01)]">
                {/* Wave effect layer inside */}
                <div 
                  className="absolute left-[-50%] w-[200%] h-[200%] bg-cyan-500/25 rounded-[38%] animate-wave z-10 transition-all duration-1000 ease-out"
                  style={{ 
                    top: `${100 - waterPercentage}%` 
                  }}
                />
                <div 
                  className="absolute left-[-50%] w-[200%] h-[200%] bg-cyan-500/15 rounded-[35%] animate-wave-slow z-0 transition-all duration-1000 ease-out"
                  style={{ 
                    top: `${100 - waterPercentage - 4}%` 
                  }}
                />
                
                {/* Percentage Centered Info Text */}
                <div className="z-20 text-center select-none">
                  <span className="text-xl font-extrabold tracking-tighter text-neutral-900 dark:text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                    {waterPercentage}%
                  </span>
                  <p className="text-[8px] uppercase font-bold tracking-widest text-neutral-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                    hedefin
                  </p>
                </div>
              </div>

              {/* Right statistics info */}
              <div className="space-y-1.5">
                <div>
                  <div className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                    {waterAmount} ml
                  </div>
                  <div className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                    bugün içilen
                  </div>
                </div>
                
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  hedef {waterGoal / 1000}L
                </div>
              </div>
            </div>

            {/* 2x2 Grid of Presets using Glass Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <Button 
                variant="glass" 
                onClick={() => handleAddWater('BOTTLE_1500')}
                className="w-full text-left"
                contentClassName="flex items-center gap-2 px-3 py-2.5 justify-start"
              >
                <Droplet className="h-3.5 w-3.5 text-cyan-400 fill-cyan-400/20 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-neutral-200 truncate leading-tight">Şişe</div>
                  <div className="text-[9px] text-neutral-400 font-semibold leading-none">+1.5L</div>
                </div>
              </Button>

              <Button 
                variant="glass" 
                onClick={() => handleAddWater('GLASS_300')}
                className="w-full text-left"
                contentClassName="flex items-center gap-2 px-3 py-2.5 justify-start"
              >
                <Droplet className="h-3.5 w-3.5 text-cyan-400 fill-cyan-400/20 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-neutral-200 truncate leading-tight">Bardak</div>
                  <div className="text-[9px] text-neutral-400 font-semibold leading-none">+300ml</div>
                </div>
              </Button>

              <Button 
                variant="glass" 
                onClick={() => handleAddWater('CUSTOM', 470)}
                className="w-full text-left"
                contentClassName="flex items-center gap-2 px-3 py-2.5 justify-start"
              >
                <Droplet className="h-3.5 w-3.5 text-cyan-400 fill-cyan-400/20 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-neutral-200 truncate leading-tight">Stanley</div>
                  <div className="text-[9px] text-neutral-400 font-semibold leading-none">+470ml</div>
                </div>
              </Button>

              <Button 
                variant="glass" 
                onClick={() => handleAddWater('HALF_500')}
                className="w-full text-left"
                contentClassName="flex items-center gap-2 px-3 py-2.5 justify-start"
              >
                <Droplet className="h-3.5 w-3.5 text-cyan-400 fill-cyan-400/20 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-neutral-200 truncate leading-tight">Yarım</div>
                  <div className="text-[9px] text-neutral-400 font-semibold leading-none">+500ml</div>
                </div>
              </Button>
            </div>

            {/* Stepper with custom ml increment */}
            <div className="flex items-center gap-2.5 pt-1">
              <div className="flex items-center bg-neutral-900/50 border border-neutral-800/40 rounded-full h-9 px-1.5 shrink-0">
                <button 
                  onClick={() => setCustomStepperMl(prev => Math.max(50, prev - 50))}
                  className="h-6 w-6 rounded-full hover:bg-neutral-800/60 flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer"
                  title="Azalt"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <div className="w-14 text-center select-none">
                  <span className="text-xs font-extrabold text-white">{customStepperMl}</span>
                  <span className="text-[8px] font-bold text-neutral-500 uppercase ml-0.5">ml</span>
                </div>
                <button 
                  onClick={() => setCustomStepperMl(prev => prev + 50)}
                  className="h-6 w-6 rounded-full hover:bg-neutral-800/60 flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer"
                  title="Arttır"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              <Button 
                variant="glass"
                onClick={() => handleAddWater('CUSTOM', customStepperMl)}
                className="flex-grow h-9 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Ekle
              </Button>
            </div>
          </div>

          {/* Stepper Footer controls */}
          <div className="flex justify-between items-center pt-3 mt-4 border-t border-neutral-200/10">
            <button 
              onClick={handleUndoWater}
              disabled={!waterSummary?.logs || waterSummary.logs.length === 0}
              className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Undo className="h-3 w-3 text-orange-400" /> Geri al
            </button>

            <button 
              onClick={handleResetDay}
              disabled={!waterSummary?.logs || waterSummary.logs.length === 0}
              className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 hover:text-red-400 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Günü sıfırla
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default DashboardPage
