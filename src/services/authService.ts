import { Eligibility, IEligibility } from '../models/Eligibility';
import { FacultyRoster, IFacultyRoster } from '../models/FacultyRoster';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export interface AuthResult {
  isAuthorized: boolean;
  role: 'student' | 'faculty' | 'coordinator' | 'admin';
  error?: {
    code: string;
    message: string;
    guidance?: string;
  };
  eligibility?: IEligibility;
  facultyInfo?: IFacultyRoster;
}

/**
 * Check if user is authorized based on eligibility and faculty roster
 * @param email - User email address
 * @returns Authorization result with role and error details
 */
export async function checkUserAuthorization(email: string): Promise<AuthResult> {
  try {
    // Check if user is admin
    if (config.ADMIN_EMAIL && email === config.ADMIN_EMAIL) {
      logger.info(`Admin access granted for: ${email}`);
      return {
        isAuthorized: true,
        role: 'admin'
      };
    }

    // Check faculty roster first
    const facultyInfo = await FacultyRoster.findOne({ 
      email: email.toLowerCase(),
      active: true 
    }) as IFacultyRoster | null;

    if (facultyInfo) {
      const role = facultyInfo.isCoordinator ? 'coordinator' : 'faculty';
      logger.info(`Faculty access granted for: ${email} (${role})`);
      return {
        isAuthorized: true,
        role,
        facultyInfo
      };
    }

    // Check student eligibility for active term
    const currentDate = new Date();
    const eligibility = await Eligibility.findOne({
      studentEmail: email.toLowerCase(),
      validFrom: { $lte: currentDate },
      validTo: { $gte: currentDate }
    }) as IEligibility | null;

    if (eligibility) {
      logger.info(`Student access granted for: ${email} (${eligibility.type})`);
      return {
        isAuthorized: true,
        role: 'student',
        eligibility
      };
    }

    // User not found in any roster - provide guidance based on email pattern
    const guidance = generateGuidanceMessage(email);
    
    logger.warn(`Access denied for: ${email} - not found in eligibility or faculty roster`);
    return {
      isAuthorized: false,
      role: 'student', // Default role for error response
      error: {
        code: 'NOT_ELIGIBLE',
        message: 'User not found in eligibility roster or faculty roster for current term',
        guidance
      }
    };

  } catch (error) {
    logger.error('Authorization check failed:', error);
    return {
      isAuthorized: false,
      role: 'student',
      error: {
        code: 'AUTHORIZATION_ERROR',
        message: 'Failed to check user authorization'
      }
    };
  }
}

/**
 * Generate guidance message based on user email or year
 * @param email - User email address
 * @returns Guidance message for unauthorized users
 */
function generateGuidanceMessage(email: string): string {
  // Try to extract year from email pattern (common patterns like ap21110xxx@srmap.edu.in)
  const yearMatch = email.match(/ap(\d{2})/i);
  
  if (yearMatch) {
    const yearSuffix = parseInt(yearMatch[1]);
    const currentYear = new Date().getFullYear();
    const admissionYear = 2000 + yearSuffix;
    const academicYear = currentYear - admissionYear + 1;

    if (academicYear === 2) {
      return 'IDP projects are available from year 2. Please check with academic office for eligibility.';
    } else if (academicYear === 3) {
      return 'UROP projects are available from semester 7. Please check with academic office for eligibility.';
    } else if (academicYear === 4) {
      return 'CAPSTONE projects are available from semester 8. Please check with academic office for eligibility.';
    }
  }

  // Generic guidance if year cannot be determined
  return 'Please contact the academic office to verify your eligibility for project enrollment. IDP (year-2), UROP (sem-7), CAPSTONE (sem-8).';
}

/**
 * Get current active term information
 * @returns Current term details
 */
export function getCurrentTerm(): { termKind: 'odd' | 'even'; year: number } {
  const now = new Date();
  const month = now.getMonth() + 1; // getMonth() returns 0-11
  const year = now.getFullYear();

  // Odd semester: January to May (months 1-5)
  // Even semester: August to December (months 8-12)
  const termKind: 'odd' | 'even' = (month >= 1 && month <= 5) ? 'odd' : 'even';

  return { termKind, year };
}

/**
 * Check if a student is eligible for a specific project type
 * @param eligibility - Student eligibility record
 * @param projectType - Project type to check
 * @returns true if eligible
 */
export function isEligibleForProjectType(
  eligibility: IEligibility, 
  projectType: 'IDP' | 'UROP' | 'CAPSTONE'
): boolean {
  return eligibility.type === projectType;
}

/**
 * Validate term dates for eligibility import
 * @param termKind - Term kind (odd/even)
 * @param year - Academic year
 * @returns Valid from and to dates
 */
export function getTermDates(termKind: 'odd' | 'even', year: number): { validFrom: Date; validTo: Date } {
  if (termKind === 'odd') {
    // Odd semester: January to May
    return {
      validFrom: new Date(year, 0, 1), // January 1st
      validTo: new Date(year, 4, 31)   // May 31st
    };
  } else {
    // Even semester: August to December
    return {
      validFrom: new Date(year, 7, 1),  // August 1st
      validTo: new Date(year, 11, 31)   // December 31st
    };
  }
}