import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, User, FileText, Calendar, MessageSquare, Star } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../utils/api';
import { toast } from 'sonner';

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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading external evaluator assignments...</span>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No External Evaluator Assignments</h3>
        <p className="text-gray-500">
          You have not been assigned as an external evaluator for any projects yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">External Evaluator Assignments</h2>
        <p className="text-gray-600">
          Projects assigned to you for external evaluation ({assignments.length} assignments)
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Assignments List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Assignments</h3>
          {assignments.map((assignment) => (
            <motion.div
              key={assignment._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${selectedAssignment?._id === assignment._id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
              onClick={() => handleAssignmentSelect(assignment)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${assignment.submissionType === 'group' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                    {assignment.submissionType === 'group' ? (
                      <Users className="w-5 h-5 text-blue-600" />
                    ) : (
                      <User className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {assignment.submissionType === 'group'
                        ? assignment.groupId?.groupCode
                        : assignment.studentInfo?.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {assignment.submissionType === 'group' ? 'Group Project' : 'Solo Project'}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                  External
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">Project: </span>
                  <span className="text-sm text-gray-900">{assignment.projectInfo.title}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Internal Faculty: </span>
                  <span className="text-sm text-gray-900">{assignment.internalFaculty.name}</span>
                </div>
                {assignment.submissionType === 'group' && assignment.groupId?.members && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Members: </span>
                    <span className="text-sm text-gray-900">
                      {assignment.groupId.members.map(member => member.name).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Assignment Details */}
        <div className="space-y-4">
          {selectedAssignment ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900">Assignment Details</h3>

              {/* Project Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Project Information</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Title: </span>
                    <span className="text-sm text-gray-900">{selectedAssignment.projectInfo.title}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Project ID: </span>
                    <span className="text-sm text-gray-900">{selectedAssignment.projectInfo.projectId}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Type: </span>
                    <span className="text-sm text-gray-900">{selectedAssignment.projectInfo.type}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Description: </span>
                    <p className="text-sm text-gray-900 mt-1">{selectedAssignment.projectInfo.brief}</p>
                  </div>
                </div>
              </div>

              {/* Meeting Logs */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Meeting Logs
                </h4>
                {meetingLogs[selectedAssignment.projectInfo._id]?.length > 0 ? (
                  <div className="space-y-3">
                    {meetingLogs[selectedAssignment.projectInfo._id].map((log) => (
                      <div key={log._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(log.date).toLocaleDateString()}
                            </span>
                          </div>
                          {log.grade !== undefined && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {log.grade}/5
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{log.summary}</p>
                        <p className="text-xs text-gray-500">
                          Duration: {log.duration} minutes
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No meeting logs available for this project.</p>
                )}
              </div>

              {/* External Evaluation Form */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">External Evaluation</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={gradeData.grade}
                      onChange={(e) => setGradeData(prev => ({ ...prev, grade: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter grade (0-100)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be converted to a score out of 50 for final grading
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments (Optional)
                    </label>
                    <textarea
                      value={gradeData.comments}
                      onChange={(e) => setGradeData(prev => ({ ...prev, comments: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter evaluation comments..."
                    />
                  </div>

                  <button
                    onClick={handleSubmitEvaluation}
                    disabled={!gradeData.grade}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit External Evaluation
                  </button>
                </div>
              </div>
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