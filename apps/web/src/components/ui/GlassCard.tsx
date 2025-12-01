import { ReactNode, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, variant = 'default', blur = 'md', onClick }, ref) => {
    const baseClasses = 'backdrop-blur border rounded-2xl transition-all duration-300';
    
    const variantClasses = {
      default: 'bg-white/10 border-white/20 shadow-lg hover:bg-white/15',
      elevated: 'bg-white/15 border-white/30 shadow-xl hover:bg-white/20 hover:shadow-2xl',
      subtle: 'bg-white/5 border-white/10 shadow-md hover:bg-white/10',
    };

    const blurClasses = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl',
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          blurClasses[blur],
          onClick && 'cursor-pointer hover:scale-[1.02]',
          className
        )}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
