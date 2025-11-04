import { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

interface ProgressIndicatorProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'linear' | 'circular';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function ProgressIndicator({
  value,
  max = 100,
  size = 'md',
  variant = 'linear',
  color = 'primary',
  showLabel = true,
  animated = true,
  className,
}: ProgressIndicatorProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const percentage = Math.min((value / max) * 100, 100);

  useEffect(() => {
    if (!animated || !isVisible) {
      setAnimatedValue(percentage);
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / 1500, 1);
      
      // Easing function
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = percentage * easeOutCubic;
      
      setAnimatedValue(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [percentage, animated, isVisible]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`progress-${value}-${max}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [value, max]);

  const sizeClasses = {
    sm: variant === 'linear' ? 'h-2' : 'w-12 h-12',
    md: variant === 'linear' ? 'h-3' : 'w-16 h-16',
    lg: variant === 'linear' ? 'h-4' : 'w-20 h-20',
  };

  const colorClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  };

  if (variant === 'circular') {
    const radius = size === 'sm' ? 20 : size === 'md' ? 28 : 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

    return (
      <div
        id={`progress-${value}-${max}`}
        className={cn('relative inline-flex items-center justify-center', className)}
      >
        <svg className={cn(sizeClasses[size], 'transform -rotate-90')}>
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-border opacity-20"
          />
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn('transition-all duration-1000 ease-out', {
              'text-primary': color === 'primary',
              'text-secondary': color === 'secondary',
              'text-success': color === 'success',
              'text-warning': color === 'warning',
              'text-error': color === 'error',
            })}
            strokeLinecap="round"
          />
        </svg>
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-text">
              {Math.round(animatedValue)}%
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      id={`progress-${value}-${max}`}
      className={cn('w-full', className)}
    >
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-text">Progress</span>
          <span className="text-sm text-textSecondary">
            {Math.round(animatedValue)}%
          </span>
        </div>
      )}
      <div className={cn('w-full bg-border/20 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000 ease-out',
            colorClasses[color]
          )}
          style={{ width: `${animatedValue}%` }}
        />
      </div>
    </div>
  );
}
