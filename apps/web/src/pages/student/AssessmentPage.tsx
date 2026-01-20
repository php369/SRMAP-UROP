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
        api.get<any>('/group-submissions/my/submissions').catch(err => {
          console.log('📡 Group submissions fetch failed or 404 (expected for solo):', err.message);
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

        evaluations.forEach((evalData: any) => {
          if (evalData.evaluation) {
            console.log('📝 Evaluation data:', evalData.evaluation);
            console.log('🔢 Has scores:', hasAnyScores(evalData.evaluation));
            console.log('✅ Is complete:', isEvaluationComplete(evalData.evaluation));
            console.log('📢 Is published:', evalData.evaluation.isPublished);

            // Show all evaluations, not just published ones
            allSubmissions.push({
              _id: evalData.evaluation._id,
              submissionType: 'evaluation',
              assessmentType: 'Final Grade',
              submittedAt: evalData.evaluation.createdAt,
              groupId: evalData.evaluation.groupId,
              projectId: evalData.evaluation.projectId,
              isGradeReleased: evalData.evaluation.isPublished,
              isGraded: evalData.evaluation.isPublished || hasAnyScores(evalData.evaluation),
              isComplete: isEvaluationComplete(evalData.evaluation),
              finalGrade: evalData.evaluation.isPublished ? evalData.evaluation.total : null,
              total: evalData.evaluation.isPublished ? evalData.evaluation.total : null,
              evaluation: evalData.evaluation, // Include full evaluation data
              // Add project info if available
              projectTitle: evalData.projectTitle || 'Project',
              groupCode: evalData.groupCode
            });
          }
        });
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
  if (initializing || windowsLoading || !eligibleProjectType) {
    return (
      <div className="min-h-screen p-6 max-w-6xl mx-auto py-12">
        <AssessmentSkeleton />
      </div>
    );
  }

  if (!activeAssessmentType && submissions.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <AssessmentEmptyState
          title="Assessment Window Not Open"
          description="There are no active assessment windows at the moment, and no previous assessments were found for your account."
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

  return (
    <div className="p-6 pb-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-500">
            Assessment
          </h1>
          <p className="text-slate-500 font-medium">
            View your submissions and grades
          </p>
        </motion.div>

        {/* Submissions */}
        <div className="grid gap-6">
          {submissions.length === 0 ? (
            <div className="py-12">
              <AssessmentEmptyState
                title="No Submissions Yet"
                description="Your submitted work and evaluations will appear here once available."
                icon="file-text"
                theme="amber"
                subtitle="DASHBOARD"
              />
            </div>
          ) : (
            submissions.map((submission) => (

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
                      ) : submission.isGraded || submission.facultyComments || submission.facultyGrade || (() => {
                        // Check if this legacy submission has been graded in the evaluation system
                        const evaluation = submissions.find(s => s.submissionType === 'evaluation')?.evaluation;
                        if (evaluation && submission.submissionType !== 'evaluation') {
                          if (submission.assessmentType === 'CLA-1' && evaluation.internal?.cla1?.conduct > 0) return true;
                          if (submission.assessmentType === 'CLA-2' && evaluation.internal?.cla2?.conduct > 0) return true;
                          if (submission.assessmentType === 'CLA-3' && evaluation.internal?.cla3?.conduct > 0) return true;
                          if (submission.assessmentType === 'External' && evaluation.external?.reportPresentation?.conduct > 0) return true;
                        }
                        return false;
                      })() ? (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-full border border-emerald-100">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Graded</span>
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

                  {/* Faculty Feedback Section - Show for non-evaluation submissions when faculty provides feedback */}
                  {submission.submissionType !== 'evaluation' && (
                    <div className="mb-6">
                      {/* Check if there's corresponding evaluation feedback for this assessment type */}
                      {submissions.some(s => s.submissionType === 'evaluation' && s.evaluation) && (() => {
                        const evaluation = submissions.find(s => s.submissionType === 'evaluation')?.evaluation;
                        let feedbackComment = '';
                        let feedbackTitle = '';

                        // Match assessment type to evaluation component
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
                          // Fallback to legacy faculty comments
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

                  {/* Assessment Journey Timeline */}
                  {submission.evaluation && (
                    <div className="mb-6">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-500" /> Assessment Journey
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 overflow-x-auto">
                        <TimelineStatus evaluation={submission.evaluation} />
                      </div>
                    </div>
                  )}
                  {/* Final Grade - Only show when released */}
                  <FinalGradeCard
                    totalScore={submission.finalGrade || submission.total || 0}
                    isReleased={submission.isGradeReleased}
                    className="mt-6"
                  />
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}