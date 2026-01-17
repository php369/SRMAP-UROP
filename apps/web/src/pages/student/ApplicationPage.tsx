import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, User, Code, ArrowRight, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { generateGroupCode, formatGroupCode } from '../../utils/codeGenerator';
import { api } from '../../utils/api';
import { toast } from 'sonner';
import { useWindowStatus } from '../../hooks/useWindowStatus';
import { WindowClosedMessage } from '../../components/common/WindowClosedMessage';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import {
  Loader2,
  FileText,
  ChevronRight,
  LayoutGrid,
  UserPlus,
  UserCheck,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Maximize2,
  Minimize2,
  Eye,
  Trash2,
  ExternalLink,
  Info,
  RefreshCw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../../components/ui/dialog';
import { ApplicationEmptyState } from '../faculty/components/ApplicationEmptyState';

interface Project {
  _id: string;
  projectId: string;
  title: string;
  brief: string;
  facultyName: string;
  facultyIdNumber: string;
  prerequisites?: string;
  department: string;
}

export function ApplicationPage() {
  const { user } = useAuth();
  const { isApplicationOpen, loading: windowLoading } = useWindowStatus();
  const [step, setStep] = useState<'choice' | 'group-formation' | 'member-details' | 'member-waiting' | 'application' | 'verify-members'>('choice');
  const [applicationType, setApplicationType] = useState<'solo' | 'group' | null>(null);
  const [groupAction, setGroupAction] = useState<'create' | 'join' | null>(null);
  const [groupCode, setGroupCode] = useState('');
  const [groupId, setGroupId] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [memberDetails, setMemberDetails] = useState<any[]>([]);
  const [isGroupLeader, setIsGroupLeader] = useState(false);
  const [hasSubmittedDetails, setHasSubmittedDetails] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const [existingApplications, setExistingApplications] = useState<any[]>([]);
  const [eligibleProjectType, setEligibleProjectType] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [isProjectListExpanded, setIsProjectListExpanded] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);

  const handleRevokeApplication = async (applicationId: string) => {
    if (!window.confirm('Are you sure you want to revoke this application? This will remove it from the faculty dashboard as well.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.delete<any>(`/applications/${applicationId}`);
      if (response.success) {
        toast.success('Application revoked successfully');
        await fetchExistingApplication();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to revoke application');
    } finally {
      setLoading(false);
    }
  };

  // Check if application window is open
  const canApply = eligibleProjectType ? isApplicationOpen(eligibleProjectType) : false;

  // Form data
  const [formData, setFormData] = useState({
    department: user?.profile?.department || '',
    specialization: '',
    cgpa: 0,
    semester: 1
  });

  useEffect(() => {
    const initializeEligibility = async () => {
      await checkEligibility();
    };
    initializeEligibility();
  }, [user?.role]); // Re-run when user role becomes available

  useEffect(() => {
    if (eligibleProjectType) {
      const initializeData = async () => {
        setInitializing(true);
        try {
          await Promise.all([
            fetchProjects(),
            fetchExistingGroup(),
            fetchExistingApplication()
          ]);
        } catch (error) {
          console.error('Error initializing application data:', error);
        } finally {
          setInitializing(false);
        }
      };

      initializeData();
    }
  }, [eligibleProjectType]);

  // Determine initial step based on user's current state
  useEffect(() => {
    if (!initializing && groupId && groupMembers.length > 0) {
      if (isGroupLeader) {
        // Leader can go to application form
        if (step === 'choice') {
          setStep('application');
          setApplicationType('group');
        }
      } else {
        // Member logic - check if they have submitted details
        if (step === 'choice' || step === 'member-details') {
          if (hasSubmittedDetails) {
            setStep('member-waiting');
            setApplicationType('group');
          } else {
            setStep('member-details');
            setApplicationType('group');
          }
        }
      }
    }
  }, [initializing, groupId, groupMembers, isGroupLeader, hasSubmittedDetails, step]);

  const checkEligibility = async () => {
    try {
      // Wait for user data to be available
      if (!user?.role) {
        console.log('Waiting for user data...');
        return;
      }

      // Map role to project type
      const roleToProjectType: Record<string, string> = {
        'idp-student': 'IDP',
        'urop-student': 'UROP',
        'capstone-student': 'CAPSTONE'
      };

      const projectType = roleToProjectType[user.role];

      if (projectType) {
        setEligibleProjectType(projectType);
        console.log(`✅ User eligible for ${projectType} based on role: ${user.role}`);
      } else {
        toast.error('You are not eligible for any project type. Please contact admin.');
        console.error(`❌ Unknown role: ${user.role}`);
        setInitializing(false); // Stop loading if user is not eligible
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setInitializing(false);
    }
  };

  const fetchExistingGroup = async () => {
    try {
      const response = await api.get('/groups/my-group');
      if (response.success && response.data) {
        const group = response.data as any;
        setGroupCode(group.groupCode);
        setGroupId(group._id);
        // Ensure members are properly set - the API should populate this
        const members = group.members || [];
        setGroupMembers(members);

        // Check if current user is the group leader
        const isLeader = group.leaderId?._id === user?.id || group.leaderId === user?.id;
        setIsGroupLeader(isLeader);

        console.log('Group fetched:', {
          groupCode: group.groupCode,
          memberCount: members.length,
          isLeader
        });

        // Fetch member details if in a group
        if (group._id) {
          await fetchMemberDetails(group._id);
        }
      }
    } catch (error) {
      // No existing group, that's fine
      console.log('No existing group found');
    }
  };

  const fetchMemberDetails = async (groupId: string) => {
    try {
      console.log('Fetching member details for group:', groupId);
      const response = await api.get(`/groups/${groupId}/member-details`);
      console.log('Member details fetch response:', response);

      if (response.success && response.data) {
        const details = response.data as any[];
        setMemberDetails(details);

        // Check if current user has submitted details - try multiple ID comparison methods
        const currentUserId = user?.id;
        console.log('Current user ID:', currentUserId);
        console.log('Details user IDs:', details.map(d => ({
          userId: d.userId,
          userIdId: d.userId?._id,
          userIdString: d.userId?.toString?.(),
          department: d.department
        })));

        const userDetails = details.find(d => {
          const detailUserId = d.userId?._id || d.userId;
          const detailUserIdString = typeof detailUserId === 'string' ? detailUserId : (detailUserId as any)?.toString?.();
          const currentUserIdString = typeof currentUserId === 'string' ? currentUserId : (currentUserId as any)?.toString?.();

          return detailUserIdString === currentUserIdString;
        });

        setHasSubmittedDetails(!!userDetails);

        console.log('Member details fetched:', {
          detailsCount: details.length,
          hasSubmittedDetails: !!userDetails,
          userDetails: userDetails,
          currentUserId: currentUserId
        });
      } else {
        console.log('No member details in response or unsuccessful response');
        setMemberDetails([]);
        setHasSubmittedDetails(false);
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
      setMemberDetails([]);
      setHasSubmittedDetails(false);
    }
  };

  const submitMemberDetails = async (department: string, specialization: string, cgpa: string, isLeaderSubmission = false) => {
    if (!groupId) {
      toast.error('No group found');
      return false;
    }

    const wasLoading = loading;
    if (!wasLoading) setLoading(true);

    try {
      console.log('Submitting member details:', {
        groupId,
        department,
        specialization,
        cgpa,
        isLeaderSubmission,
        userId: user?.id
      });

      const response = await api.post(`/groups/${groupId}/member-details`, {
        department: department.trim(),
        specialization: specialization?.trim() || '',
        cgpa: cgpa
      });

      console.log('Member details response:', response);

      if (response.success) {
        if (!isLeaderSubmission) {
          toast.success('Details submitted successfully!');
        }
        setHasSubmittedDetails(true);
        await fetchMemberDetails(groupId);
        return true;
      } else {
        console.error('Failed to submit details:', response.error);
        if (!isLeaderSubmission) {
          toast.error(response.error?.message || 'Failed to submit details');
        }
        return false;
      }
    } catch (error: any) {
      console.error('Error submitting member details:', error);
      if (!isLeaderSubmission) {
        toast.error(error.message || 'Failed to submit details');
      }
      return false;
    } finally {
      if (!wasLoading) setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupId) return;

    if (!confirm('Are you sure you want to leave this group? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/groups/${groupId}/leave`);
      if (response.success) {
        setGroupCode('');
        setGroupId('');
        setGroupMembers([]);
        setMemberDetails([]);
        setIsGroupLeader(false);
        setHasSubmittedDetails(false);
        toast.success('Left group successfully!');
        setStep('choice');
      } else {
        toast.error(response.error?.message || 'Failed to leave group');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave group');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!groupId) return;

    if (!confirm('Are you sure you want to remove this member from the group?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/groups/${groupId}/remove-member-enhanced`, {
        memberId
      });
      if (response.success) {
        toast.success('Member removed successfully!');
        await fetchExistingGroup();
      } else {
        toast.error(response.error?.message || 'Failed to remove member');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingApplication = async () => {
    try {
      console.log('🔍 Fetching existing applications...');
      const response = await api.get('/applications/my-application');
      console.log('📋 Application response:', response);

      if (response.success && response.data) {
        const apps = Array.isArray(response.data) ? response.data : [response.data];
        console.log('📝 Raw applications:', apps);

        // Show all applications (pending, approved, rejected) so students can see all statuses
        const allApps = apps.filter((app: any) => ['pending', 'approved', 'rejected'].includes(app.status));
        console.log('✅ Filtered applications:', allApps);

        setExistingApplications(allApps);

        if (allApps.length > 0) {
          console.log('🎯 Found existing applications, showing application status view');
        }
      } else {
        console.log('❌ No application data in response');
        setExistingApplications([]);
      }
    } catch (error: any) {
      console.log('⚠️ Error fetching applications:', error);
      if (error.response?.status !== 404) {
        console.error('Unexpected error:', error);
      }
      setExistingApplications([]);
    }
  };

  // Refetch application when group changes or on initial load
  useEffect(() => {
    fetchExistingApplication();
  }, [groupId]);

  // Periodically refresh application status to catch updates from faculty
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing application status...');
      fetchExistingApplication();
    }, 15000); // Refresh every 15 seconds to catch status updates faster

    return () => clearInterval(interval);
  }, []);

  // Auto-refresh group data when on group formation or verification step
  useEffect(() => {
    if ((step === 'group-formation' || step === 'verify-members') && groupId) {
      const interval = setInterval(() => {
        fetchExistingGroup();
      }, 3000); // Refresh every 3 seconds

      return () => clearInterval(interval);
    }
  }, [step, groupId]);

  // Auto-refresh member details when on member waiting or verification step
  useEffect(() => {
    if ((step === 'member-waiting' || step === 'verify-members') && groupId) {
      const interval = setInterval(() => {
        console.log('Auto-refreshing member details...');
        fetchMemberDetails(groupId);
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [step, groupId]);

  // Fetch member details immediately when entering verification step
  useEffect(() => {
    if (step === 'verify-members' && groupId) {
      console.log('Entering verification step, fetching member details...');
      fetchMemberDetails(groupId);
    }
  }, [step, groupId]);



  const fetchProjects = async () => {
    if (!eligibleProjectType) return;

    try {
      const response = await api.get('/projects/public', { type: eligibleProjectType });
      if (response.success && response.data) {
        // Filter projects by eligible type
        const filteredProjects = (response.data as any[]).filter(
          (project: any) => project.type === eligibleProjectType
        );
        setProjects(filteredProjects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleChoiceSelection = (type: 'solo' | 'group') => {
    setApplicationType(type);
    if (type === 'solo') {
      setStep('application');
    } else {
      // Check if user is already in a group
      if (groupId) {
        if (isGroupLeader) {
          setStep('application');
        } else if (hasSubmittedDetails) {
          setStep('member-waiting');
        } else {
          setStep('member-details');
        }
      } else {
        setStep('group-formation');
      }
    }
  };

  const handleCreateGroup = async () => {
    if (!eligibleProjectType) {
      toast.error('Unable to determine your project eligibility');
      return;
    }

    setLoading(true);
    try {
      const code = generateGroupCode();
      const response = await api.post('/groups', {
        projectType: eligibleProjectType,
        semester: 'Fall 2025',
        year: 2025,
        groupName: `Group ${code}`
      });

      if (response.success && response.data) {
        const createdGroup = response.data as any;
        setGroupCode(createdGroup.groupCode);
        setGroupId(createdGroup._id);
        setGroupMembers(createdGroup.members || [user]);
        setIsGroupLeader(true);
        toast.success('Group created successfully!');

        // Refetch the group to ensure we have the latest data
        await fetchExistingGroup();

        // Don't automatically redirect - let leader see the code first
        // They can manually click "Continue to Application"
      } else {
        toast.error(response.error?.message || 'Failed to create group');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupId) return;

    if (!confirm('Are you sure you want to delete this group? This action cannot be undone. All members will be removed from the group.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.delete(`/groups/${groupId}`);
      if (response.success) {
        // Reset all group-related state
        setGroupCode('');
        setGroupId('');
        setGroupMembers([]);
        setMemberDetails([]);
        setIsGroupLeader(false);
        setHasSubmittedDetails(false);
        setApplicationType(null);
        setSelectedProjects([]);

        toast.success('Group deleted successfully! All members have been removed.');
        setStep('choice');
      } else {
        toast.error(response.error?.message || 'Failed to delete group');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!inputCode || inputCode.length !== 6) {
      toast.error('Please enter a valid 6-character code');
      return;
    }

    if (!eligibleProjectType) {
      toast.error('Unable to determine your project eligibility');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/groups/join', {
        groupCode: inputCode.toUpperCase(),
        semester: 'Fall 2025',
        year: 2025,
        projectType: eligibleProjectType
      });

      if (response.success) {
        toast.success('Joined group successfully!');
        // Refetch group data to get updated members
        await fetchExistingGroup();
        // Fetch the group's application if it exists
        await fetchExistingApplication();
        // For members, go to member details submission
        setStep('member-details');
      } else {
        toast.error(response.error?.message || 'Failed to join group');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelection = (projectId: string) => {
    if (selectedProjects.includes(projectId)) {
      setSelectedProjects(selectedProjects.filter(id => id !== projectId));
    } else if (selectedProjects.length < 3) {
      setSelectedProjects([...selectedProjects, projectId]);
    } else {
      toast.error('You can select up to 3 projects only');
    }
  };

  const handleProceedToVerification = async () => {
    if (selectedProjects.length === 0) {
      toast.error('Please select at least one project');
      return;
    }

    if (!formData.department || !formData.cgpa) {
      toast.error('Please fill all required fields (Department and CGPA)');
      return;
    }

    // For group applications, go to verification step
    if (applicationType === 'group' && isGroupLeader) {
      // First, save the leader's details as member details
      setLoading(true);
      try {
        console.log('Saving leader details before verification:', {
          department: formData.department,
          specialization: formData.specialization,
          cgpa: formData.cgpa
        });

        const success = await submitMemberDetails(formData.department, formData.specialization, formData.cgpa.toString(), true);
        if (success) {
          console.log('Leader details saved successfully');
          // Refresh member details to include the leader's data
          await fetchMemberDetails(groupId);
          setStep('verify-members');
        } else {
          toast.error('Failed to save your details. Please try again.');
        }
      } catch (error) {
        console.error('Error saving leader details:', error);
        toast.error('Failed to save your details. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (applicationType === 'group') {
      // For non-leaders in group applications
      setStep('verify-members');
    } else {
      // For solo applications, submit directly
      handleSubmitApplication();
    }
  };

  const handleSubmitApplication = async () => {
    setLoading(true);
    try {
      if (!eligibleProjectType) {
        toast.error('Unable to determine your project eligibility');
        setLoading(false);
        return;
      }

      console.log('Submitting application:', {
        projectType: eligibleProjectType,
        selectedProjects,
        department: formData.department,
        isGroupApplication: applicationType === 'group'
      });

      // Use the api utility which handles base URL correctly
      const response = await api.post('/applications', {
        projectType: eligibleProjectType,
        selectedProjects: selectedProjects,
        department: formData.department,
        stream: formData.department, // Use department as stream
        specialization: formData.specialization || '',
        cgpa: formData.cgpa || 0,
        semester: formData.semester || 1,
        isGroupApplication: applicationType === 'group'
      });

      if (response.success) {
        const applications = Array.isArray(response.data) ? response.data : [response.data];
        toast.success(`${applications.length} application(s) submitted successfully!`);
        setExistingApplications(applications);
      } else {
        const errorMessage = response.error?.message || 'Failed to submit application';
        if (errorMessage.includes('already exists')) {
          toast.error('You have already submitted an application. Refreshing...');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error: any) {
      console.error('Application submission error:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  // Show existing applications if they exist
  console.log('🔍 ApplicationPage: Checking existing applications:', existingApplications);
  if (existingApplications.length > 0) {
    console.log('✅ ApplicationPage: Showing existing applications view');
    return (
      <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col"
        >
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-900 to-teal-600 dark:from-teal-100 dark:to-teal-300">
                Your Applications
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {canApply
                  ? 'Track the status of your project applications'
                  : 'Showing approved applications (application window is closed)'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={fetchExistingApplication}
                disabled={loading}
                className="group text-slate-600 hover:text-teal-600 border-slate-200 bg-white dark:bg-slate-900 shadow-sm transition-all"
              >
                <motion.div
                  className="flex items-center"
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={loading ? { rotate: 360 } : { rotate: 0 }}
                    transition={loading ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0.2 }}
                    className="mr-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.div>
                  Refresh
                </motion.div>
              </Button>
              {eligibleProjectType && (
                <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-200 border-teal-200 px-3 py-1.5 text-sm">
                  Eligible for {eligibleProjectType}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {existingApplications
              .filter((application: any) => {
                // If window is open, show all applications (pending, approved, rejected)
                if (canApply) return true;
                // If window is closed, show approved applications (so students can see their approved projects)
                return application.status === 'approved';
              })
              .map((application: any) => (
                <Card key={application._id} className="h-full flex flex-col border-l-4 border-l-teal-500 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {application.groupId ? (
                          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                            <Users className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {application.groupId ? 'Group' : 'Solo'}
                        </span>
                      </div>
                      <Badge variant={
                        application.status === 'approved' ? 'success' :
                          application.status === 'rejected' ? 'error' : 'secondary'
                      } className={
                        application.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' :
                          application.status === 'rejected' ? 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200' :
                            'bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4 text-lg line-clamp-1 leading-tight">
                      {application.projectId?.title || 'Project Title'}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[2.5em]">
                      {application.projectId?.brief}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow pt-0">
                    <div className="space-y-3 text-sm mt-4">
                      <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                        <span className="text-slate-500">Department</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{application.department}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                        <span className="text-slate-500">Submitted</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {new Date(application.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {application.reviewedAt && (
                        <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                          <span className="text-slate-500">Reviewed</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {new Date(application.reviewedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-slate-50/50 dark:bg-slate-900/50 pt-4 flex flex-col gap-3">
                    {application.status === 'approved' && application.projectId?.facultyName ? (
                      <div className="w-full flex items-center gap-2 p-2 bg-green-50/50 border border-green-100 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-green-700 font-medium">Assigned Faculty</p>
                          <p className="text-sm text-green-900 truncate font-semibold">{application.projectId.facultyName}</p>
                        </div>
                      </div>
                    ) : application.status === 'pending' ? (
                      <div className="w-full flex items-center gap-2 p-2 bg-amber-50/50 border border-amber-100 rounded-lg">
                        <Info className="w-4 h-4 text-amber-600" />
                        <p className="text-xs text-amber-700 font-medium italic">Pending faculty review...</p>
                      </div>
                    ) : (
                      <div className="w-full flex items-center gap-2 p-2 bg-red-50/50 border border-red-100 rounded-lg">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <p className="text-xs text-red-700 font-medium italic">Application was rejected</p>
                      </div>
                    )}

                    <div className="w-full grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs font-medium"
                        onClick={() => setSelectedApplication(application)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                      </Button>
                      {application.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border-slate-200"
                          onClick={() => handleRevokeApplication(application._id)}
                          disabled={loading}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Revoke
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
          </div>

          {/* Modal for viewing application details */}
          <Dialog open={!!selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)}>
            <DialogContent className="max-w-2xl overflow-hidden p-0 border-teal-200 dark:border-teal-800">
              {selectedApplication && (
                <>
                  <div className="bg-teal-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <DialogTitle className="text-xl font-bold text-white">Application Details</DialogTitle>
                        <DialogDescription className="text-teal-100">
                          Submitted on {new Date(selectedApplication.createdAt).toLocaleDateString()}
                        </DialogDescription>
                      </div>
                    </div>
                    <Badge className={`
                      px-3 py-1 text-xs font-bold uppercase
                      ${selectedApplication.status === 'approved' ? 'bg-green-500 text-white' :
                        selectedApplication.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}
                    `}>
                      {selectedApplication.status}
                    </Badge>
                  </div>

                  <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {/* Project Section */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4" /> Project Information
                      </h4>
                      <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                          {selectedApplication.projectId?.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed">
                          {selectedApplication.projectId?.brief}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-100">
                            {selectedApplication.projectId?.facultyName}
                          </Badge>
                          <Badge variant="outline">
                            {selectedApplication.projectId?.department}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Applicant Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase">Application Type</p>
                        <p className="text-sm font-medium flex items-center gap-2">
                          {selectedApplication.groupId ? (
                            <><Users className="w-4 h-4 text-blue-500" /> Group Application</>
                          ) : (
                            <><User className="w-4 h-4 text-teal-500" /> Solo Application</>
                          )}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase">Department</p>
                        <p className="text-sm font-medium">{selectedApplication.department}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase">Specialization</p>
                        <p className="text-sm font-medium">{selectedApplication.specialization || 'Not specified'}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase">CGPA on Submission</p>
                        <p className="text-sm font-medium">{selectedApplication.cgpa || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Rejection Reason if any */}
                    {selectedApplication.status === 'rejected' && selectedApplication.metadata?.rejectionReason && (
                      <div className="p-4 rounded-xl bg-red-50 border border-red-100 dark:bg-red-900/10 dark:border-red-900/20">
                        <h4 className="text-sm font-bold text-red-900 dark:text-red-400 mb-1 flex items-center gap-2">
                          <Info className="w-4 h-4" /> Rejection Reason
                        </h4>
                        <p className="text-sm text-red-800 dark:text-red-300 italic">
                          "{selectedApplication.metadata.rejectionReason}"
                        </p>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                    {selectedApplication.status === 'pending' && (
                      <Button
                        variant="destructive"
                        className="mr-auto"
                        onClick={() => {
                          handleRevokeApplication(selectedApplication._id);
                          setSelectedApplication(null);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Revoke Application
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                      Close
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </motion.div >
      </div >
    );
  }

  // Show loading state while initializing
  console.log('🔄 ApplicationPage: Loading state check:', { initializing, windowLoading, eligibleProjectType, existingApplicationsLength: existingApplications.length });

  if (initializing || windowLoading || !eligibleProjectType) {
    console.log('⏳ ApplicationPage: Showing loading state');
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Loading application data...</p>
        </div>
      </div>
    );
  }

  // Check if window is open - but only show closed message if no existing applications OR no approved applications
  const hasApprovedApplications = existingApplications.some((app: any) => app.status === 'approved');
  console.log('🪟 ApplicationPage: Window check:', {
    eligibleProjectType,
    canApply,
    existingApplicationsLength: existingApplications.length,
    hasApprovedApplications
  });

  if (eligibleProjectType && !canApply && existingApplications.length === 0) {
    console.log('🚫 ApplicationPage: Window closed and no existing applications, showing closed message');
    return (
      <div className="w-full flex flex-col items-center justify-center -m-8 h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] overflow-hidden bg-transparent">
        <ApplicationEmptyState
          title="Applications Closed"
          subtitle={`${eligibleProjectType} Applications`}
          description="The application window is currently closed."
          subDescription="Please wait for the window to open. Come back later."
          theme="teal"
          icon={FileText}
        />
      </div>
    );
  }

  console.log('🎯 ApplicationPage: Showing main application interface');

  // Steps definition for progress indicator
  const steps = [
    { id: 'choice', label: 'Type' },
    { id: 'group-formation', label: 'Team' },
    { id: 'member-details', label: 'Details' },
    { id: 'member-waiting', label: 'Status' },
    { id: 'application', label: 'Form' },
    { id: 'verify-members', label: 'Review' }
  ];

  const getCurrentStepIndex = () => {
    switch (step) {
      case 'choice': return 0;
      case 'group-formation': return 1;
      case 'member-details': return 2;
      case 'member-waiting': return 3;
      case 'application': return 4;
      case 'verify-members': return 5;
      default: return 0;
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-900 to-teal-600 dark:from-teal-100 dark:to-teal-300">
              Project Application
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Apply for your preferred {eligibleProjectType} projects
            </p>
          </div>
          {eligibleProjectType && (
            <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-200 border-teal-200 px-4 py-1.5 text-sm h-auto self-start md:self-auto">
              Eligible for {eligibleProjectType}
            </Badge>
          )}
        </motion.div>

        {/* Custom Progress Stepper */}
        {!groupId && step === 'choice' ? null : (
          <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm mb-8 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[300px]">
              {steps.map((s, idx) => {
                // Simplified visible steps for cleaner UI
                // Only show relevant steps based on flow (Group vs Solo)
                const showStep = applicationType === 'solo'
                  ? ['choice', 'application'].includes(s.id)
                  : true; // Show all for group for now, or refine

                if (!showStep) return null;

                const isCompleted = getCurrentStepIndex() > idx;
                const isCurrent = getCurrentStepIndex() === idx;

                return (
                  <div key={s.id} className="flex items-center flex-1 last:flex-none">
                    <div className={`flex items-center gap-2 ${isCurrent ? 'text-teal-600 font-bold' : isCompleted ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-colors
                         ${isCurrent ? 'border-teal-600 bg-teal-50 text-teal-600' :
                          isCompleted ? 'border-teal-500 bg-teal-500 text-white' :
                            'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'}`}>
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className="hidden sm:inline">{s.label}</span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-4 transition-colors ${isCompleted ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: Choice */}
        {step === 'choice' && !groupId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-6"
          >
            <Card
              className="cursor-pointer hover:border-teal-500 hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
              onClick={() => handleChoiceSelection('solo')}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <User className="w-24 h-24 text-teal-600" />
              </div>
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <User className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl">Solo Application</CardTitle>
                <CardDescription>Work independently on your project</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-500" /> Direct submission</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-500" /> Independent grading</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-500" /> Faster process</li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-teal-500 hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
              onClick={() => handleChoiceSelection('group')}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-24 h-24 text-teal-600" />
              </div>
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl">Group Application</CardTitle>
                <CardDescription>Collaborate with 2-4 team members</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> Team collaboration</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> Shared responsibility</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> Complex projects</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 1.5: Landing Page for Existing Group Members */}
        {step === 'choice' && groupId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-teal-200 dark:border-teal-800 shadow-md">
              <CardHeader className="bg-teal-50/50 dark:bg-teal-900/10 border-b border-teal-100 dark:border-teal-800/50 pb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-teal-900 dark:text-teal-100">You're in a Group!</CardTitle>
                    <CardDescription>
                      You are currently part of an active group.
                    </CardDescription>
                  </div>
                  <Badge variant={isGroupLeader ? 'default' : 'secondary'} className={isGroupLeader ? "bg-teal-600" : ""}>
                    {isGroupLeader ? 'Group Leader' : 'Member'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="mb-8 p-6 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-100 text-teal-600 rounded-lg">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Group Code</p>
                      <p className="text-3xl font-mono font-bold text-slate-900 dark:text-slate-100 tracking-widest">
                        {formatGroupCode(groupCode)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    Team Members <Badge variant="outline">{groupMembers.length}</Badge>
                  </h3>
                  <div className="grid gap-3">
                    {groupMembers.map((member: any, index: number) => (
                      <div key={member._id || index} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-800 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 font-bold border border-slate-200 dark:border-slate-700">
                            {member.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              {member.name || 'Unknown'}
                              {member._id === user?.id && <Badge variant="secondary" className="text-xs h-5">You</Badge>}
                              {isGroupLeader && member._id === user?.id && <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 text-xs h-5">Leader</Badge>}
                            </p>
                            <p className="text-sm text-slate-500">{member.email || 'No email'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 dark:bg-slate-900/50 p-6 flex gap-4">
                {!isGroupLeader && (
                  <Button
                    variant="destructive"
                    onClick={handleLeaveGroup}
                    disabled={loading}
                    className="h-12 px-6"
                  >
                    Leave Group
                  </Button>
                )}
                {isGroupLeader && (
                  <Button
                    variant="destructive"
                    onClick={handleDeleteGroup}
                    disabled={loading}
                    className="h-12 px-6"
                  >
                    Delete Group
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (isGroupLeader) {
                      setStep('application');
                    } else if (hasSubmittedDetails) {
                      setStep('member-waiting');
                    } else {
                      setStep('member-details');
                    }
                    setApplicationType('group');
                  }}
                  className="flex-1 h-12 text-lg bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-200 dark:shadow-none"
                >
                  Continue Application <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Group Formation */}
        {step === 'group-formation' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            {!groupAction ? (
              <div className="grid md:grid-cols-2 gap-6">
                <Card
                  className="cursor-pointer hover:border-teal-500 hover:shadow-lg transition-all duration-300 text-center py-8"
                  onClick={() => setGroupAction('create')}
                >
                  <CardContent className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-teal-50 rounded-full text-teal-600">
                      <UserPlus className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create Group</h3>
                      <p className="text-sm text-slate-500 mt-2">Generate a unique code and invite others</p>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all duration-300 text-center py-8"
                  onClick={() => setGroupAction('join')}
                >
                  <CardContent className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-blue-50 rounded-full text-blue-600">
                      <Users className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Join Group</h3>
                      <p className="text-sm text-slate-500 mt-2">Enter a code to join an existing team</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-teal-200 dark:border-teal-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-center text-2xl">
                    {groupAction === 'create' ? 'Create New Group' : 'Join Existing Group'}
                  </CardTitle>
                  <CardDescription className="text-center">
                    {groupAction === 'create' ? 'Get your team started' : 'Enter the code shared by your leader'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {groupAction === 'create' && (
                    <div className="text-center space-y-6">
                      {!groupCode ? (
                        <div className="py-8">
                          <Button
                            onClick={handleCreateGroup}
                            disabled={loading}
                            size="lg"
                            className="bg-teal-600 hover:bg-teal-700 text-white min-w-[200px]"
                          >
                            {loading ? <Loader2 className="animate-spin mr-2" /> : 'Generate Group Code'}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                          <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <p className="text-sm text-slate-500 mb-2 uppercase tracking-wide">Your Group Code</p>
                            <p className="text-4xl font-mono font-bold text-teal-600 tracking-[0.2em]">{formatGroupCode(groupCode)}</p>
                          </div>
                          <p className="text-sm text-slate-600">
                            Share this code with your team members (2-4 members total)
                          </p>
                          <div className="flex gap-4 justify-center pt-4">
                            <Button variant="ghost" onClick={handleDeleteGroup} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                              Cancel
                            </Button>
                            <Button onClick={() => setStep('application')} className="bg-teal-600 hover:bg-teal-700 text-white">
                              Continue <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {groupAction === 'join' && (
                    <div className="max-w-sm mx-auto space-y-4">
                      <div className="space-y-2">
                        <Label className="text-center block">Enter 6-Character Code</Label>
                        <Input
                          type="text"
                          value={inputCode}
                          onChange={(e) => {
                            const rawValue = e.target.value;
                            const cleanValue = rawValue.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6);
                            setInputCode(cleanValue);
                          }}
                          maxLength={6}
                          placeholder="ABC123"
                          className="text-center text-3xl font-mono tracking-widest h-16 uppercase"
                        />
                      </div>
                      <Button
                        onClick={handleJoinGroup}
                        disabled={loading || inputCode.length !== 6}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : 'Join Group'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setGroupAction(null)}
                        className="w-full"
                      >
                        Back
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Back Button for Choice Step */}
            {!groupCode && !groupAction && (
              <div className="mt-6 text-center">
                <Button variant="link" onClick={() => setStep('choice')} className="text-slate-500">
                  Back to specifiction choice
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Member Details Submission */}
        {step === 'member-details' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="border-teal-200 dark:border-teal-800 shadow-xl">
              <CardHeader className="bg-teal-50/50 dark:bg-teal-900/10 border-b border-teal-100 dark:border-teal-800/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-100 text-teal-600 rounded-full">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle>Additional Details</CardTitle>
                    <CardDescription>We need some academic info to proceed</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                {groupCode && (
                  <div className="mb-6 flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <span className="text-sm text-slate-500">Group Code</span>
                    <span className="font-mono font-bold text-teal-600">{formatGroupCode(groupCode)}</span>
                  </div>
                )}

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const department = formData.get('department') as string;
                  const specialization = formData.get('specialization') as string;
                  const cgpa = formData.get('cgpa') as string;

                  if (await submitMemberDetails(department, specialization, cgpa)) {
                    setStep('member-waiting');
                  }
                }} className="space-y-6">

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Department <span className="text-red-500">*</span></Label>
                      <Input
                        name="department"
                        required
                        placeholder="e.g. Computer Science"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>CGPA <span className="text-red-500">*</span></Label>
                      <Input
                        name="cgpa"
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        required
                        placeholder="e.g. 9.5"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Specialization (Optional)</Label>
                    <Input
                      name="specialization"
                      placeholder="e.g. AI/ML, Data Science"
                      className="h-11"
                    />
                  </div>

                  <div className="pt-4 flex gap-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleLeaveGroup}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      Leave Group
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="animate-spin mr-2" /> : 'Submit Details'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Member Waiting */}
        {step === 'member-waiting' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-3xl mx-auto"
          >
            <Card className="border-teal-200 dark:border-teal-800 shadow-xl overflow-hidden">
              <div className="bg-teal-600 p-8 text-center text-white">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold">You're All Set!</h2>
                <p className="text-teal-100 mt-2 max-w-md mx-auto">
                  Your details have been submitted. Your group leader is now selecting projects and finalizing the application.
                </p>
              </div>

              <CardContent className="p-8">
                <div className="mb-8">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-slate-400" />
                    Available Projects
                  </h3>

                  <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2">
                    {projects.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                        <p className="text-slate-500">No projects listed yet.</p>
                      </div>
                    ) : (
                      projects.map(project => (
                        <div key={project._id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">{project.title}</h4>
                          <p className="text-sm text-slate-500 mb-3">{project.brief}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline" className="bg-white">
                              {project.facultyName}
                            </Badge>
                            <Badge variant="secondary">
                              {project.department}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-6">
                  <Button variant="ghost" onClick={handleLeaveGroup} className="text-red-500 hover:text-red-600">
                    Leave Group
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    <Loader2 className="w-4 h-4 mr-2" /> Refresh Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 5: Application Form */}
        {step === 'application' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="border-teal-200 dark:border-teal-800 shadow-xl overflow-hidden">
              <div className="bg-teal-600 p-6 text-white flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <h2 className="text-xl font-bold font-display">Application Form</h2>
                    <p className="text-teal-100 text-sm">Select projects and submit</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {applicationType === 'solo' && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep('choice');
                        setApplicationType(null);
                      }}
                      className="h-10 px-4 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                    >
                      Back
                    </Button>
                  )}
                  {applicationType === 'group' && !isGroupLeader && (
                    <Button
                      variant="outline"
                      onClick={() => setStep('member-waiting')}
                      className="h-10 px-4 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                    >
                      Back
                    </Button>
                  )}
                  {(applicationType === 'solo' || (applicationType === 'group' && isGroupLeader)) && (
                    <Button
                      onClick={handleProceedToVerification}
                      disabled={loading || selectedProjects.length === 0}
                      className={`
                        h-10 px-6 font-bold shadow-lg transition-all
                        ${selectedProjects.length > 0
                          ? 'bg-white text-teal-600 hover:bg-teal-50'
                          : 'bg-white/10 text-white/50 cursor-not-allowed border-white/10'}
                      `}
                    >
                      {loading ? <Loader2 className="animate-spin mr-2" /> : applicationType === 'group' ? 'Review & Submit' : 'Submit Now'}
                    </Button>
                  )}
                  {applicationType === 'group' && isGroupLeader && (
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 hidden md:flex">
                      Group Leader
                    </Badge>
                  )}
                </div>
              </div>

              <CardContent className="p-8 space-y-8">
                {/* Access Warning for Non-Leaders */}
                {applicationType === 'group' && !isGroupLeader && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-4">
                    <div className="p-2 bg-red-100 rounded-full text-red-600">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-red-900">Access Restricted</h3>
                      <p className="text-sm text-red-800 mt-1">
                        Only the group leader can fill out and submit the application form. Please wait for your leader to complete this step.
                      </p>
                    </div>
                  </div>
                )}

                {/* Main Form Content */}
                {(applicationType === 'solo' || (applicationType === 'group' && isGroupLeader)) && (
                  <>
                    {applicationType === 'group' && (
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Group Application
                          </h3>
                          <p className="text-sm text-blue-800">
                            You are submitting on behalf of your group. Members' details will be automatically included.
                          </p>
                        </div>
                        {groupCode && (
                          <div className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Group Code</p>
                              <p className="text-xl font-mono font-bold text-slate-900">{formatGroupCode(groupCode)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500 mb-1">Members</p>
                              <Badge variant="secondary">{groupMembers.length}/4</Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Department <span className="text-red-500">*</span></Label>
                          <Input
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            placeholder="e.g. Computer Science"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Specialization (Optional)</Label>
                          <Input
                            value={formData.specialization}
                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                            placeholder="e.g. AI/ML"
                          />
                        </div>

                        {applicationType === 'solo' && (
                          <div className="space-y-2">
                            <Label>CGPA <span className="text-red-500">*</span></Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="10"
                              value={formData.cgpa || ''}
                              onChange={(e) => setFormData({ ...formData, cgpa: parseFloat(e.target.value) })}
                              placeholder="e.g. 9.5"
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                              Select Projects <Badge variant={selectedProjects.length > 0 ? 'default' : 'secondary'} className={selectedProjects.length > 0 ? 'bg-teal-600' : ''}>{selectedProjects.length}/3</Badge>
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsProjectListExpanded(!isProjectListExpanded)}
                              className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 h-8"
                            >
                              {isProjectListExpanded ? (
                                <><Minimize2 className="w-4 h-4 mr-2" /> Compact View</>
                              ) : (
                                <><Maximize2 className="w-4 h-4 mr-2" /> Expand View</>
                              )}
                            </Button>
                          </div>
                          <span className="text-sm text-slate-500 hidden sm:inline">Select up to 3 projects in order of preference</span>
                        </div>

                        <div
                          className={`grid gap-4 overflow-y-auto pr-2 custom-scrollbar transition-all duration-300 ${isProjectListExpanded ? 'max-h-[800px]' : 'max-h-[500px]'
                            }`}
                          data-lenis-prevent
                        >
                          {projects.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                              <p className="text-slate-500">No projects available for selection yet.</p>
                            </div>
                          ) : (
                            projects.map(project => {
                              const isSelected = selectedProjects.includes(project._id);
                              const selectionIndex = selectedProjects.indexOf(project._id) + 1;

                              return (
                                <div
                                  key={project._id}
                                  onClick={() => handleProjectSelection(project._id)}
                                  className={`
                                        relative p-6 rounded-xl border-2 transition-all cursor-pointer group
                                        ${isSelected
                                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/10 shadow-md'
                                      : 'border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-white dark:hover:bg-slate-900'
                                    }
                                      `}
                                >
                                  <div className="flex items-start gap-4">
                                    <div className={`
                                            w-6 h-6 rounded-full flex items-center justify-center border transition-colors flex-shrink-0 mt-1
                                            ${isSelected ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-300 bg-white dark:bg-slate-800 text-transparent group-hover:border-teal-400'}
                                          `}>
                                      {isSelected ? <CheckCircle className="w-4 h-4" /> : null}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-start justify-between gap-4">
                                        <div>
                                          <h4 className={`font-bold text-lg mb-1 ${isSelected ? 'text-teal-900 dark:text-teal-100' : 'text-slate-900 dark:text-slate-100'}`}>
                                            {project.title}
                                          </h4>
                                          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-3">
                                            {project.brief}
                                          </p>

                                          {project.prerequisites && (
                                            <div className="mb-3 text-xs bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 p-2 rounded text-amber-900 dark:text-amber-100">
                                              <span className="font-bold">Prerequisites: </span>
                                              {project.prerequisites}
                                            </div>
                                          )}
                                        </div>
                                        {isSelected && (
                                          <Badge className="bg-teal-600 pointer-events-none whitespace-nowrap">
                                            Choice #{selectionIndex}
                                          </Badge>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                          <User className="w-3 h-3" /> {project.facultyName}
                                        </span>
                                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                          <GraduationCap className="w-3 h-3" /> {project.department}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {selectedProjects.length === 0 && projects.length > 0 && (
                        <p className="text-center text-sm text-red-500 mt-3 animate-pulse">
                          Please select at least one project to proceed
                        </p>
                      )}
                    </div>
                  </>
                )}

                {applicationType === 'group' && !isGroupLeader && (
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                    <p className="text-slate-600 mb-4 font-medium italic">
                      "Wait for your group leader to finalize the project selection..."
                    </p>
                    <div className="flex justify-center gap-4">
                      <Button variant="destructive" onClick={handleLeaveGroup} disabled={loading}>
                        Leave Group
                      </Button>
                      <Button variant="outline" onClick={() => setStep('member-waiting')}>
                        Back to Status
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Verify Group Members (Group Applications Only) */}
        {step === 'verify-members' && applicationType === 'group' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto"
          >
            <Card className="border-teal-200 dark:border-teal-800 shadow-xl overflow-hidden">
              <div className="bg-teal-600 p-6 text-white flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <h2 className="text-xl font-bold font-display">Final Verification</h2>
                    <p className="text-teal-100 text-sm">Review team and projects</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('application')}
                    disabled={loading}
                    className="h-10 px-4 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                  >
                    Edit Form
                  </Button>
                  <Button
                    onClick={handleSubmitApplication}
                    className="h-10 px-6 bg-white text-teal-600 hover:bg-teal-50 font-bold shadow-lg transition-all"
                    disabled={loading || groupMembers.length < 2 || groupMembers.some(m => !memberDetails.some(d => (d.userId?._id || d.userId) === (m._id || m.id)))}
                  >
                    {loading ? <Loader2 className="animate-spin mr-2" /> : 'Confirm & Submit'}
                  </Button>
                </div>
              </div>

              <CardContent className="p-8 space-y-8">
                {/* Member Verification List */}
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <Users className="w-5 h-5 text-teal-600" /> Team Members <Badge>{groupMembers.length}</Badge>
                  </h3>

                  <div className="grid gap-3">
                    {groupMembers.map((member: any, index: number) => {
                      const memberDetail = memberDetails.find(detail => {
                        const detailUserId = detail.userId?._id || detail.userId;
                        const memberUserId = member._id || member.id;
                        const detailUserIdString = typeof detailUserId === 'string' ? detailUserId : (detailUserId as any)?.toString?.();
                        const memberUserIdString = typeof memberUserId === 'string' ? memberUserId : (memberUserId as any)?.toString?.();
                        return detailUserIdString === memberUserIdString;
                      });
                      const hasSubmittedDetailsAndCgpa = !!memberDetail && memberDetail.cgpa !== undefined && memberDetail.cgpa !== null;

                      return (
                        <div
                          key={member._id || index}
                          className={`p-4 border rounded-xl flex items-center justify-between transition-colors
                               ${hasSubmittedDetailsAndCgpa
                              ? 'border-green-200 bg-green-50/50 dark:bg-green-900/10'
                              : 'border-amber-200 bg-amber-50/50 dark:bg-amber-900/10'}
                             `}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                                 ${hasSubmittedDetails ? 'bg-green-500' : 'bg-amber-500'}
                               `}>
                              {member.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900 dark:text-slate-100">{member.name || 'Unknown'}</p>
                                {member._id === user?.id && <Badge variant="secondary" className="text-[10px] h-5">You</Badge>}
                                {isGroupLeader && member._id === user?.id && <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 text-[10px] h-5">Leader</Badge>}
                              </div>
                              <p className="text-xs text-slate-500">{member.email}</p>

                              {memberDetail ? (
                                <div className="flex items-center gap-2 mt-1 text-xs text-green-700">
                                  <span><CheckCircle className="inline w-3 h-3 mr-1" /> Ready</span>
                                  <span className="text-slate-400">|</span>
                                  <span className="text-slate-600">{memberDetail.department}</span>
                                </div>
                              ) : (
                                <p className="text-xs text-amber-600 mt-1 font-medium flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> Details Pending
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isGroupLeader && member._id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member._id)}
                                disabled={loading}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {groupMembers.length < 2 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                    <div className="p-2 bg-amber-100 rounded-full h-fit text-amber-600">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm">Minimum Members Required</h4>
                      <p className="text-sm text-amber-800 mt-1">
                        Your group needs at least 2 members to submit an application. Please invite more members using your group code.
                      </p>
                    </div>
                  </div>
                )}

                {/* Selected Projects Summary */}
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <LayoutGrid className="w-5 h-5 text-teal-600" /> Selected Projects
                  </h3>
                  <div className="space-y-3">
                    {selectedProjects.map((projectId, index) => {
                      const project = projects.find(p => p._id === projectId);
                      return project ? (
                        <div key={projectId} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm border border-teal-200">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{project.title}</p>
                            <p className="text-xs text-slate-500">{project.facultyName}</p>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Bottom info for clarity */}
                <p className="text-center text-sm text-slate-500 italic">
                  Review the team and selected projects carefully before confirming.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
