import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

interface RevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    duration?: number;
    fullWidth?: boolean;
}

export function Reveal({
    children,
    className,
    delay = 0,
    direction = 'up',
    duration = 0.8,
    fullWidth = false,
}: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px', // Trigger slightly before element is fully in view
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);

    const getTranslateStyle = () => {
        if (!isVisible) {
            switch (direction) {
                case 'up': return 'translateY(30px)';
                case 'down': return 'translateY(-30px)';
                case 'left': return 'translateX(30px)';
                case 'right': return 'translateX(-30px)';
                default: return 'none';
            }
        }
        return 'none';
    };

    return (
        <div
            ref={ref}
            className={cn('relative', fullWidth ? 'w-full' : 'w-fit', className)}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: getTranslateStyle(),
                transition: `opacity ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
                willChange: 'opacity, transform',
            }}
        >
            {children}
        </div>
    );
}
