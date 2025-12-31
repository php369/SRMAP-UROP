import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Github, Presentation, CheckCircle, Loader, AlertCircle, Users, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { validateGitHubURL, validatePDF, validatePPT, formatFileSize } from '../../utils/fileValidator';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { openPDFModal, downloadFile } from '../../utils/pdfUtils';
import { getCurrentSubmissionAssessmentType, isSubmissionOpenForAssessmentType } from '../../utils/assessmentHelper';
import { useWindowStatus } from '../../hooks/useWindowStatus';



export function SubmissionPage() {
  const { user } = useAuth();
  const { windows } = useWindowStatus();
  const [submissionWindow, setSubmissionWindow] = useState<any>(null);
  const [currentAssessmentType, setCurrentAssessmentType] = useState<'CLA-1' | 'CLA-2' | 'CLA-3' | 'External' | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<any>(null);
  const [userGroup, setUserGroup] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);
  const [eligibleProjectType, setEligibleProjectType] = useState<string | null>(null);

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
    const checkEligibility = async () => {
      try {
        // Wait for user data to be available
        if (!user?.role) {
          console.log('Waiting for user data...');
          return;
        }

        // Map role to project type
        const roleToProjectType: Record<string, string> = {
          'idp-student': 'IDP',
          'urop-student': 'UROP',
          'capstone-student': 'CAPSTONE'
        };

        const projectType = roleToProjectType[user.role];
        
        if (projectType) {
          setEligibleProjectType(projectType);
          console.log(`✅ User eligible for ${projectType} based on role: ${user.role}`);
        } else {
          toast.error('You are not eligible for any project type. Please contact admin.');
          console.error(`❌ Unknown role: ${user.role}`);
          setInitializing(false); // Stop loading if user is not eligible
        }
      } catch (error) {
        console.error('Error checking eligibility:', error);
        setInitializing(false);
      }
    };
    checkEligibility();
  }, [user?.role]);

  useEffect(() => {
    if (eligibleProjectType && windows.length > 0) {
      const initializeData = async () => {
        setInitializing(true);
        try {
          // Get current assessment type from active SUBMISSION windows (not assessment windows)
          const assessmentType = getCurrentSubmissionAssessmentType(windows, eligibleProjectType as 'IDP' | 'UROP' | 'CAPSTONE');
          setCurrentAssessmentType(assessmentType);
          
          // Only proceed if there's an active submission window for this project type
          if (assessmentType) {
            await Promise.all([
              checkSubmissionWindow(),
              checkUserRole()
            ]);
          } else {
            // No active submission window for this project type
            setSubmissionWindow(null);
          }
        } catch (error) {
          console.error('Error initializing submission data:', error);
        } finally {
          setInitializing(false);
        }
      };
      
      initializeData();
    }
  }, [eligibleProjectType, windows]);

  // Check for existing submission when user role and assessment type are determined
  useEffect(() => {
    console.log('User role and assessment type determined:', { userGroup, user: user?.id, currentAssessmentType });
    // Only check submissions after user role and assessment type are fully determined
    if (user?.id && !initializing && currentAssessmentType) {
      const timer = setTimeout(() => {
        checkExistingSubmission();
      }, 100); // Small delay to ensure state is settled
      
      return () => clearTimeout(timer);
    }
  }, [userGroup, user?.id, initializing, currentAssessmentType]);

  const checkSubmissionWindow = async () => {
    if (!eligibleProjectType || !currentAssessmentType) return;
    
    try {
      // Check if submission is open for the current assessment type
      const isOpen = isSubmissionOpenForAssessmentType(
        windows, 
        eligibleProjectType as 'IDP' | 'UROP' | 'CAPSTONE', 
        currentAssessmentType
      );
      
      if (isOpen) {
        setSubmissionWindow({ isActive: true, assessmentType: currentAssessmentType });
      } else {
        setSubmissionWindow(null);
      }
    } catch (error) {
      console.error('Error checking submission window:', error);
      setSubmissionWindow(null);
    }
  };

  const checkUserRole = async () => {
    try {
      console.log('🔍 Checking user role for user:', user?.id);
      
      // Check if user has an approved application using the new endpoint
      const approvedResponse = await api.get('/applications/approved');
      console.log('✅ Approved Application Response:', approvedResponse);
      
      if (approvedResponse.success && approvedResponse.data) {
        const approvedApp = approvedResponse.data as any;
        console.log('✅ Found approved application:', approvedApp);
        
        if (approvedApp.groupId) {
          // User is in a group - use the group data from the populated response
          const groupData = approvedApp.groupId as any;
          console.log('👥 User is in group:', groupData);
          setUserGroup(groupData);
          
          // Determine group leadership from the group data
          // Check if user is the group leader
          const groupLeaderId = groupData?.leaderId?._id || groupData?.leaderId;
          const isGroupLeader = groupLeaderId === user?.id || String(groupLeaderId) === String(user?.id);
          
          console.log('👑 Group Leadership Check:', {
            groupLeaderId: groupLeaderId,
            userId: user?.id,
            isLeader: isGroupLeader
          });
          
          setIsLeader(isGroupLeader);
        } else {
          // Solo application
          console.log('🚶 User has solo approved application');
          setUserGroup(null);
          setIsLeader(true);
        }
      } else {
        // No approved application found - check if user has any applications at all
        console.log('❌ No approved application found, checking all applications...');
        
        try {
          const applicationsResponse = await api.get('/applications/my-application');
          if (applicationsResponse.success && applicationsResponse.data && (applicationsResponse.data as any[]).length > 0) {
            console.log('📋 Found applications but none approved:', applicationsResponse.data);
            // User has applications but none are approved yet
            setUserGroup(null);
            setIsLeader(false); // Don't allow submission until approved
          } else {
            console.log('📋 No applications found at all');
            setUserGroup(null);
            setIsLeader(false); // Don't allow submission without application
          }
        } catch (appError) {
          console.error('❌ Error checking applications:', appError);
          setUserGroup(null);
          setIsLeader(false);
        }
      }
    } catch (error: any) {
      console.error('❌ Error checking user role:', error);
      console.log('📊 Error details:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message
      });
      
      // If 404, it means no approved application exists
      if (error?.response?.status === 404) {
        console.log('🚶 No approved application found (404)');
        setUserGroup(null);
        setIsLeader(false);
      } else {
        // Other errors - fallback to solo but don't allow submission
        console.log('🚶 Fallback: Error occurred, not allowing submission');
        setUserGroup(null);
        setIsLeader(false);
      }
    }
  };

  const checkExistingSubmission = async () => {
    if (!currentAssessmentType) return;
    
    try {
      let response;
      
      if (userGroup) {
        // Group student - check for submission with specific assessment type
        console.log('Checking group submission for group:', userGroup._id, 'assessment type:', currentAssessmentType);
        console.log('User is group leader:', isLeader);
        
        try {
          // Use the my/submissions endpoint with assessment type filter
          // Note: For CLA-1, there might not be any existing submissions, which is expected
          response = await api.get('/group-submissions/my/submissions', {
            assessmentType: currentAssessmentType
          });
          
          if (response.success && response.data) {
            console.log('✅ Found group submission for', currentAssessmentType, ':', response.data);
            setHasSubmitted(true);
            setCurrentSubmission(response.data);
            return;
          }
        } catch (error: any) {
          console.log('my/submissions failed:', error?.response?.status, error?.response?.data?.error);
          
          // For 404 errors, this is expected for new assessment types - no submission exists yet
          if (error?.response?.status === 404) {
            console.log('No existing submission found for', currentAssessmentType, '(expected for new assessment type)');
            setHasSubmitted(false);
            setCurrentSubmission(null);
            return;
          }
          
          // Second try: Direct group ID lookup with assessment type filter
          try {
            console.log('Trying direct group ID lookup with assessment type...');
            response = await api.get(`/group-submissions/${userGroup._id}`, {
              assessmentType: currentAssessmentType
            });
            
            if (response.success && response.data) {
              console.log('✅ Found group submission via direct lookup:', response.data);
              setHasSubmitted(true);
              setCurrentSubmission(response.data);
              return;
            }
          } catch (directError: any) {
            console.log('Direct lookup also failed:', directError?.response?.status, directError?.response?.data?.error);
            
            // 404 is expected for new assessment types
            if (directError?.response?.status === 404) {
              console.log('No existing submission found for', currentAssessmentType, '(expected for new assessment type)');
              setHasSubmitted(false);
              setCurrentSubmission(null);
              return;
            }
          }
        }
        
        // If both approaches fail with non-404 errors, log but don't block
        console.log('No group submission found for', currentAssessmentType);
        setHasSubmitted(false);
        setCurrentSubmission(null);
        
      } else {
        // Solo student - check regular submissions by student ID and assessment type
        console.log('Checking solo submission for user:', user?.id, 'assessment type:', currentAssessmentType);
        
        try {
          response = await api.get(`/submissions/student/${user?.id}`, {
            assessmentType: currentAssessmentType
          });
          
          if (response.success && response.data) {
            console.log('✅ Found solo submission for', currentAssessmentType, ':', response.data);
            setHasSubmitted(true);
            // Handle both single submission and array of submissions
            const submissionData = Array.isArray(response.data) ? response.data[0] : response.data;
            setCurrentSubmission(submissionData);
          }
        } catch (error: any) {
          // 404 means no submission exists for this assessment type, which is expected for new assessment types
          if (error?.response?.status === 404) {
            console.log('No existing submission found for', currentAssessmentType, '(expected for new assessment type)');
            setHasSubmitted(false);
            setCurrentSubmission(null);
          } else {
            console.error('Unexpected error checking solo submission:', error);
            // Don't block the UI for unexpected errors
            setHasSubmitted(false);
            setCurrentSubmission(null);
          }
        }
      }
    } catch (error: any) {
      console.error('Unexpected error in checkExistingSubmission:', error);
      // Don't block the UI - assume no submission exists
      setHasSubmitted(false);
      setCurrentSubmission(null);
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

    if (!currentAssessmentType) {
      toast.error('Assessment type not determined. Please refresh the page.');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      if (userGroup) {
        // Group submission - use group submissions endpoint
        console.log('Submitting as group leader for', currentAssessmentType);
        formDataToSend.append('groupId', userGroup._id);
        formDataToSend.append('githubUrl', formData.githubLink);
        formDataToSend.append('assessmentType', currentAssessmentType);
        formDataToSend.append('reportFile', formData.reportFile!);
        if (formData.pptFile) {
          formDataToSend.append('presentationFile', formData.pptFile);
        }

        console.log('Sending group submission data:', {
          groupId: userGroup._id,
          githubUrl: formData.githubLink,
          assessmentType: currentAssessmentType,
          hasReportFile: !!formData.reportFile,
          hasPresentationFile: !!formData.pptFile
        });

        var response = await api.post('/group-submissions', formDataToSend);
      } else {
        // Solo submission - use regular submissions endpoint
        console.log('Submitting as solo student for', currentAssessmentType);
        formDataToSend.append('studentId', user?.id || '');
        formDataToSend.append('githubUrl', formData.githubLink);
        formDataToSend.append('assessmentType', currentAssessmentType);
        formDataToSend.append('reportFile', formData.reportFile!);
        if (formData.pptFile) {
          formDataToSend.append('presentationFile', formData.pptFile);
        }

        console.log('Sending solo submission data:', {
          studentId: user?.id,
          githubUrl: formData.githubLink,
          assessmentType: currentAssessmentType,
          hasReportFile: !!formData.reportFile,
          hasPresentationFile: !!formData.pptFile
        });

        var response = await api.post('/submissions', formDataToSend);
      }
      console.log('Submission response:', response);

      if (response.success) {
        toast.success(`${currentAssessmentType} submission successful!`);
        setHasSubmitted(true);
        setCurrentSubmission(response.data);
        
        // Update group status if this was a group submission
        if (userGroup) {
          setUserGroup({ ...userGroup, status: 'frozen' });
        }
      } else {
        console.error('Submission failed with response:', response);
        toast.error((response as any).error || 'Failed to submit');
      }
    } catch (error: any) {
      console.error('Submission error details:', {
        error,
        message: error?.message,
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data
      });
      
      let errorMessage = 'Failed to submit';
      
      // Handle different error types
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Show user-friendly messages for different scenarios
      if (errorMessage.includes('already submitted')) {
        errorMessage = userGroup 
          ? 'Your group has already submitted. You cannot submit again.'
          : 'You have already submitted. You cannot submit again.';
      } else if (errorMessage.includes('not a member')) {
        errorMessage = 'You are not a member of this group.';
      } else if (errorMessage.includes('Only the group leader')) {
        errorMessage = 'Only the group leader can submit.';
      } else if (errorMessage.includes('GitHub URL is required')) {
        errorMessage = 'Please provide a valid GitHub URL.';
      } else if (errorMessage.includes('Either groupId or studentId is required')) {
        errorMessage = 'System error: Missing submission identifier. Please refresh and try again.';
      }
      
      toast.error(errorMessage);
      
      // Also show a generic error toast with more details for debugging
      if (error?.response?.status) {
        console.error(`HTTP ${error.response.status}: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while initializing
  if (initializing || !eligibleProjectType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!submissionWindow || !currentAssessmentType) {
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
            {!currentAssessmentType 
              ? `No active submission window for ${eligibleProjectType} students. Please check back later.`
              : 'The submission window is not currently active. Please check back later.'
            }
          </p>
        </motion.div>
      </div>
    );
  }

  // No need to check for userGroup - solo students don't have groups

  // Show message if user doesn't have permission to submit
  if (!isLeader && userGroup && !hasSubmitted) {
    // Group member (not leader) - show waiting message only if no submission exists
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <AlertCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Group Leader Submission</h2>
          <p className="text-gray-600 mb-4">
            Only the group leader can submit work. Please wait for your leader to submit.
          </p>
          
          <div className="p-4 bg-blue-50 rounded-lg mb-4">
            <p className="text-sm text-blue-700">
              <strong>Group:</strong> {(userGroup as any)?.groupName || (userGroup as any)?.groupCode}
            </p>
            <p className="text-sm text-blue-700">
              <strong>Status:</strong> {(userGroup as any)?.status}
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-yellow-700 text-sm">
              Waiting for group leader to submit...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isLeader && !userGroup) {
    // No approved application or not eligible
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Application Required</h2>
          <p className="text-gray-600 mb-4">
            You need an approved application before you can submit work.
          </p>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-yellow-700 text-sm">
              Please apply for a project first, and wait for approval before submitting work.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (hasSubmitted && currentSubmission) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">Submission Complete</h1>
            <p className="text-gray-600">
              Your {userGroup ? 'group' : 'individual'} submission for {submissionWindow.assessmentType} has been recorded.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            {/* Header Section */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    {userGroup ? (
                      <Users className="w-6 h-6 text-blue-500" />
                    ) : (
                      <User className="w-6 h-6 text-green-500" />
                    )}
                    {submissionWindow.assessmentType} Submission
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span>
                      Submitted on {new Date(currentSubmission.submittedAt || currentSubmission.createdAt).toLocaleDateString()}
                    </span>
                    {userGroup && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        Group: {userGroup.groupName || userGroup.groupCode}
                      </span>
                    )}
                    {!userGroup && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        Solo Submission
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-full">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Submitted</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Submitted Work</h4>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* GitHub Repository */}
                <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gray-800 rounded-lg">
                      <Github className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">GitHub Repository</h5>
                      <p className="text-xs text-gray-500">Source code</p>
                    </div>
                  </div>
                  <a
                    href={currentSubmission.githubUrl || currentSubmission.githubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Repository
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                {/* Report PDF */}
                {(currentSubmission.reportUrl || currentSubmission.reportFile?.url) && (
                  <div className="bg-red-50 rounded-lg p-4 hover:bg-red-100 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-red-600 rounded-lg">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-800">Project Report</h5>
                        <p className="text-xs text-gray-500">PDF document</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => openPDFModal(
                          currentSubmission.reportUrl || currentSubmission.reportFile?.url, 
                          'Project Report'
                        )}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => downloadFile(
                          currentSubmission.reportUrl || currentSubmission.reportFile?.url, 
                          currentSubmission.reportFile?.name || 'project-report.pdf'
                        )}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        ⬇️ Download
                      </button>
                    </div>
                  </div>
                )}

                {/* Presentation */}
                {(currentSubmission.pptUrl || currentSubmission.presentationFile?.url) && (
                  <div className="bg-orange-50 rounded-lg p-4 hover:bg-orange-100 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-orange-600 rounded-lg">
                        <Presentation className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-800">Presentation</h5>
                        <p className="text-xs text-gray-500">Slides</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => openPDFModal(
                          currentSubmission.pptUrl || currentSubmission.presentationFile?.url, 
                          'Presentation'
                        )}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => downloadFile(
                          currentSubmission.pptUrl || currentSubmission.presentationFile?.url, 
                          currentSubmission.presentationFile?.name || 'presentation.pdf'
                        )}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        ⬇️ Download
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-800 mb-2">Submission Details</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Submitted by:</strong> {currentSubmission.submittedBy?.name || user?.name}</p>
                  <p><strong>Submission time:</strong> {new Date(currentSubmission.submittedAt || currentSubmission.createdAt).toLocaleString()}</p>
                  {userGroup && !isLeader && (
                    <p className="text-blue-600 font-medium">
                      ℹ️ This submission was made by your group leader and is visible to all group members.
                    </p>
                  )}
                </div>
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
          
          {/* Submission Type Indicator */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            {userGroup ? (
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-blue-800 font-medium">
                    Submitting as Group Leader
                  </p>
                  <p className="text-blue-600 text-sm">
                    Group: {(userGroup as any)?.groupName || (userGroup as any)?.groupCode} ({(userGroup as any)?.members?.length || 0} members)
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-blue-800 font-medium">
                      Submitting as Individual Student
                    </p>
                    <p className="text-blue-600 text-sm">
                      Solo submission for {eligibleProjectType}
                    </p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    💡 <strong>Note:</strong> If you want to work in a group, please form or join a group in the Application page before submitting.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="space-y-6">
            {/* GitHub Link */}
            <div>
              <label className="mb-2 font-medium flex items-center gap-2">
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
              <label className="mb-2 font-medium flex items-center gap-2">
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
                <label className="mb-2 font-medium flex items-center gap-2">
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
