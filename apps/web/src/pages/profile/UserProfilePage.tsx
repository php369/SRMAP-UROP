import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, UserSkill, EducationEntry, Achievement } from '../../types';
import { SkillsRadarChart } from '../../components/profile/SkillsRadarChart';
import { InterestsTagCloud } from '../../components/profile/InterestsTagCloud';
import { EducationTimeline } from '../../components/profile/EducationTimeline';
import { GlassCard, Badge, LoadingSpinner, GlowButton } from '../../components/ui';
import { cn } from '../../utils/cn';

// Mock data
const mockSkills: UserSkill[] = [
  { name: 'React', level: 9, category: 'technical', verified: true, endorsements: 15 },
  { name: 'TypeScript', level: 8, category: 'technical', verified: true, endorsements: 12 },
  { name: 'Node.js', level: 7, category: 'technical', verified: false, endorsements: 8 },
  { name: 'Python', level: 8, category: 'technical', verified: true, endorsements: 10 },
  { name: 'Machine Learning', level: 6, category: 'domain', verified: false, endorsements: 5 },
  { name: 'Leadership', level: 8, category: 'soft', verified: true, endorsements: 20 },
  { name: 'Communication', level: 9, category: 'soft', verified: true, endorsements: 18 },
  { name: 'Problem Solving', level: 9, category: 'soft', verified: true, endorsements: 22 },
  { name: 'English', level: 10, category: 'language', verified: true, endorsements: 25 },
  { name: 'Spanish', level: 6, category: 'language', verified: false, endorsements: 3 },
  { name: 'Data Science', level: 7, category: 'domain', verified: true, endorsements: 9 },
  { name: 'UI/UX Design', level: 6, category: 'technical', verified: false, endorsements: 7 },
];

const mockEducation: EducationEntry[] = [
  {
    id: '1',
    institution: 'SRM Institute of Science and Technology',
    degree: 'Bachelor of Technology',
    field: 'Computer Science and Engineering',
    startDate: '2021-08-01',
    endDate: '2025-05-31',
    gpa: 3.8,
    description: 'Specializing in Artificial Intelligence and Machine Learning with focus on deep learning applications.',
    achievements: [
      'Dean\'s List for 6 consecutive semesters',
      'Winner of Inter-University Hackathon 2023',
      'Published research paper on Neural Networks',
      'President of Computer Science Society',
    ],
  },
  {
    id: '2',
    institution: 'Delhi Public School',
    degree: 'Higher Secondary Certificate',
    field: 'Science (PCM)',
    startDate: '2019-04-01',
    endDate: '2021-03-31',
    gpa: 3.9,
    description: 'Completed higher secondary education with focus on Physics, Chemistry, and Mathematics.',
    achievements: [
      'School Topper in Computer Science',
      'National Science Olympiad Gold Medal',
      'Head Boy of the school',
    ],
  },
];

const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Best Student Project Award',
    description: 'Awarded for developing an AI-powered student portal',
    date: '2024-01-15',
    type: 'academic',
    icon: '🏆',
  },
  {
    id: '2',
    title: 'Google Summer of Code',
    description: 'Selected for GSoC 2023 with TensorFlow project',
    date: '2023-05-01',
    type: 'project',
    icon: '💻',
  },
  {
    id: '3',
    title: 'AWS Certified Developer',
    description: 'AWS Certified Developer - Associate certification',
    date: '2023-09-20',
    type: 'certification',
    icon: '☁️',
  },
];

export function UserProfilePage() {
  const { } = useParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'interests' | 'education' | 'achievements'>('overview');
  const [selectedSkillCategory, setSelectedSkillCategory] = useState<string | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);

  // Mock user data
  const user: User = {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex.johnson@srmap.edu.in',
    role: 'student',
    avatarUrl: '/images/avatar-placeholder.jpg',
    profile: {
      department: 'Computer Science and Engineering',
      year: 3,
      skills: mockSkills,
      interests: [
        'Artificial Intelligence', 'Machine Learning', 'Web Development', 'Mobile Apps',
        'Data Science', 'Cloud Computing', 'DevOps', 'Blockchain', 'Cybersecurity',
        'UI/UX Design', 'Game Development', 'IoT', 'Robotics', 'Computer Vision',
        'Natural Language Processing', 'Deep Learning', 'React', 'Node.js', 'Python',
        'JavaScript', 'TypeScript', 'Docker', 'Kubernetes', 'AWS', 'Firebase'
      ],
      bio: 'Passionate computer science student with a keen interest in artificial intelligence and full-stack development. Currently working on innovative projects that bridge the gap between technology and education.',
      education: mockEducation,
      achievements: mockAchievements,
      socialLinks: [
        { platform: 'github', url: 'https://github.com/alexjohnson', username: 'alexjohnson' },
        { platform: 'linkedin', url: 'https://linkedin.com/in/alexjohnson', username: 'alexjohnson' },
        { platform: 'portfolio', url: 'https://alexjohnson.dev', username: 'alexjohnson.dev' },
      ],
      location: 'Chennai, Tamil Nadu, India',
      phone: '+91 98765 43210',
    },
    preferences: {
      theme: 'dark',
      notifications: true,
    },
    createdAt: '2021-08-01T00:00:00Z',
    updatedAt: '2024-01-28T00:00:00Z',
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'student':
        return 'bg-info';
      case 'faculty':
        return 'bg-success';
      case 'admin':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'github':
        return '🐙';
      case 'linkedin':
        return '💼';
      case 'twitter':
        return '🐦';
      case 'portfolio':
        return '🌐';
      default:
        return '🔗';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'skills', label: 'Skills', icon: '🎯', badge: user?.profile.skills?.length },
    { id: 'interests', label: 'Interests', icon: '🏷️', badge: user?.profile.interests?.length },
    { id: 'education', label: 'Education', icon: '🎓', badge: user?.profile.education?.length },
    { id: 'achievements', label: 'Achievements', icon: '🏆', badge: user?.profile.achievements?.length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-textSecondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <GlassCard variant="elevated" className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Profile Info */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-4xl font-bold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-2 -right-2">
                    <Badge variant="glass" className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                  </div>
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-text mb-2">{user.name}</h1>
                  <p className="text-textSecondary text-lg mb-2">{user.email}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-textSecondary">
                    {user.profile.department && (
                      <span>📚 {user.profile.department}</span>
                    )}
                    {user.profile.year && (
                      <span>🎓 Year {user.profile.year}</span>
                    )}
                    {user.profile.location && (
                      <span>📍 {user.profile.location}</span>
                    )}
                    <span>📅 Joined {formatDate(user.createdAt)}</span>
                  </div>

                  {user.profile.bio && (
                    <p className="text-textSecondary mt-4 leading-relaxed max-w-2xl">
                      {user.profile.bio}
                    </p>
                  )}

                  {/* Social Links */}
                  {user.profile.socialLinks && user.profile.socialLinks.length > 0 && (
                    <div className="flex items-center space-x-3 mt-4">
                      {user.profile.socialLinks.map((link) => (
                        <a
                          key={link.platform}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-surface hover:bg-primary/10 rounded-lg transition-colors"
                          title={`${link.platform}: ${link.username || link.url}`}
                        >
                          <span className="text-lg">{getSocialIcon(link.platform)}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <GlowButton
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>{isEditing ? 'Save Profile' : 'Edit Profile'}</span>
                </GlowButton>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="border-b border-border">
            <nav className="flex space-x-8 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-textSecondary hover:text-text hover:border-border'
                  )}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <Badge variant="glass" size="sm" className="bg-primary">
                      {tab.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quick Stats */}
              <div className="lg:col-span-1 space-y-6">
                <GlassCard variant="subtle" className="p-6">
                  <h3 className="text-lg font-semibold text-text mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Skills:</span>
                      <span className="text-text font-medium">{user.profile.skills?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Interests:</span>
                      <span className="text-text font-medium">{user.profile.interests?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Education:</span>
                      <span className="text-text font-medium">{user.profile.education?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Achievements:</span>
                      <span className="text-text font-medium">{user.profile.achievements?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Verified Skills:</span>
                      <span className="text-success font-medium">
                        {user.profile.skills?.filter(s => s.verified).length || 0}
                      </span>
                    </div>
                  </div>
                </GlassCard>

                {/* Recent Achievements */}
                <GlassCard variant="subtle" className="p-6">
                  <h3 className="text-lg font-semibold text-text mb-4">Recent Achievements</h3>
                  <div className="space-y-3">
                    {user.profile.achievements?.slice(0, 3).map((achievement) => (
                      <div key={achievement.id} className="flex items-start space-x-3">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-text">{achievement.title}</h4>
                          <p className="text-sm text-textSecondary">{achievement.description}</p>
                          <p className="text-xs text-textSecondary mt-1">
                            {formatDate(achievement.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>

              {/* Skills Preview */}
              <div className="lg:col-span-2">
                <SkillsRadarChart
                  skills={user.profile.skills || []}
                  selectedCategory={selectedSkillCategory}
                  onCategoryChange={setSelectedSkillCategory}
                />
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <SkillsRadarChart
              skills={user.profile.skills || []}
              selectedCategory={selectedSkillCategory}
              onCategoryChange={setSelectedSkillCategory}
            />
          )}

          {activeTab === 'interests' && (
            <InterestsTagCloud
              interests={user.profile.interests || []}
              editable={isEditing}
            />
          )}

          {activeTab === 'education' && (
            <EducationTimeline
              education={user.profile.education || []}
              editable={isEditing}
            />
          )}

          {activeTab === 'achievements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {user.profile.achievements?.map((achievement) => (
                <GlassCard key={achievement.id} variant="subtle" className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-text mb-2">{achievement.title}</h3>
                      <p className="text-textSecondary text-sm mb-3">{achievement.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="glass" className="bg-secondary">
                          {achievement.type}
                        </Badge>
                        <span className="text-xs text-textSecondary">
                          {formatDate(achievement.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
ex
port { UserProfilePage };
export default UserProfilePage;