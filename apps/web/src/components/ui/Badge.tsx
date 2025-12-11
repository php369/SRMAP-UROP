import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' | 'info' | 'glass' | 'approved' | 'pending' | 'rejected' | 'assigned' | 'published' | 'draft' | 'frozen' | 'idp' | 'urop' | 'capstone' | 'solo' | 'leader' | 'ended';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-semibold rounded-lg border shadow-sm transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    secondary: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    outline: 'bg-transparent text-slate-700 border-slate-300 dark:text-slate-300 dark:border-slate-600',
    
    // Status variants with high contrast
    success: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
    warning: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
    error: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
    info: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    
    // Application status
    approved: 'bg-green-50 text-green-700 border-green-200 shadow-green-100/50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:shadow-green-900/20',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-yellow-100/50 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 dark:shadow-yellow-900/20',
    rejected: 'bg-red-50 text-red-700 border-red-200 shadow-red-100/50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:shadow-red-900/20',
    
    // Project status
    assigned: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 dark:shadow-emerald-900/20',
    published: 'bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100/50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:shadow-blue-900/20',
    draft: 'bg-gray-50 text-gray-700 border-gray-200 shadow-gray-100/50 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800 dark:shadow-gray-900/20',
    frozen: 'bg-cyan-50 text-cyan-700 border-cyan-200 shadow-cyan-100/50 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800 dark:shadow-cyan-900/20',
    ended: 'bg-rose-50 text-rose-700 border-rose-200 shadow-rose-100/50 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800 dark:shadow-rose-900/20',
    
    // Project types
    idp: 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-indigo-100/50 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800 dark:shadow-indigo-900/20',
    urop: 'bg-teal-50 text-teal-700 border-teal-200 shadow-teal-100/50 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800 dark:shadow-teal-900/20',
    capstone: 'bg-purple-50 text-purple-700 border-purple-200 shadow-purple-100/50 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800 dark:shadow-purple-900/20',
    
    // User roles
    solo: 'bg-sky-50 text-sky-700 border-sky-200 shadow-sky-100/50 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800 dark:shadow-sky-900/20',
    leader: 'bg-violet-50 text-violet-700 border-violet-200 shadow-violet-100/50 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800 dark:shadow-violet-900/20',
    
    // Glass effect
    glass: 'bg-white/20 backdrop-blur-md border-white/30 text-slate-800 shadow-lg dark:bg-black/20 dark:border-white/20 dark:text-slate-200',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  return (
    <span className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}>
      {children}
    </span>
  );
}
