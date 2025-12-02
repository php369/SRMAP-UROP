import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Building2, GraduationCap, Calendar, BookOpen, Shield,
  Edit2, Save, X, Camera, CheckCircle, AlertCircle, Loader, Award,
  TrendingUp, Target, Zap, Clock, Activity, Bell, Eye, EyeOff,
  Github, Linkedin, Globe, Phone, MapPin, Star, Trophy, Flame,
  BarChart3, Settings, Download, Share2, Lock, Unlock, Info
} from 'lucide-react';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  avatar?: string;
  studentId?: string;
  facultyId?: string;
  isCoordinator?: boolean;
  isExternalEvaluator?: boolean;
  profile: {
    department?: string;
    year?: number;
    semester?: number;
    specialization?: string;
    bio?: string;
    skills?: string[];
    interests?: string[];
    phone?: string;
    location?: string;
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    emailNotifications?: boolean;
    profileVisibility?: 'public' | 'private' | 'connections';
  };
  stats?: {
    projectsApplied: number;
    submissionsMade: number;
    assessmentsCompleted: number;
    meetingsAttended: number;
    currentStreak: number;
  };
  achievements?: Array<{
    id: string;
    name: string;
    icon: string;
    earnedAt: Date;
  }>;
  lastSeen: Date;
  createdAt: Date;
}

const AVATAR_OPTIONS = [
  '👨‍🎓', '👩‍🎓', '👨‍💼', '👩‍💼', '👨‍🏫', '👩‍🏫',
  '🧑‍💻', '👨‍🔬', '👩‍🔬', '🧑‍🎨', '👨‍⚕️', '👩‍⚕️'
];

const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Chemical Engineering',
  'Biotechnology',
  'Mathematics',
  'Physics',
  'Chemistry'
];

const SPECIALIZATIONS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science',
  'Cyber Security',
  'Cloud Computing',
  'Internet of Things',
  'Blockchain',
  'Full Stack Development',
  'Mobile App Development',
  'DevOps'
];

const SKILL_SUGGESTIONS = [
  'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js',
  'MongoDB', 'SQL', 'Git', 'Docker', 'AWS', 'Machine Learning',
  'Data Analysis', 'UI/UX Design', 'Project Management'
];

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="space-y-6 max-w-4xl mx-auto p-6 animate-pulse">
    <div className="h-8 bg-surface rounded w-1/3"></div>
    <div className="bg-surface rounded-lg border border-border p-8">
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 bg-background rounded-full"></div>
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-background rounded w-1/2"></div>
          <div className="h-4 bg-background rounded w-1/3"></div>
        </div>
      </div>
    </div>
  </div>
);

// Profile Completion Component
const ProfileCompletion = ({ profile }: { profile: UserProfile }) => {
  const calculateCompletion = () => {
    const fields = [
      profile.avatar,
      profile.profile.department,
      profile.profile.year,
      profile.profile.semester,
      profile.profile.bio,
      profile.profile.skills?.length,
      profile.profile.interests?.length,
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completion = calculateCompletion();
  const missingFields = [];
  
  if (!profile.avatar) missingFields.push('Avatar');
  if (!profile.profile.department) missingFields.push('Department');
  if (!profile.profile.bio) missingFields.push('Bio');
  if (!profile.profile.skills?.length) missingFields.push('Skills');
  if (!profile.profile.interests?.length) missingFields.push('Interests');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Profile Completion
        </h3>
        <span className="text-2xl font-bold text-primary">{completion}%</span>
      </div>
      
      <div className="w-full bg-background rounded-full h-3 mb-4 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${completion}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
        />
      </div>

      {missingFields.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-textSecondary">Complete your profile:</p>
          <div className="flex flex-wrap gap-2">
            {missingFields.map((field) => (
              <span key={field} className="px-2 py-1 bg-surface rounded text-xs text-textSecondary">
                + Add {field}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Activity Statistics Component
const ActivityStats = ({ stats }: { stats: UserProfile['stats'] }) => {
  if (!stats) return null;

  const statItems = [
    { icon: Target, label: 'Projects Applied', value: stats.projectsApplied, color: 'text-blue-400' },
    { icon: CheckCircle, label: 'Submissions', value: stats.submissionsMade, color: 'text-green-400' },
    { icon: Award, label: 'Assessments', value: stats.assessmentsCompleted, color: 'text-purple-400' },
    { icon: Activity, label: 'Meetings', value: stats.meetingsAttended, color: 'text-orange-400' },
    { icon: Flame, label: 'Day Streak', value: stats.currentStreak, color: 'text-red-400' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-surface rounded-lg border border-border p-6"
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        Your Activity
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            className="text-center p-4 bg-background rounded-lg hover:bg-background/80 transition-colors"
          >
            <item.icon className={`w-6 h-6 mx-auto mb-2 ${item.color}`} />
            <p className="text-2xl font-bold text-text mb-1">{item.value}</p>
            <p className="text-xs text-textSecondary">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Achievements Component
const AchievementsBadges = ({ achievements }: { achievements: UserProfile['achievements'] }) => {
  if (!achievements || achievements.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-surface rounded-lg border border-border p-6"
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        Achievements
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors group cursor-pointer"
            title={`Earned on ${new Date(achievement.earnedAt).toLocaleDateString()}`}
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
              {achievement.icon}
            </div>
            <p className="text-sm font-medium text-text">{achievement.name}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Skills Component
const SkillsSection = ({ 
  skills, 
  editing, 
  onSkillsChange 
}: { 
  skills: string[]; 
  editing: boolean; 
  onSkillsChange: (skills: string[]) => void;
}) => {
  const [newSkill, setNewSkill] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addSkill = (skill: string) => {
    if (skill && !skills.includes(skill)) {
      onSkillsChange([...skills, skill]);
      setNewSkill('');
      setShowSuggestions(false);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onSkillsChange(skills.filter(s => s !== skillToRemove));
  };

  const filteredSuggestions = SKILL_SUGGESTIONS.filter(
    s => !skills.includes(s) && s.toLowerCase().includes(newSkill.toLowerCase())
  );

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-primary" />
        Skills & Expertise
      </h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {skills.map((skill) => (
          <span
            key={skill}
            className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium flex items-center gap-2"
          >
            {skill}
            {editing && (
              <button
                onClick={() => removeSkill(skill)}
                className="hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
        {skills.length === 0 && !editing && (
          <p className="text-textSecondary text-sm">No skills added yet</p>
        )}
      </div>
      
      {editing && (
        <div className="relative">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => {
                setNewSkill(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyPress={(e) => e.key === 'Enter' && addSkill(newSkill)}
              placeholder="Add a skill..."
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => addSkill(newSkill)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Add
            </button>
          </div>
          
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => addSkill(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-background transition-colors text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main Profile Page Component
export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [editForm, setEditForm] = useState({
    department: '',
    year: 1,
    semester: 1,
    specialization: '',
    bio: '',
    skills: [] as string[],
    interests: [] as string[],
    phone: '',
    location: '',
    github: '',
    linkedin: '',
    portfolio: '',
    emailNotifications: true,
    profileVisibility: 'public' as 'public' | 'private' | 'connections'
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      if (response.success && response.data) {
        const profileData = response.data as UserProfile;
        setProfile(profileData);
        setEditForm({
          department: profileData.profile.department || '',
          year: profileData.profile.year || 1,
          semester: profileData.profile.semester || 1,
          specialization: profileData.profile.specialization || '',
          bio: profileData.profile.bio || '',
          skills: profileData.profile.skills || [],
          interests: profileData.profile.interests || [],
          phone: profileData.profile.phone || '',
          location: profileData.profile.location || '',
          github: profileData.profile.github || '',
          linkedin: profileData.profile.linkedin || '',
          portfolio: profileData.profile.portfolio || '',
          emailNotifications: profileData.preferences.emailNotifications ?? true,
          profileVisibility: profileData.preferences.profileVisibility || 'public'
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      cancelEdit();
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setHasUnsavedChanges(false);
    setShowConfirmDialog(false);
    if (profile) {
      setEditForm({
        department: profile.profile.department || '',
        year: profile.profile.year || 1,
        semester: profile.profile.semester || 1,
        specialization: profile.profile.specialization || '',
        bio: profile.profile.bio || '',
        skills: profile.profile.skills || [],
        interests: profile.profile.interests || [],
        phone: profile.profile.phone || '',
        location: profile.profile.location || '',
        github: profile.profile.github || '',
        linkedin: profile.profile.linkedin || '',
        portfolio: profile.profile.portfolio || '',
        emailNotifications: profile.preferences.emailNotifications ?? true,
        profileVisibility: profile.preferences.profileVisibility || 'public'
      });
    }
  };

  const handleFormChange = (updates: Partial<typeof editForm>) => {
    setEditForm({ ...editForm, ...updates });
    setHasUnsavedChanges(true);
  };

  const validateForm = () => {
    if (profile?.role === 'student') {
      if (!editForm.department) {
        toast.error('Department is required');
        return false;
      }
      if (editForm.semester >= 6 && !editForm.specialization) {
        toast.error('Specialization is required for 6th semester onwards');
        return false;
      }
    }
    
    // Validate URLs
    const urlFields = ['github', 'linkedin', 'portfolio'];
    for (const field of urlFields) {
      const value = editForm[field as keyof typeof editForm] as string;
      if (value && !value.startsWith('http')) {
        toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} must be a valid URL`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const response = await api.put('/users/profile', {
        profile: {
          department: editForm.department,
          year: editForm.year,
          semester: editForm.semester,
          specialization: editForm.specialization,
          bio: editForm.bio,
          skills: editForm.skills,
          interests: editForm.interests,
          phone: editForm.phone,
          location: editForm.location,
          github: editForm.github,
          linkedin: editForm.linkedin,
          portfolio: editForm.portfolio
        },
        preferences: {
          emailNotifications: editForm.emailNotifications,
          profileVisibility: editForm.profileVisibility
        }
      });

      if (response.success) {
        toast.success('Profile updated successfully');
        setEditing(false);
        setHasUnsavedChanges(false);
        fetchProfile();
      } else {
        toast.error(response.error?.message || 'Failed to update profile');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (avatar: string) => {
    try {
      const response = await api.put('/users/avatar', { avatar });
      
      if (response.success) {
        toast.success('Avatar updated successfully');
        setShowAvatarPicker(false);
        fetchProfile();
      } else {
        toast.error(response.error?.message || 'Failed to update avatar');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update avatar');
    }
  };

  const getRoleBadge = (role: string, isCoordinator?: boolean, isExternalEvaluator?: boolean) => {
    if (role === 'admin') {
      return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium flex items-center gap-1"><Shield className="w-3 h-3" />Admin</span>;
    }
    if (isCoordinator) {
      return <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium flex items-center gap-1"><Star className="w-3 h-3" />Coordinator</span>;
    }
    if (isExternalEvaluator) {
      return <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium flex items-center gap-1"><Award className="w-3 h-3" />External Evaluator</span>;
    }
    if (role === 'faculty') {
      return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium flex items-center gap-1"><User className="w-3 h-3" />Faculty</span>;
    }
    return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium flex items-center gap-1"><GraduationCap className="w-3 h-3" />Student</span>;
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-textSecondary">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">Profile</h1>
          <p className="text-textSecondary mt-1">
            Manage your personal information and preferences
          </p>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <>
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
              <button
                onClick={() => toast.info('Export feature coming soon')}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text rounded-lg hover:bg-surface/80 transition-colors"
                title="Export profile data"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => toast.info('Share feature coming soon')}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text rounded-lg hover:bg-surface/80 transition-colors"
                title="Share profile"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text rounded-lg hover:bg-surface/80 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Profile Completion */}
      {profile.role === 'student' && <ProfileCompletion profile={profile} />}

      {/* Activity Statistics */}
      {profile.stats && <ActivityStats stats={profile.stats} />}

      {/* Achievements */}
      {profile.achievements && <AchievementsBadges achievements={profile.achievements} />}

      {/* Main Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-lg border border-border overflow-hidden"
      >
        {/* Header Section with Avatar */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-8">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="relative">
              <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center text-5xl border-4 border-white/20">
                {profile.avatar || '👤'}
              </div>
              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shadow-lg"
                title="Change avatar"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-text mb-2">{profile.name}</h2>
              <div className="flex items-center gap-3 flex-wrap">
                {getRoleBadge(profile.role, profile.isCoordinator, profile.isExternalEvaluator)}
                {profile.studentId && (
                  <span className="px-3 py-1 bg-surface/50 text-textSecondary rounded-full text-sm font-mono">
                    {profile.studentId}
                  </span>
                )}
                {profile.facultyId && (
                  <span className="px-3 py-1 bg-surface/50 text-textSecondary rounded-full text-sm font-mono">
                    {profile.facultyId}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Avatar Picker */}
        <AnimatePresence>
          {showAvatarPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-border p-6 bg-surface/50"
            >
              <h3 className="text-lg font-semibold mb-4">Choose Your Avatar</h3>
              <div className="grid grid-cols-6 md:grid-cols-12 gap-3">
                {AVATAR_OPTIONS.map((avatar, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAvatarChange(avatar)}
                    className={`w-12 h-12 text-3xl rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center ${
                      profile.avatar === avatar ? 'bg-primary/30 ring-2 ring-primary' : 'bg-surface'
                    }`}
                  >
                    {avatar}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Information */}
        <div className="p-6 space-y-6">
          {/* Bio Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              About Me
            </h3>
            {editing ? (
              <textarea
                value={editForm.bio}
                onChange={(e) => handleFormChange({ bio: e.target.value })}
                placeholder="Tell us about yourself, your interests, and goals..."
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            ) : (
              <p className="text-textSecondary">
                {profile.profile.bio || 'No bio added yet. Click Edit Profile to add one.'}
              </p>
            )}
            {editing && (
              <p className="text-xs text-textSecondary mt-1">
                {editForm.bio.length}/500 characters
              </p>
            )}
          </div>

          {/* Skills Section */}
          {profile.role === 'student' && (
            <SkillsSection
              skills={editForm.skills}
              editing={editing}
              onSkillsChange={(skills) => handleFormChange({ skills })}
            />
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-background rounded-lg">
                <Mail className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-textSecondary">Email</p>
                  <p className="text-text font-medium">{profile.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-background rounded-lg">
                <Phone className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-textSecondary mb-1">Phone</p>
                  {editing ? (
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => handleFormChange({ phone: e.target.value })}
                      placeholder="+91 1234567890"
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <p className="text-text font-medium">
                      {profile.profile.phone || 'Not specified'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-background rounded-lg">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-textSecondary mb-1">Location</p>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => handleFormChange({ location: e.target.value })}
                      placeholder="City, State"
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <p className="text-text font-medium">
                      {profile.profile.location || 'Not specified'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-background rounded-lg">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-textSecondary">Role</p>
                  <p className="text-text font-medium capitalize">{profile.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Social Links
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 bg-background rounded-lg">
                <Github className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-textSecondary mb-1">GitHub</p>
                  {editing ? (
                    <input
                      type="url"
                      value={editForm.github}
                      onChange={(e) => handleFormChange({ github: e.target.value })}
                      placeholder="https://github.com/username"
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  ) : profile.profile.github ? (
                    <a
                      href={profile.profile.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      View Profile
                    </a>
                  ) : (
                    <p className="text-textSecondary text-sm">Not added</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-background rounded-lg">
                <Linkedin className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-textSecondary mb-1">LinkedIn</p>
                  {editing ? (
                    <input
                      type="url"
                      value={editForm.linkedin}
                      onChange={(e) => handleFormChange({ linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  ) : profile.profile.linkedin ? (
                    <a
                      href={profile.profile.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      View Profile
                    </a>
                  ) : (
                    <p className="text-textSecondary text-sm">Not added</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-background rounded-lg">
                <Globe className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-textSecondary mb-1">Portfolio</p>
                  {editing ? (
                    <input
                      type="url"
                      value={editForm.portfolio}
                      onChange={(e) => handleFormChange({ portfolio: e.target.value })}
                      placeholder="https://yourportfolio.com"
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  ) : profile.profile.portfolio ? (
                    <a
                      href={profile.profile.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      Visit Website
                    </a>
                  ) : (
                    <p className="text-textSecondary text-sm">Not added</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Academic Information (Students Only) */}
          {profile.role === 'student' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Academic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-background rounded-lg">
                  <Building2 className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-textSecondary mb-1">Department</p>
                    {editing ? (
                      <select
                        value={editForm.department}
                        onChange={(e) => handleFormChange({ department: e.target.value })}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-text font-medium">
                        {profile.profile.department || 'Not specified'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-background rounded-lg">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-textSecondary mb-1">Year</p>
                    {editing ? (
                      <select
                        value={editForm.year}
                        onChange={(e) => handleFormChange({ year: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                      </select>
                    ) : (
                      <p className="text-text font-medium">
                        {profile.profile.year ? `${profile.profile.year}${profile.profile.year === 1 ? 'st' : profile.profile.year === 2 ? 'nd' : profile.profile.year === 3 ? 'rd' : 'th'} Year` : 'Not specified'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-background rounded-lg">
                  <BookOpen className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-textSecondary mb-1">Semester</p>
                    {editing ? (
                      <select
                        value={editForm.semester}
                        onChange={(e) => handleFormChange({ semester: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-text font-medium">
                        {profile.profile.semester ? `Semester ${profile.profile.semester}` : 'Not specified'}
                      </p>
                    )}
                  </div>
                </div>

                {(editing ? editForm.semester >= 6 : (profile.profile.semester || 0) >= 6) && (
                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg">
                    <GraduationCap className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-textSecondary mb-1">Specialization</p>
                      {editing ? (
                        <select
                          value={editForm.specialization}
                          onChange={(e) => handleFormChange({ specialization: e.target.value })}
                          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select Specialization</option>
                          {SPECIALIZATIONS.map((spec) => (
                            <option key={spec} value={spec}>{spec}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-text font-medium">
                          {profile.profile.specialization || 'Not specified'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preferences */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-text font-medium">Email Notifications</p>
                    <p className="text-sm text-textSecondary">Receive updates via email</p>
                  </div>
                </div>
                {editing ? (
                  <button
                    onClick={() => handleFormChange({ emailNotifications: !editForm.emailNotifications })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      editForm.emailNotifications ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        editForm.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    profile.preferences.emailNotifications ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {profile.preferences.emailNotifications ? 'Enabled' : 'Disabled'}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex items-center gap-3">
                  {editForm.profileVisibility === 'public' ? <Eye className="w-5 h-5 text-primary" /> : <EyeOff className="w-5 h-5 text-primary" />}
                  <div>
                    <p className="text-text font-medium">Profile Visibility</p>
                    <p className="text-sm text-textSecondary">Control who can see your profile</p>
                  </div>
                </div>
                {editing ? (
                  <select
                    value={editForm.profileVisibility}
                    onChange={(e) => handleFormChange({ profileVisibility: e.target.value as any })}
                    className="px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="public">Public</option>
                    <option value="connections">Connections Only</option>
                    <option value="private">Private</option>
                  </select>
                ) : (
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm capitalize">
                    {profile.preferences.profileVisibility || 'Public'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-background rounded-lg">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-textSecondary">Member Since</p>
                  <p className="text-text font-medium">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-background rounded-lg">
                <Clock className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-textSecondary">Last Active</p>
                  <p className="text-text font-medium">
                    {new Date(profile.lastSeen).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-400 mb-1">Profile Tips</h4>
            <ul className="text-sm text-textSecondary space-y-1">
              <li>• Complete your profile to increase visibility</li>
              <li>• Add skills to help faculty match you with relevant projects</li>
              <li>• Keep your contact information up to date</li>
              <li>• Your email and role are linked to your Google account and cannot be changed</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-lg border border-border p-6 max-w-md w-full"
            >
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text mb-2">Unsaved Changes</h3>
                  <p className="text-textSecondary mb-4">
                    You have unsaved changes. Are you sure you want to discard them?
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowConfirmDialog(false)}
                      className="px-4 py-2 bg-surface border border-border text-text rounded-lg hover:bg-surface/80 transition-colors"
                    >
                      Keep Editing
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Discard Changes
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
