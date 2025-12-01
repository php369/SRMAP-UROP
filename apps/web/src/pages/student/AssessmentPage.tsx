import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, FileText, Github, Award, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function AssessmentPage() {
  const { user } = useAuth();
  const [assessmentWindow, setAssessmentWindow] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAssessmentWindow();
    fetchSubmissions();
  }, []);

  const checkAssessmentWindow = async () => {
    try {
      const response = await fetch('/api/v1/windows?windowType=assessment&isActive=true');
      const data = await response.json();
      if (data.length > 0) {
        setAssessmentWindow(data[0]);
      }
    } catch (error) {
      console.error('Error checking assessment window:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/v1/submissions/student/${user?._id}`);
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

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

        <div className="grid gap-6">
          {submissions.map((submission) => (
            <motion.div
              key={submission._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold mb-1">
                    {submission.assessmentType} Assessment
                  </h3>
                  <p className="text-gray-600">
                    Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
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

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <h4 className="font-medium">Report</h4>
                  </div>
                  <a
                    href={submission.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    View PDF
                  </a>
                </div>

                {submission.pptUrl && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <h4 className="font-medium">Presentation</h4>
                    </div>
                    <a
                      href={submission.pptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm"
                    >
                      View PPT
                    </a>
                  </div>
                )}
              </div>

              {/* Meeting Link */}
              {submission.meetUrl ? (
                <div className="mb-6">
                  <a
                    href={submission.meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <Video className="w-5 h-5" />
                    Join Assessment Meeting
                  </a>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm">
                    Meeting link will be available when faculty schedules the assessment
                  </p>
                </div>
              )}

              {/* Grades */}
              {submission.isGradeReleased && (
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

              {!submission.isGradeReleased && submission.isGraded && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 text-sm">
                    Your work has been graded. Grades will be released by the coordinator soon.
                  </p>
                </div>
              )}

              {!submission.isGraded && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-800 text-sm">
                    Assessment has been marked as complete. Waiting for faculty evaluation.
                  </p>
                </div>
              )}
            </motion.div>
          ))}

          {submissions.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Submissions Yet</h3>
              <p className="text-gray-600">
                You haven't submitted any work for assessment yet.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
