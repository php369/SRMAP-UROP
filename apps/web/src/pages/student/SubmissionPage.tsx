import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Github, Presentation, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { validateGitHubURL, validatePDF, validatePPT, formatFileSize } from '../../utils/fileValidator';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';



export function SubmissionPage() {
  const { user } = useAuth();
  const [submissionWindow, setSubmissionWindow] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<any>(null);
  const [userGroup, setUserGroup] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);

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
    const initializeData = async () => {
      setInitializing(true);
      try {
        await Promise.all([
          checkSubmissionWindow(),
          checkUserRole()
        ]);
      } catch (error) {
        console.error('Error initializing submission data:', error);
      } finally {
        setInitializing(false);
      }
    };
    
    initializeData();
  }, []);

  // Check for existing submission when userGroup is loaded
  useEffect(() => {
    console.log('userGroup changed:', userGroup);
    if (userGroup?._id) {
      console.log('Checking for existing submission for group:', userGroup._id);
      checkExistingSubmission();
    }
  }, [userGroup]);

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
        setUserGroup(response.data);
        const groupLeaderId = (response.data as any)?.leaderId?._id || (response.data as any)?.leaderId;
        const userId = user?.id || (user as any)?._id; // Use user.id (not user._id)
        console.log('Group Leader ID:', groupLeaderId);
        console.log('Current User ID:', userId);
        console.log('Is Leader:', groupLeaderId === userId || String(groupLeaderId) === String(userId));
        setIsLeader(groupLeaderId === userId || String(groupLeaderId) === String(userId));
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
    // Wait for userGroup to be loaded
    if (!userGroup?._id) {
      return;
    }
    
    try {
      const response = await api.get(`/submissions/group/${userGroup._id}`);
      console.log('Submission check response:', response);
      
      // The response structure is { submission: {...} } directly, not wrapped in success/data
      const submission = (response as any).submission;
      console.log('Found submission:', submission);
      
      if (submission && submission._id) {
        setHasSubmitted(true);
        setCurrentSubmission(submission);
      } else {
        console.log('No valid submission found in response');
      }
    } catch (error: any) {
      // 404 means no submission exists, which is fine
      console.log('Submission check error:', error);
      if (error?.response?.status !== 404 && error?.message !== 'HTTP 404: Not Found') {
        console.error('Error checking existing submission:', error);
      }
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
    // Check if user is in a group
    if (!userGroup || !userGroup._id) {
      toast.error('You must create or join a group before submitting. Please go to the Groups page to create a group.');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('groupId', userGroup._id);
      formDataToSend.append('githubUrl', formData.githubLink);
      formDataToSend.append('reportFile', formData.reportFile!);
      if (formData.pptFile) {
        formDataToSend.append('presentationFile', formData.pptFile);
      }

      const response = await api.post('/submissions', formDataToSend);

      if (response.success) {
        toast.success('Submission successful!');
        setHasSubmitted(true);
        setCurrentSubmission(response.data);
      } else {
        toast.error(response.error?.message || 'Failed to submit');
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      let errorMessage = 'Failed to submit';
      
      // Handle different error types
      if (error?.message) {
        errorMessage = error.message;
      }
      
      // Show user-friendly messages
      if (errorMessage.includes('already submitted')) {
        errorMessage = 'Your group has already submitted. You cannot submit again.';
      } else if (errorMessage.includes('not a member')) {
        errorMessage = 'You are not a member of this group.';
      } else if (errorMessage.includes('Only the group leader')) {
        errorMessage = 'Only the group leader can submit.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while initializing
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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

  // Check if user doesn't have a group
  if (!userGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Group Required</h2>
          <p className="text-gray-600 mb-4">
            You need to create or join a group before you can submit your work.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Even if you're working solo, you need to create a group with just yourself as the leader.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
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
