import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Layers, Calendar, ClipboardList, AlertCircle, FolderOpen } from 'lucide-react';
import { ProjectType, WindowForm, Window } from './types';
import { DateRangePickerField } from '../../../components/ui/CompactDateRangePicker';
import toast from 'react-hot-toast';
import { api } from '@/utils/api';
import { parseZonedDateTime, getLocalTimeZone, now } from '@internationalized/date';
import { ConflictWarningModal } from './components/Modals/ConflictWarningModal';

// Color Palette defined by user
const PHASE_COLORS = {
    PROPOSAL: '#EA580C',      // Orange
    APPLICATION: '#14B8A6',   // Teal
    CLA_THEME: '#7C3AED',     // Violet (for step headers)
    CLA_SUBMISSION: '#7C3AED',// Violet
    CLA_ASSESSMENT: '#F59E0B',// Amber
    GRADE_RELEASE: '#50C878'  // Emerald
};

// Steps configuration with colors
const WIZARD_STEPS = [
    { id: 'project-type', label: 'Project Type', icon: Layers, description: 'Select the academic project type', color: '#334155' }, // Slate-700
    { id: 'proposal', label: 'Proposal Phase', icon: FolderOpen, description: 'Set proposal submission dates', color: PHASE_COLORS.PROPOSAL },
    { id: 'application', label: 'Application Phase', icon: Calendar, description: 'Set student application dates', color: PHASE_COLORS.APPLICATION },
    { id: 'cla-1', label: 'CLA-1 Cycle', icon: ClipboardList, description: 'First continuous assessment', color: PHASE_COLORS.CLA_THEME },
    { id: 'cla-2', label: 'CLA-2 Cycle', icon: ClipboardList, description: 'Second continuous assessment', color: PHASE_COLORS.CLA_THEME },
    { id: 'cla-3', label: 'CLA-3 Cycle', icon: ClipboardList, description: 'Final continuous assessment', color: PHASE_COLORS.CLA_THEME },
    { id: 'external', label: 'External Review', icon: ClipboardList, description: 'External evaluator assessment', color: PHASE_COLORS.CLA_THEME },
    { id: 'grade-release', label: 'Grade Release', icon: Calendar, description: 'Final grade publication', color: PHASE_COLORS.GRADE_RELEASE },
    { id: 'preview', label: 'Preview Plan', icon: CheckCircle2, description: 'Review and confirm schedule', color: '#334155' },
];


// Helper: Generate default dates starting from tomorrow
// Each phase is 5 days, and starts the day after the previous phase ends.
// All times default to 9:00 AM - 9:00 PM
const generateDefaultDates = () => {
    const formatDateTime = (date: Date, hour: number) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T${String(hour).padStart(2, '0')}:00:00`;
    };

    const addDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };

    const tomorrow = addDays(new Date(), 1);

    // Proposal: Tomorrow to +5 days
    const proposalStart = tomorrow;
    const proposalEnd = addDays(proposalStart, 5);

    // Application: Day after proposal ends, +5 days
    const applicationStart = addDays(proposalEnd, 1);
    const applicationEnd = addDays(applicationStart, 5);

    // CLA-1 Submission: Day after application ends, +5 days
    const cla1SubStart = addDays(applicationEnd, 1);
    const cla1SubEnd = addDays(cla1SubStart, 5);
    // CLA-1 Assessment: Day after submission ends, +5 days
    const cla1AssStart = addDays(cla1SubEnd, 1);
    const cla1AssEnd = addDays(cla1AssStart, 5);

    // CLA-2
    const cla2SubStart = addDays(cla1AssEnd, 1);
    const cla2SubEnd = addDays(cla2SubStart, 5);
    const cla2AssStart = addDays(cla2SubEnd, 1);
    const cla2AssEnd = addDays(cla2AssStart, 5);

    // CLA-3
    const cla3SubStart = addDays(cla2AssEnd, 1);
    const cla3SubEnd = addDays(cla3SubStart, 5);
    const cla3AssStart = addDays(cla3SubEnd, 1);
    const cla3AssEnd = addDays(cla3AssStart, 5);

    // External
    const extSubStart = addDays(cla3AssEnd, 1);
    const extSubEnd = addDays(extSubStart, 5);
    const extAssStart = addDays(extSubEnd, 1);
    const extAssEnd = addDays(extAssStart, 5);

    // Grade Release
    const gradeStart = addDays(extAssEnd, 1);
    const gradeEnd = addDays(gradeStart, 5);

    return {
        proposal: {
            startDate: formatDateTime(proposalStart, 9),
            endDate: formatDateTime(proposalEnd, 21)
        },
        application: {
            startDate: formatDateTime(applicationStart, 9),
            endDate: formatDateTime(applicationEnd, 21)
        },
        cla1: {
            submissionStart: formatDateTime(cla1SubStart, 9),
            submissionEnd: formatDateTime(cla1SubEnd, 21),
            assessmentStart: formatDateTime(cla1AssStart, 9),
            assessmentEnd: formatDateTime(cla1AssEnd, 21)
        },
        cla2: {
            submissionStart: formatDateTime(cla2SubStart, 9),
            submissionEnd: formatDateTime(cla2SubEnd, 21),
            assessmentStart: formatDateTime(cla2AssStart, 9),
            assessmentEnd: formatDateTime(cla2AssEnd, 21)
        },
        cla3: {
            submissionStart: formatDateTime(cla3SubStart, 9),
            submissionEnd: formatDateTime(cla3SubEnd, 21),
            assessmentStart: formatDateTime(cla3AssStart, 9),
            assessmentEnd: formatDateTime(cla3AssEnd, 21)
        },
        external: {
            submissionStart: formatDateTime(extSubStart, 9),
            submissionEnd: formatDateTime(extSubEnd, 21),
            assessmentStart: formatDateTime(extAssStart, 9),
            assessmentEnd: formatDateTime(extAssEnd, 21)
        },
        gradeRelease: {
            startDate: formatDateTime(gradeStart, 9),
            endDate: formatDateTime(gradeEnd, 21)
        }
    };
};

const createInitialForm = (): WindowForm => ({
    windowTypes: [],
    projectTypes: [],
    assessmentType: '',
    startDate: '',
    endDate: '',
    useCommonDates: true,
    individualDates: {},
    bulkSettings: generateDefaultDates()
});

export function SemesterPlanWizardPage() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [maxStepReached, setMaxStepReached] = useState(0); // Track progress
    const [selectedProjectType, setSelectedProjectType] = useState<ProjectType | ''>('');
    const [form, setForm] = useState<WindowForm>(createInitialForm());
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showConflictModal, setShowConflictModal] = useState(false);

    // Helper: Format date from DatePicker
    const handleDateChange = (phase: string, startKey: string, endKey: string, val: { start: string, end: string }) => {
        setForm(prev => ({
            ...prev,
            bulkSettings: {
                ...prev.bulkSettings,
                [phase]: {
                    ...prev.bulkSettings[phase as keyof typeof prev.bulkSettings],
                    [startKey]: val.start,
                    [endKey]: val.end
                }
            }
        }));
        // Clear errors for this step on change
        setErrors({});
    };

    // --- NEW HELPERS FOR PICKER LOGIC ---

    // 1. ZonedDateTime Helper
    const toZoned = (isoStr?: string) => {
        if (!isoStr) return now(getLocalTimeZone());
        try {
            // Remove Z, remove offset if any, then append our fixed timezone logic (same as in picker)
            const cleanStr = isoStr.replace('Z', '').replace(/\+.*$/, '');
            return parseZonedDateTime(`${cleanStr}[Asia/Kolkata]`);
        } catch (e) {
            return now(getLocalTimeZone());
        }
    };

    // 2. Dynamic Min Value Calculation
    const getMinValueForStep = (currentStepId: string, currentFieldType?: 'submission' | 'assessment') => {
        const s = form.bulkSettings;
        const _now = now(getLocalTimeZone());

        // Helper to add a small buffer (e.g. 1 minute) to avoid "Time is in past" edge cases
        const buffer = (dateZoned: any) => dateZoned.add({ minutes: 1 });

        switch (currentStepId) {
            case 'proposal':
                return _now; // Start from now

            case 'application':
                // Starts after Proposal Ends
                if (s.proposal.endDate) return buffer(toZoned(s.proposal.endDate));
                return _now;

            case 'cla-1':
                if (currentFieldType === 'submission') {
                    // Submission starts after Application ends
                    if (s.application.endDate) return buffer(toZoned(s.application.endDate));
                } else if (currentFieldType === 'assessment') {
                    // Assessment starts after Submission ends
                    if (s.cla1.submissionEnd) return buffer(toZoned(s.cla1.submissionEnd));
                }
                return _now;

            case 'cla-2':
                if (currentFieldType === 'submission') {
                    // Starts after CLA-1 Assessment ends
                    if (s.cla1.assessmentEnd) return buffer(toZoned(s.cla1.assessmentEnd));
                } else if (currentFieldType === 'assessment') {
                    if (s.cla2.submissionEnd) return buffer(toZoned(s.cla2.submissionEnd));
                }
                return _now;

            case 'cla-3':
                if (currentFieldType === 'submission') {
                    if (s.cla2.assessmentEnd) return buffer(toZoned(s.cla2.assessmentEnd));
                } else if (currentFieldType === 'assessment') {
                    if (s.cla3.submissionEnd) return buffer(toZoned(s.cla3.submissionEnd));
                }
                return _now;

            case 'external':
                if (currentFieldType === 'submission') {
                    // External submission starts after CLA-3 Assessment
                    if (s.cla3.assessmentEnd) return buffer(toZoned(s.cla3.assessmentEnd));
                } else if (currentFieldType === 'assessment') {
                    if (s.external.submissionEnd) return buffer(toZoned(s.external.submissionEnd));
                }
                return _now;

            case 'grade-release':
                // Starts after External Assessment ends
                if (s.external.assessmentEnd) return buffer(toZoned(s.external.assessmentEnd));
                return _now;

            default: return _now;
        }
    };

    // 3. Render the Display Field (Read-only text box)
    // const renderDateDisplay = (startStr?: string, endStr?: string, label?: string) => {
    //     const hasValues = startStr && endStr;

    //     const formatDateFancy = (str: string) => {
    //         try {
    //             return format(new Date(str), "MMM dd, hh:mm a");
    //         } catch (e) { return str; }
    //     };

    //     return (
    //         <div className="flex-1">
    //             {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">{label}</label>}
    //             <div className={`
    //                 flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all
    //                 ${hasValues
    //                     ? 'bg-white border-slate-200 shadow-sm'
    //                     : 'bg-slate-50/50 border-slate-200/60 border-dashed'}
    //             `}>
    //                 {hasValues ? (
    //                     <>
    //                         <div className="flex flex-col">
    //                             <span className="text-xs text-slate-400 font-medium mb-0.5">Start</span>
    //                             <span className="text-sm font-semibold text-slate-900 font-mono">
    //                                 {formatDateFancy(startStr)}
    //                             </span>
    //                         </div>
    //                         <div className="h-8 w-[1px] bg-slate-100 mx-4" />
    //                         <div className="flex flex-col text-right">
    //                             <span className="text-xs text-slate-400 font-medium mb-0.5">End</span>
    //                             <span className="text-sm font-semibold text-slate-900 font-mono">
    //                                 {formatDateFancy(endStr)}
    //                             </span>
    //                         </div>
    //                     </>
    //                 ) : (
    //                     <span className="text-sm text-slate-400 italic">Select dates via calendar...</span>
    //                 )}
    //             </div>
    //         </div>
    //     );
    // };

    // Validation Logic
    const validateStep = (stepIndex: number): boolean => {
        const step = WIZARD_STEPS[stepIndex];
        const newErrors: Record<string, string> = {};

        // 1. Project Type
        if (step.id === 'project-type') {
            if (!selectedProjectType) {
                newErrors['projectType'] = "Please select a project type.";
                setErrors(newErrors);
                toast.error("Please select a project type");
                return false;
            }
            return true;
        }

        const settings = form.bulkSettings;

        // Helper to check valid range (Start < End)
        const isValidRange = (start?: string, end?: string) => {
            if (!start || !end) return false;
            return new Date(start) < new Date(end);
        };

        // 2. Proposal
        if (step.id === 'proposal') {
            const { startDate, endDate } = settings.proposal;
            if (!startDate || !endDate) {
                newErrors['proposal'] = "Both start and end dates are required.";
            } else if (!isValidRange(startDate, endDate)) {
                newErrors['proposal'] = "End date must be after start date.";
            }
        }

        // 3. Application
        else if (step.id === 'application') {
            const { startDate, endDate } = settings.application;
            if (!startDate || !endDate) {
                newErrors['application'] = "Both start and end dates are required.";
            } else if (!isValidRange(startDate, endDate)) {
                newErrors['application'] = "End date must be after start date.";
            } else {
                // Ensure Application starts AFTER Proposal ends (STRICT enforcement)
                const proposalEnd = settings.proposal.endDate;
                if (proposalEnd && new Date(startDate) < new Date(proposalEnd)) {
                    newErrors['application'] = "Application phase must start after Proposal phase ends.";
                }
            }
        }

        // 4, 5, 6, 7. Cycles (CLA1, CLA2, CLA3, External)
        else if (['cla-1', 'cla-2', 'cla-3', 'external'].includes(step.id)) {
            const key = step.id.replace('-', '') as 'cla1' | 'cla2' | 'cla3' | 'external';
            const data = settings[key];

            // Validate Submission dates
            if (!data.submissionStart || !data.submissionEnd) {
                newErrors['submission'] = "Submission window dates are required.";
            } else if (!isValidRange(data.submissionStart, data.submissionEnd)) {
                newErrors['submission'] = "Submission End must be after Start.";
            } else {
                // Validate submission starts after previous phase ends
                let previousEndDate: string | undefined;
                let previousPhaseName = '';

                if (step.id === 'cla-1') {
                    previousEndDate = settings.application.endDate;
                    previousPhaseName = 'Application phase';
                } else if (step.id === 'cla-2') {
                    previousEndDate = settings.cla1.assessmentEnd;
                    previousPhaseName = 'CLA-1 Assessment';
                } else if (step.id === 'cla-3') {
                    previousEndDate = settings.cla2.assessmentEnd;
                    previousPhaseName = 'CLA-2 Assessment';
                } else if (step.id === 'external') {
                    previousEndDate = settings.cla3.assessmentEnd;
                    previousPhaseName = 'CLA-3 Assessment';
                }

                if (previousEndDate && new Date(data.submissionStart) < new Date(previousEndDate)) {
                    newErrors['submission'] = `Submission must start after ${previousPhaseName} ends.`;
                }
            }

            // Validate Assessment dates
            if (!data.assessmentStart || !data.assessmentEnd) {
                newErrors['assessment'] = "Assessment window dates are required.";
            } else if (!isValidRange(data.assessmentStart, data.assessmentEnd)) {
                newErrors['assessment'] = "Assessment End must be after Start.";
            } else {
                // Assessment must start after Submission ends (STRICT enforcement)
                if (data.submissionEnd && new Date(data.assessmentStart) < new Date(data.submissionEnd)) {
                    newErrors['assessment'] = "Assessment must start after Submission ends.";
                }
            }
        }

        // 8. Grade Release
        else if (step.id === 'grade-release') {
            const { startDate, endDate } = settings.gradeRelease;
            if (!startDate || !endDate) {
                newErrors['gradeRelease'] = "Grade release dates are required.";
            } else if (!isValidRange(startDate, endDate)) {
                newErrors['gradeRelease'] = "End date must be after start date.";
            } else {
                // Grade Release must start after External Assessment ends
                const externalAssessmentEnd = settings.external.assessmentEnd;
                if (externalAssessmentEnd && new Date(startDate) < new Date(externalAssessmentEnd)) {
                    newErrors['gradeRelease'] = "Grade Release must start after External Review Assessment ends.";
                }
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fix all errors before proceeding.");
            return false;
        }

        return true;
    };


    const handleNext = () => {
        if (validateStep(currentStep)) {
            if (currentStep < WIZARD_STEPS.length - 1) {
                const nextStep = currentStep + 1;
                setCurrentStep(nextStep);
                // Update max reached
                if (nextStep > maxStepReached) {
                    setMaxStepReached(nextStep);
                }
            } else {
                handleSubmit();
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        } else {
            navigate('/dashboard/control/windows');
        }
    };

    const handleStepClick = (index: number) => {
        // STRICT Sidebar Validation:
        // Do not allow jumping forward if the current step is invalid
        if (index > currentStep) {
            // Check if current step is valid before allowing move
            if (!validateStep(currentStep)) {
                // validateStep triggers the error state and toast
                return;
            }
            // Also ensure we don't jump past maxStepReached + 1 (progressive disclosure)
            if (index > maxStepReached && index > currentStep + 1) {
                return;
            }
        }

        // Allow backward navigation freely
        if (index <= maxStepReached || (index === currentStep + 1 && validateStep(currentStep))) {
            setCurrentStep(index);
        }
    };

    const handleSubmit = async () => {
        if (!selectedProjectType) return;

        // 1. Conflict Check before submission
        setLoading(true);
        try {
            // Check if windows already exist for this type
            // Note: API might return all windows, so we strictly filter client-side to be safe
            const response = await api.get('/control/windows') as { success: boolean, data: Window[] };

            if (response.success && Array.isArray(response.data)) {
                const conflictingWindows = response.data.filter((w: any) =>
                    w.projectType === selectedProjectType
                );

                if (conflictingWindows.length > 0) {
                    // Conflict found!
                    setShowConflictModal(true);
                    setLoading(false);
                    return;
                }
            }

            // 2. Proceed with creation if no conflict
            await api.post('/windows/bulk', {
                projectType: selectedProjectType,
                settings: form.bulkSettings
            });
            toast.success("Semester plan created successfully!");
            navigate('/dashboard/control/windows');
        } catch (error) {
            console.error(error);
            // If api.get fails, it might mean no windows or network error. 
            // In a real app we'd handle 404 vs 500. Assuming empty array return for no results.
            toast.error("Failed to create semester plan");
        } finally {
            setLoading(false);
        }
    };

    // Helper component for Preview Phase timeline items
    const TimelineItem = ({ label, dateRange, color }: { label: string, dateRange: any, color?: string }) => {
        // Use generic border/bg styles driven by the color prop via inline styles for specific colors
        const dotStyle = { backgroundColor: color ? `${color}20` : undefined, borderColor: color };
        const borderStyle = { borderColor: color ? `${color}40` : undefined }; // lighter border
        const formatDate = (dateStr?: string) => {
            if (!dateStr) return 'Not Set';
            return new Date(dateStr).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            });
        };

        return (
            <div className={`pl-4 border-l-2 ml-2 relative pb-6 last:pb-0`} style={borderStyle}>
                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-white`} style={dotStyle} />
                <div>
                    <h4 className="font-medium text-slate-900 text-sm">{label}</h4>
                    {'startDate' in dateRange ? (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {formatDate(dateRange.startDate)}
                            </span>
                            <span className="text-xs text-slate-400">to</span>
                            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {formatDate(dateRange.endDate)}
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-2 mt-2">
                            {/* Submission Window - stacked with from-to inline */}
                            {(dateRange.submissionStart || dateRange.submissionEnd) && (
                                <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide block mb-1.5">Submission</span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                                            {formatDate(dateRange.submissionStart)}
                                        </span>
                                        <span className="text-xs text-slate-400">→</span>
                                        <span className="text-xs font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                                            {formatDate(dateRange.submissionEnd)}
                                        </span>
                                    </div>
                                </div>
                            )}
                            {/* Assessment Window - stacked with from-to inline */}
                            {(dateRange.assessmentStart || dateRange.assessmentEnd) && (
                                <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide block mb-1.5">Assessment</span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-amber-200">
                                            {formatDate(dateRange.assessmentStart)}
                                        </span>
                                        <span className="text-xs text-slate-400">→</span>
                                        <span className="text-xs font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-amber-200">
                                            {formatDate(dateRange.assessmentEnd)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderStepContent = () => {
        const step = WIZARD_STEPS[currentStep];

        // 1. Project Type Selection
        if (step.id === 'project-type') {
            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid md:grid-cols-3 gap-4">
                        {(['IDP', 'UROP', 'CAPSTONE'] as ProjectType[]).map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedProjectType(type)}
                                className={`
                                    relative p-6 rounded-xl border-2 text-left transition-all duration-200
                                    ${selectedProjectType === type
                                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/10'
                                        : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                                    }
                                `}
                            >
                                <div className="flex flex-col gap-3">
                                    <div className={`p-3 rounded-lg w-fit transition-colors ${selectedProjectType === type ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                        <Layers className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">{type}</h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {type === 'IDP' && 'Interdisciplinary Project'}
                                            {type === 'UROP' && 'Undergraduate Research'}
                                            {type === 'CAPSTONE' && 'Capstone Project'}
                                        </p>
                                    </div>
                                </div>
                                {selectedProjectType === type && (
                                    <div className="absolute top-4 right-4 text-slate-900">
                                        <CheckCircle2 className="w-6 h-6 fill-slate-900 text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    {errors['projectType'] && (
                        <p className="text-sm text-red-600 flex items-center gap-2 mt-2">
                            <AlertCircle className="w-4 h-4" /> {errors['projectType']}
                        </p>
                    )}
                </div>
            );
        }

        // 2. Linear Phases (Proposal, Application, Grade Release)
        if (['proposal', 'application', 'grade-release'].includes(step.id)) {
            const phaseKey = step.id === 'grade-release' ? 'gradeRelease' : step.id;
            const settings = form.bulkSettings[phaseKey as keyof typeof form.bulkSettings] as any;

            return (
                <div className="max-w-xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 relative overflow-hidden">
                        {/* Colored accent line */}
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: step.color }} />
                        <DateRangePickerField
                            label="Duration"
                            value={settings.startDate ? { start: settings.startDate, end: settings.endDate } : null}
                            onChange={(val) => handleDateChange(phaseKey, 'startDate', 'endDate', val)}
                            isRequired
                            errorMessage={errors[phaseKey]}
                            minValue={getMinValueForStep(step.id)}
                            color={step.color}
                        />
                    </div>
                </div>
            );
        }

        // 3. Cycle Phases (CLA-1, CLA-2, CLA-3, External)
        if (['cla-1', 'cla-2', 'cla-3', 'external'].includes(step.id)) {
            const phaseKey = step.id.replace('-', '');
            const settings = form.bulkSettings[phaseKey as keyof typeof form.bulkSettings] as any;

            return (
                <div className="max-w-xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* Submission Window */}
                    <div className="bg-slate-50/30 p-6 rounded-xl border border-slate-200/60 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: PHASE_COLORS.CLA_SUBMISSION }} />
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg text-white" style={{ backgroundColor: PHASE_COLORS.CLA_SUBMISSION }}>
                                <Calendar className="w-5 h-5" />
                            </div>
                            <h4 className="font-semibold text-slate-900">Submission Window</h4>
                        </div>

                        <DateRangePickerField
                            label="Submission Period"
                            value={settings.submissionStart ? { start: settings.submissionStart, end: settings.submissionEnd } : null}
                            onChange={(val) => handleDateChange(phaseKey, 'submissionStart', 'submissionEnd', val)}
                            isRequired
                            errorMessage={errors['submission']}
                            minValue={getMinValueForStep(step.id, 'submission')}
                        />
                    </div>

                    {/* Assessment Window */}
                    <div className="bg-amber-50/30 p-6 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                                <ClipboardList className="w-5 h-5" />
                            </div>
                            <h4 className="font-semibold text-slate-900">Assessment Window</h4>
                        </div>

                        <DateRangePickerField
                            label="Assessment Period"
                            value={settings.assessmentStart ? { start: settings.assessmentStart, end: settings.assessmentEnd } : null}
                            onChange={(val) => handleDateChange(phaseKey, 'assessmentStart', 'assessmentEnd', val)}
                            isRequired
                            errorMessage={errors['assessment']}
                            minValue={getMinValueForStep(step.id, 'assessment')}
                            color={PHASE_COLORS.CLA_ASSESSMENT}
                        />
                    </div>
                </div>
            );
        }

        // 4. Preview Phase
        if (step.id === 'preview') {
            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                    <div
                        className="flex-1 overflow-y-auto pr-2 space-y-4"
                        data-lenis-prevent
                    >
                        <TimelineItem label="Proposal Phase" dateRange={form.bulkSettings.proposal} color={PHASE_COLORS.PROPOSAL} />
                        <TimelineItem label="Application Phase" dateRange={form.bulkSettings.application} color={PHASE_COLORS.APPLICATION} />
                        <TimelineItem label="CLA-1 Cycle" dateRange={form.bulkSettings.cla1} color={PHASE_COLORS.CLA_THEME} />
                        <TimelineItem label="CLA-2 Cycle" dateRange={form.bulkSettings.cla2} color={PHASE_COLORS.CLA_THEME} />
                        <TimelineItem label="CLA-3 Cycle" dateRange={form.bulkSettings.cla3} color={PHASE_COLORS.CLA_THEME} />
                        <TimelineItem label="External Review" dateRange={form.bulkSettings.external} color={PHASE_COLORS.CLA_THEME} />
                        <TimelineItem label="Grade Release" dateRange={form.bulkSettings.gradeRelease} color={PHASE_COLORS.GRADE_RELEASE} />
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-8 max-w-7xl mx-auto p-6 md:p-8 overflow-hidden">

            {/* Sidebar Stepper */}
            <div
                className="w-full md:w-80 flex-shrink-0 flex flex-col h-full overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                data-lenis-prevent
            >
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Semester Plan</h1>
                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                        Configure the entire semester schedule for a project type in sequence.
                    </p>
                </div>

                <div className="space-y-1 relative flex-1">
                    {/* Vertical Line */}
                    <div className="absolute left-6 top-4 bottom-8 w-0.5 bg-slate-100" />

                    {WIZARD_STEPS.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = currentStep === index;
                        const isCompleted = index < currentStep;
                        const showColor = isActive || isCompleted;

                        return (
                            <button
                                key={step.id}
                                onClick={() => handleStepClick(index)}
                                className={`
                                                relative flex items-center gap-4 w-full p-3 rounded-xl transition-all duration-200 text-left group
                                                ${isActive ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-slate-50'}
                                                ${isCompleted ? 'opacity-100' : isActive ? 'opacity-100' : 'opacity-60'}
                                            `}
                            >
                                <div
                                    className={`
                                                    w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300
                                                    ${isActive ? 'shadow-md scale-105' : ''}
                                                    ${!showColor ? 'bg-slate-100 text-slate-400' : ''}
                                                `}
                                    style={showColor ? { backgroundColor: step.color, color: 'white' } : {}}
                                >
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={`font-semibold text-sm ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                                        {step.label}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {step.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            {WIZARD_STEPS[currentStep].label}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Step {currentStep + 1} of {WIZARD_STEPS.length}
                        </p>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Project</p>
                        <p className="text-sm font-medium text-slate-900">{selectedProjectType || 'Not Selected'}</p>
                    </div>
                </div>

                {/* Step Body - Scrollable Area */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    {renderStepContent()}
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
                    <button
                        onClick={handleBack}
                        className="px-6 py-2.5 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                    >
                        {currentStep === 0 ? 'Cancel' : 'Back'}
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={loading}
                        className={`
                            group flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium shadow-sm transition-all
                            ${currentStep === WIZARD_STEPS.length - 1
                                ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-600/20'
                                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        {loading ? 'Processing...' : (
                            currentStep === WIZARD_STEPS.length - 1 ? 'Create Schedule' : 'Next Step'
                        )}
                        {!loading && currentStep < WIZARD_STEPS.length - 1 && (
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        )}
                    </button>
                </div>
            </div>

            {/* Conflict Warning Modal */}
            <ConflictWarningModal
                isOpen={showConflictModal}
                onClose={() => setShowConflictModal(false)}
                projectType={selectedProjectType as string}
            />
        </div>
    );
}
