/**
 * Utility functions for checking window status
 */

export interface Window {
  _id: string;
  windowType: 'proposal' | 'application' | 'submission' | 'assessment' | 'grade_release';
  projectType: 'IDP' | 'UROP' | 'CAPSTONE';
  assessmentType?: 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External';
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
}

/**
 * Check if a window is currently active
 */
export function isWindowActive(window: Window): boolean {
  const now = new Date();
  const start = new Date(window.startDate);
  const end = new Date(window.endDate);
  
  return now >= start && now <= end;
}

/**
 * Get window status message
 */
export function getWindowStatusMessage(
  windowType: string,
  isActive: boolean,
  startDate?: Date | string,
  endDate?: Date | string
): string {
  if (isActive) {
    return `${windowType} window is open`;
  }
  
  if (startDate && new Date(startDate) > new Date()) {
    return `${windowType} window opens on ${new Date(startDate).toLocaleDateString()}`;
  }
  
  if (endDate && new Date(endDate) < new Date()) {
    return `${windowType} window has closed`;
  }
  
  return `${windowType} window is not open`;
}

/**
 * Get time remaining in window
 */
export function getTimeRemaining(endDate: Date | string): string {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) return 'Closed';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} remaining`;
  }
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  }
  
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
}

/**
 * Check if user can perform action based on window status
 */
export function canPerformAction(
  actionType: 'submit' | 'apply' | 'propose' | 'grade',
  windows: Window[],
  projectType: 'IDP' | 'UROP' | 'CAPSTONE',
  assessmentType?: 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External'
): boolean {
  const windowTypeMap: Record<string, string> = {
    submit: 'submission',
    apply: 'application',
    propose: 'proposal',
    grade: 'assessment'
  };
  
  const windowType = windowTypeMap[actionType];
  
  const relevantWindow = windows.find(w => 
    w.windowType === windowType &&
    w.projectType === projectType &&
    (!assessmentType || w.assessmentType === assessmentType)
  );
  
  return relevantWindow ? isWindowActive(relevantWindow) : false;
}
