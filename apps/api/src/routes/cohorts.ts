import { Router, Request, Response } from 'express';
import { cohortService } from '../services/cohortService';
import { authenticate } from '../middleware/auth';
import { rbacGuard, adminGuard } from '../middleware/rbac';
import mongoose from 'mongoose';

const router = Router();

/**
 * @route   POST /api/cohorts
 * @desc    Create a new cohort
 * @access  Admin only
 */
router.post(
    '/',
    authenticate,
    adminGuard(),
    async (req: Request, res: Response) => {
        try {
            const { name, year, department, members } = req.body;

            if (!name || !year || !department) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Name, year, and department are required'
                    }
                });
            }

            const cohort = await cohortService.createCohort({
                name,
                year,
                department,
                members: members || []
            });

            res.status(201).json({
                success: true,
                data: cohort
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'COHORT_CREATION_FAILED',
                    message: error.message
                }
            });
        }
    }
);

/**
 * @route   GET /api/cohorts
 * @desc    Get all cohorts with optional filters
 * @access  Authenticated users (all roles)
 */
router.get(
    '/',
    authenticate,
    async (req: Request, res: Response) => {
        try {
            const { year, department, status } = req.query;

            const filters: any = {};
            if (year) filters.year = parseInt(year as string);
            if (department) filters.department = department as string;
            if (status) filters.status = status as 'active' | 'inactive';

            const cohorts = await cohortService.getCohorts(filters);

            res.json({
                success: true,
                data: cohorts
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'COHORT_FETCH_FAILED',
                    message: error.message
                }
            });
        }
    }
);

/**
 * @route   GET /api/cohorts/:id
 * @desc    Get cohort by ID
 * @access  Authenticated users (all roles)
 */
router.get(
    '/:id',
    authenticate,
    async (req: Request, res: Response) => {
        try {
            const cohort = await cohortService.getCohortById(req.params.id);

            if (!cohort) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'COHORT_NOT_FOUND',
                        message: 'Cohort not found'
                    }
                });
            }

            res.json({
                success: true,
                data: cohort
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'COHORT_FETCH_FAILED',
                    message: error.message
                }
            });
        }
    }
);

/**
 * @route   PUT /api/cohorts/:id
 * @desc    Update cohort details
 * @access  Admin only
 */
router.put(
    '/:id',
    authenticate,
    adminGuard(),
    async (req: Request, res: Response) => {
        try {
            const { name, year, department, status } = req.body;

            const updates: any = {};
            if (name) updates.name = name;
            if (year) updates.year = year;
            if (department) updates.department = department;
            if (status) updates.status = status;

            const cohort = await cohortService.updateCohort(req.params.id, updates);

            if (!cohort) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'COHORT_NOT_FOUND',
                        message: 'Cohort not found'
                    }
                });
            }

            res.json({
                success: true,
                data: cohort
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'COHORT_UPDATE_FAILED',
                    message: error.message
                }
            });
        }
    }
);

/**
 * @route   DELETE /api/cohorts/:id
 * @desc    Delete cohort
 * @access  Admin only
 */
router.delete(
    '/:id',
    authenticate,
    adminGuard(),
    async (req: Request, res: Response) => {
        try {
            const deleted = await cohortService.deleteCohort(req.params.id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'COHORT_NOT_FOUND',
                        message: 'Cohort not found'
                    }
                });
            }

            res.json({
                success: true,
                message: 'Cohort deleted successfully'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'COHORT_DELETE_FAILED',
                    message: error.message
                }
            });
        }
    }
);

/**
 * @route   POST /api/cohorts/:id/members
 * @desc    Add members to cohort
 * @access  Admin only
 */
router.post(
    '/:id/members',
    authenticate,
    adminGuard(),
    async (req: Request, res: Response) => {
        try {
            const { memberIds } = req.body;

            if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'memberIds array is required'
                    }
                });
            }

            const cohort = await cohortService.addMembers(
                req.params.id,
                memberIds.map((id: string) => new mongoose.Types.ObjectId(id))
            );

            if (!cohort) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'COHORT_NOT_FOUND',
                        message: 'Cohort not found'
                    }
                });
            }

            res.json({
                success: true,
                data: cohort
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'ADD_MEMBERS_FAILED',
                    message: error.message
                }
            });
        }
    }
);

/**
 * @route   DELETE /api/cohorts/:id/members
 * @desc    Remove members from cohort
 * @access  Admin only
 */
router.delete(
    '/:id/members',
    authenticate,
    adminGuard(),
    async (req: Request, res: Response) => {
        try {
            const { memberIds } = req.body;

            if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'memberIds array is required'
                    }
                });
            }

            const cohort = await cohortService.removeMembers(
                req.params.id,
                memberIds.map((id: string) => new mongoose.Types.ObjectId(id))
            );

            if (!cohort) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'COHORT_NOT_FOUND',
                        message: 'Cohort not found'
                    }
                });
            }

            res.json({
                success: true,
                data: cohort
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'REMOVE_MEMBERS_FAILED',
                    message: error.message
                }
            });
        }
    }
);

/**
 * @route   POST /api/cohorts/:id/members/remove
 * @desc    Remove members from cohort (alternative to DELETE for better compatibility)
 * @access  Admin only
 */
router.post(
    '/:id/members/remove',
    authenticate,
    adminGuard(),
    async (req: Request, res: Response) => {
        try {
            const { memberIds } = req.body;

            if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'memberIds array is required'
                    }
                });
            }

            const cohort = await cohortService.removeMembers(
                req.params.id,
                memberIds.map((id: string) => new mongoose.Types.ObjectId(id))
            );

            if (!cohort) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'COHORT_NOT_FOUND',
                        message: 'Cohort not found'
                    }
                });
            }

            res.json({
                success: true,
                data: cohort
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'REMOVE_MEMBERS_FAILED',
                    message: error.message
                }
            });
        }
    }
);

/**
 * @route   POST /api/cohorts/:id/members/bulk
 * @desc    Bulk add members by email
 * @access  Admin only
 */
router.post(
    '/:id/members/bulk',
    authenticate,
    adminGuard(),
    async (req: Request, res: Response) => {
        try {
            const { emails } = req.body;

            if (!emails || !Array.isArray(emails) || emails.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'emails array is required'
                    }
                });
            }

            const result = await cohortService.bulkAddMembersByEmail(req.params.id, emails);

            res.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'BULK_ADD_FAILED',
                    message: error.message
                }
            });
        }
    }
);

/**
 * @route   GET /api/cohorts/:id/stats
 * @desc    Get cohort statistics
 * @access  Authenticated users (all roles)
 */
router.get(
    '/:id/stats',
    authenticate,
    async (req: Request, res: Response) => {
        try {
            const stats = await cohortService.getCohortStats(req.params.id);

            res.json({
                success: true,
                data: stats
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'STATS_FETCH_FAILED',
                    message: error.message
                }
            });
        }
    }
);

/**
 * @route   POST /api/cohorts/:id/join
 * @desc    Join a cohort (student adds themselves)
 * @access  Authenticated students
 */
router.post(
    '/:id/join',
    authenticate,
    async (req: Request, res: Response) => {
        try {
            const cohortId = req.params.id;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'NOT_AUTHENTICATED',
                        message: 'User not authenticated'
                    }
                });
            }

            // Add the current user to the cohort
            const cohort = await cohortService.addMembers(
                cohortId,
                [new mongoose.Types.ObjectId(userId)]
            );

            if (!cohort) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'COHORT_NOT_FOUND',
                        message: 'Cohort not found'
                    }
                });
            }

            res.json({
                success: true,
                data: cohort
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'JOIN_COHORT_FAILED',
                    message: error.message
                }
            });
        }
    }
);

/**
 * @route   GET /api/cohorts/user/:userId
 * @desc    Get cohorts for a specific user
 * @access  Authenticated
 */
router.get(
    '/user/:userId',
    authenticate,
    async (req: Request, res: Response) => {
        try {
            // Users can only view their own cohorts unless they're admin
            if (req.user?.id !== req.params.userId && req.user?.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: 'You can only view your own cohorts'
                    }
                });
            }

            const cohorts = await cohortService.getUserCohorts(req.params.userId);

            res.json({
                success: true,
                data: cohorts
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'COHORT_FETCH_FAILED',
                    message: error.message
                }
            });
        }
    }
);

export default router;
