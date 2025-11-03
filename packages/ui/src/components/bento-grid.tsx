import React from 'react';
import { cn } from '../utils/cn';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

interface BentoGridItemProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[200px]",
      className
    )}>
      {children}
    </div>
  );
}

export function BentoGridItem({ 
  children, 
  className, 
  colSpan = 1, 
  rowSpan = 1 
}: BentoGridItemProps) {
  return (
    <div 
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm p-6",
        `col-span-${colSpan} row-span-${rowSpan}`,
        className
      )}
    >
      {children}
    </div>
  );
}