
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Github, Presentation, Video, Send, Eye, Calendar, Users, UserCheck, Award, Filter, SlidersHorizontal, ChevronRight, Download } from 'lucide-react';
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
import { SoloGradingModal } from './components/SoloGradingModal';
import { GroupGradingModal } from './components/GroupGradingModal';
import { AssessmentEmptyState } from '../../components/assessment/AssessmentEmptyState';
import { FacultyAssessmentSkeleton } from '../../components/assessment/AssessmentSkeleton';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { Separator } from '../../components/ui/Separator';

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

  // Modal & Confirmation States - now include full data for execution
  const [confirmSolo, setConfirmSolo] = useState<{ isOpen: boolean; grade: string; comments: string; student: any; submission: any } | null>(null);
  const [confirmGroup, setConfirmGroup] = useState<{ isOpen: boolean; grades: Record<string, string>; comments: string; submission: any; students: any[] } | null>(null);

  // Filter states
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Graded'>('All');
  const [filterType, setFilterType] = useState<'All' | 'Solo' | 'Group'>('All');

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

  // Get converted score for display (with one decimal place precision)
  const getConvertedScore = (conductScore: number, assessmentType: 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External'): number => {
    switch (assessmentType) {
      case 'CLA-1': return Math.min(10, Math.round(conductScore * 10 / 20 * 10) / 10);
      case 'CLA-2': return Math.min(15, Math.round(conductScore * 15 / 30 * 10) / 10);
      case 'CLA-3': return Math.min(25, Math.round(conductScore * 25 / 50 * 10) / 10);
      case 'External': return Math.min(50, Math.round(conductScore * 50 / 100 * 10) / 10);
      default: return 0;
    }
  };

  // Helper function to get project info from submission
  const getProjectInfo = (submission: Submission) => {
    // Use projectTitle from backend if available (set for both solo and group submissions)
    if ((submission as any).projectTitle && (submission as any).projectTitle !== 'Unknown Project') {
      return {
        title: (submission as any).projectTitle,
        type: submission.groupId?.assignedProjectId?.type || submission.studentId?.assignedProjectId?.type || submission.projectId?.projectType || 'Unknown',
        projectId: submission.groupId?.assignedProjectId?.projectId || submission.studentId?.assignedProjectId?.projectId || 'N/A',
        brief: submission.groupId?.assignedProjectId?.brief || submission.studentId?.assignedProjectId?.brief || 'No description available',
        facultyName: submission.groupId?.assignedProjectId?.facultyName || submission.studentId?.assignedProjectId?.facultyName || 'Unknown Faculty'
      };
    }

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

  // Helper to check grading status
  const getGradingStatus = (submission: Submission) => {
    if (!submission) return 'Pending';

    // Check if grade is released
    if (submission.gradeReleased) return 'Graded';

    // Check internal grading status for current type
    if (submission.students && submission.students.length > 0) {
      if (!currentAssessmentType) return 'Pending';

      const typeKey = currentAssessmentType.toLowerCase().replace('-', '') as 'cla1' | 'cla2' | 'cla3';
      const gradedCount = submission.students.filter(s =>
        s.evaluation?.internal?.[typeKey]?.conduct > 0
      ).length;

      if (gradedCount === submission.students.length) return 'Graded';
      if (gradedCount > 0) return 'Partial';
    }

    return 'Pending';
  };

  // Filter logic
  const filteredSubmissions = submissions.filter(submission => {
    // Type Filter
    if (filterType === 'Solo' && submission.groupId) return false;
    if (filterType === 'Group' && !submission.groupId) return false;

    // Status Filter
    const status = getGradingStatus(submission);
    if (filterStatus === 'Graded' && status !== 'Graded') return false;
    if (filterStatus === 'Pending' && status === 'Graded') return false;

    return true;
  });

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
        const filteredData = assessmentType
          ? fetchedSubmissions.filter((sub: Submission) => sub.assessmentType === assessmentType)
          : fetchedSubmissions;

        console.log('📊 Setting submissions:', filteredData.length, 'items');
        console.log(`📊 Assigned: ${groups} groups, ${solos} solo students`);

        setSubmissions(filteredData);
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

  const onSaveSolo = async (gradeVal: string, comments: string) => {
    if (!selectedStudent || !selectedSubmission) return;

    // Store all data in confirmation state so it persists after modal closes
    setConfirmSolo({
      isOpen: true,
      grade: gradeVal,
      comments,
      student: selectedStudent,
      submission: selectedSubmission
    });
  };

  const executeSaveSolo = async () => {
    if (!confirmSolo) return;
    const { grade: gradeVal, comments, student, submission } = confirmSolo;

    try {
      const component = assessmentType === 'CLA-1' ? 'cla1' :
        assessmentType === 'CLA-2' ? 'cla2' :
          assessmentType === 'CLA-3' ? 'cla3' : 'external';

      let endpoint = '';
      let payload: any = {};

      const grade = parseFloat(gradeVal);
      if (assessmentType === 'External') {
        endpoint = '/student-evaluations/external/score';
        payload = {
          studentId: student.studentId,
          groupId: submission?.groupId?._id,
          conductScore: grade,
          comments: comments || ''
        };
      } else {
        endpoint = '/student-evaluations/internal/score';
        payload = {
          studentId: student.studentId,
          groupId: submission?.groupId?._id,
          component: component,
          conductScore: grade,
          assessmentType: assessmentType,
          comments: comments || ''
        };
      }

      console.log('📤 Submitting grade:', { endpoint, payload });
      const response = await api.put(endpoint, payload);
      console.log('📥 Response:', response);

      if (response.success) {
        toast.success('Grade submitted successfully');
        setConfirmSolo(null);
        setSelectedStudent(null);
        setSelectedSubmission(null);
        fetchSubmissions(currentAssessmentType);
      } else {
        throw new Error((response as any).error?.message || 'Failed to submit grade');
      }
    } catch (error: any) {
      console.error('❌ Grade submission error:', error);
      toast.error(error.message || 'Failed to submit grade');
    }
  };

  const onSaveGroup = async (grades: Record<string, string>, comments: string) => {
    if (!selectedSubmission?.students) return;

    // Store all data in confirmation state so it persists after modal closes
    setConfirmGroup({
      isOpen: true,
      grades,
      comments,
      submission: selectedSubmission,
      students: selectedSubmission.students
    });
  };

  const executeSaveGroup = async () => {
    if (!confirmGroup) return;
    const { grades, comments, submission, students: studentsToGrade } = confirmGroup;

    try {
      const component = assessmentType === 'CLA-1' ? 'cla1' :
        assessmentType === 'CLA-2' ? 'cla2' :
          assessmentType === 'CLA-3' ? 'cla3' : 'external';

      console.log('📤 Submitting group grades for', studentsToGrade.length, 'students');

      // Submit grades for all students
      const gradePromises = studentsToGrade.map(student => {
        const gradeVal = grades[student.studentId];
        const grade = parseFloat(gradeVal || '0');

        let endpoint = '';
        let payload: any = {};

        if (assessmentType === 'External') {
          endpoint = '/student-evaluations/external/score';
          payload = {
            studentId: student.studentId,
            groupId: submission?.groupId?._id,
            conductScore: grade,
            comments: comments || ''
          };
        } else {
          endpoint = '/student-evaluations/internal/score';
          payload = {
            studentId: student.studentId,
            groupId: submission?.groupId?._id,
            component: component,
            conductScore: grade,
            assessmentType: assessmentType,
            comments: comments || ''
          };
        }

        console.log('📤 Student payload:', payload);
        return api.put(endpoint, payload);
      });

      const results = await Promise.all(gradePromises);
      console.log('📥 Results:', results);
      const failedGrades = results.filter(result => !result.success);

      if (failedGrades.length === 0) {
        toast.success(`Successfully graded all ${studentsToGrade.length} students`);
        setConfirmGroup(null);
        setSelectedSubmission(null);
        setShowGroupGrading(false);
        fetchSubmissions(currentAssessmentType);
      } else {
        console.error('❌ Failed grades:', failedGrades);
        toast.error(`Failed to grade ${failedGrades.length} students. Please try again.`);
      }
    } catch (error) {
      console.error('❌ Group grade submission error:', error);
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
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-500 py-1">
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
                <div className="space-y-6">
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <Filter className="w-4 h-4" />
                      Filters:
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Status</span>
                      <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                        {(['All', 'Pending', 'Graded'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterStatus === status
                              ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                              }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Type</span>
                      <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                        {(['All', 'Solo', 'Group'] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterType === type
                              ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                              }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="ml-auto text-xs text-slate-500 font-medium">
                      Showing {filteredSubmissions.length} submissions
                    </div>
                  </div>

                  {filteredSubmissions.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center opacity-60">
                      <Filter className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-slate-500 font-medium">No submissions match your filters</p>
                      <button
                        onClick={() => { setFilterStatus('All'); setFilterType('All'); }}
                        className="text-amber-600 text-sm mt-2 hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {filteredSubmissions.map((submission) => {
                        const projectInfo = getProjectInfo(submission);
                        const status = getGradingStatus(submission);
                        const isGraded = status === 'Graded';
                        const isPartial = status === 'Partial';

                        return (
                          <motion.div
                            key={submission._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <GlassCard className="group relative overflow-hidden transition-all hover:shadow-md border-l-4 border-l-transparent hover:border-l-amber-500">
                              <div className="p-5">
                                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                                  {/* Left Section: Identity & Project */}
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-start justify-between md:justify-start gap-4">
                                      <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors leading-tight">
                                          {projectInfo.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1.5">
                                          <Badge variant={submission.groupId ? 'secondary' : 'outline'} className="text-[10px] h-5 px-2 bg-amber-50 text-amber-700 border-amber-100">
                                            {submission.groupId ? 'GROUP' : 'SOLO'}
                                          </Badge>

                                          <div className="flex items-center gap-2">
                                            {submission.groupId ? (
                                              <div className="flex -space-x-1.5 overflow-hidden p-0.5">
                                                {submission.groupId.members?.slice(0, 3).map((member: any, i: number) => (
                                                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-700 shadow-sm" title={member.name}>
                                                    {member.name?.charAt(0)}
                                                  </div>
                                                ))}
                                                {submission.groupId.members && submission.groupId.members.length > 3 && (
                                                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-500 shadow-sm">
                                                    +{submission.groupId.members.length - 3}
                                                  </div>
                                                )}
                                              </div>
                                            ) : (
                                              <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-amber-700 dark:text-amber-400 shadow-sm">
                                                {submission.studentId?.name?.charAt(0)}
                                              </div>
                                            )}
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                              {submission.groupId
                                                ? `Group ${submission.groupId.groupCode}`
                                                : submission.studentId?.name}
                                            </span>
                                          </div>

                                          <div className="h-3 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

                                          <Badge variant="outline" className="text-[10px] h-5 px-2 border-slate-200 text-slate-500 font-medium">
                                            {projectInfo.type}
                                          </Badge>
                                        </div>
                                      </div>

                                      {/* Mobile Status Badge */}
                                      <div className="md:hidden">
                                        {isGraded ? (
                                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                                            Graded
                                          </Badge>
                                        ) : isPartial ? (
                                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">
                                            Partial
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-slate-500 border-dashed">
                                            Pending
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mt-1">
                                      {projectInfo.brief}
                                    </p>

                                    <div className="flex items-center gap-4 pt-1">
                                      {/* Metadata Icons with Tooltips */}
                                      {submission.githubLink && (
                                        <a
                                          href={submission.githubLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md"
                                          title="View GitHub Repository"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Github className="w-3.5 h-3.5" />
                                          <span className="hidden sm:inline">Repo</span>
                                        </a>
                                      )}

                                      {submission.reportUrl && (
                                        <div
                                          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md cursor-default"
                                          title="Report Available"
                                        >
                                          <FileText className="w-3.5 h-3.5" />
                                          <span className="hidden sm:inline">Report</span>
                                        </div>
                                      )}

                                      <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto md:ml-0">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(submission.submittedAt).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right Section: Actions & Status */}
                                  <div className="flex items-center gap-4 pl-4 md:border-l border-slate-100 dark:border-slate-800">
                                    {isGraded ? (
                                      <div className="flex flex-col items-end">
                                        <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                                          <UserCheck className="w-3 h-3" /> Fully Graded
                                        </span>
                                        <span className="text-[10px] text-slate-400">All students evaluated</span>
                                      </div>
                                    ) : isPartial ? (
                                      <div className="flex flex-col items-end">
                                        <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                                          <SlidersHorizontal className="w-3 h-3" /> In Progress
                                        </span>
                                        <span className="text-[10px] text-slate-400">Some students graded</span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-end">
                                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                          Not Graded
                                        </span>
                                        <span className="text-[10px] text-slate-400">Ready for evaluation</span>
                                      </div>
                                    )}

                                    <Button
                                      onClick={() => {
                                        setSelectedSubmission(submission);
                                        if (submission.groupId) {
                                          setShowGroupGrading(true);
                                          // Initialize group grading data
                                          const studentGrades: Record<string, string> = {};
                                          submission.students?.forEach(s => {
                                            const typeKey = currentAssessmentType?.toLowerCase().replace('-', '') as 'cla1' | 'cla2' | 'cla3' | undefined;
                                            if (typeKey && s.evaluation?.internal?.[typeKey]?.conduct) {
                                              studentGrades[s.studentId] = s.evaluation.internal[typeKey].conduct.toString();
                                            }
                                          });
                                          setGroupGradeData({ students: studentGrades, comments: '' });
                                        } else {
                                          // Initialize solo grading data
                                          const student = submission.students?.[0];
                                          if (student) {
                                            setSelectedStudent(student);
                                            const typeKey = currentAssessmentType?.toLowerCase().replace('-', '') as 'cla1' | 'cla2' | 'cla3' | undefined;
                                            const savedGrade = typeKey ? student.evaluation?.internal?.[typeKey]?.conduct : 0;
                                            setGradeData({
                                              grade: savedGrade ? savedGrade.toString() : '',
                                              comments: ''
                                            });
                                          }
                                        }
                                      }}
                                      className={`min-w-[120px] ${isGraded
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                                        }`}
                                    >
                                      {isGraded ? 'Edit Grades' : isPartial ? 'Continue Grading' : 'Grade Submission'}
                                      <ChevronRight className="w-4 h-4 ml-2 opacity-50" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </GlassCard>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Show meeting logs even without submissions */}
                {
                  Object.keys(meetingLogs).length > 0 && (
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
                  )
                }
              </>
            )}
          </div>
        )
        }

        {/* New Grading Modals */}
        <SoloGradingModal
          isOpen={!!(selectedSubmission && selectedStudent)}
          onClose={() => {
            setSelectedSubmission(null);
            setSelectedStudent(null);
            setGradeData({ grade: '', comments: '' });
          }}
          student={selectedStudent}
          submission={selectedSubmission}
          assessmentType={currentAssessmentType || 'CLA-1'}
          maxScore={getMaxScore(currentAssessmentType || 'CLA-1')}
          onSave={onSaveSolo}
          getConvertedScore={getConvertedScore}
        />

        <GroupGradingModal
          isOpen={!!(selectedSubmission && showGroupGrading)}
          onClose={() => {
            setSelectedSubmission(null);
            setShowGroupGrading(false);
            setGroupGradeData({ students: {}, comments: '' });
          }}
          submission={selectedSubmission}
          assessmentType={currentAssessmentType || 'CLA-1'}
          maxScore={getMaxScore(currentAssessmentType || 'CLA-1')}
          onSave={onSaveGroup}
          getConvertedScore={getConvertedScore}
        />

        {
          confirmSolo && (
            <ConfirmationModal
              isOpen={confirmSolo.isOpen}
              onClose={() => setConfirmSolo(null)}
              onConfirm={executeSaveSolo}
              title="Confirm Grade Submission"
              message="You are about to submit this grade. The grade will be visible to the coordinator."
              details={confirmSolo.student?.evaluation?.isPublished ? "Note: This grade is already published to the student." : undefined}
              confirmText="Submit Grade"
              type="warning"
            />
          )
        }

        {
          confirmGroup && (
            <ConfirmationModal
              isOpen={confirmGroup.isOpen}
              onClose={() => setConfirmGroup(null)}
              onConfirm={executeSaveGroup}
              title="Submit Group Grades"
              message={`You are about to submit grades for all ${confirmGroup.students?.length || 0} students in this group.`}
              confirmText="Submit Group Grades"
              type="warning"
            />
          )
        }
      </motion.div >
    </div >
  );
}
