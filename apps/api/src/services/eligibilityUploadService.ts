import { User } from '../models/User';
import { logger } from '../utils/logger';

interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Upload student emails for a specific project type
 * Creates or updates users with project-specific roles
 */
export async function uploadStudentEmails(
  emails: string[],
  projectType: 'IDP' | 'UROP' | 'CAPSTONE',
  adminId: string
): Promise<UploadResult> {
  const result: UploadResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  // Map project type to role
  const roleMap: Record<string, 'idp-student' | 'urop-student' | 'capstone-student'> = {
    'IDP': 'idp-student',
    'UROP': 'urop-student',
    'CAPSTONE': 'capstone-student'
  };

  const role = roleMap[projectType];

  for (const email of emails) {
    try {
      const trimmedEmail = email.trim().toLowerCase();

      // Validate email
      if (!trimmedEmail.endsWith('@srmap.edu.in')) {
        result.failed++;
        result.errors.push(`Invalid email: ${email} (must end with @srmap.edu.in)`);
        continue;
      }

      // Check if user exists
      const existingUser = await User.findOne({ email: trimmedEmail });

      if (existingUser) {
        // Update existing user's role
        existingUser.role = role;
        await existingUser.save();
        logger.info(`Updated user ${trimmedEmail} to role ${role}`);
      } else {
        // Create new user with minimal data
        // They will complete their profile on first login
        await User.create({
          googleId: `pending-${trimmedEmail}`, // Temporary, will be updated on first login
          email: trimmedEmail,
          name: trimmedEmail.split('@')[0], // Temporary name from email
          role: role,
          preferences: {
            theme: 'light',
            notifications: true,
            emailNotifications: true
          }
        });
        logger.info(`Created new user ${trimmedEmail} with role ${role}`);
      }

      result.success++;
    } catch (error: any) {
      result.failed++;
      result.errors.push(`Failed to process ${email}: ${error.message}`);
      logger.error(`Failed to process email ${email}:`, error);
    }
  }

  logger.info(`Student upload completed by admin ${adminId}: ${result.success} success, ${result.failed} failed`);
  return result;
}

/**
 * Upload faculty emails
 * Creates or updates users with faculty role
 */
export async function uploadFacultyEmails(
  emails: string[],
  adminId: string
): Promise<UploadResult> {
  const result: UploadResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const email of emails) {
    try {
      const trimmedEmail = email.trim().toLowerCase();

      // Validate email
      if (!trimmedEmail.endsWith('@srmap.edu.in')) {
        result.failed++;
        result.errors.push(`Invalid email: ${email} (must end with @srmap.edu.in)`);
        continue;
      }

      // Check if user exists
      const existingUser = await User.findOne({ email: trimmedEmail });

      if (existingUser) {
        // Update existing user's role to faculty if not already
        if (existingUser.role !== 'faculty' && existingUser.role !== 'admin') {
          existingUser.role = 'faculty';
          await existingUser.save();
          logger.info(`Updated user ${trimmedEmail} to faculty role`);
        }
      } else {
        // Create new faculty user
        await User.create({
          googleId: `pending-${trimmedEmail}`, // Temporary, will be updated on first login
          email: trimmedEmail,
          name: trimmedEmail.split('@')[0], // Temporary name from email
          role: 'faculty',
          isCoordinator: false,
          isExternalEvaluator: false,
          preferences: {
            theme: 'light',
            notifications: true,
            emailNotifications: true
          }
        });
        logger.info(`Created new faculty user ${trimmedEmail}`);
      }

      result.success++;
    } catch (error: any) {
      result.failed++;
      result.errors.push(`Failed to process ${email}: ${error.message}`);
      logger.error(`Failed to process email ${email}:`, error);
    }
  }

  logger.info(`Faculty upload completed by admin ${adminId}: ${result.success} success, ${result.failed} failed`);
  return result;
}

/**
 * Parse CSV content and extract emails
 */
export function parseEmailCSV(csvContent: string): string[] {
  const lines = csvContent.trim().split('\n');
  const emails: string[] = [];

  // Skip header row if it exists
  const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Extract email (first column or the whole line if no commas)
    const email = line.split(',')[0].trim();
    if (email && email.includes('@')) {
      emails.push(email);
    }
  }

  return emails;
}
