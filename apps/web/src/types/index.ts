// Core API types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'coordinator' | 'admin';
  avatarUrl?: string;
  profile: {
    department?: string;
    year?: number;
    skills?: UserSkill[];
    interests?: string[];
    bio?: string;
    education?: EducationEntry[];
    achievements?: Achievement[];
    socialLinks?: SocialLink[];
    location?: string;
    phone?: string;
  };
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserSkill {
  name: string;
  level: number; // 1-10 scale
  category: 'technical' | 'soft' | 'language' | 'domain';
  verified?: boolean;
  endorsements?: number;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  gpa?: number;
  description?: string;
  achievements?: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'academic' | 'project' | 'competition' | 'certification' | 'other';
  icon?: string;
  url?: string;
}

export interface SocialLink {
  platform: 'github' | 'linkedin' | 'twitter' | 'portfolio' | 'other';
  url: string;
  username?: string;
}

// Admin and Management types

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  timestamp: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}


export interface UserManagementFilter {
  role?: User['role'][];
  department?: string[];
  status?: ('active' | 'inactive' | 'suspended')[];
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface BulkUserAction {
  action: 'activate' | 'deactivate' | 'suspend' | 'delete' | 'changeRole';
  userIds: string[];
  parameters?: {
    newRole?: User['role'];
    reason?: string;
  };
}

// Reporting types
export interface ReportFilter {
  dateRange: {
    start: string;
    end: string;
  };
  assessments?: string[];
  departments?: string[];
  userRoles?: User['role'][];
  submissionStatus?: ('submitted' | 'graded' | 'late' | 'missing')[];
}

export interface SubmissionReport {
  id: string;
  studentName: string;
  studentEmail: string;
  assessmentTitle: string;
  submittedAt?: string;
  gradedAt?: string;
  score?: number;
  maxScore: number;
  status: 'submitted' | 'graded' | 'late' | 'missing';
  gradingLatency?: number; // hours between submission and grading
  attempt: number;
  facultyName?: string;
}

export interface GradingLatencyReport {
  facultyId: string;
  facultyName: string;
  department: string;
  totalSubmissions: number;
  gradedSubmissions: number;
  averageLatency: number; // in hours
  medianLatency: number;
  maxLatency: number;
  pendingSubmissions: number;
}



export interface SystemUsageReport {
  date: string;
  activeUsers: number;
  totalLogins: number;
  newSubmissions: number;
  gradesGiven: number;
  assessmentsCreated: number;
  storageUsed: number;
}

export interface ExportProgress {
  id: string;
  type: 'csv' | 'excel' | 'pdf';
  status: 'preparing' | 'generating' | 'completed' | 'failed';
  progress: number; // 0-100
  totalRecords: number;
  processedRecords: number;
  downloadUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Theme types
export type ThemeMode = 'light' | 'dark';

export interface ColorScheme {
  bg: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  highlight: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  hover: string;
  active: string;
  focus: string;
  glass: string;
  glassBorder: string;
}

export interface ThemeConfig {
  mode: ThemeMode;
  colors: ColorScheme;
}

export interface ThemeContextType {
  theme: ThemeConfig;
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isLoading: boolean;
}

// Auth types
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  code: string;
  state?: string;
}

export interface NotificationData {
  id: string;
  type: 'submission' | 'grade' | 'assessment' | 'system';
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'normal' | 'high';
  timestamp: string;
  read?: boolean;
}

// Grading and Submission types
export interface SubmissionFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface Submission {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string;
  status: 'submitted' | 'graded' | 'late' | 'missing' | 'draft';
  files: SubmissionFile[];
  notes?: string;
  attempt: number;
  maxAttempts: number;
  dueDate: string;
  course: string;
  maxScore: number;
  score?: number;
  feedback?: string;
  grade?: Grade;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  id: string;
  name: string;
  description: string;
  points: number;
}

export interface RubricScore {
  criterionId: string;
  levelId: string;
  points: number;
  customPoints?: number;
  comments?: string;
}

export interface GradeHistory {
  id: string;
  gradedAt: string;
  gradedBy: string;
  gradedByName: string;
  score: number;
  maxScore: number;
  feedback: string;
  rubricScores: RubricScore[];
  privateNotes?: string;
  version: number;
  action: 'created' | 'updated' | 'revised';
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface Grade {
  id: string;
  submissionId: string;
  facultyId: string;
  facultyName: string;
  score: number;
  maxScore: number;
  feedback: string;
  rubricScores: RubricScore[];
  privateNotes?: string;
  gradedAt: string;
  updatedAt: string;
  version: number;
  history: GradeHistory[];
}

export interface GradingData {
  score: number;
  feedback: string;
  rubricScores: RubricScore[];
  privateNotes?: string;
}

// Project Management types
export interface Project {
  _id: string;
  title: string;
  brief: string;
  description?: string;
  type: 'IDP' | 'UROP' | 'CAPSTONE';
  department: string;
  prerequisites?: string;
  facultyId: string;
  facultyName: string;
  capacity?: number;
  status: 'draft' | 'pending' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  _id: string;
  code: string;
  type: 'IDP' | 'UROP' | 'CAPSTONE';
  memberIds: User[];
  projectId?: Project;
  facultyId?: User;
  meetUrl?: string;
  calendarEventId?: string;
  status: 'forming' | 'applied' | 'approved' | 'rejected' | 'frozen';
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  _id: string;
  groupId: Group;
  choices: Project[];
  state: 'pending' | 'approved' | 'rejected';
  decidedBy?: User;
  decidedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectLegacy {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  tags: string[];
  assignedTo: User[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  completedAt?: string;
  progress: number; // 0-100
  artifacts: ProjectArtifact[];
  timeline: ProjectTimelineEvent[];
  collaborators: ProjectCollaborator[];
  coverImage?: string;
  color?: string;
}

export interface ProjectArtifact {
  id: string;
  name: string;
  type: 'document' | 'image' | 'video' | 'code' | 'link' | 'other';
  url: string;
  size?: number;
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
  thumbnail?: string;
}

export interface ProjectTimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: 'milestone' | 'task' | 'meeting' | 'deadline' | 'note';
  status: 'completed' | 'in-progress' | 'pending' | 'cancelled';
  assignedTo?: string[];
  duration?: number; // in hours
}

export interface ProjectCollaborator {
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
  avatarUrl?: string;
  permissions: string[];
}

export interface ProjectFilter {
  status?: Project['status'][];
  type?: Project['type'][];
  department?: string[];
  search?: string;
}

export interface ProjectLegacyFilter {
  status?: ProjectLegacy['status'][];
  priority?: ProjectLegacy['priority'][];
  category?: string[];
  tags?: string[];
  assignedTo?: string[];
  createdBy?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

// Group Submission types
export interface GroupSubmissionFile {
  url: string;
  name: string;
  size: number;
  contentType: string;
  storagePath: string;
}

export interface GroupSubmission {
  _id: string;
  groupId: string;
  githubUrl: string;
  reportFile?: GroupSubmissionFile;
  presentationFile?: GroupSubmissionFile;
  presentationUrl?: string;
  comments?: string;
  submittedAt: string;
  submittedBy: User;
  status: 'submitted';
  metadata: {
    ipAddress: string;
    userAgent: string;
    totalFileSize: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupSubmissionData {
  groupId: string;
  githubUrl: string;
  reportFile?: File;
  presentationFile?: File;
  presentationUrl?: string;
  comments?: string;
}

export interface SubmissionEligibility {
  canSubmit: boolean;
  reason?: string;
}
