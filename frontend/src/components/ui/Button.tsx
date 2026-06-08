import React from 'react'
import { cn } from '../../lib/utils'
import { Spinner } from './Spinner'

// -------------------------------------------------------------
// EaseMize Glass Button Implementation
// -------------------------------------------------------------

const glassButtonSizeClass = {
  default: "text-base font-medium",
  sm: "text-sm font-medium",
  lg: "text-lg font-medium",
  icon: "h-10 w-10",
}

const glassButtonTextSizeClass = {
  default: "px-6 py-3.5",
  sm: "px-4 py-2",
  lg: "px-8 py-4",
  icon: "flex h-10 w-10 items-center justify-center",
}

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'default' | 'sm' | 'lg' | 'icon';
  contentClassName?: string;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size = 'default', contentClassName, disabled, ...props }, ref) => {
    return (
      <div
        className={cn(
          "glass-button-wrap cursor-pointer rounded-full",
          className
        )}
      >
        <button
          className={cn(
            "relative isolate all-unset cursor-pointer rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed glass-button", 
            glassButtonSizeClass[size]
          )}
          ref={ref}
          disabled={disabled}
          {...props}
        >
          <span
            className={cn(
              "glass-button-text relative block select-none tracking-tighter",
              glassButtonTextSizeClass[size],
              contentClassName
            )}
          >
            {children}
          </span>
        </button>
        <div className="glass-button-shadow rounded-full"></div>
      </div>
    )
  }
)
GlassButton.displayName = "GlassButton"


// -------------------------------------------------------------
// Standard Button Implementation
// -------------------------------------------------------------

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'glass'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    
    // Redirect variant="glass" to the premium GlassButton
    if (variant === 'glass') {
      const glassSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : size === 'icon' ? 'icon' : 'default'
      return (
        <GlassButton
          ref={ref}
          size={glassSize}
          className={className}
          disabled={disabled || isLoading}
          {...props}
        >
          {isLoading && <Spinner className="mr-2 h-4 w-4" />}
          {children}
        </GlassButton>
      )
    }

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
          },
          // Sizes
          {
            "h-8 px-3 text-xs": size === 'sm',
            "h-10 px-4 py-2 text-sm": size === 'md',
            "h-12 px-6 text-base": size === 'lg',
            "h-10 w-10 p-0": size === 'icon',
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
