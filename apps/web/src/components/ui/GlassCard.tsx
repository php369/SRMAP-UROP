import { ReactNode, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle';
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, variant = 'default', hoverEffect = true, onClick }, ref) => {
    const baseClasses = 'glass rounded-2xl transition-all duration-300';

    // Additional variants on top of base glass
    const variantClasses = {
      default: 'shadow-sm bg-surface',
      elevated: 'shadow-md border border-border bg-surface',
      subtle: 'bg-surface/50 shadow-sm border border-border/50',
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          hoverEffect && 'glass-hover hover:shadow-2xl hover:scale-[1.01]',
          onClick && 'cursor-pointer',
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
