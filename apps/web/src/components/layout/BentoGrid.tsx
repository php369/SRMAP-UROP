import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';
import { GlassCard } from '../ui/GlassCard';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
  responsive?: boolean;
  minItemWidth?: number;
  maxColumns?: number;
  gap?: number;
}

interface BentoItemProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'elevated' | 'subtle';
  onClick?: () => void;
  animate?: boolean;
  delay?: number;
}

export function BentoGrid({ 
  children, 
  className, 
  responsive = true,
  minItemWidth = 280,
  maxColumns = 4,
  gap = 16
}: BentoGridProps) {
  const [columns, setColumns] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!responsive) return;

    const updateColumns = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      const availableWidth = containerWidth - (gap * (maxColumns - 1));
      const calculatedColumns = Math.floor(availableWidth / minItemWidth);
      const finalColumns = Math.min(Math.max(calculatedColumns, 1), maxColumns);
      
      setColumns(finalColumns);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    
    // Use ResizeObserver for more accurate container size tracking
    const resizeObserver = new ResizeObserver(updateColumns);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateColumns);
      resizeObserver.disconnect();
    };
  }, [responsive, minItemWidth, maxColumns, gap]);

  if (responsive) {
    return (
      <div 
        ref={containerRef}
        className={cn('grid auto-rows-min', className)}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: `${gap}px`
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={cn(
      'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min',
      className
    )}>
      {children}
    </div>
  );
}

export function BentoItem({ 
  children, 
  className, 
  size = 'md', 
  variant = 'default',
  onClick,
  animate = true,
  delay = 0
}: BentoItemProps) {
  const [isVisible, setIsVisible] = useState(!animate);
  const itemRef = useRef<HTMLDivElement>(null);



  // Responsive size adjustments
  const responsiveSizeClasses = {
    sm: 'row-span-1 col-span-1',
    md: 'row-span-2 col-span-1 sm:col-span-1',
    lg: 'row-span-3 col-span-1 sm:col-span-2 lg:col-span-1',
    xl: 'row-span-4 col-span-1 sm:col-span-2 lg:col-span-2',
  };

  useEffect(() => {
    if (!animate) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => observer.disconnect();
  }, [animate, delay]);

  return (
    <div ref={itemRef}>
      <GlassCard
        variant={variant}
        className={cn(
          'p-4 sm:p-6 transition-all duration-500 ease-out',
          responsiveSizeClasses[size],
          onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
          animate && (isVisible 
            ? 'opacity-100 transform translate-y-0' 
            : 'opacity-0 transform translate-y-4'
          ),
          className
        )}
        onClick={onClick}
      >
        {children}
      </GlassCard>
    </div>
  );
}

// Predefined Bento layouts for common use cases
export function BentoDashboard({ 
  children, 
  className,
  responsive = true 
}: { 
  children: ReactNode;
  className?: string;
  responsive?: boolean;
}) {
  if (responsive) {
    return (
      <BentoGrid 
        className={cn('w-full', className)}
        responsive={true}
        minItemWidth={280}
        maxColumns={6}
        gap={16}
      >
        {children}
      </BentoGrid>
    );
  }

  return (
    <div className={cn(
      'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-4 auto-rows-min',
      className
    )}>
      {children}
    </div>
  );
}

export function BentoHero({ children, className }: BentoGridProps) {
  return (
    <GlassCard
      variant="elevated"
      className={cn(
        'col-span-full row-span-2 p-8 bg-gradient-to-br from-primary/10 to-secondary/10',
        className
      )}
    >
      {children}
    </GlassCard>
  );
}

export function BentoStat({ 
  title, 
  value, 
  change, 
  icon, 
  trend = 'up',
  className 
}: {
  title: string;
  value: string | number | ReactNode;
  change?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}) {
  const trendColors = {
    up: 'text-success',
    down: 'text-error',
    neutral: 'text-textSecondary',
  };

  return (
    <BentoItem size="sm" className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-textSecondary mb-1">{title}</p>
          <p className="text-2xl font-bold text-text">{value}</p>
          {change && (
            <div className={cn('flex items-center mt-2 text-sm', trendColors[trend])}>
              {trend === 'up' && (
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
              )}
              {trend === 'down' && (
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                </svg>
              )}
              <span>{change}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
    </BentoItem>
  );
}

export function BentoChart({ 
  title, 
  children, 
  className,
  actions
}: {
  title: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <BentoItem size="lg" className={className}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text">{title}</h3>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
      <div className="h-64">
        {children}
      </div>
    </BentoItem>
  );
}

export function BentoList({ 
  title, 
  items, 
  className,
  actions,
  renderItem
}: {
  title: string;
  items: any[];
  className?: string;
  actions?: ReactNode;
  renderItem: (item: any, index: number) => ReactNode;
}) {
  return (
    <BentoItem size="md" className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text">{title}</h3>
        {actions}
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-textSecondary">No items to display</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div key={index}>
              {renderItem(item, index)}
            </div>
          ))
        )}
      </div>
    </BentoItem>
  );
}
