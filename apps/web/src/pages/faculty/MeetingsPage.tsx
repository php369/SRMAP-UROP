import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Video, CheckCircle, XCircle, Clock, Plus, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard, GlowButton } from '../../components/ui';
import toast from 'react-hot-toast';

interface Meeting {
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
  facultyId: {
    _id: string;
    name: string;
  };
  meetingDate: string;
  meetUrl?: string;
  mode: 'online' | 'in-person';
  createdAt: string;
}

interface MeetingLog {
  _id: string;
  meetingDate: string;
  groupId?: {
    _id: string;
    groupCode: string;
  };
  studentId?: {
    _id: string;
    name: string;
  };
  attendees?: any[];
  minutesOfMeeting?: string;
  mom?: string;
  status: 'submitted' | 'completed' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

interface Project {
  _id: string;
  projectId: string;
  title: string;
  type: string;
  assignedTo?: {
    _id: string;
    groupCode?: string;
    groupNumber?: number;
  };
}

export function FacultyMeetingsPage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingLogs, setMeetingLogs] = useState<MeetingLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MeetingLog | null>(null);
  const [activeTab, setActiveTab] = useState<'meetings' | 'logs'>('meetings');

  const [scheduleData, setScheduleData] = useState({
    projectId: '',
    meetingDate: '',
    meetUrl: '',
    mode: 'online' as 'online' | 'in-person'
  });

  const [approvalData, setApprovalData] = useState({
    facultyNotes: ''
  });

  useEffect(() => {
    fetchMeetings();
    fetchMeetingLogs();
    fetchProjects();
  }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/meetings/faculty`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('srm_portal_token')}`
        }
      });
      const result = await response.json();
      // Filter out meetings that have passed by more than 1 hour
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const activeMeetings = Array.isArray(result.data)
        ? result.data.filter((meeting: Meeting) => new Date(meeting.meetingDate) > oneHourAgo)
        : [];
      setMeetings(activeMeetings);
    } catch (error) {
      toast.error('Failed to fetch meetings');
      setMeetings([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetingLogs = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/meetings/logs/faculty`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('srm_portal_token')}`
        }
      });
      const result = await response.json();
      // Ensure data is always an array
      setMeetingLogs(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      toast.error('Failed to fetch meeting logs');
      setMeetingLogs([]); // Set empty array on error
    }
  };

  const fetchProjects = async () => {
    try {
      // Fetch faculty's assigned projects
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/projects/faculty?status=assigned`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('srm_portal_token')}`
        }
      });
      const result = await response.json();
      setProjects(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setProjects([]);
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scheduleData.projectId || !scheduleData.meetingDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('srm_portal_token')}`
        },
        body: JSON.stringify({
          projectId: scheduleData.projectId,
          meetingDate: scheduleData.meetingDate,
          meetingLink: scheduleData.meetUrl,
          mode: scheduleData.mode
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Meeting scheduled successfully');
        setShowScheduleModal(false);
        setScheduleData({
          projectId: '',
          meetingDate: '',
          meetUrl: '',
          mode: 'online'
        });
        fetchMeetings();
      } else {
        toast.error(result.error?.message || 'Failed to schedule meeting');
      }
    } catch (error) {
      toast.error('Failed to schedule meeting');
    }
  };

  const handleApproveLog = async (logId: string, approved: boolean) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/meetings/logs/${logId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('srm_portal_token')}`
        },
        body: JSON.stringify({
          approved,
          facultyNotes: approvalData.facultyNotes
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Meeting log ${approved ? 'approved' : 'rejected'}`);
        setSelectedLog(null);
        setApprovalData({ facultyNotes: '' });
        fetchMeetingLogs();
      } else {
        toast.error(result.error?.message || 'Failed to update meeting log');
      }
    } catch (error) {
      toast.error('Failed to update meeting log');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'completed' || status === 'submitted') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border bg-green-500/20 text-green-300 border-green-500/30">
          <CheckCircle className="w-3 h-3" />
          Approved
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border bg-red-500/20 text-red-300 border-red-500/30">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Meetings</h1>
            <p className="text-textSecondary mt-1">
              Schedule meetings and review meeting logs
            </p>
          </div>
          <GlowButton
            onClick={() => setShowScheduleModal(true)}
            variant="primary"
            glow
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Meeting
          </GlowButton>
        </div>

        {/* Tabs */}
        <GlassCard className="p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('meetings')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'meetings'
                ? 'bg-primary text-white'
                : 'bg-transparent text-textSecondary hover:bg-white/5'
                }`}
            >
              Scheduled Meetings ({meetings.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'logs'
                ? 'bg-primary text-white'
                : 'bg-transparent text-textSecondary hover:bg-white/5'
                }`}
            >
              Meeting Logs ({Array.isArray(meetingLogs) ? meetingLogs.filter(log => log.status === 'completed' || log.status === 'submitted').length : 0} pending)
            </button>
          </div>
        </GlassCard>

        {/* Content */}
        {activeTab === 'meetings' ? (
          loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : meetings.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-text mb-2">No Meetings Scheduled</h3>
                <p className="text-textSecondary mb-6">
                  Schedule a meeting with your project groups
                </p>
                <GlowButton
                  onClick={() => setShowScheduleModal(true)}
                  variant="primary"
                  glow
                >
                  Schedule Meeting
                </GlowButton>
              </div>
            </GlassCard>
          ) : (
            <div className="grid gap-4">
              {meetings.map((meeting) => (
                <motion.div
                  key={meeting._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <GlassCard className="p-6 hover:bg-white/10 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Calendar className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold text-text">
                            {meeting.groupId
                              ? `Group ${meeting.groupId.groupCode}`
                              : meeting.studentId?.name}
                          </h3>
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${meeting.mode === 'online'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            }`}>
                            {meeting.mode === 'online' ? 'Online' : 'In-Person'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-textSecondary">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(meeting.meetingDate).toLocaleString()}</span>
                          </div>
                          {meeting.meetUrl && (
                            <a
                              href={meeting.meetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <Video className="w-4 h-4" />
                              Join Meeting
                            </a>
                          )}
                          {meeting.groupId && (
                            <div className="text-sm text-textSecondary">
                              Members: {meeting.groupId.members.length} students
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          meetingLogs.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-text mb-2">No Meeting Logs</h3>
                <p className="text-textSecondary">
                  Meeting logs will appear here after students submit them
                </p>
              </div>
            </GlassCard>
          ) : (
            <div className="grid gap-4">
              {meetingLogs.map((log) => (
                <motion.div
                  key={log._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <GlassCard className="p-6 hover:bg-white/10 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-text">
                            {log.groupId
                              ? `Group ${log.groupId.groupCode}`
                              : log.studentId?.name}
                          </h3>
                          {getStatusBadge(log.status)}
                        </div>

                        <div className="space-y-2 mb-4">
                          {log.meetingDate && (
                            <div>
                              <span className="text-sm font-medium text-text">Meeting Date: </span>
                              <span className="text-sm text-textSecondary">
                                {new Date(log.meetingDate).toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium text-text">Attendees: </span>
                            <span className="text-sm text-textSecondary">
                              {log.attendees?.length || log.participants?.length || 0} present
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-text">Minutes: </span>
                            <p className="text-sm text-textSecondary mt-1 line-clamp-2">
                              {log.minutesOfMeeting || log.mom || 'No minutes recorded'}
                            </p>
                          </div>
                        </div>

                        <div className="text-xs text-textSecondary">
                          Submitted: {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setApprovalData({ facultyNotes: log.facultyNotes || '' });
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg transition-all"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-text" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )
        )}
      </motion.div>

      {/* Schedule Meeting Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowScheduleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <div className="bg-white rounded-xl shadow-2xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule Meeting</h2>

                <form onSubmit={handleScheduleMeeting} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Project *
                    </label>
                    <select
                      value={scheduleData.projectId}
                      onChange={(e) => setScheduleData({ ...scheduleData, projectId: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">-- Select a project --</option>
                      {projects.map((project) => (
                        <option key={project._id} value={project._id}>
                          {project.projectId} - {project.title}
                        </option>
                      ))}
                    </select>
                    {projects.length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        No assigned projects found. Projects will appear here once you accept student applications.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleData.meetingDate}
                      onChange={(e) => setScheduleData({ ...scheduleData, meetingDate: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Mode
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setScheduleData({ ...scheduleData, mode: 'online' })}
                        className={`px-4 py-2 rounded-lg transition-all border-2 ${scheduleData.mode === 'online'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        Online
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleData({ ...scheduleData, mode: 'in-person' })}
                        className={`px-4 py-2 rounded-lg transition-all border-2 ${scheduleData.mode === 'in-person'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        In-Person
                      </button>
                    </div>
                  </div>

                  {scheduleData.mode === 'online' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Google Meet Link
                      </label>
                      <input
                        type="url"
                        value={scheduleData.meetUrl}
                        onChange={(e) => setScheduleData({ ...scheduleData, meetUrl: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://meet.google.com/..."
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-700 font-medium transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all"
                    >
                      Schedule
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log Details Modal */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setSelectedLog(null);
              setApprovalData({ facultyNotes: '' });
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="bg-white rounded-xl shadow-2xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Meeting Log Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Group/Student</label>
                    <p className="text-gray-900">
                      {selectedLog.groupId
                        ? `Group ${selectedLog.groupId.groupCode}`
                        : selectedLog.studentId?.name}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Meeting Date</label>
                    <p className="text-gray-900">{selectedLog.meetingDate ? new Date(selectedLog.meetingDate).toLocaleString() : 'N/A'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Attendees</label>
                    <p className="text-gray-900">{selectedLog.attendees?.length || 0} members present</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Minutes of Meeting</label>
                    <p className="text-gray-900 whitespace-pre-wrap mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {selectedLog.minutesOfMeeting || selectedLog.mom || 'No minutes recorded'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedLog.facultyApproved)}</div>
                  </div>

                  {!selectedLog.facultyApproved && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Faculty Notes (Optional)
                      </label>
                      <textarea
                        value={approvalData.facultyNotes}
                        onChange={(e) => setApprovalData({ facultyNotes: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Add notes or feedback..."
                      />
                    </div>
                  )}

                  {selectedLog.facultyNotes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Faculty Notes</label>
                      <p className="text-gray-900 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {selectedLog.facultyNotes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setSelectedLog(null);
                      setApprovalData({ facultyNotes: '' });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-700 font-medium transition-all"
                  >
                    Close
                  </button>
                  {!selectedLog.facultyApproved && (
                    <>
                      <button
                        onClick={() => handleApproveLog(selectedLog._id, false)}
                        className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 border border-red-300 rounded-lg text-red-700 font-medium transition-all"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveLog(selectedLog._id, true)}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all"
                      >
                        Approve
                      </button>
                    </>
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
