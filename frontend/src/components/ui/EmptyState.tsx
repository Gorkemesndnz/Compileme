import React from 'react'
import { cn } from '../../lib/utils'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  className,
  title,
  description,
  icon,
  action,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-border/80 bg-card/25 min-h-[300px] space-y-4",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="h-12 w-12 rounded-xl bg-primary/5 border border-primary/10 text-muted-foreground flex items-center justify-center mb-1">
          {icon}
        </div>
      )}
      <div className="space-y-1 max-w-sm">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}
