import { User, IUser } from '../models/User';
import { Eligibility, IEligibility } from '../models/Eligibility';
import { FacultyRoster, IFacultyRoster } from '../models/FacultyRoster';
import { logger } from '../utils/logger';
// import mongoose from 'mongoose'; // Commented out as not currently used

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
 * Also removes user from authorization sources (eligibility/faculty roster)
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

    // Remove user from authorization sources to prevent re-creation on next login
    const userEmail = user.email.toLowerCase();

    // Remove from eligibility records (for students)
    const eligibilityDeleted = await Eligibility.deleteMany({
      studentEmail: userEmail
    });
    if (eligibilityDeleted.deletedCount > 0) {
      logger.info(`Deleted ${eligibilityDeleted.deletedCount} eligibility record(s) for ${userEmail}`);
    }

    // Remove from faculty roster (for faculty/coordinators)
    const facultyDeleted = await FacultyRoster.deleteMany({
      email: userEmail
    });
    if (facultyDeleted.deletedCount > 0) {
      logger.info(`Deleted ${facultyDeleted.deletedCount} faculty roster record(s) for ${userEmail}`);
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    logger.info(`User permanently deleted: ${userId} (${userEmail}) by admin ${adminId}`);

  } catch (error) {
    logger.error(`Failed to delete user ${userId}:`, error);
    throw error;
  }
}

/**
 * Eligibility CSV import interfaces and functions
 */

export interface EligibilityImportRow {
  studentEmail: string;
  regNo?: string;
  year: number;
  semester: number;
  termKind: 'odd' | 'even';
  type: 'IDP' | 'UROP' | 'CAPSTONE';
}

export interface EligibilityImportResult {
  success: number;
  errors: number;
  total: number;
  errorDetails: Array<{
    row: number;
    email?: string;
    error: string;
  }>;
}

/**
 * Parse CSV content and import eligibility records
 * @param csvContent - CSV file content as string
 * @param adminId - Admin performing the import
 * @returns Import result with success/error counts
 */
export async function importEligibilityFromCSV(
  csvContent: string,
  adminId: string,
  defaultProjectType?: 'IDP' | 'UROP' | 'CAPSTONE',
  defaultUserType?: 'student' | 'faculty'
): Promise<EligibilityImportResult> {
  try {
    const results: EligibilityImportRow[] = [];
    const errors: Array<{ row: number; email?: string; error: string }> = [];
    let rowNumber = 0;

    // Parse CSV content
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Parse header row
    const headers = lines[0].split(',').map(header => header.toLowerCase().trim().replace(/"/g, ''));

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      rowNumber++;
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Simple CSV parsing (handles basic cases)
        const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
        const data: any = {};

        headers.forEach((header, index) => {
          data[header] = values[index] || '';
        });

        logger.debug(`Row ${rowNumber} data:`, data);

        // Validate and parse row data
        const row = parseEligibilityRow(data, rowNumber, defaultProjectType);
        results.push(row);
      } catch (error) {
        errors.push({
          row: rowNumber,
          email: lines[i].split(',')[0]?.replace(/"/g, ''),
          error: error instanceof Error ? error.message : 'Unknown parsing error'
        });
      }
    }

    // Process valid rows
    let successCount = 0;

    for (const row of results) {
      try {
        await upsertEligibilityRecord(row);
        successCount++;
      } catch (error) {
        errors.push({
          row: results.indexOf(row) + 1,
          email: row.studentEmail,
          error: error instanceof Error ? error.message : 'Database error'
        });
      }
    }

    const result: EligibilityImportResult = {
      success: successCount,
      errors: errors.length,
      total: rowNumber,
      errorDetails: errors
    };

    logger.info(`Eligibility import completed by admin ${adminId}: ${successCount} success, ${errors.length} errors`);

    return result;

  } catch (error) {
    logger.error('Failed to import eligibility CSV:', error);
    throw error;
  }
}

/**
 * Parse and validate a single CSV row
 * @param data - Raw CSV row data
 * @param rowNumber - Row number for error reporting
 * @returns Parsed eligibility row
 */
function parseEligibilityRow(data: Record<string, string>, rowNumber: number, defaultType?: 'IDP' | 'UROP' | 'CAPSTONE'): EligibilityImportRow {
  // Use exact column names (lowercase, as headers are normalized)
  const studentEmail = data.email;
  const regNo = data.regno;
  const year = data.year;
  const semester = data.semester;
  const type = defaultType;

  // Validate required fields
  if (!studentEmail) {
    logger.error(`Row ${rowNumber} validation failed: No email found. Data:`, data);
    throw new Error(`Row ${rowNumber}: Student email is required`);
  }

  if (!studentEmail.endsWith('@srmap.edu.in')) {
    throw new Error(`Row ${rowNumber}: Student email must be from @srmap.edu.in domain`);
  }

  if (!year || isNaN(Number(year))) {
    throw new Error(`Row ${rowNumber}: Valid year is required`);
  }

  if (!semester || isNaN(Number(semester))) {
    throw new Error(`Row ${rowNumber}: Valid semester is required`);
  }

  if (!type) {
    throw new Error(`Row ${rowNumber}: Project type is required (select it in the UI before uploading)`);
  }

  const parsedYear = Number(year);
  const parsedSemester = Number(semester);

  // Derive termKind from semester
  // Odd semesters: 3, 7; Even semesters: 4, 8
  const derivedTermKind: 'odd' | 'even' = ([3, 7].includes(parsedSemester)) ? 'odd' : 'even';

  // Validate year range
  if (parsedYear < 2 || parsedYear > 4) {
    throw new Error(`Row ${rowNumber}: Year must be between 2 and 4`);
  }

  // Validate semester range
  if (![3, 4, 7, 8].includes(parsedSemester)) {
    throw new Error(`Row ${rowNumber}: Semester must be 3, 4, 7, or 8`);
  }

  return {
    studentEmail: studentEmail.toLowerCase().trim(),
    regNo: regNo ? regNo.toString().toUpperCase().trim() : undefined,
    year: parsedYear as 2 | 3 | 4,
    semester: parsedSemester as 3 | 4 | 7 | 8,
    termKind: derivedTermKind,
    type: type.toUpperCase() as 'IDP' | 'UROP' | 'CAPSTONE'
  };
}

/**
 * Upsert eligibility record (create or update)
 * @param row - Eligibility data
 */
async function upsertEligibilityRecord(row: EligibilityImportRow): Promise<void> {
  try {
    // Calculate validity dates - make them valid for the entire academic year
    const now = new Date();
    const currentYear = now.getFullYear();

    // Set validity from 6 months ago to 1 year from now
    // This ensures students can access the system when uploaded
    const validFrom = new Date(currentYear, now.getMonth() - 6, 1);
    const validTo = new Date(currentYear + 1, now.getMonth(), 31);

    // Upsert based on unique combination
    await Eligibility.findOneAndUpdate(
      {
        studentEmail: row.studentEmail,
        type: row.type,
        termKind: row.termKind,
        year: row.year,
        semester: row.semester
      },
      {
        studentEmail: row.studentEmail,
        regNo: row.regNo,
        year: row.year,
        semester: row.semester,
        termKind: row.termKind,
        type: row.type,
        validFrom,
        validTo
      },
      {
        upsert: true,
        new: true
      }
    );

  } catch (error) {
    logger.error(`Failed to upsert eligibility record for ${row.studentEmail}:`, error);
    throw error;
  }
}

/**
 * Get all eligibility records with filtering
 * @param filters - Filter criteria
 * @returns List of eligibility records
 */
export async function getEligibilityRecords(filters: {
  type?: 'IDP' | 'UROP' | 'CAPSTONE';
  termKind?: 'odd' | 'even';
  year?: number;
  semester?: number;
  search?: string;
  limit?: number;
  skip?: number;
} = {}): Promise<IEligibility[]> {
  try {
    const query: any = {};

    if (filters.type) query.type = filters.type;
    if (filters.termKind) query.termKind = filters.termKind;
    if (filters.year) query.year = filters.year;
    if (filters.semester) query.semester = filters.semester;

    if (filters.search) {
      query.$or = [
        { studentEmail: { $regex: filters.search, $options: 'i' } },
        { regNo: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const eligibilityRecords = await Eligibility.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 100)
      .skip(filters.skip || 0);

    return eligibilityRecords;

  } catch (error) {
    logger.error('Failed to get eligibility records:', error);
    throw error;
  }
}

/**
 * Faculty roster management functions
 */

export interface FacultyRosterImportRow {
  email: string;
  name: string;
  dept: string;
  isCoordinator?: boolean;
  active?: boolean;
}

export interface FacultyRosterImportResult {
  success: number;
  errors: number;
  total: number;
  errorDetails: Array<{
    row: number;
    email?: string;
    error: string;
  }>;
}

/**
 * Import faculty roster from CSV
 * @param csvContent - CSV file content
 * @param adminId - Admin performing the import
 * @returns Import result
 */
export async function importFacultyRosterFromCSV(
  csvContent: string,
  adminId: string
): Promise<FacultyRosterImportResult> {
  try {
    const results: FacultyRosterImportRow[] = [];
    const errors: Array<{ row: number; email?: string; error: string }> = [];
    let rowNumber = 0;

    // Parse CSV content
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Parse header row
    const headers = lines[0].split(',').map(header => header.toLowerCase().trim().replace(/"/g, ''));

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      rowNumber++;
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Simple CSV parsing (handles basic cases)
        const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
        const data: Record<string, string> = {};

        headers.forEach((header, index) => {
          data[header] = values[index] || '';
        });

        const row = parseFacultyRosterRow(data, rowNumber);
        results.push(row);
      } catch (error) {
        errors.push({
          row: rowNumber,
          email: lines[i].split(',')[0]?.replace(/"/g, ''),
          error: error instanceof Error ? error.message : 'Unknown parsing error'
        });
      }
    }

    // Process valid rows
    let successCount = 0;

    for (const row of results) {
      try {
        await upsertFacultyRosterRecord(row);
        successCount++;
      } catch (error) {
        errors.push({
          row: results.indexOf(row) + 1,
          email: row.email,
          error: error instanceof Error ? error.message : 'Database error'
        });
      }
    }

    const result: FacultyRosterImportResult = {
      success: successCount,
      errors: errors.length,
      total: rowNumber,
      errorDetails: errors
    };

    logger.info(`Faculty roster import completed by admin ${adminId}: ${successCount} success, ${errors.length} errors`);

    return result;

  } catch (error) {
    logger.error('Failed to import faculty roster CSV:', error);
    throw error;
  }
}

/**
 * Parse faculty roster CSV row
 * @param data - Raw CSV row data
 * @param rowNumber - Row number for error reporting
 * @returns Parsed faculty roster row
 */
function parseFacultyRosterRow(data: Record<string, string>, rowNumber: number): FacultyRosterImportRow {
  const email = data.email;
  const name = data.name;
  const dept = data.dept || data.department;
  const isCoordinator = data.iscoordinator || data.is_coordinator || data.coordinator;
  const active = data.active;

  // Validate required fields
  if (!email) {
    throw new Error(`Row ${rowNumber}: Email is required`);
  }

  if (!email.endsWith('@srmap.edu.in')) {
    throw new Error(`Row ${rowNumber}: Email must be from @srmap.edu.in domain`);
  }

  if (!name) {
    throw new Error(`Row ${rowNumber}: Name is required`);
  }

  if (!dept) {
    throw new Error(`Row ${rowNumber}: Department is required`);
  }

  return {
    email: email.toLowerCase().trim(),
    name: name.trim(),
    dept: dept.trim(),
    isCoordinator: isCoordinator ? ['true', '1', 'yes'].includes(isCoordinator.toString().toLowerCase()) : false,
    active: active !== undefined ? ['true', '1', 'yes'].includes(active.toString().toLowerCase()) : true
  };
}

/**
 * Upsert faculty roster record
 * @param row - Faculty roster data
 */
async function upsertFacultyRosterRecord(row: FacultyRosterImportRow): Promise<void> {
  try {
    await FacultyRoster.findOneAndUpdate(
      { email: row.email },
      {
        email: row.email,
        name: row.name,
        dept: row.dept,
        isCoordinator: row.isCoordinator || false,
        active: row.active !== undefined ? row.active : true
      },
      {
        upsert: true,
        new: true
      }
    );

  } catch (error) {
    logger.error(`Failed to upsert faculty roster record for ${row.email}:`, error);
    throw error;
  }
}

/**
 * Get all faculty roster records
 * @param filters - Filter criteria
 * @returns List of faculty roster records
 */
export async function getFacultyRosterRecords(filters: {
  dept?: string;
  isCoordinator?: boolean;
  active?: boolean;
  search?: string;
  limit?: number;
  skip?: number;
} = {}): Promise<IFacultyRoster[]> {
  try {
    const query: any = {};

    if (filters.dept) query.dept = filters.dept;
    if (filters.isCoordinator !== undefined) query.isCoordinator = filters.isCoordinator;
    if (filters.active !== undefined) query.active = filters.active;

    if (filters.search) {
      query.$or = [
        { email: { $regex: filters.search, $options: 'i' } },
        { name: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const facultyRecords = await FacultyRoster.find(query)
      .sort({ name: 1 })
      .limit(filters.limit || 100)
      .skip(filters.skip || 0);

    return facultyRecords;

  } catch (error) {
    logger.error('Failed to get faculty roster records:', error);
    throw error;
  }
}

/**
 * Update faculty roster record
 * @param facultyId - Faculty ID
 * @param updates - Updates to apply
 * @param adminId - Admin performing the update
 * @returns Updated faculty record
 */
export async function updateFacultyRosterRecord(
  facultyId: string,
  updates: {
    name?: string;
    dept?: string;
    isCoordinator?: boolean;
    active?: boolean;
  },
  adminId: string
): Promise<IFacultyRoster> {
  try {
    const faculty = await FacultyRoster.findById(facultyId);
    if (!faculty) {
      throw new Error('Faculty not found');
    }

    if (updates.name !== undefined) faculty.name = updates.name;
    if (updates.dept !== undefined) faculty.dept = updates.dept;
    if (updates.isCoordinator !== undefined) faculty.isCoordinator = updates.isCoordinator;
    if (updates.active !== undefined) faculty.active = updates.active;

    await faculty.save();

    logger.info(`Faculty roster updated: ${facultyId} by admin ${adminId}`);

    return faculty;

  } catch (error) {
    logger.error(`Failed to update faculty roster record ${facultyId}:`, error);
    throw error;
  }
}
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
