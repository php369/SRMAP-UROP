import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cohort, Course } from '../../types';
import { GlassCard, Badge, Input, GlowButton } from '../../components/ui';
import { cn } from '../../utils/cn';

// Mock data
const mockCohorts: Cohort[] = [
  {
    id: '1',
    name: 'CS 2024 Batch',
    description: 'Computer Science students admitted in 2024',
    startDate: '2024-08-01',
    endDate: '2028-05-31',
    students: [],
    faculty: [],
    courses: [],
    createdBy: 'admin1',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-28T00:00:00Z',
  },
  {
    id: '2',
    name: 'ECE 2023 Batch',
    description: 'Electronics and Communication Engineering students',
    startDate: '2023-08-01',
    endDate: '2027-05-31',
    students: [],
    faculty: [],
    courses: [],
    createdBy: 'admin1',
    createdAt: '2023-08-01T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
];

const mockCourses: Course[] = [
  {
    id: '1',
    name: 'Data Structures and Algorithms',
    code: 'CS301',
    description: 'Fundamental data structures and algorithmic techniques',
    department: 'Computer Science',
    credits: 4,
    semester: 'Fall',
    year: 2024,
    instructor: {
      id: 'faculty1',
      name: 'Dr. Smith',
      email: 'smith@srmap.edu.in',
      role: 'faculty',
      profile: { department: 'Computer Science' },
      preferences: { theme: 'dark', notifications: true },
      createdAt: '2022-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    students: [],
    assessments: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-28T00:00:00Z',
  },
  {
    id: '2',
    name: 'Machine Learning',
    code: 'CS401',
    description: 'Introduction to machine learning algorithms and applications',
    department: 'Computer Science',
    credits: 3,
    semester: 'Spring',
    year: 2024,
    instructor: {
      id: 'faculty2',
      name: 'Dr. Johnson',
      email: 'johnson@srmap.edu.in',
      role: 'faculty',
      profile: { department: 'Computer Science' },
      preferences: { theme: 'light', notifications: true },
      createdAt: '2022-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    students: [],
    assessments: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-28T00:00:00Z',
  },
];

export function CohortManagement() {
  const [cohorts, setCohorts] = useState<Cohort[]>(mockCohorts);
  const [courses] = useState<Course[]>(mockCourses);
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (cohort: Cohort) => {
    const now = new Date();
    const start = new Date(cohort.startDate);
    const end = cohort.endDate ? new Date(cohort.endDate) : null;

    if (now < start) return 'bg-warning'; // Upcoming
    if (end && now > end) return 'bg-secondary'; // Completed
    return 'bg-success'; // Active
  };

  const getStatusText = (cohort: Cohort) => {
    const now = new Date();
    const start = new Date(cohort.startDate);
    const end = cohort.endDate ? new Date(cohort.endDate) : null;

    if (now < start) return 'Upcoming';
    if (end && now > end) return 'Completed';
    return 'Active';
  };

  const filteredCohorts = cohorts.filter(cohort =>
    cohort.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cohort.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCohort = () => {
    setIsCreating(true);
    setEditingCohort({
      id: '',
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      students: [],
      faculty: [],
      courses: [],
      createdBy: 'current_admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveCohort = (cohort: Cohort) => {
    if (isCreating) {
      const newCohort = {
        ...cohort,
        id: `cohort_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCohorts(prev => [...prev, newCohort]);
    } else {
      setCohorts(prev => prev.map(c => c.id === cohort.id ? { ...cohort, updatedAt: new Date().toISOString() } : c));
    }
    setIsCreating(false);
    setEditingCohort(null);
  };

  const handleDeleteCohort = (cohortId: string) => {
    if (confirm('Are you sure you want to delete this cohort?')) {
      setCohorts(prev => prev.filter(c => c.id !== cohortId));
      if (selectedCohort?.id === cohortId) {
        setSelectedCohort(null);
      }
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Cohort Management</h1>
            <p className="text-textSecondary">
              Manage student cohorts and course assignments
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Input
              type="text"
              placeholder="Search cohorts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <GlowButton onClick={handleCreateCohort}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Cohort
            </GlowButton>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cohorts List */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <GlassCard variant="elevated" className="p-6">
                <h3 className="text-lg font-semibold text-text mb-4">
                  Cohorts ({filteredCohorts.length})
                </h3>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredCohorts.map((cohort) => (
                    <motion.div
                      key={cohort.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'p-4 rounded-lg border cursor-pointer transition-all duration-200',
                        selectedCohort?.id === cohort.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-surface/50 hover:bg-surface/70'
                      )}
                      onClick={() => setSelectedCohort(cohort)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-text">{cohort.name}</h4>
                        <Badge variant="glass" className={getStatusColor(cohort)}>
                          {getStatusText(cohort)}
                        </Badge>
                      </div>
                      
                      {cohort.description && (
                        <p className="text-sm text-textSecondary mb-2 line-clamp-2">
                          {cohort.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-textSecondary">
                        <span>{formatDate(cohort.startDate)}</span>
                        <div className="flex items-center space-x-2">
                          <span>{cohort.students.length} students</span>
                          <span>•</span>
                          <span>{cohort.courses.length} courses</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Cohort Details */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedCohort ? (
                <motion.div
                  key={selectedCohort.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Cohort Header */}
                  <GlassCard variant="elevated" className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-text mb-2">
                          {selectedCohort.name}
                        </h2>
                        <p className="text-textSecondary">
                          {selectedCohort.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="glass" className={getStatusColor(selectedCohort)}>
                          {getStatusText(selectedCohort)}
                        </Badge>
                        <button
                          onClick={() => {
                            setEditingCohort(selectedCohort);
                            setIsCreating(false);
                          }}
                          className="p-2 text-textSecondary hover:text-primary transition-colors"
                          title="Edit cohort"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteCohort(selectedCohort.id)}
                          className="p-2 text-textSecondary hover:text-error transition-colors"
                          title="Delete cohort"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-text">{selectedCohort.students.length}</div>
                        <div className="text-sm text-textSecondary">Students</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-text">{selectedCohort.faculty.length}</div>
                        <div className="text-sm text-textSecondary">Faculty</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-text">{selectedCohort.courses.length}</div>
                        <div className="text-sm text-textSecondary">Courses</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-text">
                          {selectedCohort.endDate 
                            ? Math.ceil((new Date(selectedCohort.endDate).getTime() - new Date(selectedCohort.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
                            : 'N/A'
                          }
                        </div>
                        <div className="text-sm text-textSecondary">Duration (Years)</div>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Available Courses */}
                  <GlassCard variant="elevated" className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-text">Available Courses</h3>
                      <button className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors text-sm">
                        Assign Courses
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {courses.map((course) => (
                        <div
                          key={course.id}
                          className="p-4 bg-surface/50 rounded-lg border border-border"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-text">{course.name}</h4>
                              <p className="text-sm text-textSecondary">{course.code}</p>
                            </div>
                            <Badge variant="glass" className="bg-secondary">
                              {course.credits} credits
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-textSecondary mb-3">
                            {course.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-textSecondary">
                            <span>Instructor: {course.instructor.name}</span>
                            <span>{course.semester} {course.year}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center h-96"
                >
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎓</div>
                    <h3 className="text-xl font-semibold text-text mb-2">
                      Select a Cohort
                    </h3>
                    <p className="text-textSecondary">
                      Choose a cohort from the list to view and manage its details
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Edit/Create Modal */}
        <AnimatePresence>
          {editingCohort && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => {
                setEditingCohort(null);
                setIsCreating(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-surface border border-border rounded-lg p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-text mb-4">
                  {isCreating ? 'Create New Cohort' : 'Edit Cohort'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">
                      Cohort Name *
                    </label>
                    <Input
                      type="text"
                      value={editingCohort.name}
                      onChange={(e) => setEditingCohort(prev => prev ? { ...prev, name: e.target.value } : null)}
                      placeholder="Enter cohort name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-1">
                      Description
                    </label>
                    <textarea
                      value={editingCohort.description || ''}
                      onChange={(e) => setEditingCohort(prev => prev ? { ...prev, description: e.target.value } : null)}
                      placeholder="Enter cohort description"
                      rows={3}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary resize-vertical"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-1">
                        Start Date *
                      </label>
                      <Input
                        type="date"
                        value={editingCohort.startDate}
                        onChange={(e) => setEditingCohort(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-1">
                        End Date
                      </label>
                      <Input
                        type="date"
                        value={editingCohort.endDate || ''}
                        onChange={(e) => setEditingCohort(prev => prev ? { ...prev, endDate: e.target.value } : null)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setEditingCohort(null);
                      setIsCreating(false);
                    }}
                    className="px-4 py-2 text-textSecondary hover:text-text transition-colors"
                  >
                    Cancel
                  </button>
                  <GlowButton
                    onClick={() => editingCohort && handleSaveCohort(editingCohort)}
                    disabled={!editingCohort?.name || !editingCohort?.startDate}
                  >
                    {isCreating ? 'Create' : 'Save'}
                  </GlowButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
