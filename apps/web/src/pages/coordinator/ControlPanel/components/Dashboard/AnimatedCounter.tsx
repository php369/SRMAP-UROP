import { useEffect, useState } from 'react';

export const AnimatedCounter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value;
        if (start === end) return;

        const totalMilSec = duration;
        const incrementTime = (totalMilSec / end) * 5;

        const timer = setInterval(() => {
            start += 1;
            setCount(String(start) as any);
            if (start === end) clearInterval(timer);
        }, incrementTime);

        // Better implementation using requestAnimationFrame for smoother generic animation
        // But for simple integer counting the above or a simple lerp is fine. 
        // Let's use a simple frame-based approach for better performance with large numbers:

        let startTime: number | null = null;
        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Easing function: easeOutQuart
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);

            setCount(Math.floor(easeOutQuart * value));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);

        return () => { };
    }, [value, duration]);

    return <>{count}</>;
};
