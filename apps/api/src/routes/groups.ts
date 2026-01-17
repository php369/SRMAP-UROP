import express, { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  createGroup,
  joinGroup,
  leaveGroup,
  getGroupById,
  getGroupByCode,
  getUserGroup,
  getGroupsByProjectType
} from '../services/groupService';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';
import Group from '../models/Group';
import GroupMemberDetails from '../models/GroupMemberDetails';

const router: Router = express.Router();

/**
 * POST /api/groups
 * Create a new group
 * Accessible by: students only
 */
router.post('/', authenticate, authorize('student'), async (req, res) => {
  try {
    const { projectType, year, groupName } = req.body;

    if (!projectType || !year) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'projectType and year are required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const group = await createGroup({
      leaderId: new mongoose.Types.ObjectId(req.user!.id),
      projectType,
      year,
      groupName
    });

    res.status(201).json({
      success: true,
      data: group,
      message: 'Group created successfully. You are now the group leader.',
    });
  } catch (error: any) {
    logger.error('Error creating group:', error);

    if (error.message?.includes('already leading a group') || error.message?.includes('already a group leader')) {
      res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_GROUP_LEADER',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    if (error.message?.includes('already a member')) {
      res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_IN_GROUP',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_GROUP_FAILED',
        message: 'Failed to create group',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/groups/join
 * Join a group using group code
 * Accessible by: students only
 */
router.post('/join', authenticate, authorize('student'), async (req, res) => {
  try {
    const { groupCode, year, projectType } = req.body;

    if (!groupCode || !year || !projectType) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'groupCode, year, and projectType are required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const group = await joinGroup(
      new mongoose.Types.ObjectId(req.user!.id),
      groupCode.toUpperCase(),
      year,
      projectType
    );

    res.json({
      success: true,
      data: group,
      message: 'Successfully joined the group',
    });
  } catch (error: any) {
    logger.error('Error joining group:', error);

    if (error.message?.includes('Group leaders cannot join')) {
      res.status(403).json({
        success: false,
        error: {
          code: 'GROUP_LEADER_CANNOT_JOIN',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    if (error.message?.includes('already a member')) {
      res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_IN_GROUP',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    if (error.message?.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    if (error.message?.includes('full')) {
      res.status(409).json({
        success: false,
        error: {
          code: 'GROUP_FULL',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'JOIN_GROUP_FAILED',
        message: 'Failed to join group',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/groups/:id/leave
 * Leave a group
 * Accessible by: students only
 */
router.post('/:id/leave', authenticate, authorize('student'), async (req, res) => {
  try {
    const { id } = req.params;

    const group = await leaveGroup(
      new mongoose.Types.ObjectId(req.user!.id),
      id
    );

    if (group === null) {
      res.json({
        success: true,
        message: 'Group was disbanded as the leader left',
      });
      return;
    }

    res.json({
      success: true,
      data: group,
      message: 'Successfully left the group',
    });
  } catch (error: any) {
    logger.error('Error leaving group:', error);

    if (error.message?.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'LEAVE_GROUP_FAILED',
        message: 'Failed to leave group',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/groups/:id/remove-member
 * Remove a member from group (leader only)
 * Accessible by: students (group leaders only)
 */
router.post('/:id/remove-member', authenticate, authorize('student'), async (req, res) => {
  try {
    const { id } = req.params;
    const { memberId } = req.body;

    if (!memberId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_MEMBER_ID',
          message: 'Member ID is required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Get the group
    const group = await Group.findById(id);

    if (!group) {
      res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: 'Group not found',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Check if requester is the group leader
    if (group.leaderId.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: {
          code: 'NOT_GROUP_LEADER',
          message: 'Only the group leader can remove members',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Cannot remove the leader
    if (memberId === group.leaderId.toString()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_REMOVE_LEADER',
          message: 'Cannot remove the group leader',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Remove member from the group
    group.members = group.members.filter(m => m.toString() !== memberId);

    // Update status if needed
    if (group.members.length < 2 && group.status === 'complete') {
      group.status = 'forming';
    }

    await group.save();

    logger.info(`Member ${memberId} removed from group ${group.groupId} by leader ${req.user!.id}`);

    res.json({
      success: true,
      data: group,
      message: 'Member removed successfully',
    });
  } catch (error: any) {
    logger.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REMOVE_MEMBER_FAILED',
        message: 'Failed to remove member',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/groups/:id/transfer-leadership
 * Transfer group leadership to another member
 * Accessible by: students (group leaders only)
 */
router.post('/:id/transfer-leadership', authenticate, authorize('student'), async (req, res) => {
  try {
    const { id } = req.params;
    const { newLeaderId } = req.body;

    if (!newLeaderId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_NEW_LEADER_ID',
          message: 'New leader ID is required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Get the group
    const group = await Group.findById(id);

    if (!group) {
      res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: 'Group not found',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Check if requester is the current group leader
    if (group.leaderId.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: {
          code: 'NOT_GROUP_LEADER',
          message: 'Only the current group leader can transfer leadership',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Check if new leader is a member of the group
    const isMember = group.members.some(m => m.toString() === newLeaderId);
    if (!isMember) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NOT_A_MEMBER',
          message: 'New leader must be a member of the group',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Transfer leadership
    const oldLeaderId = group.leaderId;
    group.leaderId = new mongoose.Types.ObjectId(newLeaderId);
    await group.save();

    logger.info(`Leadership transferred in group ${group.groupId} from ${oldLeaderId} to ${newLeaderId}`);

    res.json({
      success: true,
      data: group,
      message: 'Leadership transferred successfully',
    });
  } catch (error: any) {
    logger.error('Error transferring leadership:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRANSFER_LEADERSHIP_FAILED',
        message: 'Failed to transfer leadership',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * PATCH /api/groups/:id
 * Update group details (name, description, avatar)
 * Accessible by: students (group leaders only)
 */
router.patch('/:id', authenticate, authorize('student'), async (req, res) => {
  try {
    const { id } = req.params;
    const { groupName, description, avatarUrl } = req.body;

    // Get the group
    const group = await Group.findById(id);

    if (!group) {
      res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: 'Group not found',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Check if requester is the group leader
    if (group.leaderId.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: {
          code: 'NOT_GROUP_LEADER',
          message: 'Only the group leader can update group details',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Update fields if provided
    if (groupName !== undefined) group.groupName = groupName;
    if (description !== undefined) group.description = description;
    if (avatarUrl !== undefined) group.avatarUrl = avatarUrl;

    await group.save();

    logger.info(`Group ${group.groupId} updated by leader ${req.user!.id}`);

    res.json({
      success: true,
      data: group,
      message: 'Group updated successfully',
    });
  } catch (error: any) {
    logger.error('Error updating group:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_GROUP_FAILED',
        message: 'Failed to update group',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/groups/:id/analytics
 * Get group analytics (submission stats, grades, etc.)
 * Accessible by: students (group members), faculty, coordinator
 */
router.get('/:id/analytics', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the group
    const group = await Group.findById(id)
      .populate('members', 'name email studentId')
      .populate('leaderId', 'name email studentId');

    if (!group) {
      res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: 'Group not found',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Check if user has access (member, faculty, or coordinator)
    const isMember = group.members.some((m: any) => m._id.toString() === req.user!.id);
    const isFaculty = req.user!.role === 'faculty' || req.user!.role === 'coordinator';

    if (!isMember && !isFaculty) {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have access to this group analytics',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Get submissions count
    const { Submission } = await import('../models/Submission');
    const submissions = await Submission.find({ groupId: id });

    // Get evaluations/grades
    const { StudentEvaluation } = await import('../models/StudentEvaluation');
    const evaluations = await StudentEvaluation.find({ groupId: id });

    // Calculate analytics
    const analytics = {
      group: {
        id: group._id,
        name: group.groupName,
        code: group.groupCode,
        status: group.status,
        memberCount: group.members.length,
        createdAt: group.createdAt
      },
      submissions: {
        total: submissions.length,
        byType: submissions.reduce((acc: any, sub: any) => {
          acc[sub.assessmentType] = (acc[sub.assessmentType] || 0) + 1;
          return acc;
        }, {}),
        latest: submissions.length > 0 ? submissions[submissions.length - 1] : null
      },
      evaluations: {
        total: evaluations.length,
        averageGrade: evaluations.length > 0
          ? evaluations.reduce((sum: number, ev: any) => sum + (ev.totalMarks || 0), 0) / evaluations.length
          : 0,
        graded: evaluations.filter((ev: any) => ev.isGraded).length,
        pending: evaluations.filter((ev: any) => !ev.isGraded).length
      },
      members: group.members.map((member: any) => ({
        id: member._id,
        name: member.name,
        email: member.email,
        studentId: member.studentId,
        isLeader: member._id.toString() === group.leaderId.toString()
      }))
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    logger.error('Error fetching group analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ANALYTICS_FAILED',
        message: 'Failed to fetch group analytics',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/groups/my-groups
 * Get all groups for current user
 * Accessible by: students only
 */
router.get('/my-groups', authenticate, authorize('student'), async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    // Find all groups where user is a member or leader
    const groups = await Group.find({
      $or: [
        { members: userId },
        { leaderId: userId }
      ]
    })
      .populate('leaderId', 'name email avatar')
      .populate('members', 'name email avatar')
      .populate('assignedProjectId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    logger.error('Error getting user groups:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_GROUPS_FAILED',
        message: 'Failed to get user groups',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/groups/my-group
 * Get current user's group (for backward compatibility - returns first group)
 * Accessible by: students only
 */
router.get('/my-group', authenticate, authorize('student'), async (req, res) => {
  try {
    logger.info('🔍 Getting group for user:', {
      userId: req.user!.id,
      userRole: req.user!.role
    });

    const group = await getUserGroup(
      new mongoose.Types.ObjectId(req.user!.id)
    );

    logger.info('📊 Group query result:', {
      found: !!group,
      groupId: group?._id?.toString(),
      groupCode: group?.groupCode,
      status: group?.status,
      leaderId: group?.leaderId?.toString(),
      memberCount: group?.members?.length
    });

    if (!group) {
      logger.info('🚶 No group found for user, returning null');
      res.json({
        success: true,
        data: null,
        message: 'User is not in any group',
      });
      return;
    }

    logger.info('👥 Returning group data for user');
    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    logger.error('❌ Error getting user group:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_GROUP_FAILED',
        message: 'Failed to get user group',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/groups/:id
 * Get group by ID
 * Accessible by: authenticated users
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const group = await getGroupById(id);

    if (!group) {
      res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: 'Group not found',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    logger.error('Error getting group:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_GROUP_FAILED',
        message: 'Failed to get group',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/groups/code/:code
 * Get group by code
 * Accessible by: students only
 */
router.get('/code/:code', authenticate, authorize('student'), async (req, res) => {
  try {
    const { code } = req.params;
    const { year, projectType } = req.query;

    if (!year || !projectType) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'year and projectType are required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const group = await getGroupByCode(
      code.toUpperCase(),
      parseInt(year as string),
      projectType as any
    );

    if (!group) {
      res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: 'Group not found with the provided code',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    logger.error('Error getting group by code:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_GROUP_FAILED',
        message: 'Failed to get group',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/groups
 * Get all groups (filtered by project type)
 * Accessible by: faculty, coordinator, admin
 */
router.get('/', authenticate, authorize('faculty', 'coordinator', 'admin'), async (req, res) => {
  try {
    const { projectType, year } = req.query;

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

    const groups = await getGroupsByProjectType(
      projectType as any,
      year ? parseInt(year as string) : undefined
    );

    res.json({
      success: true,
      data: groups,
      count: groups.length,
    });
  } catch (error) {
    logger.error('Error getting groups:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_GROUPS_FAILED',
        message: 'Failed to get groups',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/groups/:id/member-details
 * Submit member details (department, specialization)
 * Accessible by: students (group members only)
 */
router.post('/:id/member-details', authenticate, authorize('student'), async (req, res) => {
  try {
    const { id } = req.params;
    const { department, specialization, cgpa } = req.body;

    if (!department) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_DEPARTMENT',
          message: 'Department is required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Check if user is a member of this group
    const group = await Group.findById(id);
    if (!group) {
      res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: 'Group not found',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const isMember = group.members.some(memberId => memberId.toString() === req.user!.id);
    if (!isMember) {
      res.status(403).json({
        success: false,
        error: {
          code: 'NOT_GROUP_MEMBER',
          message: 'You are not a member of this group',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Create or update member details
    const memberDetails = await GroupMemberDetails.findOneAndUpdate(
      { groupId: id, userId: req.user!.id },
      {
        department: department.trim(),
        specialization: specialization?.trim() || '',
        cgpa: cgpa ? Number(cgpa) : undefined,
        submittedAt: new Date()
      },
      { upsert: true, new: true }
    );

    logger.info(`Member details submitted for user ${req.user!.id} in group ${group.groupId}`);

    res.json({
      success: true,
      data: memberDetails,
      message: 'Member details submitted successfully',
    });
  } catch (error: any) {
    logger.error('Error submitting member details:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUBMIT_DETAILS_FAILED',
        message: 'Failed to submit member details',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/groups/:id/member-details
 * Get member details for a group
 * Accessible by: students (group members only)
 */
router.get('/:id/member-details', authenticate, authorize('student'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is a member of this group
    const group = await Group.findById(id);
    if (!group) {
      res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: 'Group not found',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const isMember = group.members.some(memberId => memberId.toString() === req.user!.id);
    if (!isMember) {
      res.status(403).json({
        success: false,
        error: {
          code: 'NOT_GROUP_MEMBER',
          message: 'You are not a member of this group',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Get all member details for this group
    const memberDetails = await GroupMemberDetails.find({ groupId: id })
      .populate('userId', 'name email studentId')
      .sort({ submittedAt: 1 });

    res.json({
      success: true,
      data: memberDetails,
    });
  } catch (error: any) {
    logger.error('Error fetching member details:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_DETAILS_FAILED',
        message: 'Failed to fetch member details',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/groups/:id/remove-member
 * Remove a member from group (leader only) - Enhanced version
 * Accessible by: students (group leaders only)
 */
router.post('/:id/remove-member-enhanced', authenticate, authorize('student'), async (req, res) => {
  try {
    const { id } = req.params;
    const { memberId } = req.body;

    if (!memberId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_MEMBER_ID',
          message: 'Member ID is required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Get the group
    const group = await Group.findById(id);

    if (!group) {
      res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: 'Group not found',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Check if requester is the group leader
    if (group.leaderId.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: {
          code: 'NOT_GROUP_LEADER',
          message: 'Only the group leader can remove members',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Cannot remove the leader
    if (memberId === group.leaderId.toString()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_REMOVE_LEADER',
          message: 'Cannot remove the group leader',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Remove member from the group
    group.members = group.members.filter(m => m.toString() !== memberId);

    // Update status if needed
    if (group.members.length < 2 && group.status === 'complete') {
      group.status = 'forming';
    }

    await group.save();

    // Also remove their member details
    await GroupMemberDetails.findOneAndDelete({ groupId: id, userId: memberId });

    logger.info(`Member ${memberId} removed from group ${group.groupId} by leader ${req.user!.id}`);

    res.json({
      success: true,
      data: group,
      message: 'Member removed successfully',
    });
  } catch (error: any) {
    logger.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REMOVE_MEMBER_FAILED',
        message: 'Failed to remove member',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * DELETE /api/groups/:id
 * Delete a group (enhanced to allow deletion during application period)
 * Accessible by: students (group leaders only)
 */
router.delete('/:id', authenticate, authorize('student'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_GROUP_ID',
          message: 'Invalid group ID format',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const { Group } = await import('../models/Group');
    const group = await Group.findById(id);

    if (!group) {
      res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: 'Group not found',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Check if requester is the group leader
    if (group.leaderId.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: {
          code: 'NOT_GROUP_LEADER',
          message: 'Only the group leader can delete the group',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Allow deletion if group is in 'forming', 'complete' status (before application submission)
    if (!['forming', 'complete'].includes(group.status)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_GROUP_STATUS',
          message: `Cannot delete group with status '${group.status}'. Only groups that haven't submitted applications can be deleted.`,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Delete all member details for this group
    await GroupMemberDetails.deleteMany({ groupId: id });

    // Delete the group
    await Group.findByIdAndDelete(id);

    // Remove Group_Leader role from the user
    const { User } = await import('../models/User');
    await User.findByIdAndUpdate(req.user!.id, {
      $pull: { roles: 'Group_Leader' }
    });

    logger.info(`Group deleted: ${group.groupId} by user ${req.user!.id}`);

    res.json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting group:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_GROUP_FAILED',
        message: 'Failed to delete group',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/groups/faculty
 * Get groups assigned to faculty's projects
 * Accessible by: faculty, coordinator
 */
router.get('/faculty', authenticate, authorize('faculty', 'coordinator'), async (req, res) => {
  try {
    const { Group } = await import('../models/Group');
    const { Project } = await import('../models/Project');

    const facultyId = new mongoose.Types.ObjectId(req.user!.id);

    // Get faculty's projects
    const projects = await Project.find({ facultyId, status: 'assigned' }).select('_id');
    const projectIds = projects.map(p => p._id);

    // Get groups assigned to these projects
    const groups = await Group.find({
      assignedProjectId: { $in: projectIds },
      status: 'approved'
    })
      .populate('assignedProjectId', 'title')
      .populate('members', 'name email studentId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: groups,
      count: groups.length,
    });
  } catch (error) {
    logger.error('Error fetching faculty groups:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_GROUPS_FAILED',
        message: 'Failed to fetch groups',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
