import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Layers, Calendar, ClipboardList, AlertCircle, FolderOpen, FileText, Check } from 'lucide-react';
import { ProjectType, WindowForm, WindowType, AssessmentType, Window } from './types';
import { DateRangePickerField } from '../../../components/ui/CompactDateRangePicker';
import { toast } from 'sonner';
import { useWindowManagement } from './hooks/useWindowManagement';
import { now, getLocalTimeZone, parseZonedDateTime } from '@internationalized/date';
import { ConflictWarningModal } from './components/Modals/ConflictWarningModal';

import { WizardSkeleton } from './components/LoadingSkeletons';

// --- CONSTANTS & CONFIG ---

const PHASE_COLORS = {
    PROPOSAL: '#EA580C',      // Orange
    APPLICATION: '#14B8A6',   // Teal
    CLA_THEME: '#7C3AED',     // Violet (for step headers)
    CLA_SUBMISSION: '#7C3AED',// Violet
    CLA_ASSESSMENT: '#F59E0B',// Amber
    GRADE_RELEASE: '#50C878', // Emerald
    NEUTRAL: '#334155'
};

const WIZARD_STEPS = [
    { id: 'project-type', label: 'Project Type', icon: Layers, description: 'Select the academic project type', color: '#334155' },
    { id: 'window-type', label: 'Window Category', icon: FolderOpen, description: 'Select the type of window', color: '#334155' },
    { id: 'dates', label: 'Duration', icon: Calendar, description: 'Set window start and end dates', color: '#334155' },
    { id: 'preview', label: 'Preview', icon: CheckCircle2, description: 'Review and confirm', color: '#334155' },
];

// Define the strict chronological order of phases for validation
const CHRONOLOGICAL_PHASES = [
    { key: 'proposal', windowType: 'proposal' as WindowType },
    { key: 'application', windowType: 'application' as WindowType },
    { key: 'cla1_sub', windowType: 'submission' as WindowType, assessmentType: 'CLA-1' as AssessmentType },
    { key: 'cla1_assess', windowType: 'assessment' as WindowType, assessmentType: 'CLA-1' as AssessmentType },
    { key: 'cla2_sub', windowType: 'submission' as WindowType, assessmentType: 'CLA-2' as AssessmentType },
    { key: 'cla2_assess', windowType: 'assessment' as WindowType, assessmentType: 'CLA-2' as AssessmentType },
    { key: 'cla3_sub', windowType: 'submission' as WindowType, assessmentType: 'CLA-3' as AssessmentType },
    { key: 'cla3_assess', windowType: 'assessment' as WindowType, assessmentType: 'CLA-3' as AssessmentType },
    { key: 'external_sub', windowType: 'submission' as WindowType, assessmentType: 'External' as AssessmentType },
    { key: 'external_assess', windowType: 'assessment' as WindowType, assessmentType: 'External' as AssessmentType },
    { key: 'grade_release', windowType: 'grade_release' as WindowType },
];

export function IndividualWindowWizardPage() {
    const navigate = useNavigate();
    const { createWindow, windows, fetchWindows, windowsLoading } = useWindowManagement();

    // State
    const [currentStep, setCurrentStep] = useState(0);

    // ...

    const [maxStepReached, setMaxStepReached] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showConflictModal, setShowConflictModal] = useState(false);

    // Form Selection State
    const [selectedProjectType, setSelectedProjectType] = useState<ProjectType | ''>('');
    const [selectedWindowType, setSelectedWindowType] = useState<WindowType | ''>('');
    const [selectedAssessmentType, setSelectedAssessmentType] = useState<AssessmentType | ''>('');
    const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

    // Derived State for Validation boundaries
    const [minDateConstraint, setMinDateConstraint] = useState<any>(now(getLocalTimeZone()));
    const [maxDateConstraint, setMaxDateConstraint] = useState<any>(undefined);
    const [suggestionMessage, setSuggestionMessage] = useState<string>('');

    // Load windows on mount to enable validation
    useEffect(() => {
        fetchWindows();
    }, [fetchWindows]);

    // Computed: Existing windows for selected project
    const projectWindows = useMemo(() => {
        if (!selectedProjectType) return [];
        return windows.filter(w => w.projectType === selectedProjectType);
    }, [windows, selectedProjectType]);

    // Computed: Check if specific windows exist
    const checkWindowExists = (wType: WindowType, aType?: AssessmentType | '') => {
        return projectWindows.some(w =>
            w.windowType === wType &&
            (aType ? w.assessmentType === aType : true)
        );
    };

    // Helper: Get Phase Color
    const getPhaseColor = () => {
        if (!selectedWindowType) return PHASE_COLORS.NEUTRAL;
        if (selectedWindowType === 'proposal') return PHASE_COLORS.PROPOSAL;
        if (selectedWindowType === 'application') return PHASE_COLORS.APPLICATION;
        if (selectedWindowType === 'grade_release') return PHASE_COLORS.GRADE_RELEASE;
        if (selectedWindowType === 'submission') return PHASE_COLORS.CLA_SUBMISSION;
        if (selectedWindowType === 'assessment') return PHASE_COLORS.CLA_ASSESSMENT;
        return PHASE_COLORS.NEUTRAL;
    };

    // --- SMART DATE LOGIC ---

    // Effect: Calculate strict date constraints when entering Date step
    useEffect(() => {
        if (currentStep !== 2 || !selectedProjectType || !selectedWindowType) return;

        // 1. Identify current phase index
        const currentIndex = CHRONOLOGICAL_PHASES.findIndex(p =>
            p.windowType === selectedWindowType &&
            (p.assessmentType ? p.assessmentType === selectedAssessmentType : true)
        );

        if (currentIndex === -1) return;

        // 2. Find Predecessor (Last existing window before this one)
        let predecessorWindow: Window | undefined;
        for (let i = currentIndex - 1; i >= 0; i--) {
            const phase = CHRONOLOGICAL_PHASES[i];
            const found = projectWindows.find(w =>
                w.windowType === phase.windowType &&
                (phase.assessmentType ? w.assessmentType === phase.assessmentType : true)
            );
            if (found) {
                predecessorWindow = found;
                break;
            }
        }

        // 3. Find Successor (First existing window after this one)
        let successorWindow: Window | undefined;
        for (let i = currentIndex + 1; i < CHRONOLOGICAL_PHASES.length; i++) {
            const phase = CHRONOLOGICAL_PHASES[i];
            const found = projectWindows.find(w =>
                w.windowType === phase.windowType &&
                (phase.assessmentType ? w.assessmentType === phase.assessmentType : true)
            );
            if (found) {
                successorWindow = found;
                break;
            }
        }

        // 4. Set Constraints & Suggestions
        const _now = now(getLocalTimeZone());
        let calculatedMin = _now;

        // Suggestion Builder
        const suggestions = [];

        if (predecessorWindow) {
            try {
                // Parse predecesor end date strictly
                const predEndIso = predecessorWindow.endDate.replace('Z', ''); // naive fix for parseZonedDateTime constraints if needed
                const predEnd = parseZonedDateTime(`${predEndIso}[Asia/Kolkata]`);

                // Min start is Predecessor End + 1 minute
                const validStart = predEnd.add({ minutes: 1 });

                // If validStart is in future compared to now, use it. Else use now.
                if (validStart.compare(_now) > 0) {
                    calculatedMin = validStart;
                }

                suggestions.push(`Must start after ${predecessorWindow.windowType} (${new Date(predecessorWindow.endDate).toLocaleDateString()})`);

                // Auto-fill defaults if not already set
                if (!dateRange) {
                    // Default: Start next day 9 AM relative to effective minimum (which is max(now, predEnd))
                    const defaultStart = calculatedMin.add({ days: 1 }).set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
                    const defaultEnd = defaultStart.add({ days: 5 }).set({ hour: 21, minute: 0 }); // 5 days default duration

                    setDateRange({
                        start: defaultStart.toAbsoluteString(),
                        end: defaultEnd.toAbsoluteString()
                    });
                }
            } catch (e) {
                console.error("Error parsing predecessor date", e);
            }
        } else {
            // First phase logic (e.g., Proposal)
            // Default: Start next day 9 AM
            if (!dateRange) {
                const defaultStart = _now.add({ days: 1 }).set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
                const defaultEnd = defaultStart.add({ days: 5 }).set({ hour: 21, minute: 0 });

                setDateRange({
                    start: defaultStart.toAbsoluteString(),
                    end: defaultEnd.toAbsoluteString()
                });
            }
        }

        setMinDateConstraint(calculatedMin);

        // Max constraint if successor exists
        if (successorWindow) {
            try {
                const succStartIso = successorWindow.startDate.replace('Z', '');
                const succStart = parseZonedDateTime(`${succStartIso}[Asia/Kolkata]`);
                setMaxDateConstraint(succStart.subtract({ minutes: 1 })); // Must end before next starts
                suggestions.push(`Must end before ${successorWindow.windowType} starts (${new Date(successorWindow.startDate).toLocaleDateString()})`);
            } catch (e) { }
        } else {
            setMaxDateConstraint(undefined);
        }

        setSuggestionMessage(suggestions.join('. '));

    }, [currentStep, selectedProjectType, selectedWindowType, selectedAssessmentType, projectWindows]);


    // --- SEQUENCE LOGIC ---

    // Computed: Next Expected Phase based on existing windows
    const nextExpectedPhase = useMemo(() => {
        if (!selectedProjectType) return null;
        const idx = CHRONOLOGICAL_PHASES.findIndex(phase =>
            // Re-implement check here to avoid closure dependency issues if any
            !projectWindows.some(w =>
                w.windowType === phase.windowType &&
                (phase.assessmentType ? w.assessmentType === phase.assessmentType : true)
            )
        );
        return idx !== -1 ? CHRONOLOGICAL_PHASES[idx] : null;
    }, [projectWindows, selectedProjectType]);

    // Effect: Auto-select Assessment Type if implied by sequence
    useEffect(() => {
        if (currentStep === 1 && nextExpectedPhase && (selectedWindowType === 'submission' || selectedWindowType === 'assessment')) {
            if (nextExpectedPhase.windowType === selectedWindowType && nextExpectedPhase.assessmentType) {
                if (selectedAssessmentType !== nextExpectedPhase.assessmentType) {
                    setSelectedAssessmentType(nextExpectedPhase.assessmentType);
                }
            }
        }
    }, [currentStep, selectedWindowType, nextExpectedPhase]);



    // --- LOADING STATE CHECK (Must be after all hooks) ---
    if (windowsLoading) {
        return <WizardSkeleton />;
    }

    // --- VALIDATION ---

    const validateStep = (stepIndex: number): boolean => {
        const step = WIZARD_STEPS[stepIndex];
        const newErrors: Record<string, string> = {};

        if (step.id === 'project-type') {
            if (!selectedProjectType) {
                newErrors['projectType'] = "Please select a project type.";
                setErrors(newErrors);
                toast.error("Please select a project type");
                return false;
            }
        } else if (step.id === 'window-type') {
            if (!selectedWindowType) {
                newErrors['windowType'] = "Please select a window category.";
                setErrors(newErrors);
                toast.error("Please select a window category");
                return false;
            }
            if ((selectedWindowType === 'submission' || selectedWindowType === 'assessment') && !selectedAssessmentType) {
                newErrors['assessmentType'] = "Please select which assessment cycle.";
                setErrors(newErrors);
                toast.error("Please select an assessment cycle");
                return false;
            }
            // Check existence again just in case (though UI should disable it)
            if (checkWindowExists(selectedWindowType, selectedAssessmentType)) {
                toast.error("This window is already scheduled!");
                return false;
            }

        } else if (step.id === 'dates') {
            if (!dateRange || !dateRange.start || !dateRange.end) {
                newErrors['dates'] = "Please select start and end dates.";
            } else if (new Date(dateRange.start) >= new Date(dateRange.end)) {
                newErrors['dates'] = "End date must be after start date.";
            }

            // Validate against constraints
            if (minDateConstraint && dateRange?.start) {
                const startD = new Date(dateRange.start);
                const minD = minDateConstraint.toDate();
                if (startD < minD) {
                    newErrors['dates'] = `Start date is too early. ${suggestionMessage}`;
                }
            }
            if (maxDateConstraint && dateRange?.end) {
                const endD = new Date(dateRange.end);
                const maxD = maxDateConstraint.toDate();
                if (endD > maxD) {
                    newErrors['dates'] = `End date overlaps with next phase. ${suggestionMessage}`;
                }
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                toast.error(newErrors['dates'] || "Invalid dates selected");
                return false;
            }
        }

        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            if (currentStep < WIZARD_STEPS.length - 1) {
                const nextStep = currentStep + 1;
                setCurrentStep(nextStep);
                if (nextStep > maxStepReached) setMaxStepReached(nextStep);
            } else {
                handleSubmit();
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        } else {
            navigate('../windows');
        }
    };

    const handleStepClick = (index: number) => {
        if (index > currentStep) {
            if (!validateStep(currentStep)) return;
            if (index > maxStepReached && index > currentStep + 1) return;
        }
        if (index <= maxStepReached || (index === currentStep + 1 && validateStep(currentStep))) {
            setCurrentStep(index);
        }
    };

    const handleSubmit = async () => {
        if (!selectedProjectType || !selectedWindowType || !dateRange) return;

        setLoading(true);
        try {
            // Final check for conflicts
            const conflict = checkWindowExists(selectedWindowType, selectedAssessmentType);
            if (conflict) {
                setShowConflictModal(true);
                setLoading(false);
                return;
            }

            const form: WindowForm = {
                projectTypes: [selectedProjectType],
                windowTypes: [selectedWindowType],
                assessmentType: selectedAssessmentType || '',
                startDate: dateRange.start,
                endDate: dateRange.end,
                useCommonDates: true,
                individualDates: {},
                bulkSettings: {
                    proposal: { startDate: '', endDate: '' },
                    application: { startDate: '', endDate: '' },
                    cla1: { submissionStart: '', submissionEnd: '', assessmentStart: '', assessmentEnd: '' },
                    cla2: { submissionStart: '', submissionEnd: '', assessmentStart: '', assessmentEnd: '' },
                    cla3: { submissionStart: '', submissionEnd: '', assessmentStart: '', assessmentEnd: '' },
                    external: { submissionStart: '', submissionEnd: '', assessmentStart: '', assessmentEnd: '' },
                    gradeRelease: { startDate: '', endDate: '' }
                }
            };

            const success = await createWindow(form, null);
            if (success) {
                setTimeout(() => navigate('../windows'), 1000);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to create window");
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        const step = WIZARD_STEPS[currentStep];
        const currentColor = getPhaseColor();

        // 1. Project Type
        if (step.id === 'project-type') {
            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid md:grid-cols-3 gap-4">
                        {(['IDP', 'UROP', 'CAPSTONE'] as ProjectType[]).map((type) => {
                            // Count how many windows exist for this project type
                            const existingCount = windows.filter(w => w.projectType === type).length;
                            const isFullyScheduled = existingCount >= CHRONOLOGICAL_PHASES.length; // Approximate check

                            return (
                                <button
                                    key={type}
                                    onClick={() => {
                                        if (isFullyScheduled) {
                                            toast.error("All windows for this project type are already scheduled.");
                                            return;
                                        }
                                        setSelectedProjectType(type);
                                        // Reset downstream state
                                        setSelectedWindowType('');
                                        setSelectedAssessmentType('');
                                        setDateRange(null);
                                        setErrors({});
                                        setMaxStepReached(0); // Reset navigation history
                                    }}
                                    disabled={loading}
                                    className={`
                                        relative p-6 rounded-xl border-2 text-left transition-all duration-200
                                        ${isFullyScheduled ? 'opacity-50 grayscale cursor-not-allowed bg-slate-50 border-slate-100' :
                                            selectedProjectType === type
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
                                                {existingCount > 0
                                                    ? isFullyScheduled ? 'All windows scheduled' : `${existingCount} windows scheduled`
                                                    : 'No windows scheduled'}
                                            </p>
                                        </div>
                                    </div>
                                    {selectedProjectType === type && (
                                        <div className="absolute top-4 right-4"><CheckCircle2 className="w-6 h-6 fill-slate-900 text-white" /></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {errors['projectType'] && <p className="text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {errors['projectType']}</p>}

                    {/* Active Scheme Summary */}
                    {selectedProjectType && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-6">
                            <h4 className="text-sm font-semibold text-slate-900 mb-2">Existing Schedule for {selectedProjectType}</h4>
                            <div className="flex flex-wrap gap-2">
                                {CHRONOLOGICAL_PHASES.map(phase => {
                                    const exists = checkWindowExists(phase.windowType, phase.assessmentType);
                                    if (!exists) return null;
                                    return (
                                        <span key={phase.key} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                            <Check className="w-3 h-3 mr-1" />
                                            {phase.windowType === 'submission' || phase.windowType === 'assessment'
                                                ? `${phase.assessmentType} ${phase.windowType}`
                                                : phase.windowType}
                                        </span>
                                    );
                                })}
                                {projectWindows.length === 0 && <span className="text-sm text-slate-500 italic">None</span>}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // 2. Window Type (Category)
        if (step.id === 'window-type') {
            const types: { id: WindowType, label: string, icon: any }[] = [
                { id: 'proposal', label: 'Proposal', icon: FileText },
                { id: 'application', label: 'Application', icon: Layers },
                { id: 'submission', label: 'Submission', icon: ClipboardList },
                { id: 'assessment', label: 'Assessment', icon: ClipboardList },
                { id: 'grade_release', label: 'Grade Release', icon: CheckCircle2 },
                { id: 'grade_release', label: 'Grade Release', icon: CheckCircle2 },
            ];

            // NOTE: Using top-level 'nextExpectedPhase' calculated via useMemo

            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                            <h4 className="text-sm font-semibold text-blue-900">Sequence Enforced</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                {nextExpectedPhase
                                    ? `Based on existing progress, the next required window is ${nextExpectedPhase.windowType === 'submission' || nextExpectedPhase.windowType === 'assessment' ? `${nextExpectedPhase.assessmentType} ${nextExpectedPhase.windowType}` : nextExpectedPhase.windowType}.`
                                    : "All windows have been scheduled for this project type."
                                }
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        {types.map((t) => {
                            // Check if this type (generic) is valid based on sequence
                            let disabled = true;

                            if (nextExpectedPhase) {
                                if (t.id === nextExpectedPhase.windowType) {
                                    disabled = false;
                                }
                            }

                            return (
                                <button
                                    key={t.id}
                                    onClick={() => { if (!disabled) { setSelectedWindowType(t.id); setErrors({}); } }}
                                    disabled={disabled}
                                    className={`
                                        relative p-4 rounded-xl border-2 text-left transition-all 
                                        ${disabled ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100 grayscale' :
                                            selectedWindowType === t.id
                                                ? 'bg-primary/5'
                                                : 'border-slate-100 hover:border-slate-200'
                                        }
                                    `}
                                    style={selectedWindowType === t.id ? { borderColor: getPhaseColor() } : {}}
                                >
                                    <div className="flex items-center gap-3">
                                        <t.icon className={`w-5 h-5 ${selectedWindowType === t.id ? 'text-primary' : 'text-slate-500'}`} style={selectedWindowType === t.id ? { color: getPhaseColor() } : {}} />
                                        <span className="font-semibold text-slate-900">{t.label}</span>
                                    </div>
                                    {!disabled && selectedWindowType === t.id && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5" style={{ color: getPhaseColor() }} />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Cycle Selection */}
                    {(selectedWindowType === 'submission' || selectedWindowType === 'assessment') && (
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mt-6 animate-in fade-in slide-in-from-top-2">
                            <h4 className="font-semibold text-slate-900 mb-4">Select Assessment Cycle</h4>
                            <div className="flex gap-4 flex-wrap">
                                {(['CLA-1', 'CLA-2', 'CLA-3', 'External'] as AssessmentType[]).map((cycle) => {
                                    // Only enable the SPECIFIC cycle that matches the next expected phase
                                    const isNext = nextExpectedPhase?.assessmentType === cycle;

                                    return (
                                        <button
                                            key={cycle}
                                            disabled={!isNext}
                                            onClick={() => { setSelectedAssessmentType(cycle); setErrors({}); }}
                                            className={`px-4 py-2 rounded-lg border font-medium transition-all ${!isNext ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400' :
                                                selectedAssessmentType === cycle
                                                    ? 'bg-white shadow-sm ring-1'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            style={selectedAssessmentType === cycle && isNext ? { borderColor: getPhaseColor(), color: getPhaseColor() } : {}}
                                        >
                                            {cycle}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {(errors['windowType'] || errors['assessmentType']) && (
                        <p className="text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {errors['windowType'] || errors['assessmentType']}</p>
                    )}
                </div>
            );
        }

        // 3. Dates (Duration)
        if (step.id === 'dates') {
            return (
                <div className="max-w-xl animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="mb-4">
                        {suggestionMessage && (
                            <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-200 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <p>{suggestionMessage}</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: getPhaseColor() }} />
                        <DateRangePickerField
                            label="Select Duration"
                            value={dateRange}
                            onChange={(val) => { setDateRange(val); setErrors({}); }}
                            isRequired
                            errorMessage={errors['dates']}
                            minValue={minDateConstraint}
                            maxValue={maxDateConstraint}
                            color={getPhaseColor()}
                        />
                    </div>
                </div>
            );
        }

        // 4. Preview
        if (step.id === 'preview') {
            return (
                <div className="max-w-2xl animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-900">Summary</h3>
                            <p className="text-sm text-slate-500">Review your settings before creating</p>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Project Type</label>
                                    <p className="font-bold text-slate-900 text-lg">{selectedProjectType}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Window Type</label>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-slate-900 text-lg">
                                            {selectedWindowType === 'grade_release' ? 'Grade Release' :
                                                selectedWindowType!.charAt(0).toUpperCase() + selectedWindowType!.slice(1)}
                                        </p>
                                        {(selectedWindowType === 'submission' || selectedWindowType === 'assessment') && (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                {selectedAssessmentType}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <label className="text-xs font-semibold text-slate-500 uppercase mb-3 block tracking-wider">Duration</label>
                                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div className={`p-2 rounded-lg text-white`} style={{ backgroundColor: getPhaseColor() }}>
                                        <Calendar className="w-5 h-5" />
                                    </div>

                                    {/* Horizontal Date Display */}
                                    <div className="flex items-center gap-4 flex-1">
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium mb-0.5">Start Date</p>
                                            <p className="font-mono font-semibold text-slate-900">
                                                {dateRange?.start ? new Date(dateRange.start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                                            </p>
                                        </div>
                                        <div className="flex-1 h-px bg-slate-300 mx-2 relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 px-2 text-xs text-slate-400">to</div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 font-medium mb-0.5">End Date</p>
                                            <p className="font-mono font-semibold text-slate-900">
                                                {dateRange?.end ? new Date(dateRange.end).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-8 max-w-7xl mx-auto p-6 md:p-8 overflow-hidden">
            {/* Sidebar */}
            <div className="w-full md:w-80 flex-shrink-0 flex flex-col h-full">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Create Window</h1>
                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                        Configure a single window for specific academic activities.
                    </p>
                </div>
                <div className="space-y-1 relative flex-1">
                    <div className="absolute left-6 top-4 bottom-80 w-0.5 bg-slate-100" />
                    {WIZARD_STEPS.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = currentStep === index;
                        const isCompleted = index < currentStep;
                        const showColor = isActive || isCompleted;

                        // Dynamic color for sidebar icons based on step index standard logic
                        let stepColor = step.color;
                        if (isActive || isCompleted) {
                            // Use PHASE logic if we want, or just a standard 'active' color.
                            // The user asked for "color coding we did for sem plan wizard".
                            // In sem plan wizard, steps have fixed colors. Here, 'window-type' is generic.
                            // But we can enable standard colors if we want.
                            // For now, let's stick to Slate-900 for active/done to keep it clean, 
                            // OR use the dynamic phase color if we have selected one?
                            if (index === 0 && selectedProjectType) stepColor = '#334155';
                            if (index > 0 && selectedWindowType) stepColor = getPhaseColor();
                        }

                        return (
                            <button
                                key={step.id}
                                onClick={() => handleStepClick(index)}
                                className={`
                                    relative flex items-center gap-4 w-full p-3 rounded-xl transition-all duration-200 text-left 
                                    ${isActive ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-slate-50'}
                                `}
                            >
                                <div
                                    className={`
                                        w-10 h-10 rounded-lg flex items-center justify-center transition-all 
                                        ${showColor ? 'text-white shadow-md' : 'bg-slate-100 text-slate-400'}
                                    `}
                                    style={showColor ? { backgroundColor: stepColor } : {}}
                                >
                                    {<Icon className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className={`font-semibold text-sm ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{step.label}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{WIZARD_STEPS[currentStep].label}</h2>
                        <p className="text-sm text-slate-500 mt-1">{WIZARD_STEPS[currentStep].description}</p>
                    </div>
                </div>

                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">{renderStepContent()}</div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button onClick={handleBack} className="px-6 py-2.5 text-slate-600 hover:text-slate-900 font-medium">
                        {currentStep === 0 ? 'Cancel' : 'Back'}
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={loading}
                        className="px-8 py-2.5 text-white rounded-lg hover:opacity-90 font-medium shadow-lg transition-all disabled:opacity-50"
                        style={{ backgroundColor: getPhaseColor() === PHASE_COLORS.NEUTRAL ? '#0F172A' : getPhaseColor() }} // Default slate-900, else phase color
                    >
                        {currentStep === WIZARD_STEPS.length - 1 ? (loading ? 'Creating...' : 'Create Window') : 'Next Step'}
                    </button>
                </div>
            </div>

            <ConflictWarningModal
                isOpen={showConflictModal}
                onClose={() => setShowConflictModal(false)}
                projectType={selectedProjectType as ProjectType}
            />
        </div>
    );
}
