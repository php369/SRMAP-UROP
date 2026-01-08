import { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { GlassCard } from './GlassCard';
import { ArrowRightIcon } from './Icons';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'secondary';
  disabled?: boolean;
  badge?: string;
  className?: string;
}

export function QuickActionCard({
  title,
  description,
  icon,
  onClick,
  variant = 'default',
  disabled = false,
  badge,
  className,
}: QuickActionCardProps) {
  const variantClasses = {
    default: 'hover:bg-white/10 border-border/50',
    primary: 'hover:bg-primary/10 border-primary/30 hover:border-primary/50',
    secondary: 'hover:bg-secondary/10 border-secondary/30 hover:border-secondary/50',
  };

  const iconVariantClasses = {
    default: 'bg-surface/50 text-text',
    primary: 'bg-primary/20 text-primary',
    secondary: 'bg-secondary/20 text-secondary',
  };

  return (
    <GlassCard
      variant="subtle"
      className={cn(
        'relative p-6 cursor-pointer transition-all duration-300 group',
        'hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]',
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100 active:scale-100',
        className
      )}
      onClick={disabled ? undefined : onClick}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-2 -right-2 bg-primary text-textPrimary text-xs px-2 py-1 rounded-full font-medium">
          {badge}
        </div>
      )}

      {/* Icon */}
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300',
          'group-hover:scale-110 group-hover:rotate-3',
          iconVariantClasses[variant]
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-text group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-textSecondary leading-relaxed">
          {description}
        </p>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Arrow indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        <ArrowRightIcon className="w-5 h-5 text-textSecondary" />
      </div>
    </GlassCard>
  );
}
