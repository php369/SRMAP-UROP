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
   * Delete all inactive windows
   * @returns Number of deleted windows
   */
  static async deleteInactiveWindows(): Promise<{ deleted: number }> {
    try {
      logger.info('Starting deleteInactiveWindows process...');
      
      // First update all window statuses to ensure accuracy
      const updateResult = await this.updateWindowStatuses();
      logger.info(`Updated ${updateResult.updated} window statuses before deletion`);

      // Get count of inactive windows before deletion
      const inactiveCount = await Window.countDocuments({ isActive: false });
      logger.info(`Found ${inactiveCount} inactive windows to delete`);

      // Delete all inactive windows
      const result = await Window.deleteMany({ isActive: false });
      
      logger.info(`Successfully deleted ${result.deletedCount} inactive windows`);
      
      return { deleted: result.deletedCount };
    } catch (error) {
      logger.error('Error deleting inactive windows:', error);
      logger.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      throw error;
    }
  }

  /**
   * Get count of inactive windows
   */
  static async getInactiveWindowsCount(): Promise<number> {
    try {
      // First update statuses
      await this.updateWindowStatuses();
      
      return await Window.countDocuments({ isActive: false });
    } catch (error) {
      logger.error('Error getting inactive windows count:', error);
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
   * Delete a window
   */
  static async deleteWindow(windowId: string) {
    try {
      const result = await Window.findByIdAndDelete(windowId);
      return result;
    } catch (error) {
      logger.error('Error deleting window:', error);
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
export const deleteInactiveWindows = WindowService.deleteInactiveWindows;
export const getInactiveWindowsCount = WindowService.getInactiveWindowsCount;
export const isWindowActive = WindowService.isWindowActive;
export const createWindow = WindowService.createWindow;
export const updateWindow = WindowService.updateWindow;
export const deleteWindow = WindowService.deleteWindow;
export const getWindowsByProjectType = WindowService.getWindowsByProjectType;
export const getActiveWindow = WindowService.getActiveWindow;
export const getUpcomingWindows = WindowService.getUpcomingWindows;