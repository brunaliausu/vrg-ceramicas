import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-sans font-medium tracking-wide transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          size === 'sm' && 'text-xs px-4 py-2 gap-1.5',
          size === 'md' && 'text-sm px-6 py-3 gap-2',
          size === 'lg' && 'text-base px-8 py-4 gap-2',
          variant === 'primary' && 'bg-carvao text-cru hover:bg-carvao/85 active:bg-carvao',
          variant === 'outline' && 'border border-carvao text-carvao hover:bg-carvao hover:text-cru',
          variant === 'ghost' && 'text-carvao hover:bg-areia active:bg-pedra',
          variant === 'danger' && 'bg-red-700 text-white hover:bg-red-800',
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
