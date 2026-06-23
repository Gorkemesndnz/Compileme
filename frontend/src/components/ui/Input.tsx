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
          "flex h-10 w-full rounded-lg border border-border bg-background/50 dark:bg-black/20 backdrop-blur-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-2 ring-cyan-500/0 focus:outline-none focus:border-cyan-500/50 focus:ring-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"
