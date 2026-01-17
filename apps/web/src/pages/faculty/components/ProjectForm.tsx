import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Lock } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../../../components/ui/dialog';
// Assuming we have a Form component wrapper or I'll build standard layouts
// Actually, looking at the file list, I didn't see 'form.tsx', so I will use standard labels and inputs if Form component is missing.
// The file list showed 'label.tsx', 'input.tsx', 'textarea.tsx'. Not 'form.tsx'.
// I will verify if 'form.tsx' exists. If not, I'll use standard controlled inputs.
// Re-checking file list... 'sonner.tsx', 'table.tsx', 'tabs.tsx'. No 'form.tsx'.
// So I will implement the form using standard states and Shadcn presentational components.

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/Badge';

import { Project } from '../types';

interface ProjectFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project?: Project | null;
    onSubmit: (data: any) => Promise<void>;
    loading: boolean;
    userDepartment?: string;
    availableTypes: string[]; // ['IDP', 'UROP', 'CAPSTONE'] based on active windows
    readOnly?: boolean;
}

export function ProjectForm({
    open,
    onOpenChange,
    project,
    onSubmit,
    loading,
    userDepartment,
    availableTypes,
    readOnly = false
}: ProjectFormProps) {
    const [formData, setFormData] = useState({
        title: '',
        brief: '',
        prerequisites: '',
        department: '',
        projectType: 'IDP' as 'IDP' | 'UROP' | 'CAPSTONE'
    });

    useEffect(() => {
        if (project) {
            setFormData({
                title: project.title,
                brief: project.brief,
                prerequisites: project.prerequisites || '',
                department: project.department,
                projectType: project.type
            });
        } else {
            // Reset for new project
            // Default to first available type or IDP
            const defaultType = (availableTypes.length > 0 ? availableTypes[0] : 'IDP') as 'IDP' | 'UROP' | 'CAPSTONE';

            setFormData({
                title: '',
                brief: '',
                prerequisites: '',
                department: userDepartment || '',
                projectType: defaultType
            });
        }
    }, [project, open, userDepartment, availableTypes]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    const isEditing = !!project;
    const projectTypes = ['IDP', 'UROP', 'CAPSTONE'] as const;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] border-orange-100 dark:border-orange-900/20">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        {readOnly ? 'Project Details' : (isEditing ? 'Edit Project' : 'Create New Project')}
                        <Badge variant="outline" className="ml-2 text-xs font-normal border-orange-200 text-orange-700 bg-orange-50">
                            {formData.projectType}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        {readOnly
                            ? 'View project details.'
                            : (isEditing ? 'Make changes to your project proposal here.' : 'Fill in the details to propose a new research project.')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">

                    {/* Project Type Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Type</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {projectTypes.map((type) => {
                                const isAvailable = availableTypes.includes(type);
                                const isDisabled = (isEditing && type !== project?.type) || (!isAvailable && !isEditing) || readOnly;
                                const isSelected = formData.projectType === type;

                                return (
                                    <div
                                        key={type}
                                        onClick={() => !isDisabled && setFormData({ ...formData, projectType: type })}
                                        className={`
                      relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                      ${isSelected
                                                ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
                                                : isDisabled
                                                    ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-600'
                                                    : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/50 text-gray-600 cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                            }
                    `}
                                    >
                                        <span className="font-semibold text-sm">{type}</span>
                                        {!isAvailable && !isEditing && (
                                            <Lock className="w-3 h-3 absolute top-1 right-1 text-gray-300" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {!availableTypes.includes(formData.projectType) && !isEditing && (
                            <div className="flex items-center gap-2 text-amber-600 text-xs mt-1 bg-amber-50 p-2 rounded">
                                <AlertCircle className="w-3 h-3" />
                                <span>Proposal window for {formData.projectType} is currently closed.</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Project Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., AI-Driven Smart Grid Optimization"
                                required
                                maxLength={200}
                                disabled={readOnly}
                                className="focus-visible:ring-orange-500 disabled:opacity-70 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="brief">Brief Description</Label>
                            <Textarea
                                id="brief"
                                value={formData.brief}
                                onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                                placeholder="Describe the project goals, methodology, and expected outcomes..."
                                required
                                rows={5}
                                maxLength={1000}
                                disabled={readOnly}
                                className="focus-visible:ring-orange-500 resize-none disabled:opacity-70 disabled:cursor-not-allowed"
                            />
                            {!readOnly && <p className="text-xs text-gray-400 text-right">{formData.brief.length}/1000</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="department">Department</Label>
                                <Input
                                    id="department"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    required
                                    disabled={readOnly}
                                    className="focus-visible:ring-orange-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="prerequisites">Prerequisites <span className="text-gray-400 font-normal">(Optional)</span></Label>
                                <Input
                                    id="prerequisites"
                                    value={formData.prerequisites}
                                    onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                                    placeholder="e.g. Python, Stats"
                                    disabled={readOnly}
                                    className="focus-visible:ring-orange-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="mt-2 sm:mt-0"
                        >
                            {readOnly ? 'Close' : 'Cancel'}
                        </Button>
                        {!readOnly && (
                            <Button
                                type="submit"
                                disabled={loading || (!isEditing && !availableTypes.includes(formData.projectType))}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {isEditing ? 'Update Project' : 'Create Project'}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
