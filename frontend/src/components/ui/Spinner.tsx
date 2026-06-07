import React from 'react'
import { cn } from '../../lib/utils'

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Spinner: React.FC<SpinnerProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent h-4 w-4",
        className
      )}
      {...props}
    />
  )
}
