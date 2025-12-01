import { Group, IGroup } from '../models/Group';
import { User } from '../models/User';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { assignGroupLeaderRole } from './roleService';

/**
 * Generate a unique 6-character alphanumeric group code
 * @param semester - Current semester
 * @param year - Current year
 * @param projectType - Project type
 * @returns Unique group code
 */
export async function generateGroupCode(
  semester: string,
  year: number,
  projectType: IGroup['projectType']
): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    // Generate 6-character code
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code is unique for this semester and project type
    const existing = await Group.findOne({
      groupCode: code,
      semester,
      year,
      projectType
    });

    if (!existing) {
      isUnique = true;
      return code!;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique group code after maximum attempts');
}

/**
 * Create a new group
 * @param leaderId - Student ID who creates the group
 * @param projectType - Project type
 * @param semester - Current semester
 * @param year - Current year
 * @param groupName - Optional group name
 * @returns Created group
 */
export async function createGroup(data: {
  leaderId: mongoose.Types.ObjectId;
  projectType: IGroup['projectType'];
  semester: string;
  year: number;
  groupName?: string;
}): Promise<IGroup> {
  try {
    const { leaderId, projectType, semester, year, groupName } = data;

    // Check if user is already a group leader
    const existingAsLeader = await Group.findOne({
      leaderId,
      status: { $in: ['forming', 'complete', 'applied', 'approved', 'frozen'] }
    });

    if (existingAsLeader) {
      throw new Error('User is already a group leader and cannot create another group');
    }

    // Check if user is already a member of another group
    const existingAsMember = await Group.findOne({
      members: leaderId,
      status: { $in: ['forming', 'complete', 'applied', 'approved', 'frozen'] }
    });

    if (existingAsMember) {
      throw new Error('User is already a member of another group');
    }

    // Generate unique group code
    const groupCode = await generateGroupCode(semester, year, projectType);

    // Generate unique group ID
    const groupId = `GRP-${projectType}-${year}-${groupCode}`;

    // Create group
    const group = new Group({
      groupId,
      groupCode,
      groupName,
      leaderId,
      members: [leaderId], // Leader is automatically a member
      projectType,
      semester,
      year,
      status: 'forming'
    });

    await group.save();

    // Assign Group_Leader role
    await assignGroupLeaderRole(leaderId, group._id);

    logger.info(`Group created: ${groupId} by user ${leaderId}`);
    return group;
  } catch (error) {
    logger.error('Error creating group:', error);
    throw error;
  }
}

/**
 * Join a group using group code
 * @param userId - Student ID joining the group
 * @param groupCode - Group code to join
 * @param semester - Current semester
 * @param year - Current year
 * @param projectType - Project type
 * @returns Updated group
 */
export async function joinGroup(
  userId: mongoose.Types.ObjectId,
  groupCode: string,
  semester: string,
  year: number,
  projectType: IGroup['projectType']
): Promise<IGroup> {
  try {
    // Check if user is a group leader
    const isLeader = await Group.findOne({
      leaderId: userId,
      status: { $in: ['forming', 'complete', 'applied', 'approved', 'frozen'] }
    });

    if (isLeader) {
      throw new Error('Group leaders cannot join other groups');
    }

    // Check if user is already in a group
    const existingMembership = await Group.findOne({
      members: userId,
      status: { $in: ['forming', 'complete', 'applied', 'approved', 'frozen'] }
    });

    if (existingMembership) {
      throw new Error('User is already a member of a group');
    }

    // Find the group
    const group = await Group.findOne({
      groupCode,
      semester,
      year,
      projectType,
      status: 'forming' // Can only join groups that are still forming
    });

    if (!group) {
      throw new Error('Group not found or no longer accepting members');
    }

    // Check group size (max 4 members)
    if (group.members.length >= 4) {
      throw new Error('Group is full (maximum 4 members)');
    }

    // Add user to group
    group.members.push(userId);

    // Update status to 'complete' if group now has 2+ members
    if (group.members.length >= 2) {
      group.status = 'complete';
    }

    await group.save();

    logger.info(`User ${userId} joined group ${group.groupId}`);
    return group;
  } catch (error) {
    logger.error('Error joining group:', error);
    throw error;
  }
}

/**
 * Leave a group
 * @param userId - Student ID leaving the group
 * @param groupId - Group ID
 * @returns Updated group or null if group was deleted
 */
export async function leaveGroup(
  userId: mongoose.Types.ObjectId,
  groupId: string | mongoose.Types.ObjectId
): Promise<IGroup | null> {
  try {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Check if user is the leader
    if (group.leaderId.toString() === userId.toString()) {
      // If leader leaves, delete the group
      await Group.findByIdAndDelete(groupId);
      logger.info(`Group ${group.groupId} deleted as leader left`);
      return null;
    }

    // Remove user from members
    group.members = group.members.filter(
      memberId => memberId.toString() !== userId.toString()
    );

    // Update status if group now has less than 2 members
    if (group.members.length < 2) {
      group.status = 'forming';
    }

    await group.save();

    logger.info(`User ${userId} left group ${group.groupId}`);
    return group;
  } catch (error) {
    logger.error('Error leaving group:', error);
    throw error;
  }
}

/**
 * Get group by ID
 * @param groupId - Group ID
 * @returns Group with populated members
 */
export async function getGroupById(
  groupId: string | mongoose.Types.ObjectId
): Promise<IGroup | null> {
  try {
    return await Group.findById(groupId)
      .populate('leaderId', 'name email studentId')
      .populate('members', 'name email studentId')
      .populate('assignedFacultyId', 'name email facultyId')
      .populate('externalEvaluatorId', 'name email facultyId');
  } catch (error) {
    logger.error('Error getting group:', error);
    return null;
  }
}

/**
 * Get group by code
 * @param groupCode - Group code
 * @param semester - Semester
 * @param year - Year
 * @param projectType - Project type
 * @returns Group
 */
export async function getGroupByCode(
  groupCode: string,
  semester: string,
  year: number,
  projectType: IGroup['projectType']
): Promise<IGroup | null> {
  try {
    return await Group.findOne({
      groupCode,
      semester,
      year,
      projectType
    })
      .populate('leaderId', 'name email studentId')
      .populate('members', 'name email studentId');
  } catch (error) {
    logger.error('Error getting group by code:', error);
    return null;
  }
}

/**
 * Get user's group
 * @param userId - User ID
 * @returns User's group or null
 */
export async function getUserGroup(
  userId: mongoose.Types.ObjectId
): Promise<IGroup | null> {
  try {
    return await Group.findOne({
      members: userId,
      status: { $in: ['forming', 'complete', 'applied', 'approved', 'frozen'] }
    })
      .populate('leaderId', 'name email studentId')
      .populate('members', 'name email studentId')
      .populate('assignedFacultyId', 'name email facultyId')
      .populate('externalEvaluatorId', 'name email facultyId');
  } catch (error) {
    logger.error('Error getting user group:', error);
    return null;
  }
}

/**
 * Check if user is in a group
 * @param userId - User ID
 * @returns true if user is in a group
 */
export async function isUserInGroup(
  userId: mongoose.Types.ObjectId
): Promise<boolean> {
  try {
    const group = await Group.findOne({
      members: userId,
      status: { $in: ['forming', 'complete', 'applied', 'approved', 'frozen'] }
    });
    return !!group;
  } catch (error) {
    logger.error('Error checking user group membership:', error);
    return false;
  }
}

/**
 * Validate group size
 * @param groupId - Group ID
 * @returns true if group has 2-4 members
 */
export async function validateGroupSize(
  groupId: string | mongoose.Types.ObjectId
): Promise<boolean> {
  try {
    const group = await Group.findById(groupId);
    if (!group) return false;

    return group.members.length >= 2 && group.members.length <= 4;
  } catch (error) {
    logger.error('Error validating group size:', error);
    return false;
  }
}

/**
 * Get all groups for a project type
 * @param projectType - Project type
 * @param semester - Optional semester filter
 * @param year - Optional year filter
 * @returns Array of groups
 */
export async function getGroupsByProjectType(
  projectType: IGroup['projectType'],
  semester?: string,
  year?: number
): Promise<IGroup[]> {
  try {
    const query: any = { projectType };
    if (semester) query.semester = semester;
    if (year) query.year = year;

    return await Group.find(query)
      .populate('leaderId', 'name email studentId')
      .populate('members', 'name email studentId')
      .sort({ createdAt: -1 });
  } catch (error) {
    logger.error('Error getting groups by project type:', error);
    return [];
  }
}
