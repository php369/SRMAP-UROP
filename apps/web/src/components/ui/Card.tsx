import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'subtle';
}

export function Card({ children, className, variant = 'default' }: CardProps) {
  const baseClasses = 'rounded-lg border';
  
  const variantClasses = {
    default: 'bg-surface border-border shadow-sm',
    glass: 'bg-white/10 backdrop-blur-md border-white/20 shadow-lg',
    subtle: 'bg-surface/50 border-border/50',
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </div>
  );
}