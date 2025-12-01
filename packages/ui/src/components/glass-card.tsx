import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'light', blur = 'md', border = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-glass',
          variant === 'light' ? 'glass' : 'glass-dark',
          blur === 'sm' && 'backdrop-blur-sm',
          blur === 'md' && 'backdrop-blur-md',
          blur === 'lg' && 'backdrop-blur-lg',
          blur === 'xl' && 'backdrop-blur-xl',
          border && (variant === 'light' ? 'glass-border' : 'glass-border-dark'),
          className
        )}
        {...props}
      />
    );
  }
);

GlassCard.displayName = 'GlassCard';