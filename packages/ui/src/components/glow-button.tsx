import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  magnetic?: boolean;
}

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    glow = true, 
    magnetic = true,
    children,
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          // Base styles
          'rounded-lg border backdrop-blur-sm',
          // Size variants
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2 text-base',
          size === 'lg' && 'px-6 py-3 text-lg',
          // Color variants
          variant === 'primary' && [
            'bg-srm-primary/20 border-srm-primary/30 text-white',
            'hover:bg-srm-primary/30 hover:border-srm-primary/50',
            'focus:ring-srm-primary/50',
          ],
          variant === 'secondary' && [
            'bg-glass-100 border-glass-200 text-gray-900 dark:text-white',
            'hover:bg-glass-200 hover:border-glass-300',
            'focus:ring-glass-300',
          ],
          variant === 'neon' && [
            'bg-transparent border-transparent text-white neon-border',
            'hover:shadow-neon-blue',
            'focus:ring-neon-blue/50',
          ],
          // Effects
          glow && 'hover:shadow-glow-md',
          magnetic && 'magnetic',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GlowButton.displayName = 'GlowButton';