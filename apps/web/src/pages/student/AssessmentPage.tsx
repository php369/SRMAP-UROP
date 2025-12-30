import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Github, Award, Clock, CheckCircle, AlertCircle, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

export function AssessmentPage() {
  const { user } = useAuth();
  const [assessmentWindow, setAssessmentWindow] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [eligibleProjectType, setEligibleProjectType] = useState<string | null>(null);

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
    if (eligibleProjectType) {
      const initializeData = async () => {
        setInitializing(true);
        try {
          await Promise.all([
            checkAssessmentWindow(),
            fetchSubmissions()
          ]);
        } catch (error) {
          console.error('Error initializing assessment data:', error);
        } finally {
          setInitializing(false);
        }
      };
      
      initializeData();
    }
  }, [eligibleProjectType]);

  const checkAssessmentWindow = async () => {
    if (!eligibleProjectType) return;
    
    try {
      const response = await api.get('/windows/active', { 
        windowType: 'assessment',
        projectType: eligibleProjectType
      });
      if (response.success && response.data) {
        setAssessmentWindow(response.data as any);
      }
    } catch (error) {
      console.error('Error checking assessment window:', error);
      setAssessmentWindow({ isActive: true } as any);
    }
  };

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
      const [regularResponse, groupResponse] = await Promise.all([
        api.get('/submissions/my').catch(() => ({ success: false, data: [] })),
        api.get('/group-submissions/my/submissions').catch(() => ({ success: false, data: [] }))
      ]);

      const allSubmissions: any[] = [];

      // Add student evaluations (new system)
      if (evaluationsResponse.success && (evaluationsResponse as any).evaluations) {
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
      if (regularResponse.success && regularResponse.data) {
        const regularSubmissions = Array.isArray(regularResponse.data) ? regularResponse.data : [regularResponse.data];
        regularSubmissions.forEach(submission => {
          allSubmissions.push({
            ...submission,
            submissionType: 'solo'
          });
        });
      } else if ((regularResponse as any).submissions) {
        // Handle legacy response format
        const legacySubmissions = Array.isArray((regularResponse as any).submissions) 
          ? (regularResponse as any).submissions 
          : [(regularResponse as any).submissions];
        legacySubmissions.forEach((submission: any) => {
          allSubmissions.push({
            ...submission,
            submissionType: 'solo'
          });
        });
      }

      // Add group submissions (legacy)
      if (groupResponse.success && groupResponse.data) {
        const groupSubmissions = Array.isArray(groupResponse.data) ? groupResponse.data : [groupResponse.data];
        groupSubmissions.forEach(submission => {
          allSubmissions.push({
            ...submission,
            submissionType: 'group',
            // Map group submission fields to match expected format
            assessmentType: submission.assessmentType || 'CLA-1',
            githubLink: submission.githubUrl || submission.githubLink,
            reportUrl: submission.reportFile?.url,
            pptUrl: submission.presentationFile?.url || submission.presentationUrl,
            isGraded: false, // Group submissions don't have grades yet
            isGradeReleased: false
          });
        });
      }

      // Sort by submission date (most recent first)
      allSubmissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
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

  if (!assessmentWindow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Assessment Window Not Open</h2>
          <p className="text-gray-600">
            The assessment window hasn't started yet. Please check back later.
          </p>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Assessment</h1>
          <p className="text-gray-600">
            View your submissions and grades
          </p>
        </motion.div>

        {/* Submissions */}
        <div className="grid gap-6">
          {submissions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No submissions yet</p>
            </div>
          ) : (
            submissions.map((submission) => (
              <motion.div
                key={submission._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                        {submission.submissionType === 'evaluation' ? (
                          <Award className="w-6 h-6 text-purple-500" />
                        ) : submission.submissionType === 'group' ? (
                          <Users className="w-6 h-6 text-blue-500" />
                        ) : (
                          <FileText className="w-6 h-6 text-green-500" />
                        )}
                        {submission.assessmentType} Assessment
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <span>
                          {submission.submissionType === 'evaluation' ? 
                            (submission.isGradeReleased ? 'Grade released on' : 'Evaluation created on') : 
                            'Submitted on'} {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                        {(submission.groupId?.groupCode || submission.groupCode) && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            Group: {submission.groupId?.groupCode || submission.groupCode}
                          </span>
                        )}
                        {submission.submissionType === 'solo' && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            Solo Submission
                          </span>
                        )}
                        {submission.projectTitle && (
                          <span className="text-gray-500">
                            Project: {submission.projectTitle}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {submission.isGradeReleased ? (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-full">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Graded</span>
                        </div>
                      ) : submission.isComplete ? (
                        <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-full">
                          <Clock className="w-5 h-5" />
                          <span className="font-medium">Awaiting Release</span>
                        </div>
                      ) : submission.isGraded ? (
                        <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-2 rounded-full">
                          <Clock className="w-5 h-5" />
                          <span className="font-medium">Partially Graded</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-full">
                          <AlertCircle className="w-5 h-5" />
                          <span className="font-medium">Under Review</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  {/* Submission Files - Only show for non-evaluation submissions */}
                  {submission.submissionType !== 'evaluation' && (
                    <div className="mb-6">
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
                            href={submission.githubLink}
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
                        {submission.reportUrl && (
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
                                onClick={() => {
                                  const modal = document.createElement('div');
                                  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
                                  modal.innerHTML = `
                                    <div class="bg-white rounded-lg w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
                                      <div class="flex justify-between items-center p-4 border-b">
                                        <h3 class="text-lg font-semibold">Project Report</h3>
                                        <button class="close-modal text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                                      </div>
                                      <div class="flex-1 p-4">
                                        <iframe 
                                          src="${submission.reportUrl}" 
                                          class="w-full h-full border-0 rounded"
                                          title="Project Report"
                                        ></iframe>
                                      </div>
                                    </div>
                                  `;
                                  document.body.appendChild(modal);
                                  const closeModal = () => document.body.removeChild(modal);
                                  modal.querySelector('.close-modal')?.addEventListener('click', closeModal);
                                  modal.addEventListener('click', (e) => {
                                    if (e.target === modal) closeModal();
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                👁️ View
                              </button>
                              <a
                                href={submission.reportUrl}
                                download
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                ⬇️ Download
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Presentation */}
                        {submission.pptUrl && (
                          <div className="bg-orange-50 rounded-lg p-4 hover:bg-orange-100 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-orange-600 rounded-lg">
                                <FileText className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-800">Presentation</h5>
                                <p className="text-xs text-gray-500">Slides</p>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={() => {
                                  const modal = document.createElement('div');
                                  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
                                  modal.innerHTML = `
                                    <div class="bg-white rounded-lg w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
                                      <div class="flex justify-between items-center p-4 border-b">
                                        <h3 class="text-lg font-semibold">Presentation</h3>
                                        <button class="close-modal text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                                      </div>
                                      <div class="flex-1 p-4">
                                        <iframe 
                                          src="${submission.pptUrl}" 
                                          class="w-full h-full border-0 rounded"
                                          title="Presentation"
                                        ></iframe>
                                      </div>
                                    </div>
                                  `;
                                  document.body.appendChild(modal);
                                  const closeModal = () => document.body.removeChild(modal);
                                  modal.querySelector('.close-modal')?.addEventListener('click', closeModal);
                                  modal.addEventListener('click', (e) => {
                                    if (e.target === modal) closeModal();
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                👁️ View
                              </button>
                              <a
                                href={submission.pptUrl}
                                download
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                ⬇️ Download
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assessment Progress & Feedback */}
                  {submission.evaluation && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Award className="w-5 h-5 text-blue-500" />
                        Assessment Progress
                      </h4>
                      
                      {/* Assessment Components Grid */}
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* CLA-1 */}
                        <div className={`p-4 rounded-lg border-2 ${
                          submission.evaluation.internal?.cla1?.conduct > 0 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-800">CLA-1</h5>
                            {submission.evaluation.internal?.cla1?.conduct > 0 ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Clock className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          {submission.evaluation.internal?.cla1?.conduct > 0 ? (
                            <div>
                              <p className="text-sm text-green-700 font-medium">
                                Score: {submission.evaluation.internal.cla1.conduct}/20
                              </p>
                              {submission.isGradeReleased && submission.evaluation.internal.cla1.comments && (
                                <p className="text-xs text-gray-600 mt-2 italic">
                                  "{submission.evaluation.internal.cla1.comments}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Not graded yet</p>
                          )}
                        </div>

                        {/* CLA-2 */}
                        <div className={`p-4 rounded-lg border-2 ${
                          submission.evaluation.internal?.cla2?.conduct > 0 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-800">CLA-2</h5>
                            {submission.evaluation.internal?.cla2?.conduct > 0 ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Clock className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          {submission.evaluation.internal?.cla2?.conduct > 0 ? (
                            <div>
                              <p className="text-sm text-green-700 font-medium">
                                Score: {submission.evaluation.internal.cla2.conduct}/30
                              </p>
                              {submission.isGradeReleased && submission.evaluation.internal.cla2.comments && (
                                <p className="text-xs text-gray-600 mt-2 italic">
                                  "{submission.evaluation.internal.cla2.comments}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Not graded yet</p>
                          )}
                        </div>

                        {/* CLA-3 */}
                        <div className={`p-4 rounded-lg border-2 ${
                          submission.evaluation.internal?.cla3?.conduct > 0 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-800">CLA-3</h5>
                            {submission.evaluation.internal?.cla3?.conduct > 0 ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Clock className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          {submission.evaluation.internal?.cla3?.conduct > 0 ? (
                            <div>
                              <p className="text-sm text-green-700 font-medium">
                                Score: {submission.evaluation.internal.cla3.conduct}/50
                              </p>
                              {submission.isGradeReleased && submission.evaluation.internal.cla3.comments && (
                                <p className="text-xs text-gray-600 mt-2 italic">
                                  "{submission.evaluation.internal.cla3.comments}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Not graded yet</p>
                          )}
                        </div>

                        {/* External */}
                        <div className={`p-4 rounded-lg border-2 ${
                          submission.evaluation.external?.reportPresentation?.conduct > 0 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-800">External</h5>
                            {submission.evaluation.external?.reportPresentation?.conduct > 0 ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Clock className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          {submission.evaluation.external?.reportPresentation?.conduct > 0 ? (
                            <div>
                              <p className="text-sm text-green-700 font-medium">
                                Score: {submission.evaluation.external.reportPresentation.conduct}/100
                              </p>
                              {submission.isGradeReleased && submission.evaluation.external.reportPresentation.comments && (
                                <p className="text-xs text-gray-600 mt-2 italic">
                                  "{submission.evaluation.external.reportPresentation.comments}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Not graded yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Final Grade - Only show when released */}
                  {submission.isGradeReleased && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200"
                    >
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <Award className="w-8 h-8 text-green-600" />
                          <h4 className="text-2xl font-bold text-gray-800">Final Grade Released</h4>
                        </div>
                        <div className="text-6xl font-bold text-green-600 mb-2">
                          {submission.finalGrade || submission.total || 0}/100
                        </div>
                        <p className="text-gray-600">
                          Congratulations! Your assessment has been completed and grades are now available.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}