import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Github, Presentation, Video, Send, Eye, Calendar, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/ui';
import toast from 'react-hot-toast';
import { useWindowStatus } from '../../hooks/useWindowStatus';
import { WindowClosedMessage } from '../../components/common/WindowClosedMessage';
import { api } from '../../utils/api';
import { getCurrentAssessmentType, isAssessmentTypeActive } from '../../utils/assessmentHelper';

interface Submission {
  _id: string;
  submissionType?: 'solo' | 'group';
  groupId?: {
    _id: string;
    groupCode: string;
    members: any[];
    assignedProjectId?: {
      _id: string;
      title: string;
      projectId: string;
      type: string;
      brief: string;
      facultyName: string;
    };
  };
  studentId?: {
    _id: string;
    name: string;
    email: string;
    assignedProjectId?: {
      _id: string;
      title: string;
      projectId: string;
      type: string;
      brief: string;
      facultyName: string;
    };
  };
  projectId?: {
    _id: string;
    title: string;
    projectType: string;
  };
  assessmentType: 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External';
  githubLink?: string;
  reportUrl?: string;
  presentationUrl?: string;
  facultyGrade?: number;
  externalGrade?: number;
  facultyComments?: string;
  externalComments?: string;
  gradeReleased: boolean;
  submittedAt: string;
  students?: StudentEvaluation[];
}

interface StudentEvaluation {
  studentId: string;
  studentName: string;
  studentEmail: string;
  evaluation: {
    _id: string;
    internal: {
      cla1: { conduct: number; convert: number };
      cla2: { conduct: number; convert: number };
      cla3: { conduct: number; convert: number };
    };
    external: {
      reportPresentation: { conduct: number; convert: number };
    };
    totalInternal: number;
    totalExternal: number;
    total: number;
    isPublished: boolean;
  };
}

export function FacultyAssessmentPage() {
  useAuth(); // Keep for authentication check
  const { windows } = useWindowStatus();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [meetingLogs, setMeetingLogs] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedProjectLogs, setSelectedProjectLogs] = useState<any[] | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentEvaluation | null>(null);
  const [showGroupGrading, setShowGroupGrading] = useState(false);
  const [assessmentType, setAssessmentType] = useState<'CLA-1' | 'CLA-2' | 'CLA-3' | 'External'>('CLA-1');
  const [currentAssessmentType, setCurrentAssessmentType] = useState<'CLA-1' | 'CLA-2' | 'CLA-3' | 'External' | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [gradeData, setGradeData] = useState({
    grade: '',
    comments: ''
  });
  const [groupGradeData, setGroupGradeData] = useState<{
    students: Record<string, string>;
    comments: string;
  }>({
    students: {},
    comments: ''
  });

  // Determine current assessment type based on active windows
  const determineCurrentAssessmentType = (): 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External' | null => {
    const projectTypes: ('IDP' | 'UROP' | 'CAPSTONE')[] = ['IDP', 'UROP', 'CAPSTONE'];
    
    for (const type of projectTypes) {
      const activeType = getCurrentAssessmentType(windows, type);
      if (activeType) return activeType;
    }
    
    return null;
  };

  // Get max score for current assessment type
  const getMaxScore = (assessmentType: 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External'): number => {
    switch (assessmentType) {
      case 'CLA-1': return 20;
      case 'CLA-2': return 30;
      case 'CLA-3': return 50;
      case 'External': return 100;
      default: return 20;
    }
  };

  // Get converted score for display
  const getConvertedScore = (conductScore: number, assessmentType: 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External'): number => {
    switch (assessmentType) {
      case 'CLA-1': return Math.min(10, Math.round(conductScore * 10 / 20));
      case 'CLA-2': return Math.min(15, Math.round(conductScore * 15 / 30));
      case 'CLA-3': return Math.min(25, Math.round(conductScore * 25 / 50));
      case 'External': return Math.min(50, Math.round(conductScore * 50 / 100));
      default: return 0;
    }
  };

  // Check if any assessment window is open (for any project type)
  const canGrade = currentAssessmentType && ['IDP', 'UROP', 'CAPSTONE'].some(type => 
    isAssessmentTypeActive(windows, type as 'IDP' | 'UROP' | 'CAPSTONE', currentAssessmentType)
  );

  useEffect(() => {
    const initializeData = async () => {
      setInitializing(true);
      try {
        // Set current assessment type based on active windows
        const currentType = determineCurrentAssessmentType();
        setCurrentAssessmentType(currentType);
        setAssessmentType(currentType || 'CLA-1');
        
        await Promise.all([
          fetchSubmissions(currentType),
          fetchMeetingLogs()
        ]);
      } catch (error) {
        console.error('Error initializing assessment data:', error);
      } finally {
        setInitializing(false);
      }
    };
    
    if (windows.length > 0) {
      initializeData();
    }
  }, [windows]);

  const fetchSubmissions = async (assessmentType?: 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External' | null) => {
    setLoading(true);
    try {
      const params = assessmentType ? `?assessmentType=${assessmentType}` : '';
      const response = await api.get(`/student-evaluations/submissions${params}`);
      if (response.success && response.data && Array.isArray(response.data)) {
        // Filter submissions by assessment type if specified
        const filteredSubmissions = assessmentType 
          ? response.data.filter((sub: Submission) => sub.assessmentType === assessmentType)
          : response.data;
        setSubmissions(filteredSubmissions);
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

  const getProjectInfo = (submission: Submission) => {
    // Try to get project info from group's assignedProjectId first
    if (submission.groupId?.assignedProjectId) {
      return {
        title: submission.groupId.assignedProjectId.title,
        type: submission.groupId.assignedProjectId.type,
        projectId: submission.groupId.assignedProjectId.projectId,
        brief: submission.groupId.assignedProjectId.brief,
        facultyName: submission.groupId.assignedProjectId.facultyName
      };
    }
    
    // Try to get project info from student's assignedProjectId
    if (submission.studentId?.assignedProjectId) {
      return {
        title: submission.studentId.assignedProjectId.title,
        type: submission.studentId.assignedProjectId.type,
        projectId: submission.studentId.assignedProjectId.projectId,
        brief: submission.studentId.assignedProjectId.brief,
        facultyName: submission.studentId.assignedProjectId.facultyName
      };
    }
    
    // Fallback to projectId if available
    if (submission.projectId) {
      return {
        title: submission.projectId.title,
        type: submission.projectId.projectType,
        projectId: 'N/A',
        brief: 'No description available',
        facultyName: 'Unknown Faculty'
      };
    }
    
    // Default fallback
    return {
      title: 'Unknown Project',
      type: 'Unknown',
      projectId: 'N/A',
      brief: 'No project assigned',
      facultyName: 'Unknown Faculty'
    };
  };
  const handleGradeChange = async (logId: string, grade: number) => {
    if (grade < 0 || grade > 5) {
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
    if (!selectedStudent) return;

    // Show freeze warning before proceeding
    const confirmSubmit = window.confirm(
      '⚠️ IMPORTANT: Grade Submission Warning\n\n' +
      'Once you submit this grade, it will be FROZEN and cannot be modified without coordinator approval.\n\n' +
      'Please review the grade carefully before proceeding.\n\n' +
      'Are you sure you want to submit this grade?'
    );
    if (!confirmSubmit) {
      return;
    }

    const grade = parseFloat(gradeData.grade);
    const maxScore = getMaxScore(assessmentType);
    
    if (isNaN(grade) || grade < 0 || grade > maxScore) {
      toast.error(`Please enter a valid grade (0-${maxScore})`);
      return;
    }

    // Check if student already has published grades
    const existingEvaluation = selectedStudent.evaluation;
    if (existingEvaluation?.isPublished) {
      const confirmModify = window.confirm(
        '⚠️ WARNING: This student\'s grades have already been published and are visible to the student.\n\n' +
        'Modifying published grades may cause confusion and requires coordinator approval.\n\n' +
        'Are you sure you want to proceed?'
      );
      if (!confirmModify) {
        return;
      }
    }

    try {
      const component = assessmentType === 'CLA-1' ? 'cla1' : 
                      assessmentType === 'CLA-2' ? 'cla2' : 
                      assessmentType === 'CLA-3' ? 'cla3' : 'external';

      let endpoint = '';
      let payload: any = {};

      if (assessmentType === 'External') {
        endpoint = '/student-evaluations/external/score';
        payload = {
          studentId: selectedStudent.studentId,
          groupId: selectedSubmission?.groupId?._id,
          conductScore: grade,
          comments: gradeData.comments || ''
        };
      } else {
        endpoint = '/student-evaluations/internal/score';
        payload = {
          studentId: selectedStudent.studentId,
          groupId: selectedSubmission?.groupId?._id,
          component: component,
          conductScore: grade,
          comments: gradeData.comments || ''
        };
      }

      const response = await api.put(endpoint, payload);

      if (response.success) {
        toast.success('Grade submitted successfully');
        setSelectedStudent(null);
        setSelectedSubmission(null);
        setGradeData({ grade: '', comments: '' });
        fetchSubmissions();
      } else {
        toast.error((response as any).error?.message || 'Failed to submit grade');
      }
    } catch (error) {
      toast.error('Failed to submit grade');
    }
  };

  const handleGroupGradeSubmission = async () => {
    if (!selectedSubmission?.students) return;

    // Show freeze warning before proceeding
    const confirmSubmit = window.confirm(
      '⚠️ IMPORTANT: Grade Submission Warning\n\n' +
      'Once you submit these grades, they will be FROZEN and cannot be modified without coordinator approval.\n\n' +
      'Please review all grades carefully before proceeding.\n\n' +
      'Are you sure you want to submit these grades?'
    );
    if (!confirmSubmit) {
      return;
    }

    const maxScore = getMaxScore(assessmentType);
    const studentsToGrade = selectedSubmission.students;
    
    // Validate all grades
    const invalidGrades = studentsToGrade.filter(student => {
      const grade = parseFloat(groupGradeData.students[student.studentId] || '');
      return isNaN(grade) || grade < 0 || grade > maxScore;
    });

    if (invalidGrades.length > 0) {
      toast.error(`Please enter valid grades (0-${maxScore}) for all students`);
      return;
    }

    // Check if any student has published grades
    const publishedStudents = studentsToGrade.filter(student => student.evaluation?.isPublished);
    if (publishedStudents.length > 0) {
      const studentNames = publishedStudents.map(s => s.studentName).join(', ');
      const confirmModify = window.confirm(
        `⚠️ WARNING: The following students have published grades: ${studentNames}\n\n` +
        'Modifying published grades may cause confusion and requires coordinator approval.\n\n' +
        'Are you sure you want to proceed?'
      );
      if (!confirmModify) {
        return;
      }
    }

    try {
      const component = assessmentType === 'CLA-1' ? 'cla1' : 
                      assessmentType === 'CLA-2' ? 'cla2' : 
                      assessmentType === 'CLA-3' ? 'cla3' : 'external';

      // Submit grades for all students
      const gradePromises = studentsToGrade.map(student => {
        const grade = parseFloat(groupGradeData.students[student.studentId]);
        
        let endpoint = '';
        let payload: any = {};

        if (assessmentType === 'External') {
          endpoint = '/student-evaluations/external/score';
          payload = {
            studentId: student.studentId,
            groupId: selectedSubmission?.groupId?._id,
            conductScore: grade,
            comments: groupGradeData.comments || ''
          };
        } else {
          endpoint = '/student-evaluations/internal/score';
          payload = {
            studentId: student.studentId,
            groupId: selectedSubmission?.groupId?._id,
            component: component,
            conductScore: grade,
            comments: groupGradeData.comments || ''
          };
        }

        return api.put(endpoint, payload);
      });

      const results = await Promise.all(gradePromises);
      const failedGrades = results.filter(result => !result.success);

      if (failedGrades.length === 0) {
        toast.success(`Successfully graded all ${studentsToGrade.length} students`);
        setSelectedSubmission(null);
        setShowGroupGrading(false);
        setGroupGradeData({ students: {}, comments: '' });
        fetchSubmissions();
      } else {
        toast.error(`Failed to grade ${failedGrades.length} students. Please try again.`);
      }
    } catch (error) {
      toast.error('Failed to submit group grades');
    }
  };

  const getAssessmentBadge = (type: string) => {
    const colors = {
      'CLA-1': 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/30',
      'CLA-2': 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/30',
      'CLA-3': 'bg-pink-100 dark:bg-pink-500/20 text-pink-800 dark:text-pink-300 border-pink-300 dark:border-pink-500/30',
      External: 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-500/30'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${colors[type as keyof typeof colors]}`}>
        {type}
      </span>
    );
  };

  // Show loading while initializing
  if (initializing) {
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
                        {getAssessmentBadge(assessmentType)}
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-600 text-blue-800 dark:text-white text-xs font-medium rounded-lg border border-blue-300 dark:border-blue-600">
                          {getProjectInfo(submission).type}
                        </span>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 text-xs font-medium rounded-lg border border-green-300 dark:border-green-500/30">
                          Group Grading
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div>
                          <span className="text-sm font-medium text-text">Project: </span>
                          <span className="text-sm text-textSecondary">{getProjectInfo(submission).title}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-text">Project ID: </span>
                          <span className="text-sm text-textSecondary">{getProjectInfo(submission).projectId}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-text">Faculty: </span>
                          <span className="text-sm text-textSecondary">{getProjectInfo(submission).facultyName}</span>
                        </div>
                        {submission.groupId && (
                          <div>
                            <span className="text-sm font-medium text-text">Members: </span>
                            <span className="text-sm text-textSecondary">
                              {submission.groupId.members.length} students
                            </span>
                          </div>
                        )}
                        
                        {/* Student Grading List */}
                        {submission.students && submission.students.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-text">Student Grades ({assessmentType}):</span>
                              {/* Only show Grade Group button if not all students are graded for this assessment */}
                              {(() => {
                                const allGraded = submission.students?.every(student => {
                                  // If no evaluation record exists yet, student is not graded
                                  if (!student.evaluation) return false;
                                  
                                  const currentScore = assessmentType === 'CLA-1' ? student.evaluation.internal.cla1.conduct :
                                                     assessmentType === 'CLA-2' ? student.evaluation.internal.cla2.conduct :
                                                     assessmentType === 'CLA-3' ? student.evaluation.internal.cla3.conduct :
                                                     student.evaluation.external.reportPresentation.conduct;
                                  return currentScore > 0;
                                });
                                
                                return !allGraded ? (
                                  <button
                                    onClick={() => {
                                      setSelectedSubmission(submission);
                                      setShowGroupGrading(true);
                                      // Initialize group grade data with current scores
                                      const initialGrades: Record<string, string> = {};
                                      submission.students?.forEach(student => {
                                        // If no evaluation record exists yet, default to 0
                                        const currentScore = !student.evaluation ? 0 :
                                                           assessmentType === 'CLA-1' ? student.evaluation.internal.cla1.conduct :
                                                           assessmentType === 'CLA-2' ? student.evaluation.internal.cla2.conduct :
                                                           assessmentType === 'CLA-3' ? student.evaluation.internal.cla3.conduct :
                                                           student.evaluation.external.reportPresentation.conduct;
                                        initialGrades[student.studentId] = currentScore > 0 ? currentScore.toString() : '';
                                      });
                                      setGroupGradeData({
                                        students: initialGrades,
                                        comments: ''
                                      });
                                    }}
                                    className="px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-sm rounded transition-all"
                                  >
                                    Grade Group
                                  </button>
                                ) : (
                                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded">
                                    ✓ All Graded
                                  </span>
                                );
                              })()}
                            </div>
                            <div className="space-y-2">
                              {submission.students.map((student) => {
                                // If no evaluation record exists yet, default to 0
                                const currentScore = !student.evaluation ? 0 :
                                                   assessmentType === 'CLA-1' ? student.evaluation.internal.cla1.conduct :
                                                   assessmentType === 'CLA-2' ? student.evaluation.internal.cla2.conduct :
                                                   assessmentType === 'CLA-3' ? student.evaluation.internal.cla3.conduct :
                                                   student.evaluation.external.reportPresentation.conduct;
                                
                                const convertedScore = getConvertedScore(currentScore, assessmentType);
                                const maxScore = getMaxScore(assessmentType);
                                
                                return (
                                  <div key={student.studentId} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                    <div className="flex-1">
                                      <span className="text-sm font-medium text-text">{student.studentName}</span>
                                      <span className="text-xs text-textSecondary ml-2">({student.studentEmail})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {currentScore > 0 ? (
                                        <span className="text-sm text-success">
                                          {currentScore}/{maxScore} → {convertedScore}
                                        </span>
                                      ) : (
                                        <span className="text-sm text-textSecondary">Not graded</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
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
                            <div className="flex flex-col gap-1">
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
                                className="flex items-center gap-1 text-primary hover:underline cursor-pointer bg-none border-none p-0 text-left"
                              >
                                <FileText className="w-4 h-4" />
                                📄 View Report
                              </button>
                              <a
                                href={submission.reportUrl?.startsWith('/api/') 
                                  ? `${window.location.origin}${submission.reportUrl}`
                                  : submission.reportUrl}
                                download
                                className="flex items-center gap-1 text-green-600 hover:underline text-sm"
                              >
                                ⬇️ Download
                              </a>
                            </div>
                          )}
                          {/* Presentation only for External evaluation */}
                          {assessmentType === 'External' && submission.presentationUrl && (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => {
                                  const fullUrl = submission.presentationUrl?.startsWith('/api/') 
                                    ? `${window.location.origin}${submission.presentationUrl}`
                                    : submission.presentationUrl;
                                  
                                  // Create modal with embedded presentation
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
                                className="flex items-center gap-1 text-primary hover:underline cursor-pointer bg-none border-none p-0 text-left"
                              >
                                <Presentation className="w-4 h-4" />
                                📊 View Presentation
                              </button>
                              <a
                                href={submission.presentationUrl?.startsWith('/api/') 
                                  ? `${window.location.origin}${submission.presentationUrl}`
                                  : submission.presentationUrl}
                                download
                                className="flex items-center gap-1 text-green-600 hover:underline text-sm"
                              >
                                ⬇️ Download
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-textSecondary">
                        Submitted: {new Date(submission.submittedAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* Meeting logs and presentations only for External evaluation */}
                      {assessmentType === 'External' && submission.projectId?._id && meetingLogs[submission.projectId._id]?.length > 0 && (
                        <button
                          onClick={() => setSelectedProjectLogs(meetingLogs[submission.projectId!._id])}
                          className="px-3 py-2 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 text-blue-800 dark:text-blue-300 rounded-lg transition-all flex items-center gap-2 text-sm"
                          title="View Meeting Logs"
                        >
                          <FileText className="w-4 h-4" />
                          {meetingLogs[submission.projectId._id].length} Logs
                        </button>
                      )}
                      <button
                        onClick={() => {
                          // For group submissions, show the submission details modal
                          setSelectedSubmission(submission);
                          setSelectedStudent(null);
                          setGradeData({ grade: '', comments: '' });
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-all"
                        title="View Submission Details"
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
        {(selectedSubmission && (selectedStudent || showGroupGrading || (!selectedStudent && !showGroupGrading))) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setSelectedSubmission(null);
              setGradeData({ grade: '', comments: '' });
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-2xl"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {selectedStudent ? `Grade Student - ${assessmentType}` : 
                   showGroupGrading ? `Grade Group - ${assessmentType}` : 'Submission Details'}
                </h2>
                
                <div className="space-y-6">
                  {/* Submission Info */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Group:</span>
                      <p className="text-gray-900 dark:text-white font-semibold">
                        Group {selectedSubmission.groupId?.groupCode}
                      </p>
                    </div>
                    {selectedStudent && (
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Student:</span>
                        <p className="text-gray-900 dark:text-white font-semibold">
                          {selectedStudent.studentName} ({selectedStudent.studentEmail})
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Project:</span>
                      <p className="text-gray-900 dark:text-white font-semibold">{getProjectInfo(selectedSubmission).title}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Assessment:</span>
                      <div className="mt-1">{getAssessmentBadge(assessmentType)}</div>
                    </div>
                    {selectedStudent && (
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Max Score:</span>
                        <p className="text-gray-900 dark:text-white">
                          {getMaxScore(assessmentType)} marks → {getConvertedScore(getMaxScore(assessmentType), assessmentType)} converted
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Submission Links */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">Submitted Work</label>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedSubmission.githubLink && (
                        <a
                          href={selectedSubmission.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-all border border-gray-200 dark:border-gray-600"
                        >
                          <Github className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">GitHub Repository</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{selectedSubmission.githubLink}</p>
                          </div>
                        </a>
                      )}
                      {selectedSubmission.reportUrl && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">Report PDF</p>
                              <p className="text-xs text-gray-600 dark:text-gray-300">View or download</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const fullUrl = selectedSubmission.reportUrl?.startsWith('/api/') 
                                  ? `${window.location.origin}${selectedSubmission.reportUrl}`
                                  : selectedSubmission.reportUrl;
                                
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
                              className="text-blue-600 dark:text-blue-400 hover:underline text-sm cursor-pointer bg-none border-none p-0"
                            >
                              📄 View
                            </button>
                            <a
                              href={selectedSubmission.reportUrl?.startsWith('/api/') 
                                ? `${window.location.origin}${selectedSubmission.reportUrl}`
                                : selectedSubmission.reportUrl}
                              download
                              className="text-green-600 dark:text-green-400 hover:underline text-sm"
                            >
                              ⬇️ Download
                            </a>
                          </div>
                        </div>
                      )}
                      {/* Presentation only for External evaluation */}
                      {assessmentType === 'External' && selectedSubmission.presentationUrl && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center gap-3 mb-2">
                            <Presentation className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">Presentation</p>
                              <p className="text-xs text-gray-600 dark:text-gray-300">View or download</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const fullUrl = selectedSubmission.presentationUrl?.startsWith('/api/') 
                                  ? `${window.location.origin}${selectedSubmission.presentationUrl}`
                                  : selectedSubmission.presentationUrl;
                                
                                // Create modal with embedded presentation
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
                              className="text-blue-600 dark:text-blue-400 hover:underline text-sm cursor-pointer bg-none border-none p-0"
                            >
                              📊 View
                            </button>
                            <a
                              href={selectedSubmission.presentationUrl?.startsWith('/api/') 
                                ? `${window.location.origin}${selectedSubmission.presentationUrl}`
                                : selectedSubmission.presentationUrl}
                              download
                              className="text-green-600 dark:text-green-400 hover:underline text-sm"
                            >
                              ⬇️ Download
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Grading Form - Only show when grading a specific student */}
                  {selectedStudent && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Grade (0-{getMaxScore(assessmentType)}) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={getMaxScore(assessmentType)}
                          step="0.5"
                          value={gradeData.grade}
                          onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Enter grade (max ${getMaxScore(assessmentType)})`}
                        />
                        {gradeData.grade && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Converted score: {getConvertedScore(parseFloat(gradeData.grade) || 0, assessmentType)}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Comments / Feedback (Optional)
                        </label>
                        <textarea
                          value={gradeData.comments}
                          onChange={(e) => setGradeData({ ...gradeData, comments: e.target.value })}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          placeholder="Provide feedback to the student..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Group Grading Form - Show when grading entire group */}
                  {showGroupGrading && selectedSubmission.students && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                          Group Grading - {assessmentType}
                        </h4>
                        <p className="text-sm text-blue-600 dark:text-blue-300">
                          Enter grades for all students in this group. The same comment will be applied to all students.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          Student Grades (0-{getMaxScore(assessmentType)})
                        </h4>
                        {selectedSubmission.students.map((student) => {
                          // If no evaluation record exists yet, default to 0
                          const currentScore = !student.evaluation ? 0 :
                                             assessmentType === 'CLA-1' ? student.evaluation.internal.cla1.conduct :
                                             assessmentType === 'CLA-2' ? student.evaluation.internal.cla2.conduct :
                                             assessmentType === 'CLA-3' ? student.evaluation.internal.cla3.conduct :
                                             student.evaluation.external.reportPresentation.conduct;
                          
                          return (
                            <div key={student.studentId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">{student.studentName}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{student.studentEmail}</p>
                                {currentScore > 0 && (
                                  <p className="text-xs text-blue-600 dark:text-blue-400">
                                    Current: {currentScore}/{getMaxScore(assessmentType)}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={getMaxScore(assessmentType)}
                                  step="0.5"
                                  value={groupGradeData.students[student.studentId] || ''}
                                  onChange={(e) => setGroupGradeData({
                                    ...groupGradeData,
                                    students: {
                                      ...groupGradeData.students,
                                      [student.studentId]: e.target.value
                                    }
                                  })}
                                  className="w-20 px-3 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="0"
                                />
                                {groupGradeData.students[student.studentId] && (
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    → {getConvertedScore(parseFloat(groupGradeData.students[student.studentId]) || 0, assessmentType)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Group Comments / Feedback (Optional)
                        </label>
                        <textarea
                          value={groupGradeData.comments}
                          onChange={(e) => setGroupGradeData({ ...groupGradeData, comments: e.target.value })}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          placeholder="Provide feedback that will be shared with all group members..."
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          This comment will be applied to all students in the group
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Current Grades Display - Show when viewing submission details */}
                  {!selectedStudent && !showGroupGrading && selectedSubmission.students && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Current Grades ({assessmentType})</h3>
                      <div className="space-y-2">
                        {selectedSubmission.students.map((student) => {
                          // If no evaluation record exists yet, default to 0
                          const currentScore = !student.evaluation ? 0 :
                                             assessmentType === 'CLA-1' ? student.evaluation.internal.cla1.conduct :
                                             assessmentType === 'CLA-2' ? student.evaluation.internal.cla2.conduct :
                                             assessmentType === 'CLA-3' ? student.evaluation.internal.cla3.conduct :
                                             student.evaluation.external.reportPresentation.conduct;
                          
                          const convertedScore = getConvertedScore(currentScore, assessmentType);
                          const maxScore = getMaxScore(assessmentType);
                          
                          return (
                            <div key={student.studentId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{student.studentName}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{student.studentEmail}</p>
                              </div>
                              <div className="text-right">
                                {currentScore > 0 ? (
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {currentScore}/{maxScore}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      Converted: {convertedScore}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Not graded</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => {
                      setSelectedSubmission(null);
                      setSelectedStudent(null);
                      setShowGroupGrading(false);
                      setGradeData({ grade: '', comments: '' });
                      setGroupGradeData({ students: {}, comments: '' });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white transition-all"
                  >
                    Close
                  </button>
                  {selectedStudent && (
                    <button
                      onClick={handleGradeSubmission}
                      disabled={!gradeData.grade || parseFloat(gradeData.grade) < 0 || parseFloat(gradeData.grade) > getMaxScore(assessmentType)}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Submit Grade
                    </button>
                  )}
                  {showGroupGrading && (
                    <button
                      onClick={handleGroupGradeSubmission}
                      disabled={!selectedSubmission?.students?.every(student => 
                        groupGradeData.students[student.studentId] && 
                        parseFloat(groupGradeData.students[student.studentId]) >= 0 && 
                        parseFloat(groupGradeData.students[student.studentId]) <= getMaxScore(assessmentType)
                      )}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Submit Group Grades
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
