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
        'inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
        tone === 'destructive'
          ? 'border-red-950 bg-red-500 text-white dark:border-red-800 hover:scale-110 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] active:scale-95 active:shadow-none'
          : 'border-black bg-white text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] active:translate-y-[2px] active:shadow-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)

SketchButton.displayName = 'SketchButton'
