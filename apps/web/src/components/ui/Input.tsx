import * as React from "react"
import { cn } from "../../lib/utils"
import { Label } from "./label"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  variant?: 'default' | 'glass'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, variant = 'default', ...props }, ref) => {

    // Base Shadcn Input Styles
    const inputClasses = cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      variant === 'glass' && "bg-white/50 backdrop-blur-sm border-slate-200", // Maintain glass variant support
      error && "border-error focus-visible:ring-error",
      className
    )

    if (!label && !error && !helperText) {
      return (
        <input
          type={type}
          className={inputClasses}
          ref={ref}
          {...props}
        />
      )
    }

    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <input
          type={type}
          className={inputClasses}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm font-medium text-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-textSecondary">{helperText}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }

