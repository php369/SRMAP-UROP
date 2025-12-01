import { ReactNode, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface GradientBorderBoxProps {
    children: ReactNode;
    className?: string;
    gradient?: 'primary' | 'secondary' | 'accent' | 'rainbow';
    borderWidth?: '1' | '2' | '3' | '4';
    rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    glow?: boolean;
}

export const GradientBorderBox = forwardRef<HTMLDivElement, GradientBorderBoxProps>(
    ({
        children,
        className,
        gradient = 'primary',
        borderWidth = '2',
        rounded = 'xl',
        padding = 'md',
        glow = false
    }, ref) => {
        const gradients = {
            primary: 'from-primary-400 via-primary-500 to-primary-600',
            secondary: 'from-secondary-400 via-secondary-500 to-secondary-600',
            accent: 'from-accent-400 via-accent-500 to-accent-600',
            rainbow: 'from-pink-500 via-purple-500 to-blue-500',
        };

        const roundedClasses = {
            sm: 'rounded-sm',
            md: 'rounded-md',
            lg: 'rounded-lg',
            xl: 'rounded-xl',
            '2xl': 'rounded-2xl',
            '3xl': 'rounded-3xl',
        };

        const paddingClasses = {
            none: 'p-0',
            sm: 'p-2',
            md: 'p-4',
            lg: 'p-6',
        };

        const glowClasses = glow ? {
            primary: 'shadow-lg shadow-primary-500/50',
            secondary: 'shadow-lg shadow-secondary-500/50',
            accent: 'shadow-lg shadow-accent-500/50',
            rainbow: 'shadow-lg shadow-purple-500/50',
        } : {};

        return (
            <div
                ref={ref}
                className={cn(
                    'relative',
                    roundedClasses[rounded],
                    glow && glowClasses[gradient],
                    'transition-all duration-300',
                    className
                )}
            >
                {/* Gradient border */}
                <div
                    className={cn(
                        'absolute inset-0',
                        `bg-gradient-to-r ${gradients[gradient]}`,
                        roundedClasses[rounded],
                        `p-[${borderWidth}px]`,
                        'animate-gradient-x'
                    )}
                    style={{
                        padding: `${borderWidth}px`,
                    }}
                >
                    {/* Inner content background */}
                    <div
                        className={cn(
                            'w-full h-full bg-background',
                            roundedClasses[rounded]
                        )}
                    />
                </div>

                {/* Content */}
                <div
                    className={cn(
                        'relative z-10',
                        paddingClasses[padding]
                    )}
                >
                    {children}
                </div>
            </div>
        );
    }
);

GradientBorderBox.displayName = 'GradientBorderBox';
