import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' | 'info' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';

  const variantClasses = {
    default: 'bg-slate-100 text-slate-800 border border-slate-200',
    secondary: 'bg-slate-100 text-slate-600 border border-slate-200',
    outline: 'border border-slate-200 text-slate-700 bg-transparent',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    error: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    glass: 'bg-white/80 border border-slate-200 text-slate-700', // Fallback to opaque
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}>
      {children}
    </span>
  );
}
