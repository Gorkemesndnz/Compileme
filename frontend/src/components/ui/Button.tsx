import React from 'react'
import { cn } from '../../lib/utils'
import { Spinner } from './Spinner'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'glass' | 'liquid-glass'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer",
          // Variants
          {
            "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,255,255,0.1)]": variant === 'default',
            "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground text-foreground": variant === 'outline',
            "bg-transparent hover:bg-accent hover:text-accent-foreground text-muted-foreground hover:text-foreground": variant === 'ghost',
            "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === 'destructive',
            "bg-gradient-to-r from-primary/10 to-cyan-500/10 hover:from-primary/25 hover:to-cyan-500/25 text-primary border border-primary/30 hover:border-primary/60 backdrop-blur-md shadow-[0_0_15px_rgba(0,255,255,0.05)] hover:shadow-[0_0_20px_rgba(0,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-bold": variant === 'liquid-glass' || variant === 'glass',
          },
          // Sizes
          {
            "h-8 px-3 text-xs": size === 'sm',
            "h-10 px-4 py-2 text-sm": size === 'md',
            "h-12 px-6 text-base": size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading && <Spinner className="mr-2 h-4 w-4" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
