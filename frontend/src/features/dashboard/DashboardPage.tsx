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
  Edit2,
  Sun
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import { DateTimePicker } from './DateTimePicker'
import { IdeaTaskToggle } from './IdeaTaskToggle'
import { TerminalMetrics } from './TerminalMetrics'
import { useSettings } from '../../api/settings'
import { useWeather } from '../../api/weather'
import { GreetingWithWeather } from './GreetingWithWeather'
import { MicroWaterTracker } from './MicroWaterTracker'
import { useQueryClient } from '@tanstack/react-query'

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient()
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

  // Local dates helpers for Week and Month Ranges
  const getWeekRange = () => {
    const todayDate = new Date()
    const day = todayDate.getDay()
    
    // Start of week (Monday)
    const monday = new Date(todayDate)
    const mondayOffset = day === 0 ? -6 : 1 - day
    monday.setDate(todayDate.getDate() + mondayOffset)
    
    // End of week (Sunday)
    const sunday = new Date(todayDate)
    const sundayOffset = day === 0 ? 0 : 7 - day
    sunday.setDate(todayDate.getDate() + sundayOffset)
    
    const toISOStringLocal = (date: Date) => {
      const offset = date.getTimezoneOffset()
      const local = new Date(date.getTime() - (offset * 60 * 1000))
      return local.toISOString().split('T')[0]
    }
    
    return {
      start: toISOStringLocal(monday),
      end: toISOStringLocal(sunday)
    }
  }

  const getMonthRange = () => {
    const todayDate = new Date()
    
    const firstDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)
    const lastDay = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0)
    
    const toISOStringLocal = (date: Date) => {
      const offset = date.getTimezoneOffset()
      const local = new Date(date.getTime() - (offset * 60 * 1000))
      return local.toISOString().split('T')[0]
    }
    
    return {
      start: toISOStringLocal(firstDay),
      end: toISOStringLocal(lastDay)
    }
  }

  const weekRange = getWeekRange()
  const monthRange = getMonthRange()

  const { data: todayTasks = [], isLoading: loadingToday } = useTasks({ date: today })
  const { data: tomorrowTasks = [], isLoading: loadingTomorrow } = useTasks({ date: tomorrow })
  const { data: weekTasks = [] } = useTasks({ from: weekRange.start, to: weekRange.end })
  const { data: monthTasks = [] } = useTasks({ from: monthRange.start, to: monthRange.end })
  const { data: projects = [] } = useProjects()
  const { data: educations = [] } = useEducations()
  const { data: ideas = [] } = useIdeas()
  const { data: waterSummary } = useWaterSummary(today)
  const { data: settings } = useSettings()
  const { data: weatherData } = useWeather(settings?.weatherCity || 'İstanbul')
  
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
        const originalLogs = [...waterSummary.logs]
        const originalAmount = waterSummary.consumedMl

        // Optimistically clear all water data in query client
        queryClient.setQueryData(['water', today], {
          ...waterSummary,
          consumedMl: 0,
          percent: 0,
          logs: []
        })

        try {
          await Promise.all(originalLogs.map(log => deleteWaterMutation.mutateAsync(log.id)))
          toast.success('Bugünkü su tüketim verileri sıfırlandı.')
        } catch (e) {
          // Rollback on error
          queryClient.setQueryData(['water', today], {
            ...waterSummary,
            consumedMl: originalAmount,
            percent: Math.min(100, Math.round((originalAmount / waterSummary.targetMl) * 100)),
            logs: originalLogs
          })
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

  const completedWeekCount = weekTasks.filter(t => t.status === 'DONE').length
  const totalWeekCount = weekTasks.length

  const completedMonthCount = monthTasks.filter(t => t.status === 'DONE').length
  const totalMonthCount = monthTasks.length
  
  const completedTomorrowCount = tomorrowTasks.filter(t => t.status === 'DONE').length
  const totalTomorrowCount = tomorrowTasks.length

  const activeProjectsCount = projects.filter(p => p.status === 'ACTIVE').length

  // Water stats
  const waterAmount = waterSummary?.consumedMl || 0
  const waterGoal = waterSummary?.targetMl || 3000
  const waterPercentage = Math.min(100, waterSummary?.percent ?? Math.round((waterAmount / waterGoal) * 100))

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
    <div className="dashboard-page space-y-6 text-neutral-950 dark:text-neutral-100">
      
      {/* Greeting & Micro Water Tracker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <GreetingWithWeather
          temp={weatherData?.main?.temp}
          condition={weatherData?.weather?.[0]?.main}
        />
        <div className="flex items-center self-end sm:self-auto bg-transparent relative z-20">
          <MicroWaterTracker
            waterAmount={waterAmount}
            waterGoal={waterGoal}
            waterPercentage={waterPercentage}
            onAddWater={handleAddWater}
            onUndoWater={handleUndoWater}
            onResetDay={handleResetDay}
            hasLogs={!!(waterSummary?.logs && waterSummary.logs.length > 0)}
          />
        </div>
      </div>

      {/* Quick Add Bar */}
      <div className="quick-add-bar glass-panel relative z-10 flex flex-col items-stretch gap-3 overflow-visible rounded-full px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
        <IdeaTaskToggle
          value={quickAddType}
          onValueChange={setQuickAddType}
          className="self-center sm:self-auto"
        />

        {/* Input Bar Form */}
        <form onSubmit={handleQuickAddSubmit} className="flex w-full min-w-0 flex-grow flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex h-10 min-w-0 flex-grow items-center px-2">
            <Input
              ref={quickAddInputRef}
              value={quickAddText}
              onChange={(e) => setQuickAddText(e.target.value)}
              placeholder={
                quickAddType === 'idea'
                  ? 'Aklındaki fikri yaz...'
                  : 'Yeni görev oluştur...'
              }
              className="h-10 w-full min-w-0 flex-grow appearance-none border-0 bg-transparent p-0 text-sm font-medium text-neutral-950 shadow-none outline-none ring-0 placeholder:text-neutral-600 focus:border-transparent focus:bg-transparent focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:bg-transparent"
            />
          </div>

          {/* Task specifics inline settings */}
          {quickAddType === 'task' && (
            <div className="w-full shrink-0 animate-fade-in sm:w-auto">
              <DateTimePicker
                date={quickAddDate}
                time={quickAddTime}
                onDateChange={setQuickAddDate}
                onTimeChange={setQuickAddTime}
              />
            </div>
          )}

          <button
            type="submit"
            className="group flex h-10 shrink-0 items-center justify-center gap-2 self-end bg-transparent px-2 text-neutral-950 sm:self-auto dark:text-white"
          >
            <span className="relative pb-1 text-xs font-black uppercase after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-bottom-right after:scale-x-0 after:bg-neutral-950 after:transition-transform after:duration-300 group-hover:after:origin-bottom-left group-hover:after:scale-x-100 dark:after:bg-white">
              Ekle
            </span>
            <ArrowRight className="h-4 w-5 -translate-x-2 transition-transform duration-300 group-hover:translate-x-0 group-active:scale-90" />
          </button>
        </form>
      </div>

      {/* Horizontal Stats summary row (Terminal Metrics) */}
      <TerminalMetrics
        completedTodayCount={completedTodayCount}
        totalTodayCount={totalTodayCount}
        completedWeekCount={completedWeekCount}
        totalWeekCount={totalWeekCount}
        completedMonthCount={completedMonthCount}
        totalMonthCount={totalMonthCount}
        activeProjects={projects}
        educations={educations}
        ideas={ideas}
      />

      {/* 2 Column Layout (Today, Tomorrow) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Column 1: Bugün (Today's Tasks) */}
        <div className="glass-panel rounded-2xl p-5 space-y-4 flex flex-col justify-between min-h-[400px]">
          <div className="space-y-4 w-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 dark:border-neutral-200/10">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-neutral-900 dark:text-white">Bugün</span>
                <span className="rounded-full border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-700 dark:border-neutral-800/40 dark:bg-neutral-900/40 dark:text-neutral-400">
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
              <p className="select-none py-12 text-center text-xs font-medium text-neutral-700 dark:text-neutral-400">Henüz görev yok.</p>
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
          <div className="mt-4 w-full border-t border-neutral-200 pt-3 dark:border-neutral-200/10">
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
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-400 py-2 text-xs font-bold text-neutral-800 transition-all hover:border-cyan-600 hover:bg-cyan-50 hover:text-cyan-700 dark:border-neutral-400/20 dark:text-neutral-400 dark:hover:border-cyan-500/40 dark:hover:bg-cyan-500/5 dark:hover:text-cyan-400"
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
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 dark:border-neutral-200/10">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-neutral-900 dark:text-white">Yarın</span>
                <span className="rounded-full border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-700 dark:border-neutral-800/40 dark:bg-neutral-900/40 dark:text-neutral-400">
                  {formatTurkishDate(tomorrow)}
                </span>
              </div>
              <Badge variant="outline" className="border-neutral-400 text-[10px] font-bold text-neutral-700 dark:border-neutral-800 dark:text-neutral-400">
                {completedTomorrowCount} / {totalTomorrowCount}
              </Badge>
            </div>

            {/* List */}
            {loadingTomorrow ? (
              <div className="space-y-2 py-4 animate-pulse">
                <div className="h-10 bg-neutral-800/20 rounded-xl" />
              </div>
            ) : tomorrowTasks.length === 0 ? (
              <p className="select-none py-12 text-center text-xs font-medium text-neutral-700 dark:text-neutral-400">Henüz görev yok.</p>
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
          <div className="mt-4 w-full border-t border-neutral-200 pt-3 dark:border-neutral-200/10">
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
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-400 py-2 text-xs font-bold text-neutral-800 transition-all hover:border-cyan-600 hover:bg-cyan-50 hover:text-cyan-700 dark:border-neutral-400/20 dark:text-neutral-400 dark:hover:border-cyan-500/40 dark:hover:bg-cyan-500/5 dark:hover:text-cyan-400"
              >
                <Plus className="h-3.5 w-3.5" /> Görev ekle
              </button>
            )}
          </div>
        </div>



      </div>
    </div>
  )
}

export default DashboardPage
