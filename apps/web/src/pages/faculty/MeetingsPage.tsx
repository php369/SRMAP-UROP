import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Video, CheckCircle, XCircle, Clock, Plus, Eye, AlertCircle, MapPin, Users, FileText, ChevronRight, MoreHorizontal, Link } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/Textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent } from '../../components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';
import { NoAssignmentMessage } from '../../components/common/NoAssignmentMessage';
import { api } from '../../utils/api';
import { MeetingEmptyState } from './components/MeetingEmptyState';
import { MeetingDateTimePicker } from '../../components/ui/MeetingDateTimePicker';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '../../utils/cn';

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
  useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingLogs, setMeetingLogs] = useState<MeetingLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MeetingLog | null>(null);
  const [activeTab, setActiveTab] = useState<'meetings' | 'logs'>('meetings');
  const [meetingsSubTab, setMeetingsSubTab] = useState<'upcoming' | 'past'>('upcoming');
  const [logsSubTab, setLogsSubTab] = useState<'pending' | 'approved'>('pending');
  const [hasAssignments, setHasAssignments] = useState<boolean | null>(null);

  const [scheduleData, setScheduleData] = useState({
    projectId: '',
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

  const [approvalData, setApprovalData] = useState({
    facultyNotes: ''
  });
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    setInitialLoading(true);
    await Promise.all([
      checkAssignments(),
      fetchMeetings(),
      fetchMeetingLogs(),
      fetchProjects()
    ]);
    setInitialLoading(false);
  };

  const checkAssignments = async () => {
    try {
      const [projectsRes, appsRes] = await Promise.all([
        api.get('/projects/faculty'),
        api.get('/applications/faculty')
      ]);

      const hasAssignedProjects = !!(projectsRes.data && Array.isArray(projectsRes.data) &&
        projectsRes.data.some((p: any) => p.status === 'assigned'));

      const hasApprovedApps = !!(appsRes.data && Array.isArray(appsRes.data) &&
        appsRes.data.some((app: any) => app.status === 'approved'));

      setHasAssignments(hasAssignedProjects || hasApprovedApps);
    } catch (error) {
      console.error('Error checking assignments:', error);
      setHasAssignments(false);
    }
  };

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/meetings/faculty');
      const allMeetings = Array.isArray(response.data) ? response.data : [];
      setMeetings(allMeetings);
    } catch (error) {
      toast.error('Failed to fetch meetings');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetingLogs = async () => {
    try {
      const response = await api.get('/meetings/logs/faculty');
      setMeetingLogs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Failed to fetch meeting logs');
      setMeetingLogs([]);
    }
  };

  const fetchProjects = async () => {
    try {
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

    setLoading(true);
    try {
      const meetingDateObj = new Date(scheduleData.meetingDate);
      const meetingDateUTC = meetingDateObj.toISOString();

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
    } finally {
      setLoading(false);
    }
  };

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
    if (!approved) {
      setShowRejectModal(true);
      return;
    }

    try {
      const response = await api.put(`/meetings/logs/${logId}/approve`, {
        approved: true,
        facultyNotes: ''
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
        await Promise.all([
          fetchMeetings(),
          fetchMeetingLogs()
        ]);
      } else {
        toast.error(response.error?.message || 'Failed to complete meeting');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete meeting');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      scheduled: "bg-cyan-100 text-cyan-700 border-cyan-200",
      completed: "bg-amber-100 text-amber-700 border-amber-200",
      pending: "bg-orange-100 text-orange-700 border-orange-200",
      approved: "bg-green-100 text-green-700 border-green-200",
      rejected: "bg-red-100 text-red-700 border-red-200"
    };

    const icons = {
      scheduled: Clock,
      completed: AlertCircle,
      pending: AlertCircle,
      approved: CheckCircle,
      rejected: XCircle
    };

    const labels = {
      scheduled: 'Scheduled',
      completed: 'Awaiting Log',
      pending: 'Needs Resubmission',
      approved: 'Approved',
      rejected: 'Rejected'
    };

    const Icon = icons[status as keyof typeof icons] || Clock;

    return (
      <Badge variant="outline" className={cn("gap-1.5", styles[status as keyof typeof styles])}>
        <Icon className="w-3 h-3" />
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-4 w-64 bg-slate-200 dark:bg-slate-800" />
          </div>
          <Skeleton className="h-10 w-32 bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (hasAssignments === false) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <MeetingEmptyState
          title="No Students Assigned"
          description="You haven't been assigned any students or groups yet. Meetings will be available once students are assigned to your projects."
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
            Meetings & Logs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your schedule and review student meeting logs
          </p>
        </div>
        <Button
          onClick={() => setShowScheduleModal(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Meeting
        </Button>
      </motion.div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'meetings' | 'logs')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-8 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
          <TabsTrigger value="meetings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">Schedule</TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
            Review Logs
            {getPendingLogs().length > 0 && (
              <Badge className="ml-2 bg-orange-100 text-orange-700 hover:bg-orange-100 border-none px-1.5 py-0 h-5 text-[10px]">
                {getPendingLogs().length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {/* MEETINGS TAB */}
          <TabsContent value="meetings" className="space-y-6 focus-visible:outline-none">
            <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 overflow-x-auto">
              <div className="flex gap-2">
                {(['upcoming', 'past'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setMeetingsSubTab(tab)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-full transition-all border",
                      meetingsSubTab === tab
                        ? "bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-900/20 dark:border-cyan-800 dark:text-cyan-400"
                        : "bg-transparent border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    )}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === 'upcoming' ? getUpcomingMeetings().length : getPastMeetings().length})
                  </button>
                ))}
              </div>
            </div>

            {meetingsSubTab === 'upcoming' ? (
              getUpcomingMeetings().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No Scheduled Meetings</h3>
                  <p className="text-slate-500 max-w-sm mt-2 mb-6">
                    You don't have any upcoming meetings scheduled. Schedule one to touch base with your students.
                  </p>
                  <Button onClick={() => setShowScheduleModal(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getUpcomingMeetings().map((meeting) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={meeting._id}
                    >
                      <Card className="h-full border-l-4 border-l-cyan-500 hover:shadow-md transition-shadow">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex justify-between items-start">
                            <Badge variant="outline" className={cn(
                              "px-2.5 py-0.5 rounded-full text-xs font-semibold",
                              meeting.mode === 'online' ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-purple-50 text-purple-600 border-purple-200"
                            )}>
                              {meeting.mode === 'online' ? 'Online' : 'In-Person'}
                            </Badge>
                            {meeting.status === 'completed' && (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">Awaiting Log</Badge>
                            )}
                          </div>

                          <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 line-clamp-1">
                              {meeting.groupId ? `Group ${meeting.groupId.groupCode}` : meeting.studentId?.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                              <Users className="w-3.5 h-3.5" />
                              <span>
                                {meeting.attendees ? meeting.attendees.length : (meeting.groupId ? meeting.groupId.members.length : 1)} Participants
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 text-sm">
                              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                                <Calendar className="w-4 h-4" />
                              </div>
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {new Date(meeting.meetingDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                                <Clock className="w-4 h-4" />
                              </div>
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {new Date(meeting.meetingDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {meeting.location && meeting.mode === 'in-person' && (
                              <div className="flex items-center gap-3 text-sm">
                                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                                  <MapPin className="w-4 h-4" />
                                </div>
                                <span className="text-slate-600 dark:text-slate-400 truncate">{meeting.location}</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-4 flex items-center gap-2">
                            {meeting.status === 'scheduled' ? (
                              <>
                                {meeting.meetUrl && (
                                  <Button variant="outline" size="sm" className="flex-1" asChild>
                                    <a href={meeting.meetUrl} target="_blank" rel="noopener noreferrer">
                                      <Video className="w-3.5 h-3.5 mr-2" />
                                      Join
                                    </a>
                                  </Button>
                                )}
                                <Button
                                  onClick={() => handleCompleteMeeting(meeting._id)}
                                  size="sm"
                                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                                >
                                  End Meeting
                                </Button>
                              </>
                            ) : (
                              <Button variant="ghost" className="w-full text-slate-400 cursor-default hover:bg-transparent">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Marked as Completed
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )
            ) : (
              // PAST MEETINGS
              getPastMeetings().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-full mb-3">
                    <Clock className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">No past meetings found</p>
                </div>
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
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-green-100/50 text-green-600 flex items-center justify-center border border-green-100 shrink-0">
                              <CheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                {meeting.groupId ? `Group ${meeting.groupId.groupCode}` : meeting.studentId?.name}
                              </h4>
                              <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {new Date(meeting.meetingDate).toLocaleDateString()}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5" />
                                  {meeting.attendees ? meeting.attendees.filter(a => a.present).length : 0} Present
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Approved</Badge>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )
            )}
          </TabsContent>

          {/* LOGS TAB */}
          <TabsContent value="logs" className="space-y-6 focus-visible:outline-none">
            <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setLogsSubTab('pending')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-full transition-all border relation",
                    logsSubTab === 'pending'
                      ? "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400"
                      : "bg-transparent border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  Pending Review ({getPendingLogs().length})
                </button>
                <button
                  onClick={() => setLogsSubTab('approved')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-full transition-all border",
                    logsSubTab === 'approved'
                      ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                      : "bg-transparent border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  Approved History ({getApprovedLogs().length})
                </button>
              </div>
            </div>

            {logsSubTab === 'pending' ? (
              getPendingLogs().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-full mb-3">
                    <CheckCircle className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">All caught up! No pending reviews.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {getPendingLogs().map((log) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={log._id}
                    >
                      <Card className="border-l-4 border-l-orange-400 hover:shadow-md transition-all cursor-pointer group" onClick={() => {
                        setSelectedLog(log);
                        setApprovalData({ facultyNotes: log.facultyNotes || '' });
                      }}>
                        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl border border-orange-100 group-hover:bg-orange-100 transition-colors">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-slate-900 dark:text-slate-100">
                                  {log.groupId ? `Group ${log.groupId.groupCode}` : log.studentId?.name}
                                </h4>
                                {getStatusBadge(log.status)}
                              </div>
                              <p className="text-sm text-slate-500 line-clamp-1 max-w-md">
                                {log.minutesOfMeeting || log.mom || "No preview available..."}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                <span>{new Date(log.meetingDate).toLocaleDateString()}</span>
                                <span>Submitted {new Date(log.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-slate-400 group-hover:text-cyan-600">
                            Review <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )
            ) : (
              getApprovedLogs().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-full mb-3">
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">No approved logs history</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {getApprovedLogs().map((log) => (
                    <Card key={log._id} className="opacity-80 hover:opacity-100 transition-opacity">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900">
                              {log.groupId ? `Group ${log.groupId.groupCode}` : log.studentId?.name}
                            </h4>
                            <p className="text-sm text-slate-500">
                              {new Date(log.meetingDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setSelectedLog(log);
                          setApprovalData({ facultyNotes: log.facultyNotes || '' });
                        }}>
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            )}
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      {/* SCHEDULE MODAL */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Schedule New Meeting</DialogTitle>
            <DialogDescription>
              Set up a meeting with your assigned students.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleScheduleMeeting} className="space-y-6 py-2">
            <div className="space-y-2">
              <Label>Select Project</Label>
              <Select
                value={scheduleData.projectId}
                onValueChange={(val) => setScheduleData({ ...scheduleData, projectId: val })}
                required
              >
                <SelectTrigger className="focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 border-slate-200 focus:border-cyan-500 transition-colors">
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date & Time</Label>
              <MeetingDateTimePicker
                value={scheduleData.meetingDate ? new Date(scheduleData.meetingDate) : undefined}
                onChange={(date) => setScheduleData({ ...scheduleData, meetingDate: date.toISOString() })}
                placeholder="Pick date & time"
              />
            </div>

            <div className="space-y-2">
              <Label>Meeting Mode</Label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={cn(
                    "cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50",
                    scheduleData.mode === 'online'
                      ? "border-cyan-500 bg-cyan-50/50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  )}
                  onClick={() => setScheduleData({ ...scheduleData, mode: 'online' })}
                >
                  <Video className="w-6 h-6" />
                  <span className="font-medium text-sm">Online Meeting</span>
                </div>
                <div
                  className={cn(
                    "cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50",
                    scheduleData.mode === 'in-person'
                      ? "border-cyan-500 bg-cyan-50/50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  )}
                  onClick={() => setScheduleData({ ...scheduleData, mode: 'in-person' })}
                >
                  <MapPin className="w-6 h-6" />
                  <span className="font-medium text-sm">In-Person</span>
                </div>
              </div>
            </div>

            {scheduleData.mode === 'online' ? (
              <div className="space-y-2">
                <Label>Meeting Link</Label>
                <div className="relative">
                  <Link className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="https://meet.google.com/..."
                    value={scheduleData.meetUrl}
                    onChange={(e) => setScheduleData({ ...scheduleData, meetUrl: e.target.value })}
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
                    placeholder="e.g. Faculty Cabin, Lab 3..."
                    value={scheduleData.location}
                    onChange={(e) => setScheduleData({ ...scheduleData, location: e.target.value })}
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
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Meeting
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      {/* LOG REVIEW MODAL */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Meeting Minutes</DialogTitle>
            <DialogDescription>
              Review the minutes submitted by {selectedLog?.groupId ? `Group ${selectedLog.groupId.groupCode}` : selectedLog?.studentId?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
              <div className="space-y-6 pt-2">
                {/* Meta Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Meeting Date</p>
                    <p className="font-medium text-slate-900">{new Date(selectedLog.meetingDate).toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Attendance</p>
                    <p className="font-medium text-slate-900">
                      {selectedLog.attendees?.filter((a: any) => a.present).length || 0} / {selectedLog.attendees?.length || 0} Present
                    </p>
                  </div>
                </div>

                {/* Attendees List */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    Attendance Record
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedLog.attendees && selectedLog.attendees.map((attendee: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 border rounded-lg bg-white">
                        <div className={cn("w-2 h-2 rounded-full", attendee.present ? "bg-green-500" : "bg-red-300")} />
                        <span className={cn("text-sm", attendee.present ? "text-slate-700 font-medium" : "text-slate-400 line-through")}>
                          {attendee.studentId?.name || 'Unknown'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MOM Content */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    Minutes (MOM)
                  </h4>
                  <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedLog.minutesOfMeeting || selectedLog.mom || "No content."}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApproveLog(selectedLog._id, true)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Minutes
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => setShowRejectModal(true)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject & Request Changes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* REJECTION REASON MODAL */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Reject Meeting Log</DialogTitle>
            <DialogDescription>
              Please provide feedback on what needs to be corrected in the minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Textarea
              value={approvalData.facultyNotes}
              onChange={(e) => setApprovalData({ facultyNotes: e.target.value })}
              placeholder="e.g., Please include the decision about..."
              className="resize-none h-32"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectWithFeedback}>
              Submit Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}
