import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'glass';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, variant = 'default', ...props }, ref) => {
    const baseClasses = 'w-full px-3 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
      default: 'bg-surface border-border text-text placeholder:text-textSecondary focus:border-primary focus:ring-primary/20',
      glass: 'bg-white/10 backdrop-blur-md border-white/20 text-text placeholder:text-textSecondary/70 focus:border-primary focus:ring-primary/20',
    };

    const errorClasses = error ? 'border-error focus:border-error focus:ring-error/20' : '';

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            baseClasses,
            variantClasses[variant],
            errorClasses,
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-textSecondary">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';