import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    const baseClasses = 'w-full px-3 py-2 text-sm border rounded-lg bg-surface text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors resize-vertical';
    
    const errorClasses = error 
      ? 'border-red-500 focus:ring-red-500' 
      : 'border-border';

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