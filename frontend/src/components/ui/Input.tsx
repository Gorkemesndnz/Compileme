import React from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-500 shadow-sm transition-all duration-200 backdrop-blur-sm focus:border-cyan-500/60 focus:shadow-[0_0_12px_rgba(6,182,212,0.2)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950/55 dark:text-zinc-100 dark:placeholder:text-zinc-500",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"
