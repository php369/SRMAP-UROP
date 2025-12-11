import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, FileText, Github, Award, Clock, CheckCircle, AlertCircle, Calendar, Users, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

export function AssessmentPage() {
  const { user } = useAuth();
  const [assessmentWindow, setAssessmentWindow] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [meetingLogs, setMeetingLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'submissions' | 'meetings'>('submissions');
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
            fetchSubmissions(),
            fetchMeetingLogs()
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
      const response = await api.get(`/submissions/student/${user.id}`);
      if (response.success && response.data) {
        // Handle both single submission and array of submissions
        const submissionData = Array.isArray(response.data) ? response.data : [response.data];
        setSubmissions(submissionData as any[]);
      } else if ((response as any).submissions) {
        // Handle legacy response format
        setSubmissions((response as any).submissions as any[]);
      } else {
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetingLogs = async () => {
    if (!user?.id) return;
    
    try {
      const response = await api.get(`/meetings/student`);
      if (response.success && response.data && Array.isArray(response.data)) {
        // Filter for approved meeting logs with grades
        const approvedLogs = response.data.filter((log: any) => 
          log.status === 'approved' && log.grade !== undefined
        );
        setMeetingLogs(approvedLogs as any[]);
      } else {
        setMeetingLogs([]);
      }
    } catch (error) {
      console.error('Error fetching meeting logs:', error);
      setMeetingLogs([]);
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
            View your submissions, grades, and meeting logs
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'submissions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Submissions ({submissions.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('meetings')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'meetings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Meeting Logs ({meetingLogs.length})
              </div>
            </button>
          </div>
        </div>

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
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
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Meeting Logs Tab */}
        {activeTab === 'meetings' && (
          <div className="grid gap-6">
            {meetingLogs.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No meeting logs yet</p>
              </div>
            ) : (
              meetingLogs.map((log) => (
                <motion.div
                  key={log._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                        {log.mode === 'online' ? (
                          <Video className="w-5 h-5 text-blue-500" />
                        ) : (
                          <MapPin className="w-5 h-5 text-green-500" />
                        )}
                        {log.mode === 'online' ? 'Online' : 'In-Person'} Meeting
                      </h3>
                      <p className="text-gray-600">
                        {new Date(log.meetingDate).toLocaleDateString()} at{' '}
                        {new Date(log.startedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {log.status === 'approved' ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Approved</span>
                        </div>
                      ) : log.status === 'rejected' ? (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="w-5 h-5" />
                          <span className="font-medium">Rejected</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-yellow-600">
                          <Clock className="w-5 h-5" />
                          <span className="font-medium">Pending Review</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meeting Details */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {log.location && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-gray-600" />
                          <h4 className="font-medium text-sm">Location</h4>
                        </div>
                        <p className="text-sm text-gray-700">{log.location}</p>
                      </div>
                    )}
                    
                    {log.attendees && log.attendees.length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-gray-600" />
                          <h4 className="font-medium text-sm">Attendees</h4>
                        </div>
                        <p className="text-sm text-gray-700">
                          {log.attendees.filter((a: any) => a.present).length} / {log.attendees.length} present
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Minutes of Meeting */}
                  {log.minutesOfMeeting && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Minutes of Meeting
                      </h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{log.minutesOfMeeting}</p>
                    </div>
                  )}

                  {/* Grade */}
                  {log.grade !== undefined && log.status === 'approved' && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Award className="w-6 h-6 text-green-500" />
                          <h4 className="font-bold">Meeting Grade</h4>
                        </div>
                        <p className="text-3xl font-bold text-green-600">{log.grade}/5</p>
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {log.status === 'rejected' && log.rejectionReason && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-medium text-red-800 mb-2">Rejection Reason</h4>
                      <p className="text-sm text-red-700">{log.rejectionReason}</p>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
