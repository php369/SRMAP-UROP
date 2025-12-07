import mongoose from 'mongoose';
import { StudentMeta, IStudentMeta } from '../models/StudentMeta';
import { logger } from '../utils/logger';

export interface CreateStudentMetaData {
  stream: string;
  specialization?: string;
  cgpa?: number;
}

export interface UpdateStudentMetaData {
  stream?: string;
  specialization?: string;
  cgpa?: number;
}

export class StudentMetaService {
  /**
   * Create or update student metadata
   */
  static async createOrUpdateStudentMeta(
    userId: mongoose.Types.ObjectId,
    data: CreateStudentMetaData
  ): Promise<IStudentMeta> {
    try {
      // Validate specialization requirement based on student's eligibility
      await this.validateSpecializationRequirement(userId, data);

      // Check if StudentMeta already exists
      const existingMeta = await StudentMeta.findOne({ userId });

      if (existingMeta) {
        // Update existing metadata
        Object.assign(existingMeta, data);
        await existingMeta.save();
        logger.info(`StudentMeta updated for user ${userId}`);
        return existingMeta;
      } else {
        // Create new metadata
        const studentMeta = new StudentMeta({
          userId,
          ...data
        });
        await studentMeta.save();
        logger.info(`StudentMeta created for user ${userId}`);
        return studentMeta;
      }
    } catch (error) {
      logger.error('Error creating/updating StudentMeta:', error);
      throw error;
    }
  }

  /**
   * Get student metadata by user ID
   */
  static async getStudentMeta(userId: mongoose.Types.ObjectId): Promise<IStudentMeta | null> {
    try {
      const studentMeta = await StudentMeta.findOne({ userId });
      return studentMeta;
    } catch (error) {
      logger.error('Error getting StudentMeta:', error);
      throw error;
    }
  }

  /**
   * Update student metadata
   */
  static async updateStudentMeta(
    userId: mongoose.Types.ObjectId,
    data: UpdateStudentMetaData
  ): Promise<IStudentMeta> {
    try {
      const existingMeta = await StudentMeta.findOne({ userId });
      if (!existingMeta) {
        throw new Error('Student metadata not found');
      }

      // Validate specialization requirement if being updated
      if (data.specialization !== undefined || data.stream !== undefined) {
        const validationData = {
          stream: data.stream || existingMeta.stream,
          specialization: data.specialization !== undefined ? data.specialization : existingMeta.specialization,
          cgpa: data.cgpa !== undefined ? data.cgpa : existingMeta.cgpa
        };
        await this.validateSpecializationRequirement(userId, validationData);
      }

      // Update the metadata
      Object.assign(existingMeta, data);
      await existingMeta.save();

      logger.info(`StudentMeta updated for user ${userId}`);
      return existingMeta;
    } catch (error) {
      logger.error('Error updating StudentMeta:', error);
      throw error;
    }
  }

  /**
   * Delete student metadata
   */
  static async deleteStudentMeta(userId: mongoose.Types.ObjectId): Promise<void> {
    try {
      const result = await StudentMeta.deleteOne({ userId });
      if (result.deletedCount === 0) {
        throw new Error('Student metadata not found');
      }
      logger.info(`StudentMeta deleted for user ${userId}`);
    } catch (error) {
      logger.error('Error deleting StudentMeta:', error);
      throw error;
    }
  }

  /**
   * Validate specialization requirement based on student's semester
   */
  private static async validateSpecializationRequirement(
    userId: mongoose.Types.ObjectId,
    data: CreateStudentMetaData | UpdateStudentMetaData
  ): Promise<void> {
    try {
      // Validate stream is provided
      if (!data.stream || data.stream.trim() === '') {
        throw new Error('Stream is required');
      }

      // Validate CGPA if provided
      if (data.cgpa !== undefined && data.cgpa !== null) {
        if (data.cgpa < 0 || data.cgpa > 10) {
          throw new Error('CGPA must be between 0 and 10');
        }
      }

      // Note: Specialization requirement check removed since Eligibility collection was dropped
      // Specialization is now optional for all students
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      logger.error('Error validating specialization requirement:', error);
      throw new Error('Failed to validate student metadata requirements');
    }
  }

  /**
   * Check if student can edit metadata (based on application window status)
   */
  static async canEditStudentMeta(userId: mongoose.Types.ObjectId): Promise<{ canEdit: boolean; reason?: string }> {
    try {
      const { User } = await import('../models/User');
      const user = await User.findById(userId);
      if (!user) {
        return { canEdit: false, reason: 'User not found' };
      }

      // Note: With Eligibility removed, we allow editing during any active application window
      // Check if any application window is active
      const { Window } = await import('../models/Window');
      const activeWindow = await Window.findOne({
        kind: 'application',
        start: { $lte: new Date() },
        end: { $gte: new Date() }
      });

      if (!activeWindow) {
        return { canEdit: false, reason: 'Application window is not currently active' };
      }

      return { canEdit: true };
    } catch (error) {
      logger.error('Error checking StudentMeta edit permissions:', error);
      return { canEdit: false, reason: 'Failed to check edit permissions' };
    }
  }

  /**
   * Get student metadata with user information for display
   */
  static async getStudentMetaWithUser(userId: mongoose.Types.ObjectId): Promise<{
    studentMeta: IStudentMeta | null;
    user: any;
  }> {
    try {
      const { User } = await import('../models/User');
      
      const [studentMeta, user] = await Promise.all([
        StudentMeta.findOne({ userId }),
        User.findById(userId)
      ]);

      return {
        studentMeta,
        user
      };
    } catch (error) {
      logger.error('Error getting StudentMeta with user info:', error);
      throw error;
    }
  }

  /**
   * Get multiple student metadata records for faculty review
   */
  static async getStudentMetaForUsers(userIds: mongoose.Types.ObjectId[]): Promise<{
    [userId: string]: {
      studentMeta: IStudentMeta | null;
      user: any;
    }
  }> {
    try {
      const { User } = await import('../models/User');
      
      const [studentMetas, users] = await Promise.all([
        StudentMeta.find({ userId: { $in: userIds } }),
        User.find({ _id: { $in: userIds } })
      ]);

      // Create lookup maps
      const studentMetaMap = new Map(studentMetas.map(meta => [meta.userId.toString(), meta]));
      const userMap = new Map(users.map(user => [user._id.toString(), user]));

      // Build result object
      const result: { [userId: string]: any } = {};
      
      for (const userId of userIds) {
        const userIdStr = userId.toString();
        const user = userMap.get(userIdStr);
        const studentMeta = studentMetaMap.get(userIdStr);

        result[userIdStr] = {
          studentMeta: studentMeta || null,
          user: user || null
        };
      }

      return result;
    } catch (error) {
      logger.error('Error getting StudentMeta for multiple users:', error);
      throw error;
    }
  }

  /**
   * Validate student metadata completeness for application
   */
  static async validateMetaForApplication(userId: mongoose.Types.ObjectId): Promise<{
    isValid: boolean;
    missingFields: string[];
    studentMeta: IStudentMeta | null;
  }> {
    try {
      const { studentMeta } = await this.getStudentMetaWithUser(userId);
      
      const missingFields: string[] = [];

      if (!studentMeta) {
        return {
          isValid: false,
          missingFields: ['stream'],
          studentMeta: null
        };
      }

      // Check required fields
      if (!studentMeta.stream || studentMeta.stream.trim() === '') {
        missingFields.push('stream');
      }

      // Note: Specialization is now optional since Eligibility collection was dropped

      return {
        isValid: missingFields.length === 0,
        missingFields,
        studentMeta
      };
    } catch (error) {
      logger.error('Error validating StudentMeta for application:', error);
      throw error;
    }
  }
}

export default StudentMetaService;