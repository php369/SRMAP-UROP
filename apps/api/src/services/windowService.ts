import { Window, IWindow } from '../models/Window';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Check if a specific window is currently active
 * @param windowType - Type of window to check
 * @param projectType - Project type (IDP, UROP, CAPSTONE)
 * @param assessmentType - Optional assessment type for submission/assessment windows
 * @returns true if window is active, false otherwise
 */
export async function isWindowActive(
    windowType: IWindow['windowType'],
    projectType: IWindow['projectType'],
    assessmentType?: IWindow['assessmentType']
): Promise<boolean> {
    try {
        const now = new Date();

        const query: any = {
            windowType,
            projectType,
            startDate: { $lte: now },
            endDate: { $gte: now }
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
 * Get active window for a specific type and project
 * @param windowType - Type of window
 * @param projectType - Project type
 * @param assessmentType - Optional assessment type
 * @returns Active window or null
 */
export async function getActiveWindow(
    windowType: IWindow['windowType'],
    projectType: IWindow['projectType'],
    assessmentType?: IWindow['assessmentType']
): Promise<IWindow | null> {
    try {
        const now = new Date();

        const query: any = {
            windowType,
            projectType,
            startDate: { $lte: now },
            endDate: { $gte: now }
        };

        if (assessmentType) {
            query.assessmentType = assessmentType;
        }

        return await Window.findOne(query);
    } catch (error) {
        logger.error('Error getting active window:', error);
        return null;
    }
}

/**
 * Get all windows for a project type
 * @param projectType - Project type
 * @returns Array of windows
 */
export async function getWindowsByProjectType(
    projectType: IWindow['projectType']
): Promise<IWindow[]> {
    try {
        return await Window.find({ projectType }).sort({ startDate: 1 });
    } catch (error) {
        logger.error('Error getting windows by project type:', error);
        return [];
    }
}

/**
 * Create a new window
 * @param windowData - Window data
 * @returns Created window
 */
export async function createWindow(windowData: {
    windowType: IWindow['windowType'];
    projectType: IWindow['projectType'];
    assessmentType?: IWindow['assessmentType'];
    startDate: Date;
    endDate: Date;
    createdBy: mongoose.Types.ObjectId;
}): Promise<IWindow> {
    try {
        // Check for overlapping windows
        const overlapping = await Window.findOne({
            windowType: windowData.windowType,
            projectType: windowData.projectType,
            assessmentType: windowData.assessmentType,
            $or: [
                {
                    startDate: { $lte: windowData.endDate },
                    endDate: { $gte: windowData.startDate }
                }
            ]
        });

        if (overlapping) {
            throw new Error('Window overlaps with existing window');
        }

        const window = new Window(windowData);
        await window.save();

        logger.info(`Window created: ${window.windowType} for ${window.projectType}`);
        return window;
    } catch (error) {
        logger.error('Error creating window:', error);
        throw error;
    }
}

/**
 * Update a window
 * @param windowId - Window ID
 * @param updates - Updates to apply
 * @returns Updated window
 */
export async function updateWindow(
    windowId: string | mongoose.Types.ObjectId,
    updates: Partial<IWindow>
): Promise<IWindow | null> {
    try {
        const window = await Window.findByIdAndUpdate(
            windowId,
            updates,
            { new: true, runValidators: true }
        );

        if (window) {
            logger.info(`Window updated: ${window._id}`);
        }

        return window;
    } catch (error) {
        logger.error('Error updating window:', error);
        throw error;
    }
}

/**
 * Delete a window
 * @param windowId - Window ID
 * @returns true if deleted, false otherwise
 */
export async function deleteWindow(
    windowId: string | mongoose.Types.ObjectId
): Promise<boolean> {
    try {
        const result = await Window.findByIdAndDelete(windowId);

        if (result) {
            logger.info(`Window deleted: ${windowId}`);
            return true;
        }

        return false;
    } catch (error) {
        logger.error('Error deleting window:', error);
        return false;
    }
}

/**
 * Update all windows' isActive status based on current time
 * This should be run periodically (e.g., via cron job)
 */
export async function updateWindowStatuses(): Promise<void> {
    try {
        const now = new Date();

        // Set active windows
        await Window.updateMany(
            {
                startDate: { $lte: now },
                endDate: { $gte: now },
                isActive: false
            },
            { isActive: true }
        );

        // Set inactive windows
        await Window.updateMany(
            {
                $or: [
                    { endDate: { $lt: now } },
                    { startDate: { $gt: now } }
                ],
                isActive: true
            },
            { isActive: false }
        );

        logger.info('Window statuses updated');
    } catch (error) {
        logger.error('Error updating window statuses:', error);
    }
}

/**
 * Get upcoming windows
 * @param projectType - Optional project type filter
 * @param limit - Number of windows to return
 * @returns Array of upcoming windows
 */
export async function getUpcomingWindows(
    projectType?: IWindow['projectType'],
    limit: number = 5
): Promise<IWindow[]> {
    try {
        const now = new Date();
        const query: any = {
            startDate: { $gt: now }
        };

        if (projectType) {
            query.projectType = projectType;
        }

        return await Window.find(query)
            .sort({ startDate: 1 })
            .limit(limit);
    } catch (error) {
        logger.error('Error getting upcoming windows:', error);
        return [];
    }
}
