import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'subtle';
  onClick?: () => void;
}

export function Card({ children, className, variant = 'default', onClick }: CardProps) {
  const baseClasses = 'rounded-xl border transition-all duration-300 ease-out-quart hover:-translate-y-1';

  const variantClasses = {
    default: 'bg-surface border-border shadow-sm hover:shadow-md',
    glass: 'glass shadow-lg hover:shadow-xl',
    subtle: 'bg-surface/50 border-border/50 hover:bg-surface/80',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        onClick && 'cursor-pointer hover:scale-[1.01]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}