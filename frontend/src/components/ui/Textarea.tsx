import React from 'react'
import { cn } from '../../lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full resize-y rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-medium text-slate-950 placeholder:text-slate-500 shadow-sm outline-none ring-2 ring-cyan-500/0 transition-all duration-200 backdrop-blur-sm focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950/55 dark:text-zinc-100 dark:placeholder:text-zinc-500",
          className
        )}
        {...props}
      />
    )
  }
)

Textarea.displayName = "Textarea"
