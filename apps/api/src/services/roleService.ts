import { Group } from '../models/Group';
import { User } from '../models/User';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Check if a student is a group leader
 * @param userId - User ID to check
 * @returns true if user is a group leader
 */
export async function isGroupLeader(userId: string | mongoose.Types.ObjectId): Promise<boolean> {
    try {
        const objectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

        const group = await Group.findOne({
            leaderId: objectId,
            status: { $in: ['forming', 'complete', 'applied', 'approved', 'frozen'] }
        });

        return !!group;
    } catch (error) {
        logger.error('Error checking group leader status:', error);
        return false;
    }
}

/**
 * Check if a faculty member is a coordinator
 * @param userId - User ID to check
 * @returns true if user is a coordinator
 */
export async function isCoordinator(userId: string | mongoose.Types.ObjectId): Promise<boolean> {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return false;
        }

        // Check if user has isCoordinator flag or is admin
        return user.isCoordinator || user.role === 'admin';
    } catch (error) {
        logger.error('Error checking coordinator status:', error);
        return false;
    }
}

/**
 * Check if a faculty member is assigned as an external evaluator for any group
 * @param userId - User ID to check
 * @returns true if user is an external evaluator
 */
export async function isExternalEvaluator(userId: string | mongoose.Types.ObjectId): Promise<boolean> {
    try {
        const objectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

        const group = await Group.findOne({
            externalEvaluatorId: objectId
        });

        return !!group;
    } catch (error) {
        logger.error('Error checking external evaluator status:', error);
        return false;
    }
}

/**
 * Get enhanced user role information including sub-roles
 * @param userId - User ID
 * @returns Enhanced role information
 */
export async function getEnhancedUserRole(userId: string | mongoose.Types.ObjectId) {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return null;
        }

        const [groupLeader, coordinator, externalEvaluator] = await Promise.all([
            user.role.endsWith('-student') ? isGroupLeader(userId) : Promise.resolve(false),
            user.role === 'faculty' ? isCoordinator(userId) : Promise.resolve(false),
            user.role === 'faculty' ? isExternalEvaluator(userId) : Promise.resolve(false)
        ]);

        // Admin users should have coordinator privileges
        const isCoordinatorRole = user.role === 'admin' || coordinator;

        return {
            baseRole: user.role,
            isGroupLeader: groupLeader,
            isCoordinator: isCoordinatorRole,
            isExternalEvaluator: externalEvaluator,
            effectiveRole: isCoordinatorRole ? 'coordinator' : user.role
        };
    } catch (error) {
        logger.error('Error getting enhanced user role:', error);
        return null;
    }
}

/**
 * Assign Group_Leader role to a student when they create a group
 * This is handled automatically by the Group model, but this function
 * can be used to verify or update the status
 * @param userId - User ID
 * @param groupId - Group ID
 */
export async function assignGroupLeaderRole(
    userId: string | mongoose.Types.ObjectId,
    groupId: string | mongoose.Types.ObjectId
): Promise<void> {
    try {
        const objectUserId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
        const objectGroupId = typeof groupId === 'string' ? new mongoose.Types.ObjectId(groupId) : groupId;

        const group = await Group.findById(objectGroupId);
        if (!group) {
            throw new Error('Group not found');
        }

        if (group.leaderId.toString() !== objectUserId.toString()) {
            throw new Error('User is not the leader of this group');
        }

        logger.info(`Group leader role confirmed for user ${userId} in group ${groupId}`);
    } catch (error) {
        logger.error('Error assigning group leader role:', error);
        throw error;
    }
}

/**
 * Assign External_Evaluator role to a faculty member for a specific group
 * @param facultyId - Faculty user ID
 * @param groupId - Group ID
 */
export async function assignExternalEvaluatorRole(
    facultyId: string | mongoose.Types.ObjectId,
    groupId: string | mongoose.Types.ObjectId
): Promise<void> {
    try {
        const objectFacultyId = typeof facultyId === 'string' ? new mongoose.Types.ObjectId(facultyId) : facultyId;
        const objectGroupId = typeof groupId === 'string' ? new mongoose.Types.ObjectId(groupId) : groupId;

        // Verify faculty exists and has faculty role
        const faculty = await User.findById(objectFacultyId);
        if (!faculty || faculty.role !== 'faculty') {
            throw new Error('User is not a faculty member');
        }

        // Update group with external evaluator
        const group = await Group.findByIdAndUpdate(
            objectGroupId,
            { externalEvaluatorId: objectFacultyId },
            { new: true }
        );

        if (!group) {
            throw new Error('Group not found');
        }

        logger.info(`External evaluator role assigned to faculty ${facultyId} for group ${groupId}`);
    } catch (error) {
        logger.error('Error assigning external evaluator role:', error);
        throw error;
    }
}

/**
 * Remove External_Evaluator role from a faculty member for a specific group
 * @param groupId - Group ID
 */
export async function removeExternalEvaluatorRole(
    groupId: string | mongoose.Types.ObjectId
): Promise<void> {
    try {
        const objectGroupId = typeof groupId === 'string' ? new mongoose.Types.ObjectId(groupId) : groupId;

        const group = await Group.findByIdAndUpdate(
            objectGroupId,
            { $unset: { externalEvaluatorId: 1 } },
            { new: true }
        );

        if (!group) {
            throw new Error('Group not found');
        }

        logger.info(`External evaluator role removed from group ${groupId}`);
    } catch (error) {
        logger.error('Error removing external evaluator role:', error);
        throw error;
    }
}
