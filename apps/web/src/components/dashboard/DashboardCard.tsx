import { cn } from '../../utils/cn';
// GlassCard removed

interface DashboardCardProps {
    title: string;
    icon: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
    onClick?: () => void;
}

export function DashboardCard({
    title,
    icon,
    children,
    className,
    action,
    onClick
}: DashboardCardProps) {

    const content = (
        <div className='flex flex-col h-full'>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className="p-2 rounded-lg bg-slate-100 text-primary border border-slate-200">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-lg text-slate-900">{title}</h3>
                    </div>
                </div>
                {action}
            </div>
            <div className="flex-1">
                {children}
            </div>
        </div>
    );

    return (
        <div
            className={cn(
                'rounded-2xl p-5 border transition-all duration-300',
                'bg-white border-slate-200 shadow-sm hover:shadow-md',
                className
            )}
            onClick={onClick}
        >
            {content}
        </div>
    );
}
