import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface DateTimePickerProps {
  date: string
  time?: string
  onDateChange: (date: string) => void
  onTimeChange?: (time: string) => void
  showTime?: boolean
  align?: 'left' | 'right'
  alignY?: 'top' | 'bottom'
}

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa']
const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))

const toDateValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateValue = (value: string) => {
  if (!value) return new Date()
  const [year, month, day] = value.split('-').map(Number)
  return year && month && day ? new Date(year, month - 1, day) : new Date()
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  date,
  time = '00:00',
  onDateChange,
  onTimeChange = () => {},
  showTime = true,
  align = 'right',
  alignY = 'bottom',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isTimeWheelOpen, setIsTimeWheelOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const selected = parseDateValue(date)
    return new Date(selected.getFullYear(), selected.getMonth(), 1)
  })
  
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const hourScrollRef = useRef<HTMLDivElement>(null)
  const minuteScrollRef = useRef<HTMLDivElement>(null)

  // Portal positioning
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({})

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
    }
    // Vertical
    if (alignY === 'top') {
      style.bottom = window.innerHeight - rect.top + 8
    } else {
      style.top = rect.bottom + 8
    }
    // Horizontal
    if (align === 'left') {
      style.left = rect.left
    } else {
      style.right = window.innerWidth - rect.right
    }
    setPopoverStyle(style)
  }, [align, alignY])

  useEffect(() => {
    if (!isOpen) return
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, updatePosition])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        !rootRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setIsOpen(false)
        setIsTimeWheelOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (isTimeWheelOpen) {
        setIsTimeWheelOpen(false)
      } else {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isTimeWheelOpen, isOpen])

  const selectedDate = useMemo(() => parseDateValue(date), [date])
  const monthLabel = visibleMonth.toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric',
  })
  const triggerDate = date ? selectedDate.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  }) : 'Tarih Seç'

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear()
    const month = visibleMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const mondayBasedOffset = (new Date(year, month, 1).getDay() + 6) % 7

    return [
      ...Array.from({ length: mondayBasedOffset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ]
  }, [visibleMonth])

  const changeMonth = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  const selectDay = (day: number) => {
    const nextDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day)
    onDateChange(toDateValue(nextDate))
    if (!showTime) {
      setIsOpen(false)
    }
  }

  const [selectedHour = '', selectedMinute = ''] = time.split(':')

  // Wheel open positioning
  useEffect(() => {
    if (isTimeWheelOpen) {
      const timer = setTimeout(() => {
        const hIndex = HOURS.indexOf(selectedHour || '00')
        if (hIndex !== -1 && hourScrollRef.current) {
          hourScrollRef.current.scrollTop = hIndex * 32
        }
        const mIndex = MINUTES.indexOf(selectedMinute || '00')
        if (mIndex !== -1 && minuteScrollRef.current) {
          minuteScrollRef.current.scrollTop = mIndex * 32
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isTimeWheelOpen, selectedHour, selectedMinute])

  // Scroll listeners
  const handleHourScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    const index = Math.round(scrollTop / 32)
    if (index >= 0 && index < HOURS.length) {
      const newHour = HOURS[index]
      if (newHour !== selectedHour) {
        onTimeChange(`${newHour}:${selectedMinute || '00'}`)
      }
    }
  }

  const handleMinuteScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    const index = Math.round(scrollTop / 32)
    if (index >= 0 && index < MINUTES.length) {
      const newMinute = MINUTES[index]
      if (newMinute !== selectedMinute) {
        onTimeChange(`${selectedHour || '00'}:${newMinute}`)
      }
    }
  }

  // Click handlers
  const handleHourClick = (hour: string, index: number) => {
    if (hourScrollRef.current) {
      hourScrollRef.current.scrollTo({ top: index * 32, behavior: 'smooth' })
    }
    onTimeChange(`${hour}:${selectedMinute || '00'}`)
  }

  const handleMinuteClick = (minute: string, index: number) => {
    if (minuteScrollRef.current) {
      minuteScrollRef.current.scrollTo({ top: index * 32, behavior: 'smooth' })
    }
    onTimeChange(`${selectedHour || '00'}:${minute}`)
  }

  return (
    <div ref={rootRef} className="relative w-full sm:w-auto">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setIsOpen((open) => !open)
          setIsTimeWheelOpen(false)
        }}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          'flex h-11 w-full items-center justify-between gap-3 rounded-full border px-4 text-left outline-none transition-colors sm:w-auto',
          'border-neutral-300 bg-white/80 text-neutral-800 hover:border-neutral-400 hover:bg-white',
          'dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-900',
          isOpen && 'border-cyan-500 ring-2 ring-cyan-500/15 ring-offset-0 dark:border-cyan-400',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
          <span className="truncate text-xs font-bold">{triggerDate}</span>
        </span>
        {showTime && (
          <>
            <span className="h-4 w-px bg-neutral-300 dark:bg-zinc-700" />
            <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-zinc-400">
              <Clock3 className="h-3.5 w-3.5" />
              {time || 'Saat'}
            </span>
          </>
        )}
      </button>

      {isOpen && createPortal(
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Tarih ve saat seç"
          style={popoverStyle}
          className="w-[min(20rem,calc(100vw-5.5rem))] rounded-xl border border-neutral-200 bg-white p-3 text-neutral-900 shadow-[0_18px_50px_rgba(15,23,42,0.16)] dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:shadow-[0_18px_50px_rgba(0,0,0,0.5)]"
        >
          {/* Wheel Picker overlay on top of calendar grid */}
          {isTimeWheelOpen && (
            <div className="absolute inset-x-0 top-0 bottom-[68px] z-20 bg-white dark:bg-zinc-900 p-4 rounded-t-xl flex flex-col justify-center select-none">
              <style dangerouslySetInnerHTML={{ __html: `
                .scrollbar-none::-webkit-scrollbar {
                  display: none;
                }
                .scrollbar-none {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}} />
              
              <div className="mb-2 text-center text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-zinc-400">
                Saat ve Dakika Seçin
              </div>

              <div className="relative flex h-24 w-full gap-4 items-center justify-center overflow-hidden">
                {/* Center Highlight Band */}
                <div className="absolute left-0 right-0 top-8 h-8 pointer-events-none border-y border-cyan-500/20 bg-cyan-500/5 dark:border-cyan-400/20 dark:bg-cyan-400/5 rounded-md" />

                {/* Hours Column */}
                <div
                  ref={hourScrollRef}
                  onScroll={handleHourScroll}
                  className="h-24 flex-grow overflow-y-auto pt-8 pb-8 scroll-snap-y-mandatory scrollbar-none select-none text-center"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {HOURS.map((h, i) => {
                    const isSelected = h === selectedHour
                    return (
                      <div
                        key={h}
                        onClick={() => handleHourClick(h, i)}
                        className={cn(
                          "h-8 flex items-center justify-center scroll-snap-align-center text-sm font-bold transition-all cursor-pointer",
                          isSelected 
                            ? "text-cyan-500 dark:text-cyan-400 text-base scale-105" 
                            : "text-neutral-400 dark:text-zinc-500 hover:text-neutral-600 dark:hover:text-zinc-300"
                        )}
                      >
                        {h}
                      </div>
                    )
                  })}
                </div>

                {/* Separator */}
                <span className="text-lg font-bold text-neutral-400 dark:text-zinc-600 pb-1">:</span>

                {/* Minutes Column */}
                <div
                  ref={minuteScrollRef}
                  onScroll={handleMinuteScroll}
                  className="h-24 flex-grow overflow-y-auto pt-8 pb-8 scroll-snap-y-mandatory scrollbar-none select-none text-center"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {MINUTES.map((m, i) => {
                    const isSelected = m === selectedMinute
                    return (
                      <div
                        key={m}
                        onClick={() => handleMinuteClick(m, i)}
                        className={cn(
                          "h-8 flex items-center justify-center scroll-snap-align-center text-sm font-bold transition-all cursor-pointer",
                          isSelected 
                            ? "text-cyan-500 dark:text-cyan-400 text-base scale-105" 
                            : "text-neutral-400 dark:text-zinc-500 hover:text-neutral-600 dark:hover:text-zinc-300"
                        )}
                      >
                        {m}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Calendar Content (will be layered under the wheel if open) */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
              title="Önceki ay"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-extrabold capitalize">{monthLabel}</span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
              title="Sonraki ay"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((weekday) => (
              <span key={weekday} className="py-1 text-[10px] font-extrabold text-neutral-500 dark:text-zinc-500">
                {weekday}
              </span>
            ))}
            {calendarDays.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} className="h-8" />

              const dayValue = toDateValue(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day))
              const isSelected = date && dayValue === date
              const isToday = dayValue === toDateValue(new Date())

              return (
                <button
                  key={dayValue}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={cn(
                    'flex h-8 items-center justify-center rounded-md text-xs font-bold transition-colors',
                    'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white',
                    isToday && 'border border-cyan-500/40 text-cyan-700 dark:text-cyan-300',
                    isSelected && 'border-cyan-500 bg-cyan-500 text-white hover:bg-cyan-600 hover:text-white dark:bg-cyan-400 dark:text-black dark:hover:bg-cyan-300 dark:hover:text-black',
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {showTime && (
            <div className="relative mt-3 border-t border-neutral-200 pt-3 dark:border-zinc-700">
              <label className="mb-1.5 flex items-center gap-2 text-[10px] font-extrabold uppercase text-neutral-600 dark:text-zinc-300">
                <Clock3 className="h-3.5 w-3.5" /> Saat
              </label>

              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setIsTimeWheelOpen((prev) => !prev)}
                  className={cn(
                    'flex h-10 flex-grow items-center justify-center rounded-xl border px-3 text-sm font-extrabold transition-all outline-none',
                    'border-neutral-300 bg-neutral-50 text-neutral-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white',
                    isTimeWheelOpen && 'border-cyan-500 ring-2 ring-cyan-500/15 dark:border-cyan-400',
                  )}
                >
                  <span className="flex items-center justify-center gap-1 font-mono text-base tracking-wide">
                    <span>{selectedHour || '00'}</span>
                    <span className={cn("text-neutral-400 dark:text-zinc-500", isTimeWheelOpen && "animate-pulse")}>:</span>
                    <span>{selectedMinute || '00'}</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsTimeWheelOpen(false)
                    setIsOpen(false)
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-white outline-none transition-colors hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-cyan-500/30 active:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:active:bg-zinc-300"
                  title="Seçimi tamamla"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

export default DateTimePicker
