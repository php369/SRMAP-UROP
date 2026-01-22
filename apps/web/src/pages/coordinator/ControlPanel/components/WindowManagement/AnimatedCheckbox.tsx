import { motion, Variants } from 'framer-motion';

interface AnimatedCheckboxProps {
    checked: boolean;
    indeterminate?: boolean;
    onChange: (checked: boolean) => void;
    className?: string;
}

export function AnimatedCheckbox({ checked, indeterminate, onChange, className = "" }: AnimatedCheckboxProps) {
    const tickVariants: Variants = {
        checked: {
            pathLength: 1,
            opacity: 1,
            transition: {
                duration: 0.2,
                ease: "easeOut"
            }
        },
        unchecked: {
            pathLength: 0,
            opacity: 0,
            transition: {
                duration: 0.1
            }
        }
    };

    const boxVariants: Variants = {
        checked: {
            backgroundColor: "#2563eb", // blue-600
            borderColor: "#2563eb",
            scale: 1,
        },
        unchecked: {
            backgroundColor: "#ffffff",
            borderColor: "#d1d5db", // gray-300
            scale: 1,
        },
        indeterminate: {
            backgroundColor: "#2563eb",
            borderColor: "#2563eb",
            scale: 1,
        },
        pressed: {
            scale: 0.92
        }
    };

    return (
        <motion.div
            initial={false}
            animate={indeterminate ? "indeterminate" : (checked ? "checked" : "unchecked")}
            whileTap="pressed"
            variants={boxVariants}
            onClick={() => onChange(!checked)}
            className={`
        relative w-5 h-5 rounded-md border-2 cursor-pointer flex items-center justify-center
        transition-colors duration-200
        ${className}
      `}
        >
            {indeterminate ? (
                <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    className="w-2.5 h-0.5 bg-white rounded-full"
                />
            ) : (
                <svg
                    viewBox="0 0 24 24"
                    className="w-3.5 h-3.5 text-white fill-none stroke-current stroke-[4]"
                >
                    <motion.path
                        d="M4 12L9 17L20 6"
                        variants={tickVariants}
                        initial="unchecked"
                        animate={checked ? "checked" : "unchecked"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )}
        </motion.div>
    );
}
