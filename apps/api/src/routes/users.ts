import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { User } from '../models/User';
import { Group } from '../models/Group';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/users
 * Get user information based on role and permissions
 */
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const userRole = req.user!.role;
    const userId = req.user!.id;

    try {
        if (userRole === 'admin' || userRole === 'coordinator') {
            // Admin and coordinators can see all users
            const users = await User.find({})
                .select('-googleId -__v')
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                data: {
                    users,
                    count: users.length,
                    userRole,
                },
            });
        } else {
            // Regular users can only see their own information
            const user = await User.findById(userId)
                .select('-googleId -__v');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found',
                        timestamp: new Date().toISOString(),
                    },
                });
            }

            res.json({
                success: true,
                data: {
                    user,
                    userRole,
                },
            });
        }
    } catch (error) {
        logger.error('Error retrieving users:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'USERS_FETCH_ERROR',
                message: 'Failed to retrieve user information',
                timestamp: new Date().toISOString(),
            },
        });
    }
}));

// Eligibility endpoint removed - authorization now based on User model fields (role, isCoordinator, isExternalEvaluator)

/**
 * GET /api/users/profile
 * Get current user's profile
 */
router.get('/profile', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found',
                },
            });
        }

        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                studentId: user.studentId,
                facultyId: user.facultyId,
                isCoordinator: user.isCoordinator,
                isExternalEvaluator: user.isExternalEvaluator,
                preferences: user.preferences,
                lastSeen: user.lastSeen,
                createdAt: user.createdAt,
            },
        });

    } catch (error) {
        logger.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'PROFILE_FETCH_FAILED',
                message: 'Failed to fetch profile information',
            },
        });
    }
}));

// Profile and avatar endpoints removed - profile and avatar fields no longer exist in User model

/**
 * PUT /api/users/name
 * Update user's display name
 */
router.put('/name', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Valid name is required',
            },
        });
    }

    // Validate name format (only letters, spaces, and common punctuation)
    const nameRegex = /^[a-zA-Z\s.'-]+$/;
    if (!nameRegex.test(name.trim())) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Name can only contain letters, spaces, and common punctuation (. \' -)',
            },
        });
    }

    // Validate name length
    if (name.trim().length < 2 || name.trim().length > 100) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Name must be between 2 and 100 characters',
            },
        });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found',
                },
            });
        }

        const oldName = user.name;
        user.name = name.trim();
        await user.save();

        logger.info(`Name updated for user: ${user.email} (${oldName} -> ${user.name})`);

        res.json({
            success: true,
            data: {
                message: 'Name updated successfully',
                name: user.name,
            },
        });

    } catch (error) {
        logger.error('Error updating name:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'NAME_UPDATE_FAILED',
                message: 'Failed to update name',
            },
        });
    }
}));

/**
 * GET /api/users/dashboard-data
 * Get comprehensive dashboard data for current user (students)
 * Includes: user info, group info, project assignment, faculty info
 */
router.get('/dashboard-data', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    try {
        // Get user with populated project and faculty info
        const user = await User.findById(userId)
            .populate('assignedProjectId', 'title brief description projectType department')
            .populate('assignedFacultyId', 'name email facultyId department')
            .populate('currentGroupId')
            .select('-googleId -__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        let dashboardData: any = {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                studentId: user.studentId,
                facultyId: user.facultyId,
                isCoordinator: user.isCoordinator,
                assignedProject: user.assignedProjectId,
                assignedFaculty: user.assignedFacultyId,
            }
        };

        // For students, get additional group and application info
        if (userRole.includes('student')) {
            // Get group info if user is in a group
            if (user.currentGroupId) {
                const group = await Group.findById(user.currentGroupId)
                    .populate('leaderId', 'name email studentId')
                    .populate('members', 'name email studentId')
                    .populate('assignedProjectId', 'title brief description')
                    .populate('assignedFacultyId', 'name email facultyId');

                dashboardData.group = group;
            }

            // Get application status
            const { getApplicationsForUser } = await import('../services/applicationService');
            const applications = await getApplicationsForUser(new mongoose.Types.ObjectId(userId));
            dashboardData.applications = applications;

            // Determine student status
            dashboardData.studentStatus = {
                hasGroup: !!user.currentGroupId,
                hasProject: !!user.assignedProjectId,
                hasFaculty: !!user.assignedFacultyId,
                applicationsCount: applications.length,
                approvedApplications: applications.filter((app: any) => app.status === 'approved').length
            };
        }

        logger.info(`Dashboard data fetched for user ${userId}`, {
            hasGroup: !!dashboardData.group,
            hasProject: !!user.assignedProjectId,
            applicationsCount: dashboardData.applications?.length || 0
        });

        res.json({
            success: true,
            data: dashboardData,
        });

    } catch (error) {
        logger.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DASHBOARD_FETCH_FAILED',
                message: 'Failed to fetch dashboard data',
                timestamp: new Date().toISOString(),
            },
        });
    }
}));

export default router;
