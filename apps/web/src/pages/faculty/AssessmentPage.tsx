
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Github, Presentation, Video, Send, Eye, Calendar, Users, UserCheck, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button, Input, Label, Textarea } from '../../components/ui';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';
import { useWindowStatus } from '../../hooks/useWindowStatus';
import { WindowClosedMessage } from '../../components/common/WindowClosedMessage';
import { api } from '../../utils/api';
import { getCurrentAssessmentType, isAssessmentTypeActive } from '../../utils/assessmentHelper';
import { ExternalEvaluatorTab } from './components/ExternalEvaluatorTab';
import { AssessmentEmptyState } from '../../components/assessment/AssessmentEmptyState';
import { FacultyAssessmentSkeleton } from '../../components/assessment/AssessmentSkeleton';

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
  comments?: string;
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
  const [assignedGroupCount, setAssignedGroupCount] = useState<number>(0);
  const [assignedSoloCount, setAssignedSoloCount] = useState<number>(0);
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

  // Helper function to get project info from submission
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

  // Simplified: Faculty can grade if they have submissions for the current assessment type
  // Window status is informational only, not blocking
  const canGrade = submissions.length > 0;

  // Check if any window is active (for informational badge only)
  const isAnyWindowActive = currentAssessmentType && ['IDP', 'UROP', 'CAPSTONE'].some(type =>
    isAssessmentTypeActive(windows, type as 'IDP' | 'UROP' | 'CAPSTONE', currentAssessmentType)
  );

  useEffect(() => {
    const initializeData = async () => {
      console.log('📊 Faculty Assessment: Initializing data...');
      setInitializing(true);
      try {
        // Set current assessment type based on active windows
        const currentType = determineCurrentAssessmentType();
        console.log('📊 Determined assessment type:', currentType);
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
      console.log('📊 Windows loaded, calling initializeData. Windows count:', windows.length);
      initializeData();
    } else {
      console.log('📊 Waiting for windows to load...');
    }
  }, [windows]);

  const fetchSubmissions = async (assessmentType?: 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External' | null) => {
    console.log('📡 fetchSubmissions called with assessmentType:', assessmentType);
    setLoading(true);
    try {
      const params = assessmentType ? `?assessmentType=${assessmentType}` : '';
      console.log('📡 Fetching from: /student-evaluations/submissions' + params);
      const response = await api.get(`/student-evaluations/submissions${params}`);
      console.log('📡 Faculty submissions response:', response);

      if (response.success && response.data) {
        const data = response.data as { submissions: Submission[]; assignedGroupCount: number; assignedSoloCount: number };
        const { submissions: fetchedSubmissions, assignedGroupCount: groups, assignedSoloCount: solos } = data;

        // Update counts
        setAssignedGroupCount(groups || 0);
        setAssignedSoloCount(solos || 0);

        // Filter submissions by assessment type if specified
        const filteredSubmissions = assessmentType
          ? fetchedSubmissions.filter((sub: Submission) => sub.assessmentType === assessmentType)
          : fetchedSubmissions;

        console.log('📊 Setting submissions:', filteredSubmissions.length, 'items');
        console.log(`📊 Assigned: ${groups} groups, ${solos} solo students`);

        setSubmissions(filteredSubmissions);
      } else {
        console.log('📊 No submissions or failed response, setting defaults');
        setSubmissions([]);
        setAssignedGroupCount(0);
        setAssignedSoloCount(0);
      }
    } catch (error) {
      console.error('📊 Error fetching submissions:', error);
      toast.error('Failed to fetch submissions');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };


  const handleGradeChange = async (logId: string, grade: number) => {
    if (grade < 0 || grade > 5) {
      toast.error('Grade must be between 0 and 5');
      return;
    }

    try {
      const response = await api.put(`/ meetings / logs / ${logId}/grade`, { grade });

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
    const variant =
      type === 'CLA-1' ? 'info' :
        type === 'CLA-2' ? 'secondary' :
          type === 'CLA-3' ? 'warning' :
            'default';

    return (
      <Badge variant={variant as any}>
        {type}
      </Badge>
    );
  };

  // Show loading while initializing
  if (initializing) {
    return (
      <div className="min-h-screen p-6 max-w-7xl mx-auto py-12">
        <FacultyAssessmentSkeleton />
      </div>
    );
  }

  // Show window closed message if assessment window is not open at all
  if (!currentAssessmentType || !isAnyWindowActive) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <AssessmentEmptyState
          title="No Active Assessment Windows"
          description="There are currently no scheduled assessment windows open for any project types."
          icon="clock"
          theme="amber"
          subtitle="CLOSED"
        />
      </div>
    );
  }

  return (
    <div className="p-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header - Dynamic based on assessment type */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            {currentAssessmentType === 'External' ? (
              <UserCheck className="w-8 h-8 text-amber-600" />
            ) : (
              <Users className="w-8 h-8 text-amber-600" />
            )}
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-500">
              {currentAssessmentType === 'External' ? 'External Evaluation' : 'Internal Grading'}
            </h1>
          </div>
          <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
            {currentAssessmentType ? (
              <>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">
                  {currentAssessmentType}
                </span>
                Review submissions and provide grades
                {isAnyWindowActive && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                    Window Active
                  </span>
                )}
              </>
            ) : (
              'No active assessment window'
            )}
          </p>
        </div>

        {/* Content - Render based on assessment type */}
        {currentAssessmentType === 'External' ? (
          /* External Evaluation Content */
          <ExternalEvaluatorTab />
        ) : (
          /* Internal Grading Content */
          <div className="space-y-6">
            {loading ? (
              <div className="py-12">
                <FacultyAssessmentSkeleton />
              </div>
            ) : (assignedGroupCount + assignedSoloCount) === 0 ? (
              <div className="py-8">
                <AssessmentEmptyState
                  title="No Active Students Assigned"
                  description="You currently don't have any students or groups assigned to you for this semester's projects."
                  subDescription="Only faculty with accepted applications and assigned projects can evaluate students."
                  icon="users"
                  theme="amber"
                  subtitle="LOCKED"
                />
              </div>
            ) : (
              <>
                {submissions.length === 0 ? (
                  <div className="py-8">
                    <AssessmentEmptyState
                      title="No Submissions Yet"
                      description={currentAssessmentType ? `The students assigned to you haven't submitted their work for ${currentAssessmentType} yet.` : `No active assessment window found.`}
                      subDescription="Check back later once students have uploaded their project reports or links."
                      icon="file-text"
                      theme="amber"
                      subtitle="GRADING"
                    />
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {submissions.map((submission) => (
                      <motion.div
                        key={submission._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <GlassCard className="p-6 hover:bg-amber-50/50 dark:hover:bg-amber-500/5 transition-all group overflow-hidden relative">
                          {/* Selection Highlight */}
                          <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-amber-500 transition-all" />

                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-3">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                  {submission.groupId
                                    ? `Group ${submission.groupId.groupCode}`
                                    : submission.studentId?.name}
                                </h3>
                                {getAssessmentBadge(assessmentType)}
                                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-500/20">
                                  {getProjectInfo(submission).type}
                                </span>
                                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20">
                                  {submission.groupId ? 'Group Grading' : 'Solo Grading'}
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
                                      {submission.groupId && submission.students?.some((s: any) => !s.evaluation || !s.evaluation.internal?.[assessmentType.toLowerCase().replace('-', '') as 'cla1' | 'cla2' | 'cla3']?.conduct) && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 text-xs border-amber-500/50 text-amber-700 hover:bg-amber-50"
                                          onClick={() => {
                                            const initialGrades: Record<string, string> = {};
                                            submission.students?.forEach((s: any) => {
                                              initialGrades[s.studentId] = s.evaluation?.internal?.[assessmentType.toLowerCase().replace('-', '') as 'cla1' | 'cla2' | 'cla3']?.conduct?.toString() || '';
                                            });
                                            setGroupGradeData({
                                              students: initialGrades,
                                              comments: ''
                                            });
                                            setSelectedSubmission(submission);
                                            setShowGroupGrading(true);
                                          }}
                                        >
                                          Grade Group
                                        </Button>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      {submission.students?.map((student: any) => {
                                        const evalData = student.evaluation?.internal?.[assessmentType.toLowerCase().replace('-', '') as 'cla1' | 'cla2' | 'cla3'];
                                        const isGraded = evalData && evalData.conduct > 0;

                                        return (
                                          <div key={student.studentId} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-white/5">
                                            <div className="flex flex-col">
                                              <span className="text-sm font-medium text-text">{student.studentName}</span>
                                              <span className="text-xs text-textSecondary">{student.studentEmail}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              {isGraded ? (
                                                <div className="flex items-center gap-2">
                                                  <Badge variant="success" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                                                    {evalData.conduct}/{getMaxScore(assessmentType)}
                                                  </Badge>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-textSecondary hover:text-amber-600"
                                                    onClick={() => {
                                                      setSelectedSubmission(submission);
                                                      setSelectedStudent(student);
                                                      setGradeData({
                                                        grade: evalData.conduct.toString(),
                                                        comments: evalData.comments || ''
                                                      });
                                                    }}
                                                  >
                                                    <Eye className="w-4 h-4" />
                                                  </Button>
                                                </div>
                                              ) : (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="h-8 border-amber-500/50 text-amber-700 hover:bg-amber-50"
                                                  onClick={() => {
                                                    setSelectedSubmission(submission);
                                                    setSelectedStudent(student);
                                                    setGradeData({ grade: '', comments: '' });
                                                  }}
                                                >
                                                  Grade
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                              <span className="text-xs text-textSecondary">
                                Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                              </span>
                              <div className="flex flex-col gap-2">
                                {submission.reportUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start gap-2 bg-white/5 border-white/10 hover:bg-amber-50"
                                    onClick={() => window.open(submission.reportUrl, '_blank')}
                                  >
                                    <FileText className="w-4 h-4 text-amber-600" />
                                    <span>Report</span>
                                  </Button>
                                )}
                                {submission.presentationUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start gap-2 bg-white/5 border-white/10 hover:bg-amber-50"
                                    onClick={() => window.open(submission.presentationUrl, '_blank')}
                                  >
                                    <Presentation className="w-4 h-4 text-amber-600" />
                                    <span>PPT</span>
                                  </Button>
                                )}
                                {submission.githubLink && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start gap-2 bg-white/5 border-white/10 hover:bg-amber-50"
                                    onClick={() => window.open(submission.githubLink, '_blank')}
                                  >
                                    <Github className="w-4 h-4 text-slate-900" />
                                    <span>GitHub</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          {submission.comments && (
                            <div className="mt-4 p-3 bg-amber-50/50 dark:bg-amber-500/5 rounded-lg border border-amber-200/50 dark:border-amber-500/10">
                              <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1">Student Comments</p>
                              <p className="text-sm text-textSecondary italic">"{submission.comments}"</p>
                            </div>
                          )}
                        </GlassCard>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Show meeting logs even without submissions */}
                {Object.keys(meetingLogs).length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Meeting Logs by Project</h2>
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
                                    <span className="px-3 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-bold rounded-xl border border-amber-500/20">
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
                                          <span className="text-base font-semibold text-slate-900">Meeting #{index + 1}</span>
                                          {log.status === 'approved' && (
                                            <Badge variant="success">
                                              Approved
                                            </Badge>
                                          )}
                                          {log.status === 'completed' && (
                                            <Badge variant="info">
                                              Completed
                                            </Badge>
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
                                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                  : 'bg-slate-50 text-slate-500 border border-slate-200'
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
                                          <Label className="text-sm font-medium text-text">Grade (out of 5):</Label>
                                          <Input
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
            )}
          </div>
        )
        }

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
                className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-amber-200/50 dark:border-amber-500/20"
              >
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <Award className="w-6 h-6 text-amber-600" />
                    </div>
                    {selectedStudent ? `Grade Student - ${assessmentType}` :
                      showGroupGrading ? `Grade Group - ${assessmentType}` : 'Submission Details'}
                  </h2>

                  <div className="space-y-6">
                    {/* Submission Info */}
                    <div className="p-4 bg-amber-50/50 dark:bg-amber-500/5 rounded-xl border border-amber-200/50 dark:border-amber-500/10 space-y-3">
                      <div>
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Group:</span>
                        <p className="text-slate-900 dark:text-white font-semibold">
                          Group {selectedSubmission.groupId?.groupCode}
                        </p>
                      </div>
                      {selectedStudent && (
                        <div>
                          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Student:</span>
                          <p className="text-slate-900 dark:text-white font-semibold">
                            {selectedStudent.studentName} ({selectedStudent.studentEmail})
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Project:</span>
                        <p className="text-slate-900 dark:text-white font-semibold">{getProjectInfo(selectedSubmission).title}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Assessment:</span>
                        <div className="mt-1">{getAssessmentBadge(assessmentType)}</div>
                      </div>
                      {selectedStudent && (
                        <div>
                          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Max Score:</span>
                          <p className="text-slate-900 dark:text-white">
                            {getMaxScore(assessmentType)} marks → {getConvertedScore(getMaxScore(assessmentType), assessmentType)} converted
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Submission Links */}
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">Submitted Work</label>
                      <div className="grid grid-cols-1 gap-3">
                        {selectedSubmission.githubLink && (
                          <a
                            href={selectedSubmission.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-all border border-slate-200 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-500/30 group"
                          >
                            <Github className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300">GitHub Repository</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{selectedSubmission.githubLink}</p>
                            </div>
                          </a>
                        )}
                        {selectedSubmission.reportUrl && (
                          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-3">
                              <FileText className="w-5 h-5 text-amber-600" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">Report PDF</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">View or download</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
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
                                className="h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                              >
                                📄 View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                              >
                                <a
                                  href={selectedSubmission.reportUrl?.startsWith('/api/')
                                    ? `${window.location.origin}${selectedSubmission.reportUrl}`
                                    : selectedSubmission.reportUrl}
                                  download
                                >
                                  ⬇️ Download
                                </a>
                              </Button>
                            </div>
                          </div>
                        )}
                        {/* Presentation only for External evaluation */}
                        {assessmentType === 'External' && selectedSubmission.presentationUrl && (
                          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-3">
                              <Presentation className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">Presentation</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">View or download</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
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
                                className="h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                              >
                                📊 View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                              >
                                <a
                                  href={selectedSubmission.presentationUrl?.startsWith('/api/')
                                    ? `${window.location.origin}${selectedSubmission.presentationUrl}`
                                    : selectedSubmission.presentationUrl}
                                  download
                                >
                                  ⬇️ Download
                                </a>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Grading Form - Only show when grading a specific student */}
                    {selectedStudent && (
                      <div className="space-y-4 bg-amber-50/50 dark:bg-amber-500/5 p-4 rounded-xl border border-amber-200/50 dark:border-amber-500/10">
                        <div>
                          <Label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                            Grade (0-{getMaxScore(assessmentType)}) *
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            max={getMaxScore(assessmentType)}
                            step="0.5"
                            value={gradeData.grade}
                            onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
                            placeholder={`Enter grade (max ${getMaxScore(assessmentType)})`}
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          />
                          {gradeData.grade && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              Converted score: {getConvertedScore(parseFloat(gradeData.grade) || 0, assessmentType)}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                            Comments / Feedback (Optional)
                          </Label>
                          <Textarea
                            value={gradeData.comments}
                            onChange={(e) => setGradeData({ ...gradeData, comments: e.target.value })}
                            rows={3}
                            placeholder="Provide feedback to the student..."
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    {/* Group Grading Form - Show when grading entire group */}
                    {showGroupGrading && selectedSubmission.students && (
                      <div className="space-y-4">
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                          <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                            Group Grading - {assessmentType}
                          </h4>
                          <p className="text-sm text-amber-600 dark:text-amber-300">
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
                              <div key={student.studentId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="flex-1">
                                  <p className="font-medium text-slate-900 dark:text-white">{student.studentName}</p>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">{student.studentEmail}</p>
                                  {currentScore > 0 && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                                      Current: {currentScore}/{getMaxScore(assessmentType)}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Input
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
                                    className="w-20"
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
                          <Label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Group Comments / Feedback (Optional)
                          </Label>
                          <Textarea
                            value={groupGradeData.comments}
                            onChange={(e) => setGroupGradeData({ ...groupGradeData, comments: e.target.value })}
                            rows={3}
                            placeholder="Provide feedback that will be shared with all group members..."
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            This comment will be applied to all students in the group
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Current Grades Display - Show when viewing the submission details */}
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
                              <div key={student.studentId} className="flex items-center justify-between p-3 bg-amber-50/50 dark:bg-amber-500/5 rounded-lg border border-amber-200/50 dark:border-amber-500/10">
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-white">{student.studentName}</p>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">{student.studentEmail}</p>
                                </div>
                                <div className="text-right">
                                  {currentScore > 0 ? (
                                    <div>
                                      <p className="font-medium text-slate-900 dark:text-white">
                                        {currentScore}/{maxScore}
                                      </p>
                                      <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Converted: {convertedScore}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Not graded</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6 pt-6 border-t border-amber-200/50 dark:border-amber-500/20">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedSubmission(null);
                        setSelectedStudent(null);
                        setShowGroupGrading(false);
                        setGradeData({ grade: '', comments: '' });
                        setGroupGradeData({ students: {}, comments: '' });
                      }}
                      className="flex-1"
                    >
                      Close
                    </Button>
                    {selectedStudent && (
                      <Button
                        onClick={handleGradeSubmission}
                        disabled={!gradeData.grade || parseFloat(gradeData.grade) < 0 || parseFloat(gradeData.grade) > getMaxScore(assessmentType)}
                        className="flex-1"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Submit Grade
                      </Button>
                    )}
                    {showGroupGrading && (
                      <Button
                        onClick={handleGroupGradeSubmission}
                        disabled={!selectedSubmission?.students?.every(student =>
                          groupGradeData.students[student.studentId] &&
                          parseFloat(groupGradeData.students[student.studentId]) >= 0 &&
                          parseFloat(groupGradeData.students[student.studentId]) <= getMaxScore(assessmentType)
                        )}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Submit Group Grades
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
