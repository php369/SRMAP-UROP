import { Variants } from 'framer-motion';

/**
 * Framer Motion animation presets for the Academic Portal
 * Duration range: 150-600ms as per requirements
 */

// Fade up animation - element fades in while moving up
export const fadeUp: Variants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4, // 400ms
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.3, // 300ms
            ease: 'easeIn',
        },
    },
};

// Slide in animation - element slides in from the side
export const slideIn: Variants = {
    initial: {
        opacity: 0,
        x: -30,
    },
    animate: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.5, // 500ms
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        x: 30,
        transition: {
            duration: 0.3, // 300ms
            ease: 'easeIn',
        },
    },
};

// Slide in from right
export const slideInRight: Variants = {
    initial: {
        opacity: 0,
        x: 30,
    },
    animate: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.5, // 500ms
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        x: -30,
        transition: {
            duration: 0.3, // 300ms
            ease: 'easeIn',
        },
    },
};

// Stagger animation - for lists and grids
export const staggerContainer: Variants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.1, // 100ms delay between children
            delayChildren: 0.15, // 150ms delay before first child
        },
    },
    exit: {
        transition: {
            staggerChildren: 0.05,
            staggerDirection: -1,
        },
    },
};

// Stagger child item
export const staggerItem: Variants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4, // 400ms
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: {
            duration: 0.2, // 200ms
            ease: 'easeIn',
        },
    },
};

// Parallax animation - for background elements
export const parallax = (offset: number = 50): Variants => ({
    initial: {
        y: 0,
    },
    animate: {
        y: offset,
        transition: {
            duration: 0.6, // 600ms
            ease: 'easeOut',
        },
    },
});

// Scale animation - for modals and popups
export const scaleIn: Variants = {
    initial: {
        opacity: 0,
        scale: 0.9,
    },
    animate: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.3, // 300ms
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: {
            duration: 0.2, // 200ms
            ease: 'easeIn',
        },
    },
};

// Fade animation - simple fade in/out
export const fade: Variants = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
        transition: {
            duration: 0.3, // 300ms
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.2, // 200ms
            ease: 'easeIn',
        },
    },
};

// Blur animation - for glassmorphic effects
export const blurIn: Variants = {
    initial: {
        opacity: 0,
        filter: 'blur(10px)',
    },
    animate: {
        opacity: 1,
        filter: 'blur(0px)',
        transition: {
            duration: 0.5, // 500ms
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        filter: 'blur(10px)',
        transition: {
            duration: 0.3, // 300ms
            ease: 'easeIn',
        },
    },
};

// Rotate animation - for loading spinners
export const rotate: Variants = {
    animate: {
        rotate: 360,
        transition: {
            duration: 1,
            ease: 'linear',
            repeat: Infinity,
        },
    },
};

// Bounce animation - for attention-grabbing elements
export const bounce: Variants = {
    animate: {
        y: [0, -10, 0],
        transition: {
            duration: 0.6, // 600ms
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 1,
        },
    },
};

// Glow animation - for buttons and interactive elements
export const glow: Variants = {
    initial: {
        boxShadow: '0 0 0 rgba(99, 102, 241, 0)',
    },
    animate: {
        boxShadow: [
            '0 0 0 rgba(99, 102, 241, 0)',
            '0 0 20px rgba(99, 102, 241, 0.5)',
            '0 0 0 rgba(99, 102, 241, 0)',
        ],
        transition: {
            duration: 2,
            ease: 'easeInOut',
            repeat: Infinity,
        },
    },
};

// Hover animations
export const hoverScale = {
    scale: 1.05,
    transition: {
        duration: 0.2, // 200ms
        ease: 'easeOut',
    },
};

export const hoverLift = {
    y: -5,
    transition: {
        duration: 0.2, // 200ms
        ease: 'easeOut',
    },
};

export const hoverGlow = {
    boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)',
    transition: {
        duration: 0.3, // 300ms
        ease: 'easeOut',
    },
};

// Tap animations
export const tapScale = {
    scale: 0.95,
    transition: {
        duration: 0.15, // 150ms
        ease: 'easeInOut',
    },
};
