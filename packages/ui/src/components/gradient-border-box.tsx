import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface GradientBorderBoxProps extends HTMLAttributes<HTMLDivElement> {
  gradient?: 'neon' | 'srm' | 'custom';
  borderWidth?: number;
  animated?: boolean;
}

export const GradientBorderBox = forwardRef<HTMLDivElement, GradientBorderBoxProps>(
  ({ 
    className, 
    gradient = 'neon', 
    borderWidth = 1, 
    animated = false,
    children,
    style,
    ...props 
  }, ref) => {
    const gradientMap = {
      neon: 'linear-gradient(45deg, #00D4FF, #8B5CF6, #EC4899)',
      srm: 'linear-gradient(135deg, #FF6B35, #004E89, #00A8CC)',
      custom: 'linear-gradient(45deg, #00D4FF, #8B5CF6)',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-glass overflow-hidden',
          animated && 'animate-gradient bg-[length:400%_400%]',
          className
        )}
        style={{
          background: gradientMap[gradient],
          padding: `${borderWidth}px`,
          ...style,
        }}
        {...props}
      >
        <div className="h-full w-full rounded-glass bg-black/90 dark:bg-white/5 backdrop-blur-md">
          {children}
        </div>
      </div>
    );
  }
);

GradientBorderBox.displayName = 'GradientBorderBox';