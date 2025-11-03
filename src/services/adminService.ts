import { User, IUser } from '../models/User';
import { Cohort, ICohort } from '../models/Cohort';
import { Course, ICourse } from '../models/Course';
import { Assessment } from '../models/Assessment';
import { Submission } from '../models/Submission';
import { Grade } from '../models/Grade';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export interface UserSearchFilters {
  role?: 'student' | 'faculty' | 'admin';
  department?: string;
  year?: number;
  search?: string; // Search by name or email
  limit?: number;
  skip?: number;
}

export interface UserWithStats extends IUser {
  stats?: {
    assessmentsCreated?: number;
    submissionsCount?: number;
    averageGrade?: number;
    lastActivity?: Date;
  };
}

export interface SystemStats {
  users: {
    total: number;
    students: number;
    faculty: number;
    admins: number;
    newThisMonth: number;
  };
  assessments: {
    total: number;
    published: number;
    draft: number;
    closed: number;
  };
  submissions: {
    total: number;
    graded: number;
    pending: number;
    averageGrade: number;
  };
  activity: {
    activeUsers: number;
    submissionsToday: number;
    gradesGivenToday: number;
  };
}

export interface ReportData {
  assessmentReport: {
    assessmentId: string;
    title: string;
    course: string;
    faculty: string;
    totalSubmissions: number;
    gradedSubmissions: number;
    averageGrade: number;
    dueDate: Date;
    createdAt: Date;
  }[];
  gradingLatencyReport: {
    facultyId: string;
    facultyName: string;
    averageGradingTime: number; // in hours
    totalGraded: number;
    pendingGrades: number;
  }[];
  activityReport: {
    date: Date;
    newUsers: number;
    submissions: number;
    grades: number;
    assessments: number;
  }[];
}

/**
 * Get all users with optional filtering and search
 * @param filters - Search and filter criteria
 * @returns List of users with optional stats
 */
export async function getUsers(filters: UserSearchFilters = {}): Promise<UserWithStats[]> {
  try {
    const query: any = {};
    
    // Role filter
    if (filters.role) {
      query.role = filters.role;
    }
    
    // Department filter
    if (filters.department) {
      query['profile.department'] = filters.department;
    }
    
    // Year filter
    if (filters.year) {
      query['profile.year'] = filters.year;
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

    // Add stats for each user
    const usersWithStats: UserWithStats[] = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject() as UserWithStats;
        
        if (user.role === 'faculty') {
          // Faculty stats
          const assessmentsCreated = await Assessment.countDocuments({ facultyId: user._id });
          userObj.stats = {
            assessmentsCreated,
            lastActivity: user.updatedAt,
          };
        } else if (user.role === 'student') {
          // Student stats
          const submissionsCount = await Submission.countDocuments({ studentId: user._id });
          const grades = await Grade.find({
            submissionId: { $in: await Submission.find({ studentId: user._id }).distinct('_id') }
          });
          
          const averageGrade = grades.length > 0 
            ? grades.reduce((sum, grade) => sum + (grade.score / grade.maxScore * 100), 0) / grades.length
            : 0;
          
          userObj.stats = {
            submissionsCount,
            averageGrade: Math.round(averageGrade * 100) / 100,
            lastActivity: user.updatedAt,
          };
        }
        
        return userObj;
      })
    );

    return usersWithStats;

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
 * Get system-wide statistics
 * @returns System statistics
 */
export async function getSystemStats(): Promise<SystemStats> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // User statistics
    const totalUsers = await User.countDocuments();
    const students = await User.countDocuments({ role: 'student' });
    const faculty = await User.countDocuments({ role: 'faculty' });
    const admins = await User.countDocuments({ role: 'admin' });
    const newThisMonth = await User.countDocuments({ createdAt: { $gte: startOfMonth } });

    // Assessment statistics
    const totalAssessments = await Assessment.countDocuments();
    const publishedAssessments = await Assessment.countDocuments({ status: 'published' });
    const draftAssessments = await Assessment.countDocuments({ status: 'draft' });
    const closedAssessments = await Assessment.countDocuments({ status: 'closed' });

    // Submission statistics
    const totalSubmissions = await Submission.countDocuments();
    const gradedSubmissions = await Submission.countDocuments({ status: 'graded' });
    const pendingSubmissions = totalSubmissions - gradedSubmissions;

    // Calculate average grade
    const grades = await Grade.find();
    const averageGrade = grades.length > 0 
      ? grades.reduce((sum, grade) => sum + (grade.score / grade.maxScore * 100), 0) / grades.length
      : 0;

    // Activity statistics
    const activeUsers = await User.countDocuments({ 
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });
    const submissionsToday = await Submission.countDocuments({ submittedAt: { $gte: startOfDay } });
    const gradesGivenToday = await Grade.countDocuments({ gradedAt: { $gte: startOfDay } });

    return {
      users: {
        total: totalUsers,
        students,
        faculty,
        admins,
        newThisMonth,
      },
      assessments: {
        total: totalAssessments,
        published: publishedAssessments,
        draft: draftAssessments,
        closed: closedAssessments,
      },
      submissions: {
        total: totalSubmissions,
        graded: gradedSubmissions,
        pending: pendingSubmissions,
        averageGrade: Math.round(averageGrade * 100) / 100,
      },
      activity: {
        activeUsers,
        submissionsToday,
        gradesGivenToday,
      },
    };

  } catch (error) {
    logger.error('Failed to get system stats:', error);
    throw error;
  }
}

/**
 * Create a new cohort
 * @param cohortData - Cohort information
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
): Promise<ICohort> {
  try {
    // Check if cohort name already exists
    const existingCohort = await Cohort.findOne({ name: cohortData.name });
    if (existingCohort) {
      throw new Error('Cohort with this name already exists');
    }

    const cohort = new Cohort({
      name: cohortData.name,
      year: cohortData.year,
      department: cohortData.department,
      students: cohortData.studentIds?.map(id => new mongoose.Types.ObjectId(id)) || [],
      faculty: cohortData.facultyIds?.map(id => new mongoose.Types.ObjectId(id)) || [],
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
 * Update cohort membership
 * @param cohortId - Cohort ID
 * @param updates - Updates to apply
 * @param adminId - Admin performing the update
 * @returns Updated cohort
 */
export async function updateCohort(
  cohortId: string,
  updates: {
    name?: string;
    year?: number;
    department?: string;
    addStudents?: string[];
    removeStudents?: string[];
    addFaculty?: string[];
    removeFaculty?: string[];
  },
  adminId: string
): Promise<ICohort> {
  try {
    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      throw new Error('Cohort not found');
    }

    // Update basic fields
    if (updates.name) cohort.name = updates.name;
    if (updates.year) cohort.year = updates.year;
    if (updates.department) cohort.department = updates.department;

    // Update student membership
    if (updates.addStudents) {
      const newStudentIds = updates.addStudents.map(id => new mongoose.Types.ObjectId(id));
      cohort.students.push(...newStudentIds.filter(id => !cohort.students.includes(id)));
    }
    if (updates.removeStudents) {
      const removeIds = updates.removeStudents.map(id => id.toString());
      cohort.students = cohort.students.filter(id => !removeIds.includes(id.toString()));
    }

    // Update faculty membership
    if (updates.addFaculty) {
      const newFacultyIds = updates.addFaculty.map(id => new mongoose.Types.ObjectId(id));
      cohort.faculty.push(...newFacultyIds.filter(id => !cohort.faculty.includes(id)));
    }
    if (updates.removeFaculty) {
      const removeIds = updates.removeFaculty.map(id => id.toString());
      cohort.faculty = cohort.faculty.filter(id => !removeIds.includes(id.toString()));
    }

    await cohort.save();

    logger.info(`Cohort updated: ${cohortId} by admin ${adminId}`);

    return cohort;

  } catch (error) {
    logger.error(`Failed to update cohort ${cohortId}:`, error);
    throw error;
  }
}

/**
 * Create a new course
 * @param courseData - Course information
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
): Promise<ICourse> {
  try {
    // Check if course code already exists
    const existingCourse = await Course.findOne({ code: courseData.code });
    if (existingCourse) {
      throw new Error('Course with this code already exists');
    }

    const course = new Course({
      code: courseData.code,
      title: courseData.title,
      description: courseData.description,
      credits: courseData.credits,
      facultyId: new mongoose.Types.ObjectId(courseData.facultyId),
      cohorts: courseData.cohortIds?.map(id => new mongoose.Types.ObjectId(id)) || [],
      semester: courseData.semester,
      year: courseData.year,
      isActive: true,
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
 * Generate comprehensive reports
 * @param dateRange - Date range for reports
 * @returns Report data
 */
export async function generateReports(dateRange?: {
  startDate: Date;
  endDate: Date;
}): Promise<ReportData> {
  try {
    const query = dateRange ? {
      createdAt: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate,
      }
    } : {};

    // Assessment report
    const assessments = await Assessment.find(query)
      .populate('courseId', 'title')
      .populate('facultyId', 'name');

    const assessmentReport = await Promise.all(
      assessments.map(async (assessment) => {
        const totalSubmissions = await Submission.countDocuments({ assessmentId: assessment._id });
        const gradedSubmissions = await Submission.countDocuments({ 
          assessmentId: assessment._id, 
          status: 'graded' 
        });

        const submissions = await Submission.find({ assessmentId: assessment._id });
        const submissionIds = submissions.map(sub => sub._id);
        const grades = await Grade.find({ submissionId: { $in: submissionIds } });
        
        const averageGrade = grades.length > 0 
          ? grades.reduce((sum, grade) => sum + (grade.score / grade.maxScore * 100), 0) / grades.length
          : 0;

        return {
          assessmentId: assessment._id.toString(),
          title: assessment.title,
          course: (assessment.courseId as any).title,
          faculty: (assessment.facultyId as any).name,
          totalSubmissions,
          gradedSubmissions,
          averageGrade: Math.round(averageGrade * 100) / 100,
          dueDate: assessment.dueAt,
          createdAt: assessment.createdAt,
        };
      })
    );

    // Grading latency report
    const faculty = await User.find({ role: 'faculty' });
    const gradingLatencyReport = await Promise.all(
      faculty.map(async (fac) => {
        const facultyAssessments = await Assessment.find({ facultyId: fac._id });
        const assessmentIds = facultyAssessments.map(a => a._id);
        const submissions = await Submission.find({ assessmentId: { $in: assessmentIds } });
        const submissionIds = submissions.map(s => s._id);
        
        const grades = await Grade.find({ submissionId: { $in: submissionIds } });
        const pendingGrades = await Submission.countDocuments({
          assessmentId: { $in: assessmentIds },
          status: { $ne: 'graded' }
        });

        // Calculate average grading time
        let totalGradingTime = 0;
        let gradedCount = 0;

        for (const grade of grades) {
          const submission = submissions.find(s => (s._id as any).toString() === grade.submissionId.toString());
          if (submission) {
            const gradingTime = grade.gradedAt.getTime() - submission.submittedAt.getTime();
            totalGradingTime += gradingTime;
            gradedCount++;
          }
        }

        const averageGradingTime = gradedCount > 0 
          ? totalGradingTime / gradedCount / (1000 * 60 * 60) // Convert to hours
          : 0;

        return {
          facultyId: fac._id.toString(),
          facultyName: fac.name,
          averageGradingTime: Math.round(averageGradingTime * 100) / 100,
          totalGraded: gradedCount,
          pendingGrades,
        };
      })
    );

    // Activity report (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activityReport = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const [newUsers, submissions, grades, assessments] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: date, $lt: nextDate } }),
        Submission.countDocuments({ submittedAt: { $gte: date, $lt: nextDate } }),
        Grade.countDocuments({ gradedAt: { $gte: date, $lt: nextDate } }),
        Assessment.countDocuments({ createdAt: { $gte: date, $lt: nextDate } }),
      ]);

      activityReport.push({
        date,
        newUsers,
        submissions,
        grades,
        assessments,
      });
    }

    return {
      assessmentReport,
      gradingLatencyReport,
      activityReport,
    };

  } catch (error) {
    logger.error('Failed to generate reports:', error);
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

    // Check for dependencies
    if (user.role === 'faculty') {
      const assessmentCount = await Assessment.countDocuments({ facultyId: userId });
      if (assessmentCount > 0) {
        throw new Error('Cannot delete faculty with existing assessments. Transfer assessments first.');
      }
    }

    if (user.role === 'student') {
      const submissionCount = await Submission.countDocuments({ studentId: userId });
      if (submissionCount > 0) {
        throw new Error('Cannot delete student with existing submissions.');
      }
    }

    // Remove from cohorts
    await Cohort.updateMany(
      { $or: [{ students: userId }, { faculty: userId }] },
      { $pull: { students: userId, faculty: userId } }
    );

    // Delete the user
    await User.findByIdAndDelete(userId);

    logger.info(`User deleted: ${userId} by admin ${adminId}`);

  } catch (error) {
    logger.error(`Failed to delete user ${userId}:`, error);
    throw error;
  }
}