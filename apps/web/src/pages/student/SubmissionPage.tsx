import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Github, Presentation, CheckCircle, Loader, AlertCircle, Users, User, ArrowRight, Shield, Calendar, Info, FileUp, Sparkles, LogOut, ExternalLink, Trash2, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { validateGitHubURL, validatePDF, validatePPT, formatFileSize } from '../../utils/fileValidator';
import { api } from '../../utils/api';
import { toast } from 'sonner';
import { openPDFModal, downloadFile } from '../../utils/pdfUtils';
import { getCurrentSubmissionAssessmentType, isSubmissionOpenForAssessmentType } from '../../utils/assessmentHelper';
import { useWindowStatus } from '../../hooks/useWindowStatus';
import { SubmissionEmptyState } from './components/SubmissionEmptyState';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/label';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '../../utils/cn';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

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
    // We stay in initializing state if windows is still loading or if we have an eligible project type but no windows data yet
    if (eligibleProjectType) {
      if (loading) {
        setInitializing(true);
        return;
      }

      if (windows.length > 0) {
        const initializeData = async () => {
          setInitializing(true);
          try {
            const now = new Date();
            console.log(`🔍 Initializing submission data for ${eligibleProjectType}...`);

            // DIRECT WINDOW SEARCH
            const activeSubmissionWindow = windows.find(window =>
              window.windowType === 'submission' &&
              window.projectType === (eligibleProjectType as 'IDP' | 'UROP' | 'CAPSTONE') &&
              window.assessmentType &&
              new Date(window.startDate) <= now &&
              new Date(window.endDate) >= now
            );

            if (activeSubmissionWindow) {
              const assessmentType = activeSubmissionWindow.assessmentType as 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External';

              // Set states
              setCurrentAssessmentType(assessmentType);
              setSubmissionWindow({
                isActive: true,
                assessmentType,
                windowId: activeSubmissionWindow._id
              });

              await checkUserRole();
            } else {
              setSubmissionWindow(null);
              setCurrentAssessmentType(null);
            }
          } catch (error) {
            console.error('Error initializing submission data:', error);
          } finally {
            // Add a slight delay for smoother transition
            setTimeout(() => setInitializing(false), 500);
          }
        };

        initializeData();
      } else if (!loading && windows.length === 0) {
        // Only stop initializing if we are sure there are NO windows
        setInitializing(false);
      }
    }
  }, [eligibleProjectType, windows, loading]);

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

  // No longer needed: logic moved directly into initializeData to avoid race conditions
  /*
  const checkSubmissionWindow = async () => {
    ...
  };
  */

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

  if (initializing || !eligibleProjectType) {
    return (
      <div className="flex-1 flex flex-col p-6 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-4 w-24 bg-violet-200/50 dark:bg-violet-900/20" />
            </div>
            <Skeleton className="h-12 w-80 md:w-[450px] rounded-2xl" />
            <Skeleton className="h-4 w-64 md:w-[500px]" />
          </div>
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-16 w-32 rounded-3xl" />
            <Skeleton className="h-16 w-32 rounded-3xl" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-[400px] rounded-[2.5rem] border border-slate-100 dark:border-slate-800" />
          <Skeleton className="h-[400px] rounded-[2.5rem] border border-slate-100 dark:border-slate-800" />
        </div>

        {/* Global Shimmer Overlay */}
        <motion.div
          className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent skew-x-12" />
        </motion.div>
      </div>
    );
  }

  if (!submissionWindow || !currentAssessmentType) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh] p-6">
        <SubmissionEmptyState
          description={`No active submission window for ${eligibleProjectType} students.`}
          subDescription="The submission portal will unlock once the coordinator schedules the assessment window for your project type."
        />
      </div>
    );
  }

  // No need to check for userGroup - solo students don't have groups

  // Show message if user doesn't have permission to submit
  if (!isLeader && userGroup && !hasSubmitted) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh] p-6">
        <SubmissionEmptyState
          title="Group Leader Submission"
          description="Only the group leader is authorized to submit the work for your group."
          subDescription={`Please coordinate with your group leader to ensure the ${currentAssessmentType || 'assessment'} work is uploaded within the deadline.`}
        />
      </div>
    );
  }

  if (!isLeader && !userGroup) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh] p-6">
        <SubmissionEmptyState
          title="Application Required"
          description="You need an approved application before you can access the submission portal."
          subDescription="Please apply for a project first through the Application page and wait for coordinator approval."
        />
      </div>
    );
  }

  if (hasSubmitted && currentSubmission) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold tracking-tight uppercase text-sm">
              <Shield className="w-4 h-4" />
              <span>Assessment Portal</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Submission <span className="text-violet-600">Complete</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Your materials for {currentAssessmentType} have been successfully uploaded.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Status</p>
                <p className="text-lg font-black text-slate-900 dark:text-white leading-none">Accepted</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8 text-slate-800">
            <GlassCard className="p-8 border-violet-100 dark:border-violet-500/20">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-violet-100 dark:bg-violet-500/20 rounded-xl flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Submission Dossier</h3>
                  <p className="text-sm text-slate-500">Review your uploaded assessment materials</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* GitHub Card */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-500/30 transition-all group">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                        <Github className="w-6 h-6 text-slate-900 dark:text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Source Code</p>
                        <p className="text-base font-bold text-slate-900 dark:text-white truncate max-w-[200px] md:max-w-md">
                          {currentSubmission.githubUrl || currentSubmission.githubLink}
                        </p>
                      </div>
                    </div>
                    <a
                      href={currentSubmission.githubUrl || currentSubmission.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:text-violet-600 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>

                {/* Report Card */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-500/30 transition-all group">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Report</p>
                        <p className="text-base font-bold text-slate-900 dark:text-white">Research_Report.pdf</p>
                      </div>
                    </div>
                    <button
                      onClick={() => openPDFModal(currentSubmission.reportUrl || currentSubmission.reportFile?.url)}
                      className="px-4 py-2 bg-violet-600 text-white rounded-xl shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-colors font-bold text-sm"
                    >
                      View Report
                    </button>
                  </div>
                </div>

                {/* PPT Card (if exists) */}
                {(currentSubmission.pptUrl || currentSubmission.presentationFile?.url) && (
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-500/30 transition-all group">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                          <Presentation className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Presentation</p>
                          <p className="text-base font-bold text-slate-900 dark:text-white">Presentation_Deck.pptx</p>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadFile(currentSubmission.pptUrl || currentSubmission.presentationFile?.url, `Presentation_${currentAssessmentType}.pptx`)}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl shadow-sm hover:bg-slate-50 transition-colors font-bold text-sm"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          <div className="space-y-8">
            <GlassCard className="p-6 border-violet-100 dark:border-violet-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                <Shield className="w-32 h-32" />
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white mb-6">Submission Details</h4>
              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted On</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {new Date(currentSubmission.submittedAt || currentSubmission.createdAt).toLocaleDateString('en-US', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitter</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {isLeader ? 'You (Team Leader)' : 'Team Leader'}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-4 bg-violet-50 dark:bg-violet-500/10 rounded-2xl border border-violet-100 dark:border-violet-500/20">
                    <p className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase mb-2">Notice</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      Submissions are final for this phase. Contact your coordinator for any correction requests.
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {currentAssessmentType} <span className="text-violet-600">Material</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Upload your project deliverables for the upcoming {currentAssessmentType} assessment window.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-4 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">Window Type</p>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-none capitalize">{submissionWindow.assessmentType}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-8 h-full border-slate-200/60 transition-all hover:bg-white/50">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-500/20 rounded-xl flex items-center justify-center text-violet-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Collaboration Info</h3>
                <p className="text-sm text-slate-500">How your work will be submitted</p>
              </div>
            </div>

            {userGroup ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-800">
                    <Shield className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Group Identity</p>
                    <p className="text-base font-bold text-indigo-800 dark:text-indigo-300">
                      {userGroup.groupName || userGroup.groupCode}
                    </p>
                  </div>
                </div>

                <div className="relative group p-6 rounded-[2rem] bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100/50 dark:border-violet-500/10 overflow-hidden transition-all hover:bg-violet-50 dark:hover:bg-violet-900/20">
                  <div className="absolute top-0 right-0 -mr-4 -mt-4 text-violet-500/5 transition-transform group-hover:scale-110">
                    <Shield className="w-24 h-24" />
                  </div>
                  <div className="relative z-10 flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-violet-600 border border-violet-100/50 dark:border-violet-800">
                      <Info className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-violet-900 dark:text-violet-200 tracking-tight">Collaborative Submission</p>
                      <p className="text-xs text-violet-700/70 dark:text-violet-400/70 font-medium leading-relaxed max-w-[200px]">
                        As the group leader, your submission will represent the collective work of all team members.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-800">
                    <User className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Student Identity</p>
                    <p className="text-base font-bold text-indigo-800 dark:text-indigo-300">
                      Individual Student
                    </p>
                  </div>
                </div>

                <div className="relative group p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100/50 dark:border-slate-800/10 overflow-hidden transition-all hover:bg-slate-50 dark:hover:bg-slate-900/20">
                  <div className="absolute top-0 right-0 -mr-4 -mt-4 text-slate-500/5 transition-transform group-hover:scale-110">
                    <User className="w-24 h-24" />
                  </div>
                  <div className="relative z-10 flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-slate-600 border border-slate-100/50 dark:border-slate-800">
                      <Info className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-900 dark:text-slate-200 tracking-tight">Solo Submission</p>
                      <p className="text-xs text-slate-500/70 dark:text-slate-400/70 font-medium leading-relaxed max-w-[200px]">
                        You are submitting this work as an individual. Group formation is locked once submissions begin.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-8 h-full border-slate-200/60 transition-all hover:bg-white/50">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-500/20 rounded-xl flex items-center justify-center text-violet-600">
                <FileUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Submission Form</h3>
                <p className="text-sm text-slate-500">Provide required project artifacts</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* GitHub Link */}
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest">GitHub Repository Link *</Label>
                <div className="relative group">
                  <div className="absolute left-3 top-2.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 group-focus-within:text-violet-600 transition-colors">
                    <Github className="w-4 h-4" />
                  </div>
                  <Input
                    type="url"
                    value={formData.githubLink}
                    onChange={(e) => {
                      setFormData({ ...formData, githubLink: e.target.value });
                      const validation = validateGitHubURL(e.target.value);
                      setErrors({ ...errors, githubLink: validation.error || '' });
                    }}
                    placeholder="https://github.com/username/repository"
                    className={cn(
                      "pl-12 h-12 border-slate-200 dark:border-slate-800 focus-visible:ring-violet-500 focus-visible:border-violet-500 rounded-xl",
                      errors.githubLink && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                </div>
                {errors.githubLink && (
                  <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.githubLink}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Report PDF */}
                <div className="space-y-2">
                  <Label className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest">Report PDF *</Label>
                  <div
                    className={cn(
                      "relative border-2 border-dashed rounded-2xl p-6 transition-all group flex flex-col items-center justify-center text-center cursor-pointer",
                      formData.reportFile
                        ? "border-violet-500 bg-violet-50/50 dark:bg-violet-500/10"
                        : "border-slate-200 dark:border-slate-800 hover:border-violet-400 hover:bg-slate-50 dark:hover:bg-slate-900/50",
                      errors.reportFile && "border-red-500 bg-red-50 dark:bg-red-500/10"
                    )}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange('report', e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-sm transition-transform group-hover:scale-110",
                      formData.reportFile ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    )}>
                      {formData.reportFile ? <CheckCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                    </div>
                    {formData.reportFile ? (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                          {formData.reportFile.name}
                        </p>
                        <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                          {formatFileSize(formData.reportFile.size)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Upload Report</p>
                    )}
                  </div>
                  {errors.reportFile && (
                    <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.reportFile}</p>
                  )}
                </div>

                {/* PPT (External only) */}
                {submissionWindow.assessmentType === 'External' ? (
                  <div className="space-y-2">
                    <Label className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest">Presentation PPT *</Label>
                    <div
                      className={cn(
                        "relative border-2 border-dashed rounded-2xl p-6 transition-all group flex flex-col items-center justify-center text-center cursor-pointer",
                        formData.pptFile
                          ? "border-violet-500 bg-violet-50/50 dark:bg-violet-500/10"
                          : "border-slate-200 dark:border-slate-800 hover:border-violet-400 hover:bg-slate-50 dark:hover:bg-slate-900/50",
                        errors.pptFile && "border-red-500 bg-red-50 dark:bg-red-500/10"
                      )}
                    >
                      <input
                        type="file"
                        accept=".ppt,.pptx"
                        onChange={(e) => handleFileChange('ppt', e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-sm transition-transform group-hover:scale-110",
                        formData.pptFile ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      )}>
                        {formData.pptFile ? <CheckCircle className="w-6 h-6" /> : <Presentation className="w-6 h-6" />}
                      </div>
                      {formData.pptFile ? (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                            {formData.pptFile.name}
                          </p>
                          <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                            {formatFileSize(formData.pptFile.size)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Upload PPT</p>
                      )}
                    </div>
                    {errors.pptFile && (
                      <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.pptFile}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center opacity-50">
                    <Clock className="w-6 h-6 text-slate-400 mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Not Required</p>
                    <p className="text-[9px] text-slate-400/80 font-medium px-2 italic">PPT is only required for External Review phase</p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl shadow-xl shadow-violet-600/20 text-lg font-black tracking-tight transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Processing Submission...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Upload className="w-5 h-5" />
                    <span>Upload & Submit Work</span>
                  </div>
                )}
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
