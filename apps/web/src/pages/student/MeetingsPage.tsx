import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Video, Calendar, Users, CheckCircle, Clock, XCircle, FileText, MapPin, Plus, AlertCircle, ChevronRight, Link } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import { toast } from 'sonner';
import { NoAssignmentMessage } from '../../components/common/NoAssignmentMessage';

import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/Textarea';
import { Skeleton } from '../../components/ui/skeleton';
import { MeetingEmptyState } from '../faculty/components/MeetingEmptyState';
import { MeetingDateTimePicker } from '../../components/ui/MeetingDateTimePicker';
import { cn } from '../../utils/cn';
export function MeetingsPage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLeader, setIsLeader] = useState(false);
  const [canSubmitLogs, setCanSubmitLogs] = useState(false);
  const [canScheduleNewMeeting, setCanScheduleNewMeeting] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]); // { _id, name }
  const [hasProject, setHasProject] = useState<boolean | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [logForm, setLogForm] = useState({
    minutesOfMeeting: '',
    attendees: [] as string[]
  });

  const [scheduleForm, setScheduleForm] = useState({
    meetingDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(21, 0, 0, 0);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    })(),
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
        const applications = response.data as any[];
        const hasApprovedApplication = applications.some(app => app.status === 'approved');
        setHasProject(hasApprovedApplication);
      } else {
        setHasProject(false);
      }
    } catch (error) {
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

        setIsLeader(true); // All members can schedule
        setCanSubmitLogs(userIsLeader); // Only leader logs
        setGroupMembers(groupData.members || []);
      } else {
        // Solo student check
        try {
          const appResponse = await api.get('/applications/my-application');
          if (appResponse.success && appResponse.data) {
            const applications = appResponse.data as any[];
            const hasApprovedApp = applications.some(app => app.status === 'approved');
            setIsLeader(hasApprovedApp);
            setCanSubmitLogs(hasApprovedApp);
          } else {
            setIsLeader(false);
            setCanSubmitLogs(false);
          }
        } catch (appError) {
          setIsLeader(false);
          setCanSubmitLogs(false);
        }
        setGroupMembers([]);
      }
    } catch (error) {
      setIsLeader(false);
      setCanSubmitLogs(false);
      setGroupMembers([]);
    }
  };

  const fetchMeetings = async () => {
    try {
      const response = await api.get('/meetings/student');
      if (response.success && response.data) {
        const meetingsData = response.data as any[];
        setMeetings(meetingsData);

        const hasPendingMeetings = meetingsData.some(meeting =>
          meeting.status === 'scheduled' ||
          meeting.status === 'completed' ||
          meeting.status === 'pending'
        );

        setCanScheduleNewMeeting(!hasPendingMeetings);
      }
    } catch (error) {
      toast.error('Failed to load meetings');
    }
  };

  const getUpcomingMeetings = () => {
    return meetings.filter(meeting =>
      meeting.status === 'scheduled' ||
      meeting.status === 'completed' ||
      meeting.status === 'pending'
    );
  };

  const getPastMeetings = () => {
    return meetings.filter(meeting => meeting.status === 'approved');
  };

  const hasMeetingPassed = (meetingDate: string) => {
    return new Date(meetingDate) < new Date();
  };

  const handleLogMeeting = (meeting: any) => {
    if (!hasMeetingPassed(meeting.meetingDate)) {
      toast.error('You can only log meetings after they have occurred');
      return;
    }

    if ((meeting.minutesOfMeeting || meeting.mom) && meeting.status !== 'rejected' && meeting.status !== 'pending') {
      toast('This meeting has already been logged', { icon: 'ℹ️' });
      return;
    }

    setSelectedMeeting(meeting);

    let initialAttendees: string[] = [];
    if (meeting.attendees && meeting.attendees.length > 0) {
      initialAttendees = meeting.attendees
        .map((a: any) => a.studentId?._id || a.studentId)
        .filter((id: string) => id && id.trim() !== '');
    } else if (groupMembers.length > 0) {
      initialAttendees = groupMembers.map((m: any) => m._id);
    } else {
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

      if (response.success) {
        toast.success('Meeting log submitted for approval');
        setSelectedMeeting(null);
        fetchMeetings();
        setLogForm({
          minutesOfMeeting: '',
          attendees: []
        });
      } else {
        toast.error(response.error?.message || 'Failed to submit meeting log');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit meeting log');
    } finally {
      setLoading(false);
    }
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
      const meetingDateObj = new Date(scheduleForm.meetingDate);
      const meetingDateUTC = meetingDateObj.toISOString();

      const response = await api.post('/meetings', {
        meetingDate: meetingDateUTC,
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
      toast.error(error.message || 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  if (initializing || hasProject === null) {
    return (
      <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-4 w-64 bg-slate-200 dark:bg-slate-800" />
          </div>
          <Skeleton className="h-10 w-32 bg-slate-200 dark:bg-slate-800" />
        </div>
        <Skeleton className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (hasProject === false) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <MeetingEmptyState
          title="No Project Assigned"
          description="You haven't been assigned to a project yet. Meetings will be available once you're assigned to a faculty mentor."
          icon="presentation"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400">
            Meetings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Schedule meetings with your faculty mentor and log minutes.
          </p>
        </div>
        {isLeader && (
          <Button
            onClick={() => canScheduleNewMeeting ? setShowScheduleModal(true) : null}
            disabled={!canScheduleNewMeeting}
            className={cn(
              "bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/20",
              !canScheduleNewMeeting && "opacity-75 cursor-not-allowed bg-slate-400 hover:bg-slate-400 shadow-none text-slate-100"
            )}
            title={!canScheduleNewMeeting ? "Previous meeting log must be approved first" : ""}
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Meeting
          </Button>
        )}
      </motion.div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upcoming' | 'past')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-8 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">Upcoming</TabsTrigger>
          <TabsTrigger value="past" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">History</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="upcoming" className="focus-visible:outline-none">
            {getUpcomingMeetings().length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No Upcoming Meetings</h3>
                <p className="text-slate-500 max-w-sm mt-2 mb-6">
                  You don't have any upcoming meetings scheduled with your faculty mentor.
                </p>
                {isLeader && canScheduleNewMeeting && (
                  <Button onClick={() => setShowScheduleModal(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Meeting
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getUpcomingMeetings().map((meeting) => {
                  const hasLog = meeting.minutesOfMeeting || meeting.mom;
                  const canResubmit = meeting.status === 'rejected' || meeting.status === 'pending';

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={meeting._id}
                    >
                      <Card className={cn(
                        "h-full border-l-4 transition-all hover:shadow-lg",
                        meeting.status === 'rejected' ? "border-l-red-500" :
                          meeting.status === 'pending' ? "border-l-orange-500" :
                            "border-l-cyan-500"
                      )}>
                        <CardContent className="p-6 flex flex-col h-full">
                          {/* Header Badges */}
                          <div className="flex justify-between items-start mb-4">
                            <Badge variant="outline" className={cn(
                              "px-2.5 py-0.5 rounded-full text-xs font-semibold",
                              meeting.mode === 'online' ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-purple-50 text-purple-600 border-purple-200"
                            )}>
                              {meeting.mode === 'online' ? 'Online' : 'In-Person'}
                            </Badge>

                            {meeting.status === 'rejected' && <Badge variant="error" className="bg-red-50 text-red-600 border-red-200">Feedback Received</Badge>}
                            {meeting.status === 'pending' && <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">Updates Required</Badge>}
                          </div>

                          {/* Info */}
                          <div className="space-y-3 mb-6 flex-1">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                              {meeting.projectId?.title || 'Project Meeting'}
                            </h3>

                            <div className="space-y-2">
                              <div className="flex items-center gap-3 text-sm">
                                <Calendar className="w-4 h-4 text-cyan-600" />
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {new Date(meeting.meetingDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <Clock className="w-4 h-4 text-cyan-600" />
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {new Date(meeting.meetingDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {meeting.location && (
                                <div className="flex items-center gap-3 text-sm">
                                  <MapPin className="w-4 h-4 text-cyan-600" />
                                  <span className="text-slate-600 dark:text-slate-400">{meeting.location}</span>
                                </div>
                              )}
                            </div>

                            {/* Feedback Box */}
                            {(meeting.status === 'rejected' || meeting.status === 'pending') && meeting.rejectionReason && (
                              <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                                <div className="font-semibold flex items-center gap-1 mb-1">
                                  <AlertCircle className="w-3 h-3" /> Faculty Feedback
                                </div>
                                {meeting.rejectionReason}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                            {meeting.meetUrl && meeting.status === 'scheduled' && (
                              <Button variant="outline" className="w-full border-cyan-200 text-cyan-700 hover:bg-cyan-50 group" asChild>
                                <a href={meeting.meetUrl} target="_blank" rel="noopener noreferrer">
                                  <Video className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                  Join Meeting
                                </a>
                              </Button>
                            )}

                            {canSubmitLogs && (meeting.status === 'completed' || meeting.status === 'pending') && (!hasLog || canResubmit) && (
                              <Button
                                onClick={() => handleLogMeeting(meeting)}
                                className={cn(
                                  "w-full text-white",
                                  canResubmit ? "bg-orange-500 hover:bg-orange-600" : "bg-emerald-600 hover:bg-emerald-700"
                                )}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                {canResubmit ? 'Resubmit Minutes' : 'Log Minutes'}
                              </Button>
                            )}

                            {hasLog && !canResubmit && meeting.status !== 'approved' && (
                              <div className="text-center w-full py-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg font-medium">
                                Minutes Submitted
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="focus-visible:outline-none">
            {getPastMeetings().length === 0 ? (
              <MeetingEmptyState
                title="No Past Meetings"
                description="Your history of approved meetings will appear here."
                icon="clock"
              />
            ) : (
              <div className="space-y-4">
                {getPastMeetings().map((meeting) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={meeting._id}
                  >
                    <Card className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-cyan-100/50 text-cyan-600 flex items-center justify-center border border-cyan-100 shrink-0">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                              {meeting.projectId?.title || 'Project Meeting'}
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(meeting.meetingDate).toLocaleDateString()}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {getPastMeetings().length} Participants
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Button variant="ghost" size="sm" onClick={() => handleLogMeeting(meeting)}>
                            View Minutes
                          </Button>
                          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Approved</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </AnimatePresence>
      </Tabs>


      {/* SCHEDULE MODAL */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Schedule Meeting</DialogTitle>
            <DialogDescription>Request a meeting with your faculty mentor.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleScheduleMeeting} className="space-y-6 py-2">
            <div className="space-y-2">
              <Label>Date & Time</Label>
              <MeetingDateTimePicker
                value={scheduleForm.meetingDate ? new Date(scheduleForm.meetingDate) : undefined}
                onChange={(date) => setScheduleForm({ ...scheduleForm, meetingDate: format(date, "yyyy-MM-dd'T'HH:mm:ss") })}
                placeholder="Pick date & time"
              />
            </div>

            <div className="space-y-2">
              <Label>Meeting Mode</Label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={cn(
                    "cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50",
                    scheduleForm.mode === 'online'
                      ? "border-cyan-500 bg-cyan-50/50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  )}
                  onClick={() => setScheduleForm({ ...scheduleForm, mode: 'online' })}
                >
                  <Video className="w-6 h-6" />
                  <span className="font-medium text-sm">Online Meeting</span>
                </div>
                <div
                  className={cn(
                    "cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50",
                    scheduleForm.mode === 'in-person'
                      ? "border-cyan-500 bg-cyan-50/50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  )}
                  onClick={() => setScheduleForm({ ...scheduleForm, mode: 'in-person' })}
                >
                  <MapPin className="w-6 h-6" />
                  <span className="font-medium text-sm">In-Person</span>
                </div>
              </div>
            </div>

            {scheduleForm.mode === 'online' ? (
              <div className="space-y-2">
                <Label>Meeting Link</Label>
                <div className="relative">
                  <Link className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="https://meet.google.com/..."
                    value={scheduleForm.meetUrl}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, meetUrl: e.target.value })}
                    className="pl-9 focus-visible:ring-0 focus-visible:border-cyan-500 transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="e.g. Faculty Cabin, Lab..."
                    value={scheduleForm.location}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                    required
                    className="pl-9 focus-visible:ring-0 focus-visible:border-cyan-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
              <Button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-700 text-white min-w-[150px]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      {/* LOG MINUTES MODAL */}
      <Dialog open={!!selectedMeeting} onOpenChange={(open) => !open && setSelectedMeeting(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Log Meeting Minutes</DialogTitle>
            <DialogDescription>
              Record the details of your meeting on {selectedMeeting && new Date(selectedMeeting.meetingDate).toLocaleDateString()}.
            </DialogDescription>
          </DialogHeader>

          {selectedMeeting && (
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Attendees</Label>
                <div className="grid grid-cols-2 gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  {groupMembers.length > 0 ? (
                    groupMembers.map((member: any) => (
                      <label key={member._id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                          checked={logForm.attendees.includes(member._id)}
                          onChange={() => handleAttendeeToggle(member._id)}
                        />
                        <span className="text-sm font-medium text-slate-700">{member.name}</span>
                      </label>
                    ))
                  ) : (
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        checked={logForm.attendees.includes((user as any)?._id || (user as any)?.id || '')}
                        onChange={() => handleAttendeeToggle((user as any)?._id || (user as any)?.id || '')}
                      />
                      <span className="text-sm font-medium text-slate-700">{user?.name} (You)</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Minutes (MOM)</Label>
                <Textarea
                  placeholder="Summary of discussion, action items, and next steps..."
                  className="min-h-[200px] resize-none focus-visible:ring-cyan-500"
                  value={logForm.minutesOfMeeting}
                  onChange={(e) => setLogForm({ ...logForm, minutesOfMeeting: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setSelectedMeeting(null)}>Cancel</Button>
                <Button
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  onClick={handleSubmitLog}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Minutes'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
