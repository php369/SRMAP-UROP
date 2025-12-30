import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Calendar, Users, CheckCircle, Clock, XCircle, FileText, MapPin, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { NoAssignmentMessage } from '../../components/common/NoAssignmentMessage';

export function MeetingsPage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLeader, setIsLeader] = useState(false);
  const [canSubmitLogs, setCanSubmitLogs] = useState(false); // New state for log submission permission
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [hasProject, setHasProject] = useState<boolean | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [logForm, setLogForm] = useState({
    minutesOfMeeting: '',
    attendees: [] as string[]
  });

  const [scheduleForm, setScheduleForm] = useState({
    meetingDate: '',
    meetUrl: '',
    mode: 'online' as 'online' | 'in-person',
    location: ''
  });

  useEffect(() => {
    const initializeData = async () => {
      setInitializing(true);
      try {
        await Promise.all([
          checkProjectAssignment(),
          checkUserRole(),
          fetchMeetings()
        ]);
      } catch (error) {
        console.error('Error initializing meetings data:', error);
      } finally {
        setInitializing(false);
      }
    };
    
    initializeData();
  }, []);

  const checkProjectAssignment = async () => {
    try {
      const response = await api.get('/applications/my-application');
      if (response.success && response.data) {
        // response.data is an array of applications
        const applications = response.data as any[];
        // Check if there's at least one approved application
        const hasApprovedApplication = applications.some(app => app.status === 'approved');
        setHasProject(hasApprovedApplication);
        console.log('Project assignment check:', { 
          applicationsCount: applications.length, 
          hasApprovedApplication,
          applicationStatuses: applications.map(app => app.status)
        });
      } else {
        setHasProject(false);
      }
    } catch (error) {
      console.error('Error checking project assignment:', error);
      setHasProject(false);
    }
  };

  const checkUserRole = async () => {
    try {
      const response = await api.get('/groups/my-group');
      if (response.success && response.data) {
        const groupData = response.data as any;
        const userId = (user as any)?._id || (user as any)?.id;
        const userIsLeader = groupData.leaderId === userId || groupData.leaderId?._id === userId;
        
        // All group members can schedule meetings
        setIsLeader(true);
        // Only group leaders can submit meeting logs
        setCanSubmitLogs(userIsLeader);
        setGroupMembers(groupData.members || []);
        
        console.log('Group data:', { 
          groupData, 
          userIsLeader, 
          userId,
          canSchedule: true,
          canSubmitLogs: userIsLeader
        });
      } else {
        // No group found - check if user has approved solo application
        console.log('No group found - checking for solo application');
        try {
          const appResponse = await api.get('/applications/my-application');
          if (appResponse.success && appResponse.data) {
            const applications = appResponse.data as any[];
            const hasApprovedApp = applications.some(app => app.status === 'approved');
            // Solo students with approved applications can both schedule and submit logs
            setIsLeader(hasApprovedApp);
            setCanSubmitLogs(hasApprovedApp);
            console.log('Solo student status:', { hasApprovedApp });
          } else {
            setIsLeader(false);
            setCanSubmitLogs(false);
          }
        } catch (appError) {
          console.error('Error checking applications:', appError);
          setIsLeader(false);
          setCanSubmitLogs(false);
        }
        setGroupMembers([]);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      // Default to not having any permissions (safer default)
      setIsLeader(false);
      setCanSubmitLogs(false);
      setGroupMembers([]);
    }
  };

  const fetchMeetings = async () => {
    try {
      const response = await api.get('/meetings/student');
      if (response.success && response.data) {
        setMeetings(response.data as any[]);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    }
  };

  const hasMeetingPassed = (meetingDate: string) => {
    return new Date(meetingDate) < new Date();
  };

  const handleLogMeeting = (meeting: any) => {
    if (!hasMeetingPassed(meeting.meetingDate)) {
      toast.error('You can only log meetings after they have occurred');
      return;
    }

    // Allow resubmission if rejected, otherwise check if already logged and approved/completed
    if ((meeting.minutesOfMeeting || meeting.mom) && meeting.status !== 'rejected') {
      toast('This meeting has already been logged', { icon: 'ℹ️' });
      return;
    }

    setSelectedMeeting(meeting);

    // Initialize attendees - for new logs, use current user or group members
    let initialAttendees: string[] = [];
    if (meeting.attendees && meeting.attendees.length > 0) {
      // Resubmission - use existing attendees
      initialAttendees = meeting.attendees
        .map((a: any) => a.studentId?._id || a.studentId)
        .filter((id: string) => id && id.trim() !== '');
    } else if (groupMembers.length > 0) {
      // Group - pre-select all members
      initialAttendees = groupMembers.map((m: any) => m._id);
    } else {
      // Solo student - use current user ID
      const userId = (user as any)?._id || (user as any)?.id;
      if (userId) {
        initialAttendees = [userId];
      }
    }

    setLogForm({
      minutesOfMeeting: meeting.minutesOfMeeting || meeting.mom || '',
      attendees: initialAttendees
    });
  };

  const handleAttendeeToggle = (memberId: string) => {
    if (logForm.attendees.includes(memberId)) {
      setLogForm({
        ...logForm,
        attendees: logForm.attendees.filter(id => id !== memberId)
      });
    } else {
      setLogForm({
        ...logForm,
        attendees: [...logForm.attendees, memberId]
      });
    }
  };

  const handleSubmitLog = async () => {
    if (!logForm.minutesOfMeeting) {
      toast.error('Please enter meeting minutes');
      return;
    }

    if (logForm.attendees.length === 0) {
      toast.error('Please select at least one attendee');
      return;
    }

    if (!selectedMeeting) return;

    setLoading(true);
    try {
      console.log('Submitting meeting log:', {
        meetingId: selectedMeeting._id,
        participants: logForm.attendees.map(id => ({
          studentId: id,
          present: true
        })),
        mom: logForm.minutesOfMeeting
      });

      // Filter out empty strings from attendees
      const validAttendees = logForm.attendees.filter(id => id && id.trim() !== '');

      if (validAttendees.length === 0) {
        toast.error('Please select at least one attendee');
        setLoading(false);
        return;
      }

      const response = await api.post(`/meetings/${selectedMeeting._id}/log`, {
        participants: validAttendees.map(id => ({
          studentId: id,
          present: true
        })),
        mom: logForm.minutesOfMeeting
      });

      console.log('Response:', response);

      if (response.success) {
        toast.success('Meeting log submitted for approval');
        setSelectedMeeting(null);
        fetchMeetings();
        setLogForm({
          minutesOfMeeting: '',
          attendees: []
        });
      } else {
        const errorMsg = response.error?.message || 'Failed to submit meeting log';
        console.error('Error response:', response.error);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error('Exception:', error);
      toast.error(error.message || 'Failed to submit meeting log');
    } finally {
      setLoading(false);
    }
  };

  const getParticipantNames = (meeting: any) => {
    const names: string[] = [];

    // Add team members or solo student
    if (meeting.attendees && meeting.attendees.length > 0) {
      meeting.attendees.forEach((attendee: any) => {
        const name = attendee.studentId?.name || 'Team Member';
        names.push(name);
      });
    } else if (meeting.studentId) {
      names.push(meeting.studentId.name || 'Student');
    }

    // Add faculty
    if (meeting.facultyId) {
      names.push(`${meeting.facultyId.name} (Faculty)`);
    }

    return names;
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scheduleForm.meetingDate) {
      toast.error('Please select a meeting date and time');
      return;
    }

    if (scheduleForm.mode === 'online' && !scheduleForm.meetUrl) {
      toast.error('Please provide a Google Meet URL for online meetings');
      return;
    }

    if (scheduleForm.mode === 'in-person' && !scheduleForm.location) {
      toast.error('Please provide a location for in-person meetings');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/meetings', {
        meetingDate: scheduleForm.meetingDate,
        meetingLink: scheduleForm.meetUrl,
        mode: scheduleForm.mode,
        location: scheduleForm.location
      });

      if (response.success) {
        toast.success('Meeting scheduled successfully');
        setShowScheduleModal(false);
        setScheduleForm({
          meetingDate: '',
          meetUrl: '',
          mode: 'online',
          location: ''
        });
        fetchMeetings();
      } else {
        toast.error(response.error?.message || 'Failed to schedule meeting');
      }
    } catch (error: any) {
      console.error('Error scheduling meeting:', error);
      toast.error(error.message || 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while initializing
  if (initializing || hasProject === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show message if no project assigned
  if (hasProject === false) {
    return <NoAssignmentMessage userType="student" />;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-start"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">Meetings</h1>
            <p className="text-gray-600">
              View scheduled meetings and log meeting minutes
            </p>
          </div>
          
          {/* Schedule Meeting Button - Show for all students with assigned projects */}
          {isLeader && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Schedule Meeting
            </button>
          )}
        </motion.div>

        {/* Meeting List */}
        <div className="space-y-4">
          {meetings.map((meeting) => {
            const hasLog = meeting.minutesOfMeeting || meeting.mom;
            const canResubmit = meeting.status === 'rejected';
            const participantNames = getParticipantNames(meeting);

            return (
              <motion.div
                key={meeting._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${meeting.mode === 'online' ? 'bg-blue-100' : 'bg-green-100'}`}>
                      {meeting.mode === 'online' ? (
                        <Video className="w-6 h-6 text-blue-600" />
                      ) : (
                        <Users className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1">
                        {meeting.mode === 'online' ? 'Online Meeting' : 'In-Person Meeting'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(meeting.meetingDate).toLocaleString()}
                      </div>
                      {meeting.projectId && (
                        <p className="text-sm text-gray-600 mb-2">
                          Project: {meeting.projectId.title} ({meeting.projectId.projectId})
                        </p>
                      )}
                      {meeting.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {meeting.location}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {meeting.status === 'approved' && (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Approved
                      </span>
                    )}
                    {meeting.status === 'submitted' && (
                      <span className="flex items-center gap-1 text-yellow-600 text-sm">
                        <Clock className="w-4 h-4" />
                        Pending
                      </span>
                    )}
                    {meeting.status === 'rejected' && (
                      <span className="flex items-center gap-1 text-red-600 text-sm">
                        <XCircle className="w-4 h-4" />
                        Rejected
                      </span>
                    )}
                  </div>
                </div>

                {/* Participants */}
                <div className="mb-4">
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Participants</h4>
                  <div className="flex flex-wrap gap-2">
                    {participantNames.map((name, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Meeting Link */}
                {meeting.meetUrl && (
                  <a
                    href={meeting.meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-4"
                  >
                    <Video className="w-4 h-4" />
                    Join Meeting
                  </a>
                )}

                {/* Rejection Reason */}
                {meeting.status === 'rejected' && meeting.rejectionReason && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-red-700">
                      <XCircle className="w-4 h-4" />
                      Rejection Reason
                    </h4>
                    <p className="text-sm text-red-700 whitespace-pre-wrap">
                      {meeting.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Meeting Minutes */}
                {hasLog && meeting.status !== 'rejected' && (
                  <div className="p-4 bg-gray-50 rounded-lg mb-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Minutes of Meeting
                    </h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {meeting.minutesOfMeeting || meeting.mom}
                    </p>
                  </div>
                )}

                {/* Log Meeting Button */}
                {/* Show button if: user can submit logs AND meeting is completed AND (no log OR rejected) */}
                {(canSubmitLogs && meeting.status === 'completed' && (!hasLog || canResubmit)) && (
                  <button
                    onClick={() => handleLogMeeting(meeting)}
                    className={`px-4 py-2 ${canResubmit ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg flex items-center gap-2`}
                  >
                    <FileText className="w-4 h-4" />
                    {canResubmit ? 'Resubmit Meeting Minutes' : 'Log Meeting Minutes'}
                  </button>
                )}

                {meeting.status !== 'completed' && (
                  <p className="text-sm text-gray-500 italic">
                    Meeting minutes can be logged after the faculty ends the meeting
                  </p>
                )}

                {meeting.status === 'completed' && hasLog && !canResubmit && (
                  <p className="text-sm text-green-600 italic flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Meeting minutes submitted
                  </p>
                )}
              </motion.div>
            );
          })}

          {meetings.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Meetings Yet</h3>
              <p className="text-gray-600 mb-4">
                {isLeader 
                  ? "Schedule your first meeting with your faculty mentor"
                  : "No meetings scheduled yet"
                }
              </p>
              {isLeader && (
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Schedule Meeting
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Log Meeting Modal */}
      <AnimatePresence>
        {selectedMeeting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedMeeting(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-4">Log Meeting Minutes</h2>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Meeting Date</p>
                <p className="font-medium">{new Date(selectedMeeting.meetingDate).toLocaleString()}</p>
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium">Attendees *</label>
                <div className="space-y-2">
                  {groupMembers.length > 0 ? (
                    // Group members
                    groupMembers.map((member: any) => (
                      <label key={member._id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={logForm.attendees.includes(member._id)}
                          onChange={() => handleAttendeeToggle(member._id)}
                          className="w-4 h-4"
                        />
                        <span>{member.name}</span>
                      </label>
                    ))
                  ) : (
                    // Solo student
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={logForm.attendees.includes((user as any)?._id || (user as any)?.id || '')}
                        onChange={() => handleAttendeeToggle((user as any)?._id || (user as any)?.id || '')}
                        className="w-4 h-4"
                      />
                      <span>{user?.name} (You)</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium">Minutes of Meeting (MOM) *</label>
                <textarea
                  value={logForm.minutesOfMeeting}
                  onChange={(e) => setLogForm({ ...logForm, minutesOfMeeting: e.target.value })}
                  rows={8}
                  placeholder="Enter meeting notes, discussions, decisions, and action items..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSubmitLog}
                  disabled={loading}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Submitting...' : 'Submit for Approval'}
                </button>
                <button
                  onClick={() => setSelectedMeeting(null)}
                  className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Meeting Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowScheduleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule Meeting</h2>

              <form onSubmit={handleScheduleMeeting} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.meetingDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, meetingDate: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Mode
                  </label>
                  <select
                    value={scheduleForm.mode}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, mode: e.target.value as 'online' | 'in-person' })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="online">Online (Google Meet)</option>
                    <option value="in-person">In-Person</option>
                  </select>
                </div>

                {scheduleForm.mode === 'online' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Meet URL
                    </label>
                    <input
                      type="url"
                      value={scheduleForm.meetUrl}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, meetUrl: e.target.value })}
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={scheduleForm.location}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                      placeholder="Room number, building, etc."
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {loading ? 'Scheduling...' : 'Schedule Meeting'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
