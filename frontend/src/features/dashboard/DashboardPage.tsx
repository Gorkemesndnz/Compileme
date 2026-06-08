import React, { useState, useEffect } from 'react'
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
import { 
  Droplet, 
  Plus, 
  Trash2, 
  Calendar, 
  ArrowRight, 
  Check, 
  AlertTriangle, 
  Activity, 
  Cpu, 
  Database, 
  RefreshCw,
  PlusCircle,
  TrendingUp,
  Circle,
  Undo,
  RotateCcw,
  Minus
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'

export const DashboardPage: React.FC = () => {
  // Local dates
  const getLocalDateString = (daysOffset = 0) => {
    const d = new Date()
    d.setDate(d.getDate() + daysOffset)
    const offset = d.getTimezoneOffset()
    const local = new Date(d.getTime() - (offset * 60 * 1000))
    return local.toISOString().split('T')[0]
  }

  const today = getLocalDateString(0)
  const tomorrow = getLocalDateString(1)
  
  // States for inputs
  const [todayInput, setTodayInput] = useState('')
  const [tomorrowInput, setTomorrowInput] = useState('')
  const [customWaterMl, setCustomWaterMl] = useState('')
  const [customStepperMl, setCustomStepperMl] = useState(300)

  // Query Hooks
  const { data: todayTasks = [], isLoading: loadingToday } = useTasks({ date: today })
  const { data: tomorrowTasks = [], isLoading: loadingTomorrow } = useTasks({ date: tomorrow })
  const { data: projects = [] } = useProjects()
  const { data: educations = [] } = useEducations()
  const { data: waterSummary, refetch: refetchWater } = useWaterSummary(today)
  
  // Past incomplete tasks hook
  const yesterday = getLocalDateString(-1)
  // We query tasks from 7 days ago to yesterday to find pending ones
  const sevenDaysAgo = getLocalDateString(-7)
  const { data: pastTasks = [] } = useTasks({ from: sevenDaysAgo, to: yesterday })

  // Mutations
  const createTaskMutation = useCreateTask()
  const toggleTaskCompleteMutation = useToggleTaskComplete()
  const moveTaskToTomorrowMutation = useMoveTaskToTomorrow()
  const deleteTaskMutation = useDeleteTask()
  const updateTaskMutation = useUpdateTask()
  
  const addWaterMutation = useAddWaterLog()
  const deleteWaterMutation = useDeleteWaterLog(today)

  // Incomplete past tasks
  const overdueTasks = pastTasks.filter(t => t.status === 'TODO')

  const handleRescheduleAll = async () => {
    if (overdueTasks.length === 0) return
    try {
      await Promise.all(overdueTasks.map(t => 
        updateTaskMutation.mutateAsync({ id: t.id, request: { scheduledDate: today } })
      ))
      toast.success('Geçmiş tamamlanmamış tüm görevler bugüne taşındı.')
    } catch (e) {
      toast.error('Görevler taşınırken bir hata oluştu.')
    }
  }

  const handleAddTask = (e: React.FormEvent, isTomorrow: boolean) => {
    e.preventDefault()
    const inputVal = isTomorrow ? tomorrowInput : todayInput
    if (!inputVal.trim()) return

    createTaskMutation.mutate({
      title: inputVal,
      status: 'TODO',
      kind: 'GENERAL',
      scheduledDate: isTomorrow ? tomorrow : today,
      planningBucket: 'DAY'
    }, {
      onSuccess: () => {
        if (isTomorrow) setTomorrowInput('')
        else setTodayInput('')
        toast.success('Görev başarıyla eklendi.')
      }
    })
  }

  const handleAddWater = (source: 'GLASS_300' | 'HALF_500' | 'BOTTLE_1500' | 'CUSTOM', amount?: number) => {
    let finalAmount = amount
    if (source === 'GLASS_300') finalAmount = 350 // Normal Bardak (350 ml)
    if (source === 'HALF_500') finalAmount = 500 // Küçük Şişe (500 ml)
    if (source === 'BOTTLE_1500') finalAmount = 1500 // Büyük Şişe (1500 ml)

    if (source === 'CUSTOM') {
      if (amount !== undefined) {
        finalAmount = amount
      } else {
        const parsed = parseInt(customWaterMl)
        if (isNaN(parsed) || parsed <= 0) {
          toast.error('Lütfen geçerli bir su miktarı girin.')
          return
        }
        finalAmount = parsed
      }
    }

    addWaterMutation.mutate({
      amountMl: finalAmount,
      source: source,
      logDate: today
    }, {
      onSuccess: () => {
        if (source === 'CUSTOM' && amount === undefined) setCustomWaterMl('')
        toast.success(`${finalAmount} ml su eklendi.`)
      }
    })
  }

  const handleDeleteWater = (id: number, amount: number) => {
    deleteWaterMutation.mutate(id, {
      onSuccess: () => {
        toast.success(`${amount} ml su tüketimi kaydı silindi.`)
      }
    })
  }

  const handleUndoWater = () => {
    if (waterSummary && waterSummary.logs && waterSummary.logs.length > 0) {
      // logs is sorted OrderByCreatedAtDesc, so index 0 is the most recent log
      const lastLog = waterSummary.logs[0]
      handleDeleteWater(lastLog.id, lastLog.amountMl)
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

  // Math stats
  const completedTodayCount = todayTasks.filter(t => t.status === 'DONE').length
  const totalTodayCount = todayTasks.length
  const taskProgressPercent = totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 0

  const activeProjectsCount = projects.filter(p => p.status === 'ACTIVE').length
  
  const avgEducationProgress = educations.length > 0 
    ? Math.round(educations.reduce((acc, curr) => acc + curr.progressPercent, 0) / educations.length) 
    : 0

  // Water calculations
  const waterAmount = waterSummary?.amountMl || 0
  const waterGoal = waterSummary?.goalMl || 3000
  const waterPercentage = Math.min(100, Math.round((waterAmount / waterGoal) * 100))
  // Calculate wave vertical position (height) based on percentage (0% is translate(100%), 100% is translate(0%))
  // We offset it so that it ranges from 100% (empty) down to -20% (fully covered)
  const waveHeightOffset = 100 - waterPercentage

  // Turkish date formatting
  const formattedDate = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <PageHeader 
        title="Anasayfa" 
        subtitle={formattedDate}
        action={
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-muted-foreground">
              Hoş geldin, <span className="text-foreground">Görkem</span>
            </span>
          </div>
        }
      />

      {/* Overdue (Yesterday/Past) Uncompleted Tasks Banner */}
      {overdueTasks.length > 0 && (
        <div className="glass-panel border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse-slow">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">
                Tamamlanmamış Geçmiş Görevler Var!
              </h4>
              <p className="text-xs text-muted-foreground">
                Son 7 güne ait yapılmamış {overdueTasks.length} adet görev bulunuyor.
              </p>
            </div>
          </div>
          <Button 
            variant="glass" 
            size="sm" 
            onClick={handleRescheduleAll}
            className="w-full sm:w-auto shrink-0"
          >
            Tümünü Bugüne Taşı
          </Button>
        </div>
      )}

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Task Progress Stats Card */}
        <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-foreground">Günlük Görevler</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Bugün yapılması gereken {totalTodayCount} görevden {completedTodayCount} adedi bitti.
          </p>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{taskProgressPercent}%</span>
            <span className="text-xs text-muted-foreground">tamamlandı</span>
          </div>
        </div>

        {/* Project Stats Card */}
        <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-foreground">Aktif Projeler</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Şu anda geliştirme aşamasında {activeProjectsCount} aktif projeniz bulunuyor.
          </p>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{activeProjectsCount}</span>
            <span className="text-xs text-muted-foreground">aktif proje</span>
          </div>
        </div>

        {/* Education Progress Stats Card */}
        <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-foreground">Eğitim İlerlemesi</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Kayıtlı eğitim kaynaklarınızda genel ortalama ilerleme yüzdeniz.
          </p>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{avgEducationProgress}%</span>
            <span className="text-xs text-muted-foreground">ortalama ilerleme</span>
          </div>
        </div>

      </div>

      {/* Bottom Layout - Tasks (Left) & Water Widget (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Tasks Area (2/3 width on wide screens) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Tasks */}
          <div className="glass-panel rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <h3 className="font-bold text-base text-foreground">Bugünkü Görevler</h3>
              </div>
              <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
                {totalTodayCount} Görev
              </Badge>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={(e) => handleAddTask(e, false)} className="flex gap-2">
              <Input 
                value={todayInput}
                onChange={(e) => setTodayInput(e.target.value)}
                placeholder="Bugün için yeni bir görev ekleyin..."
                className="flex-grow bg-secondary/20 border-border/40 focus:border-primary/50"
              />
              <Button type="submit" variant="glass" size="sm" className="h-10">
                <Plus className="h-4 w-4 mr-1" /> Ekle
              </Button>
            </form>

            {/* Tasks List */}
            {loadingToday ? (
              <div className="space-y-2 py-4">
                <div className="h-8 bg-muted/40 rounded-lg animate-pulse" />
                <div className="h-8 bg-muted/40 rounded-lg animate-pulse" />
              </div>
            ) : todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Bugün için planlanan herhangi bir görev yok.
              </p>
            ) : (
              <div className="space-y-2">
                {todayTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-secondary/10 hover:bg-secondary/20 transition-all group/item"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button 
                        onClick={() => toggleTaskCompleteMutation.mutate(task.id)}
                        className="h-5 w-5 rounded border border-border/80 flex items-center justify-center hover:border-primary text-primary transition-colors cursor-pointer shrink-0"
                      >
                        {task.status === 'DONE' && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                      </button>
                      <span className={`text-sm truncate ${task.status === 'DONE' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      {task.status !== 'DONE' && (
                        <button 
                          onClick={() => moveTaskToTomorrowMutation.mutate(task.id)}
                          title="Yarına Aktar"
                          className="h-7 w-7 rounded hover:bg-secondary border border-transparent hover:border-border text-muted-foreground hover:text-primary flex items-center justify-center transition-all cursor-pointer"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button 
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                        title="Görevi Sil"
                        className="h-7 w-7 rounded hover:bg-destructive/10 border border-transparent hover:border-destructive/20 text-muted-foreground hover:text-destructive flex items-center justify-center transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tomorrow's Tasks */}
          <div className="glass-panel rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <h3 className="font-bold text-base text-foreground">Yarınki Görevler</h3>
              </div>
              <Badge variant="outline" className="border-border text-muted-foreground bg-secondary/5">
                {tomorrowTasks.length} Görev
              </Badge>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={(e) => handleAddTask(e, true)} className="flex gap-2">
              <Input 
                value={tomorrowInput}
                onChange={(e) => setTomorrowInput(e.target.value)}
                placeholder="Yarın için yeni bir görev ekleyin..."
                className="flex-grow bg-secondary/20 border-border/40"
              />
              <Button type="submit" variant="glass" size="sm" className="h-10">
                <Plus className="h-4 w-4 mr-1" /> Ekle
              </Button>
            </form>

            {/* Tasks List */}
            {loadingTomorrow ? (
              <div className="space-y-2 py-4">
                <div className="h-8 bg-muted/40 rounded-lg animate-pulse" />
              </div>
            ) : tomorrowTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Yarın için planlanan herhangi bir görev yok.
              </p>
            ) : (
              <div className="space-y-2">
                {tomorrowTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-secondary/5 hover:bg-secondary/10 transition-all group/item"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button 
                        onClick={() => toggleTaskCompleteMutation.mutate(task.id)}
                        className="h-5 w-5 rounded border border-border/80 flex items-center justify-center hover:border-primary text-primary transition-colors cursor-pointer shrink-0"
                      >
                        {task.status === 'DONE' && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                      </button>
                      <span className={`text-sm truncate ${task.status === 'DONE' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button 
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                        title="Görevi Sil"
                        className="h-7 w-7 rounded hover:bg-destructive/10 border border-transparent hover:border-destructive/20 text-muted-foreground hover:text-destructive flex items-center justify-center transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Premium Water Tracker Widget (1/3 width) */}
        <div className="space-y-6">
          
          <div className="glass-panel rounded-xl p-6 space-y-5 relative overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <Droplet className="h-5 w-5 fill-primary text-cyan-400" />
                <h3 className="font-bold text-base text-foreground">Su Takibi</h3>
              </div>
              <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 font-semibold">
                {Math.max(0, (waterGoal - waterAmount) / 1000).toFixed(1)}L kaldı
              </Badge>
            </div>

            {/* Progress Container (Circle left, Info right) */}
            <div className="flex items-center gap-6 py-2 border-b border-border/20 pb-4">
              {/* Left: Wave Animated Circular Display */}
              <div className="relative h-32 w-32 rounded-full border-4 border-primary/20 flex items-center justify-center overflow-hidden bg-secondary/10 shrink-0 shadow-[0_0_30px_rgba(0,255,255,0.02)]">
                {/* Wave effect layer inside */}
                <div 
                  className="absolute bottom-0 left-0 right-0 w-[200%] h-[200%] bg-primary/40 rounded-[38%] animate-wave z-10 transition-transform duration-1000 ease-out"
                  style={{ 
                    transform: `translate(-25%, ${waveHeightOffset}%)` 
                  }}
                />
                <div 
                  className="absolute bottom-0 left-0 right-0 w-[200%] h-[200%] bg-primary/30 rounded-[35%] animate-wave-slow z-0 transition-transform duration-1000 ease-out"
                  style={{ 
                    transform: `translate(-25%, ${waveHeightOffset - 4}%)` 
                  }}
                />
                {/* Percentage Centered Info Text */}
                <div className="z-20 text-center select-none">
                  <span className="text-2xl font-extrabold tracking-tighter text-foreground drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
                    {waterPercentage}%
                  </span>
                  <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                    hedefin
                  </p>
                </div>
              </div>

              {/* Right: Stats info */}
              <div className="space-y-2">
                <div>
                  <div className="text-3xl font-extrabold text-foreground tracking-tight">
                    {waterAmount} ml
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    bugün içilen
                  </div>
                </div>
                
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/20 border border-border/40 text-xs font-semibold text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  hedef {waterGoal / 1000}L
                </div>
              </div>
            </div>

            {/* 2x2 Grid of Presets */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleAddWater('BOTTLE_1500')}
                className="w-full justify-start gap-2.5 h-12 bg-secondary/5 border-border/40 hover:bg-secondary/15 hover:border-primary/30 transition-all cursor-pointer group px-3"
              >
                <Droplet className="h-4 w-4 text-blue-500 fill-blue-500/10 group-hover:scale-110 transition-transform shrink-0" />
                <div className="text-left min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">Şişe</div>
                  <div className="text-[10px] text-muted-foreground">+1.5L</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                onClick={() => handleAddWater('GLASS_300')}
                className="w-full justify-start gap-2.5 h-12 bg-secondary/5 border-border/40 hover:bg-secondary/15 hover:border-primary/30 transition-all cursor-pointer group px-3"
              >
                <Droplet className="h-4 w-4 text-cyan-400 fill-cyan-400/10 group-hover:scale-110 transition-transform shrink-0" />
                <div className="text-left min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">Bardak</div>
                  <div className="text-[10px] text-muted-foreground">+350ml</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                onClick={() => handleAddWater('CUSTOM', 470)}
                className="w-full justify-start gap-2.5 h-12 bg-secondary/5 border-border/40 hover:bg-secondary/15 hover:border-primary/30 transition-all cursor-pointer group px-3"
              >
                <Droplet className="h-4 w-4 text-primary fill-primary/10 group-hover:scale-110 transition-transform shrink-0" />
                <div className="text-left min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">Stanley</div>
                  <div className="text-[10px] text-muted-foreground">+470ml</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                onClick={() => handleAddWater('HALF_500')}
                className="w-full justify-start gap-2.5 h-12 bg-secondary/5 border-border/40 hover:bg-secondary/15 hover:border-primary/30 transition-all cursor-pointer group px-3"
              >
                <Droplet className="h-4 w-4 text-blue-400 fill-blue-400/10 group-hover:scale-110 transition-transform shrink-0" />
                <div className="text-left min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">Yarım Şişe</div>
                  <div className="text-[10px] text-muted-foreground">+500ml</div>
                </div>
              </Button>
            </div>

            {/* Interactive Stepper Custom Amount & Add Button */}
            <div className="flex items-center gap-3">
              {/* Stepper block */}
              <div className="flex items-center bg-secondary/10 border border-border/40 rounded-lg h-10 px-1.5 shrink-0 animate-fade-in">
                <button 
                  onClick={() => setCustomStepperMl(prev => Math.max(50, prev - 50))}
                  className="h-7 w-7 rounded-md hover:bg-secondary/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  title="Azalt"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <div className="w-16 text-center select-none">
                  <div className="text-sm font-extrabold text-foreground leading-tight">{customStepperMl}</div>
                  <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider leading-none">ml</div>
                </div>
                <button 
                  onClick={() => setCustomStepperMl(prev => prev + 50)}
                  className="h-7 w-7 rounded-md hover:bg-secondary/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  title="Arttır"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Add Button */}
              <Button 
                variant="glass"
                onClick={() => handleAddWater('CUSTOM', customStepperMl)}
                className="flex-grow h-10 liquid-glass font-bold text-sm bg-gradient-to-r from-cyan-500/20 to-primary/20 border-cyan-500/30 hover:border-cyan-500/60 transition-all"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Ekle
              </Button>
            </div>

            {/* Stepper Footer: Undo & Reset Day buttons */}
            <div className="flex justify-between items-center pt-2 border-t border-border/20">
              <Button 
                variant="outline"
                onClick={handleUndoWater}
                disabled={!waterSummary?.logs || waterSummary.logs.length === 0}
                className="h-8 gap-1.5 px-3 bg-secondary/5 border-border/30 hover:bg-secondary/15 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 cursor-pointer"
              >
                <Undo className="h-3.5 w-3.5 text-orange-400 animate-pulse-slow" />
                Geri al
              </Button>

              <Button 
                variant="outline"
                onClick={handleResetDay}
                disabled={!waterSummary?.logs || waterSummary.logs.length === 0}
                className="h-8 gap-1.5 px-3 bg-secondary/5 border-border/30 hover:bg-red-500/10 hover:border-red-500/30 text-xs text-muted-foreground hover:text-red-400 disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Günü sıfırla
              </Button>
            </div>

            {/* Today's Water Consumption Logs (History list with Delete buttons) */}
            {waterSummary && waterSummary.logs && waterSummary.logs.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/40">
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-2">
                  Tüketim Geçmişi (Bugün)
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 select-none">
                  {waterSummary.logs.map((log) => (
                    <div 
                      key={log.id} 
                      className="flex items-center justify-between p-2 rounded bg-secondary/10 border border-border/20 text-xs animate-fade-in"
                    >
                      <div className="flex items-center gap-2">
                        <Droplet className="h-3 w-3 text-primary shrink-0 text-cyan-400" />
                        <span className="font-semibold text-foreground">{log.amountMl} ml</span>
                        <span className="text-[10px] text-muted-foreground">
                          {log.source === 'GLASS_300' ? 'Normal Bardak' : 
                           log.source === 'HALF_500' ? 'Küçük Şişe' : 
                           log.source === 'BOTTLE_1500' ? 'Büyük Şişe' : 
                           log.amountMl === 470 ? 'Stanley Bardak' : 'Özel'}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteWater(log.id, log.amountMl)}
                        className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        title="Kaydı Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
      
    </div>
  )
}
export default DashboardPage
