import { useRef } from 'react';
import { motion, useInView, UseInViewOptions } from 'framer-motion';
import { ReactNode } from 'react';

interface ScrollRevealProps {
    children: ReactNode;
    width?: "fit-content" | "100%";
    delay?: number;
    duration?: number;
    threshold?: number;
    className?: string;
    // Optional Framer Motion specific props
    once?: boolean;
    amount?: UseInViewOptions['amount'];
    // Legacy mapping
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    fullWidth?: boolean;
}

export function ScrollReveal({
    children,
    width = "fit-content",
    delay = 0,
    duration = 0.5,
    threshold, // mapped to amount if not explicitly provided
    className = "",
    once = true,
    amount = 0.2,
    direction = 'up',
    fullWidth = false
}: ScrollRevealProps) {
    const ref = useRef(null);
    // Use threshold as amount if provided, otherwise default amount
    const viewAmount = threshold !== undefined ? threshold : amount;
    const isInView = useInView(ref, { once, amount: viewAmount });

    const getVariants = () => {
        const distance = 20;
        switch (direction) {
            case 'up': return { hidden: { opacity: 0, y: distance }, visible: { opacity: 1, y: 0 } };
            case 'down': return { hidden: { opacity: 0, y: -distance }, visible: { opacity: 1, y: 0 } };
            case 'left': return { hidden: { opacity: 0, x: distance }, visible: { opacity: 1, x: 0 } };
            case 'right': return { hidden: { opacity: 0, x: -distance }, visible: { opacity: 1, x: 0 } };
            case 'none': return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
            default: return { hidden: { opacity: 0, y: distance }, visible: { opacity: 1, y: 0 } };
        }
    };

    const appliedWidth = fullWidth ? "100%" : width;

    return (
        <div ref={ref} style={{ width: appliedWidth, overflow: "hidden" }} className={className}>
            <motion.div
                variants={getVariants()}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{
                    duration: duration,
                    delay: delay,
                    ease: "easeOut"
                }}
            >
                {children}
            </motion.div>
        </div>
    );
}

// Staggered container for lists
export function ScrollRevealGroup({
    children,
    staggerDelay = 0.1,
    className = ""
}: {
    children: ReactNode,
    staggerDelay?: number,
    className?: string
}) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
                visible: {
                    transition: {
                        staggerChildren: staggerDelay
                    }
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export const revealItem = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};
