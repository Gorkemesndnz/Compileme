import React from 'react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline'
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', ...props }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors select-none",
        {
          "bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(0,255,255,0.05)]": variant === 'default',
          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20": variant === 'success',
          "bg-amber-400/10 text-amber-400 border-amber-400/20": variant === 'warning',
          "bg-rose-500/10 text-rose-400 border-rose-500/20": variant === 'destructive',
          "bg-transparent text-foreground border-border": variant === 'outline',
        },
        className
      )}
      {...props}
    />
  )
}
