import express from 'express';
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

const router = express.Router();

/**
 * POST /api/groups
 * Create a new group
 * Accessible by: students only
 */
router.post('/', authenticate, authorize('student'), async (req, res) => {
  try {
    const { projectType, semester, year, groupName } = req.body;

    if (!projectType || !semester || !year) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'projectType, semester, and year are required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const group = await createGroup({
      leaderId: new mongoose.Types.ObjectId(req.user!.id),
      projectType,
      semester,
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

    if (error.message?.includes('already a group leader')) {
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
    const { groupCode, semester, year, projectType } = req.body;

    if (!groupCode || !semester || !year || !projectType) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'groupCode, semester, year, and projectType are required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const group = await joinGroup(
      new mongoose.Types.ObjectId(req.user!.id),
      groupCode.toUpperCase(),
      semester,
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
 * GET /api/groups/my-group
 * Get current user's group
 * Accessible by: students only
 */
router.get('/my-group', authenticate, authorize('student'), async (req, res) => {
  try {
    const group = await getUserGroup(
      new mongoose.Types.ObjectId(req.user!.id)
    );

    if (!group) {
      res.json({
        success: true,
        data: null,
        message: 'User is not in any group',
      });
      return;
    }

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    logger.error('Error getting user group:', error);
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
    const { semester, year, projectType } = req.query;

    if (!semester || !year || !projectType) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'semester, year, and projectType are required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const group = await getGroupByCode(
      code.toUpperCase(),
      semester as string,
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
    const { projectType, semester, year } = req.query;

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
      semester as string,
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

export default router;
