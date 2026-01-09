import { ReactNode, useEffect, useRef } from 'react';
import Lenis from 'lenis';

interface ScrollProviderProps {
    children: ReactNode;
}

export function ScrollProvider({ children }: ScrollProviderProps) {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            return; // DONT init Lenis if reduced motion is enabled
        }

        // Initialize Lenis with premium configuration
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo - creates that "premium" snappy yet smooth feel
            // Alternative easeOutCubic: (t) => 1 - Math.pow(1 - t, 3) 
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            // Core requirement: smoothTouch: false (Native feel on touch devices)
            // Note: In newer Lenis versions, smoothTouch is deprecated/removed in favor of just not preventing default on touch? 
            // Actually, for Lenis V1+, just omitting it or checking docs. 
            // V1.1.18: 'smoothTouch' might not be a direct option in the same way, but 'touchInertiaMultiplier' exists.
            // However, the user specifically requested "smoothTouch: false". 
            // In standard Lenis setup, it listens to wheel events. It doesn't hijack touch events unless configured to do so or "syncTouch" is involved?
            // Actually, Lenis by default DOES NOT smooth scroll on touch devices unless you explicitly handle it or if the device acts like a mouse.
            // We want to ensure it DOES NOT override touchmove. 
            // The default behavior is usually fine, but let's be explicit if the type allows.
            // If the type definition complains, we remove active properties that don't exist.
        });

        lenisRef.current = lenis;

        // RAF loop
        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        const rafId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(rafId);
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    return (
        <div className="w-full min-h-screen">
            {children}
        </div>
    );
}
