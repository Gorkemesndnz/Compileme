import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface SelectOption<T = any> {
  label: string
  value: T
  badgeClass?: string
}

interface SelectProps<T = any> {
  value: T
  onChange: (value: T) => void
  options: Array<SelectOption<T>>
  placeholder?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  dropdownClassName?: string
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Seçiniz...',
  disabled = false,
  className,
  triggerClassName,
  dropdownClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const safeOptions = options || []
  const selectedOption = safeOptions.find((o) => o.value === value)

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 w-full flex items-center justify-between text-slate-900 dark:text-slate-100 text-xs font-bold transition-all hover:bg-white/70 dark:hover:bg-black/30 outline-none ring-2 ring-cyan-500/0 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed",
          triggerClassName
        )}
      >
        <span>
          {selectedOption ? (
            selectedOption.badgeClass ? (
              <span className={cn("px-2.5 py-0.5 rounded-md text-[10px] font-bold border", selectedOption.badgeClass)}>
                {selectedOption.label}
              </span>
            ) : (
              selectedOption.label
            )
          ) : (
            <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 shrink-0",
            isOpen && "transform rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200",
            dropdownClassName
          )}
        >
          <div className="max-h-60 overflow-y-auto scrollbar-thin">
            {safeOptions.map((option, idx) => {
              const isSelected = option.value === value
              return (
                <button
                  key={`${idx}-${String(option.value)}`}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded-lg transition-colors cursor-pointer",
                    isSelected
                      ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-black"
                      : "text-slate-850 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-white/5 font-semibold"
                  )}
                >
                  <span>
                    {option.badgeClass ? (
                      <span className={cn("px-2.5 py-0.5 rounded-md text-[10px] font-bold border inline-block", option.badgeClass)}>
                        {option.label}
                      </span>
                    ) : (
                      option.label
                    )}
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-cyan-500" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
