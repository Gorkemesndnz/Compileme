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
        'inline-flex h-10 items-center justify-center rounded-lg border-2 px-4 text-sm font-black transition-transform',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'active:translate-x-1 active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:opacity-50',
        tone === 'destructive'
          ? 'border-red-950 bg-red-500 text-white shadow-[4px_4px_0_#450a0a] hover:bg-red-400 dark:border-red-200 dark:shadow-[4px_4px_0_#fecaca]'
          : 'border-neutral-950 bg-white text-neutral-950 shadow-[4px_4px_0_#0a0a0a] hover:bg-neutral-100 dark:border-white dark:bg-neutral-900 dark:text-white dark:shadow-[4px_4px_0_#fff]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)

SketchButton.displayName = 'SketchButton'
