import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    const baseClasses = 'w-full px-4 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 resize-vertical disabled:opacity-50 disabled:bg-slate-100';

    const errorClasses = error
      ? 'border-red-500 focus:ring-red-100 focus:border-red-500'
      : 'border-slate-200';

    return (
      <div className="space-y-1">
        <textarea
          ref={ref}
          className={cn(baseClasses, errorClasses, className)}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';