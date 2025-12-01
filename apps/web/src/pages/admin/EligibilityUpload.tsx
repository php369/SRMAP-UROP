import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, GlowButton, Badge } from '../../components/ui';
import { fadeUp, staggerContainer, staggerItem } from '../../utils/animations';
import { apiClient } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

type UserType = 'student' | 'faculty';
type ProjectType = 'IDP' | 'UROP' | 'CAPSTONE';

export function EligibilityUpload() {
    const { user } = useAuth();
    const [userType, setUserType] = useState<UserType>('student');
    const [projectType, setProjectType] = useState<ProjectType>('IDP');
    const [csvData, setCsvData] = useState('');
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setCsvData(event.target?.result as string);
            };
            reader.readAsText(file);
        }
    };

    const handleUpload = async () => {
        if (!csvData) {
            setError('Please select a CSV file');
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
            } else {
                setError(response.error?.message || 'Upload failed');
            }
        } catch (err: any) {
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
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

                            {/* CSV Preview */}
                            {csvData && (
                                <div>
                                    <label className="block text-sm font-medium text-text mb-2">
                                        Preview & Edit
                                    </label>
                                    <textarea
                                        value={csvData}
                                        onChange={(e) => setCsvData(e.target.value)}
                                        rows={10}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            )}

                            {/* Upload Button */}
                            <GlowButton
                                onClick={handleUpload}
                                loading={uploading}
                                disabled={!csvData || uploading}
                                variant="primary"
                                glow
                                className="w-full"
                            >
                                {uploading ? 'Uploading...' : `Upload ${projectType} ${userType === 'student' ? 'Students' : 'Faculty'} List`}
                            </GlowButton>
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
