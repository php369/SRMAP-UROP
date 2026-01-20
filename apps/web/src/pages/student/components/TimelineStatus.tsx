
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock, ArrowRight } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface TimelineStatusProps {
    evaluation: any;
}

export const TimelineStatus = ({ evaluation }: TimelineStatusProps) => {
    if (!evaluation) return null;

    const steps = [
        {
            id: 'cla1',
            label: 'CLA-1',
            data: evaluation.internal?.cla1,
            date: evaluation.internal?.cla1?.conductedAt
        },
        {
            id: 'cla2',
            label: 'CLA-2',
            data: evaluation.internal?.cla2,
            date: evaluation.internal?.cla2?.conductedAt
        },
        {
            id: 'cla3',
            label: 'CLA-3',
            data: evaluation.internal?.cla3,
            date: evaluation.internal?.cla3?.conductedAt
        },
        {
            id: 'external',
            label: 'External',
            data: evaluation.external?.reportPresentation,
            date: evaluation.external?.reportPresentation?.conductedAt
        }
    ];

    const completedCount = steps.filter(step => step.data?.conduct > 0).length;
    // Calculate progress percentage: 0% at first step, 100% at last step
    const progressWidth = steps.length > 1 && completedCount > 0
        ? ((completedCount - 1) / (steps.length - 1)) * 100
        : 0;

    return (
        <div className="w-full pt-4 pb-12 min-h-[100px] isolate">
            <div className="relative flex items-center justify-between w-full max-w-4xl mx-auto px-8">
                {/* Background Line */}
                <div className="absolute left-[52px] right-[52px] top-5 -translate-y-1/2 h-1 bg-slate-100 dark:bg-slate-800 z-10 rounded-full" />

                {/* Progress Fill Line (Framer Motion) */}
                {completedCount > 0 && (
                    <motion.div
                        className="absolute left-[52px] top-5 -translate-y-1/2 h-1.5 bg-emerald-500 z-20 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                        initial={{ width: 0 }}
                        animate={{ width: `calc((100% - 104px) * ${progressWidth / 100})` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    />
                )}

                {steps.map((step, index) => {
                    const isCompleted = step.data?.conduct > 0;

                    return (
                        <div key={step.id} className="relative flex flex-col items-center">
                            {/* Step Circle */}
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 z-30 bg-white dark:bg-slate-900 shadow-sm",
                                    isCompleted
                                        ? "border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                        : "border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600"
                                )}
                            >
                                {isCompleted ? (
                                    <CheckCircle className="w-5 h-5 animate-in zoom-in-50 duration-500" strokeWidth={3} />
                                ) : (
                                    <Circle className="w-5 h-5" />
                                )}
                            </div>

                            {/* Label */}
                            <div className="absolute top-12 flex flex-col items-center w-32 text-center pointer-events-none">
                                <span className={cn(
                                    "text-xs font-bold transition-colors tracking-tight",
                                    isCompleted ? "text-slate-900 dark:text-white" : "text-slate-400"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
