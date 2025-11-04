import { ReactNode, useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '../../utils/cn';

interface MasonryGridProps {
  children: ReactNode[];
  columns?: number;
  gap?: number;
  className?: string;
  breakpoints?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  minItemWidth?: number;
  autoResize?: boolean;
  animationDelay?: number;
}

export function MasonryGrid({ 
  children, 
  columns = 3, 
  gap = 16, 
  className,
  breakpoints = {
    xs: 1,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
    '2xl': 5,
  },
  minItemWidth = 280,
  autoResize = true,
  animationDelay = 100
}: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(columns);
  const [isReady, setIsReady] = useState(false);

  // Update column count based on screen size or container width
  const updateColumns = useCallback(() => {
    if (!containerRef.current) return;

    if (autoResize && minItemWidth) {
      // Calculate columns based on container width and minimum item width
      const containerWidth = containerRef.current.offsetWidth;
      const availableWidth = containerWidth - (gap * (columns - 1));
      const calculatedColumns = Math.floor(availableWidth / minItemWidth);
      const finalColumns = Math.min(Math.max(calculatedColumns, 1), columns);
      setColumnCount(finalColumns);
    } else {
      // Use breakpoint-based columns
      const width = window.innerWidth;
      
      if (width >= 1536 && breakpoints['2xl']) {
        setColumnCount(breakpoints['2xl']);
      } else if (width >= 1280 && breakpoints.xl) {
        setColumnCount(breakpoints.xl);
      } else if (width >= 1024 && breakpoints.lg) {
        setColumnCount(breakpoints.lg);
      } else if (width >= 768 && breakpoints.md) {
        setColumnCount(breakpoints.md);
      } else if (width >= 640 && breakpoints.sm) {
        setColumnCount(breakpoints.sm);
      } else if (width >= 475 && breakpoints.xs) {
        setColumnCount(breakpoints.xs);
      } else {
        setColumnCount(1);
      }
    }
    
    setIsReady(true);
  }, [breakpoints, autoResize, minItemWidth, gap, columns]);

  useEffect(() => {
    updateColumns();
    
    const debouncedUpdate = debounce(updateColumns, 150);
    window.addEventListener('resize', debouncedUpdate);
    
    // Use ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver(debouncedUpdate);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      resizeObserver.disconnect();
    };
  }, [updateColumns]);

  // Create columns array with balanced distribution
  const columnsArray = Array.from({ length: columnCount }, () => [] as ReactNode[]);
  const columnHeights = Array.from({ length: columnCount }, () => 0);

  // Distribute children across columns using a balanced approach
  children.forEach((child) => {
    // Find the column with the least height
    const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
    columnsArray[shortestColumnIndex].push(child);
    // Estimate height increase (this is a rough estimate)
    columnHeights[shortestColumnIndex] += 1;
  });

  if (!isReady) {
    return (
      <div 
        ref={containerRef}
        className={cn('opacity-0 transition-opacity duration-300', className)}
      >
        <div className="animate-pulse">
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: Math.min(children.length, 6) }).map((_, i) => (
              <div key={i} className="h-32 bg-surface/50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        'flex transition-all duration-300 ease-out opacity-100',
        className
      )}
      style={{ gap: `${gap}px` }}
    >
      {columnsArray.map((column, columnIndex) => (
        <div 
          key={columnIndex}
          className="flex-1 flex flex-col"
          style={{ gap: `${gap}px` }}
        >
          {column.map((item, itemIndex) => (
            <MasonryItem 
              key={`${columnIndex}-${itemIndex}`}
              delay={animationDelay * (columnIndex * column.length + itemIndex)}
            >
              {item}
            </MasonryItem>
          ))}
        </div>
      ))}
    </div>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Masonry item wrapper with animation
interface MasonryItemProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function MasonryItem({ children, className, delay = 0 }: MasonryItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={itemRef}
      className={cn(
        'transition-all duration-500 ease-out',
        isVisible 
          ? 'opacity-100 transform translate-y-0' 
          : 'opacity-0 transform translate-y-4',
        className
      )}
    >
      {children}
    </div>
  );
}
