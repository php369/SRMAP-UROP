
import { motion } from 'framer-motion';
import { Plus, Sparkles, Lightbulb, Target, Users, BookOpen } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface ActiveProposalEmptyStateProps {
    onCreate: () => void;
}

export function ActiveProposalEmptyState({ onCreate }: ActiveProposalEmptyStateProps) {
    return (
        <div className="w-full flex-1 md:min-h-[500px] flex flex-col">
            <div className="relative h-full w-full overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-950/30 backdrop-blur-xl shadow-2xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent" />

                <div className="relative h-full w-full p-8 md:p-12 flex flex-col items-center justify-center text-center">

                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-orange-200/20 dark:bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 flex flex-col items-center max-w-2xl mx-auto"
                    >
                        {/* Icon Group */}
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full" />
                            <div className="relative bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-orange-100 dark:border-orange-900/30 ring-4 ring-orange-50/50 dark:ring-orange-900/20">
                                <Lightbulb className="w-12 h-12 text-orange-600 dark:text-orange-500" strokeWidth={1.5} />

                                {/* Floating mini-icons */}
                                <motion.div
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-3 -right-3 bg-blue-50 dark:bg-slate-700 p-2 rounded-xl shadow-sm border border-blue-100 dark:border-slate-600"
                                >
                                    <Sparkles className="w-4 h-4 text-blue-500" />
                                </motion.div>

                                <motion.div
                                    animate={{ y: [0, 5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                    className="absolute -bottom-2 -left-3 bg-green-50 dark:bg-slate-700 p-2 rounded-xl shadow-sm border border-green-100 dark:border-slate-600"
                                >
                                    <Users className="w-4 h-4 text-green-500" />
                                </motion.div>
                            </div>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                            Propose Your Next <span className="text-orange-600 dark:text-orange-500">Breakthrough</span>
                        </h2>

                        <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 leading-relaxed">
                            The proposal window is now open. Define your research objectives, set prerequisites, and find the perfect student candidates to collaborate with.
                        </p>

                        {/* Feature Checkpoints */}
                        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-10 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
                                <Target className="w-4 h-4 text-orange-500" />
                                <span>Define Scope</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
                                <Users className="w-4 h-4 text-blue-500" />
                                <span>Select Team</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
                                <BookOpen className="w-4 h-4 text-green-500" />
                                <span>Publish Research</span>
                            </div>
                        </div>

                        <Button
                            onClick={onCreate}
                            size="lg"
                            className="group h-12 px-8 text-base bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200 dark:shadow-none hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-full"
                        >
                            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                            Create Project Proposal
                        </Button>

                    </motion.div>
                </div>
            </div>
        </div>
    );
}
