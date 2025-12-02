import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Github, Presentation, CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { validateGitHubURL, validatePDF, validatePPT, formatFileSize } from '../../utils/fileValidator';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

type AssessmentType = 'A1' | 'A2' | 'A3' | 'External';

export function SubmissionPage() {
  const { user } = useAuth();
  const [submissionWindow, setSubmissionWindow] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<any>(null);

  const [formData, setFormData] = useState({
    githubLink: '',
    reportFile: null as File | null,
    pptFile: null as File | null
  });

  const [errors, setErrors] = useState({
    githubLink: '',
    reportFile: '',
    pptFile: ''
  });

  useEffect(() => {
    checkSubmissionWindow();
    checkUserRole();
    checkExistingSubmission();
  }, []);

  const checkSubmissionWindow = async () => {
    try {
      const response = await api.get('/windows/active', { 
        windowType: 'submission',
        projectType: 'IDP'
      });
      if (response.success && response.data) {
        setSubmissionWindow(response.data as any);
      }
    } catch (error) {
      console.error('Error checking submission window:', error);
      // Set default window for testing
      setSubmissionWindow({ isActive: true } as any);
    }
  };

  const checkUserRole = async () => {
    try {
      const response = await api.get('/groups/my-group');
      if (response.success && response.data) {
        setIsLeader((response.data as any).leaderId === user?._id);
      } else {
        // Solo student
        setIsLeader(true);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      // Default to true for solo students
      setIsLeader(true);
    }
  };

  const checkExistingSubmission = async () => {
    if (!user?._id) return;
    
    try {
      const response = await api.get(`/submissions/student/${user._id}`);
      if (response.success && response.data) {
        const submissions = response.data as any[];
        if (submissions.length > 0) {
          const latestSubmission = submissions[0];
          setHasSubmitted(true);
          setCurrentSubmission(latestSubmission);
        }
      }
    } catch (error) {
      console.error('Error checking existing submission:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      githubLink: '',
      reportFile: '',
      pptFile: ''
    };

    // Validate GitHub URL
    const githubValidation = validateGitHubURL(formData.githubLink);
    if (!githubValidation.valid) {
      newErrors.githubLink = githubValidation.error || '';
    }

    // Validate Report PDF
    if (!formData.reportFile) {
      newErrors.reportFile = 'Report PDF is required';
    } else {
      const pdfValidation = validatePDF(formData.reportFile);
      if (!pdfValidation.valid) {
        newErrors.reportFile = pdfValidation.error || '';
      }
    }

    // Validate PPT (required for External assessment)
    if (submissionWindow?.assessmentType === 'External') {
      if (!formData.pptFile) {
        newErrors.pptFile = 'PPT is required for External assessment';
      } else {
        const pptValidation = validatePPT(formData.pptFile);
        if (!pptValidation.valid) {
          newErrors.pptFile = pptValidation.error || '';
        }
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleFileChange = (type: 'report' | 'ppt', file: File | null) => {
    if (type === 'report') {
      setFormData({ ...formData, reportFile: file });
      if (file) {
        const validation = validatePDF(file);
        setErrors({ ...errors, reportFile: validation.error || '' });
      }
    } else {
      setFormData({ ...formData, pptFile: file });
      if (file) {
        const validation = validatePPT(file);
        setErrors({ ...errors, pptFile: validation.error || '' });
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('githubLink', formData.githubLink);
      formDataToSend.append('report', formData.reportFile!);
      if (formData.pptFile) {
        formDataToSend.append('ppt', formData.pptFile);
      }
      formDataToSend.append('projectType', 'IDP'); // Should be dynamic
      formDataToSend.append('assessmentType', submissionWindow.assessmentType);

      const response = await api.post('/submissions', formDataToSend);

      if (response.success) {
        toast.success('Submission successful!');
        setHasSubmitted(true);
        checkExistingSubmission();
      } else {
        toast.error(response.error?.message || 'Failed to submit');
      }
    } catch (error) {
      toast.error('Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  if (!submissionWindow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Submission Window Not Open</h2>
          <p className="text-gray-600">
            The submission window hasn't started yet. Please check back later.
          </p>
        </motion.div>
      </div>
    );
  }

  if (!isLeader) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Group Leader Submission</h2>
          <p className="text-gray-600">
            Only the group leader can submit work. Please wait for your leader to submit.
          </p>
          {hasSubmitted && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-medium">Your group leader has submitted!</p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  if (hasSubmitted && currentSubmission) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Submission Complete</h2>
              <p className="text-gray-600">
                Your submission for {submissionWindow.assessmentType} has been recorded.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-2">GitHub Repository</h3>
                <a
                  href={currentSubmission.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {currentSubmission.githubLink}
                </a>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-2">Report PDF</h3>
                <a
                  href={currentSubmission.reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  View Report
                </a>
              </div>

              {currentSubmission.pptUrl && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-bold mb-2">Presentation</h3>
                  <a
                    href={currentSubmission.pptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View Presentation
                  </a>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-2">Submitted At</h3>
                <p>{new Date(currentSubmission.submittedAt).toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">
            Submit Work - {submissionWindow.assessmentType}
          </h1>
          <p className="text-gray-600">
            Upload your project work for evaluation
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="space-y-6">
            {/* GitHub Link */}
            <div>
              <label className="block mb-2 font-medium flex items-center gap-2">
                <Github className="w-5 h-5" />
                GitHub Repository Link *
              </label>
              <input
                type="url"
                value={formData.githubLink}
                onChange={(e) => {
                  setFormData({ ...formData, githubLink: e.target.value });
                  const validation = validateGitHubURL(e.target.value);
                  setErrors({ ...errors, githubLink: validation.error || '' });
                }}
                placeholder="https://github.com/username/repository"
                className={`w-full px-4 py-3 border rounded-lg ${
                  errors.githubLink ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.githubLink && (
                <p className="text-red-500 text-sm mt-1">{errors.githubLink}</p>
              )}
            </div>

            {/* Report PDF */}
            <div>
              <label className="block mb-2 font-medium flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Report PDF * (Max 10MB)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange('report', e.target.files?.[0] || null)}
                  className="hidden"
                  id="report-upload"
                />
                <label htmlFor="report-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  {formData.reportFile ? (
                    <div>
                      <p className="font-medium">{formData.reportFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(formData.reportFile.size)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-600">Click to upload PDF</p>
                  )}
                </label>
              </div>
              {errors.reportFile && (
                <p className="text-red-500 text-sm mt-1">{errors.reportFile}</p>
              )}
            </div>

            {/* PPT (External only) */}
            {submissionWindow.assessmentType === 'External' && (
              <div>
                <label className="block mb-2 font-medium flex items-center gap-2">
                  <Presentation className="w-5 h-5" />
                  Presentation (PPT/PPTX) * (Max 50MB)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".ppt,.pptx"
                    onChange={(e) => handleFileChange('ppt', e.target.files?.[0] || null)}
                    className="hidden"
                    id="ppt-upload"
                  />
                  <label htmlFor="ppt-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    {formData.pptFile ? (
                      <div>
                        <p className="font-medium">{formData.pptFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(formData.pptFile.size)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-600">Click to upload PPT/PPTX</p>
                    )}
                  </label>
                </div>
                {errors.pptFile && (
                  <p className="text-red-500 text-sm mt-1">{errors.pptFile}</p>
                )}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload />
                  Submit Work
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
