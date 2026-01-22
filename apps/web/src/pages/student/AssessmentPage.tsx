import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Github, Award, Clock, CheckCircle, AlertCircle, Users, MessageSquare, ArrowRight, Presentation } from 'lucide-react';
import { TimelineStatus } from './components/TimelineStatus';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import { toast } from 'sonner';
import { FinalGradeCard } from '../../components/assessment/FinalGradeCard';
import { openPDFModal, downloadFile } from '../../utils/pdfUtils';
import { GlassCard } from '../../components/ui/GlassCard';
import { AssessmentEmptyState } from '../../components/assessment/AssessmentEmptyState';
import { AssessmentSkeleton } from '../../components/assessment/AssessmentSkeleton';
import { useWindowStatus } from '../../hooks/useWindowStatus';
import { getCurrentAssessmentType } from '../../utils/assessmentHelper';

export function AssessmentPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [eligibleProjectType, setEligibleProjectType] = useState<string | null>(null);
  const { windows, loading: windowsLoading } = useWindowStatus();
  const [showHistory, setShowHistory] = useState(false);
  const [combinedEvaluation, setCombinedEvaluation] = useState<any>(null);

  const activeAssessmentType = eligibleProjectType
    ? getCurrentAssessmentType(windows, eligibleProjectType as any)
    : null;

  // Helper function to check if evaluation has any scores
  const hasAnyScores = (evaluation: any) => {
    if (!evaluation) return false;
    return (
      evaluation.internal.cla1.conduct > 0 ||
      evaluation.internal.cla2.conduct > 0 ||
      evaluation.internal.cla3.conduct > 0 ||
      evaluation.external.reportPresentation.conduct > 0
    );
  };

  // Helper function to check if evaluation is complete (all components graded)
  const isEvaluationComplete = (evaluation: any) => {
    if (!evaluation) return false;
    return (
      evaluation.internal.cla1.conduct > 0 &&
      evaluation.internal.cla2.conduct > 0 &&
      evaluation.internal.cla3.conduct > 0 &&
      evaluation.external.reportPresentation.conduct > 0
    );
  };

  useEffect(() => {
    const checkEligibility = async () => {
      try {
        setInitializing(true);
        // Map role to project type as a primary check
        const roleToProjectType: Record<string, string> = {
          'idp-student': 'IDP',
          'urop-student': 'UROP',
          'capstone-student': 'CAPSTONE',
          'idp': 'IDP',
          'urop': 'UROP',
          'capstone': 'CAPSTONE'
        };

        let projectType = user?.role ? roleToProjectType[user.role.toLowerCase()] : null;

        // If role doesn't strictly match, fetch student info to be sure (especially for groups)
        if (!projectType && user?.id) {
          try {
            const response = await api.get<any>('/students/me');
            if (response && response.success !== false && response.data) {
              const data = response.data;
              console.log('Student Info fetched:', data);

              // 1. Check assignedProjectId (populated object)
              if (data.assignedProjectId?.type) {
                projectType = data.assignedProjectId.type;
              } else if (data.assignedProjectId?.projectType) {
                projectType = data.assignedProjectId.projectType;
              }
              // 2. Check groupId (group project)
              else if (data.groupId?.assignedProjectId?.type) {
                projectType = data.groupId.assignedProjectId.type;
              } else if (data.groupId?.assignedProjectId?.projectType) {
                projectType = data.groupId.assignedProjectId.projectType;
              }
              // 3. Check directly on student object if not populated
              else if (data.projectType) {
                projectType = data.projectType;
              }
              // 4. Check projectId field if it's a project object
              else if (data.projectId?.projectType) {
                projectType = data.projectId.projectType;
              } else if (data.projectId?.type) {
                projectType = data.projectId.type;
              }
            }
          } catch (error) {
            console.error('Error fetching student info for eligibility:', error);
          }
        }

        if (projectType) {
          setEligibleProjectType(projectType);
          console.log(`✅ User eligible for ${projectType}`);
        } else if (user?.role) {
          // If we have a role but couldn't determine project type, show error
          toast.error('You are not eligible for any project type. Please contact admin.');
          console.error(`❌ Could not determine project type for role: ${user.role}`);
          setInitializing(false);
        }
      } catch (error) {
        console.error('Error checking eligibility:', error);
        setInitializing(false);
      }
    };
    checkEligibility();
  }, [user?.role, user?.id]);

  useEffect(() => {
    if (eligibleProjectType) {
      const initializeData = async () => {
        setInitializing(true);
        try {
          await fetchSubmissions();
        } catch (error) {
          console.error('Error initializing assessment data:', error);
        } finally {
          setInitializing(false);
        }
      };

      initializeData();
    }
  }, [eligibleProjectType]);

  // Removed checkAssessmentWindow as we use useWindowStatus hook now

  const fetchSubmissions = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch student evaluations (new CLA grading system)
      const evaluationsResponse = await api.get('/student-evaluations/my').catch(() => ({ success: false, evaluations: [] }));

      console.log('🔍 Evaluations Response:', evaluationsResponse);

      // Fetch both regular submissions and group submissions (legacy)
      // Note: For solo students, group-submissions/my/submissions will 404. We handle this gracefully.
      const [regularResponse, groupResponse] = await Promise.all([
        api.get<any>('/submissions/my').catch(err => {
          console.log('📡 Regular submissions fetch failed or 404:', err.message);
          return { success: false, data: [] };
        }),
        api.get<any>('/group-submissions/my/submissions').catch((error: any) => {
          console.log('📡 Group submissions fetch failed or 404 (expected for solo):', error.message);
          return { success: false, data: [] };
        })
      ]);

      console.log('🔍 Regular Response:', regularResponse);
      console.log('🔍 Group Response:', groupResponse);

      const allSubmissions: any[] = [];

      // Add student evaluations (new system)
      if (evaluationsResponse && evaluationsResponse.success !== false && (evaluationsResponse as any).evaluations) {
        const evaluations = Array.isArray((evaluationsResponse as any).evaluations) ? (evaluationsResponse as any).evaluations : [(evaluationsResponse as any).evaluations];
        console.log('📊 Processing evaluations:', evaluations);

        // Create a merged evaluation object for the overall journey timeline
        const merged: any = {
          internal: {
            cla1: { conduct: 0, convert: 0 },
            cla2: { conduct: 0, convert: 0 },
            cla3: { conduct: 0, convert: 0 }
          },
          external: {
            reportPresentation: { conduct: 0, convert: 0 }
          }
        };

        evaluations.forEach((evalData: any) => {
          if (evalData.evaluation) {
            const e = evalData.evaluation;
            console.log('📝 Evaluation record phase:', e.assessmentType);

            // Map authoritative record for each phase
            if (e.assessmentType === 'CLA-1') merged.internal.cla1 = e.internal.cla1;
            else if (e.assessmentType === 'CLA-2') merged.internal.cla2 = e.internal.cla2;
            else if (e.assessmentType === 'CLA-3') merged.internal.cla3 = e.internal.cla3;
            else if (e.assessmentType === 'External') merged.external.reportPresentation = e.external.reportPresentation;

            // Show all evaluations in history list
            allSubmissions.push({
              _id: e._id,
              submissionType: 'evaluation',
              assessmentType: e.assessmentType === 'External' ? 'External' : e.assessmentType,
              submittedAt: e.createdAt,
              groupId: e.groupId,
              projectId: e.projectId,
              isGradeReleased: e.isPublished,
              isGraded: e.isPublished || hasAnyScores(e),
              isComplete: isEvaluationComplete(e),
              finalGrade: e.isPublished ? e.total : null,
              total: e.isPublished ? e.total : null,
              evaluation: e,
              projectTitle: evalData.projectTitle || 'Project',
              groupCode: evalData.groupCode
            });
          }
        });

        // Only set combined evaluation if we found at least one valid record
        if (evaluations.some((e: any) => e.evaluation)) {
          setCombinedEvaluation(merged);
        }
      }

      // Add regular submissions (legacy)
      if (regularResponse && (regularResponse.success !== false)) {
        // Extract submissions list from various possible formats
        const data = regularResponse.data;
        let regularSubmissions: any[] = [];

        if (Array.isArray(data)) {
          regularSubmissions = data;
        } else if (data && Array.isArray((data as any).submissions)) {
          regularSubmissions = (data as any).submissions;
        } else if ((regularResponse as any).submissions && Array.isArray((regularResponse as any).submissions)) {
          regularSubmissions = (regularResponse as any).submissions;
        } else if (data && (data as any)._id) {
          regularSubmissions = [data];
        }

        console.log('📊 Processing regular submissions:', regularSubmissions.length);

        regularSubmissions.forEach(submission => {
          allSubmissions.push({
            ...submission,
            submissionType: 'solo',
            // Map solo student fields to match expected format
            assessmentType: submission.assessmentType || submission.assessmentTitle || 'CLA-1',
            githubLink: submission.githubLink || submission.githubUrl,
            reportUrl: submission.reportUrl || submission.reportFile?.url || (submission.files?.find((f: any) => f.type?.includes('pdf'))?.url),
            pptUrl: submission.pptUrl || submission.presentationFile?.url || submission.presentationUrl || (submission.files?.find((f: any) => f.type?.includes('presentation') || f.type?.includes('powerpoint'))?.url),
            submittedAt: submission.submittedAt || submission.createdAt,
            // Check if submission is actually graded
            isGraded: submission.isGraded || !!submission.facultyGrade || !!submission.facultyComments || submission.status === 'graded',
            isGradeReleased: submission.isGradeReleased || submission.gradeReleased || submission.status === 'graded'
          });
        });
      }

      // Add group submissions (legacy)
      if (groupResponse && (groupResponse.success !== false)) {
        const data = groupResponse.data;
        let groupSubmissions: any[] = [];

        if (Array.isArray(data)) {
          groupSubmissions = data;
        } else if (data && Array.isArray((data as any).submissions)) {
          groupSubmissions = (data as any).submissions;
        } else if ((groupResponse as any).submissions && Array.isArray((groupResponse as any).submissions)) {
          groupSubmissions = (groupResponse as any).submissions;
        } else if (data && (data as any)._id) {
          groupSubmissions = [data];
        }

        console.log('📊 Processing group submissions:', groupSubmissions.length);

        groupSubmissions.forEach(submission => {
          allSubmissions.push({
            ...submission,
            submissionType: 'group',
            // Map group submission fields to match expected format
            assessmentType: submission.assessmentType || submission.assessmentTitle || 'CLA-1',
            githubLink: submission.githubUrl || submission.githubLink,
            reportUrl: submission.reportFile?.url || (submission.files?.find((f: any) => f.type?.includes('pdf'))?.url),
            pptUrl: submission.presentationFile?.url || submission.presentationUrl || (submission.files?.find((f: any) => f.type?.includes('presentation') || f.type?.includes('powerpoint'))?.url),
            submittedAt: submission.submittedAt || submission.createdAt,
            // Check if submission is actually graded
            isGraded: submission.isGraded || !!submission.facultyGrade || !!submission.facultyComments || submission.status === 'graded',
            isGradeReleased: submission.isGradeReleased || submission.gradeReleased || submission.status === 'graded'
          });
        });
      }

      // Sort by submission date (most recent first)
      allSubmissions.sort((a, b) => {
        // First, prioritize by submission type: legacy submissions (solo/group) first, then evaluations
        if (a.submissionType !== 'evaluation' && b.submissionType === 'evaluation') {
          return -1; // a (legacy) comes before b (evaluation)
        }
        if (a.submissionType === 'evaluation' && b.submissionType !== 'evaluation') {
          return 1; // b (legacy) comes before a (evaluation)
        }
        // If same type, sort by date (most recent first)
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });

      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while initializing
  if (initializing || windowsLoading) {
    return (
      <div className="min-h-screen p-6 max-w-6xl mx-auto py-12">
        <AssessmentSkeleton />
      </div>
    );
  }

  // Handle case where user is not eligible or project type couldn't be determined
  if (!eligibleProjectType) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <AssessmentEmptyState
          title="Profile Incomplete"
          description="We couldn't determine your project type. This usually happens if you haven't been assigned to a project yet."
          icon="shield"
          theme="amber"
          subtitle="NOT ELIGIBLE"
        />
      </div>
    );
  }

  // Handle case where no active window and no submissions exist
  if (!activeAssessmentType && submissions.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <AssessmentEmptyState
          title="No Active Assessments"
          description="There are currently no active assessment windows, and no previous assessments were found for your account."
          icon="clock"
          theme="amber"
          subtitle="CLOSED"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6 max-w-6xl mx-auto py-12">
        <AssessmentSkeleton />
      </div>
    );
  }

  const evaluationSubmission = submissions.find(s => s.submissionType === 'evaluation');

  return (
    <div className="p-6 pb-8 pt-4">
      <div className="max-w-6xl mx-auto">
        {/* Assessment Journey Timeline - Simplified at top (Shown when not in history view) */}
        {!showHistory && combinedEvaluation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex justify-center"
          >
            <div className="w-full max-w-4xl px-4">
              <TimelineStatus evaluation={combinedEvaluation} />
            </div>
          </motion.div>
        )}

        {/* Active Window / Empty State (Shown when not in history view) */}
        {!activeAssessmentType && !showHistory && (
          <div className="mb-12 flex justify-center">
            <AssessmentEmptyState
              title="Assessment Window Closed"
              description="There are currently no active assessment windows. You can still review your past submissions and feedback below."
              icon="clock"
              theme="amber"
              subtitle="STATUS"
              action={
                <div className="flex justify-center w-full">
                  <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-2 px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    <ArrowRight className="w-4 h-4 text-amber-500" />
                    View Past Submissions & Feedback
                  </button>
                </div>
              }
            />
          </div>
        )}

        {/* Submissions Section (Sub-page View) */}
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <button
                onClick={() => setShowHistory(false)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-sm"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Journey
              </button>

              <div className="flex items-center gap-3 flex-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 whitespace-nowrap">
                  <FileText className="w-5 h-5 text-amber-500" /> Submission History
                </h2>
                <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>

            <div className="grid gap-6">
              {submissions.filter(s => s.submissionType !== 'evaluation').length === 0 ? (
                <div className="py-12 text-center">
                  <AssessmentEmptyState
                    title="No History Found"
                    description="No previous submission records are available for your account."
                    icon="file-text"
                    theme="amber"
                    subtitle="EMPTY"
                  />
                </div>
              ) : (
                submissions
                  .filter(s => s.submissionType !== 'evaluation')
                  .map((submission) => (
                    <GlassCard
                      key={submission._id}
                      className="overflow-hidden"
                    >
                      {/* Header Section */}
                      <div className="bg-amber-50/50 dark:bg-amber-500/5 p-6 border-b border-amber-100 dark:border-amber-500/10">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-slate-900 dark:text-slate-100">
                              {submission.submissionType === 'evaluation' ? (
                                <Award className="w-6 h-6 text-amber-500" />
                              ) : submission.submissionType === 'group' ? (
                                <Users className="w-6 h-6 text-amber-500" />
                              ) : (
                                <FileText className="w-6 h-6 text-amber-500" />
                              )}
                              {submission.assessmentType} Assessment
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                                <Clock className="w-3.5 h-3.5" />
                                {submission.submissionType === 'evaluation' ?
                                  (submission.isGradeReleased ? 'Released: ' : 'Created: ') :
                                  'Submitted: '}
                                <span className="text-slate-900 dark:text-white font-bold ml-1">
                                  {new Date(submission.submittedAt).toLocaleDateString()}
                                </span>
                              </span>
                              {(submission.groupId?.groupCode || submission.groupCode) && (
                                <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 px-2 py-1 rounded-full text-xs font-semibold border border-amber-200 dark:border-amber-500/30">
                                  Group: {submission.groupId?.groupCode || submission.groupCode}
                                </span>
                              )}
                              {submission.submissionType === 'solo' && (
                                <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 px-2 py-1 rounded-full text-xs font-semibold border border-amber-200 dark:border-amber-500/30">
                                  Solo Submission
                                </span>
                              )}
                              {submission.projectTitle && (
                                <span className="text-slate-500">
                                  Project: {submission.projectTitle}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {submission.isGradeReleased || submission.gradeReleased ? (
                              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-full border border-emerald-100">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">Graded</span>
                              </div>
                            ) : submission.isComplete ? (
                              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-full border border-amber-100">
                                <Clock className="w-5 h-5" />
                                <span className="font-medium">Awaiting Release</span>
                              </div>
                            ) : submission.submissionType === 'evaluation' && submission.isGraded ? (
                              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-full border border-amber-100">
                                <Clock className="w-5 h-5" />
                                <span className="font-medium">Partially Graded</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-500/5 px-3 py-2 rounded-full border border-amber-100 dark:border-amber-500/10">
                                <AlertCircle className="w-5 h-5" />
                                <span className="font-medium">Under Review</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-6">
                        {/* Submission Files - Enhanced */}
                        {submission.submissionType !== 'evaluation' && (
                          <div className="mb-8">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-amber-500" /> Submitted Artifacts
                            </h4>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* GitHub Repository */}
                              <div className="group bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-md transition-all relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-slate-900 group-hover:bg-amber-500 transition-colors" />
                                <div className="flex items-start justify-between mb-4 pl-3">
                                  <div>
                                    <h5 className="font-bold text-slate-800 dark:text-slate-200">GitHub Repo</h5>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">Source Code</p>
                                  </div>
                                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:scale-110 transition-transform">
                                    <Github className="w-5 h-5 text-slate-900 dark:text-white" />
                                  </div>
                                </div>
                                <div className="pl-3">
                                  <a
                                    href={submission.githubLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-all"
                                  >
                                    View Repository <ArrowRight className="w-4 h-4 ml-2" />
                                  </a>
                                </div>
                              </div>

                              {/* Report PDF */}
                              {submission.reportUrl && (
                                <div className="group bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-500/50 hover:shadow-md transition-all relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500 transition-colors" />
                                  <div className="flex items-start justify-between mb-4 pl-3">
                                    <div>
                                      <h5 className="font-bold text-slate-800 dark:text-slate-200">Project Report</h5>
                                      <p className="text-xs text-slate-500 font-medium mt-0.5">PDF Document</p>
                                    </div>
                                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg group-hover:scale-110 transition-transform">
                                      <FileText className="w-5 h-5 text-red-600 dark:text-red-500" />
                                    </div>
                                  </div>
                                  <div className="pl-3 grid grid-cols-2 gap-2">
                                    <button
                                      onClick={() => openPDFModal(submission.reportUrl, 'Project Report')}
                                      className="flex items-center justify-center py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold rounded-lg transition-colors"
                                    >
                                      View
                                    </button>
                                    <button
                                      onClick={() => downloadFile(submission.reportUrl, 'project-report.pdf')}
                                      className="flex items-center justify-center py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-lg transition-colors"
                                    >
                                      Download
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Presentation */}
                              {submission.pptUrl && (
                                <div className="group bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-orange-400 dark:hover:border-orange-500/50 hover:shadow-md transition-all relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 transition-colors" />
                                  <div className="flex items-start justify-between mb-4 pl-3">
                                    <div>
                                      <h5 className="font-bold text-slate-800 dark:text-slate-200">Presentation</h5>
                                      <p className="text-xs text-slate-500 font-medium mt-0.5">Slides Deck</p>
                                    </div>
                                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg group-hover:scale-110 transition-transform">
                                      <Presentation className="w-5 h-5 text-orange-600 dark:text-orange-500" />
                                    </div>
                                  </div>
                                  <div className="pl-3 grid grid-cols-2 gap-2">
                                    <button
                                      onClick={() => openPDFModal(submission.pptUrl, 'Presentation')}
                                      className="flex items-center justify-center py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm font-semibold rounded-lg transition-colors"
                                    >
                                      View
                                    </button>
                                    <button
                                      onClick={() => downloadFile(submission.pptUrl, 'presentation.pdf')}
                                      className="flex items-center justify-center py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-lg transition-colors"
                                    >
                                      Download
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Faculty Feedback Section */}
                        {submission.submissionType !== 'evaluation' && (
                          <div className="mb-6">
                            {submissions.some(s => s.submissionType === 'evaluation' && s.evaluation) && (() => {
                              const evaluation = submissions.find(s => s.submissionType === 'evaluation')?.evaluation;
                              let feedbackComment = '';
                              let feedbackTitle = '';

                              if (submission.assessmentType === 'CLA-1' && evaluation?.internal?.cla1?.comments) {
                                feedbackComment = evaluation.internal.cla1.comments;
                                feedbackTitle = 'CLA-1 Assessment Feedback';
                              } else if (submission.assessmentType === 'CLA-2' && evaluation?.internal?.cla2?.comments) {
                                feedbackComment = evaluation.internal.cla2.comments;
                                feedbackTitle = 'CLA-2 Assessment Feedback';
                              } else if (submission.assessmentType === 'CLA-3' && evaluation?.internal?.cla3?.comments) {
                                feedbackComment = evaluation.internal.cla3.comments;
                                feedbackTitle = 'CLA-3 Assessment Feedback';
                              } else if (submission.assessmentType === 'External' && evaluation?.external?.reportPresentation?.comments) {
                                feedbackComment = evaluation.external.reportPresentation.comments;
                                feedbackTitle = 'External Evaluation Feedback';
                              } else if (submission.facultyComments) {
                                feedbackComment = submission.facultyComments;
                                feedbackTitle = `${submission.assessmentType} Assessment Feedback`;
                              }

                              if (feedbackComment) {
                                return (
                                  <div>
                                    <h4 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                      <MessageSquare className="w-5 h-5 text-amber-500" />
                                      Faculty Feedback
                                    </h4>
                                    <div className="p-4 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border-l-4 border-amber-400">
                                      <h5 className="font-bold text-amber-700 dark:text-amber-400 mb-2 text-sm uppercase tracking-wider">{feedbackTitle}</h5>
                                      <p className="text-slate-700 dark:text-slate-300 text-sm italic">"{feedbackComment}"</p>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}

                        {/* Final Grade */}
                        <FinalGradeCard
                          totalScore={submission.finalGrade || submission.total || 0}
                          isReleased={submission.isGradeReleased}
                          className="mt-2"
                        />
                      </div>
                    </GlassCard>
                  ))
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}