import {
    Edit2,
    Trash2,
    Clock,
    Eye,
    CheckCircle,
    Building2,
    Calendar,
    Code
} from 'lucide-react';
import { Project } from '../types';
import { Card, CardContent, CardFooter, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
// Need to check if tooltip exists. If not, title attribute.

interface ProjectCardProps {
    project: Project;
    onEdit: (project: Project) => void;
    onDelete: (projectId: string) => void;
    onView: (project: Project) => void;
    isProposalOpen: boolean;
}

export function ProjectCard({ project, onEdit, onDelete, onView, isProposalOpen }: ProjectCardProps) {



    const getStatusBadge = (status: string) => {
        const config = {
            draft: {
                icon: Clock,
                className: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
                label: 'Draft'
            },
            published: {
                icon: Eye,
                className: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900',
                label: 'Published'
            },
            frozen: {
                icon: Clock,
                className: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900',
                label: 'Frozen'
            },
            assigned: {
                icon: CheckCircle,
                className: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900',
                label: 'Assigned'
            }
        };

        const style = config[status as keyof typeof config] || config.draft;
        const Icon = style.icon;

        return (
            <Badge variant="outline" className={`${style.className} gap-1.5 py-1 px-2.5 transition-colors`}>
                <Icon className="w-3.5 h-3.5" />
                {style.label}
            </Badge>
        );
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'IDP': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/50';
            case 'UROP': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/50';
            case 'CAPSTONE': return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-900/50';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const isEditable = project.status !== 'assigned' && isProposalOpen;
    const isDeletable = project.status !== 'assigned' && isProposalOpen;

    return (
        <Card className="group relative overflow-hidden border transition-all hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-900/30">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-0 transition-opacity group-hover:opacity-100" />

            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex flex-col space-y-2 w-full">
                    <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border border-transparent ${getTypeColor(project.type)}`}>
                            {project.type}
                        </span>
                        {getStatusBadge(project.status)}
                    </div>
                    <h3 className="font-bold text-lg leading-tight text-slate-900 dark:text-slate-100 line-clamp-2">
                        {project.title}
                    </h3>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 pb-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 h-[60px] leading-[20px] overflow-hidden">
                    {project.brief}
                </p>

                <div className="flex flex-col gap-2 pt-2 text-xs text-slate-500 dark:text-slate-500">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{project.department}</span>
                    </div>

                    {project.prerequisites && (
                        <div className="flex items-center gap-2">
                            <Code className="w-3.5 h-3.5" />
                            <span className="line-clamp-1" title={project.prerequisites}>
                                Req: {project.prerequisites}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </CardContent>

            <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />

            <CardFooter className="flex justify-end items-center py-3 bg-slate-50/50 dark:bg-slate-900/20 gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => onView(project)}
                    title="View Details"
                >
                    <Eye className="w-4 h-4" />
                </Button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:text-orange-600 hover:bg-orange-50"
                    onClick={() => onEdit(project)}
                    disabled={!isEditable}
                    title={!isProposalOpen ? 'Window Closed' : 'Edit Project'}
                >
                    <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(project._id)}
                    disabled={!isDeletable}
                    title={!isProposalOpen ? 'Window Closed' : 'Delete Project'}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
