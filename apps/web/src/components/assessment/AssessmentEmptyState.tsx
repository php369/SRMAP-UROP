import { motion } from 'framer-motion';
import { Award, FileText, CheckCircle, Clock, Sparkles, ShieldCheck, Users, LucideIcon } from 'lucide-react';
import { GradientBorderBox } from '../ui/GradientBorderBox';
import { cn } from '../../utils/cn';

interface AssessmentEmptyStateProps {
    title: string;
    description: string;
    subDescription?: string;
    icon?: 'award' | 'file-text' | 'check' | 'clock' | 'shield' | 'users';
    theme?: 'amber' | 'emerald' | 'indigo';
    subtitle?: string;
    action?: React.ReactNode;
}

export function AssessmentEmptyState({
    title,
    description,
    subDescription,
    icon = 'file-text',
    theme = 'amber',
    subtitle = "ASSESSMENT",
    action
}: AssessmentEmptyStateProps) {
    const themeColors = {
        amber: {
            bg: "bg-amber-500/10 dark:bg-amber-600/10",
            text: "text-amber-600 dark:text-amber-400",
            border: "border-amber-200 dark:border-amber-800",
            iconBg: "bg-amber-100 dark:bg-amber-900/30",
            iconRing: "ring-amber-500/20",
            sparkle: "text-amber-500/20 dark:text-amber-500/10",
            line: "bg-amber-300 dark:bg-amber-800",
            dot: "bg-amber-500"
        },
        emerald: {
            bg: "bg-emerald-500/10 dark:bg-emerald-600/10",
            text: "text-emerald-600 dark:text-emerald-400",
            border: "border-emerald-200 dark:border-emerald-800",
            iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
            iconRing: "ring-emerald-500/20",
            sparkle: "text-emerald-500/20 dark:text-emerald-500/10",
            line: "bg-emerald-300 dark:bg-emerald-800",
            dot: "bg-emerald-500"
        },
        indigo: {
            bg: "bg-indigo-500/10 dark:bg-indigo-600/10",
            text: "text-indigo-600 dark:text-indigo-400",
            border: "border-indigo-200 dark:border-indigo-800",
            iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
            iconRing: "ring-indigo-500/20",
            sparkle: "text-indigo-500/20 dark:text-indigo-500/10",
            line: "bg-indigo-300 dark:bg-indigo-800",
            dot: "bg-indigo-500"
        }
    };

    const colors = themeColors[theme];

    const icons = {
        award: Award,
        'file-text': FileText,
        check: CheckCircle,
        clock: Clock,
        shield: ShieldCheck,
        users: Users
    };

    const Icon = icons[icon];

    return (
        <div className={cn(
            "relative p-8 md:p-12 w-full max-w-2xl mx-auto overflow-hidden rounded-[2.5rem] border bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm shadow-xl",
            "border-slate-200 dark:border-slate-800"
        )}>
            {/* Background Animated Elements */}
            <div className="absolute inset-0 z-0 opacity-50">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className={cn("absolute rounded-full blur-[80px]", colors.bg)}
                        style={{
                            width: Math.random() * 300 + 200,
                            height: Math.random() * 300 + 200,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            x: [0, Math.random() * 200 - 100, 0],
                            y: [0, Math.random() * 200 - 100, 0],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: Math.random() * 15 + 15,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full flex flex-col items-center text-center"
            >
                <GradientBorderBox
                    gradient="accent"
                    glow
                    rounded="3xl"
                    padding="md"
                    className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-none shadow-2xl w-full max-w-lg"
                >
                    <div className="flex flex-col items-center gap-8 py-4">
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                                className={cn("absolute -inset-8", colors.sparkle)}
                            >
                                <Sparkles className="w-24 h-24" />
                            </motion.div>
                            <div className={cn("relative p-6 rounded-3xl ring-1", colors.iconBg, colors.text, colors.iconRing)}>
                                <Icon className="w-12 h-12" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                                {title}
                            </h2>
                            <div className="flex items-center justify-center gap-2">
                                <span className={cn("h-px w-8", colors.line)} />
                                <span className={cn("font-bold uppercase tracking-widest text-xs", colors.text)}>{subtitle}</span>
                                <span className={cn("h-px w-8", colors.line)} />
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed max-w-sm mx-auto font-medium">
                                {description}
                            </p>
                            {subDescription && (
                                <p className="text-slate-500 dark:text-slate-500 text-sm max-w-md mx-auto">
                                    {subDescription}
                                </p>
                            )}

                            {action && (
                                <div className="mt-4">
                                    {action}
                                </div>
                            )}
                        </div>

                        {/* Decorative dots */}
                        <div className="pt-4">
                            <div className="flex gap-1 justify-center">
                                {[...Array(3)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            scale: [1, 1.5, 1],
                                            opacity: [0.3, 0.6, 0.3]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            delay: i * 0.4
                                        }}
                                        className={cn("w-1.5 h-1.5 rounded-full", colors.dot)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </GradientBorderBox>
            </motion.div>
        </div>
    );
}
