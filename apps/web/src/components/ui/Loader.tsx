import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface LoaderProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    text?: string;
    fullscreen?: boolean;
}

export function Loader({ size = 'md', className, text, fullscreen = false }: LoaderProps) {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24',
    };

    const LoaderContent = () => (
        <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
            <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
                {/* Outer Ring */}
                <motion.span
                    className="absolute inset-0 rounded-full border-t-2 border-r-2 border-srm-400"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />

                {/* Middle Ring (Reverse) */}
                <motion.span
                    className="absolute inset-1 rounded-full border-b-2 border-l-2 border-srm-600/60"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />

                {/* Inner Pulse */}
                <motion.div
                    className="w-1/3 h-1/3 bg-srm-500 rounded-full"
                    animate={{
                        scale: [0.8, 1.2, 0.8],
                        opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {text && (
                <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-sm font-medium text-slate-500 tracking-wide uppercase"
                >
                    {text}
                </motion.p>
            )}
        </div>
    );

    if (fullscreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
                <LoaderContent />
            </div>
        );
    }

    return <LoaderContent />;
}
