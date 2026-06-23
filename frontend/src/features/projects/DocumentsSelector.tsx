import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { DocumentType } from '../../api/projects'
import { cn } from '../../lib/utils'

interface DocumentsSelectorProps {
  value: DocumentType
  onChange: (value: DocumentType) => void
}

const OPTIONS = [
  { label: 'DB Schema', value: 'DB_SCHEMA' as DocumentType },
  { label: 'Refactor Plan', value: 'REFACTOR_PLAN' as DocumentType },
  { label: 'Gelecek Özellik', value: 'FUTURE_FEATURES' as DocumentType },
  { label: 'Tech Doc', value: 'TECH_DOC' as DocumentType },
  { label: 'Genel Not', value: 'GENERAL' as DocumentType },
]

export const DocumentsSelector: React.FC<DocumentsSelectorProps> = ({
  value,
  onChange,
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

  const selectedOption = OPTIONS.find((o) => o.value === value) || OPTIONS[3] // Default to Tech Doc

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/40 dark:bg-black/20 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 w-full flex items-center justify-between text-slate-900 dark:text-slate-100 text-xs font-bold transition-all hover:bg-white/50 dark:hover:bg-black/30 focus:outline-none"
      >
        <span>{selectedOption.label}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform duration-200',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto scrollbar-thin">
            {OPTIONS.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded-lg transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-black'
                      : 'text-slate-800 dark:text-slate-250 hover:bg-slate-100/70 dark:hover:bg-white/5 font-semibold'
                  )}
                >
                  <span>{option.label}</span>
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
