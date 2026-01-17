import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Building2, Calendar, Code, Clock } from 'lucide-react';
import { Project } from '../types';

interface ProjectDetailsModalProps {
    project: Project | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProjectDetailsModal({ project, open, onOpenChange }: ProjectDetailsModalProps) {
    if (!project) return null;

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'IDP': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/50';
            case 'UROP': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/50';
            case 'CAPSTONE': return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-900/50';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] border-none shadow-2xl bg-white dark:bg-slate-900 p-0 overflow-hidden">
                {/* Header Decoration */}
                <div className="h-2 w-full bg-gradient-to-r from-orange-400 to-orange-600" />

                <div className="p-6 space-y-6">
                    {/* Header Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className={`${getTypeColor(project.type)} px-3 py-1 text-sm font-medium border`}>
                                {project.type}
                            </Badge>
                            <span className="text-xs text-slate-400 font-mono">
                                {new Date(project.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                            {project.title}
                        </h2>

                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full">
                                <Building2 className="w-4 h-4 text-orange-500" />
                                <span>{project.department}</span>
                            </div>
                            {project.prerequisites && (
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full">
                                    <Code className="w-4 h-4 text-blue-500" />
                                    <span>{project.prerequisites}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Description */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                            Project Description
                        </h3>
                        <div className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {project.brief}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 flex justify-end">
                        <Button
                            onClick={() => onOpenChange(false)}
                            className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                            Close Details
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
