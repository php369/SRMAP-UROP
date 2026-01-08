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
    const baseClasses = 'bg-white rounded-xl transition-all duration-200 border border-slate-200';

    // Modern solid variants suitable for clean UI
    const variantClasses = {
      default: 'shadow-sm',
      elevated: 'shadow-md shadow-slate-200/50',
      subtle: 'bg-slate-50 border-slate-200 shadow-none',
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          hoverEffect && 'hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5',
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
