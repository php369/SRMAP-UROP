import { motion } from 'framer-motion';
import { Mail, UserCircle } from 'lucide-react';
import { ExternalEvaluator } from '../../types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../../../../../components/ui/dialog";

interface WorkloadDistributionModalProps {
    isOpen: boolean;
    onClose: () => void;
    evaluators: ExternalEvaluator[];
    totalProjects: number;
}

export function WorkloadDistributionModal({
    isOpen,
    onClose,
    evaluators,
    totalProjects
}: WorkloadDistributionModalProps) {
    const sortedEvaluators = [...evaluators].sort((a, b) => b.assignmentCount - a.assignmentCount);
    const maxAssignments = Math.max(...evaluators.map(e => e.assignmentCount), 1);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle className="text-xl">Evaluator Workload Distribution</DialogTitle>
                    <DialogDescription>
                        A detailed breakdown of assignments across all eligible faculty members.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
                    {sortedEvaluators.length > 0 ? (
                        sortedEvaluators.map((evaluator, index) => {
                            const percentageOfMax = (evaluator.assignmentCount / maxAssignments) * 100;
                            const percentageOfTotal = totalProjects > 0
                                ? Math.round((evaluator.assignmentCount / totalProjects) * 100)
                                : 0;

                            return (
                                <div key={evaluator._id} className="p-4 rounded-xl border border-border/50 bg-surface/30 hover:bg-surface/50 transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <UserCircle className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-text">{evaluator.name}</p>
                                                <p className="text-xs text-textSecondary flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {evaluator.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-text">{evaluator.assignmentCount} Projects</p>
                                            <p className="text-[10px] text-textSecondary uppercase font-medium">{percentageOfTotal}% of total load</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] text-textSecondary font-medium">
                                            <span>Workload Balance</span>
                                            <span>{Math.round(percentageOfMax)}% of max potential</span>
                                        </div>
                                        <div className="w-full bg-border/30 rounded-full h-1.5 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentageOfMax}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 }}
                                                className={cn(
                                                    "h-full rounded-full transition-all",
                                                    percentageOfMax > 80 ? "bg-amber-500" : "bg-primary"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-textSecondary">No external evaluators found.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

import { cn } from '../../../../../utils/cn';
