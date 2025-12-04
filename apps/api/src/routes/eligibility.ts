import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    uploadEligibilityList,
    getEligibilityList,
    checkEligibility,
    deleteEligibility,
    deactivateEligibility,
    getEligibilityStats
} from '../services/eligibilityService';
import {
    uploadFacultyRoster,
    getFacultyRoster,
    updateFacultyRecord,
    deleteFacultyRecord
} from '../services/facultyService';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * POST /api/eligibility/upload
 * Upload eligibility list from CSV
 * Accessible by: admin only
 */
router.post('/upload', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { csvData, projectType } = req.body;

        if (!csvData || !projectType) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_REQUIRED_FIELDS',
                    message: 'csvData and projectType are required',
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        const result = await uploadEligibilityList(
            csvData,
            projectType,
            req.user!.id as any
        );

        res.json({
            success: true,
            data: result,
            message: `Upload completed: ${result.success} successful, ${result.failed} failed`,
        });
    } catch (error: any) {
        logger.error('Error uploading eligibility list:', error);

        if (error.message?.includes('Invalid CSV')) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_CSV_FORMAT',
                    message: error.message,
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        if (error.message?.includes('Invalid email domain')) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_EMAIL_DOMAIN',
                    message: error.message,
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'UPLOAD_FAILED',
                message: 'Failed to upload eligibility list',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * GET /api/eligibility
 * Get eligibility list
 * Accessible by: admin, coordinator
 */
router.get('/', authenticate, authorize('admin', 'coordinator'), async (req, res) => {
    try {
        const { projectType, year, semester, isActive } = req.query;

        const eligibilityList = await getEligibilityList({
            projectType: projectType as any,
            year: year ? parseInt(year as string) : undefined,
            semester: semester ? parseInt(semester as string) : undefined
        });

        res.json({
            success: true,
            data: eligibilityList,
            count: eligibilityList.length,
        });
    } catch (error) {
        logger.error('Error getting eligibility list:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'GET_ELIGIBILITY_FAILED',
                message: 'Failed to get eligibility list',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * GET /api/eligibility/check
 * Check if user is eligible
 * Accessible by: authenticated users
 */
router.get('/check', authenticate, async (req, res) => {
    try {
        const { projectType } = req.query;

        if (!projectType) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PROJECT_TYPE',
                    message: 'projectType is required',
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        const eligibility = await checkEligibility(
            req.user!.email,
            projectType as any
        );

        res.json({
            success: true,
            data: eligibility,
            isEligible: !!eligibility,
        });
    } catch (error) {
        logger.error('Error checking eligibility:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'CHECK_ELIGIBILITY_FAILED',
                message: 'Failed to check eligibility',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * GET /api/eligibility/stats
 * Get eligibility statistics
 * Accessible by: admin, coordinator
 */
router.get('/stats', authenticate, authorize('admin', 'coordinator'), async (req, res) => {
    try {
        const stats = await getEligibilityStats();

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        logger.error('Error getting eligibility stats:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'GET_STATS_FAILED',
                message: 'Failed to get eligibility statistics',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * DELETE /api/eligibility/:id
 * Delete eligibility record
 * Accessible by: admin only
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await deleteEligibility(id);

        if (!deleted) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'ELIGIBILITY_NOT_FOUND',
                    message: 'Eligibility record not found',
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        res.json({
            success: true,
            message: 'Eligibility record deleted successfully',
        });
    } catch (error) {
        logger.error('Error deleting eligibility:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DELETE_FAILED',
                message: 'Failed to delete eligibility record',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * POST /api/eligibility/deactivate
 * Deactivate eligibility records
 * Accessible by: admin only
 */
router.post('/deactivate', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { projectType, year, semester } = req.body;

        const count = await deactivateEligibility({
            projectType,
            year: year ? parseInt(year) : undefined,
            semester: semester ? parseInt(semester) : undefined
        });

        res.json({
            success: true,
            message: `Deactivated ${count} eligibility records`,
            count,
        });
    } catch (error) {
        logger.error('Error deactivating eligibility:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DEACTIVATE_FAILED',
                message: 'Failed to deactivate eligibility records',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * POST /api/eligibility/faculty/upload
 * Upload faculty roster from CSV
 * Accessible by: admin only
 */
router.post('/faculty/upload', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { csvData } = req.body;

        if (!csvData) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_REQUIRED_FIELDS',
                    message: 'csvData is required',
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        const result = await uploadFacultyRoster(csvData);

        logger.info('Faculty upload result:', result);

        res.json({
            success: true,
            data: result,
            message: `Upload completed: ${result.successful} created, ${result.updated} updated, ${result.failed} failed`,
        });
    } catch (error: any) {
        logger.error('Error uploading faculty roster:', error);

        if (error.message?.includes('Invalid CSV') || error.message?.includes('CSV parsing failed')) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_CSV_FORMAT',
                    message: error.message,
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        if (error.message?.includes('Invalid email domain')) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_EMAIL_DOMAIN',
                    message: error.message,
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'UPLOAD_FAILED',
                message: 'Failed to upload faculty roster',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * GET /api/eligibility/faculty
 * Get faculty roster
 * Accessible by: admin, coordinator
 */
router.get('/faculty', authenticate, authorize('admin', 'coordinator'), async (req, res) => {
    try {
        const { dept, isCoordinator, active } = req.query;

        const faculty = await getFacultyRoster({
            dept: dept as string,
            isCoordinator: isCoordinator === 'true' ? true : isCoordinator === 'false' ? false : undefined,
            active: active === 'true' ? true : active === 'false' ? false : undefined
        });

        res.json({
            success: true,
            data: faculty,
            count: faculty.length,
        });
    } catch (error) {
        logger.error('Error getting faculty roster:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_FAILED',
                message: 'Failed to fetch faculty roster',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * PUT /api/eligibility/faculty/:email
 * Update faculty roster record
 * Accessible by: admin only
 */
router.put('/faculty/:email', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { email } = req.params;
        const updates = req.body;

        const faculty = await updateFacultyRecord(email, updates);

        if (!faculty) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'FACULTY_NOT_FOUND',
                    message: 'Faculty record not found',
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        res.json({
            success: true,
            data: faculty,
            message: 'Faculty record updated successfully',
        });
    } catch (error) {
        logger.error('Error updating faculty record:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_FAILED',
                message: 'Failed to update faculty record',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * DELETE /api/eligibility/faculty/:email
 * Delete faculty roster record
 * Accessible by: admin only
 */
router.delete('/faculty/:email', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { email } = req.params;

        const deleted = await deleteFacultyRecord(email);

        if (!deleted) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'FACULTY_NOT_FOUND',
                    message: 'Faculty record not found',
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        res.json({
            success: true,
            message: 'Faculty record deleted successfully',
        });
    } catch (error) {
        logger.error('Error deleting faculty record:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DELETE_FAILED',
                message: 'Failed to delete faculty record',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

export default router;
