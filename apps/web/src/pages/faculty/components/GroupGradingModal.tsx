import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, Label, Input, Textarea, Badge, NumericStepper, Separator } from "../../../components/ui";
import { Github, FileText, Presentation, ExternalLink, Calendar, CheckCircle, AlertCircle, Users } from "lucide-react";
import { useState, useEffect } from "react";

interface GroupGradingModalProps {
    isOpen: boolean;
    onClose: () => void;
    submission: any;
    assessmentType: string;
    maxScore: number;
    onSave: (grades: Record<string, string>, comments: string) => Promise<void>;
    getConvertedScore: (score: number, type: any) => string | number;
}

export const GroupGradingModal = ({
    isOpen,
    onClose,
    submission,
    assessmentType,
    maxScore,
    onSave,
    getConvertedScore
}: GroupGradingModalProps) => {
    const [studentGrades, setStudentGrades] = useState<Record<string, string>>({});
    const [comments, setComments] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && submission && submission.students) {
            // Initialize grades
            const typeKey = assessmentType.toLowerCase().replace('-', '') as 'cla1' | 'cla2' | 'cla3';
            const initialGrades: Record<string, string> = {};

            // Check if there are existing comments (assuming same comment for group usually, or take first)
            let existingComment = '';

            submission.students.forEach((student: any) => {
                if (student.evaluation?.internal?.[typeKey]) {
                    initialGrades[student.studentId] = student.evaluation.internal[typeKey].conduct?.toString() || '';
                    if (!existingComment && student.evaluation.internal[typeKey].comments) {
                        existingComment = student.evaluation.internal[typeKey].comments;
                    }
                }
            });

            setStudentGrades(initialGrades);
            setComments(existingComment);
        }
    }, [isOpen, submission, assessmentType]);

    const handleGradeChange = (studentId: string, value: string) => {
        setStudentGrades(prev => ({
            ...prev,
            [studentId]: value
        }));
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            await onSave(studentGrades, comments);
            onClose();
        } catch (error) {
            console.error("Failed to save group grades", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!submission) return null;

    // Validation: Check if all students have a grade entered and if they are valid
    const allStudentsGraded = submission.students?.every((s: any) => studentGrades[s.studentId] !== '');
    const areAllGradesValid = Object.values(studentGrades).every(g => {
        if (g === '') return false; // Enforce filled grades
        const num = parseFloat(g);
        return !isNaN(num) && num >= 0 && num <= maxScore;
    });

    const isReadyToSubmit = allStudentsGraded && areAllGradesValid;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">

                {/* Header - Sticky */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 pr-12">
                                {submission.groupId ? `Group ${submission.groupId.groupCode}` : 'Group Submission'}
                                <Badge variant="secondary" className="font-normal text-xs flex items-center gap-1 bg-slate-100 text-slate-600 border-slate-200">
                                    <Users className="w-3 h-3" /> {submission.students?.length} Members
                                </Badge>
                            </DialogTitle>
                            <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" />
                                Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="flex flex-col items-end pr-10">
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 mb-1">
                                {assessmentType} - Group Grading
                            </Badge>
                            <span className="text-xs text-slate-400 font-medium tracking-tight">Max Score: {maxScore}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Project & Submission Info - Scrollable */}
                    <div className="w-1/3 p-6 overflow-y-auto border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Project Details</h3>
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm transition-all hover:shadow-md">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5 leading-snug">{submission.projectTitle || "Project Title"}</h4>
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
                                                <FileText className="w-3.5 h-3.5" /> Report <ExternalLink className="w-3 h-3 opacity-50" />
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
                    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 h-full">
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">Student Grades</h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            // Copy first grade to all
                                            const firstGrade = Object.values(studentGrades).find(v => v !== '');
                                            if (firstGrade) {
                                                const newGrades = { ...studentGrades };
                                                submission.students.forEach((s: any) => newGrades[s.studentId] = firstGrade);
                                                setStudentGrades(newGrades);
                                            }
                                        }}
                                        className="text-xs h-8"
                                    >
                                        Distribute First Grade
                                    </Button>
                                </div>

                                <div className="grid gap-3">
                                    {submission.students?.map((student: any) => {
                                        const grade = studentGrades[student.studentId] || '';
                                        const numGrade = parseFloat(grade);
                                        const isValid = grade === '' || (!isNaN(numGrade) && numGrade >= 0 && numGrade <= maxScore);

                                        return (
                                            <div key={student.studentId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-300 transition-colors">
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-900 dark:text-white">{student.studentName}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{student.studentId}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right w-24">
                                                        <span className="text-sm text-slate-500 font-medium">
                                                            {isValid && grade ? (
                                                                <span className="text-amber-600 dark:text-amber-400">
                                                                    {getConvertedScore(parseFloat(grade), assessmentType)}
                                                                </span>
                                                            ) : '--'}
                                                        </span>
                                                    </div>
                                                    <div className="w-32 relative">
                                                        <NumericStepper
                                                            value={grade}
                                                            onChange={(val) => handleGradeChange(student.studentId, val)}
                                                            min={0}
                                                            max={maxScore}
                                                            step={0.5}
                                                            size="sm"
                                                            className="w-full"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <Label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                                        Group Feedback
                                    </Label>
                                    <Textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        placeholder="Provide feedback for the entire group..."
                                        className="min-h-[100px] resize-none border-slate-200 focus:border-amber-500 p-4"
                                    />
                                    <p className="text-xs text-slate-400 mt-2">
                                        This comment will be applied to all students in the group.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <Button
                                onClick={handleSave}
                                disabled={!isReadyToSubmit || isSubmitting}
                                className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                        Saving Grades...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" /> Submit Grades
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
