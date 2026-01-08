import { cn } from '../../utils/cn';
import { GlassCard } from '../ui/GlassCard';

interface DashboardCardProps {
    title: string;
    icon: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    glass?: boolean;
    action?: React.ReactNode;
    onClick?: () => void;
}

export function DashboardCard({
    title,
    icon,
    children,
    className,
    glass = true,
    action,
    onClick
}: DashboardCardProps) {

    const content = (
        <div className='flex flex-col h-full'>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className="p-2 rounded-lg bg-surface/50 text-primary border border-primary/20">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-lg text-text">{title}</h3>
                    </div>
                </div>
                {action}
            </div>
            <div className="flex-1">
                {children}
            </div>
        </div>
    );

    if (glass) {
        return (
            <GlassCard className={cn('p-6 h-full', className)}>
                {content}
            </GlassCard>
        );
    }

    return (
        <div
            className={cn(
                'rounded-2xl p-5 border transition-all duration-300',
                glass ? 'glass' : 'bg-surface border-border shadow-sm',
                className
            )}
            onClick={onClick}
        >
            {content}
        </div>
    );
}
