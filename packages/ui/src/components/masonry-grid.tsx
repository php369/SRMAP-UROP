import React from 'react';
import { cn } from '../utils/cn';

interface MasonryGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: number;
  gap?: string;
}

export function MasonryGrid({ 
  children, 
  className, 
  columns = 3,
  gap = '1rem'
}: MasonryGridProps) {
  return (
    <div 
      className={cn("columns-1 md:columns-2 lg:columns-3", className)}
      style={{
        columnCount: columns,
        columnGap: gap,
      }}
    >
      {children}
    </div>
  );
}

interface MasonryItemProps {
  children: React.ReactNode;
  className?: string;
}

export function MasonryItem({ children, className }: MasonryItemProps) {
  return (
    <div className={cn("break-inside-avoid mb-4", className)}>
      {children}
    </div>
  );
}