import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, GraduationCap, UploadCloud, FileText, AlertCircle, Check, Loader2, Download, ArrowLeft, Layout, ClipboardCheck, FileUp, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { fadeUp, staggerContainer } from '../../utils/animations';
import { apiClient } from '../../utils/api';

type UserType = 'student' | 'faculty';
type ProjectType = 'IDP' | 'UROP' | 'CAPSTONE';

interface ParsedRow {
    rowNumber: number;
    data: Record<string, string>;
    valid: boolean;
    errors: string[];
}

interface ValidationResult {
    valid: boolean;
    rows: ParsedRow[];
    totalRows: number;
    validRows: number;
    invalidRows: number;
}

// Steps Configuration
const STEPS = [
    { id: 1, title: 'User Type', icon: Users },
    { id: 2, title: 'Category', icon: Layout },
    { id: 3, title: 'Upload', icon: FileUp },
    { id: 4, title: 'Review', icon: ClipboardCheck }
];

export function EligibilityUpload() {
    // State
    const [currentStep, setCurrentStep] = useState(1);
    const [userType, setUserType] = useState<UserType | null>(null);
    const [projectType, setProjectType] = useState<ProjectType | null>(null);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvData, setCsvData] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [showPreview, setShowPreview] = useState(true);
    const [existingUsers, setExistingUsers] = useState<Map<string, string>>(new Map()); // email -> roleMap


    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch existing users on mount for duplicate checking
    useEffect(() => {
        const fetchExistingUsers = async () => {
            try {
                const response = await apiClient.get<{ users: { email: string, role: string }[] }>('/users').catch(() => null);
                if (response && response.success && response.data?.users) {
                    const userMap = new Map<string, string>();
                    response.data.users.forEach(u => {
                        if (u.email) userMap.set(u.email.toLowerCase(), u.role);
                    });
                    setExistingUsers(userMap);
                }
            } catch (err) {
                console.warn('Silent: Duplicate check prep failed', err);
            }
        };

        fetchExistingUsers();
    }, []);

    // Helpers
    const handleNext = () => {
        if (currentStep < 4) setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) {
            // Clean state logic
            if (currentStep === 2) {
                setUserType(null);
                setCurrentStep(1);
            } else if (currentStep === 3) {
                if (userType === 'faculty') {
                    setUserType(null);
                    setCurrentStep(1);
                } else {
                    setProjectType(null);
                    setCurrentStep(2);
                }
            } else if (currentStep === 4) {
                // If we are in results screen (result !== null), reset everything
                if (result) {
                    resetFlow();
                } else {
                    setCurrentStep(3);
                }
            } else {
                setCurrentStep(prev => prev - 1);
            }
        }
    };

    const resetFlow = () => {
        setCurrentStep(1);
        setUserType(null);
        setProjectType(null);
        setCsvFile(null);
        setCsvData('');
        setValidationResult(null);
        setResult(null);
        setError(null);
    };

    // Validation Logic
    const validateCSV = (csvContent: string): ValidationResult => {
        const lines = csvContent.trim().split('\n');
        if (lines.length < 1) {
            return { valid: false, rows: [], totalRows: 0, validRows: 0, invalidRows: 0 };
        }

        const rows: ParsedRow[] = [];
        let validCount = 0;
        let invalidCount = 0;

        const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const email = line.split(',')[0].trim().toLowerCase();
            const rowData: Record<string, string> = { email };
            const rowErrors: string[] = [];

            if (!email || !email.includes('@')) {
                rowErrors.push('Invalid email format');
            } else if (!email.endsWith('@srmap.edu.in')) {
                rowErrors.push('Email must end with @srmap.edu.in');
            } else if (existingUsers.has(email)) {
                const currentRole = existingUsers.get(email);

                if (userType === 'faculty') {
                    if (currentRole === 'faculty') {
                        rowErrors.push('Already registered as Faculty');
                    } else {
                        rowErrors.push(`Already registered as ${currentRole?.replace('-student', '').toUpperCase()}`);
                    }
                } else {
                    const targetRole = `${projectType?.toLowerCase()}-student`;
                    if (currentRole === targetRole) {
                        rowErrors.push('Already registered for this category');
                    } else {
                        // Mismatch check
                        rowErrors.push(`Mismatch: Registered as ${currentRole?.replace('-student', '').toUpperCase()}`);
                    }
                }
            }

            const isValid = rowErrors.length === 0;
            if (isValid) validCount++;
            else invalidCount++;

            rows.push({
                rowNumber: rows.length + 1, // Start from 1 sequentially
                data: rowData,
                valid: isValid,
                errors: rowErrors
            });
        }

        return {
            valid: invalidCount === 0 && rows.length > 0,
            rows,
            totalRows: rows.length,
            validRows: validCount,
            invalidRows: invalidCount
        };
    };

    // File Handling
    const processFile = (file: File) => {
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setError('Please upload a valid CSV file');
            return;
        }

        setCsvFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setCsvData(content);
            const validation = validateCSV(content);
            setValidationResult(validation);
            setError(null);
            setResult(null);
            if (currentStep === 3) handleNext();
        };
        reader.readAsText(file);
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
    }, []);

    const handleUpload = async () => {
        if (!csvData) { setError('Please select a CSV file'); return; }
        if (validationResult && !validationResult.valid) {
            setError(`Cannot upload: ${validationResult.invalidRows} invalid rows found.`);
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const endpoint = userType === 'faculty' ? '/eligibility/faculty/upload' : '/eligibility/upload';
            const payload = userType === 'faculty' ? { csvData } : { csvData, projectType };
            const response = await apiClient.post(endpoint, payload);

            if (response.success && response.data) {
                setResult(response.data);
                // Refresh duplicate list
                apiClient.get<{ users: { email: string, role: string }[] }>('/users').then(res => {
                    if (res?.success && res.data?.users) {
                        const userMap = new Map<string, string>();
                        res.data.users.forEach(u => {
                            if (u.email) userMap.set(u.email.toLowerCase(), u.role);
                        });
                        setExistingUsers(userMap);
                    }
                }).catch(() => null);
            } else {
                setError(response.error?.message || 'Upload failed');
            }
        } catch (err: any) {
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const stepVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const } },
        exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
    } as const;

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <motion.div initial="hidden" animate="visible" exit="exit" variants={stepVariants} className="space-y-4">
                        <h2 className="text-xl font-heading font-black text-slate-800 mb-6 text-center tracking-tight">Who are you uploading for?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 pb-2">
                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(248, 250, 252, 1)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => { setUserType('student'); handleNext(); }}
                                className={`group p-8 rounded-[28px] border-2 transition-all duration-500 relative flex flex-col items-center gap-5 ${userType === 'student' ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-slate-100 bg-white hover:border-primary/20'}`}
                            >
                                <div className={`p-5 rounded-[20px] transition-all duration-500 ${userType === 'student' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-slate-50 text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg'}`}>
                                    <GraduationCap className="w-10 h-10" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-black text-slate-800 mb-1">Students</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Upload eligibility list for student<br />project applications</p>
                                </div>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(248, 250, 252, 1)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => { setUserType('faculty'); setCurrentStep(3); }}
                                className={`group p-8 rounded-[28px] border-2 transition-all duration-500 relative flex flex-col items-center gap-5 ${userType === 'faculty' ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-slate-100 bg-white hover:border-primary/20'}`}
                            >
                                <div className={`p-5 rounded-[20px] transition-all duration-500 ${userType === 'faculty' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-slate-50 text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg'}`}>
                                    <Users className="w-10 h-10" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-black text-slate-800 mb-1">Faculty</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Upload faculty roster for<br />project supervision</p>
                                </div>
                            </motion.button>
                        </div>
                    </motion.div>
                );

            case 2:
                const categories = [
                    { id: 'IDP', name: 'IDP', fullName: 'Interdisciplinary Project' },
                    { id: 'UROP', name: 'UROP', fullName: 'Undergraduate Research Opportunity program' },
                    { id: 'CAPSTONE', name: 'Capstone', fullName: 'Capstone Project' }
                ] as const;

                return (
                    <motion.div initial="hidden" animate="visible" exit="exit" variants={stepVariants} className="space-y-8">
                        <h2 className="text-xl font-heading font-black text-slate-800 text-center tracking-tight">Select Project Category</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 pb-6">
                            {categories.map((cat) => (
                                <motion.button
                                    key={cat.id}
                                    whileHover={{ scale: 1.03, translateY: -4 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => { setProjectType(cat.id as ProjectType); handleNext(); }}
                                    className={`relative p-6 rounded-[28px] border-2 transition-all duration-500 flex flex-col items-center text-center gap-4 h-full min-h-[180px] justify-center ${projectType === cat.id ? 'border-primary bg-primary/5 shadow-inner' : 'border-slate-50 bg-slate-50/50 hover:bg-white hover:border-primary/20'}`}
                                >
                                    <div className={`w-28 h-11 rounded-xl flex items-center justify-center font-black text-xs uppercase tracking-wider transition-all duration-500 mb-2 ${projectType === cat.id ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white text-slate-500 border border-slate-100'}`}>
                                        {cat.name}
                                    </div>
                                    <div className="flex flex-col justify-center min-h-[48px]">
                                        <p className={`font-black text-sm leading-tight px-1 ${projectType === cat.id ? 'text-slate-900' : 'text-slate-600'}`}>{cat.fullName}</p>
                                    </div>
                                    {projectType === cat.id && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-4 right-4 bg-primary text-white p-1 rounded-full">
                                            <Check className="w-3 h-3" />
                                        </motion.div>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                );

            case 3:
                return (
                    <motion.div initial="hidden" animate="visible" exit="exit" variants={stepVariants} className="space-y-6 pb-2">
                        <div className="text-center space-y-1.5">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Upload CSV File</h2>
                            <p className="text-slate-400 text-[11px] font-medium">Target Category: <span className="text-primary font-black uppercase text-xs">{userType === 'student' ? projectType : 'Faculty'}</span></p>
                        </div>

                        <div className={`mx-6 relative border-2 border-dashed rounded-[32px] p-10 transition-all duration-700 group ${dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-slate-100 bg-slate-50/30 hover:border-primary/30 hover:bg-white'}`}
                            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                            <input ref={fileInputRef} type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" />
                            <div className="flex flex-col items-center gap-5">
                                <motion.div animate={dragActive ? { rotate: [0, -10, 10, 0], scale: 1.05 } : {}} className={`p-6 rounded-[24px] transition-all duration-500 ${dragActive ? 'bg-primary text-white' : 'bg-white text-slate-300 shadow-sm group-hover:text-primary'}`}>
                                    <UploadCloud className="w-12 h-12" />
                                </motion.div>
                                <div className="text-center">
                                    <p className="text-base font-bold text-slate-700">Drop file here or click to browse</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium italic">Standard CSV format required</p>
                                </div>
                                <div className="flex gap-3">
                                    <Button onClick={() => fileInputRef.current?.click()} size="sm" className="rounded-[12px] h-10 px-6 font-bold shadow-md shadow-primary/10">Select File</Button>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        const template = `email\n${userType === 'student' ? 'student' : 'faculty'}@srmap.edu.in`;
                                        const blob = new Blob([template], { type: 'text/csv' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a'); a.href = url; a.download = 'template.csv'; a.click();
                                    }} className="rounded-[12px] h-10 text-slate-400 font-bold hover:bg-slate-50 hover:text-slate-600">
                                        <Download className="w-3.5 h-3.5 mr-2" /> Template
                                    </Button>
                                </div>

                                <div className="mt-4 px-6 py-3 bg-amber-50/40 rounded-[20px] border border-amber-100/50 flex items-center gap-3 max-w-[420px]">
                                    <AlertCircle className="w-4 h-4 text-amber-500/80 shrink-0" />
                                    <p className="text-[10px] text-amber-800/80 font-semibold leading-relaxed">
                                        Emails must end with <span className="font-black underline decoration-amber-200">@srmap.edu.in</span>. System detects duplicates & role mismatches automatically.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );

            case 4:
                return (
                    <motion.div initial="hidden" animate="visible" exit="exit" variants={stepVariants} className="space-y-5 pb-2">
                        {!result ? (
                            <div className="space-y-6 px-6">
                                <div className="flex items-center justify-center pb-2 border-b border-slate-50 relative">
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Review & Validate</h3>
                                    <Button variant="ghost" size="sm" onClick={() => { setCsvFile(null); setValidationResult(null); setCurrentStep(3); }} className="absolute right-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 font-bold rounded-[10px] h-9 px-4 transition-all flex items-center gap-1.5 ">
                                        <X className="w-3.5 h-3.5" /> Change File
                                    </Button>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {[{ l: 'Total', v: validationResult?.totalRows, c: 'slate-600', bg: 'slate-50' }, { l: 'Valid', v: validationResult?.validRows, c: 'emerald-600', bg: 'emerald-50/60' }, { l: 'Invalid', v: validationResult?.invalidRows, c: 'rose-600', bg: 'rose-50/60' }].map(s => (
                                        <div key={s.l} className={`p-5 rounded-[24px] ${s.bg} border-2 border-white text-center shadow-sm`}>
                                            <div className={`text-2xl font-black text-${s.c}`}>{s.v}</div>
                                            <div className="text-[9px] uppercase font-black tracking-[0.15em] text-slate-400 mt-0.5">{s.l}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-[32px] border border-slate-100 overflow-hidden bg-white shadow-sm">
                                    <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                                        <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Data Preview</h4>
                                        <button onClick={() => setShowPreview(!showPreview)} className="text-[9px] font-black uppercase text-primary tracking-widest">{showPreview ? 'Minimize' : 'Expand'}</button>
                                    </div>
                                    {showPreview && (
                                        <div className="max-h-[240px] overflow-auto">
                                            <Table>
                                                <TableHeader className="bg-slate-50 sticky top-0">
                                                    <TableRow>
                                                        <TableHead className="font-black uppercase text-[9px] px-6 text-center w-16">#</TableHead>
                                                        <TableHead className="font-black uppercase text-[9px] text-left">Email Address</TableHead>
                                                        <TableHead className="font-black uppercase text-[9px] w-32 text-center">Status</TableHead>
                                                        <TableHead className="font-black uppercase text-[9px] text-center">Errors</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {validationResult?.rows.map((row) => (
                                                        <TableRow key={row.rowNumber} className={!row.valid ? 'bg-rose-50/30' : ''}>
                                                            <TableCell className="px-6 text-slate-300 font-black text-center">{row.rowNumber}</TableCell>
                                                            <TableCell className="font-bold text-slate-700 text-left">{row.data.email}</TableCell>
                                                            <TableCell className="text-center">{row.valid ? <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase rounded-full">Approved</span> : <span className="inline-block px-3 py-1 bg-rose-100 text-rose-700 text-[8px] font-black uppercase rounded-full">Rejected</span>}</TableCell>
                                                            <TableCell className="text-rose-600 text-[9px] font-bold text-center">{row.errors.join(' • ')}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </div>

                                <Button size="lg" className="w-full rounded-[24px] h-16 font-black text-lg shadow-xl shadow-primary/20" onClick={handleUpload} disabled={!validationResult?.valid || uploading}>
                                    {uploading ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <UploadCloud className="w-6 h-6 mr-3" />}
                                    {uploading ? 'Processing Data...' : 'Confirm & Finalize Upload'}
                                </Button>
                                {error && <div className="p-5 bg-rose-50 border border-rose-100 rounded-[20px] flex items-center gap-4 text-rose-600 text-sm font-bold shadow-sm"><AlertCircle className="w-5 h-5 shrink-0" />{error}</div>}
                            </div>
                        ) : (
                            <div className="text-center py-16 space-y-10">
                                <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12, stiffness: 100 }} className="w-32 h-32 bg-emerald-500 rounded-[48px] flex items-center justify-center mx-auto text-white shadow-2xl shadow-emerald-200">
                                    <Check className="w-16 h-16" />
                                </motion.div>
                                <div className="space-y-3">
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Success!</h2>
                                    <p className="text-slate-500 font-medium">Successfully processed <span className="text-slate-900 font-black">{result.success}</span> records into the system</p>
                                </div>
                                <Button onClick={resetFlow} className="rounded-[22px] h-16 px-12 font-black text-lg">Process Another List</Button>
                            </div>
                        )}
                    </motion.div>
                );
            default: return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-8 pt-4">
            <motion.div initial="initial" animate="animate" className="text-center space-y-2">
                <motion.div variants={fadeUp} className="inline-block px-3 py-1 bg-slate-50 rounded-full border border-slate-100 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Admin Dashboard</motion.div>
                <motion.h1 variants={fadeUp} className="text-4xl font-heading font-black text-slate-900 tracking-tight">Eligibility Portal</motion.h1>
                <motion.p variants={fadeUp} className="text-slate-400 text-sm font-medium">Configure academic eligibility with precision</motion.p>
            </motion.div>

            <div className="max-w-xl mx-auto relative px-6">
                <div className="absolute top-[18px] left-6 right-6 h-0.5 bg-slate-100 rounded-full -z-10" />
                <motion.div initial={{ width: 0 }} animate={{ width: `${((currentStep - 1) / 3) * 100}%` }} className="absolute top-[18px] left-6 h-0.5 bg-primary rounded-full -z-10 transition-all duration-1000 ease-in-out" />

                <div className="flex justify-between items-center">
                    {STEPS.map((s) => (
                        <div key={s.id} className="flex flex-col items-center gap-2">
                            <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center border-2 transition-all duration-700 ${s.id === currentStep || s.id < currentStep ? 'bg-primary border-white text-white shadow-lg shadow-primary/20 scale-110' : 'bg-white border-slate-50 text-slate-200'}`}>
                                {s.id < currentStep ? <Check className="w-4 h-4" /> : <s.icon className={`w-4 h-4 ${s.id === currentStep ? 'text-white' : 'text-slate-300'}`} />}
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${s.id === currentStep ? 'text-primary' : 'text-slate-300'}`}>{s.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <GlassCard key="main-container" className="border-none shadow-[0_24px_80px_-16px_rgba(0,0,0,0.06)] rounded-[48px] overflow-hidden relative bg-white" hoverEffect={false}>
                    <div className="relative min-h-[400px]">
                        {currentStep > 1 && (
                            <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                onClick={handleBack} className="absolute left-6 top-6 p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 transition-all z-20">
                                <ArrowLeft className="w-5 h-5" />
                            </motion.button>
                        )}
                        <div className="p-8 pb-10">{renderStepContent()}</div>
                    </div>
                </GlassCard>
            </AnimatePresence>
        </div>
    );
}
