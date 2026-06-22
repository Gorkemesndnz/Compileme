import React from 'react'
import { cn } from '../lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  titleClassName?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, titleClassName }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-border mb-6 gap-4">
      <div>
        <h1 className={cn('text-3xl font-bold tracking-tight text-foreground', titleClassName)}>{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}
