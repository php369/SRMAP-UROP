import { ReactNode, useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  minItemWidth?: number;
  maxColumns?: number;
  gap?: number;
  type?: 'grid' | 'masonry';
  autoFit?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
}

interface GridItemProps {
  children: ReactNode;
  className?: string;
  span?: number;
  rowSpan?: number;
}

export function ResponsiveGrid({
  children,
  className,
  minItemWidth = 280,
  maxColumns = 6,
  gap = 16,
  type = 'grid',
  autoFit = true,
  aspectRatio = 'auto',
}: ResponsiveGridProps) {
  const [columns, setColumns] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoFit) return;

    const updateColumns = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const availableWidth = containerWidth - gap * (maxColumns - 1);
      const calculatedColumns = Math.floor(availableWidth / minItemWidth);
      const finalColumns = Math.min(Math.max(calculatedColumns, 1), maxColumns);

      setColumns(finalColumns);
    };

    updateColumns();

    const resizeObserver = new ResizeObserver(updateColumns);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateColumns);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateColumns);
    };
  }, [autoFit, minItemWidth, maxColumns, gap]);

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: '',
  };

  if (type === 'masonry') {
    // For masonry layout, we'll use CSS columns
    return (
      <div
        ref={containerRef}
        className={cn('w-full', className)}
        style={{
          columnCount: columns,
          columnGap: `${gap}px`,
        }}
      >
        {children}
      </div>
    );
  }

  // Regular grid layout
  return (
    <div
      ref={containerRef}
      className={cn(
        'grid w-full',
        aspectRatioClasses[aspectRatio],
        className
      )}
      style={{
        gridTemplateColumns: autoFit 
          ? `repeat(${columns}, minmax(0, 1fr))`
          : `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
        gap: `${gap}px`,
      }}
    >
      {children}
    </div>
  );
}

export function GridItem({ children, className, span = 1, rowSpan = 1 }: GridItemProps) {
  return (
    <div
      className={cn('w-full', className)}
      style={{
        gridColumn: span > 1 ? `span ${span}` : undefined,
        gridRow: rowSpan > 1 ? `span ${rowSpan}` : undefined,
      }}
    >
      {children}
    </div>
  );
}

// Specialized responsive grids for common use cases
export function ProjectGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ResponsiveGrid
      minItemWidth={320}
      maxColumns={4}
      gap={24}
      type="masonry"
      className={className}
    >
      {children}
    </ResponsiveGrid>
  );
}

export function CardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ResponsiveGrid
      minItemWidth={280}
      maxColumns={3}
      gap={16}
      aspectRatio="auto"
      className={className}
    >
      {children}
    </ResponsiveGrid>
  );
}

export function ImageGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ResponsiveGrid
      minItemWidth={200}
      maxColumns={6}
      gap={12}
      aspectRatio="square"
      className={className}
    >
      {children}
    </ResponsiveGrid>
  );
}

export function DashboardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ResponsiveGrid
      minItemWidth={300}
      maxColumns={4}
      gap={20}
      className={className}
    >
      {children}
    </ResponsiveGrid>
  );
}
