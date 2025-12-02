import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, Calendar, Users, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

export function MeetingsPage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLeader, setIsLeader] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  const [logForm, setLogForm] = useState({
    meetingDate: '',
    mode: 'online' as 'online' | 'in-person',
    meetUrl: '',
    location: '',
    minutesOfMeeting: '',
    attendees: [] as string[]
  });

  useEffect(() => {
    checkUserRole();
    fetchMeetings();
  }, []);

  const checkUserRole = async () => {
    try {
      const response = await api.get('/groups/my-group');
      if (response.success && response.data) {
        const groupData = response.data as any;
        setIsLeader(groupData.leaderId === user?._id);
        setGroupMembers(groupData.members);
      } else {
        setIsLeader(true); // Solo student
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsLeader(true);
    }
  };

  const fetchMeetings = async () => {
    try {
      const response = await api.get('/meeting-logs');
      if (response.success && response.data) {
        setMeetings(response.data as any[]);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
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
    if (!logForm.meetingDate || !logForm.minutesOfMeeting) {
      toast.error('Please fill all required fields');
      return;
    }

    if (logForm.mode === 'online' && !logForm.meetUrl) {
      toast.error('Meeting URL is required for online meetings');
      return;
    }

    if (logForm.mode === 'in-person' && !logForm.location) {
      toast.error('Location is required for in-person meetings');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/meeting-logs', {
        ...logForm,
        startedAt: new Date(logForm.meetingDate),
        attendees: logForm.attendees.map(id => ({
          studentId: id,
          present: true
        }))
      });

      if (response.success) {
        toast.success('Meeting log submitted for approval');
        setShowLogForm(false);
        fetchMeetings();
        // Reset form
        setLogForm({
          meetingDate: '',
          mode: 'online',
          meetUrl: '',
          location: '',
          minutesOfMeeting: '',
          attendees: []
        });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to submit meeting log');
      }
    } catch (error) {
      toast.error('Failed to submit meeting log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">Meetings</h1>
            <p className="text-gray-600">
              Schedule meetings and log meeting entries
            </p>
          </div>

          {isLeader && (
            <button
              onClick={() => setShowLogForm(!showLogForm)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Log Meeting
            </button>
          )}
        </motion.div>

        {/* Meeting Log Form */}
        {showLogForm && isLeader && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-6"
          >
            <h2 className="text-xl font-bold mb-4">Create Meeting Log</h2>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">Meeting Date & Time *</label>
                <input
                  type="datetime-local"
                  value={logForm.meetingDate}
                  onChange={(e) => setLogForm({ ...logForm, meetingDate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Mode *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="online"
                      checked={logForm.mode === 'online'}
                      onChange={(e) => setLogForm({ ...logForm, mode: e.target.value as any })}
                    />
                    Online (Google Meet)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="in-person"
                      checked={logForm.mode === 'in-person'}
                      onChange={(e) => setLogForm({ ...logForm, mode: e.target.value as any })}
                    />
                    In-Person
                  </label>
                </div>
              </div>

              {logForm.mode === 'online' && (
                <div>
                  <label className="block mb-2 font-medium">Google Meet URL *</label>
                  <input
                    type="url"
                    value={logForm.meetUrl}
                    onChange={(e) => setLogForm({ ...logForm, meetUrl: e.target.value })}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              )}

              {logForm.mode === 'in-person' && (
                <div>
                  <label className="block mb-2 font-medium">Location *</label>
                  <input
                    type="text"
                    value={logForm.location}
                    onChange={(e) => setLogForm({ ...logForm, location: e.target.value })}
                    placeholder="Room number or location"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              )}

              {groupMembers.length > 0 && (
                <div>
                  <label className="block mb-2 font-medium">Participants *</label>
                  <div className="space-y-2">
                    {groupMembers.map((member: any) => (
                      <label key={member._id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={logForm.attendees.includes(member._id)}
                          onChange={() => handleAttendeeToggle(member._id)}
                        />
                        {member.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block mb-2 font-medium">Minutes of Meeting (MOM) *</label>
                <textarea
                  value={logForm.minutesOfMeeting}
                  onChange={(e) => setLogForm({ ...logForm, minutesOfMeeting: e.target.value })}
                  rows={6}
                  placeholder="Enter meeting notes, discussions, and action items..."
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSubmitLog}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit for Approval'}
                </button>
                <button
                  onClick={() => setShowLogForm(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Meeting List */}
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <motion.div
              key={meeting._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    meeting.mode === 'online' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {meeting.mode === 'online' ? (
                      <Video className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Users className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">
                      {meeting.mode === 'online' ? 'Online Meeting' : 'In-Person Meeting'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {new Date(meeting.meetingDate).toLocaleString()}
                    </div>
                    {meeting.location && (
                      <p className="text-sm text-gray-600 mt-1">
                        Location: {meeting.location}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
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

              {meeting.minutesOfMeeting && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Minutes of Meeting</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {meeting.minutesOfMeeting}
                  </p>
                </div>
              )}

              {meeting.attendees && meeting.attendees.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Participants</h4>
                  <div className="flex flex-wrap gap-2">
                    {meeting.attendees.map((attendee: any) => (
                      <span
                        key={attendee.studentId}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {attendee.present ? '✓' : '✗'} {attendee.studentId.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {meetings.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Meetings Yet</h3>
              <p className="text-gray-600">
                {isLeader
                  ? 'Create your first meeting log to get started'
                  : 'Your group leader will schedule meetings'}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
