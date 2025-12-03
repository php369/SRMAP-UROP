import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, User, Code, ArrowRight, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { generateGroupCode, formatGroupCode } from '../../utils/codeGenerator';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

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
  const [step, setStep] = useState<'choice' | 'group-formation' | 'application'>('choice');
  const [applicationType, setApplicationType] = useState<'solo' | 'group' | null>(null);
  const [groupAction, setGroupAction] = useState<'create' | 'join' | null>(null);
  const [groupCode, setGroupCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [applicationWindow, setApplicationWindow] = useState<any>(null);

  // Form data
  const [formData, setFormData] = useState({
    department: user?.profile?.department || '',
    stream: '',
    specialization: user?.profile?.specialization || '',
    cgpa: ''
  });

  useEffect(() => {
    checkApplicationWindow();
    fetchProjects();
  }, []);

  const checkApplicationWindow = async () => {
    try {
      const response = await api.get('/windows/active', { 
        windowType: 'application',
        projectType: 'IDP' 
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
    try {
      const response = await api.get('/projects/public');
      if (response.success && response.data) {
        setProjects(response.data as any);
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
    setLoading(true);
    try {
      const code = generateGroupCode();
      const response = await api.post('/groups', {
        projectType: 'IDP', // This should be dynamic based on selection
        semester: 'Fall 2025',
        year: 2025,
        groupName: `Group ${code}`
      });

      if (response.success && response.data) {
        setGroupCode((response.data as any).groupCode);
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

  const handleJoinGroup = async () => {
    if (!inputCode || inputCode.length !== 6) {
      toast.error('Please enter a valid 6-character code');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/groups/join', {
        groupCode: inputCode.toUpperCase(),
        semester: 'Fall 2025',
        year: 2025,
        projectType: 'IDP'
      });

      if (response.success) {
        toast.success('Joined group successfully!');
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

    if (!formData.department || !formData.stream) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/applications', {
        ...(applicationType === 'group' ? { groupId: 'group-id' } : { studentId: user?._id }),
        projectPreferences: selectedProjects,
        ...formData
      });

      if (response.success) {
        toast.success('Application submitted successfully!');
        // Redirect or show success message
      } else {
        toast.error(response.error?.message || 'Failed to submit application');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold mb-2">Project Application</h1>
          <p className="text-gray-600">Apply for your preferred projects</p>
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
                <button
                  onClick={() => setStep('application')}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Continue to Application <ArrowRight className="inline ml-2" />
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
                <label className="block mb-2 font-medium">Department *</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Stream *</label>
                <input
                  type="text"
                  value={formData.stream}
                  onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Specialization (6th sem onwards)</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={formData.cgpa}
                  onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
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
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedProjects.includes(project._id)
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
