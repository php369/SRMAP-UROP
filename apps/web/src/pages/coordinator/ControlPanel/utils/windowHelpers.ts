import { WindowType, AssessmentType } from '../types';

// Define workflow order for sorting windows
export const getWorkflowOrder = (windowType: WindowType, assessmentType?: string): number => {
  const baseOrder = {
    'proposal': 1,
    'application': 2,
    'grade_release': 99
  };

  // Handle submission and assessment pairs in correct sequence
  if (windowType === 'submission' || windowType === 'assessment') {
    const assessmentOrder = {
      'CLA-1': 3,
      'CLA-2': 5,
      'CLA-3': 7,
      'External': 9
    };
    
    if (assessmentType && assessmentOrder[assessmentType as keyof typeof assessmentOrder]) {
      const baseAssessmentOrder = assessmentOrder[assessmentType as keyof typeof assessmentOrder];
      // Submission comes first (3, 5, 7, 9), then assessment (+1: 4, 6, 8, 10)
      return windowType === 'submission' ? baseAssessmentOrder : baseAssessmentOrder + 1;
    }
    
    return 50; // Fallback for unknown assessment types
  }

  return baseOrder[windowType] || 999;
};

// Helper function to get workflow prerequisites for a window type
export const getWorkflowPrerequisites = (windowType: WindowType, assessmentType?: string): string[] => {
  const workflow: Record<WindowType, string[]> = {
    'proposal': [],
    'application': ['proposal'],
    'submission': ['proposal', 'application'],
    'assessment': ['proposal', 'application', 'submission'],
    'grade_release': ['proposal', 'application', 'submission', 'assessment']
  };

  let prerequisites: string[] = [...(workflow[windowType] || [])];

  // For CLA assessments, need to check sequential order
  if ((windowType === 'submission' || windowType === 'assessment') && assessmentType) {
    const claOrder: AssessmentType[] = ['CLA-1', 'CLA-2', 'CLA-3', 'External'];
    const currentIndex = claOrder.indexOf(assessmentType as AssessmentType);
    
    if (currentIndex > 0) {
      // Need previous CLA stages to be completed
      for (let i = 0; i < currentIndex; i++) {
        const prevAssessment = claOrder[i];
        if (prevAssessment) {
          prerequisites.push(`${windowType}-${prevAssessment}`);
        }
      }
    }
  }

  return prerequisites;
};

// Helper function to get available assessment types for submission/assessment
export const getAvailableAssessmentTypes = (windowType: WindowType, projectType: string, isWindowTypeAvailable: (wt: WindowType, pt: string, at?: string) => boolean) => {
  if (windowType !== 'submission' && windowType !== 'assessment') return [];

  const allTypes = ['CLA-1', 'CLA-2', 'CLA-3', 'External'];
  const availableTypes = [];

  for (const assessmentType of allTypes) {
    if (isWindowTypeAvailable(windowType, projectType, assessmentType)) {
      availableTypes.push(assessmentType);
    }
  }

  return availableTypes;
};

// Check window status
export const getWindowStatus = (window: any) => {
  const now = new Date();
  const start = new Date(window.startDate);
  const end = new Date(window.endDate);
  
  const isActive = now >= start && now <= end;
  const hasEnded = now > end;
  const isUpcoming = now < start;
  
  return { isActive, hasEnded, isUpcoming };
};