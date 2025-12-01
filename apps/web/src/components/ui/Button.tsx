import { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Button({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className, 
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    default: 'bg-surface text-textPrimary border border-border hover:bg-surface/80',
    primary: 'bg-accent text-white hover:bg-accent/90 focus:ring-accent',
    secondary: 'bg-textSecondary text-white hover:bg-textSecondary/90',
    outline: 'border border-border text-textPrimary hover:bg-surface',
    ghost: 'text-textPrimary hover:bg-surface/50',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
    error: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button 
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}