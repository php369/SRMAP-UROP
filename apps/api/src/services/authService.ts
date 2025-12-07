import { User } from '../models/User';
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
  user?: any;
}

/**
 * Check if user is authorized based on User model
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

    // Check User model for authorization
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Determine role based on User model fields
      let role: 'student' | 'faculty' | 'coordinator' | 'admin' = user.role;
      
      // Override role to coordinator if isCoordinator flag is set
      if (user.isCoordinator) {
        role = 'coordinator';
      }
      
      logger.info(`Access granted for: ${email} (${role})`);
      return {
        isAuthorized: true,
        role,
        user
      };
    }

    // User not found - provide guidance based on email pattern
    const guidance = generateGuidanceMessage(email);
    
    logger.warn(`Access denied for: ${email} - user not found in database`);
    return {
      isAuthorized: false,
      role: 'student', // Default role for error response
      error: {
        code: 'NOT_ELIGIBLE',
        message: 'You are currently not eligible to access the portal',
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
  // Check if it's a non-SRMAP email (like Gmail, Yahoo, etc.)
  if (!email.endsWith('@srmap.edu.in')) {
    return 'Please use your official SRM University-AP email address (@srmap.edu.in) to access the portal.';
  }

  // Check if it's a faculty email pattern (usually firstname.lastname@srmap.edu.in)
  const facultyPattern = /^[a-z]+\.[a-z]+@srmap\.edu\.in$/i;
  if (facultyPattern.test(email)) {
    return 'If you are a faculty member, please contact the academic office to be added to the faculty roster for the current term.';
  }

  // Try to extract year from student email pattern (common patterns like ap21110xxx@srmap.edu.in)
  const yearMatch = email.match(/ap(\d{2})/i);
  
  if (yearMatch) {
    const yearSuffix = parseInt(yearMatch[1]);
    const currentYear = new Date().getFullYear();
    const admissionYear = 2000 + yearSuffix;
    const academicYear = currentYear - admissionYear + 1;

    if (academicYear <= 1) {
      return 'Project enrollment is available from the 2nd year onwards. Please contact the academic office if you believe this is an error.';
    } else if (academicYear === 2) {
      return 'You may be eligible for IDP projects. Please contact the academic office to verify your enrollment status for the current term.';
    } else if (academicYear === 3) {
      return 'You may be eligible for UROP projects (semester 7). Please contact the academic office to verify your enrollment status.';
    } else if (academicYear >= 4) {
      return 'You may be eligible for CAPSTONE projects (semester 8). Please contact the academic office to verify your enrollment status.';
    }
  }

  // Generic guidance for SRMAP emails that don't match known patterns
  return 'Please contact the academic office to verify your eligibility. Project types: IDP (2nd year), UROP (7th semester), CAPSTONE (8th semester).';
}

// Eligibility-related functions removed - authorization now based on User model fields