import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, Edit2, Search, Filter, SlidersHorizontal, ArrowUpDown, GraduationCap, Building2, Briefcase, Mail, Info, FileText } from 'lucide-react';
import { api } from '../../utils/api';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ApplicationEmptyState } from './components/ApplicationEmptyState';
import { useWindowStatus } from '../../hooks/useWindowStatus';

interface Application {
  _id: string;
  studentId?: {
    _id: string;
    name: string;
    email: string;
    studentId: string;
    department: string;
  };
  groupId?: {
    _id: string;
    groupCode: string;
    leaderId: {
      _id: string;
      name: string;
      email: string;
      studentId: string;
    };
    members: Array<{
      _id: string;
      name: string;
      email: string;
      studentId: string;
    }>;
    memberData?: Array<{
      userId: string;
      cgpa: number;
      department: string;
      specialization?: string;
    }>;
  };
  projectId: {
    _id: string;
    title: string;
    brief: string;
    facultyName: string;
    department: string;
  };
  department: string;
  stream?: string;
  specialization?: string;
  cgpa?: number;
  semester: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
}

export function FacultyApplicationsPage() {
  const { user } = useAuth();
  const { isApplicationOpen } = useWindowStatus();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [processingApp, setProcessingApp] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState('');

  // Filter and Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest, cgpa-high, cgpa-low

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get<Application[]>('/applications/faculty');
      if (response.success && response.data) {
        setApplications(response.data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  // Derived Filtered Applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.projectId.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.studentId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.groupId?.leaderId.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = deptFilter === 'all' || app.department === deptFilter;
    const matchesProject = projectFilter === 'all' || app.projectId._id === projectFilter;

    return matchesSearch && matchesDept && matchesProject;
  }).sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortOrder === 'cgpa-high') return (b.cgpa || 0) - (a.cgpa || 0);
    if (sortOrder === 'cgpa-low') return (a.cgpa || 0) - (b.cgpa || 0);
    return 0;
  });

  const uniqueDepts = Array.from(new Set(applications.map(app => app.department)));
  const uniqueProjects = Array.from(new Set(applications.map(app => JSON.stringify({ id: app.projectId._id, title: app.projectId.title })))).map(s => JSON.parse(s));

  const pendingApplications = filteredApplications.filter(app => app.status === 'pending');
  const reviewedApplications = filteredApplications.filter(app => app.status !== 'pending');

  const handleAcceptApplication = async (applicationId: string, projectId: string) => {
    if (!confirm('Are you sure you want to accept this application? This will assign the project to this student/group and reject other applicants.')) {
      return;
    }

    setProcessingApp(applicationId);
    try {
      const response = await api.post(`/applications/${applicationId}/accept`, {
        projectId
      });

      if (response.success) {
        toast.success('Application accepted successfully!');
        await fetchApplications();
      } else {
        toast.error(response.error?.message || 'Failed to accept application');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept application');
    } finally {
      setProcessingApp(null);
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    const reason = prompt('Optional: Provide a reason for rejection');

    setProcessingApp(applicationId);
    try {
      const response = await api.post(`/applications/${applicationId}/reject`, {
        reason: reason || undefined
      });

      if (response.success) {
        toast.success('Application rejected');
        await fetchApplications();
      } else {
        toast.error(response.error?.message || 'Failed to reject application');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject application');
    } finally {
      setProcessingApp(null);
    }
  };

  const handleUpdateProjectTitle = async (projectId: string) => {
    if (!newProjectTitle.trim()) {
      toast.error('Please enter a new title');
      return;
    }

    try {
      const response = await api.put(`/projects/${projectId}`, {
        title: newProjectTitle
      });

      if (response.success) {
        toast.success('Project title updated successfully!');
        setEditingProject(null);
        setNewProjectTitle('');
        await fetchApplications();
      } else {
        toast.error(response.error?.message || 'Failed to update project title');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update project title');
    }
  };

  const toggleExpand = (appId: string) => {
    setExpandedApp(expandedApp === appId ? null : appId);
  };

  const startEditingTitle = (projectId: string, currentTitle: string) => {
    setEditingProject(projectId);
    setNewProjectTitle(currentTitle);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Loading applications...</p>
        </div>
      </div>
    );
  }

  // Check if any application window is open
  const isAnyWindowOpen = ['IDP', 'UROP', 'CAPSTONE'].some(type => isApplicationOpen(type));

  if (applications.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center -m-8 h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] overflow-hidden bg-transparent">
        <ApplicationEmptyState
          title={isAnyWindowOpen ? "Application Review" : "Applications Closed"}
          subtitle="Student Applications"
          description={isAnyWindowOpen ? "No applications received yet." : "Application window is currently closed."}
          subDescription={isAnyWindowOpen ? "When students apply to your projects, they will appear here for your review." : "No applications can be received while the window is closed."}
          theme="teal"
          icon={FileText}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-900 to-teal-600 dark:from-teal-100 dark:to-teal-300">
            Application Review
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Review and manage student applications for your projects
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="mb-8 p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by project title or student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[160px] bg-transparent border-none focus:ring-0 h-8 text-xs font-medium">
                    <ArrowUpDown className="w-3 h-3 mr-2" />
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="cgpa-high">Highest CGPA</SelectItem>
                    <SelectItem value="cgpa-low">Lowest CGPA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Filter className="w-3 h-3" /> Filters:
            </div>

            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-[180px] h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm">
                <Building2 className="w-3.5 h-3.5 mr-2 text-teal-500" />
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {uniqueDepts.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[240px] h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm">
                <Briefcase className="w-3.5 h-3.5 mr-2 text-teal-500" />
                <SelectValue placeholder="Filter by Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {uniqueProjects.map(proj => (
                  <SelectItem key={proj.id} value={proj.id}>{proj.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchQuery || deptFilter !== 'all' || projectFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setDeptFilter('all');
                  setProjectFilter('all');
                }}
                className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 text-xs h-9"
              >
                Clear all Filters
              </Button>
            )}
          </div>
        </div>

        {/* Pending Applications */}
        <div className="mb-10 space-y-6">
          <div className="flex items-center gap-2">
            <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-200 border-teal-200 text-sm px-3 py-1">
              Pending ({pendingApplications.length})
            </Badge>
          </div>

          {pendingApplications.length === 0 ? (
            <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
              <p className="text-slate-500 text-sm">No pending applications match your filters</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingApplications.map((application) => (
                <Card key={application._id} className="overflow-hidden border-l-4 border-l-teal-500 hover:shadow-md transition-shadow bg-white dark:bg-slate-950">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {application.groupId ? (
                              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                <Users className="w-5 h-5" />
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400">
                                <User className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight">
                                {application.projectId.title}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                <span className="flex items-center gap-1">
                                  {application.groupId ? 'Group' : 'Individual'}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 font-medium text-teal-600 dark:text-teal-400">
                                  {application.department}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Badges Removed for Consistency */}
                          {application.groupId && (
                            <Badge variant="outline" className="h-7 bg-blue-50/50 text-blue-700 border-blue-100">
                              {application.groupId.members.length} Members
                            </Badge>
                          )}
                        </div>

                        <div className="pl-[52px]">
                          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                            "{application.projectId.brief}"
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md">
                              <Search className="w-3 h-3" />
                              <span>Applied <b>{new Date(application.createdAt).toLocaleDateString()}</b></span>
                            </div>
                            {application.specialization && (
                              <div className="flex items-center gap-1.5 text-teal-600 bg-teal-50/50 dark:bg-teal-900/20 px-2 py-1 rounded-md font-medium">
                                <Info className="w-3 h-3" />
                                <span>Spec: {application.specialization}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 min-w-[160px] justify-center pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-6">
                        <Button
                          onClick={() => handleAcceptApplication(application._id, application.projectId._id)}
                          disabled={processingApp === application._id}
                          className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all"
                          size="sm"
                        >
                          {processingApp === application._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" /> Accept</>}
                        </Button>
                        <Button
                          onClick={() => handleRejectApplication(application._id)}
                          disabled={processingApp === application._id}
                          variant="outline"
                          className="w-full text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(application._id)}
                          className="w-full text-slate-400 hover:text-teal-600"
                        >
                          {expandedApp === application._id ? (
                            <span className="flex items-center gap-1 font-medium">Hide Details <ChevronUp className="w-3.5 h-3.5 ml-1" /></span>
                          ) : (
                            <span className="flex items-center gap-1 font-medium">View Details <ChevronDown className="w-3.5 h-3.5 ml-1" /></span>
                          )}
                        </Button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedApp === application._id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                            {application.groupId ? (
                              <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-teal-600" />
                                    <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs">Team Composition</h4>
                                  </div>
                                  <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono border-slate-200">
                                    LEADER: {application.groupId.leaderId.name}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {application.groupId.members.map(member => {
                                    const details = application.groupId?.memberData?.find(d => d.userId === member._id);
                                    const isLeader = member._id === application.groupId?.leaderId._id;

                                    return (
                                      <div key={member._id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between hover:border-teal-100 dark:hover:border-teal-900/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isLeader ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-50' : 'bg-teal-100 text-teal-700'}`}>
                                            {member.name.charAt(0)}
                                          </div>
                                          <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                                              {member.name}
                                              {isLeader && <Badge className="bg-amber-100 text-amber-700 text-[9px] h-4 py-0">LEADER</Badge>}
                                            </p>
                                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                              <Mail className="w-3 h-3" /> {member.email}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">CGPA</p>
                                          <p className="text-sm font-mono font-bold text-teal-600 dark:text-teal-400">
                                            {details?.cgpa?.toFixed(2) || 'N/A'}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                <div className="flex items-center gap-2 px-2">
                                  <User className="w-4 h-4 text-teal-600" />
                                  <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs">Student Information</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="p-4 rounded-xl border border-teal-100/50 dark:border-teal-900/30 bg-teal-50/20 dark:bg-teal-900/10 flex items-center justify-between hover:border-teal-100 dark:hover:border-teal-900/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                                        {application.studentId?.name.charAt(0)}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                                          {application.studentId?.name}
                                        </p>
                                        <p className="text-[11px] text-teal-600/80 flex items-center gap-1 font-normal">
                                          <Mail className="w-3 h-3" /> {application.studentId?.email}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">CGPA</p>
                                      <p className="text-sm font-mono font-bold text-teal-600 dark:text-teal-400">
                                        {application.cgpa?.toFixed(2) || 'N/A'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                                      <Building2 className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Department</p>
                                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        {application.department}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Reviewed Applications */}
        {reviewedApplications.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-slate-600 border-slate-200">
                History ({reviewedApplications.length})
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {reviewedApplications.map((application) => (
                <Card key={application._id} className="opacity-75 hover:opacity-100 transition-opacity bg-white dark:bg-slate-950">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {application.status === 'approved' ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Accepted</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Rejected</Badge>
                        )}
                        <span className="text-xs text-slate-400">
                          {application.reviewedAt ? new Date(application.reviewedAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      {application.status === 'approved' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400 hover:text-teal-600"
                          onClick={() => startEditingTitle(application.projectId._id, application.projectId.title)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {editingProject === application.projectId._id ? (
                        <div className="flex gap-2 items-center">
                          <Input
                            value={newProjectTitle}
                            onChange={(e) => setNewProjectTitle(e.target.value)}
                            className="h-8 text-sm"
                          />
                          <Button size="sm" onClick={() => handleUpdateProjectTitle(application.projectId._id)} className="h-8 bg-teal-600 text-white">Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingProject(null)} className="h-8">Cancel</Button>
                        </div>
                      ) : (
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1 text-sm">
                          {application.projectId.title}
                        </h4>
                      )}

                      <div className="flex items-center justify-between text-xs mt-2">
                        <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          {application.groupId ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {application.groupId ? application.groupId.members.length + ' Students' : application.studentId?.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">CGPA:</span>
                          <span className="font-mono font-bold text-teal-600">{application.cgpa?.toFixed(2) || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
