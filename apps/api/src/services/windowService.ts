import { Window } from '../models/Window';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

/**
 * Service to manage window operations and status updates
 */
export class WindowService {
  /**
   * Update isActive status for all windows based on current time
   * This should be called periodically to keep the database in sync
   */
  static async updateWindowStatuses(): Promise<{ updated: number }> {
    try {
      const now = new Date();
      
      // Update windows that should be active but aren't marked as active
      const activateResult = await Window.updateMany(
        {
          startDate: { $lte: now },
          endDate: { $gte: now },
          isActive: false
        },
        { isActive: true }
      );

      // Update windows that should be inactive but are marked as active
      const deactivateResult = await Window.updateMany(
        {
          $or: [
            { endDate: { $lt: now } },
            { startDate: { $gt: now } }
          ],
          isActive: true
        },
        { isActive: false }
      );

      const totalUpdated = activateResult.modifiedCount + deactivateResult.modifiedCount;
      
      if (totalUpdated > 0) {
        logger.info(`Updated ${totalUpdated} window statuses (${activateResult.modifiedCount} activated, ${deactivateResult.modifiedCount} deactivated)`);
      }

      return { updated: totalUpdated };
    } catch (error) {
      logger.error('Error updating window statuses:', error);
      throw error;
    }
  }

  /**
   * Delete all ended windows (windows that have passed their end date)
   * @returns Number of deleted windows
   */
  static async deleteEndedWindows(): Promise<{ deleted: number }> {
    try {
      logger.info('Starting deleteEndedWindows process...');
      
      // First update all window statuses to ensure accuracy
      const updateResult = await this.updateWindowStatuses();
      logger.info(`Updated ${updateResult.updated} window statuses before deletion`);

      const now = new Date();
      
      // Only delete windows that have ended (past their end date)
      // This excludes upcoming windows which are also inactive but haven't started yet
      const endedWindowsQuery = { endDate: { $lt: now } };
      
      // Get count of ended windows before deletion
      const endedCount = await Window.countDocuments(endedWindowsQuery);
      logger.info(`Found ${endedCount} ended windows to delete`);

      if (endedCount === 0) {
        logger.info('No ended windows to delete');
        return { deleted: 0 };
      }

      // Delete all ended windows
      const result = await Window.deleteMany(endedWindowsQuery);
      
      logger.info(`Successfully deleted ${result.deletedCount} ended windows`);
      
      return { deleted: result.deletedCount };
    } catch (error) {
      logger.error('Error deleting ended windows:', error);
      logger.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      throw error;
    }
  }

  /**
   * Get count of ended windows (windows that have passed their end date)
   */
  static async getEndedWindowsCount(): Promise<number> {
    try {
      // First update statuses
      await this.updateWindowStatuses();
      
      const now = new Date();
      return await Window.countDocuments({ endDate: { $lt: now } });
    } catch (error) {
      logger.error('Error getting ended windows count:', error);
      throw error;
    }
  }

  /**
   * Check if a specific window is active
   */
  static async isWindowActive(
    windowType: string,
    projectType: string,
    assessmentType?: string
  ): Promise<boolean> {
    try {
      await this.updateWindowStatuses();
      
      const query: any = {
        windowType,
        projectType,
        isActive: true
      };
      
      if (assessmentType) {
        query.assessmentType = assessmentType;
      }
      
      const window = await Window.findOne(query);
      return !!window;
    } catch (error) {
      logger.error('Error checking window status:', error);
      return false;
    }
  }

  /**
   * Create a new window
   */
  static async createWindow(windowData: {
    windowType: string;
    projectType: string;
    assessmentType?: string;
    startDate: Date;
    endDate: Date;
    createdBy: mongoose.Types.ObjectId;
  }) {
    try {
      const window = new Window(windowData);
      await window.save();
      return window;
    } catch (error) {
      logger.error('Error creating window:', error);
      throw error;
    }
  }

  /**
   * Update a window
   */
  static async updateWindow(windowId: string, updateData: any) {
    try {
      const window = await Window.findByIdAndUpdate(windowId, updateData, { new: true });
      return window;
    } catch (error) {
      logger.error('Error updating window:', error);
      throw error;
    }
  }



  /**
   * Get windows by project type
   */
  static async getWindowsByProjectType(projectType: string) {
    try {
      await this.updateWindowStatuses();
      return await Window.find({ projectType }).sort({ startDate: -1 });
    } catch (error) {
      logger.error('Error getting windows by project type:', error);
      throw error;
    }
  }

  /**
   * Get active window for a specific type and project
   */
  static async getActiveWindow(windowType: string, projectType: string, assessmentType?: string) {
    try {
      await this.updateWindowStatuses();
      
      const query: any = {
        windowType,
        projectType,
        isActive: true
      };
      
      if (assessmentType) {
        query.assessmentType = assessmentType;
      }
      
      return await Window.findOne(query);
    } catch (error) {
      logger.error('Error getting active window:', error);
      throw error;
    }
  }

  /**
   * Get upcoming windows
   */
  static async getUpcomingWindows(projectType?: string, limit?: number) {
    try {
      const now = new Date();
      const query: any = {
        startDate: { $gt: now }
      };
      
      if (projectType) {
        query.projectType = projectType;
      }
      
      let windowsQuery = Window.find(query).sort({ startDate: 1 });
      
      if (limit) {
        windowsQuery = windowsQuery.limit(limit);
      }
      
      return await windowsQuery;
    } catch (error) {
      logger.error('Error getting upcoming windows:', error);
      throw error;
    }
  }
}

// Export individual functions for backward compatibility
export const updateWindowStatuses = WindowService.updateWindowStatuses;
export const deleteEndedWindows = WindowService.deleteEndedWindows;
export const getEndedWindowsCount = WindowService.getEndedWindowsCount;
export const isWindowActive = WindowService.isWindowActive;
export const createWindow = WindowService.createWindow;
export const updateWindow = WindowService.updateWindow;
export const getWindowsByProjectType = WindowService.getWindowsByProjectType;
export const getActiveWindow = WindowService.getActiveWindow;
export const getUpcomingWindows = WindowService.getUpcomingWindows;