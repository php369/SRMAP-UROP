import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, Label, Input, Textarea, Badge, NumericStepper, Separator } from "../../../components/ui";
import { Github, FileText, Presentation, ExternalLink, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface SoloGradingModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: any;
    submission: any;
    assessmentType: string;
    maxScore: number;
    onSave: (grade: string, comments: string) => Promise<void>;
    getConvertedScore: (score: number, type: any) => string | number;
}

export const SoloGradingModal = ({
    isOpen,
    onClose,
    student,
    submission,
    assessmentType,
    maxScore,
    onSave,
    getConvertedScore
}: SoloGradingModalProps) => {
    const [grade, setGrade] = useState('');
    const [comments, setComments] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && student && submission) {
            // Initialize from existing evaluation if present
            // Logic depends on the structure of student.evaluation passed in
            // Assuming the parent component passes the "student" object which inside submission.students array
            const typeKey = assessmentType.toLowerCase().replace('-', '') as 'cla1' | 'cla2' | 'cla3';
            // Handle case where evaluation might be in different structure or passed differently
            // For now, assume the parent handles data extraction or we check here
            let savedGrade = '';
            let savedComments = '';

            if (student.evaluation?.internal?.[typeKey]) {
                savedGrade = student.evaluation.internal[typeKey].conduct?.toString() || '';
                savedComments = student.evaluation.internal[typeKey].comments || '';
            }

            setGrade(savedGrade);
            setComments(savedComments);
        }
    }, [isOpen, student, submission, assessmentType]);

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            await onSave(grade, comments);
            onClose();
        } catch (error) {
            console.error("Failed to save grade", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!student || !submission) return null;

    const isValidGrade = grade !== '' && parseFloat(grade) >= 0 && parseFloat(grade) <= maxScore;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">

                {/* Header - Sticky */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 pr-12">
                                {student?.studentName}
                            </DialogTitle>
                            <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" />
                                Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="flex flex-col items-end pr-10">
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 mb-1">
                                {assessmentType}
                            </Badge>
                            <span className="text-xs text-slate-400 font-medium tracking-tight">Max Score: {maxScore}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Project & Submission Info - Scrollable */}
                    <div className="flex-1 p-6 overflow-y-auto border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Project Details</h3>
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm transition-all hover:shadow-md">
                                    <h4 className="font-bold text-base text-slate-800 dark:text-slate-200 mb-1.5 leading-snug">{submission.projectTitle || "Project Title"}</h4>
                                    <Separator className="my-4 opacity-50" />
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {submission.githubLink && (
                                            <a href={submission.githubLink} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1.5 rounded-lg hover:text-amber-600 transition-colors">
                                                <Github className="w-3.5 h-3.5" /> Source Code <ExternalLink className="w-3 h-3 opacity-50" />
                                            </a>
                                        )}
                                        {submission.reportUrl && (
                                            <a href={submission.reportUrl} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1.5 rounded-lg hover:text-amber-600 transition-colors">
                                                <FileText className="w-3.5 h-3.5" /> Project Report <ExternalLink className="w-3 h-3 opacity-50" />
                                            </a>
                                        )}
                                        {submission.presentationUrl && (
                                            <a href={submission.presentationUrl} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1.5 rounded-lg hover:text-amber-600 transition-colors">
                                                <Presentation className="w-3.5 h-3.5" /> Presentation <ExternalLink className="w-3 h-3 opacity-50" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {submission.comments && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Student Remarks</h3>
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20 text-sm text-slate-700 dark:text-slate-300 italic">
                                        "{submission.comments}"
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Grading Form - Fixed */}
                    <div className="w-[400px] flex flex-col bg-white dark:bg-slate-900 h-full">
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">Evaluation</h3>
                                    <Label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                                        Score (0-{maxScore}) <span className="text-red-500 ml-0.5">*</span>
                                    </Label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <div className="relative group">
                                                <NumericStepper
                                                    value={grade}
                                                    onChange={(val) => setGrade(val)}
                                                    min={0}
                                                    max={maxScore}
                                                    step={1}
                                                    className="w-full"
                                                />
                                                <div className="absolute -top-6 right-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
                                                    Max: {maxScore}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-10 w-24 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <span className="text-sm text-slate-500 font-bold">
                                                {isValidGrade && grade ? getConvertedScore(parseFloat(grade), assessmentType) : '--'}
                                            </span>
                                        </div>
                                    </div>
                                    {!isValidGrade && grade !== '' && (
                                        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Grade must be between 0 and {maxScore}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                                        Feedback
                                    </Label>
                                    <Textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        placeholder="Provide constructive feedback..."
                                        className="min-h-[150px] resize-none border-slate-200 focus:border-amber-500 p-4 leading-relaxed"
                                    />
                                    <p className="text-xs text-slate-400 mt-2 text-right">
                                        {comments.length} characters
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <Button
                                onClick={handleSave}
                                disabled={!isValidGrade || isSubmitting}
                                className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                        Saving Grade...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" /> Submit Grade
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
