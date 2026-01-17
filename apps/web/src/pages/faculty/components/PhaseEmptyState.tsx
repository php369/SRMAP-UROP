import { motion } from 'framer-motion';
import { Sparkles, Brain } from 'lucide-react';
import { GradientBorderBox } from '../../../components/ui/GradientBorderBox';

export function PhaseEmptyState() {
    return (
        <div className="relative p-12 w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm shadow-xl">
            {/* Background Animated Elements */}
            <div className="absolute inset-0 z-0 opacity-50">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-orange-500/10 dark:bg-orange-600/10 blur-[80px]"
                        style={{
                            width: Math.random() * 300 + 200,
                            height: Math.random() * 300 + 200,
                            left: `${Math.random() * 100}% `,
                            top: `${Math.random() * 100}% `,
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
                                className="absolute -inset-8 text-orange-500/20 dark:text-orange-500/10"
                            >
                                <Sparkles className="w-24 h-24" />
                            </motion.div>
                            <div className="relative bg-orange-500/10 dark:bg-orange-500/20 p-6 rounded-3xl text-orange-600 ring-1 ring-orange-500/20">
                                <Brain className="w-12 h-12" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                                Project Proposals
                            </h2>
                            <div className="flex items-center justify-center gap-2">
                                <span className="h-px w-8 bg-orange-300 dark:bg-orange-800" />
                                <span className="text-orange-600 font-bold uppercase tracking-widest text-xs">Research Portal</span>
                                <span className="h-px w-8 bg-orange-300 dark:bg-orange-800" />
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed max-w-sm mx-auto font-medium">
                                The proposal submission window has not been scheduled yet.
                            </p>
                            <p className="text-slate-500 dark:text-slate-500 text-sm max-w-md mx-auto">
                                You are encouraged to brainstorm your next breakthrough research ideas while proposals remains locked.
                            </p>
                        </div>

                        {/* Creative Decorative Element */}
                        <div className="pt-8">
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
                                        className="w-1.5 h-1.5 rounded-full bg-orange-500"
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
