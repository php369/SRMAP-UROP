import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Github, Award, Clock, CheckCircle, AlertCircle, Users } from 'lucide-react';
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
      // Fetch both regular submissions and group submissions
      const [regularResponse, groupResponse] = await Promise.all([
        api.get('/submissions/my').catch(() => ({ success: false, data: [] })),
        api.get('/group-submissions/my/submissions').catch(() => ({ success: false, data: [] }))
      ]);

      const allSubmissions: any[] = [];

      // Add regular submissions
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

      // Add group submissions
      if (groupResponse.success && groupResponse.data) {
        const groupSubmissions = Array.isArray(groupResponse.data) ? groupResponse.data : [groupResponse.data];
        groupSubmissions.forEach(submission => {
          allSubmissions.push({
            ...submission,
            submissionType: 'group',
            // Map group submission fields to match expected format
            assessmentType: submission.assessmentType || 'A1',
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
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                      {submission.submissionType === 'group' ? (
                        <Users className="w-5 h-5 text-blue-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-green-500" />
                      )}
                      {submission.assessmentType} Assessment
                      {submission.submissionType === 'group' && (
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Group
                        </span>
                      )}
                      {submission.submissionType === 'solo' && (
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Solo
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-600">
                      Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                      {submission.submissionType === 'group' && submission.groupId?.groupCode && (
                        <span className="ml-2 text-blue-600 font-medium">
                          Group: {submission.groupId.groupCode}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    {submission.isGradeReleased ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Graded</span>
                      </div>
                    ) : submission.isGraded ? (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">Pending Release</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-blue-600">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Under Review</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submitted Work */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Github className="w-5 h-5 text-gray-600" />
                      <h4 className="font-medium">GitHub</h4>
                    </div>
                    <a
                      href={submission.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm break-all"
                    >
                      View Repository
                    </a>
                  </div>

                  {submission.reportUrl && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <h4 className="font-medium">Report</h4>
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            const fullUrl = submission.reportUrl?.startsWith('/api/') 
                              ? `${window.location.origin}${submission.reportUrl}`
                              : submission.reportUrl;
                            
                            // Create modal with embedded PDF
                            const modal = document.createElement('div');
                            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
                            modal.innerHTML = `
                              <div class="bg-white rounded-lg w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
                                <div class="flex justify-between items-center p-4 border-b">
                                  <h3 class="text-lg font-semibold">Report PDF</h3>
                                  <button class="close-modal text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                                </div>
                                <div class="flex-1 p-4">
                                  <iframe 
                                    src="${fullUrl}" 
                                    class="w-full h-full border-0 rounded"
                                    title="Report PDF"
                                  ></iframe>
                                </div>
                              </div>
                            `;
                            
                            document.body.appendChild(modal);
                            
                            // Close modal handlers
                            const closeModal = () => document.body.removeChild(modal);
                            modal.querySelector('.close-modal')?.addEventListener('click', closeModal);
                            modal.addEventListener('click', (e) => {
                              if (e.target === modal) closeModal();
                            });
                          }}
                          className="text-blue-500 hover:underline text-sm cursor-pointer bg-none border-none p-0"
                        >
                          📄 View PDF
                        </button>
                        <br />
                        <a
                          href={submission.reportUrl?.startsWith('/api/') 
                            ? `${window.location.origin}${submission.reportUrl}`
                            : submission.reportUrl}
                          download
                          className="text-green-600 hover:underline text-sm"
                        >
                          ⬇️ Download PDF
                        </a>
                      </div>
                    </div>
                  )}

                  {submission.pptUrl && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <h4 className="font-medium">Presentation</h4>
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            const fullUrl = submission.pptUrl?.startsWith('/api/') 
                              ? `${window.location.origin}${submission.pptUrl}`
                              : submission.pptUrl;
                            
                            // Create modal with embedded PDF/PPT
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
                                    src="${fullUrl}" 
                                    class="w-full h-full border-0 rounded"
                                    title="Presentation"
                                  ></iframe>
                                </div>
                              </div>
                            `;
                            
                            document.body.appendChild(modal);
                            
                            // Close modal handlers
                            const closeModal = () => document.body.removeChild(modal);
                            modal.querySelector('.close-modal')?.addEventListener('click', closeModal);
                            modal.addEventListener('click', (e) => {
                              if (e.target === modal) closeModal();
                            });
                          }}
                          className="text-blue-500 hover:underline text-sm cursor-pointer bg-none border-none p-0"
                        >
                          📊 View Presentation
                        </button>
                        <br />
                        <a
                          href={submission.pptUrl?.startsWith('/api/') 
                            ? `${window.location.origin}${submission.pptUrl}`
                            : submission.pptUrl}
                          download
                          className="text-green-600 hover:underline text-sm"
                        >
                          ⬇️ Download
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Grades - Only show for solo submissions or graded group submissions */}
                {submission.isGradeReleased && submission.submissionType === 'solo' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Award className="w-8 h-8 text-blue-500" />
                      <h4 className="text-xl font-bold">Your Grade</h4>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      {submission.facultyGrade !== undefined && (
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-1">Faculty Grade</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {submission.facultyGrade}/100
                          </p>
                        </div>
                      )}

                      {submission.externalGrade !== undefined && (
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-1">External Grade</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {submission.externalGrade}/100
                          </p>
                        </div>
                      )}

                      {submission.finalGrade !== undefined && (
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-1">Final Grade</p>
                          <p className="text-4xl font-bold text-green-600">
                            {submission.finalGrade}/100
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}