export type WindowType = 'proposal' | 'application' | 'submission' | 'assessment' | 'grade_release';
export type ProjectType = 'IDP' | 'UROP' | 'CAPSTONE';
export type AssessmentType = 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External';

export interface Window {
  _id: string;
  windowType: WindowType;
  projectType: ProjectType;
  assessmentType?: AssessmentType;
  startDate: string;
  endDate: string;
}

export interface WindowForm {
  windowTypes: WindowType[];
  projectTypes: ProjectType[];
  assessmentType: AssessmentType | '';
  startDate: string;
  endDate: string;
  useCommonDates: boolean;
  individualDates: Record<string, { startDate: string; endDate: string }>;
  bulkSettings: {
    proposal: {
      startDate: string;
      endDate: string;
    };
    application: {
      startDate: string;
      endDate: string;
    };
    cla1: {
      submissionStart: string;
      submissionEnd: string;
      assessmentStart: string;
      assessmentEnd: string;
    };
    cla2: {
      submissionStart: string;
      submissionEnd: string;
      assessmentStart: string;
      assessmentEnd: string;
    };
    cla3: {
      submissionStart: string;
      submissionEnd: string;
      assessmentStart: string;
      assessmentEnd: string;
    };
    external: {
      submissionStart: string;
      submissionEnd: string;
      assessmentStart: string;
      assessmentEnd: string;
    };
    gradeRelease: {
      startDate: string;
      endDate: string;
    };
  };
}

export interface Stats {
  overview: {
    totalProjects: number;
    totalGroups: number;
    totalApplications: number;
    pendingApplications: number;
    activeWindows: number;
    averageGroupSize: number;
    evaluationProgress: {
      completed: number;
      total: number;
      percentage: number;
    };
    meetingCompletionRate: {
      completed: number;
      total: number;
      percentage: number;
    };
    upcomingDeadlines: Array<{
      _id: string;
      title: string;
      date: string;
      startDate: string;
      status: 'active' | 'upcoming';
      daysLeft: number;
    }>;
  };
  breakdown: {
    projectsByType: Array<{ _id: string; count: number }>;
    applicationsByStatus: Array<{ _id: string; count: number }>;
    submissionsByAssessment: Array<{ _id: string; count: number }>;
  };
}

export interface WindowCombination {
  key: string;
  windowType: WindowType;
  projectType: ProjectType;
  label: string;
}

export interface ValidationResult {
  disabled: boolean;
  reason?: string;
  window?: Window;
  status?: 'active' | 'upcoming';
}

export interface SequentialValidationResult {
  valid: boolean;
  reason?: string;
}

// External Evaluator Types
export interface ExternalEvaluator {
  _id: string;
  name: string;
  email: string;
  assignmentCount: number;
  isExternalEvaluator: boolean;
}

export interface ExternalEvaluatorAssignment {
  _id: string;
  submissionType: 'group' | 'solo';
  groupId?: {
    _id: string;
    groupCode: string;
    members: Array<{
      _id: string;
      name: string;
      email: string;
    }>;
    assignedProjectId?: {
      _id: string;
      title: string;
      projectId: string;
      type: string;
      brief: string;
      facultyName: string;
    };
    assignedFacultyId?: {
      _id: string;
      name: string;
      email: string;
    };
    externalEvaluatorId?: {
      _id: string;
      name: string;
      email: string;
    };
  };
  studentId?: {
    _id: string;
    name: string;
    email: string;
    assignedProjectId?: {
      _id: string;
      title: string;
      projectId: string;
      type: string;
      brief: string;
      facultyName: string;
    };
    assignedFacultyId?: {
      _id: string;
      name: string;
      email: string;
    };
  };
  projectId?: {
    _id: string;
    title: string;
    projectType: string;
  };
  internalFaculty?: {
    _id: string;
    name: string;
    email: string;
  };
  externalEvaluator?: {
    _id: string;
    name: string;
    email: string;
  };
  hasConflict?: boolean;
  isAssigned: boolean;
}