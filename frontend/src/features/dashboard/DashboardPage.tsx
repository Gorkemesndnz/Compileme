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
  Sun,
  Calendar,
  Layers,
  GraduationCap,
  Inbox
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
import { Button as MovingBorderButton } from '../../components/ui/moving-border'

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
  
  // Dynamic column 1 focus date state (Default to today)
  const [focusedDate, setFocusedDate] = useState(today)

  // States for Quick Add Bar
  const [quickAddType, setQuickAddType] = useState<'idea' | 'task'>('idea')
  const [quickAddText, setQuickAddText] = useState('')
  const [quickAddDate, setQuickAddDate] = useState(today)
  const [quickAddTime, setQuickAddTime] = useState('')
  const quickAddInputRef = useRef<HTMLInputElement>(null)

  // States for Task Add Forms (Column 1, 2, 3)
  const [showAddFormFocused, setShowAddFormFocused] = useState(false)
  const [showAddFormTomorrow, setShowAddFormTomorrow] = useState(false)
  const [showAddFormMonth, setShowAddFormMonth] = useState(false)

  // Form Inputs
  const [focusedFormTitle, setFocusedFormTitle] = useState('')
  const [focusedFormTime, setFocusedFormTime] = useState('')
  const [focusedFormDuration, setFocusedFormDuration] = useState('')
  const [focusedFormNotes, setFocusedFormNotes] = useState('')
  const [focusedFormProj, setFocusedFormProj] = useState('')
  const [focusedFormEdu, setFocusedFormEdu] = useState('')
  const [focusedFormKind, setFocusedFormKind] = useState<'GENERAL' | 'PROJECT' | 'EDUCATION' | 'REFACTOR'>('GENERAL')

  const [tomorrowFormTitle, setTomorrowFormTitle] = useState('')
  const [tomorrowFormTime, setTomorrowFormTime] = useState('')
  const [tomorrowFormDuration, setTomorrowFormDuration] = useState('')
  const [tomorrowFormNotes, setTomorrowFormNotes] = useState('')
  const [tomorrowFormProj, setTomorrowFormProj] = useState('')
  const [tomorrowFormEdu, setTomorrowFormEdu] = useState('')
  const [tomorrowFormKind, setTomorrowFormKind] = useState<'GENERAL' | 'PROJECT' | 'EDUCATION' | 'REFACTOR'>('GENERAL')

  const [monthFormTitle, setMonthFormTitle] = useState('')
  const [monthFormDuration, setMonthFormDuration] = useState('')
  const [monthFormNotes, setMonthFormNotes] = useState('')
  const [monthFormProj, setMonthFormProj] = useState('')
  const [monthFormEdu, setMonthFormEdu] = useState('')
  const [monthFormKind, setMonthFormKind] = useState<'GENERAL' | 'PROJECT' | 'EDUCATION' | 'REFACTOR'>('GENERAL')

  // State for inline task editing
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editDuration, setEditDuration] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editProj, setEditProj] = useState('')
  const [editEdu, setEditEdu] = useState('')
  const [editKind, setEditKind] = useState<'GENERAL' | 'PROJECT' | 'EDUCATION' | 'REFACTOR'>('GENERAL')

  // Date and Stats Calculations
  const getWeekRange = () => {
    const todayDate = new Date()
    const day = todayDate.getDay()
    const monday = new Date(todayDate)
    const mondayOffset = day === 0 ? -6 : 1 - day
    monday.setDate(todayDate.getDate() + mondayOffset)
    
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

  // API Queries
  const { data: focusedTasks = [], isLoading: loadingFocused } = useTasks({ date: focusedDate })
  const { data: tomorrowTasks = [], isLoading: loadingTomorrow } = useTasks({ date: tomorrow })
  const { data: monthPlanTasks = [], isLoading: loadingMonthPlan } = useTasks({ bucket: 'MONTH' })
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

  // Keyboard shortcut for focusing quick add
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
        planningBucket: (quickAddDate === today || quickAddDate === tomorrow) ? 'DAY' : 'UNSCHEDULED'
      }, {
        onSuccess: () => {
          setQuickAddText('')
          setQuickAddTime('')
          toast.success('Görev eklendi.')
        }
      })
    }
  }

  // Task adding callbacks
  const handleAddFocusedTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!focusedFormTitle.trim()) return

    createTaskMutation.mutate({
      title: focusedFormTitle,
      status: 'TODO',
      kind: focusedFormKind,
      scheduledDate: focusedDate,
      scheduledTime: focusedFormTime || undefined,
      durationMinutes: focusedFormDuration ? parseInt(focusedFormDuration, 10) : undefined,
      notes: focusedFormNotes || undefined,
      projectId: focusedFormProj ? parseInt(focusedFormProj, 10) : undefined,
      educationId: focusedFormEdu ? parseInt(focusedFormEdu, 10) : undefined,
      planningBucket: 'DAY'
    }, {
      onSuccess: () => {
        setFocusedFormTitle('')
        setFocusedFormTime('')
        setFocusedFormDuration('')
        setFocusedFormNotes('')
        setFocusedFormProj('')
        setFocusedFormEdu('')
        setFocusedFormKind('GENERAL')
        setShowAddFormFocused(false)
        toast.success('Görev eklendi.')
      }
    })
  }

  const handleAddTomorrowTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tomorrowFormTitle.trim()) return

    createTaskMutation.mutate({
      title: tomorrowFormTitle,
      status: 'TODO',
      kind: tomorrowFormKind,
      scheduledDate: tomorrow,
      scheduledTime: tomorrowFormTime || undefined,
      durationMinutes: tomorrowFormDuration ? parseInt(tomorrowFormDuration, 10) : undefined,
      notes: tomorrowFormNotes || undefined,
      projectId: tomorrowFormProj ? parseInt(tomorrowFormProj, 10) : undefined,
      educationId: tomorrowFormEdu ? parseInt(tomorrowFormEdu, 10) : undefined,
      planningBucket: 'DAY'
    }, {
      onSuccess: () => {
        setTomorrowFormTitle('')
        setTomorrowFormTime('')
        setTomorrowFormDuration('')
        setTomorrowFormNotes('')
        setTomorrowFormProj('')
        setTomorrowFormEdu('')
        setTomorrowFormKind('GENERAL')
        setShowAddFormTomorrow(false)
        toast.success('Görev eklendi.')
      }
    })
  }

  const handleAddMonthTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!monthFormTitle.trim()) return

    const currentYearMonth = focusedDate.substring(0, 7) // YYYY-MM format

    createTaskMutation.mutate({
      title: monthFormTitle,
      status: 'TODO',
      kind: monthFormKind,
      scheduledDate: undefined,
      scheduledTime: undefined,
      durationMinutes: monthFormDuration ? parseInt(monthFormDuration, 10) : undefined,
      notes: monthFormNotes || undefined,
      projectId: monthFormProj ? parseInt(monthFormProj, 10) : undefined,
      educationId: monthFormEdu ? parseInt(monthFormEdu, 10) : undefined,
      planningBucket: 'MONTH',
      targetPeriod: currentYearMonth
    }, {
      onSuccess: () => {
        setMonthFormTitle('')
        setMonthFormDuration('')
        setMonthFormNotes('')
        setMonthFormProj('')
        setMonthFormEdu('')
        setMonthFormKind('GENERAL')
        setShowAddFormMonth(false)
        toast.success('Aylık plana görev eklendi.')
      }
    })
  }

  // Toggle Complete Handler (Optimistic with completed_at handling)
  const handleToggleComplete = (task: any) => {
    const isDone = task.status === 'DONE'
    const newStatus = isDone ? 'TODO' : 'DONE'
    const completedAtValue = isDone ? null : new Date().toISOString()

    // Optimistically update the active task lists in React Query Cache
    const listsToUpdate = [['tasks', { date: focusedDate }], ['tasks', { date: tomorrow }], ['tasks', { bucket: 'MONTH' }]]
    
    listsToUpdate.forEach(queryKey => {
      const data = queryClient.getQueryData<any[]>(queryKey)
      if (data) {
        queryClient.setQueryData(queryKey, data.map(t => t.id === task.id ? { ...t, status: newStatus, completedAt: completedAtValue } : t))
      }
    })

    toggleTaskCompleteMutation.mutate(task.id, {
      onError: (err) => {
        toast.error(`Durum güncellenirken hata oluştu: ${err.message}`)
      }
    })
  }

  const handleAddWater = (source: 'GLASS_300' | 'HALF_500' | 'BOTTLE_1500' | 'CUSTOM', amount?: number) => {
    addWaterMutation.mutate({
      source,
      amountMl: amount,
      logDate: today
    }, {
      onSuccess: (data) => {
        toast.success(`${data.amountMl} ml su eklendi.`)
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

  // Inline Edit Trigger
  const startEditing = (task: any) => {
    setEditingTaskId(task.id)
    setEditTitle(task.title || '')
    setEditTime(task.scheduledTime || '')
    setEditDuration(task.durationMinutes ? String(task.durationMinutes) : '')
    setEditNotes(task.notes || '')
    setEditProj(task.projectId ? String(task.projectId) : '')
    setEditEdu(task.educationId ? String(task.educationId) : '')
    setEditKind(task.kind || 'GENERAL')
  }

  // Inline Edit Save
  const saveTaskEdit = (id: number) => {
    if (!editTitle.trim()) return

    updateTaskMutation.mutate({
      id,
      request: {
        title: editTitle,
        scheduledTime: editTime || undefined,
        durationMinutes: editDuration ? parseInt(editDuration, 10) : undefined,
        notes: editNotes || undefined,
        projectId: editProj ? parseInt(editProj, 10) : undefined,
        educationId: editEdu ? parseInt(editEdu, 10) : undefined,
        kind: editKind
      }
    }, {
      onSuccess: () => {
        setEditingTaskId(null)
        toast.success('Görev güncellendi.')
      }
    })
  }

  // Defer / Move Task to Tomorrow
  const handleDeferToTomorrow = (task: any) => {
    moveTaskToTomorrowMutation.mutate({
      id: task.id,
      scheduledDate: tomorrow,
      planningBucket: 'DAY'
    }, {
      onSuccess: () => {
        toast.success('Görev yarına ertelendi.')
      }
    })
  }

  // Dynamic active/planned days list for Column 3 (Smart Calendar Focus)
  const planliGunler = Array.from(
    new Set(
      monthTasks
        .filter(t => t.scheduledDate && t.scheduledDate !== today && t.scheduledDate !== tomorrow)
        .map(t => t.scheduledDate)
    )
  ).sort()

  // Native HTML5 Drag and Drop Event Handlers
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("text/plain", taskId.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetBucket: 'DAY' | 'MONTH', targetDate?: string) => {
    e.preventDefault()
    const taskIdStr = e.dataTransfer.getData("text/plain")
    if (!taskIdStr) return
    const taskId = parseInt(taskIdStr, 10)

    const updateData: any = {
      planningBucket: targetBucket
    }

    if (targetBucket === 'DAY') {
      updateData.scheduledDate = targetDate
    } else if (targetBucket === 'MONTH') {
      updateData.scheduledDate = null
      updateData.scheduledTime = null
      updateData.targetPeriod = focusedDate.substring(0, 7)
    }

    updateTaskMutation.mutate({
      id: taskId,
      request: updateData
    }, {
      onSuccess: () => {
        toast.success('Görev başarıyla taşındı.')
      }
    })
  }

  // Date and stats summaries
  const completedTodayCount = focusedTasks.filter(t => t.status === 'DONE').length
  const totalTodayCount = focusedTasks.length

  const completedWeekCount = weekTasks.filter(t => t.status === 'DONE').length
  const totalWeekCount = weekTasks.length

  const completedMonthCount = monthTasks.filter(t => t.status === 'DONE').length
  const totalMonthCount = monthTasks.length

  const activeProjectsCount = projects.filter(p => p.status === 'ACTIVE').length

  const waterAmount = waterSummary?.consumedMl || 0
  const waterGoal = waterSummary?.targetMl || 3000
  const waterPercentage = Math.min(100, waterSummary?.percent ?? Math.round((waterAmount / waterGoal) * 100))

  const formatTurkishDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
  }

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

  // Task Render Helper
  const renderTaskRow = (task: any) => {
    const isEditing = editingTaskId === task.id
    
    // Project & Education Lookups
    const linkedProject = projects.find(p => p.id === task.projectId)
    const linkedEdu = educations.find(e => e.id === task.educationId)

    return (
      <div 
        key={task.id}
        draggable={!isEditing}
        onDragStart={(e) => handleDragStart(e, task.id)}
        className={cn(
          "rounded-xl border border-neutral-200/10 bg-neutral-900/5 hover:bg-neutral-900/10 dark:bg-white/5 dark:hover:bg-white/10 p-3.5 transition-all select-none cursor-grab active:cursor-grabbing",
          isEditing && "border-cyan-500/40 bg-neutral-900/10 dark:bg-white/10"
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
                className="flex-grow bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-cyan-500/50"
                placeholder="Görev başlığı..."
              />
              <input
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-cyan-500/50 cursor-pointer"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-cyan-500/50"
                placeholder="Süre (dk)"
              />
              <select
                value={editProj}
                onChange={(e) => setEditProj(e.target.value)}
                className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-cyan-500/50"
              >
                <option value="">Proje Yok</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                value={editEdu}
                onChange={(e) => setEditEdu(e.target.value)}
                className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-cyan-500/50"
              >
                <option value="">Eğitim Yok</option>
                {educations.map(edu => (
                  <option key={edu.id} value={edu.id}>{edu.title}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <select
                value={editKind}
                onChange={(e) => setEditKind(e.target.value as any)}
                className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs outline-none"
              >
                <option value="GENERAL">GENEL</option>
                <option value="PROJECT">PROJE</option>
                <option value="EDUCATION">EĞİTİM</option>
                <option value="REFACTOR">REFAKTÖR</option>
              </select>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="flex-grow bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-xs outline-none focus:border-cyan-500/50 min-h-[40px] resize-y font-mono"
                placeholder="Not ekle (markdown)..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingTaskId(null)}
                className="px-3 py-1 rounded text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition-colors"
              >
                İptal
              </button>
              {/* Retro Modern Sketch Button */}
              <button
                onClick={() => saveTaskEdit(task.id)}
                className="px-3 py-1 rounded-md border border-black bg-white text-black text-xs hover:shadow-[3px_3px_0px_0px_rgba(0,0,0)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)] transition duration-200"
              >
                Kaydet
              </button>
            </div>
          </div>
        ) : (
          /* Normal Task Row view */
          <div className="flex items-start justify-between gap-3 group/row">
            {/* Left Box: Tick Checkbox + Times */}
            <div className="flex items-start gap-2.5 pt-0.5">
              <div 
                onClick={() => handleToggleComplete(task)}
                className={cn(
                  "flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded border transition-all duration-200 mt-0.5",
                  task.status === 'DONE' 
                    ? "bg-cyan-500 border-cyan-500 text-white" 
                    : "border-neutral-400 dark:border-neutral-600 hover:border-cyan-400"
                )}
              >
                {task.status === 'DONE' && <Check className="h-3 w-3 stroke-[3]" />}
              </div>

              <div className="flex flex-col font-mono text-[10px] font-bold text-neutral-500 dark:text-neutral-400 shrink-0">
                {task.scheduledTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{task.scheduledTime.substring(0, 5)}</span>
                  </div>
                )}
                {task.durationMinutes && (
                  <span>{task.durationMinutes} dk</span>
                )}
              </div>
            </div>

            {/* Middle: Title, Notes, Capsules */}
            <div className="flex-grow min-w-0 space-y-1.5">
              <span 
                className={cn(
                  "block text-xs font-bold leading-snug break-words",
                  task.status === 'DONE' && "line-through text-neutral-500 dark:text-zinc-500"
                )}
              >
                {task.title}
              </span>
              
              {task.notes && (
                <div className="text-[10px] text-neutral-600 dark:text-zinc-400 leading-relaxed font-mono bg-neutral-900/5 dark:bg-white/5 p-2 rounded-lg max-h-24 overflow-y-auto">
                  {renderMarkdown(task.notes)}
                </div>
              )}

              {/* Linked objects tags with names lookup */}
              <div className="flex flex-wrap gap-1">
                {linkedProject && (
                  <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-extrabold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    <Layers className="h-2.5 w-2.5" />
                    {linkedProject.name}
                  </span>
                )}
                {linkedEdu && (
                  <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <GraduationCap className="h-2.5 w-2.5" />
                    {linkedEdu.title}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Kind Tag, Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn(
                "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase border tracking-wider",
                task.kind === 'PROJECT' && "border-blue-400/30 text-blue-500 bg-blue-500/5",
                task.kind === 'EDUCATION' && "border-emerald-400/30 text-emerald-500 bg-emerald-500/5",
                task.kind === 'REFACTOR' && "border-purple-400/30 text-purple-500 bg-purple-500/5",
                task.kind === 'GENERAL' && "border-neutral-400/30 text-neutral-500 bg-neutral-500/5"
              )}>
                {task.kind}
              </span>

              {/* Action Buttons (Visible on hover) */}
              <div className="opacity-0 group-hover/row:opacity-100 flex items-center gap-1 transition-opacity duration-200">
                <button
                  onClick={() => startEditing(task)}
                  className="p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition-colors"
                  title="Düzenle"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                {task.scheduledDate !== tomorrow && task.planningBucket === 'DAY' && (
                  <button
                    onClick={() => handleDeferToTomorrow(task)}
                    className="p-1 text-neutral-500 hover:text-cyan-500 transition-colors"
                    title="Yarına ertele"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
                <button
                  onClick={() => deleteTaskMutation.mutate(task.id)}
                  className="p-1 text-neutral-500 hover:text-red-500 transition-colors"
                  title="Görevi Sil"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    )
  }

  return (
    <div className="dashboard-page space-y-6 text-neutral-950 dark:text-neutral-100">
      
      {/* Greeting & Micro Water Tracker Container */}
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

      {/* Horizontal Terminal Metrics Row */}
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

      {/* 3 Column Timeline Layout (Today, Tomorrow, Month Plan) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sütun 1: Bugün (Odak Günü) */}
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'DAY', focusedDate)}
          className="glass-panel bg-white/75 dark:bg-zinc-950/75 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between min-h-[500px]"
        >
          <div className="space-y-4 w-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 dark:border-neutral-200/10">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-neutral-900 dark:text-white">
                  {focusedDate === today ? 'Bugün' : 'Planlı Gün'}
                </span>
                <span className="rounded-full border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-700 dark:border-neutral-800/40 dark:bg-neutral-900/40 dark:text-neutral-400">
                  {formatTurkishDate(focusedDate)}
                </span>
              </div>
              {focusedDate !== today && (
                <button
                  onClick={() => setFocusedDate(today)}
                  className="text-[10px] font-bold text-cyan-500 hover:text-cyan-600 transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Bugüne Dön
                </button>
              )}
            </div>

            {/* List */}
            {loadingFocused ? (
              <div className="space-y-2 py-4 animate-pulse">
                <div className="h-12 bg-neutral-200 dark:bg-neutral-850 rounded-xl" />
                <div className="h-12 bg-neutral-200 dark:bg-neutral-850 rounded-xl" />
              </div>
            ) : focusedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-neutral-400 dark:text-zinc-500 space-y-2 select-none">
                <Inbox className="h-8 w-8 stroke-[1.2]" />
                <p className="text-xs font-medium">Bu gün için görev bulunmuyor.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                {focusedTasks.map(renderTaskRow)}
              </div>
            )}
          </div>

          {/* Sütun Altı "+ Görev Ekle" Aceternity Moving Border Butonu */}
          <div className="pt-2">
            {showAddFormFocused ? (
              <form onSubmit={handleAddFocusedTask} className="space-y-3 bg-neutral-100/50 dark:bg-white/5 p-4 rounded-xl border border-neutral-200/10 animate-fade-in">
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={focusedFormTitle}
                    onChange={(e) => setFocusedFormTitle(e.target.value)}
                    placeholder="Görev adı..."
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-cyan-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      value={focusedFormTime}
                      onChange={(e) => setFocusedFormTime(e.target.value)}
                      className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs outline-none"
                    />
                    <input
                      type="number"
                      value={focusedFormDuration}
                      onChange={(e) => setFocusedFormDuration(e.target.value)}
                      placeholder="Süre (dk)"
                      className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={focusedFormProj}
                      onChange={(e) => setFocusedFormProj(e.target.value)}
                      className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-xs outline-none"
                    >
                      <option value="">Proje İlişkilendir</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <select
                      value={focusedFormEdu}
                      onChange={(e) => setFocusedFormEdu(e.target.value)}
                      className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-xs outline-none"
                    >
                      <option value="">Eğitim İlişkilendir</option>
                      {educations.map(edu => (
                        <option key={edu.id} value={edu.id}>{edu.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={focusedFormKind}
                      onChange={(e) => setFocusedFormKind(e.target.value as any)}
                      className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs outline-none shrink-0"
                    >
                      <option value="GENERAL">GENEL</option>
                      <option value="PROJECT">PROJE</option>
                      <option value="EDUCATION">EĞİTİM</option>
                      <option value="REFACTOR">REFAKTÖR</option>
                    </select>
                    <input
                      type="text"
                      value={focusedFormNotes}
                      onChange={(e) => setFocusedFormNotes(e.target.value)}
                      placeholder="Not ekle (markdown)..."
                      className="flex-grow bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddFormFocused(false)}
                    className="px-3 py-1 rounded text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    İptal
                  </button>
                  {/* Retro Modern Sketch Button */}
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-md border border-black bg-white text-black text-xs hover:shadow-[3px_3px_0px_0px_rgba(0,0,0)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)] transition duration-200"
                  >
                    Ekle
                  </button>
                </div>
              </form>
            ) : (
              <MovingBorderButton
                borderRadius="1rem"
                onClick={() => setShowAddFormFocused(true)}
                containerClassName="w-full h-10"
                className="bg-white/80 dark:bg-slate-900/80 text-black dark:text-white border-neutral-200 dark:border-slate-800 text-xs font-semibold backdrop-blur-sm shadow-sm"
              >
                + Görev Ekle
              </MovingBorderButton>
            )}
          </div>

        </div>

        {/* Sütun 2: Yarın */}
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'DAY', tomorrow)}
          className="glass-panel bg-white/75 dark:bg-zinc-950/75 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between min-h-[500px]"
        >
          <div className="space-y-4 w-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 dark:border-neutral-200/10">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-neutral-900 dark:text-white">Yarın</span>
                <span className="rounded-full border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-700 dark:border-neutral-800/40 dark:bg-neutral-900/40 dark:text-neutral-400">
                  {formatTurkishDate(tomorrow)}
                </span>
              </div>
            </div>

            {/* List */}
            {loadingTomorrow ? (
              <div className="space-y-2 py-4 animate-pulse">
                <div className="h-12 bg-neutral-200 dark:bg-neutral-850 rounded-xl" />
                <div className="h-12 bg-neutral-200 dark:bg-neutral-850 rounded-xl" />
              </div>
            ) : tomorrowTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-neutral-400 dark:text-zinc-500 space-y-2 select-none">
                <Inbox className="h-8 w-8 stroke-[1.2]" />
                <p className="text-xs font-medium">Yarın için görev bulunmuyor.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                {tomorrowTasks.map(renderTaskRow)}
              </div>
            )}
          </div>

          {/* Sütun Altı "+ Görev Ekle" Aceternity Moving Border Butonu */}
          <div className="pt-2">
            {showAddFormTomorrow ? (
              <form onSubmit={handleAddTomorrowTask} className="space-y-3 bg-neutral-100/50 dark:bg-white/5 p-4 rounded-xl border border-neutral-200/10 animate-fade-in">
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={tomorrowFormTitle}
                    onChange={(e) => setTomorrowFormTitle(e.target.value)}
                    placeholder="Görev adı..."
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-cyan-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      value={tomorrowFormTime}
                      onChange={(e) => setTomorrowFormTime(e.target.value)}
                      className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs outline-none"
                    />
                    <input
                      type="number"
                      value={tomorrowFormDuration}
                      onChange={(e) => setTomorrowFormDuration(e.target.value)}
                      placeholder="Süre (dk)"
                      className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={tomorrowFormProj}
                      onChange={(e) => setTomorrowFormProj(e.target.value)}
                      className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-xs outline-none"
                    >
                      <option value="">Proje İlişkilendir</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <select
                      value={tomorrowFormEdu}
                      onChange={(e) => setTomorrowFormEdu(e.target.value)}
                      className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-xs outline-none"
                    >
                      <option value="">Eğitim İlişkilendir</option>
                      {educations.map(edu => (
                        <option key={edu.id} value={edu.id}>{edu.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={tomorrowFormKind}
                      onChange={(e) => setTomorrowFormKind(e.target.value as any)}
                      className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs outline-none shrink-0"
                    >
                      <option value="GENERAL">GENEL</option>
                      <option value="PROJECT">PROJE</option>
                      <option value="EDUCATION">EĞİTİM</option>
                      <option value="REFACTOR">REFAKTÖR</option>
                    </select>
                    <input
                      type="text"
                      value={tomorrowFormNotes}
                      onChange={(e) => setTomorrowFormNotes(e.target.value)}
                      placeholder="Not ekle (markdown)..."
                      className="flex-grow bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddFormTomorrow(false)}
                    className="px-3 py-1 rounded text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    İptal
                  </button>
                  {/* Retro Modern Sketch Button */}
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-md border border-black bg-white text-black text-xs hover:shadow-[3px_3px_0px_0px_rgba(0,0,0)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)] transition duration-200"
                  >
                    Ekle
                  </button>
                </div>
              </form>
            ) : (
              <MovingBorderButton
                borderRadius="1rem"
                onClick={() => setShowAddFormTomorrow(true)}
                containerClassName="w-full h-10"
                className="bg-white/80 dark:bg-slate-900/80 text-black dark:text-white border-neutral-200 dark:border-slate-800 text-xs font-semibold backdrop-blur-sm shadow-sm"
              >
                + Görev Ekle
              </MovingBorderButton>
            )}
          </div>

        </div>

        {/* Sütun 3: Aylık Plan & Akıllı Takvim Odaklayıcı */}
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'MONTH')}
          className="glass-panel bg-white/75 dark:bg-zinc-950/75 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between min-h-[500px]"
        >
          <div className="space-y-4 w-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 dark:border-neutral-200/10">
              <span className="text-base font-extrabold text-neutral-900 dark:text-white">Aylık Plan</span>
            </div>

            {/* A. Aylık Genel Havuz (Tarihsiz İşler) */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-neutral-500 dark:text-zinc-500 block">Tarihsiz Aylık Havuz</span>
              {loadingMonthPlan ? (
                <div className="h-10 bg-neutral-200 dark:bg-neutral-850 rounded-xl animate-pulse" />
              ) : monthPlanTasks.length === 0 ? (
                <p className="text-[10px] text-neutral-500 italic py-2 text-center">Bu ay için tarihsiz görev yok.</p>
              ) : (
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {monthPlanTasks.map(renderTaskRow)}
                </div>
              )}
            </div>

            {/* B. Sadece Planlı Günler Listesi (Akıllı Takvim Odaklayıcı) */}
            <div className="space-y-2 border-t border-neutral-200/50 dark:border-zinc-800/50 pt-3">
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-neutral-500 dark:text-zinc-500 block">Planlı Günler Odaklayıcı</span>
              {planliGunler.length === 0 ? (
                <p className="text-[10px] text-neutral-500 italic py-2 text-center">Ayın kalanında planlı gün bulunmuyor.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {planliGunler.map(dateStr => {
                    const count = monthTasks.filter(t => t.scheduledDate === dateStr).length
                    const isCurrentFocus = focusedDate === dateStr
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setFocusedDate(dateStr)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all duration-200 cursor-pointer shadow-sm",
                          isCurrentFocus
                            ? "bg-cyan-500 border-cyan-500 text-white dark:bg-cyan-500"
                            : "bg-white/50 border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-neutral-300 dark:hover:bg-zinc-800"
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        <span>{formatTurkishDate(dateStr)}</span>
                        <span className={cn(
                          "rounded-full px-1.5 py-0.2 text-[8px] font-extrabold",
                          isCurrentFocus ? "bg-white text-cyan-600" : "bg-neutral-200 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400"
                        )}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Sütun Altı "+ Görev Ekle" Aceternity Moving Border Butonu */}
          <div className="pt-2">
            {showAddFormMonth ? (
              <form onSubmit={handleAddMonthTask} className="space-y-3 bg-neutral-100/50 dark:bg-white/5 p-4 rounded-xl border border-neutral-200/10 animate-fade-in">
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={monthFormTitle}
                    onChange={(e) => setMonthFormTitle(e.target.value)}
                    placeholder="Görev adı..."
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-cyan-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={monthFormDuration}
                      onChange={(e) => setMonthFormDuration(e.target.value)}
                      placeholder="Süre (dk)"
                      className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs outline-none"
                    />
                    <select
                      value={monthFormProj}
                      onChange={(e) => setMonthFormProj(e.target.value)}
                      className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-xs outline-none"
                    >
                      <option value="">Proje İlişkilendir</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={monthFormEdu}
                      onChange={(e) => setMonthFormEdu(e.target.value)}
                      className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-xs outline-none"
                    >
                      <option value="">Eğitim İlişkilendir</option>
                      {educations.map(edu => (
                        <option key={edu.id} value={edu.id}>{edu.title}</option>
                      ))}
                    </select>
                    <select
                      value={monthFormKind}
                      onChange={(e) => setMonthFormKind(e.target.value as any)}
                      className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs outline-none shrink-0"
                    >
                      <option value="GENERAL">GENEL</option>
                      <option value="PROJECT">PROJE</option>
                      <option value="EDUCATION">EĞİTİM</option>
                      <option value="REFACTOR">REFAKTÖR</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={monthFormNotes}
                    onChange={(e) => setMonthFormNotes(e.target.value)}
                    placeholder="Not ekle (markdown)..."
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddFormMonth(false)}
                    className="px-3 py-1 rounded text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    İptal
                  </button>
                  {/* Retro Modern Sketch Button */}
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-md border border-black bg-white text-black text-xs hover:shadow-[3px_3px_0px_0px_rgba(0,0,0)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)] transition duration-200"
                  >
                    Ekle
                  </button>
                </div>
              </form>
            ) : (
              <MovingBorderButton
                borderRadius="1rem"
                onClick={() => setShowAddFormMonth(true)}
                containerClassName="w-full h-10"
                className="bg-white/80 dark:bg-slate-900/80 text-black dark:text-white border-neutral-200 dark:border-slate-800 text-xs font-semibold backdrop-blur-sm shadow-sm"
              >
                + Görev Ekle
              </MovingBorderButton>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}

export default DashboardPage
