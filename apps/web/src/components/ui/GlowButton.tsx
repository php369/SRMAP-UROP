import { ReactNode, forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  loading?: boolean;
}

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ 
    children, 
    className, 
    variant = 'primary', 
    size = 'md', 
    glow = false,
    loading = false,
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = 'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
      primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-textPrimary hover:from-primary-600 hover:to-primary-700 focus:ring-primary-500 shadow-lg hover:shadow-xl',
      secondary: 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-textPrimary hover:from-secondary-600 hover:to-secondary-700 focus:ring-secondary-500 shadow-lg hover:shadow-xl',
      accent: 'bg-gradient-to-r from-accent-500 to-accent-600 text-textPrimary hover:from-accent-600 hover:to-accent-700 focus:ring-accent-500 shadow-lg hover:shadow-xl',
      ghost: 'bg-white/10 backdrop-blur-md border border-white/20 text-text hover:bg-white/20 focus:ring-primary-500',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const glowClasses = glow ? {
      primary: 'shadow-primary-500/50 hover:shadow-primary-500/75',
      secondary: 'shadow-secondary-500/50 hover:shadow-secondary-500/75',
      accent: 'shadow-accent-500/50 hover:shadow-accent-500/75',
      ghost: 'shadow-white/20 hover:shadow-white/30',
    } : {};

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          glow && glowClasses[variant],
          glow && 'shadow-2xl',
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <span className={cn('flex items-center gap-2', loading && 'opacity-0')}>
          {children}
        </span>
      </button>
    );
  }
);

GlowButton.displayName = 'GlowButton';
