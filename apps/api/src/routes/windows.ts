import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    createWindow,
    updateWindow,
    deleteWindow,
    deleteWindows,
    getWindowsByProjectType,
    getActiveWindow,
    getUpcomingWindows,
    updateWindowStatuses
} from '../services/windowService';
import { logger } from '../utils/logger';

const router: Router = Router();

/**
 * GET /api/windows
 * Get all windows (optionally filtered by project type)
 * Accessible by: all authenticated users
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const { projectType } = req.query;

        let windows;
        if (projectType) {
            windows = await getWindowsByProjectType(projectType as any);
        } else {
            const { Window } = await import('../models/Window');
            windows = await Window.find().sort({ startDate: 1 });
        }

        res.json({
            success: true,
            data: windows,
        });
    } catch (error) {
        logger.error('Error fetching windows:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_WINDOWS_FAILED',
                message: 'Failed to fetch windows',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * GET /api/windows/active
 * Get active window for a specific type and project
 * Accessible by: all authenticated users
 */
router.get('/active', authenticate, async (req, res) => {
    try {
        const { windowType, projectType, assessmentType } = req.query;

        if (!windowType || !projectType) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PARAMETERS',
                    message: 'windowType and projectType are required',
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        const window = await getActiveWindow(
            windowType as any,
            projectType as any,
            assessmentType as any
        );

        res.json({
            success: true,
            data: window,
            isActive: !!window,
        });
    } catch (error) {
        logger.error('Error fetching active window:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_ACTIVE_WINDOW_FAILED',
                message: 'Failed to fetch active window',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * GET /api/windows/upcoming
 * Get upcoming windows
 * Accessible by: all authenticated users
 */
router.get('/upcoming', authenticate, async (req, res) => {
    try {
        const { projectType, limit } = req.query;

        const windows = await getUpcomingWindows(
            projectType as any,
            limit ? parseInt(limit as string) : 5
        );

        res.json({
            success: true,
            data: windows,
        });
    } catch (error) {
        logger.error('Error fetching upcoming windows:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_UPCOMING_WINDOWS_FAILED',
                message: 'Failed to fetch upcoming windows',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * POST /api/windows
 * Create a new window
 * Accessible by: coordinator only
 */
router.post('/', authenticate, authorize('coordinator'), async (req, res) => {
    try {
        const { windowType, projectType, assessmentType, startDate, endDate } = req.body;

        if (!windowType || !projectType || !startDate || !endDate) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_REQUIRED_FIELDS',
                    message: 'windowType, projectType, startDate, and endDate are required',
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        const window = await createWindow({
            windowType,
            projectType,
            assessmentType,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            createdBy: req.user!.id as any,
        });

        res.status(201).json({
            success: true,
            data: window,
            message: 'Window created successfully',
        });
    } catch (error: any) {
        logger.error('Error creating window:', error);

        if (error.message?.includes('overlap')) {
            res.status(409).json({
                success: false,
                error: {
                    code: 'WINDOW_OVERLAP',
                    message: error.message,
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'CREATE_WINDOW_FAILED',
                message: 'Failed to create window',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * PUT /api/windows/:id
 * Update a window
 * Accessible by: coordinator only
 */
router.put('/:id', authenticate, authorize('coordinator'), async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Remove fields that shouldn't be updated directly
        delete updates._id;
        delete updates.createdBy;
        delete updates.createdAt;
        delete updates.updatedAt;

        const window = await updateWindow(id, updates);

        if (!window) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'WINDOW_NOT_FOUND',
                    message: 'Window not found',
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        res.json({
            success: true,
            data: window,
            message: 'Window updated successfully',
        });
    } catch (error) {
        logger.error('Error updating window:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_WINDOW_FAILED',
                message: 'Failed to update window',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * DELETE /api/windows/:id
 * Delete a window
 * Accessible by: coordinator only
 */
router.delete('/:id', authenticate, authorize('coordinator'), async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await deleteWindow(id);

        if (!deleted) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'WINDOW_NOT_FOUND',
                    message: 'Window not found',
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        res.json({
            success: true,
            message: 'Window deleted successfully',
        });
    } catch (error) {
        logger.error('Error deleting window:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DELETE_WINDOW_FAILED',
                message: 'Failed to delete window',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * DELETE /api/windows/bulk
 * Delete multiple windows
 * Accessible by: coordinator only
 */
router.delete('/bulk', authenticate, authorize('coordinator'), async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PARAMETERS',
                    message: 'ids must be a non-empty array',
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        const { deletedCount } = await deleteWindows(ids);

        res.json({
            success: true,
            data: { deletedCount },
            message: `Successfully deleted ${deletedCount} windows`,
        });
    } catch (error) {
        logger.error('Error bulk deleting windows:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'BULK_DELETE_FAILED',
                message: 'Failed to delete windows',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * POST /api/windows/update-statuses
 * Manually trigger window status update
 * Accessible by: coordinator, admin
 */
router.post('/update-statuses', authenticate, authorize('coordinator', 'admin'), async (req, res) => {
    try {
        await updateWindowStatuses();

        res.json({
            success: true,
            message: 'Window statuses updated successfully',
        });
    } catch (error) {
        logger.error('Error updating window statuses:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_STATUSES_FAILED',
                message: 'Failed to update window statuses',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

export default router;
