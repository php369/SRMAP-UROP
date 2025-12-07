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
  const [step, setStep] = useState<'choice' | 'group-formation' | 'application'>('choice');
  const [applicationType, setApplicationType] = useState<'solo' | 'group' | null>(null);
  const [groupAction, setGroupAction] = useState<'create' | 'join' | null>(null);
  const [groupCode, setGroupCode] = useState('');
  const [groupId, setGroupId] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [, setGroupMembers] = useState<any[]>([]);
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
  }, []);

  useEffect(() => {
    if (eligibleProjectType) {
      checkApplicationWindow();
      fetchProjects();
      fetchExistingGroup();
      fetchExistingApplication();
    }
  }, [eligibleProjectType]);

  const checkEligibility = async () => {
    try {
      // Check eligibility for each project type
      const types = ['IDP', 'UROP', 'CAPSTONE'];
      for (const type of types) {
        const response = await api.get('/eligibility/check', { projectType: type });
        if (response.success && (response.data as any)?.isEligible) {
          setEligibleProjectType(type);
          return;
        }
      }
      // If no eligibility found, show error
      toast.error('You are not eligible for any project type. Please contact admin.');
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
        setGroupMembers(group.members || []);
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
        setGroupCode((response.data as any).groupCode);
        setGroupId((response.data as any)._id);
        setGroupMembers([user]);
        toast.success('Group created successfully!');
        setStep('application');
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

  const handleProjectSelection = (projectId: string) => {
    if (selectedProjects.includes(projectId)) {
      setSelectedProjects(selectedProjects.filter(id => id !== projectId));
    } else if (selectedProjects.length < 3) {
      setSelectedProjects([...selectedProjects, projectId]);
    } else {
      toast.error('You can select up to 3 projects only');
    }
  };

  const handleSubmitApplication = async () => {
    if (selectedProjects.length === 0) {
      toast.error('Please select at least one project');
      return;
    }

    if (!formData.department) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      // Manually construct array to ensure proper serialization
      const projectIds = selectedProjects.map(id => id);

      console.log('Selected projects:', selectedProjects);
      console.log('Project IDs:', projectIds);

      if (!eligibleProjectType) {
        toast.error('Unable to determine your project eligibility');
        setLoading(false);
        return;
      }

      // Use fetch directly with pre-stringified JSON to avoid any conversion issues
      const requestBody = JSON.stringify({
        projectType: eligibleProjectType,
        selectedProjects: projectIds,
        department: formData.department,
        stream: formData.department, // Use department as stream
        specialization: formData.specialization || '',
        cgpa: formData.cgpa || 0,
        semester: formData.semester || 1, // Use actual semester number
        isGroupApplication: applicationType === 'group'
      });

      console.log('Request body:', requestBody);

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('srm_portal_token')}`
        },
        body: requestBody
      });

      const response = await res.json();

      if (response.success) {
        toast.success(`${response.data.length} application(s) submitted successfully!`);
        setExistingApplications(response.data);
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
    return <WindowClosedMessage windowType="application" projectType={eligibleProjectType} />;
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

            {groupAction === 'create' && !groupCode && (
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

            {groupCode && (
              <div className="text-center">
                <p className="mb-4">Your group code:</p>
                <div className="text-4xl font-bold text-blue-500 mb-4">
                  {formatGroupCode(groupCode)}
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Share this code with your team members (2-4 members total)
                </p>
                <div className="flex gap-3 justify-center">
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
                </div>
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
          </motion.div>
        )}

        {/* Step 3: Application Form */}
        {step === 'application' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Application Form</h2>

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
              onClick={handleSubmitApplication}
              disabled={loading || selectedProjects.length === 0}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title={selectedProjects.length === 0 ? 'Please select at least one project' : 'Submit your application'}
            >
              {loading ? <Loader className="animate-spin mx-auto" /> : 'Submit Application'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
