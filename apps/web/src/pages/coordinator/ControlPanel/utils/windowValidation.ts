import { WindowType, ProjectType, AssessmentType, Window, ValidationResult, SequentialValidationResult } from '../types';
import { getWorkflowPrerequisites } from './windowHelpers';

// Check if a window combination already exists (active or upcoming)
export const isWindowCombinationDisabled = (
  windowType: WindowType, 
  projectType: ProjectType, 
  assessmentType: AssessmentType | undefined,
  windows: Window[],
  editingWindow?: Window | null
): ValidationResult => {
  const now = new Date();
  
  // Find existing windows that are active or upcoming for this combination
  const existingWindow = windows.find(window => {
    const end = new Date(window.endDate);
    const isActiveOrUpcoming = now <= end; // Active (now between start-end) or upcoming (now < start)
    
    // Skip the window being edited to allow updates
    if (editingWindow && window._id === editingWindow._id) {
      return false;
    }
    
    return window.windowType === windowType &&
           window.projectType === projectType &&
           window.assessmentType === assessmentType &&
           isActiveOrUpcoming;
  });

  if (existingWindow) {
    const start = new Date(existingWindow.startDate);
    const end = new Date(existingWindow.endDate);
    const isActive = now >= start && now <= end;
    
    return {
      disabled: true,
      reason: isActive ? 'Active window exists' : 'Upcoming window exists',
      window: existingWindow,
      status: isActive ? 'active' : 'upcoming'
    };
  }

  return { disabled: false };
};

// Enhanced sequential window validation
export const validateSequentialWindows = (
  windowType: WindowType, 
  projectType: ProjectType, 
  assessmentType: AssessmentType | undefined, 
  proposedStartDate: Date | undefined,
  windows: Window[]
): SequentialValidationResult => {
  const now = new Date();
  
  // For proposal windows, check if there's already an active IDP proposal
  if (windowType === 'proposal' && projectType !== 'IDP') {
    const activeIdpProposal = windows.find(w => 
      w.windowType === 'proposal' && 
      w.projectType === 'IDP' && 
      now >= new Date(w.startDate) && 
      now <= new Date(w.endDate)
    );
    
    if (activeIdpProposal && proposedStartDate) {
      const idpEndDate = new Date(activeIdpProposal.endDate);
      if (proposedStartDate <= idpEndDate) {
        return {
          valid: false,
          reason: `${projectType} proposal must start after IDP proposal ends (${idpEndDate.toLocaleDateString()})`
        };
      }
    }
  }

  // For application windows, ensure proposal window has ended
  if (windowType === 'application') {
    const proposalWindow = windows.find(w => 
      w.windowType === 'proposal' && 
      w.projectType === projectType
    );
    
    if (!proposalWindow) {
      return {
        valid: false,
        reason: `Proposal window for ${projectType} must be created first`
      };
    }
    
    if (proposedStartDate) {
      const proposalEndDate = new Date(proposalWindow.endDate);
      if (proposedStartDate <= proposalEndDate) {
        return {
          valid: false,
          reason: `Application window must start after proposal window ends (${proposalEndDate.toLocaleDateString()})`
        };
      }
    }
  }

  // For submission windows, ensure application window has ended
  if (windowType === 'submission') {
    const applicationWindow = windows.find(w => 
      w.windowType === 'application' && 
      w.projectType === projectType
    );
    
    if (!applicationWindow) {
      return {
        valid: false,
        reason: `Application window for ${projectType} must be created first`
      };
    }
    
    if (proposedStartDate) {
      const applicationEndDate = new Date(applicationWindow.endDate);
      if (proposedStartDate <= applicationEndDate) {
        return {
          valid: false,
          reason: `Submission window must start after application window ends (${applicationEndDate.toLocaleDateString()})`
        };
      }
    }

    // For CLA assessments, ensure sequential order
    if (assessmentType && assessmentType !== 'CLA-1') {
      const claOrder: AssessmentType[] = ['CLA-1', 'CLA-2', 'CLA-3', 'External'];
      const currentIndex = claOrder.indexOf(assessmentType);
      
      if (currentIndex > 0) {
        const previousAssessment = claOrder[currentIndex - 1];
        const previousSubmissionWindow = windows.find(w => 
          w.windowType === 'submission' && 
          w.projectType === projectType &&
          w.assessmentType === previousAssessment
        );
        
        if (!previousSubmissionWindow) {
          return {
            valid: false,
            reason: `${previousAssessment} submission window must be created first`
          };
        }
        
        if (proposedStartDate) {
          const previousEndDate = new Date(previousSubmissionWindow.endDate);
          if (proposedStartDate <= previousEndDate) {
            return {
              valid: false,
              reason: `${assessmentType} submission must start after ${previousAssessment} submission ends (${previousEndDate.toLocaleDateString()})`
            };
          }
        }
      }
    }
  }

  // For assessment windows, ensure submission window has ended
  if (windowType === 'assessment') {
    const submissionWindow = windows.find(w => 
      w.windowType === 'submission' && 
      w.projectType === projectType &&
      w.assessmentType === assessmentType
    );
    
    if (!submissionWindow) {
      return {
        valid: false,
        reason: `Submission window for ${projectType} ${assessmentType || ''} must be created first`
      };
    }
    
    if (proposedStartDate) {
      const submissionEndDate = new Date(submissionWindow.endDate);
      if (proposedStartDate <= submissionEndDate) {
        return {
          valid: false,
          reason: `Assessment window must start after submission window ends (${submissionEndDate.toLocaleDateString()})`
        };
      }
    }
  }

  // For grade release, ensure all assessments are completed
  if (windowType === 'grade_release') {
    const requiredAssessments: AssessmentType[] = ['CLA-1', 'CLA-2', 'CLA-3', 'External'];
    
    for (const assessment of requiredAssessments) {
      const assessmentWindow = windows.find(w => 
        w.windowType === 'assessment' && 
        w.projectType === projectType &&
        w.assessmentType === assessment
      );
      
      if (!assessmentWindow) {
        return {
          valid: false,
          reason: `All assessment windows (${requiredAssessments.join(', ')}) must be completed before grade release`
        };
      }
      
      if (proposedStartDate) {
        const assessmentEndDate = new Date(assessmentWindow.endDate);
        if (proposedStartDate <= assessmentEndDate) {
          return {
            valid: false,
            reason: `Grade release must start after all assessments end. ${assessment} ends on ${assessmentEndDate.toLocaleDateString()}`
          };
        }
      }
    }
  }

  return { valid: true };
};

// Validate individual window creation against existing windows in database
export const validateIndividualWindowCreation = (
  windowType: WindowType, 
  projectType: ProjectType, 
  assessmentType: AssessmentType | '', 
  startDate: string, 
  endDate: string,
  windows: Window[],
  editingWindow?: Window | null
): string[] => {
  const errors: string[] = [];
  const now = new Date();
  const proposedStart = new Date(startDate);
  const proposedEnd = new Date(endDate);

  // Basic date validation
  if (proposedEnd <= proposedStart) {
    errors.push('End date must be after start date');
  }

  if (proposedStart <= now) {
    errors.push('Start date must be in the future');
  }

  // Get existing windows for this project type
  const existingWindows = windows.filter(w => w.projectType === projectType);
  
  // Check for overlaps with existing windows
  for (const existingWindow of existingWindows) {
    const existingStart = new Date(existingWindow.startDate);
    const existingEnd = new Date(existingWindow.endDate);
    
    // Skip if it's the same window being edited
    if (editingWindow && existingWindow._id === editingWindow._id) {
      continue;
    }
    
    // Check for overlap
    if (proposedStart < existingEnd && proposedEnd > existingStart) {
      errors.push(`Overlaps with existing ${existingWindow.windowType.replace('_', ' ')} window (${existingStart.toLocaleDateString()} - ${existingEnd.toLocaleDateString()})`);
    }
  }

  // Workflow sequence validation
  const workflowOrder: WindowType[] = ['proposal', 'application', 'submission', 'assessment', 'grade_release'];
  const currentIndex = workflowOrder.indexOf(windowType);
  
  if (currentIndex > 0) {
    // Check if previous workflow steps exist and have ended
    for (let i = 0; i < currentIndex; i++) {
      const requiredWindowType = workflowOrder[i];
      let requiredWindow;
      
      if (requiredWindowType === 'submission' || requiredWindowType === 'assessment') {
        // For assessment phases, need to check specific assessment types
        if (assessmentType) {
          requiredWindow = existingWindows.find(w => 
            w.windowType === requiredWindowType && 
            w.assessmentType === assessmentType
          );
        }
      } else {
        requiredWindow = existingWindows.find(w => w.windowType === requiredWindowType);
      }
      
      if (!requiredWindow) {
        errors.push(`${requiredWindowType.replace('_', ' ')} window must be created first`);
      } else {
        const requiredEnd = new Date(requiredWindow.endDate);
        if (proposedStart <= requiredEnd) {
          errors.push(`Must start after ${requiredWindowType.replace('_', ' ')} window ends (${requiredEnd.toLocaleDateString()})`);
        }
      }
    }
  }

  // For assessment types, check sequential order
  if ((windowType === 'submission' || windowType === 'assessment') && assessmentType) {
    const assessmentOrder: AssessmentType[] = ['CLA-1', 'CLA-2', 'CLA-3', 'External'];
    const assessmentIndex = assessmentOrder.indexOf(assessmentType as AssessmentType);
    
    if (assessmentIndex > 0) {
      for (let i = 0; i < assessmentIndex; i++) {
        const prevAssessmentType = assessmentOrder[i];
        const prevWindow = existingWindows.find(w => 
          w.windowType === windowType && 
          w.assessmentType === prevAssessmentType
        );
        
        if (!prevWindow) {
          errors.push(`${prevAssessmentType} ${windowType} window must be created first`);
        } else {
          const prevEnd = new Date(prevWindow.endDate);
          if (proposedStart <= prevEnd) {
            errors.push(`Must start after ${prevAssessmentType} ${windowType} ends (${prevEnd.toLocaleDateString()})`);
          }
        }
      }
    }
  }

  return errors;
};

// Helper function to check if a window type is available based on existing windows
export const isWindowTypeAvailable = (
  windowType: WindowType, 
  projectType: ProjectType, 
  assessmentType: string | undefined,
  windows: Window[],
  editingWindow?: Window | null
): boolean => {
  if (editingWindow) return true; // Allow editing existing windows

  const prerequisites = getWorkflowPrerequisites(windowType, assessmentType);
  
  // Check if all prerequisites exist in the database
  for (const prereq of prerequisites) {
    if (prereq.includes('-')) {
      // This is a specific assessment type prerequisite
      const [prereqWindowType, prereqAssessmentType] = prereq.split('-');
      const hasPrereq = windows.some(w => 
        w.windowType === prereqWindowType && 
        w.projectType === projectType && 
        w.assessmentType === prereqAssessmentType
      );
      if (!hasPrereq) return false;
    } else {
      // This is a general window type prerequisite
      const hasPrereq = windows.some(w => 
        w.windowType === prereq && 
        w.projectType === projectType
      );
      if (!hasPrereq) return false;
    }
  }

  return true;
};