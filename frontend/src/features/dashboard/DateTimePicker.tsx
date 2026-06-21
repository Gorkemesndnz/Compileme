import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  time: string
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
}

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa']
const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'))
type TimePart = 'hour' | 'minute'

const toDateValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateValue = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return year && month && day ? new Date(year, month - 1, day) : new Date()
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  date,
  time,
  onDateChange,
  onTimeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTimePart, setActiveTimePart] = useState<TimePart | null>(null)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const selected = parseDateValue(date)
    return new Date(selected.getFullYear(), selected.getMonth(), 1)
  })
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
        setActiveTimePart(null)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (activeTimePart) {
        setActiveTimePart(null)
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
  }, [activeTimePart, isOpen])

  const selectedDate = useMemo(() => parseDateValue(date), [date])
  const monthLabel = visibleMonth.toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric',
  })
  const triggerDate = selectedDate.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  })

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
  }

  const [selectedHour = '', selectedMinute = ''] = time.split(':')

  const selectTimePart = (part: TimePart, value: string) => {
    const fallbackHour = String(new Date().getHours()).padStart(2, '0')
    const nextHour = part === 'hour' ? value : selectedHour || fallbackHour
    const nextMinute = part === 'minute' ? value : selectedMinute || '00'
    onTimeChange(`${nextHour}:${nextMinute}`)
    setActiveTimePart(part === 'hour' ? 'minute' : null)
  }

  return (
    <div ref={rootRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open)
          setActiveTimePart(null)
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
        <span className="h-4 w-px bg-neutral-300 dark:bg-zinc-700" />
        <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-zinc-400">
          <Clock3 className="h-3.5 w-3.5" />
          {time || 'Saat'}
        </span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Tarih ve saat seç"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[80] w-[min(20rem,calc(100vw-5.5rem))] rounded-xl border border-neutral-200 bg-white p-3 text-neutral-900 shadow-[0_18px_50px_rgba(15,23,42,0.16)] dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:shadow-[0_18px_50px_rgba(0,0,0,0.5)]"
        >
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
              const isSelected = dayValue === date
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

          <div className="relative mt-3 border-t border-neutral-200 pt-3 dark:border-zinc-700">
            <label className="mb-1.5 flex items-center gap-2 text-[10px] font-extrabold uppercase text-neutral-600 dark:text-zinc-300">
              <Clock3 className="h-3.5 w-3.5" /> Saat
            </label>

            <div className="flex items-center justify-end gap-2">
              <div className="flex h-10 w-32 items-center justify-center rounded-xl border border-neutral-300 bg-neutral-50 px-2 text-sm font-extrabold text-neutral-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white">
                <button
                  type="button"
                  onClick={() => setActiveTimePart((part) => part === 'hour' ? null : 'hour')}
                  aria-expanded={activeTimePart === 'hour'}
                  aria-haspopup="listbox"
                  className="flex h-8 w-10 items-center justify-center rounded-lg bg-transparent text-center outline-none transition-colors hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-cyan-500/30 active:bg-neutral-200 dark:hover:bg-zinc-800 dark:active:bg-zinc-800"
                >
                  {selectedHour || '--'}
                </button>
                <span className="px-1 text-neutral-400 dark:text-zinc-500">:</span>
                <button
                  type="button"
                  onClick={() => setActiveTimePart((part) => part === 'minute' ? null : 'minute')}
                  aria-expanded={activeTimePart === 'minute'}
                  aria-haspopup="listbox"
                  className="flex h-8 w-10 items-center justify-center rounded-lg bg-transparent text-center outline-none transition-colors hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-cyan-500/30 active:bg-neutral-200 dark:hover:bg-zinc-800 dark:active:bg-zinc-800"
                >
                  {selectedMinute || '--'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTimePart(null)
                  setIsOpen(false)
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-950 text-white outline-none transition-colors hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-cyan-500/30 active:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:active:bg-zinc-300"
                title="Seçimi tamamla"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>

            {activeTimePart && (
              <div
                role="listbox"
                aria-label={activeTimePart === 'hour' ? 'Saat seç' : 'Dakika seç'}
                className="absolute bottom-[calc(100%+0.5rem)] right-0 z-20 w-full rounded-xl border border-neutral-200 bg-white p-2 shadow-[0_14px_36px_rgba(15,23,42,0.18)] dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-[0_14px_36px_rgba(0,0,0,0.5)]"
              >
                <div className={cn('grid gap-1', activeTimePart === 'hour' ? 'grid-cols-6' : 'grid-cols-4')}>
                  {(activeTimePart === 'hour' ? HOURS : MINUTES).map((option) => {
                    const isSelected = activeTimePart === 'hour'
                      ? option === selectedHour
                      : option === selectedMinute

                    return (
                      <button
                        key={option}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => selectTimePart(activeTimePart, option)}
                        className={cn(
                          'flex h-8 items-center justify-center rounded-lg text-xs font-bold outline-none transition-colors',
                          'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-cyan-500/30 active:bg-neutral-200',
                          'dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white dark:active:bg-zinc-700',
                          isSelected && 'bg-cyan-500 text-white hover:bg-cyan-600 hover:text-white dark:bg-cyan-400 dark:text-black dark:hover:bg-cyan-300 dark:hover:text-black',
                        )}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
