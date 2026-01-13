import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronRight, Layers, Calendar, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectType, WindowForm } from './types';
import { DateRangePicker } from "@heroui/date-picker";
import { parseZonedDateTime } from "@internationalized/date";
import toast from 'react-hot-toast';
import { api } from '@/utils/api';

// Steps configuration
const WIZARD_STEPS = [
    { id: 'project-type', label: 'Project Type', icon: Layers, description: 'Select the academic project type' },
    { id: 'proposal', label: 'Proposal Phase', icon: Calendar, description: 'Set proposal submission dates' },
    { id: 'application', label: 'Application Phase', icon: Calendar, description: 'Set student application dates' },
    { id: 'cla-1', label: 'CLA-1 Cycle', icon: ClipboardList, description: 'First continuous assessment' },
    { id: 'cla-2', label: 'CLA-2 Cycle', icon: ClipboardList, description: 'Second continuous assessment' },
    { id: 'cla-3', label: 'CLA-3 Cycle', icon: ClipboardList, description: 'Final continuous assessment' },
    { id: 'external', label: 'External Review', icon: ClipboardList, description: 'External evaluator assessment' },
    { id: 'grade-release', label: 'Grade Release', icon: Calendar, description: 'Final grade publication' },
    { id: 'preview', label: 'Preview Plan', icon: CheckCircle2, description: 'Review and confirm schedule' },
];

const INITIAL_FORM: WindowForm = {
    windowTypes: [],
    projectTypes: [],
    assessmentType: '',
    startDate: '',
    endDate: '',
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

export function SemesterPlanWizardPage() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedProjectType, setSelectedProjectType] = useState<ProjectType | ''>('');
    const [form, setForm] = useState<WindowForm>(INITIAL_FORM);
    const [loading, setLoading] = useState(false);

    // Helper: Parse date for DatePicker
    const getDateValue = (startStr: string, endStr: string) => {
        try {
            if (startStr && endStr) {
                const s = startStr.replace('Z', '').replace(/\+.*$/, '');
                const e = endStr.replace('Z', '').replace(/\+.*$/, '');
                return {
                    start: parseZonedDateTime(`${s}[Asia/Kolkata]`),
                    end: parseZonedDateTime(`${e}[Asia/Kolkata]`)
                };
            }
        } catch (e) { return null; }
        return null;
    };

    // Helper: Format date from DatePicker
    const handleDateChange = (phase: string, startKey: string, endKey: string, val: any) => {
        if (!val?.start || !val?.end) return;

        const format = (d: any) => {
            return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}T${String(d.hour).padStart(2, '0')}:${String(d.minute).padStart(2, '0')}:00`;
        };

        setForm(prev => ({
            ...prev,
            bulkSettings: {
                ...prev.bulkSettings,
                [phase]: {
                    ...prev.bulkSettings[phase as keyof typeof prev.bulkSettings],
                    [startKey]: format(val.start),
                    [endKey]: format(val.end)
                }
            }
        }));
    };

    const handleNext = () => {
        if (currentStep < WIZARD_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        } else {
            navigate('/dashboard/control/windows');
        }
    };

    const handleSubmit = async () => {
        if (!selectedProjectType) {
            toast.error("Please select a project type");
            return;
        }
        setLoading(true);
        try {
            await api.post('/windows/bulk', {
                projectType: selectedProjectType,
                settings: form.bulkSettings
            });
            toast.success("Semester plan created successfully!");
            navigate('/dashboard/control/windows');
        } catch (error) {
            console.error(error);
            toast.error("Failed to create semester plan");
        } finally {
            setLoading(false);
        }
    };

    // Helper component for Preview Phase timeline items
    const TimelineItem = ({ label, dateRange, color = "slate" }: { label: string, dateRange: { start?: string, end?: string } | { startDate?: string, endDate?: string } | { submissionStart?: string, submissionEnd?: string, assessmentStart?: string, assessmentEnd?: string }, color?: "slate" | "blue" | "amber" | "green" }) => {
        const formatDate = (dateStr?: string) => {
            if (!dateStr) return 'Not Set';
            return new Date(dateStr).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            });
        };

        const getDates = () => {
            // Handle different structure for linear vs cycle phases
            if ('startDate' in dateRange) {
                return { start: dateRange.startDate, end: dateRange.endDate };
            }
            // For cycles, we show submission window primarily, or both? Let's show specific sub-items in parent
            return { start: (dateRange as any).submissionStart, end: (dateRange as any).submissionEnd };
        };

        return (
            <div className={`pl-4 border-l-2 border-${color}-200 ml-2 relative pb-6 last:pb-0`}>
                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-${color}-100 border-2 border-${color}-500`} />
                <div>
                    <h4 className="font-medium text-slate-900 text-sm">{label}</h4>
                    {/* Logic to display dates based on type */}
                    {'startDate' in dateRange ? (
                        <p className="text-xs text-slate-500 mt-1">
                            {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            <div className="bg-blue-50/50 p-2 rounded border border-blue-100">
                                <span className="text-[10px] font-bold text-blue-700 uppercase block mb-0.5">Submission</span>
                                <span className="text-xs text-slate-600 block">
                                    {formatDate((dateRange as any).submissionStart)} - {formatDate((dateRange as any).submissionEnd)}
                                </span>
                            </div>
                            <div className="bg-amber-50/50 p-2 rounded border border-amber-100">
                                <span className="text-[10px] font-bold text-amber-700 uppercase block mb-0.5">Assessment</span>
                                <span className="text-xs text-slate-600 block">
                                    {formatDate((dateRange as any).assessmentStart)} - {formatDate((dateRange as any).assessmentEnd)}
                                </span>
                            </div>
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
                </div>
            );
        }

        // 2. Linear Phases (Proposal, Application, Grade Release)
        if (['proposal', 'application', 'grade-release'].includes(step.id)) {
            const phaseKey = step.id === 'grade-release' ? 'gradeRelease' : step.id;
            const settings = form.bulkSettings[phaseKey as keyof typeof form.bulkSettings] as any;

            return (
                <div className="max-w-xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                        <label className="text-sm font-medium text-slate-700 mb-2 block">
                            Duration <span className="text-red-500">*</span>
                        </label>
                        <DateRangePicker
                            value={getDateValue(settings.startDate, settings.endDate)}
                            onChange={(val) => handleDateChange(phaseKey, 'startDate', 'endDate', val)}
                            variant="bordered"
                            aria-label={`Select ${step.label} Duration`}
                            hideTimeZone
                            granularity="minute"
                            visibleMonths={1}
                            className="w-full"
                            classNames={{
                                base: "w-full",
                                inputWrapper: "shadow-sm border border-slate-200 bg-white hover:border-slate-300 px-3",
                            }}
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            Select the start and end dates for the {step.label.toLowerCase()}.
                        </p>
                    </div>
                </div>
            );
        }

        // 3. Cycle Phases (CLA-1, CLA-2, CLA-3, External)
        if (['cla-1', 'cla-2', 'cla-3', 'external'].includes(step.id)) {
            const phaseKey = step.id.replace('-', '');
            const settings = form.bulkSettings[phaseKey as keyof typeof form.bulkSettings] as any;

            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Submission Window */}
                        <div className="bg-blue-50/30 p-6 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <h4 className="font-semibold text-slate-900">Submission Window</h4>
                            </div>
                            <DateRangePicker
                                value={getDateValue(settings.submissionStart, settings.submissionEnd)}
                                onChange={(val) => handleDateChange(phaseKey, 'submissionStart', 'submissionEnd', val)}
                                variant="bordered"
                                aria-label="Select Submission Duration"
                                hideTimeZone
                                granularity="minute"
                                className="w-full"
                                classNames={{
                                    base: "w-full",
                                    inputWrapper: "shadow-sm border border-blue-200 bg-white hover:border-blue-300 px-3",
                                }}
                            />
                        </div>

                        {/* Assessment Window */}
                        <div className="bg-amber-50/30 p-6 rounded-xl border border-amber-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                                    <ClipboardList className="w-5 h-5" />
                                </div>
                                <h4 className="font-semibold text-slate-900">Assessment Window</h4>
                            </div>
                            <DateRangePicker
                                value={getDateValue(settings.assessmentStart, settings.assessmentEnd)}
                                onChange={(val) => handleDateChange(phaseKey, 'assessmentStart', 'assessmentEnd', val)}
                                variant="bordered"
                                aria-label="Select Assessment Duration"
                                hideTimeZone
                                granularity="minute"
                                className="w-full"
                                classNames={{
                                    base: "w-full",
                                    inputWrapper: "shadow-sm border border-amber-200 bg-white hover:border-amber-300 px-3",
                                }}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        // 4. Preview Phase
        if (step.id === 'preview') {
            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4 flex-shrink-0">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Plan Summary</h3>
                        <p className="text-sm text-slate-500">for {selectedProjectType} projects</p>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        <TimelineItem label="Proposal Phase" dateRange={form.bulkSettings.proposal} color="slate" />
                        <TimelineItem label="Application Phase" dateRange={form.bulkSettings.application} color="slate" />
                        <TimelineItem label="CLA-1 Cycle" dateRange={form.bulkSettings.cla1} color="blue" />
                        <TimelineItem label="CLA-2 Cycle" dateRange={form.bulkSettings.cla2} color="blue" />
                        <TimelineItem label="CLA-3 Cycle" dateRange={form.bulkSettings.cla3} color="blue" />
                        <TimelineItem label="External Review" dateRange={form.bulkSettings.external} color="amber" />
                        <TimelineItem label="Grade Release" dateRange={form.bulkSettings.gradeRelease} color="green" />
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-8 max-w-7xl mx-auto p-6 md:p-8">

            {/* Sidebar Stepper */}
            <div className="w-full md:w-80 flex-shrink-0 space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Semester Plan</h1>
                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                        Configure the entire semester schedule for a project type in sequence.
                    </p>
                </div>

                <div className="space-y-1 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-100" />

                    {WIZARD_STEPS.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = currentStep === index;
                        const isCompleted = index < currentStep;

                        return (
                            <button
                                key={step.id}
                                onClick={() => index < currentStep ? setCurrentStep(index) : null} // Allow clicking back
                                disabled={index > currentStep}
                                className={`
                                    relative flex items-center gap-4 w-full p-3 rounded-xl transition-all text-left
                                    ${isActive ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-slate-50/80'}
                                    ${index > currentStep ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                            >
                                <div className={`
                                    relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors
                                    ${isActive
                                        ? 'bg-slate-900 border-slate-900 text-white'
                                        : isCompleted
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'bg-white border-slate-200 text-slate-400'
                                    }
                                `}>
                                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
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
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden max-h-[800px]">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
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

                {/* Step Body */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {renderStepContent()}
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        className="px-6 py-2.5 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                    >
                        {currentStep === 0 ? 'Cancel' : 'Back'}
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={loading || (currentStep === 0 && !selectedProjectType)}
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
        </div>
    );
}
