import { cn } from '../../utils/cn';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function Progress({ value, max = 100, className, variant = 'default' }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const variantClasses = {
    default: 'bg-accent',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <div className={cn('w-full bg-border rounded-full overflow-hidden', className)}>
      <div 
        className={cn('h-full transition-all duration-300 ease-in-out', variantClasses[variant])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}