import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, GlowButton, Badge } from '../../components/ui';
import { fadeUp, staggerContainer, staggerItem } from '../../utils/animations';
import { apiClient } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

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

export function EligibilityUpload() {
    const { user } = useAuth();
    const [userType, setUserType] = useState<UserType>('student');
    const [projectType, setProjectType] = useState<ProjectType>('IDP');
    const [csvData, setCsvData] = useState('');
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const validateCSV = (csvContent: string): ValidationResult => {
        const lines = csvContent.trim().split('\n');
        if (lines.length < 2) {
            return {
                valid: false,
                rows: [],
                totalRows: 0,
                validRows: 0,
                invalidRows: 0
            };
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const expectedHeaders = userType === 'student' 
            ? ['email', 'regno', 'year', 'semester']
            : ['email', 'facultyid', 'department'];

        const rows: ParsedRow[] = [];
        let validCount = 0;
        let invalidCount = 0;

        // Validate headers
        const headerErrors: string[] = [];
        expectedHeaders.forEach(expected => {
            if (!headers.includes(expected)) {
                headerErrors.push(`Missing column: ${expected}`);
            }
        });

        // Validate each data row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',').map(v => v.trim());
            const rowData: Record<string, string> = {};
            const rowErrors: string[] = [...headerErrors];

            headers.forEach((header, index) => {
                rowData[header] = values[index] || '';
            });

            // Validate email
            if (!rowData.email || !rowData.email.endsWith('@srmap.edu.in')) {
                rowErrors.push('Invalid email (must end with @srmap.edu.in)');
            }

            if (userType === 'student') {
                // Validate year
                const year = parseInt(rowData.year);
                if (!year || ![2, 3, 4].includes(year)) {
                    rowErrors.push('Year must be 2, 3, or 4');
                }

                // Validate semester
                const semester = parseInt(rowData.semester);
                if (!semester || ![3, 4, 7, 8].includes(semester)) {
                    rowErrors.push('Semester must be 3, 4, 7, or 8');
                }

                // Validate regno
                if (!rowData.regno) {
                    rowErrors.push('Registration number is required');
                }
            } else {
                // Validate faculty
                if (!rowData.facultyid) {
                    rowErrors.push('Faculty ID is required');
                }
                if (!rowData.department) {
                    rowErrors.push('Department is required');
                }
            }

            const isValid = rowErrors.length === 0;
            if (isValid) validCount++;
            else invalidCount++;

            rows.push({
                rowNumber: i,
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                setCsvData(content);
                const validation = validateCSV(content);
                setValidationResult(validation);
                setShowPreview(true);
                setError(null);
                setResult(null);
            };
            reader.readAsText(file);
        }
    };

    const handleUpload = async () => {
        if (!csvData) {
            setError('Please select a CSV file');
            return;
        }

        if (validationResult && !validationResult.valid) {
            setError(`Cannot upload: ${validationResult.invalidRows} invalid rows found. Please fix errors first.`);
            return;
        }

        setUploading(true);
        setError(null);
        setResult(null);

        try {
            const response = await apiClient.post(
                '/admin/eligibility/import',
                {
                    csvContent: csvData,
                    projectType,
                    userType
                }
            );

            if (response.success && response.data) {
                setResult(response.data);
                setShowPreview(false);
            } else {
                setError(response.error?.message || 'Upload failed');
            }
        } catch (err: any) {
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleReset = () => {
        setCsvData('');
        setValidationResult(null);
        setShowPreview(false);
        setResult(null);
        setError(null);
    };

    const getCSVFormatExample = () => {
        if (userType === 'student') {
            return `email,regno,year,semester
student1@srmap.edu.in,AP12345,2,3
student2@srmap.edu.in,AP12346,3,7
student3@srmap.edu.in,AP12347,4,7`;
        } else {
            return `email,facultyId,department
faculty1@srmap.edu.in,FAC001,Computer Science
faculty2@srmap.edu.in,FAC002,Electronics
faculty3@srmap.edu.in,FAC003,Mechanical`;
        }
    };

    const getFormatInstructions = () => {
        if (userType === 'student') {
            return (
                <>
                    <strong>⚠️ IMPORTANT: Column headers must be EXACTLY: email,regno,year,semester</strong>
                    <br />
                    <br />
                    • All emails must end with @srmap.edu.in
                    <br />
                    • Registration numbers (regno) typically start with "AP" (optional)
                    <br />
                    • Year: Must be 2, 3, or 4 (second, third, or fourth year)
                    <br />
                    • Semester: Must be 3, 4, 7, or 8
                    <br />
                    • Odd semesters (3, 7): Jan-May term
                    <br />
                    • Even semesters (4, 8): Aug-Dec term
                    <br />
                    • Select the Project Type (IDP/UROP/CAPSTONE) before uploading
                </>
            );
        } else {
            return (
                <>
                    • All emails must end with @srmap.edu.in
                    <br />
                    • Faculty ID is required (e.g., FAC001)
                    <br />
                    • Department name is required
                </>
            );
        }
    };

    return (
        <div className="min-h-screen p-8">
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="max-w-4xl mx-auto space-y-6"
            >
                {/* Header */}
                <motion.div variants={fadeUp}>
                    <h1 className="text-3xl font-bold text-text mb-2">
                        Eligibility Upload
                    </h1>
                    <p className="text-textSecondary">
                        Upload CSV files to manage student and faculty eligibility for projects
                    </p>
                </motion.div>

                {/* Upload Form */}
                <motion.div variants={staggerItem}>
                    <GlassCard variant="elevated" className="p-6">
                        <div className="space-y-6">
                            {/* Step 1: User Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-text mb-3">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold mr-2">
                                        1
                                    </span>
                                    Select User Type
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setUserType('student')}
                                        className={`flex-1 px-6 py-4 rounded-lg transition-all border-2 ${userType === 'student'
                                            ? 'bg-primary/20 border-primary text-primary'
                                            : 'bg-white/5 border-white/10 text-textSecondary hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                            <span className="font-semibold">Students</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setUserType('faculty')}
                                        className={`flex-1 px-6 py-4 rounded-lg transition-all border-2 ${userType === 'faculty'
                                            ? 'bg-primary/20 border-primary text-primary'
                                            : 'bg-white/5 border-white/10 text-textSecondary hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <span className="font-semibold">Faculty</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Step 2: Project Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-text mb-3">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold mr-2">
                                        2
                                    </span>
                                    Select Project Category
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['IDP', 'UROP', 'CAPSTONE'] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setProjectType(type)}
                                            className={`px-4 py-3 rounded-lg transition-all border-2 ${projectType === type
                                                ? 'bg-secondary/20 border-secondary text-secondary'
                                                : 'bg-white/5 border-white/10 text-textSecondary hover:bg-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <span className="font-semibold">{type}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Current Selection Badge */}
                            <div className="flex items-center gap-2 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm text-text">
                                    Uploading eligibility for <span className="font-bold text-primary">{projectType}</span> {userType === 'student' ? 'Students' : 'Faculty'}
                                </span>
                            </div>

                            {/* CSV Format Info */}
                            <div className="bg-info/10 border border-info/30 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    CSV Format for {userType === 'student' ? 'Students' : 'Faculty'}
                                </h3>
                                <pre className="text-xs text-textSecondary font-mono bg-black/20 p-3 rounded overflow-x-auto">
                                    {getCSVFormatExample()}
                                </pre>
                                <p className="text-xs text-textSecondary mt-3">
                                    {getFormatInstructions()}
                                </p>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold mr-2">
                                        3
                                    </span>
                                    Upload CSV File
                                </label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="block w-full text-sm text-textSecondary
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-white
                    hover:file:bg-primary/90
                    file:cursor-pointer cursor-pointer"
                                />
                            </div>

                            {/* Validation Summary */}
                            <AnimatePresence>
                                {validationResult && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4"
                                    >
                                        {/* Summary Cards */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="text-center p-4 bg-white/5 border border-white/10 rounded-lg">
                                                <div className="text-2xl font-bold text-text">
                                                    {validationResult.totalRows}
                                                </div>
                                                <div className="text-xs text-textSecondary">Total Rows</div>
                                            </div>
                                            <div className="text-center p-4 bg-success/10 border border-success/30 rounded-lg">
                                                <div className="text-2xl font-bold text-success">
                                                    {validationResult.validRows}
                                                </div>
                                                <div className="text-xs text-textSecondary">Valid</div>
                                            </div>
                                            <div className="text-center p-4 bg-error/10 border border-error/30 rounded-lg">
                                                <div className="text-2xl font-bold text-error">
                                                    {validationResult.invalidRows}
                                                </div>
                                                <div className="text-xs text-textSecondary">Invalid</div>
                                            </div>
                                        </div>

                                        {/* Preview Toggle */}
                                        <button
                                            onClick={() => setShowPreview(!showPreview)}
                                            className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-text transition-all flex items-center justify-between"
                                        >
                                            <span className="font-medium">
                                                {showPreview ? 'Hide' : 'Show'} Data Preview
                                            </span>
                                            <svg
                                                className={`w-5 h-5 transition-transform ${showPreview ? 'rotate-180' : ''}`}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {/* Data Preview Table */}
                                        {showPreview && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
                                            >
                                                <div className="max-h-96 overflow-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-white/10 sticky top-0">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold text-text">Row</th>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold text-text">Status</th>
                                                                {userType === 'student' ? (
                                                                    <>
                                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-text">Email</th>
                                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-text">Reg No</th>
                                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-text">Year</th>
                                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-text">Semester</th>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-text">Email</th>
                                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-text">Faculty ID</th>
                                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-text">Department</th>
                                                                    </>
                                                                )}
                                                                <th className="px-3 py-2 text-left text-xs font-semibold text-text">Errors</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {validationResult.rows.map((row) => (
                                                                <tr
                                                                    key={row.rowNumber}
                                                                    className={`border-t border-white/5 ${
                                                                        row.valid ? 'bg-success/5' : 'bg-error/5'
                                                                    }`}
                                                                >
                                                                    <td className="px-3 py-2 text-textSecondary">{row.rowNumber}</td>
                                                                    <td className="px-3 py-2">
                                                                        {row.valid ? (
                                                                            <span className="inline-flex items-center gap-1 text-success">
                                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                                Valid
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1 text-error">
                                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                                Invalid
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    {userType === 'student' ? (
                                                                        <>
                                                                            <td className="px-3 py-2 text-text">{row.data.email}</td>
                                                                            <td className="px-3 py-2 text-text">{row.data.regno}</td>
                                                                            <td className="px-3 py-2 text-text">{row.data.year}</td>
                                                                            <td className="px-3 py-2 text-text">{row.data.semester}</td>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <td className="px-3 py-2 text-text">{row.data.email}</td>
                                                                            <td className="px-3 py-2 text-text">{row.data.facultyid}</td>
                                                                            <td className="px-3 py-2 text-text">{row.data.department}</td>
                                                                        </>
                                                                    )}
                                                                    <td className="px-3 py-2">
                                                                        {row.errors.length > 0 && (
                                                                            <div className="space-y-1">
                                                                                {row.errors.map((err, idx) => (
                                                                                    <div key={idx} className="text-xs text-error">
                                                                                        • {err}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                {csvData && (
                                    <button
                                        onClick={handleReset}
                                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-text transition-all"
                                    >
                                        Reset
                                    </button>
                                )}
                                <GlowButton
                                    onClick={handleUpload}
                                    loading={uploading}
                                    disabled={!csvData || uploading || (validationResult && !validationResult.valid)}
                                    variant="primary"
                                    glow
                                    className="flex-1"
                                >
                                    {uploading ? 'Uploading...' : `Upload ${validationResult?.validRows || 0} Records`}
                                </GlowButton>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Result */}
                {result && (
                    <motion.div variants={staggerItem}>
                        <GlassCard variant="elevated" className="p-6">
                            <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Upload Results
                            </h3>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center p-4 bg-success/10 border border-success/30 rounded-lg">
                                    <div className="text-3xl font-bold text-success">
                                        {result.result?.success || 0}
                                    </div>
                                    <div className="text-sm text-textSecondary">Successful</div>
                                </div>
                                <div className="text-center p-4 bg-error/10 border border-error/30 rounded-lg">
                                    <div className="text-3xl font-bold text-error">
                                        {result.result?.errors || 0}
                                    </div>
                                    <div className="text-sm text-textSecondary">Failed</div>
                                </div>
                                <div className="text-center p-4 bg-white/5 border border-white/10 rounded-lg">
                                    <div className="text-3xl font-bold text-text">
                                        {result.result?.total || 0}
                                    </div>
                                    <div className="text-sm text-textSecondary">Total</div>
                                </div>
                            </div>

                            {result.result?.errorDetails && result.result.errorDetails.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-error mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Errors:
                                    </h4>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {result.result?.errorDetails.map((err: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="text-xs text-error bg-error/10 px-3 py-2 rounded border border-error/30"
                                            >
                                                Row {err.row}: {err.email ? `${err.email} - ` : ''}{err.error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </GlassCard>
                    </motion.div>
                )}

                {/* Error */}
                {error && (
                    <motion.div variants={staggerItem}>
                        <GlassCard variant="elevated" className="p-4 bg-error/10 border-error/30">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-error">{error}</p>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
