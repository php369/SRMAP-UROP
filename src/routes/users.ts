import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Eligibility } from '../models/Eligibility';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const router = Router();

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
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                studentId: user.studentId,
                facultyId: user.facultyId,
                isCoordinator: user.isCoordinator,
                profile: user.profile,
                preferences: user.preferences,
                lastSeen: user.lastSeen,
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
