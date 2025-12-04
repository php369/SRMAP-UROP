import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Eligibility } from '../models/Eligibility';
import { User } from '../models/User';
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

/**
 * GET /api/users/eligibility
 * Get current user's eligibility information
 */
router.get('/eligibility', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const userEmail = req.user!.email;

    try {
        // Find active eligibility for the user
        const now = new Date();
        const eligibility = await Eligibility.findOne({
            studentEmail: userEmail,
            validFrom: { $lte: now },
            validTo: { $gte: now }
        }).sort({ createdAt: -1 });

        if (!eligibility) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'ELIGIBILITY_NOT_FOUND',
                    message: 'No active eligibility found for this user',
                },
            });
        }

        res.json({
            success: true,
            data: {
                type: eligibility.type,
                year: eligibility.year,
                semester: eligibility.semester,
                termKind: eligibility.termKind,
                validFrom: eligibility.validFrom,
                validTo: eligibility.validTo,
            },
        });

    } catch (error) {
        logger.error('Error fetching eligibility:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'ELIGIBILITY_FETCH_FAILED',
                message: 'Failed to fetch eligibility information',
            },
        });
    }
}));

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
                avatar: user.avatar,
                studentId: user.studentId,
                facultyId: user.facultyId,
                isCoordinator: user.isCoordinator,
                isExternalEvaluator: user.isExternalEvaluator,
                profile: user.profile,
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

/**
 * PUT /api/users/profile
 * Update user's profile information
 */
router.put('/profile', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { profile } = req.body;

    if (!profile) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Profile data is required',
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

        // Update profile fields
        if (profile.department !== undefined) user.profile.department = profile.department;
        if (profile.year !== undefined) user.profile.year = profile.year;
        if (profile.semester !== undefined) user.profile.semester = profile.semester;
        if (profile.specialization !== undefined) user.profile.specialization = profile.specialization;
        if (profile.bio !== undefined) user.profile.bio = profile.bio;
        if (profile.skills !== undefined) user.profile.skills = profile.skills;
        if (profile.interests !== undefined) user.profile.interests = profile.interests;
        if (profile.phone !== undefined) user.profile.phone = profile.phone;
        if (profile.location !== undefined) user.profile.location = profile.location;
        if (profile.github !== undefined) user.profile.github = profile.github;
        if (profile.linkedin !== undefined) user.profile.linkedin = profile.linkedin;
        if (profile.portfolio !== undefined) user.profile.portfolio = profile.portfolio;

        // Update preferences if provided
        const { preferences } = req.body;
        if (preferences) {
            if (preferences.emailNotifications !== undefined) {
                user.preferences.emailNotifications = preferences.emailNotifications;
            }
            if (preferences.profileVisibility !== undefined) {
                user.preferences.profileVisibility = preferences.profileVisibility;
            }
        }

        await user.save();

        logger.info(`Profile updated for user: ${user.email}`);

        res.json({
            success: true,
            data: {
                message: 'Profile updated successfully',
                profile: user.profile,
            },
        });

    } catch (error) {
        logger.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'PROFILE_UPDATE_FAILED',
                message: 'Failed to update profile',
            },
        });
    }
}));

/**
 * PUT /api/users/avatar
 * Update user's avatar selection
 */
router.put('/avatar', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { avatar } = req.body;

    if (!avatar) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Avatar is required',
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

        user.avatar = avatar;
        await user.save();

        logger.info(`Avatar updated for user: ${user.email}`);

        res.json({
            success: true,
            data: {
                message: 'Avatar updated successfully',
                avatar: user.avatar,
            },
        });

    } catch (error) {
        logger.error('Error updating avatar:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'AVATAR_UPDATE_FAILED',
                message: 'Failed to update avatar',
            },
        });
    }
}));

export default router;
