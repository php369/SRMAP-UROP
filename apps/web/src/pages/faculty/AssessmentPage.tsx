import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Github, Presentation, Video, Send, Eye, Calendar, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard, GlowButton } from '../../components/ui';
import toast from 'react-hot-toast';
import { useWindowStatus } from '../../hooks/useWindowStatus';
import { WindowClosedMessage } from '../../components/common/WindowClosedMessage';
import { api } from '../../utils/api';

interface Submission {
  _id: string;
  groupId?: {
    _id: string;
    groupCode: string;
    members: any[];
  };
  studentId?: {
    _id: string;
    name: string;
    email: string;
  };
  projectId: {
    _id: string;
    title: string;
    projectType: string;
  };
  assessmentType: 'A1' | 'A2' | 'A3' | 'External';
  githubLink?: string;
  reportUrl?: string;
  presentationUrl?: string;
  facultyGrade?: number;
  externalGrade?: number;
  facultyComments?: string;
  externalComments?: string;
  gradeReleased: boolean;
  submittedAt: string;
}

export function FacultyAssessmentPage() {
  useAuth(); // Keep for authentication check
  const { isAssessmentOpen, loading: windowLoading } = useWindowStatus();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [meetingLogs, setMeetingLogs] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedProjectLogs, setSelectedProjectLogs] = useState<any[] | null>(null);
  const [assessmentType] = useState<'A1' | 'A2' | 'A3' | 'External'>('A1');
  const [initializing, setInitializing] = useState(true);
  const [gradeData, setGradeData] = useState({
    grade: '',
    comments: '',
    meetUrl: ''
  });

  // Check if any assessment window is open (for any project type)
  const canGrade = ['IDP', 'UROP', 'CAPSTONE'].some(type => isAssessmentOpen(type, assessmentType));

  useEffect(() => {
    const initializeData = async () => {
      setInitializing(true);
      try {
        await Promise.all([
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
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/submissions/faculty');
      if (response.success && response.data && Array.isArray(response.data)) {
        setSubmissions(response.data);
      } else if ((response as any).submissions && Array.isArray((response as any).submissions)) {
        // Handle current API response format
        setSubmissions((response as any).submissions);
      } else {
        setSubmissions([]);
      }
    } catch (error) {
      toast.error('Failed to fetch submissions');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = async (logId: string, grade: number) => {
    if (isNaN(grade) || grade < 0 || grade > 5) {
      toast.error('Grade must be between 0 and 5');
      return;
    }

    try {
      const response = await api.put(`/meetings/logs/${logId}/grade`, { grade });

      if (response.success) {
        toast.success('Grade saved');
        // Update the local state
        setMeetingLogs(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(projectId => {
            updated[projectId] = updated[projectId].map(log =>
              log._id === logId ? { ...log, grade } : log
            );
          });
          return updated;
        });
      } else {
        toast.error((response as any).error?.message || 'Failed to save grade');
      }
    } catch (error) {
      toast.error('Failed to save grade');
    }
  };

  const fetchMeetingLogs = async () => {
    try {
      const response = await api.get('/meetings/faculty');

      if (response.success && response.data && Array.isArray(response.data)) {
        // Group logs by project ID - projectId should already be populated by backend
        const logsByProject: Record<string, any[]> = {};

        response.data.forEach((log: any) => {
          // Handle both populated and non-populated projectId
          const projectId = typeof log.projectId === 'object' && log.projectId !== null
            ? log.projectId._id
            : log.projectId;

          const projectTitle = typeof log.projectId === 'object' && log.projectId !== null
            ? log.projectId.title
            : 'Unknown Project';

          // Only include logs with minutes and approved/completed status
          if ((log.minutesOfMeeting || log.mom) && (log.status === 'approved' || log.status === 'completed')) {
            if (!logsByProject[projectId]) {
              logsByProject[projectId] = [];
            }

            // Ensure projectId is properly structured
            const enrichedLog = {
              ...log,
              projectId: typeof log.projectId === 'object' && log.projectId !== null
                ? log.projectId
                : { _id: projectId, title: projectTitle }
            };

            logsByProject[projectId].push(enrichedLog);
          }
        });

        setMeetingLogs(logsByProject);
      } else {
        setMeetingLogs({});
      }
    } catch (error) {
      console.error('Failed to fetch meeting logs:', error);
      toast.error('Failed to fetch meeting logs');
      setMeetingLogs({});
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;

    const grade = parseFloat(gradeData.grade);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast.error('Please enter a valid grade (0-100)');
      return;
    }

    try {
      const response = await api.put(`/submissions/${selectedSubmission._id}/grade`, {
        facultyGrade: grade,
        facultyComments: gradeData.comments,
        meetUrl: gradeData.meetUrl
      });

      if (response.success) {
        toast.success('Grade submitted successfully');
        setSelectedSubmission(null);
        setGradeData({ grade: '', comments: '', meetUrl: '' });
        fetchSubmissions();
      } else {
        toast.error((response as any).error?.message || 'Failed to submit grade');
      }
    } catch (error) {
      toast.error('Failed to submit grade');
    }
  };

  const getAssessmentBadge = (type: string) => {
    const colors = {
      A1: 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/30',
      A2: 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/30',
      A3: 'bg-pink-100 dark:bg-pink-500/20 text-pink-800 dark:text-pink-300 border-pink-300 dark:border-pink-500/30',
      External: 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-500/30'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${colors[type as keyof typeof colors]}`}>
        {type}
      </span>
    );
  };

  // Show loading while initializing
  if (initializing || windowLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show window closed message if assessment window is not open
  if (!canGrade) {
    return <WindowClosedMessage windowType="assessment" showAllProjectTypes={true} />;
  }

  return (
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text">Assessment & Grading</h1>
          <p className="text-textSecondary mt-1">
            Review submissions and provide grades
          </p>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : submissions.length === 0 ? (
          <>
            <GlassCard className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-text mb-2">No Submissions</h3>
                <p className="text-textSecondary">
                  No submissions to grade at the moment
                </p>
              </div>
            </GlassCard>

            {/* Show meeting logs even without submissions */}
            {Object.keys(meetingLogs).length > 0 && (
              <div className="mt-6">
                <h2 className="text-2xl font-bold text-text mb-4">Meeting Logs by Project</h2>
                <div className="grid gap-4">
                  {Object.entries(meetingLogs)
                    .filter(([_, logs]) => logs.length > 0) // Only show projects with logs
                    .map(([projectIdKey, logs]) => {
                      const isExpanded = selectedProjectLogs === logs;
                      const firstLog = logs[0];

                      // Get project title from the populated projectId
                      const projectTitle = firstLog?.projectId?.title || 'Unknown Project';

                      // Calculate total grade
                      const totalGrade = logs.reduce((sum, log) => sum + (log.grade || 0), 0);
                      const maxGrade = logs.length * 5;

                      return (
                        <GlassCard key={projectIdKey} className="p-6">
                          <button
                            onClick={() => setSelectedProjectLogs(isExpanded ? null : logs)}
                            className="w-full flex items-center justify-between text-left"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-lg font-semibold text-text">
                                  {projectTitle}
                                </h3>
                                <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-bold rounded-lg border border-primary/30">
                                  {totalGrade}/{maxGrade} marks
                                </span>
                              </div>
                              <p className="text-sm text-textSecondary">
                                {logs.length} meeting log{logs.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-textSecondary">
                                {isExpanded ? 'Hide' : 'Show'}
                              </span>
                              <svg
                                className={`w-5 h-5 text-textSecondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </button>

                          {/* Expanded logs */}
                          {isExpanded && (
                            <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                              {logs.map((log, index) => (
                                <div key={log._id} className="p-4 bg-white/5 rounded-lg">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <span className="text-base font-semibold text-text">Meeting #{index + 1}</span>
                                      {log.status === 'approved' && (
                                        <span className="px-2 py-1 bg-green-100 dark:bg-success/20 text-green-800 dark:text-success text-xs font-medium rounded-lg border border-green-300 dark:border-success/30">
                                          Approved
                                        </span>
                                      )}
                                      {log.status === 'completed' && (
                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-lg border border-blue-300 dark:border-blue-500/30">
                                          Completed
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-textSecondary">
                                      {log.mode === 'online' ? (
                                        <Video className="w-4 h-4" />
                                      ) : (
                                        <Users className="w-4 h-4" />
                                      )}
                                      <span className="capitalize">{log.mode}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 text-sm text-textSecondary mb-3">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(log.meetingDate).toLocaleString()}
                                  </div>

                                  {log.location && (
                                    <div className="text-sm text-textSecondary mb-3">
                                      Location: {log.location}
                                    </div>
                                  )}

                                  <div className="mt-3 p-3 bg-white/5 rounded-lg">
                                    <h4 className="text-sm font-medium text-text mb-2 flex items-center gap-2">
                                      <FileText className="w-4 h-4" />
                                      Minutes of Meeting
                                    </h4>
                                    <p className="text-sm text-textSecondary whitespace-pre-wrap">
                                      {log.minutesOfMeeting || log.mom}
                                    </p>
                                  </div>

                                  {log.attendees && log.attendees.length > 0 && (
                                    <div className="mt-3">
                                      <h4 className="text-sm font-medium text-text mb-2">Attendees</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {log.attendees.map((attendee: any, idx: number) => (
                                          <span
                                            key={idx}
                                            className={`px-2 py-1 text-xs rounded-lg ${attendee.present
                                              ? 'bg-green-100 dark:bg-success/20 text-green-800 dark:text-success border border-green-300 dark:border-success/30'
                                              : 'bg-white/5 text-textSecondary border border-white/10'
                                              }`}
                                          >
                                            {attendee.studentId?.name || 'Student'}
                                            {attendee.present && ' ✓'}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Grading Section */}
                                  <div className="mt-4 pt-4 border-t border-white/10">
                                    <div className="flex items-center gap-4">
                                      <label className="text-sm font-medium text-text">Grade (out of 5):</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="5"
                                        step="0.5"
                                        value={log.grade || ''}
                                        onChange={(e) => handleGradeChange(log._id, parseFloat(e.target.value))}
                                        className="w-20 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="0-5"
                                      />
                                      {log.grade !== undefined && log.grade !== null && (
                                        <span className="text-sm text-success">✓ Graded</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </GlassCard>
                      );
                    })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="grid gap-4">
            {submissions.map((submission) => (
              <motion.div
                key={submission._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard className="p-6 hover:bg-white/10 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-text">
                          {submission.groupId
                            ? `Group ${submission.groupId.groupCode}`
                            : submission.studentId?.name}
                        </h3>
                        {getAssessmentBadge(submission.assessmentType)}
                        <span className="px-2 py-1 bg-blue-100 dark:bg-secondary/20 text-blue-800 dark:text-secondary text-xs font-medium rounded-lg border border-blue-300 dark:border-secondary/30">
                          {submission.projectId?.projectType || 'Unknown'}
                        </span>
                        {submission.facultyGrade !== undefined && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-success/20 text-green-800 dark:text-success text-xs font-medium rounded-lg border border-green-300 dark:border-success/30">
                            Graded: {submission.facultyGrade}/100
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div>
                          <span className="text-sm font-medium text-text">Project: </span>
                          <span className="text-sm text-textSecondary">{submission.projectId?.title || 'Unknown Project'}</span>
                        </div>
                        {submission.groupId && (
                          <div>
                            <span className="text-sm font-medium text-text">Members: </span>
                            <span className="text-sm text-textSecondary">
                              {submission.groupId.members.length} students
                            </span>
                          </div>
                        )}
                        <div className="flex gap-3 text-sm">
                          {submission.githubLink && (
                            <a
                              href={submission.githubLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <Github className="w-4 h-4" />
                              GitHub
                            </a>
                          )}
                          {submission.reportUrl && (
                            <a
                              href={submission.reportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <FileText className="w-4 h-4" />
                              Report
                            </a>
                          )}
                          {submission.presentationUrl && (
                            <a
                              href={submission.presentationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <Presentation className="w-4 h-4" />
                              Presentation
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-textSecondary">
                        Submitted: {new Date(submission.submittedAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {submission.projectId?._id && meetingLogs[submission.projectId._id]?.length > 0 && (
                        <button
                          onClick={() => setSelectedProjectLogs(meetingLogs[submission.projectId._id])}
                          className="px-3 py-2 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 text-blue-800 dark:text-blue-300 rounded-lg transition-all flex items-center gap-2 text-sm"
                          title="View Meeting Logs"
                        >
                          <FileText className="w-4 h-4" />
                          {meetingLogs[submission.projectId._id].length} Logs
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setGradeData({
                            grade: submission.facultyGrade?.toString() || '',
                            comments: submission.facultyComments || '',
                            meetUrl: ''
                          });
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-all"
                        title={submission.facultyGrade !== undefined ? 'View/Edit Grade' : 'Grade Submission'}
                      >
                        <Eye className="w-4 h-4 text-text" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Grading Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setSelectedSubmission(null);
              setGradeData({ grade: '', comments: '', meetUrl: '' });
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <GlassCard className="p-6">
                <h2 className="text-2xl font-bold text-text mb-6">Grade Submission</h2>

                <div className="space-y-6">
                  {/* Submission Info */}
                  <div className="p-4 bg-white/5 rounded-lg space-y-3">
                    <div>
                      <span className="text-sm font-medium text-textSecondary">
                        {selectedSubmission.groupId ? 'Group' : 'Student'}:
                      </span>
                      <p className="text-text">
                        {selectedSubmission.groupId
                          ? `Group ${selectedSubmission.groupId.groupCode}`
                          : selectedSubmission.studentId?.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-textSecondary">Project:</span>
                      <p className="text-text">{selectedSubmission.projectId?.title || 'Unknown Project'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-textSecondary">Assessment:</span>
                      <div className="mt-1">{getAssessmentBadge(selectedSubmission.assessmentType)}</div>
                    </div>
                  </div>

                  {/* Submission Links */}
                  <div>
                    <label className="block text-sm font-medium text-text mb-3">Submitted Work</label>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedSubmission.githubLink && (
                        <a
                          href={selectedSubmission.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                        >
                          <Github className="w-5 h-5 text-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-text">GitHub Repository</p>
                            <p className="text-xs text-textSecondary truncate">{selectedSubmission.githubLink}</p>
                          </div>
                        </a>
                      )}
                      {selectedSubmission.reportUrl && (
                        <a
                          href={selectedSubmission.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                        >
                          <FileText className="w-5 h-5 text-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-text">Report PDF</p>
                            <p className="text-xs text-textSecondary">Click to view</p>
                          </div>
                        </a>
                      )}
                      {selectedSubmission.presentationUrl && (
                        <a
                          href={selectedSubmission.presentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                        >
                          <Presentation className="w-5 h-5 text-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-text">Presentation</p>
                            <p className="text-xs text-textSecondary">Click to view</p>
                          </div>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Grading Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Grade (0-100) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={gradeData.grade}
                        onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Enter grade"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Comments / Feedback
                      </label>
                      <textarea
                        value={gradeData.comments}
                        onChange={(e) => setGradeData({ ...gradeData, comments: e.target.value })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={4}
                        placeholder="Provide feedback to students..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Google Meet Link (Optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={gradeData.meetUrl}
                          onChange={(e) => setGradeData({ ...gradeData, meetUrl: e.target.value })}
                          className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="https://meet.google.com/..."
                        />
                        {gradeData.meetUrl && (
                          <a
                            href={gradeData.meetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-all flex items-center gap-2"
                          >
                            <Video className="w-4 h-4" />
                            Join
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-textSecondary mt-1">
                        Schedule a meeting for presentation or discussion
                      </p>
                    </div>
                  </div>

                  {/* Existing Grade Info */}
                  {selectedSubmission.facultyGrade !== undefined && (
                    <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                      <p className="text-sm text-success mb-2">Previously Graded</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-text">Grade: {selectedSubmission.facultyGrade}/100</p>
                        {selectedSubmission.facultyComments && (
                          <p className="text-textSecondary">Comments: {selectedSubmission.facultyComments}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setSelectedSubmission(null);
                      setGradeData({ grade: '', comments: '', meetUrl: '' });
                    }}
                    className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-text transition-all"
                  >
                    Cancel
                  </button>
                  <GlowButton
                    onClick={handleGradeSubmission}
                    variant="primary"
                    glow
                    className="flex-1"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Grade
                  </GlowButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
