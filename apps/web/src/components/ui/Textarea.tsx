import * as React from "react"
import { cn } from "../../lib/utils"
import { Label } from "./label"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  variant?: 'default' | 'glass'
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, variant = 'default', ...props }, ref) => {

    // Base Shadcn Textarea Styles
    const textareaClasses = cn(
      "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
      variant === 'glass' && "bg-white/50 backdrop-blur-sm border-slate-200",
      error && "border-error focus-visible:ring-error",
      className
    )

    if (!label && !error && !helperText) {
      return (
        <textarea
          className={textareaClasses}
          ref={ref}
          {...props}
        />
      )
    }

    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <textarea
          className={textareaClasses}
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
Textarea.displayName = "Textarea"

export { Textarea }
