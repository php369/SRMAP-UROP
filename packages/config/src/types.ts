// Shared TypeScript types
export interface User {
  id: string;
  googleId: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  avatarUrl?: string;
  profile: {
    department?: string;
    year?: number;
    skills?: string[];
    bio?: string;
  };
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Assessment {
  id: string;
  courseId: string;
  facultyId: string;
  title: string;
  description: string;
  dueAt: Date;
  meetUrl?: string;
  calendarEventId?: string;
  visibility: {
    cohortIds: string[];
    courseIds: string[];
  };
  settings: {
    allowLateSubmissions: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  status: 'draft' | 'published' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Submission {
  id: string;
  assessmentId: string;
  studentId: string;
  files: FileMetadata[];
  notes?: string;
  submittedAt: Date;
  status: 'submitted' | 'graded' | 'returned';
  metadata: {
    ipAddress: string;
    userAgent: string;
    fileCount: number;
    totalSize: number;
  };
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface Grade {
  id: string;
  submissionId: string;
  facultyId: string;
  score: number;
  maxScore: number;
  rubric?: {
    criteria: string;
    points: number;
    feedback: string;
  }[];
  comments: string;
  gradedAt: Date;
  history: GradeHistory[];
}

export interface GradeHistory {
  score: number;
  comments: string;
  gradedAt: Date;
  gradedBy: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}