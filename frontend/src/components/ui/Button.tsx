import React from 'react'
import { cn } from '../../lib/utils'
import { Spinner } from './Spinner'

const WEBP_DISPLACEMENT_MAP = "data:image/webp;base64,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... \n";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'glass' | 'liquid-glass'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  glassColor?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', isLoading, children, disabled, glassColor, ...props }, ref) => {
    // Generate a unique ID for SVG liquid glass filter
    const filterId = React.useId().replace(/:/g, "");

    const isGlass = variant === 'glass' || variant === 'liquid-glass';

    if (isGlass) {
      return (
        <>
          {/* INVISIBLE SVG FILTER FOR LIQUID REFRACTION */}
          <svg className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <filter id={`liquid-glass-${filterId}`} primitiveUnits="objectBoundingBox">
              <feImage 
                result="map" 
                width="100%" 
                height="100%" 
                x="0" 
                y="0" 
                href={WEBP_DISPLACEMENT_MAP} 
                preserveAspectRatio="none" 
              />
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.01" result="blur" />
              <feDisplacementMap 
                id="disp" 
                in="blur" 
                in2="map" 
                scale="0.5" 
                xChannelSelector="R" 
                yChannelSelector="G" 
              />
            </filter>
          </svg>

          <style>{`
            .btn-liquid-${filterId} {
              appearance: none;
              border: none;
              background: transparent;
              color: hsl(var(--primary));
              transition: transform 200ms cubic-bezier(1, 0, 0.4, 1);
            }
            .dark .btn-liquid-${filterId} {
              color: hsl(var(--primary));
            }
            .btn-liquid-lens-${filterId} {
              background-color: ${glassColor || "rgba(0, 230, 230, 0.08)"};
              backdrop-filter: blur(12px) url(#liquid-glass-${filterId}) saturate(140%);
              -webkit-backdrop-filter: blur(12px) saturate(140%);
              border: 1px solid rgba(0, 230, 230, 0.25);
              box-shadow: 
                inset 0 0 0 1px rgba(255, 255, 255, 0.05),
                inset 1.8px 3px 0px -2px rgba(255, 255, 255, 0.3), 
                inset -2px -2px 0px -2px rgba(255, 255, 255, 0.1), 
                inset 0px 3px 4px -2px rgba(0, 0, 0, 0.2),
                0 0 15px rgba(0, 230, 230, 0.05);
              transition: background-color 300ms ease, border-color 300ms ease, box-shadow 300ms ease;
            }
            .dark .btn-liquid-lens-${filterId} {
              background-color: ${glassColor || "rgba(0, 230, 230, 0.06)"};
              border: 1px solid rgba(0, 230, 230, 0.2);
              box-shadow: 
                inset 0 0 0 1px rgba(255, 255, 255, 0.02),
                inset 1.8px 3px 0px -2px rgba(255, 255, 255, 0.15), 
                inset -2px -2px 0px -2px rgba(255, 255, 255, 0.05), 
                inset 0px 3px 4px -2px rgba(0, 0, 0, 0.4),
                0 0 15px rgba(0, 230, 230, 0.03);
            }
            .btn-liquid-${filterId}:not(:disabled):hover {
              transform: scale(1.02);
            }
            .btn-liquid-${filterId}:not(:disabled):hover .btn-liquid-lens-${filterId} {
              background-color: ${glassColor ? glassColor.replace(/[\d.]+\)$/, "0.15)") : "rgba(0, 230, 230, 0.15)"};
              border-color: rgba(0, 230, 230, 0.45);
              box-shadow: 
                inset 0 0 0 1px rgba(255, 255, 255, 0.1),
                0 0 20px rgba(0, 230, 230, 0.2);
            }
            .btn-liquid-${filterId}:not(:disabled):active {
              transform: scale(0.97);
            }
          `}</style>

          <button
            ref={ref}
            disabled={disabled || isLoading}
            className={cn(
              "relative isolate inline-flex items-center justify-center rounded-lg font-semibold tracking-tight transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
              `btn-liquid-${filterId}`,
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
            {/* LENS LAYER */}
            <span className={cn("btn-liquid-lens absolute inset-0 -z-10 rounded-[inherit] pointer-events-none", `btn-liquid-lens-${filterId}`)} />
            
            {/* TEXT LAYER */}
            <span className="relative z-10 w-full flex items-center justify-center gap-[inherit] select-none">
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {children}
            </span>
          </button>
        </>
      )
    }

    // Normal button rendering
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
