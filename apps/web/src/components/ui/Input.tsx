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
    const baseClasses = 'w-full px-4 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed';

    const variantClasses = {
      default: 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-100',
      // Map glass to default for consistency
      glass: 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-100',
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
