import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Github, Presentation, CheckCircle, Loader, AlertCircle, Users, User, ArrowRight, Shield, Calendar, Info, FileUp, Sparkles, LogOut, ExternalLink, Trash2, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { validateGitHubURL, validatePDF, validatePPT, formatFileSize } from '../../utils/fileValidator';
import { api } from '../../utils/api';
import { toast } from 'sonner';
import { openPDFModal, downloadFile } from '../../utils/pdfUtils';
import { getCurrentSubmissionAssessmentType, isSubmissionOpenForAssessmentType } from '../../utils/assessmentHelper';
import { useWindowStatus } from '../../hooks/useWindowStatus';
import { SubmissionEmptyState } from './components/SubmissionEmptyState';
import { ContextInfoRow, Confetti, RepoChip, SubmissionProgress } from './components/SubmissionComponents';
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
  const { windows, loading: loadingWindows } = useWindowStatus();
  const [submissionWindow, setSubmissionWindow] = useState<any>(null);
  const [currentAssessmentType, setCurrentAssessmentType] = useState<'CLA-1' | 'CLA-2' | 'CLA-3' | 'External' | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<any>(null);
  const [userGroup, setUserGroup] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);
  const [eligibleProjectType, setEligibleProjectType] = useState<string | null>(null);
  const [lastSubmissionWindow, setLastSubmissionWindow] = useState<any>(null);
  const [activeAssessmentWindow, setActiveAssessmentWindow] = useState<any>(null);

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

  // Consolidated Initialization Effect
  useEffect(() => {
    let mounted = true;

    const initializePage = async () => {
      // 1. Wait for critical dependencies
      if (!user?.role || loadingWindows) {
        console.log('⏳ Waiting for user role or windows...');
        return;
      }

      try {
        setInitializing(true);

        // 2. Check Eligibility
        const roleToProjectType: Record<string, string> = {
          'idp-student': 'IDP',
          'urop-student': 'UROP',
          'capstone-student': 'CAPSTONE'
        };
        const projectType = roleToProjectType[user.role];

        if (!projectType) {
          console.error(`❌ Unknown role: ${user.role}`);
          toast.error('You are not eligible for any project type.');
          setInitializing(false);
          return;
        }

        setEligibleProjectType(projectType);
        console.log(`✅ User eligible for ${projectType}`);

        // 3. Check Active Window
        // Use a direct windows check instead of waiting for another effect
        const now = new Date();
        const activeSubmissionWindow = windows.find(window =>
          window.windowType === 'submission' &&
          window.projectType === (projectType as 'IDP' | 'UROP' | 'CAPSTONE') &&
          window.assessmentType &&
          new Date(window.startDate) <= now &&
          new Date(window.endDate) >= now
        );

        if (!activeSubmissionWindow) {
          console.log('❌ No active submission window found');
          setSubmissionWindow(null);

          // Check for recently ended window
          const recentlyEndedWindow = windows
            .filter(window =>
              window.windowType === 'submission' &&
              window.projectType === (projectType as 'IDP' | 'UROP' | 'CAPSTONE') &&
              window.assessmentType &&
              new Date(window.endDate) < now
            )
            .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];

          if (recentlyEndedWindow) {
            console.log('ℹ️ Found recently ended window:', recentlyEndedWindow.assessmentType);
            setLastSubmissionWindow(recentlyEndedWindow);
            setCurrentAssessmentType(recentlyEndedWindow.assessmentType as any);

            // Check if there is an active assessment window for this assessment type
            const assessmentWindow = windows.find(window =>
              window.windowType === 'assessment' &&
              window.projectType === (projectType as 'IDP' | 'UROP' | 'CAPSTONE') &&
              window.assessmentType === recentlyEndedWindow.assessmentType &&
              new Date(window.startDate) <= now &&
              new Date(window.endDate) >= now
            );
            setActiveAssessmentWindow(assessmentWindow || null);
          } else {
            setCurrentAssessmentType(null);
            setActiveAssessmentWindow(null);
          }

          setInitializing(false);
          return;
        }

        const assessmentType = activeSubmissionWindow.assessmentType as 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External';
        console.log(`✅ Found active window: ${assessmentType}`);

        // Update window state
        setSubmissionWindow({
          isActive: true,
          assessmentType,
          windowId: activeSubmissionWindow._id
        });
        setCurrentAssessmentType(assessmentType);

        // 4. Check User Role & Group Status
        // Inline the logic from checkUserRole to ensure sequential execution
        let currentUserGroup = null;
        let isGroupLeader = false;

        try {
          const approvedResponse = await api.get('/applications/approved');
          if (approvedResponse.success && approvedResponse.data) {
            const approvedApp = approvedResponse.data as any;
            if (approvedApp.groupId) {
              currentUserGroup = approvedApp.groupId;
              const groupLeaderId = currentUserGroup?.leaderId?._id || currentUserGroup?.leaderId;
              isGroupLeader = groupLeaderId === user.id || String(groupLeaderId) === String(user.id);
            } else {
              // Solo
              currentUserGroup = null;
              isGroupLeader = true;
            }
          } else {
            // Check for applications to set state correctly even if not approved
            try {
              const applicationsResponse = await api.get('/applications/my-application');
              // Logic handles "Application Required" vs "Pending" mostly via the !isLeader && !userGroup check in render
            } catch (e) { /* ignore */ }
            currentUserGroup = null;
            isGroupLeader = false;
          }
        } catch (error: any) {
          console.log('Error fetching role:', error);
          currentUserGroup = null;
          isGroupLeader = false;
        }

        setUserGroup(currentUserGroup);
        setIsLeader(isGroupLeader);
        console.log('✅ User Role Determined:', { isGroupLeader, hasGroup: !!currentUserGroup });

        // 5. Check Existing Submission
        // Now that we have window + user role, check specifically for this phase
        if (assessmentType) {
          try {
            let submissionData = null;

            if (currentUserGroup) {
              // Check group submission
              try {
                const subResponse = await api.get('/group-submissions/my/submissions', { assessmentType });
                // Handle both single object and array responses
                if (subResponse.success && subResponse.data) {
                  const data = subResponse.data as any;
                  if (Array.isArray(data) && data.length > 0) {
                    submissionData = data[0]; // Take first submission
                  } else if (data && !Array.isArray(data) && data._id) {
                    submissionData = data; // Single object response
                  }
                }
              } catch (e: any) {
                if (e?.response?.status !== 404) {
                  // Fallback to direct lookup
                  try {
                    const directResponse = await api.get(`/group-submissions/${currentUserGroup._id}`, { assessmentType });
                    if (directResponse.success && directResponse.data) {
                      const data = directResponse.data as any;
                      if (Array.isArray(data) && data.length > 0) {
                        submissionData = data[0];
                      } else if (data && !Array.isArray(data) && data._id) {
                        submissionData = data;
                      }
                    }
                  } catch (e2) { }
                }
              }
            } else {
              // Check solo submission
              try {
                console.log('🔍 Checking solo submission for user:', user?.id, 'assessmentType:', assessmentType);
                const soloResponse = await api.get<any>(`/submissions/student/${user?.id}`, { assessmentType });
                if (soloResponse.success && soloResponse.data) {
                  // API returns an array, take the first/most recent submission
                  const submissions = Array.isArray(soloResponse.data) ? soloResponse.data : [soloResponse.data];
                  if (submissions.length > 0) {
                    submissionData = submissions[0];
                    console.log('✅ Found solo submission:', submissionData);
                  }
                }
              } catch (e: any) {
                // 404 is expected if no submission exists yet
                if (e?.response?.status !== 404) {
                  console.error('Error fetching solo submission:', e);
                }
              }
            }

            if (submissionData) {
              console.log('✅ Found existing submission during init');
              setHasSubmitted(true);
              setCurrentSubmission(submissionData);
              // Pre-fill form data just in case we need it or for read-only views
              // (though submitted view handles this differently)
            } else {
              console.log('ℹ️ No existing submission found');
              setHasSubmitted(false);
              setCurrentSubmission(null);
            }

          } catch (error) {
            console.error('Error checking submission:', error);
          }
        }

      } catch (error) {
        console.error('❌ Critical initialization error:', error);
      } finally {
        if (mounted) {
          // Add a small artificial delay to prevent flicker if everything was instan-cached
          // Only unblock UI once EVERYTHING is ready
          setTimeout(() => {
            if (mounted) setInitializing(false);
          }, 300);
        }
      }
    };

    initializePage();

    return () => { mounted = false; };
  }, [user?.role, windows, loadingWindows]);

  // No longer needed: logic moved directly into initializeData to avoid race conditions
  /*
  const checkSubmissionWindow = async () => {
    ...
  };
  */





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

  const getProgressStep = () => {
    if (hasSubmitted) return 3;
    const hasGithub = validateGitHubURL(formData.githubLink).valid;
    const hasReport = !!formData.reportFile;
    // For External, PPT is required. For others, it's optional/not required, so we consider it "done"
    const hasPPT = submissionWindow?.assessmentType === 'External' ? !!formData.pptFile : true;

    if (hasGithub && hasReport && hasPPT) return 2; // Ready to submit
    if (hasGithub) return 1; // Upload phase
    return 0; // Connect phase
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

  if (!submissionWindow) {
    const isRecentlyEnded = !!lastSubmissionWindow && !!activeAssessmentWindow;

    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-10rem)] p-6">
        <SubmissionEmptyState
          title={isRecentlyEnded ? "Submission Window Concluded" : "Submission Portal"}
          description={
            isRecentlyEnded
              ? `The submission window for ${currentAssessmentType} has ended. Your submitted work has been forwarded for further evaluation.`
              : `No active submission window for ${eligibleProjectType} students.`
          }
          subDescription={
            isRecentlyEnded
              ? `Feedback and assessment updates will be available on the Assessment page once the evaluation phase for ${currentAssessmentType} begins.`
              : "The submission portal will unlock once the coordinator schedules the submission window for your project type."
          }
        />
      </div>
    );
  }

  // No need to check for userGroup - solo students don't have groups

  // Show message if user doesn't have permission to submit
  if (!isLeader && userGroup && !hasSubmitted) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-10rem)] p-6">
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
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-10rem)] p-6">
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
      <div className="w-full max-w-6xl mx-auto pt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen">
        <Confetti isActive={true} />
        <ContextInfoRow userGroup={userGroup} isLeader={isLeader} />

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
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium border-l-2 border-violet-200 dark:border-violet-800 pl-3 mt-2 italic">
              Your submission has been locked for this phase and forwarded for evaluation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Status</p>
                <p className="text-lg font-black text-slate-900 dark:text-white leading-none">Received</p>
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
                      className="h-12 px-6 bg-violet-600 text-white rounded-xl shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-colors font-bold text-sm flex items-center justify-center"
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
            <GlassCard className="p-6 md:p-8 border-violet-100 dark:border-violet-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform">
                <Shield className="w-32 h-32" />
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white mb-4">Submission Details</h4>
              <div className="space-y-4 relative z-10">
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
                      {userGroup ? (isLeader ? `You (${user?.name})` : (userGroup.leaderId?.name || userGroup.leaderId?.fullName || 'Team Leader')) : 'You'}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-4 bg-violet-50 dark:bg-violet-500/10 rounded-2xl border border-violet-100 dark:border-violet-500/20">
                    <p className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase mb-2">Notice</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      Once submitted, your assessment materials are locked for this phase and cannot be modified.
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
    <div className="w-full relative px-6 md:px-8 pt-12 pb-6 mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Confetti isActive={hasSubmitted} />

      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          {currentAssessmentType} <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">Submission</span>
        </h1>
        <ContextInfoRow userGroup={userGroup} isLeader={isLeader} />
        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
          Upload your project deliverables for the upcoming {currentAssessmentType} assessment.
        </p>
      </div>

      <SubmissionProgress currentStep={getProgressStep()} />

      <div className="max-w-3xl mx-auto relative z-10">
        <GlassCard className="p-8 md:p-10 border-violet-100/50 dark:border-violet-500/20 shadow-2xl shadow-violet-500/5 hover:border-violet-200/50 transition-all duration-500">

          <div className="space-y-8">
            {/* GitHub Link */}
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest pl-1">GitHub Repository Link *</Label>
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
                    "pl-12 h-12 border-slate-200 dark:border-slate-800 focus-visible:ring-violet-500 focus-visible:border-violet-500 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 transition-all",
                    errors.githubLink && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500",
                    !errors.githubLink && formData.githubLink && "border-emerald-500/50 focus-visible:border-emerald-500"
                  )}
                />
                <RepoChip url={formData.githubLink} />
              </div>
              {errors.githubLink && (
                <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.githubLink}</p>
              )}
            </div>

            <div className={cn(
              "grid gap-6",
              submissionWindow.assessmentType === 'External' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
            )}>
              {/* Report PDF */}
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest pl-1">Report PDF *</Label>
                <div
                  className={cn(
                    "relative border-2 border-dashed rounded-2xl p-6 transition-all group flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden",
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
                    className="absolute inset-0 opacity-0 cursor-pointer z-30"
                  />

                  {/* Hover Replace Action */}
                  {formData.reportFile && (
                    <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-violet-600 font-bold text-xs uppercase tracking-wider">
                        <RefreshCw className="w-4 h-4" />
                        <span>Replace File</span>
                      </div>
                    </div>
                  )}

                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-sm transition-transform group-hover:scale-110 relative z-10",
                    formData.reportFile ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  )}>
                    {formData.reportFile ? <CheckCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  </div>
                  {formData.reportFile ? (
                    <div className="space-y-1 relative z-10">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                        {formData.reportFile.name}
                      </p>
                      <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                        {formatFileSize(formData.reportFile.size)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider relative z-10">Upload Report</p>
                  )}
                </div>
                {errors.reportFile && (
                  <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.reportFile}</p>
                )}
              </div>

              {/* PPT (External only) */}
              {submissionWindow.assessmentType === 'External' && (
                <div className="space-y-2">
                  <Label className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest pl-1">Presentation PPT *</Label>
                  <div
                    className={cn(
                      "relative border-2 border-dashed rounded-2xl p-6 transition-all group flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden",
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
                      className="absolute inset-0 opacity-0 cursor-pointer z-30"
                    />

                    {/* Hover Replace Action */}
                    {formData.pptFile && (
                      <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-violet-600 font-bold text-xs uppercase tracking-wider">
                          <RefreshCw className="w-4 h-4" />
                          <span>Replace File</span>
                        </div>
                      </div>
                    )}

                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-sm transition-transform group-hover:scale-110 relative z-10",
                      formData.pptFile ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    )}>
                      {formData.pptFile ? <CheckCircle className="w-6 h-6" /> : <Presentation className="w-6 h-6" />}
                    </div>
                    {formData.pptFile ? (
                      <div className="space-y-1 relative z-10">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                          {formData.pptFile.name}
                        </p>
                        <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                          {formatFileSize(formData.pptFile.size)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider relative z-10">Upload PPT</p>
                    )}
                  </div>
                  {errors.pptFile && (
                    <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.pptFile}</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 rounded-2xl flex gap-3 animate-in fade-in slide-in-from-bottom-2">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                <span className="font-bold">Important:</span> Once you submit, your work will be final for this assessment phase. No modifications or re-submissions can be made. Please verify all links and files before proceeding.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || getProgressStep() < 2}
              className={cn(
                "w-full h-14 rounded-2xl shadow-xl text-lg font-black tracking-tight transition-all mt-8 relative overflow-hidden group",
                loading || getProgressStep() < 2
                  ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 shadow-none border border-slate-200 dark:border-slate-800"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-violet-600/30 ring-offset-2 focus:ring-2 ring-violet-500"
              )}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Processing Submission...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {getProgressStep() < 2 ? (
                    <span>Complete required fields</span>
                  ) : (
                    <>
                      <span>Submit for Evaluation</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              )}
            </Button>
          </div>
        </GlassCard>
      </div >
    </div >
  );
}
