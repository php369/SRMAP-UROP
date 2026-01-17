import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Video, CheckCircle, XCircle, Clock, Plus, Eye, AlertCircle, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard, Button, Input, Label, Modal, Textarea } from '../../components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';
import { NoAssignmentMessage } from '../../components/common/NoAssignmentMessage';
import { CompactDatePicker } from '../../components/ui/CompactDatePicker';
import { api } from '../../utils/api';

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
  location?: string;
  status: 'scheduled' | 'completed' | 'pending' | 'approved' | 'rejected';
  attendees?: Array<{
    studentId: {
      _id: string;
      name: string;
      email: string;
    };
    present: boolean;
  }>;
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
  participants?: any[];
  minutesOfMeeting?: string;
  mom?: string;
  status: 'scheduled' | 'completed' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  facultyNotes?: string;
  facultyApproved?: boolean;
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
  useAuth(); // Keep for authentication check
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingLogs, setMeetingLogs] = useState<MeetingLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MeetingLog | null>(null);
  const [activeTab, setActiveTab] = useState<'meetings' | 'logs'>('meetings');
  const [meetingsSubTab, setMeetingsSubTab] = useState<'upcoming' | 'past'>('upcoming');
  const [logsSubTab, setLogsSubTab] = useState<'pending' | 'approved'>('pending');
  const [hasAssignments, setHasAssignments] = useState<boolean | null>(null);

  const [scheduleData, setScheduleData] = useState({
    projectId: '',
    meetingDate: '',
    meetUrl: '',
    mode: 'online' as 'online' | 'in-person',
    location: ''
  });

  const [approvalData, setApprovalData] = useState({
    facultyNotes: ''
  });
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    checkAssignments();
    fetchMeetings();
    fetchMeetingLogs();
    fetchProjects();
  }, []);

  const checkAssignments = async () => {
    try {
      const response = await api.get('/projects/faculty');
      // Check if any project has been assigned to students
      const assignedProjects = (response.data && Array.isArray(response.data))
        ? response.data.filter((p: any) => p.status === 'assigned')
        : [];
      setHasAssignments(assignedProjects.length > 0);
    } catch (error) {
      console.error('Error checking assignments:', error);
      setHasAssignments(false);
    }
  };

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/meetings/faculty');
      // Don't filter by time - let the UI handle upcoming vs past
      const allMeetings = Array.isArray(response.data) ? response.data : [];
      setMeetings(allMeetings);
    } catch (error) {
      toast.error('Failed to fetch meetings');
      setMeetings([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetingLogs = async () => {
    try {
      const response = await api.get('/meetings/logs/faculty');
      // Ensure data is always an array
      setMeetingLogs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Failed to fetch meeting logs');
      setMeetingLogs([]); // Set empty array on error
    }
  };

  const fetchProjects = async () => {
    try {
      // Fetch faculty's assigned projects
      const response = await api.get('/projects/faculty', { status: 'assigned' });
      setProjects(Array.isArray(response.data) ? response.data : []);
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

    if (scheduleData.mode === 'in-person' && !scheduleData.location.trim()) {
      toast.error('Please provide a location for in-person meetings');
      return;
    }

    try {
      // Convert datetime-local to proper UTC timestamp
      // datetime-local format: "2025-12-08T13:00" (no timezone info)
      // JavaScript interprets this as LOCAL time, then toISOString converts to UTC
      const meetingDateObj = new Date(scheduleData.meetingDate);
      const meetingDateUTC = meetingDateObj.toISOString();

      console.log('Faculty meeting scheduling - Local time:', scheduleData.meetingDate);
      console.log('Faculty meeting scheduling - Parsed as Date:', meetingDateObj.toString());
      console.log('Faculty meeting scheduling - Converted to UTC:', meetingDateUTC);

      const response = await api.post('/meetings', {
        projectId: scheduleData.projectId,
        meetingDate: meetingDateUTC,
        meetingLink: scheduleData.meetUrl,
        mode: scheduleData.mode,
        location: scheduleData.location
      });

      if (response.success) {
        toast.success('Meeting scheduled successfully');
        setShowScheduleModal(false);
        setScheduleData({
          projectId: '',
          meetingDate: '',
          meetUrl: '',
          mode: 'online',
          location: ''
        });
        fetchMeetings();
      } else {
        toast.error((response as any).error?.message || 'Failed to schedule meeting');
      }
    } catch (error) {
      toast.error('Failed to schedule meeting');
    }
  };

  // Helper functions to filter meetings and logs
  const getUpcomingMeetings = () => {
    return meetings.filter(meeting =>
      meeting.status === 'scheduled' ||
      (meeting.status === 'completed' && !meeting.attendees?.some(a => a.present))
    );
  };

  const getPastMeetings = () => {
    return meetings.filter(meeting => meeting.status === 'approved');
  };

  const getPendingLogs = () => {
    return meetingLogs.filter(log =>
      log.status === 'completed' || log.status === 'pending'
    );
  };

  const getApprovedLogs = () => {
    return meetingLogs.filter(log => log.status === 'approved');
  };

  const handleApproveLog = async (logId: string, approved: boolean) => {
    // If rejecting, show feedback modal
    if (!approved) {
      setShowRejectModal(true);
      return;
    }

    // Direct approval without feedback
    try {
      const response = await api.put(`/meetings/logs/${logId}/approve`, {
        approved: true,
        facultyNotes: '' // No feedback required for approval
      });

      if (response.success) {
        toast.success('Meeting log approved');
        setSelectedLog(null);
        setApprovalData({ facultyNotes: '' });
        fetchMeetingLogs();
      } else {
        toast.error((response as any).error?.message || 'Failed to approve meeting log');
      }
    } catch (error) {
      toast.error('Failed to approve meeting log');
    }
  };

  const handleRejectWithFeedback = async () => {
    if (!approvalData.facultyNotes.trim()) {
      toast.error('Feedback is required when rejecting a meeting log');
      return;
    }

    if (!selectedLog) return;

    try {
      const response = await api.put(`/meetings/logs/${selectedLog._id}/approve`, {
        approved: false,
        facultyNotes: approvalData.facultyNotes.trim()
      });

      if (response.success) {
        toast.success('Meeting log rejected');
        setSelectedLog(null);
        setShowRejectModal(false);
        setApprovalData({ facultyNotes: '' });
        fetchMeetingLogs();
      } else {
        toast.error((response as any).error?.message || 'Failed to reject meeting log');
      }
    } catch (error) {
      toast.error('Failed to reject meeting log');
    }
  };

  const handleCompleteMeeting = async (meetingId: string) => {
    try {
      const response = await api.put(`/meetings/${meetingId}/complete`);

      if (response.success) {
        toast.success('Meeting marked as completed');
        // Refresh both meetings and logs to show updated status
        await Promise.all([
          fetchMeetings(),
          fetchMeetingLogs()
        ]);
      } else {
        const errorMessage = response.error?.message || 'Failed to complete meeting';
        console.error('Complete meeting error:', response.error);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Complete meeting exception:', error);
      toast.error(error.message || 'Failed to complete meeting');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'completed' || status === 'scheduled') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-500/30">
          <Clock className="w-3 h-3" />
          {status === 'scheduled' ? 'Scheduled' : 'Awaiting Log Submission'}
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-500/30">
          <AlertCircle className="w-3 h-3" />
          Needs Resubmission
        </span>
      );
    }
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 border-green-300 dark:border-green-500/30">
          <CheckCircle className="w-3 h-3" />
          Approved
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border-red-300 dark:border-red-500/30">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    }
    return null;
  };

  // Show loading while checking assignments
  if (hasAssignments === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show message if no assignments
  if (hasAssignments === false) {
    return <NoAssignmentMessage userType="faculty" />;
  }

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
          <Button
            onClick={() => setShowScheduleModal(true)}
            variant="default"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'meetings' | 'logs')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meetings">Schedule Meetings ({meetings.length})</TabsTrigger>
            <TabsTrigger value="logs">Meeting Logs ({Array.isArray(meetingLogs) ? meetingLogs.filter(log => log.status === 'completed' || log.status === 'pending').length : 0} pending)</TabsTrigger>
          </TabsList>

          <TabsContent value="meetings" className="space-y-4">
            <Tabs value={meetingsSubTab} onValueChange={(v) => setMeetingsSubTab(v as 'upcoming' | 'past')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upcoming">Upcoming Meetings ({getUpcomingMeetings().length})</TabsTrigger>
                <TabsTrigger value="past">Past Meetings ({getPastMeetings().length})</TabsTrigger>
              </TabsList>
            </Tabs>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Tabs value={logsSubTab} onValueChange={(v) => setLogsSubTab(v as 'pending' | 'approved')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">Pending Logs ({getPendingLogs().length})</TabsTrigger>
                <TabsTrigger value="approved">Approved Logs ({getApprovedLogs().length})</TabsTrigger>
              </TabsList>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* Content */}
        {activeTab === 'meetings' ? (
          loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (() => {
            const displayMeetings = meetingsSubTab === 'upcoming' ? getUpcomingMeetings() : getPastMeetings();
            return displayMeetings.length === 0 ? (
              <GlassCard className="p-12 text-center bg-white shadow-xl border border-slate-200">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    No {meetingsSubTab === 'upcoming' ? 'Upcoming' : 'Past'} Meetings
                  </h3>
                  <p className="text-slate-500 mb-6">
                    {meetingsSubTab === 'upcoming'
                      ? "Schedule a meeting with your project groups"
                      : "Past meetings will appear here after logs are approved"
                    }
                  </p>
                  {meetingsSubTab === 'upcoming' && (
                    <Button
                      onClick={() => setShowScheduleModal(true)}
                      variant="default"
                    >
                      Schedule Meeting
                    </Button>
                  )}
                </div>
              </GlassCard>
            ) : (
              <div className="grid gap-4">
                {displayMeetings.map((meeting) => (
                  <motion.div
                    key={meeting._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <GlassCard className="p-6 hover:bg-slate-50 transition-all bg-white shadow-xl border border-slate-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Calendar className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold text-slate-900">
                              {meeting.groupId
                                ? `Group ${meeting.groupId.groupCode}`
                                : meeting.studentId?.name}
                            </h3>
                            <Badge variant={meeting.mode === 'online' ? 'info' : 'secondary'}>
                              {meeting.mode === 'online' ? 'Online' : 'In-Person'}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(meeting.meetingDate).toLocaleString()}</span>
                            </div>
                            {meeting.location && meeting.mode === 'in-person' && (
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <MapPin className="w-4 h-4" />
                                <span>{meeting.location}</span>
                              </div>
                            )}
                            {meeting.meetUrl && meeting.status !== 'completed' && meeting.status !== 'approved' && (
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
                            {meeting.status === 'completed' && (
                              <div className="flex items-center gap-2 text-sm text-amber-600">
                                <Clock className="w-4 h-4" />
                                Awaiting meeting's log for review
                              </div>
                            )}
                            {meeting.status === 'approved' && (
                              <div className="flex items-center gap-2 text-sm text-emerald-600">
                                <CheckCircle className="w-4 h-4" />
                                Meeting Approved
                              </div>
                            )}
                            {meeting.groupId && (
                              <div className="text-sm text-slate-500">
                                Members: {meeting.attendees ? meeting.attendees.length : meeting.groupId.members.length} students
                              </div>
                            )}
                            {meeting.attendees && meeting.attendees.length > 0 && (
                              <div className="text-sm text-slate-500">
                                Participants: {meeting.attendees.map(a => a.studentId.name).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Meeting Actions */}
                        <div className="flex flex-col gap-2">
                          {meeting.status === 'scheduled' && (
                            <button
                              onClick={() => handleCompleteMeeting(meeting._id)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              End Meeting
                            </button>
                          )}
                          {meeting.status === 'completed' && (
                            <span className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Meeting Ended
                            </span>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            );
          })()
        ) : (
          (() => {
            const displayLogs = logsSubTab === 'pending' ? getPendingLogs() : getApprovedLogs();
            return displayLogs.length === 0 ? (
              <GlassCard className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-text mb-2">
                    No {logsSubTab === 'pending' ? 'Pending' : 'Approved'} Meeting Logs
                  </h3>
                  <p className="text-textSecondary">
                    {logsSubTab === 'pending'
                      ? "Meeting logs will appear here after students submit them"
                      : "Approved meeting logs will appear here"
                    }
                  </p>
                </div>
              </GlassCard>
            ) : (
              <div className="grid gap-4">
                {displayLogs.map((log) => (
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
                                {log.attendees && log.attendees.length > 0
                                  ? log.attendees
                                    .filter((attendee: any) => attendee.present)
                                    .map((attendee: any) => attendee.studentId?.name || 'Unknown')
                                    .join(', ') || 'No attendees marked present'
                                  : 'No attendees recorded'
                                }
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
            );
          })()
        )}
      </motion.div>

      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Meeting"
      >
        <form onSubmit={handleScheduleMeeting} className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Select Project *
            </Label>
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

          <CompactDatePicker
            label="Meeting Date & Time"
            value={scheduleData.meetingDate}
            onChange={(value) => setScheduleData({ ...scheduleData, meetingDate: value })}
            isRequired
            color="#2563EB"
          />

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Mode
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={scheduleData.mode === 'online' ? 'default' : 'outline'}
                onClick={() => setScheduleData({ ...scheduleData, mode: 'online' })}
              >
                Online
              </Button>
              <Button
                type="button"
                variant={scheduleData.mode === 'in-person' ? 'default' : 'outline'}
                onClick={() => setScheduleData({ ...scheduleData, mode: 'in-person' })}
              >
                In-Person
              </Button>
            </div>
          </div>

          {scheduleData.mode === 'online' && (
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Google Meet Link
              </Label>
              <Input
                type="url"
                value={scheduleData.meetUrl}
                onChange={(e) => setScheduleData({ ...scheduleData, meetUrl: e.target.value })}
                placeholder="https://meet.google.com/..."
              />
            </div>
          )}

          {scheduleData.mode === 'in-person' && (
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </Label>
              <Input
                type="text"
                value={scheduleData.location}
                onChange={(e) => setScheduleData({ ...scheduleData, location: e.target.value })}
                placeholder="Room number, building, etc."
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowScheduleModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              className="flex-1"
            >
              Schedule Meeting
            </Button>
          </div>
        </form>
      </Modal>


      {/* Log Details Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => {
          setSelectedLog(null);
          setApprovalData({ facultyNotes: '' });
        }}
        title="Meeting Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Group/Student</Label>
              <p className="text-gray-900">
                {selectedLog.groupId
                  ? `Group ${selectedLog.groupId.groupCode}`
                  : selectedLog.studentId?.name}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Meeting Date</Label>
              <p className="text-gray-900">{selectedLog.meetingDate ? new Date(selectedLog.meetingDate).toLocaleString() : 'N/A'}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Attendees</Label>
              <div className="text-gray-900 mt-1">
                {selectedLog.attendees && selectedLog.attendees.length > 0 ? (
                  <div className="space-y-1">
                    {selectedLog.attendees.map((attendee: any, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${attendee.present ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={attendee.present ? 'text-gray-900' : 'text-gray-500 line-through'}>
                          {attendee.studentId?.name || 'Unknown Student'}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({attendee.present ? 'Present' : 'Absent'})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No attendees recorded</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Minutes of Meeting</Label>
              <p className="text-gray-900 whitespace-pre-wrap mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                {selectedLog.minutesOfMeeting || selectedLog.mom || 'No minutes recorded'}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Status</Label>
              <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
            </div>

            {selectedLog.facultyNotes && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Faculty Notes</Label>
                <p className="text-gray-900 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {selectedLog.facultyNotes}
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedLog(null);
                  setApprovalData({ facultyNotes: '' });
                }}
                className="flex-1"
              >
                Close
              </Button>
              {(selectedLog.status === 'completed' || selectedLog.status === 'pending') &&
                (selectedLog.minutesOfMeeting || selectedLog.mom) && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleApproveLog(selectedLog._id, false)}
                      className="flex-1"
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApproveLog(selectedLog._id, true)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Approve
                    </Button>
                  </>
                )}
            </div>
          </div>
        )}
      </Modal>

      {/* Rejection Feedback Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setApprovalData({ facultyNotes: '' });
        }}
        title="Reject Meeting Log"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Please provide feedback explaining why this meeting log is being rejected:
          </p>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback *
            </Label>
            <Textarea
              value={approvalData.facultyNotes}
              onChange={(e) => setApprovalData({ facultyNotes: e.target.value })}
              rows={4}
              placeholder="Explain what needs to be improved or corrected..."
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setApprovalData({ facultyNotes: '' });
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectWithFeedback}
              className="flex-1"
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div >
  );
}
