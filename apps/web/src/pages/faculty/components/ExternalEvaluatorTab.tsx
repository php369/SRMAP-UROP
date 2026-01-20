import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, User, FileText, Calendar, MessageSquare, Star } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../utils/api';
import { toast } from 'sonner';
import { AssessmentEmptyState } from '../../../components/assessment/AssessmentEmptyState';
import { FacultyAssessmentSkeleton } from '../../../components/assessment/AssessmentSkeleton';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { cn } from '../../../utils/cn';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

interface ExternalAssignment {
  _id: string;
  submissionType: 'group' | 'solo';
  groupId?: {
    _id: string;
    groupCode: string;
    members: Array<{
      _id: string;
      name: string;
      email: string;
      studentId: string;
    }>;
  };
  studentInfo?: {
    _id: string;
    name: string;
    email: string;
    studentId: string;
  };
  projectInfo: {
    _id: string;
    title: string;
    projectId: string;
    type: string;
    brief: string;
    facultyName: string;
  };
  internalFaculty: {
    _id: string;
    name: string;
    email: string;
  };
  assessmentType: 'External';
}

interface MeetingLog {
  _id: string;
  date: string;
  duration: number;
  summary: string;
  grade?: number;
  createdAt: string;
}

export function ExternalEvaluatorTab() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<ExternalAssignment[]>([]);
  const [meetingLogs, setMeetingLogs] = useState<Record<string, MeetingLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<ExternalAssignment | null>(null);
  const [gradeData, setGradeData] = useState({
    grade: '',
    comments: ''
  });

  // Fetch external evaluator assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const response = await api.get(`/student-evaluations/external-assignments/${user.id}`) as ApiResponse<ExternalAssignment[]>;
        if (response.success && response.data) {
          setAssignments(response.data);
        } else {
          toast.error('Failed to fetch external evaluator assignments');
        }
      } catch (error: any) {
        console.error('Error fetching assignments:', error);
        toast.error(error.response?.data?.message || 'Failed to fetch assignments');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [user?.id]);

  // Fetch meeting logs for a specific project
  const fetchMeetingLogs = async (projectId: string) => {
    try {
      const response = await api.get(`/meetings/logs/project/${projectId}`) as ApiResponse<MeetingLog[]>;
      if (response.success && response.data) {
        setMeetingLogs(prev => ({
          ...prev,
          [projectId]: response.data || []
        }));
      }
    } catch (error: any) {
      console.error('Error fetching meeting logs:', error);
      toast.error('Failed to fetch meeting logs');
    }
  };

  // Handle assignment selection
  const handleAssignmentSelect = async (assignment: ExternalAssignment) => {
    setSelectedAssignment(assignment);
    await fetchMeetingLogs(assignment.projectInfo._id);
  };

  // Handle external evaluation submission
  const handleSubmitEvaluation = async () => {
    if (!selectedAssignment || !gradeData.grade) {
      toast.error('Please enter a grade');
      return;
    }

    const grade = parseFloat(gradeData.grade);
    if (grade < 0 || grade > 100) {
      toast.error('Grade must be between 0 and 100');
      return;
    }

    try {
      const studentId = selectedAssignment.submissionType === 'group'
        ? selectedAssignment.groupId?.members[0]._id // For group, we'll need to handle all members
        : selectedAssignment.studentInfo?._id;

      const groupId = selectedAssignment.submissionType === 'group'
        ? selectedAssignment.groupId?._id
        : null;

      const response = await api.put('/student-evaluations/external/score', {
        studentId,
        groupId,
        conductScore: grade,
        comments: gradeData.comments
      }) as ApiResponse;

      if (response.success) {
        toast.success('External evaluation submitted successfully');
        setGradeData({ grade: '', comments: '' });
        setSelectedAssignment(null);
      } else {
        toast.error(response.message || 'Failed to submit evaluation');
      }
    } catch (error: any) {
      console.error('Error submitting evaluation:', error);
      toast.error(error.response?.data?.message || 'Failed to submit evaluation');
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <FacultyAssessmentSkeleton />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="py-12">
        <AssessmentEmptyState
          title="No External Assignments"
          description="You have not been assigned as an external evaluator for any projects yet."
          icon="shield"
          theme="amber"
          subtitle="EXTERNAL"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-500">
          External Evaluator Assignments
        </h2>
        <p className="text-slate-500 font-medium">
          Projects assigned to you for external evaluation ({assignments.length} assignments)
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Assignments List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Assignments</h3>
          {assignments.map((assignment) => (
            <GlassCard
              key={assignment._id}
              className={cn(
                "p-4 cursor-pointer transition-all relative overflow-hidden group",
                selectedAssignment?._id === assignment._id
                  ? 'ring-2 ring-amber-500 bg-amber-50/50 dark:bg-amber-500/5'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
              )}
              onClick={() => handleAssignmentSelect(assignment)}
            >
              {/* Selection Indicator */}
              {selectedAssignment?._id === assignment._id && (
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
              )}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-2xl transition-colors",
                    assignment.submissionType === 'group'
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  )}>
                    {assignment.submissionType === 'group' ? (
                      <Users className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">
                      {assignment.submissionType === 'group'
                        ? assignment.groupId?.groupCode
                        : assignment.studentInfo?.name}
                    </h4>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {assignment.submissionType === 'group' ? 'Group Project' : 'Solo Project'}
                    </p>
                  </div>
                </div>
                <Badge variant="warning" className="uppercase tracking-widest text-[10px] font-black">
                  External
                </Badge>
              </div>

              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500">Project:</span>
                  <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{assignment.projectInfo.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500">Faculty:</span>
                  <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{assignment.internalFaculty.name}</span>
                </div>
                {assignment.submissionType === 'group' && assignment.groupId?.members && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Members</span>
                    <div className="flex flex-wrap gap-1">
                      {assignment.groupId.members.map(member => (
                        <span key={member._id} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-md">
                          {member.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Assignment Details */}
        <div className="space-y-4">
          {selectedAssignment ? (
            <>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Assignment Details</h3>

              {/* Project Information */}
              <GlassCard className="p-6">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  Project Information
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Title</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{selectedAssignment.projectInfo.title}</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Project ID</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{selectedAssignment.projectInfo.projectId}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Type</span>
                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50/50">
                      {selectedAssignment.projectInfo.type}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Description</span>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{selectedAssignment.projectInfo.brief}</p>
                  </div>
                </div>
              </GlassCard>

              {/* Meeting Logs */}
              <GlassCard className="p-6">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-500" />
                  Meeting Logs
                </h4>
                {meetingLogs[selectedAssignment.projectInfo._id]?.length > 0 ? (
                  <div className="space-y-3">
                    {meetingLogs[selectedAssignment.projectInfo._id].map((log) => (
                      <div key={log._id} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-500">
                              {new Date(log.date).toLocaleDateString()}
                            </span>
                          </div>
                          {log.grade !== undefined && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {log.grade}/5
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 italic">"{log.summary}"</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Duration: {log.duration} minutes
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No meeting logs available for this project.</p>
                )}
              </GlassCard>

              {/* External Evaluation Form */}
              <GlassCard className="p-6 border-2 border-amber-500/20 bg-amber-500/5">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  External Evaluation
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Grade (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={gradeData.grade}
                      onChange={(e) => setGradeData(prev => ({ ...prev, grade: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-slate-100 font-bold"
                      placeholder="Enter grade (0-100)"
                    />
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-2">
                      Converts to score out of 50
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Comments (Optional)
                    </label>
                    <textarea
                      value={gradeData.comments}
                      onChange={(e) => setGradeData(prev => ({ ...prev, comments: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-slate-100"
                      placeholder="Enter evaluation comments..."
                    />
                  </div>

                  <button
                    onClick={handleSubmitEvaluation}
                    disabled={!gradeData.grade}
                    className="w-full px-4 py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit External Evaluation
                  </button>
                </div>
              </GlassCard>
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Assignment</h3>
              <p className="text-gray-500">
                Choose an assignment from the list to view details and submit evaluation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}