import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface ContainerProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  padding?: boolean;
}

export function Container({ 
  children, 
  size = 'xl', 
  className, 
  padding = true 
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className={cn(
      'mx-auto w-full',
      sizeClasses[size],
      padding && 'px-4 sm:px-6 lg:px-8',
      className
    )}>
      {children}
    </div>
  );
}

// Section wrapper with consistent spacing
interface SectionProps {
  children: ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Section({ children, className, spacing = 'lg' }: SectionProps) {
  const spacingClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-24',
  };

  return (
    <section className={cn(spacingClasses[spacing], className)}>
      {children}
    </section>
  );
}

// Responsive grid system
interface GridProps {
  children: ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export function Grid({ 
  children, 
  cols = { default: 1, md: 2, lg: 3 }, 
  gap = 6, 
  className 
}: GridProps) {
  const getGridClasses = () => {
    const classes = ['grid'];
    
    if (cols.default) classes.push(`grid-cols-${cols.default}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    
    classes.push(`gap-${gap}`);
    
    return classes.join(' ');
  };

  return (
    <div className={cn(getGridClasses(), className)}>
      {children}
    </div>
  );
}

// Flex utilities
interface FlexProps {
  children: ReactNode;
  direction?: 'row' | 'col';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  gap?: number;
  className?: string;
}

export function Flex({ 
  children, 
  direction = 'row', 
  align = 'start', 
  justify = 'start', 
  wrap = false,
  gap = 0,
  className 
}: FlexProps) {
  const directionClass = direction === 'col' ? 'flex-col' : 'flex-row';
  const alignClass = `items-${align}`;
  const justifyClass = `justify-${justify}`;
  const wrapClass = wrap ? 'flex-wrap' : '';
  const gapClass = gap > 0 ? `gap-${gap}` : '';

  return (
    <div className={cn(
      'flex',
      directionClass,
      alignClass,
      justifyClass,
      wrapClass,
      gapClass,
      className
    )}>
      {children}
    </div>
  );
}

// Stack component for vertical layouts
interface StackProps {
  children: ReactNode;
  spacing?: number;
  className?: string;
}

export function Stack({ children, spacing = 4, className }: StackProps) {
  return (
    <div className={cn(`space-y-${spacing}`, className)}>
      {children}
    </div>
  );
}

// Responsive show/hide utilities
interface ResponsiveProps {
  children: ReactNode;
  show?: ('sm' | 'md' | 'lg' | 'xl')[];
  hide?: ('sm' | 'md' | 'lg' | 'xl')[];
  className?: string;
}

export function Responsive({ children, show, hide, className }: ResponsiveProps) {
  const getVisibilityClasses = () => {
    const classes = [];
    
    if (show) {
      classes.push('hidden');
      show.forEach(breakpoint => {
        classes.push(`${breakpoint}:block`);
      });
    }
    
    if (hide) {
      classes.push('block');
      hide.forEach(breakpoint => {
        classes.push(`${breakpoint}:hidden`);
      });
    }
    
    return classes.join(' ');
  };

  return (
    <div className={cn(getVisibilityClasses(), className)}>
      {children}
    </div>
  );
}
