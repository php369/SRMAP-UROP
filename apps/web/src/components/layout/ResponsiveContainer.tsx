import { ReactNode, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full' | 'none';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  center?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
  none: 'max-w-none',
};

const paddingClasses = {
  none: '',
  sm: 'px-4 py-2',
  md: 'px-6 py-4',
  lg: 'px-8 py-6',
  xl: 'px-12 py-8',
};

export const ResponsiveContainer = forwardRef<HTMLDivElement, ResponsiveContainerProps>(
  ({ children, className, maxWidth = '7xl', padding = 'md', center = true }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'w-full',
          maxWidthClasses[maxWidth],
          paddingClasses[padding],
          center && 'mx-auto',
          className
        )}
      >
        {children}
      </div>
    );
  }
);

ResponsiveContainer.displayName = 'ResponsiveContainer';

// Specialized responsive containers for common use cases
export function DashboardContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ResponsiveContainer maxWidth="7xl" padding="lg" className={cn('space-y-6', className)}>
      {children}
    </ResponsiveContainer>
  );
}

export function ContentContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ResponsiveContainer maxWidth="4xl" padding="md" className={cn('prose prose-lg max-w-none', className)}>
      {children}
    </ResponsiveContainer>
  );
}

export function FormContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ResponsiveContainer maxWidth="2xl" padding="lg" className={cn('space-y-6', className)}>
      {children}
    </ResponsiveContainer>
  );
}

export function FullWidthContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ResponsiveContainer maxWidth="full" padding="none" center={false} className={className}>
      {children}
    </ResponsiveContainer>
  );
}
