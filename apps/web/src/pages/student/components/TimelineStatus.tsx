
import React from 'react';
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

    return (
        <div className="w-full py-6">
            <div className="relative flex items-center justify-between w-full max-w-4xl mx-auto">
                {/* Connection Lines Background */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 dark:bg-slate-800 -z-10 rounded-full" />

                {steps.map((step, index) => {
                    const isCompleted = step.data?.conduct > 0;
                    const isPending = !isCompleted;
                    // You could add logic for "in progress" or "current" based on dates if available

                    return (
                        <div key={step.id} className="relative flex flex-col items-center group">
                            {/* Step Circle */}
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10 bg-white dark:bg-slate-900",
                                    isCompleted
                                        ? "border-emerald-500 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                        : "border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600"
                                )}
                            >
                                {isCompleted ? (
                                    <CheckCircle className="w-5 h-5" strokeWidth={3} />
                                ) : (
                                    <Circle className="w-5 h-5" />
                                )}
                            </div>

                            {/* Label & Status */}
                            <div className="absolute top-12 flex flex-col items-center w-32 text-center">
                                <span className={cn(
                                    "text-sm font-bold transition-colors mb-0.5",
                                    isCompleted ? "text-slate-900 dark:text-white" : "text-slate-400"
                                )}>
                                    {step.label}
                                </span>

                                {isCompleted ? (
                                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                                        Graded
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                                        Pending
                                    </span>
                                )}
                            </div>

                            {/* Progress Line Color Overlay (for completed steps) */}
                            {index < steps.length - 1 && steps[index].data?.conduct > 0 && steps[index + 1].data?.conduct > 0 && (
                                <div className="absolute left-[50%] top-1/2 -translate-y-1/2 h-1 bg-emerald-500 w-[calc(100%_+_2rem)] -z-10 transition-all duration-500 delay-300"
                                    style={{
                                        width: `calc((100vw - 4rem) / ${steps.length - 1})`,
                                        maxWidth: '250px' // Adjust based on container
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
