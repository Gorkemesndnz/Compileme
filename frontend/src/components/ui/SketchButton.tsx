import React from 'react'
import { cn } from '../../lib/utils'

export interface SketchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: 'default' | 'destructive'
}

export const SketchButton = React.forwardRef<HTMLButtonElement, SketchButtonProps>(
  ({ className, tone = 'default', children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-lg border-2 px-4 text-sm font-black transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
        tone === 'destructive'
          ? 'border-red-950 bg-red-500 text-white dark:border-red-800 hover:scale-105 active:scale-95 hover:bg-red-600 dark:hover:bg-red-600'
          : 'border-neutral-950 bg-white text-neutral-950 dark:border-white dark:bg-neutral-900 dark:text-white hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0_#0a0a0a] dark:hover:shadow-[4px_4px_0_#fff] hover:bg-neutral-100 active:translate-x-0 active:translate-y-0 active:shadow-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)

SketchButton.displayName = 'SketchButton'
