import { Window } from '../utils/windowChecker';

export type AssessmentType = 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External';

/**
 * Get the currently active assessment type for a project type (for faculty grading)
 */
export function getCurrentAssessmentType(
  windows: Window[], 
  projectType: 'IDP' | 'UROP' | 'CAPSTONE'
): AssessmentType | null {
  const now = new Date();
  
  // Find active assessment windows for the project type
  const activeAssessmentWindows = windows.filter(window => 
    window.windowType === 'assessment' &&
    window.projectType === projectType &&
    window.assessmentType &&
    new Date(window.startDate) <= now &&
    new Date(window.endDate) >= now
  );

  // Return the first active assessment type (there should typically be only one)
  return activeAssessmentWindows.length > 0 
    ? activeAssessmentWindows[0].assessmentType as AssessmentType
    : null;
}

/**
 * Get the currently active submission assessment type for a project type (for student submissions)
 * Returns null if no active submission window exists for the project type
 */
export function getCurrentSubmissionAssessmentType(
  windows: Window[], 
  projectType: 'IDP' | 'UROP' | 'CAPSTONE'
): AssessmentType | null {
  const now = new Date();
  
  // Find active submission windows for the project type
  const activeSubmissionWindows = windows.filter(window => 
    window.windowType === 'submission' &&
    window.projectType === projectType &&
    window.assessmentType &&
    new Date(window.startDate) <= now &&
    new Date(window.endDate) >= now
  );

  // Return the first active submission assessment type, or null if none found
  return activeSubmissionWindows.length > 0 
    ? activeSubmissionWindows[0].assessmentType as AssessmentType
    : null;
}

/**
 * Get all currently active assessment types for a project type
 */
export function getActiveAssessmentTypes(
  windows: Window[], 
  projectType: 'IDP' | 'UROP' | 'CAPSTONE'
): AssessmentType[] {
  const now = new Date();
  
  const activeAssessmentWindows = windows.filter(window => 
    window.windowType === 'assessment' &&
    window.projectType === projectType &&
    window.assessmentType &&
    new Date(window.startDate) <= now &&
    new Date(window.endDate) >= now
  );

  return activeAssessmentWindows.map(w => w.assessmentType as AssessmentType);
}

/**
 * Check if a specific assessment type is currently active
 */
export function isAssessmentTypeActive(
  windows: Window[], 
  projectType: 'IDP' | 'UROP' | 'CAPSTONE',
  assessmentType: AssessmentType
): boolean {
  const now = new Date();
  
  return windows.some(window => 
    window.windowType === 'assessment' &&
    window.projectType === projectType &&
    window.assessmentType === assessmentType &&
    new Date(window.startDate) <= now &&
    new Date(window.endDate) >= now
  );
}

/**
 * Get user-friendly display name for assessment type
 */
export function getAssessmentTypeDisplayName(assessmentType: AssessmentType): string {
  const displayNames: Record<AssessmentType, string> = {
    'CLA-1': 'CLA-1 - Project Proposal',
    'CLA-2': 'CLA-2 - Progress Review', 
    'CLA-3': 'CLA-3 - Final Implementation',
    'External': 'External Evaluation'
  };
  
  return displayNames[assessmentType];
}

/**
 * Determine the next assessment type based on existing submissions/evaluations
 * This is useful when no active submission window exists but we need to determine
 * what the next logical assessment type should be
 */
export function getNextLogicalAssessmentType(
  existingAssessmentTypes: AssessmentType[]
): AssessmentType {
  const sequence: AssessmentType[] = ['CLA-1', 'CLA-2', 'CLA-3', 'External'];
  
  // If no existing assessments, start with CLA-1
  if (existingAssessmentTypes.length === 0) {
    return 'CLA-1';
  }
  
  // Find the highest completed assessment type
  let highestIndex = -1;
  for (const type of existingAssessmentTypes) {
    const index = sequence.indexOf(type);
    if (index > highestIndex) {
      highestIndex = index;
    }
  }
  
  // Return next in sequence, or External if all are done
  return highestIndex < sequence.length - 1 
    ? sequence[highestIndex + 1] 
    : 'External';
}

/**
 * Get assessment type color for UI display
 */
export function getAssessmentTypeColor(assessmentType: AssessmentType): string {
  const colors: Record<AssessmentType, string> = {
    'CLA-1': 'bg-blue-100 text-blue-800',
    'CLA-2': 'bg-yellow-100 text-yellow-800',
    'CLA-3': 'bg-green-100 text-green-800',
    'External': 'bg-purple-100 text-purple-800'
  };
  
  return colors[assessmentType];
}

/**
 * Get assessment type progress percentage (for UI progress bars)
 */
export function getAssessmentTypeProgress(assessmentType: AssessmentType): number {
  const progress: Record<AssessmentType, number> = {
    'CLA-1': 25,
    'CLA-2': 50,
    'CLA-3': 75,
    'External': 100
  };
  
  return progress[assessmentType];
}

/**
 * Check if submission is open for a specific assessment type
 */
export function isSubmissionOpenForAssessmentType(
  windows: Window[], 
  projectType: 'IDP' | 'UROP' | 'CAPSTONE',
  assessmentType: AssessmentType
): boolean {
  const now = new Date();
  
  return windows.some(window => 
    window.windowType === 'submission' &&
    window.projectType === projectType &&
    window.assessmentType === assessmentType &&
    new Date(window.startDate) <= now &&
    new Date(window.endDate) >= now
  );
}

/**
 * Get assessment type component mapping for score updates
 */
export function getAssessmentTypeComponent(assessmentType: AssessmentType): 'cla1' | 'cla2' | 'cla3' | null {
  const componentMap: Record<AssessmentType, 'cla1' | 'cla2' | 'cla3' | null> = {
    'CLA-1': 'cla1',
    'CLA-2': 'cla2',
    'CLA-3': 'cla3',
    'External': null // External doesn't map to internal components
  };
  
  return componentMap[assessmentType];
}

/**
 * Validate assessment type transition (ensure proper sequence)
 */
export function isValidAssessmentTypeTransition(
  fromType: AssessmentType | null, 
  toType: AssessmentType
): boolean {
  if (!fromType) return toType === 'CLA-1'; // First assessment should be CLA-1
  
  const sequence: AssessmentType[] = ['CLA-1', 'CLA-2', 'CLA-3', 'External'];
  const fromIndex = sequence.indexOf(fromType);
  const toIndex = sequence.indexOf(toType);
  
  // Allow same type (re-evaluation) or next in sequence
  return toIndex === fromIndex || toIndex === fromIndex + 1;
}