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
  meetingId: Meeting;
  groupId?: {
    _id: string;
    groupCode: string;
  };
  studentId?: {
    _id: string;
    name: string;
  };
  attendees: string[];
  minutesOfMeeting: string;
  facultyApproved: boolean;
  facultyNotes?: string;
  createdAt: string;
}

export function FacultyMeetingsPage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingLogs, setMeetingLogs] = useState<MeetingLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MeetingLog | null>(null);
  const [activeTab, setActiveTab] = useState<'meetings' | 'logs'>('meetings');

  const [scheduleData, setScheduleData] = useState({
    groupId: '',
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
  }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const userId = (user as any)?._id;
      const response = await fetch(`http://localhost:3001/api/v1/meetings/faculty/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('srm_portal_token')}`
        }
      });
      const data = await response.json();
      setMeetings(data);
    } catch (error) {
      toast.error('Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetingLogs = async () => {
    try {
      const userId = (user as any)?._id;
      const response = await fetch(`http://localhost:3001/api/v1/meetings/logs/faculty/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('srm_portal_token')}`
        }
      });
      const data = await response.json();
      setMeetingLogs(data);
    } catch (error) {
      toast.error('Failed to fetch meeting logs');
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scheduleData.groupId || !scheduleData.meetingDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/v1/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('srm_portal_token')}`
        },
        body: JSON.stringify({
          ...scheduleData,
          facultyId: (user as any)?._id
        })
      });

      if (response.ok) {
        toast.success('Meeting scheduled successfully');
        setShowScheduleModal(false);
        setScheduleData({
          groupId: '',
          meetingDate: '',
          meetUrl: '',
          mode: 'online'
        });
        fetchMeetings();
      } else {
        const error = await response.json();
        toast.error(error.error?.message || 'Failed to schedule meeting');
      }
    } catch (error) {
      toast.error('Failed to schedule meeting');
    }
  };

  const handleApproveLog = async (logId: string, approved: boolean) => {
    try {
      const response = await fetch(`http://localhost:3001/api/v1/meetings/logs/${logId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('srm_portal_token')}`
        },
        body: JSON.stringify({
          facultyApproved: approved,
          facultyNotes: approvalData.facultyNotes
        })
      });

      if (response.ok) {
        toast.success(`Meeting log ${approved ? 'approved' : 'rejected'}`);
        setSelectedLog(null);
        setApprovalData({ facultyNotes: '' });
        fetchMeetingLogs();
      } else {
        toast.error('Failed to update meeting log');
      }
    } catch (error) {
      toast.error('Failed to update meeting log');
    }
  };

  const getStatusBadge = (approved: boolean | undefined) => {
    if (approved === undefined) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }
    return approved ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border bg-green-500/20 text-green-300 border-green-500/30">
        <CheckCircle className="w-3 h-3" />
        Approved
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border bg-red-500/20 text-red-300 border-red-500/30">
        <XCircle className="w-3 h-3" />
        Rejected
      </span>
    );
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
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'meetings'
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-textSecondary hover:bg-white/5'
              }`}
            >
              Scheduled Meetings ({meetings.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'logs'
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-textSecondary hover:bg-white/5'
              }`}
            >
              Meeting Logs ({meetingLogs.filter(log => !log.facultyApproved).length} pending)
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
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                            meeting.mode === 'online'
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
                          {getStatusBadge(log.facultyApproved)}
                        </div>

                        <div className="space-y-2 mb-4">
                          <div>
                            <span className="text-sm font-medium text-text">Meeting Date: </span>
                            <span className="text-sm text-textSecondary">
                              {new Date(log.meetingId.meetingDate).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-text">Attendees: </span>
                            <span className="text-sm text-textSecondary">
                              {log.attendees.length} present
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-text">Minutes: </span>
                            <p className="text-sm text-textSecondary mt-1 line-clamp-2">
                              {log.minutesOfMeeting}
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
              <GlassCard className="p-6">
                <h2 className="text-2xl font-bold text-text mb-6">Schedule Meeting</h2>

                <form onSubmit={handleScheduleMeeting} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Group ID *
                    </label>
                    <input
                      type="text"
                      value={scheduleData.groupId}
                      onChange={(e) => setScheduleData({ ...scheduleData, groupId: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter group ID"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Meeting Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleData.meetingDate}
                      onChange={(e) => setScheduleData({ ...scheduleData, meetingDate: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Meeting Mode
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setScheduleData({ ...scheduleData, mode: 'online' })}
                        className={`px-4 py-2 rounded-lg transition-all border-2 ${
                          scheduleData.mode === 'online'
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-white/5 border-white/10 text-textSecondary hover:bg-white/10'
                        }`}
                      >
                        Online
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleData({ ...scheduleData, mode: 'in-person' })}
                        className={`px-4 py-2 rounded-lg transition-all border-2 ${
                          scheduleData.mode === 'in-person'
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-white/5 border-white/10 text-textSecondary hover:bg-white/10'
                        }`}
                      >
                        In-Person
                      </button>
                    </div>
                  </div>

                  {scheduleData.mode === 'online' && (
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Google Meet Link
                      </label>
                      <input
                        type="url"
                        value={scheduleData.meetUrl}
                        onChange={(e) => setScheduleData({ ...scheduleData, meetUrl: e.target.value })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="https://meet.google.com/..."
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(false)}
                      className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-text transition-all"
                    >
                      Cancel
                    </button>
                    <GlowButton
                      type="submit"
                      variant="primary"
                      glow
                      className="flex-1"
                    >
                      Schedule
                    </GlowButton>
                  </div>
                </form>
              </GlassCard>
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
              <GlassCard className="p-6">
                <h2 className="text-2xl font-bold text-text mb-6">Meeting Log Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-textSecondary">Group/Student</label>
                    <p className="text-text">
                      {selectedLog.groupId 
                        ? `Group ${selectedLog.groupId.groupCode}` 
                        : selectedLog.studentId?.name}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary">Meeting Date</label>
                    <p className="text-text">{new Date(selectedLog.meetingId.meetingDate).toLocaleString()}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary">Attendees</label>
                    <p className="text-text">{selectedLog.attendees.length} members present</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary">Minutes of Meeting</label>
                    <p className="text-text whitespace-pre-wrap mt-2 p-3 bg-white/5 rounded-lg">
                      {selectedLog.minutesOfMeeting}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedLog.facultyApproved)}</div>
                  </div>

                  {!selectedLog.facultyApproved && (
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Faculty Notes (Optional)
                      </label>
                      <textarea
                        value={approvalData.facultyNotes}
                        onChange={(e) => setApprovalData({ facultyNotes: e.target.value })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={3}
                        placeholder="Add notes or feedback..."
                      />
                    </div>
                  )}

                  {selectedLog.facultyNotes && (
                    <div>
                      <label className="text-sm font-medium text-textSecondary">Faculty Notes</label>
                      <p className="text-text mt-2 p-3 bg-white/5 rounded-lg">
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
                    className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-text transition-all"
                  >
                    Close
                  </button>
                  {!selectedLog.facultyApproved && (
                    <>
                      <GlowButton
                        onClick={() => handleApproveLog(selectedLog._id, false)}
                        variant="secondary"
                        className="flex-1"
                      >
                        Reject
                      </GlowButton>
                      <GlowButton
                        onClick={() => handleApproveLog(selectedLog._id, true)}
                        variant="primary"
                        glow
                        className="flex-1"
                      >
                        Approve
                      </GlowButton>
                    </>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
