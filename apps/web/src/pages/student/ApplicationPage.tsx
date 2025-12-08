import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, User, Code, ArrowRight, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { generateGroupCode, formatGroupCode } from '../../utils/codeGenerator';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { useWindowStatus } from '../../hooks/useWindowStatus';
import { WindowClosedMessage } from '../../components/common/WindowClosedMessage';

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
  const [step, setStep] = useState<'choice' | 'group-formation' | 'application' | 'verify-members'>('choice');
  const [applicationType, setApplicationType] = useState<'solo' | 'group' | null>(null);
  const [groupAction, setGroupAction] = useState<'create' | 'join' | null>(null);
  const [groupCode, setGroupCode] = useState('');
  const [groupId, setGroupId] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupLeaderId, setGroupLeaderId] = useState<string>('');
  const [memberDetails, setMemberDetails] = useState<any[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [applicationWindow, setApplicationWindow] = useState<any>(null);
  const [existingApplications, setExistingApplications] = useState<any[]>([]);
  const [eligibleProjectType, setEligibleProjectType] = useState<string | null>(null);

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
    checkEligibility();
    // Load saved state from localStorage
    loadSavedState();
  }, []);

  useEffect(() => {
    if (eligibleProjectType) {
      checkApplicationWindow();
      fetchProjects();
      fetchExistingGroup();
      fetchExistingApplication();
    }
  }, [eligibleProjectType]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveState();
  }, [step, applicationType, selectedProjects, formData, groupAction]);

  const saveState = () => {
    if (typeof window !== 'undefined') {
      const state = {
        step,
        applicationType,
        selectedProjects,
        formData,
        groupAction
      };
      localStorage.setItem('applicationState', JSON.stringify(state));
    }
  };

  const loadSavedState = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('applicationState');
      if (saved) {
        try {
          const state = JSON.parse(saved);
          if (state.step) setStep(state.step);
          if (state.applicationType) setApplicationType(state.applicationType);
          if (state.selectedProjects) setSelectedProjects(state.selectedProjects);
          if (state.formData) setFormData(state.formData);
          if (state.groupAction) setGroupAction(state.groupAction);
        } catch (error) {
          console.error('Error loading saved state:', error);
        }
      }
    }
  };

  const clearSavedState = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('applicationState');
    }
  };

  const checkEligibility = async () => {
    try {
      // Determine eligibility from user role
      if (!user?.role) {
        toast.error('Unable to determine your role. Please contact admin.');
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
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
    }
  };

  const fetchExistingGroup = async () => {
    try {
      const response = await api.get('/groups/my-group');
      if (response.success && response.data) {
        const group = response.data as any;
        setGroupCode(group.groupCode);
        setGroupId(group._id);
        setGroupLeaderId(group.leaderId?._id || group.leaderId);
        // Ensure members are properly set - the API should populate this
        const members = group.members || [];
        setGroupMembers(members);
        setMemberDetails(group.memberDetails || []);
        
        // Load selected projects if they exist
        if (group.selectedProjects && group.selectedProjects.length > 0) {
          const projectIds = group.selectedProjects.map((p: any) => p._id || p);
          setSelectedProjects(projectIds);
        }
        
        console.log('Group fetched:', { 
          groupCode: group.groupCode, 
          memberCount: members.length,
          leaderId: group.leaderId?._id || group.leaderId,
          memberDetails: group.memberDetails,
          selectedProjects: group.selectedProjects
        });
      }
    } catch (error) {
      // No existing group, that's fine
      console.log('No existing group found');
    }
  };

  const fetchExistingApplication = async () => {
    try {
      const response = await api.get('/applications/my-application');
      if (response.success && response.data) {
        const apps = Array.isArray(response.data) ? response.data : [response.data];
        // Only show pending or approved applications
        const activeApps = apps.filter((app: any) => app.status === 'pending' || app.status === 'approved');
        setExistingApplications(activeApps);
      }
    } catch (error) {
      console.log('No existing applications found');
    }
  };

  // Refetch application when group changes
  useEffect(() => {
    if (groupId) {
      fetchExistingApplication();
    }
  }, [groupId]);

  // Auto-refresh group data when on group formation or verification step
  useEffect(() => {
    if ((step === 'group-formation' || step === 'verify-members') && groupId) {
      const interval = setInterval(() => {
        fetchExistingGroup();
      }, 3000); // Refresh every 3 seconds

      return () => clearInterval(interval);
    }
  }, [step, groupId]);

  const checkApplicationWindow = async () => {
    if (!eligibleProjectType) return;

    try {
      const response = await api.get('/windows/active', {
        windowType: 'application',
        projectType: eligibleProjectType
      });
      if (response.success && response.data) {
        setApplicationWindow(response.data as any);
      }
    } catch (error) {
      console.error('Error checking application window:', error);
      // Set a default window if API fails to allow testing
      setApplicationWindow({ isActive: true, startDate: new Date(), endDate: new Date() } as any);
    }
  };

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
      setStep('group-formation');
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
        toast.success('Group created successfully!');
        
        // Refetch the group to ensure we have the latest data
        await fetchExistingGroup();
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

    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.delete(`/groups/${groupId}`);
      if (response.success) {
        setGroupCode('');
        setGroupId('');
        setGroupMembers([]);
        toast.success('Group deleted successfully!');
        setStep('group-formation');
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
        setStep('application');
      } else {
        toast.error(response.error?.message || 'Failed to join group');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelection = async (projectId: string) => {
    let newSelectedProjects: string[];
    
    if (selectedProjects.includes(projectId)) {
      newSelectedProjects = selectedProjects.filter(id => id !== projectId);
    } else if (selectedProjects.length < 3) {
      newSelectedProjects = [...selectedProjects, projectId];
    } else {
      toast.error('You can select up to 3 projects only');
      return;
    }
    
    setSelectedProjects(newSelectedProjects);
    
    // Save to backend if in a group
    if (applicationType === 'group' && groupId && isGroupLeader) {
      try {
        await api.post(`/groups/${groupId}/update-projects`, {
          selectedProjects: newSelectedProjects
        });
      } catch (error) {
        console.error('Error saving selected projects:', error);
      }
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!groupId) return;

    if (!confirm('Are you sure you want to remove this member from the group?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/groups/${groupId}/remove-member`, {
        memberId
      });

      if (response.success) {
        toast.success('Member removed successfully');
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

  const handleLeaveGroup = async () => {
    if (!groupId) return;

    if (!confirm('Are you sure you want to leave this group?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/groups/${groupId}/leave`);

      if (response.success) {
        toast.success('You have left the group');
        setGroupCode('');
        setGroupId('');
        setGroupMembers([]);
        setGroupLeaderId('');
        setMemberDetails([]);
        setSelectedProjects([]);
        setStep('group-formation');
        setGroupAction(null);
      } else {
        toast.error(response.error?.message || 'Failed to leave group');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave group');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMemberDetails = async () => {
    if (!formData.department) {
      toast.error('Please enter your department');
      return;
    }

    if (!groupId) {
      toast.error('Group not found');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/groups/${groupId}/submit-details`, {
        department: formData.department,
        specialization: formData.specialization || ''
      });

      if (response.success) {
        toast.success('Your details have been submitted successfully!');
        await fetchExistingGroup();
      } else {
        toast.error(response.error?.message || 'Failed to submit details');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit details');
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is the group leader
  const isGroupLeader = groupLeaderId && user?.id === groupLeaderId;

  // Check if current user has submitted their details
  const currentUserDetails = memberDetails.find((md: any) => 
    md.userId === user?.id || md.userId?._id === user?.id || md.userId?.toString() === user?.id
  );
  const hasSubmittedDetails = !!currentUserDetails;

  // Check if all members have submitted their details
  const allMembersSubmitted = groupMembers.length > 0 && 
    groupMembers.every((member: any) => 
      memberDetails.some((md: any) => 
        md.userId === member._id || 
        md.userId?._id === member._id || 
        md.userId?.toString() === member._id?.toString()
      )
    );

  const handleProceedToVerification = () => {
    if (selectedProjects.length === 0) {
      toast.error('Please select at least one project');
      return;
    }

    if (!formData.department) {
      toast.error('Please fill all required fields');
      return;
    }

    // For group applications, go to verification step
    if (applicationType === 'group') {
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
        clearSavedState(); // Clear saved state after successful submission
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
  if (existingApplications.length > 0) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Your Applications</h1>
                <p className="text-gray-600">Track the status of your project applications</p>
              </div>
              {eligibleProjectType && (
                <div className="px-4 py-2 bg-blue-100 border border-blue-300 rounded-lg">
                  <p className="text-sm text-gray-600">Eligible for</p>
                  <p className="text-lg font-bold text-blue-700">{eligibleProjectType}</p>
                </div>
              )}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {existingApplications.map((application: any) => (
              <motion.div
                key={application._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {application.groupId ? (
                      <Users className="w-6 h-6 text-blue-500 mr-2" />
                    ) : (
                      <User className="w-6 h-6 text-green-500 mr-2" />
                    )}
                    <span className="text-sm font-medium text-gray-600">
                      {application.groupId ? 'Group' : 'Solo'}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      application.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </span>
                </div>

                <h3 className="font-bold text-lg mb-2">
                  {application.projectId?.title || 'Project Title'}
                </h3>

                {application.projectId?.brief && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {application.projectId.brief}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium">{application.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Submitted:</span>
                    <span className="font-medium">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {application.reviewedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reviewed:</span>
                      <span className="font-medium">
                        {new Date(application.reviewedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-blue-500 mr-3 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900 mb-2">Application Status Guide</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Pending:</strong> Your application is under review</p>
                  <p><strong>Approved:</strong> Congratulations! Your application has been accepted</p>
                  <p><strong>Rejected:</strong> You can apply to other projects or reapply to this project</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if window is open
  if (!windowLoading && eligibleProjectType && !canApply) {
    return <WindowClosedMessage windowType="application" />;
  }

  if (!applicationWindow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Application Window Closed</h2>
          <p className="text-gray-600">
            The application window is currently closed. Please check back later.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Project Application</h1>
              <p className="text-gray-600">Apply for your preferred projects</p>
            </div>
            {eligibleProjectType && (
              <div className="px-4 py-2 bg-blue-100 border border-blue-300 rounded-lg">
                <p className="text-sm text-gray-600">Eligible for</p>
                <p className="text-lg font-bold text-blue-700">{eligibleProjectType}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Step 1: Choice */}
        {step === 'choice' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 gap-6"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleChoiceSelection('solo')}
              className="p-8 bg-white rounded-xl shadow-lg border-2 border-transparent hover:border-blue-500 transition-all"
            >
              <User className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Solo Application</h3>
              <p className="text-gray-600">Work independently on your project</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleChoiceSelection('group')}
              className="p-8 bg-white rounded-xl shadow-lg border-2 border-transparent hover:border-blue-500 transition-all"
            >
              <Users className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Group Application</h3>
              <p className="text-gray-600">Collaborate with 2-4 team members</p>
            </motion.button>
          </motion.div>
        )}

        {/* Step 2: Group Formation */}
        {step === 'group-formation' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Group Formation</h2>

            {/* Already in a group - show group info */}
            {groupCode && groupId && (
              <div>
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-bold text-green-900 mb-2">You're in a Group!</h3>
                      <p className="text-sm text-green-800 mb-3">
                        {isGroupLeader ? 'You are the group leader.' : 'You are a group member.'}
                      </p>
                      <div className="text-2xl font-bold text-blue-500 mb-2">
                        {formatGroupCode(groupCode)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''} in the group
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  {isGroupLeader ? (
                    <>
                      <button
                        onClick={handleDeleteGroup}
                        disabled={loading}
                        className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                      >
                        Delete Group
                      </button>
                      <button
                        onClick={() => setStep('application')}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Continue to Application <ArrowRight className="inline ml-2" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleLeaveGroup}
                        disabled={loading}
                        className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                      >
                        Leave Group
                      </button>
                      <button
                        onClick={() => setStep('application')}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Continue to Application <ArrowRight className="inline ml-2" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Not in a group - show create/join options */}
            {!groupCode && !groupId && (
              <>
                {!groupAction && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <button
                      onClick={() => setGroupAction('create')}
                      className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-all"
                    >
                      <Code className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                      <h3 className="font-bold mb-2">Create Group</h3>
                      <p className="text-sm text-gray-600">Generate a code for others to join</p>
                    </button>

                    <button
                      onClick={() => setGroupAction('join')}
                      className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-all"
                    >
                      <Users className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                      <h3 className="font-bold mb-2">Join Group</h3>
                      <p className="text-sm text-gray-600">Enter a code to join existing group</p>
                    </button>
                  </div>
                )}

                {groupAction === 'create' && (
                  <div className="text-center">
                    <p className="mb-4">Click below to generate your group code</p>
                    <button
                      onClick={handleCreateGroup}
                      disabled={loading}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      {loading ? <Loader className="animate-spin" /> : 'Generate Code'}
                    </button>
                  </div>
                )}

                {groupAction === 'join' && (
                  <div>
                    <label className="block mb-2 font-medium">Enter Group Code</label>
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      placeholder="ABC123"
                      className="w-full px-4 py-3 border rounded-lg mb-4 text-center text-2xl font-bold"
                    />
                    <button
                      onClick={handleJoinGroup}
                      disabled={loading || inputCode.length !== 6}
                      className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      {loading ? <Loader className="animate-spin mx-auto" /> : 'Join Group'}
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Step 3: Application Form */}
        {step === 'application' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold mb-6">
              {applicationType === 'group' && !isGroupLeader ? 'Submit Your Details' : 'Application Form'}
            </h2>

            {/* Group Member View - Only submit details */}
            {applicationType === 'group' && !isGroupLeader && (
              <>
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <Users className="w-6 h-6 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-blue-900 mb-2">Group Member</h3>
                      <p className="text-sm text-blue-800">
                        As a group member, please submit your department and specialization. 
                        Your group leader will select the projects and submit the application.
                      </p>
                    </div>
                  </div>
                </div>

                {hasSubmittedDetails && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-green-900 mb-2">Details Submitted</h3>
                        <p className="text-sm text-green-800">
                          You have already submitted your details. Your group leader can now proceed with the application.
                        </p>
                        <div className="mt-3 text-sm">
                          <p><strong>Department:</strong> {currentUserDetails?.department}</p>
                          {currentUserDetails?.specialization && (
                            <p><strong>Specialization:</strong> {currentUserDetails.specialization}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-gy-4 mb-6">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Department *</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Computer Science"
                      required
                      disabled={hasSubmittedDetails}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Specialization (Optional)</label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., AI/ML, Data Science"
                      disabled={hasSubmittedDetails}
                    />
                  </div>
                </div>

                {/* Show leader's selected projects if any */}
                {selectedProjects.length > 0 && (
                  <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h3 className="font-bold text-purple-900 mb-3">
                      Projects Selected by Leader ({selectedProjects.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedProjects.map((projectId, index) => {
                        const project = projects.find(p => p._id === projectId);
                        return project ? (
                          <div key={projectId} className="p-3 bg-white rounded-lg flex items-start">
                            <span className="font-bold text-purple-500 mr-3">{index + 1}.</span>
                            <div>
                              <p className="font-medium">{project.title}</p>
                              <p className="text-sm text-gray-600">{project.facultyName}</p>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* View Projects (Read-only for members) */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-4">All Available Projects</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Your group leader will select the projects for the team.
                  </p>

                  {projects.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
                      <Code className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-2">No projects available yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {projects.map((project) => {
                        const isSelected = selectedProjects.includes(project._id);
                        return (
                          <div
                            key={project._id}
                            className={`p-4 border-2 rounded-lg ${isSelected ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-bold mb-1">{project.title}</h4>
                                <p className="text-sm text-gray-600 mb-2">{project.brief}</p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-gray-500">
                                    Faculty: {project.facultyName} ({project.facultyIdNumber})
                                  </span>
                                  <span className="text-gray-500">Dept: {project.department}</span>
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle className="w-6 h-6 text-purple-500 flex-shrink-0 ml-3" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSubmitMemberDetails}
                  disabled={loading || !formData.department || hasSubmittedDetails}
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? <Loader className="animate-spin mx-auto" /> : hasSubmittedDetails ? 'Details Already Submitted' : 'Submit My Details'}
                </button>
              </>
            )}

            {/* Group Leader or Solo Application View */}
            {(applicationType === 'solo' || (applicationType === 'group' && isGroupLeader)) && (
              <>
                {/* Form Fields */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Department *</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Computer Science"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Specialization (Optional)</label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., AI/ML, Data Science"
                    />
                  </div>
                </div>

                {/* Project Selection */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-4">
                    Select Projects (up to 3) - {selectedProjects.length}/3 selected
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Choose the projects you're interested in working on. You can select up to 3 projects in order of preference.
                  </p>

                  {projects.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
                      <Code className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-2">No projects available yet</p>
                      <p className="text-sm text-gray-500">
                        Projects will be posted by faculty soon. Check back later!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projects.map((project) => (
                        <div
                          key={project._id}
                          onClick={() => handleProjectSelection(project._id)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedProjects.includes(project._id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold mb-1">{project.title}</h4>
                              <p className="text-sm text-gray-600 mb-2">{project.brief}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-500">
                                  Faculty: {project.facultyName} ({project.facultyIdNumber})
                                </span>
                                <span className="text-gray-500">Dept: {project.department}</span>
                              </div>
                            </div>
                            {selectedProjects.includes(project._id) && (
                              <CheckCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedProjects.length === 0 && projects.length > 0 && (
                  <p className="text-sm text-amber-600 mb-3 text-center">
                    ⚠️ Please select at least one project to continue
                  </p>
                )}

                <button
                  onClick={handleProceedToVerification}
                  disabled={loading || selectedProjects.length === 0}
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title={selectedProjects.length === 0 ? 'Please select at least one project' : applicationType === 'group' ? 'Proceed to verify group members' : 'Submit your application'}
                >
                  {loading ? <Loader className="animate-spin mx-auto" /> : applicationType === 'group' ? 'Continue to Verification' : 'Submit Application'}
                </button>
              </>
            )}
          </motion.div>
        )}

        {/* Step 4: Verify Group Members (Group Applications Only) */}
        {step === 'verify-members' && applicationType === 'group' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Verify Group Members</h2>
            
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">Important: Verify Your Team</h3>
                  <p className="text-sm text-blue-800">
                    Please confirm that all group members listed below are correct before submitting your application. 
                    Once submitted, you cannot modify the group composition.
                  </p>
                </div>
              </div>
            </div>

            {groupCode && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Group Code:</p>
                <div className="text-2xl font-bold text-blue-500">
                  {formatGroupCode(groupCode)}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4">Group Members ({groupMembers.length})</h3>
              
              {groupMembers.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-lg">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Loading group members...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupMembers.map((member: any, index: number) => {
                    const memberDetail = memberDetails.find((md: any) => 
                      md.userId === member._id || 
                      md.userId?._id === member._id || 
                      md.userId?.toString() === member._id?.toString()
                    );
                    const hasSubmitted = !!memberDetail;

                    return (
                      <div
                        key={member._id || index}
                        className={`p-4 border-2 rounded-lg ${hasSubmitted ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center flex-1">
                            <div className={`w-10 h-10 ${hasSubmitted ? 'bg-green-500' : 'bg-amber-500'} text-white rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0`}>
                              {member.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{member.name || 'Unknown'}</p>
                                {member._id === user?.id && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                    You
                                  </span>
                                )}
                                {member._id?.toString() === groupLeaderId?.toString() && (
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                                    Leader
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{member.email || 'No email'}</p>
                              {member.studentId && (
                                <p className="text-xs text-gray-500">ID: {member.studentId}</p>
                              )}
                              {hasSubmitted && memberDetail && (
                                <div className="mt-2 text-sm">
                                  <p className="text-gray-700">
                                    <strong>Dept:</strong> {memberDetail.department}
                                  </p>
                                  {memberDetail.specialization && (
                                    <p className="text-gray-700">
                                      <strong>Spec:</strong> {memberDetail.specialization}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            {hasSubmitted ? (
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            ) : (
                              <XCircle className="w-6 h-6 text-amber-600" />
                            )}
                            {/* Remove member button (only for leader, not for themselves) */}
                            {isGroupLeader && member._id?.toString() !== user?.id && (
                              <button
                                onClick={() => handleRemoveMember(member._id)}
                                disabled={loading}
                                className="ml-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
                                title="Remove member from group"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {groupMembers.length < 2 && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    ⚠️ Your group needs at least 2 members to submit an application. 
                    Share your group code with team members to have them join.
                  </p>
                </div>
              )}

              {!allMembersSubmitted && groupMembers.length >= 2 && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    ⚠️ All group members must submit their department information before you can submit the application. 
                    Please wait for all members to complete their details.
                  </p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3">Selected Projects</h3>
              <div className="space-y-2">
                {selectedProjects.map((projectId, index) => {
                  const project = projects.find(p => p._id === projectId);
                  return project ? (
                    <div key={projectId} className="p-3 bg-gray-50 rounded-lg flex items-start">
                      <span className="font-bold text-blue-500 mr-3">{index + 1}.</span>
                      <div>
                        <p className="font-medium">{project.title}</p>
                        <p className="text-sm text-gray-600">{project.facultyName}</p>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('application')}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-all"
              >
                Back to Edit
              </button>
              <button
                onClick={handleSubmitApplication}
                disabled={loading || groupMembers.length < 2 || !allMembersSubmitted}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title={
                  groupMembers.length < 2 
                    ? 'Group needs at least 2 members' 
                    : !allMembersSubmitted 
                    ? 'All members must submit their details first' 
                    : 'Confirm and submit application'
                }
              >
                {loading ? <Loader className="animate-spin mx-auto" /> : 'Confirm & Submit Application'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
