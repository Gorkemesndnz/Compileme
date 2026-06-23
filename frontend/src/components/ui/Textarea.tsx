import React from 'react'
import { cn } from '../../lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-border bg-background/50 dark:bg-black/20 backdrop-blur-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-2 ring-cyan-500/0 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-y",
          className
        )}
        {...props}
      />
    )
  }
)

Textarea.displayName = "Textarea"
