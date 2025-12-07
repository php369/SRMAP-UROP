import { User, IUser } from '../models/User';
import { logger } from '../utils/logger';

export interface UserSearchFilters {
  role?: 'student' | 'faculty' | 'admin';
  department?: string;
  year?: number;
  search?: string; // Search by name or email
  limit?: number;
  skip?: number;
}

/**
 * Get all users with optional filtering and search
 * @param filters - Search and filter criteria
 * @returns List of users
 */
export async function getUsers(filters: UserSearchFilters = {}): Promise<IUser[]> {
  try {
    const query: any = {};

    // Role filter
    if (filters.role) {
      query.role = filters.role;
    }

    // Search filter (name or email)
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 50)
      .skip(filters.skip || 0);

    return users;

  } catch (error) {
    logger.error('Failed to get users:', error);
    throw error;
  }
}

/**
 * Update user role
 * @param userId - User ID to update
 * @param newRole - New role to assign
 * @param adminId - Admin performing the update
 * @returns Updated user
 */
export async function updateUserRole(
  userId: string,
  newRole: 'student' | 'faculty' | 'admin',
  adminId: string
): Promise<IUser> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const oldRole = user.role;
    user.role = newRole;
    await user.save();

    logger.info(`User role updated: ${userId} from ${oldRole} to ${newRole} by admin ${adminId}`);

    return user;

  } catch (error) {
    logger.error(`Failed to update user role for ${userId}:`, error);
    throw error;
  }
}

/**
 * Delete a user (admin only, with safety checks)
 * @param userId - User ID to delete
 * @param adminId - Admin performing the deletion
 */
export async function deleteUser(userId: string, adminId: string): Promise<void> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Safety check: don't allow deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        throw new Error('Cannot delete the last admin user');
      }
    }

    const userEmail = user.email.toLowerCase();

    // Delete the user
    await User.findByIdAndDelete(userId);

    logger.info(`User permanently deleted: ${userId} (${userEmail}) by admin ${adminId}`);

  } catch (error) {
    logger.error(`Failed to delete user ${userId}:`, error);
    throw error;
  }
}

// Eligibility and Faculty Roster functions removed - collections dropped from database
// Authorization now based on User model fields: role, isCoordinator, isExternalEvaluator, department

/**
 * Get system statistics
 * @returns System statistics
 */
export async function getSystemStats(): Promise<{
  users: { total: number; byRole: Record<string, number> };
  projects: { total: number; published: number; byType: Record<string, number> };
  applications: { total: number; pending: number; approved: number; rejected: number };
  groups: { total: number; byStatus: Record<string, number> };
}> {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Get project statistics (placeholder - will be implemented when Project model is available)
    const projectStats = {
      total: 0,
      published: 0,
      byType: { IDP: 0, UROP: 0, CAPSTONE: 0 }
    };

    // Get application statistics (placeholder)
    const applicationStats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    // Get group statistics (placeholder)
    const groupStats = {
      total: 0,
      byStatus: { forming: 0, applied: 0, approved: 0 }
    };

    return {
      users: {
        total: totalUsers,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>)
      },
      projects: projectStats,
      applications: applicationStats,
      groups: groupStats
    };

  } catch (error) {
    logger.error('Failed to get system stats:', error);
    throw error;
  }
}

/**
 * Create a new cohort
 * @param cohortData - Cohort data
 * @param adminId - Admin creating the cohort
 * @returns Created cohort
 */
export async function createCohort(
  cohortData: {
    name: string;
    year: number;
    department: string;
    studentIds?: string[];
    facultyIds?: string[];
  },
  adminId: string
): Promise<any> {
  try {
    // Import Cohort model dynamically to avoid circular dependencies
    const { Cohort } = await import('../models/Cohort');

    // For now, create a basic cohort - will be enhanced when full cohort management is implemented
    const cohort = new Cohort({
      name: cohortData.name,
      year: cohortData.year,
      semester: 1, // Default semester
      type: 'IDP', // Default type
      status: 'active'
    });

    await cohort.save();
    logger.info(`Cohort created: ${cohort.name} by admin ${adminId}`);

    return cohort;
  } catch (error) {
    logger.error('Failed to create cohort:', error);
    throw error;
  }
}

/**
 * Update a cohort
 * @param cohortId - Cohort ID
 * @param updates - Updates to apply
 * @param adminId - Admin updating the cohort
 * @returns Updated cohort
 */
export async function updateCohort(
  cohortId: string,
  updates: {
    name?: string;
    year?: number;
    semester?: number;
    type?: 'IDP' | 'UROP' | 'CAPSTONE';
    status?: 'active' | 'inactive';
  },
  adminId: string
): Promise<any> {
  try {
    const { Cohort } = await import('../models/Cohort');

    const cohort = await Cohort.findByIdAndUpdate(
      cohortId,
      updates,
      { new: true }
    );

    if (!cohort) {
      throw new Error('Cohort not found');
    }

    logger.info(`Cohort updated: ${cohortId} by admin ${adminId}`);
    return cohort;
  } catch (error) {
    logger.error('Failed to update cohort:', error);
    throw error;
  }
}

/**
 * Create a new course
 * @param courseData - Course data
 * @param adminId - Admin creating the course
 * @returns Created course
 */
export async function createCourse(
  courseData: {
    code: string;
    title: string;
    description?: string;
    credits: number;
    facultyId: string;
    cohortIds?: string[];
    semester: 'Fall' | 'Spring' | 'Summer';
    year: number;
  },
  adminId: string
): Promise<any> {
  try {
    const { Course } = await import('../models/Course');

    const course = new Course({
      code: courseData.code,
      name: courseData.title, // Map title to name
      credits: courseData.credits,
      department: 'Computer Science', // Default department
      semester: 1, // Default semester number
      type: 'IDP', // Default type
      status: 'active'
    });

    await course.save();
    logger.info(`Course created: ${course.code} by admin ${adminId}`);

    return course;
  } catch (error) {
    logger.error('Failed to create course:', error);
    throw error;
  }
}

/**
 * Generate reports (placeholder implementation)
 * @param reportType - Type of report to generate
 * @param filters - Report filters
 * @returns Report data
 */
export async function generateReports(
  reportType: 'users' | 'projects' | 'applications' | 'evaluations',
  filters: Record<string, any> = {}
): Promise<{
  assessmentReport?: any[];
  gradingLatencyReport?: any[];
  activityReport?: any[];
}> {
  try {
    logger.info(`Generating ${reportType} report with filters:`, filters);

    // Placeholder implementation - will be enhanced in future tasks
    const reports = {
      assessmentReport: [],
      gradingLatencyReport: [],
      activityReport: []
    };

    return reports;
  } catch (error) {
    logger.error('Failed to generate reports:', error);
    throw error;
  }
}

/**
 * 
Get eligibility records with optional filtering
 * @param filters - Search and filter criteria
 * @returns List of eligibility records
 */
