import express, { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { requireApplicationWindow } from '../middleware/windowEnforcement';
import {
  createApplications,
  getApplicationById,
  getUserApplications,
  getApprovedApplication,
  getFacultyApplications,
  acceptApplication,
  rejectApplication,
  revokeApplication,
  unfreezeApplication,
  getAllApplications
} from '../services/applicationService';
import { getUserGroup } from '../services/groupService';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

const router: Router = express.Router();

/**
 * POST /api/applications
 * Submit an application
 * Accessible by: students only
 * Requires: Active application window
 */
router.post('/', authenticate, authorize('student'), async (req, res) => {
  try {
    let {
      projectType,
      selectedProjects,
      department,
      stream,
      specialization,
      cgpa,
      semester,
      isGroupApplication
    } = req.body;

    // Handle case where selectedProjects comes as an object instead of array
    logger.info('selectedProjects before conversion:', { selectedProjects, isArray: Array.isArray(selectedProjects) });
    if (selectedProjects && !Array.isArray(selectedProjects)) {
      selectedProjects = Object.values(selectedProjects).filter(Boolean);
      logger.info('Converted selectedProjects from object to array:', selectedProjects);
    }
    logger.info('selectedProjects after conversion:', { selectedProjects, isArray: Array.isArray(selectedProjects) });

    if (!projectType || !selectedProjects || !department || !semester) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'projectType, selectedProjects, department, and semester are required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user!.id);
    let groupId: mongoose.Types.ObjectId | undefined;

    // If group application, get user's group
    if (isGroupApplication) {
      const group = await getUserGroup(userId);
      if (!group) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NOT_IN_GROUP',
            message: 'User is not in a group',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Extract the actual leader ID (handle both populated and non-populated cases)
      const leaderIdStr = typeof group.leaderId === 'object' && group.leaderId._id
        ? group.leaderId._id.toString()
        : group.leaderId.toString();

      logger.info('Group application check:', {
        userId: userId.toString(),
        groupLeaderId: leaderIdStr,
        isLeader: leaderIdStr === userId.toString()
      });

      // Verify user is group leader
      if (leaderIdStr !== userId.toString()) {
        res.status(403).json({
          success: false,
          error: {
            code: 'NOT_GROUP_LEADER',
            message: 'Only group leader can submit application',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      groupId = group._id;
    }

    const applications = await createApplications({
      studentId: isGroupApplication ? undefined : userId,
      groupId,
      projectType,
      selectedProjects: selectedProjects.map((id: string) => new mongoose.Types.ObjectId(id)),
      department,
      stream,
      specialization,
      cgpa,
      semester
    });

    res.status(201).json({
      success: true,
      data: applications,
      message: `${applications.length} application(s) submitted successfully`,
    });
  } catch (error: any) {
    logger.error('Error creating application:', error);

    if (error.message?.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: {
          code: 'APPLICATION_EXISTS',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    if (error.message?.includes('Must select')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROJECT_SELECTION',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    if (error.message?.includes('Specialization is required')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SPECIALIZATION_REQUIRED',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_APPLICATION_FAILED',
        message: 'Failed to create application',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/applications/my-application
 * Get current user's application
 * Accessible by: students only
 */
router.get('/my-application', authenticate, authorize('student'), async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    logger.info('Fetching applications for user:', { userId: userId.toString() });

    // Check if user is in a group
    const group = await getUserGroup(userId);
    logger.info('User group status:', {
      hasGroup: !!group,
      groupId: group?._id?.toString(),
      groupStatus: group?.status
    });

    // Try to get applications both ways to ensure we don't miss any
    let applications: any[] = [];

    if (group) {
      // User is in a group - get group applications
      const groupApplications = await getUserApplications(undefined, group._id);
      applications = groupApplications;
      logger.info('Found group applications:', { count: groupApplications.length });
    } else {
      // User is not in a group - get solo applications
      const soloApplications = await getUserApplications(userId, undefined);
      applications = soloApplications;
      logger.info('Found solo applications:', { count: soloApplications.length });
    }

    // If no applications found and user is in a group, also check for any solo applications
    // This handles cases where user might have applied solo before joining a group
    if (applications.length === 0 && group) {
      const soloApplications = await getUserApplications(userId, undefined);
      if (soloApplications.length > 0) {
        applications = soloApplications;
        logger.info('Found fallback solo applications:', { count: soloApplications.length });
      }
    }

    logger.info('Final applications result:', {
      count: applications.length,
      applicationIds: applications.map(app => app._id?.toString())
    });

    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    logger.error('Error getting user application:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_APPLICATION_FAILED',
        message: 'Failed to get application',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/applications/approved
 * Get current user's approved application
 * Accessible by: students only
 */
router.get('/approved', authenticate, authorize('student'), async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    logger.info('Fetching approved application for user:', { userId: userId.toString() });

    // Check if user is in a group
    const group = await getUserGroup(userId);
    logger.info('User group status:', {
      hasGroup: !!group,
      groupId: group?._id?.toString(),
      groupStatus: group?.status
    });

    let approvedApplication: any = null;

    if (group) {
      // User is in a group - get group's approved application
      approvedApplication = await getApprovedApplication(undefined, group._id);
      logger.info('Found group approved application:', { found: !!approvedApplication });
    } else {
      // User is not in a group - get solo approved application
      approvedApplication = await getApprovedApplication(userId, undefined);
      logger.info('Found solo approved application:', { found: !!approvedApplication });
    }

    if (!approvedApplication) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NO_APPROVED_APPLICATION',
          message: 'No approved application found',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    logger.info('Approved application result:', {
      applicationId: approvedApplication._id?.toString(),
      projectId: approvedApplication.projectId?._id?.toString(),
      status: approvedApplication.status
    });

    res.json({
      success: true,
      data: approvedApplication,
    });
  } catch (error) {
    logger.error('Error getting approved application:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_APPROVED_APPLICATION_FAILED',
        message: 'Failed to get approved application',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/applications/faculty
 * Get applications for faculty's projects
 * Accessible by: faculty, coordinator
 */
router.get('/faculty', authenticate, authorize('faculty', 'coordinator'), async (req, res) => {
  try {
    const { projectType } = req.query;

    const applications = await getFacultyApplications(
      new mongoose.Types.ObjectId(req.user!.id),
      projectType as any
    );

    res.json({
      success: true,
      data: applications,
      count: applications.length,
    });
  } catch (error) {
    logger.error('Error getting faculty applications:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_APPLICATIONS_FAILED',
        message: 'Failed to get applications',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/applications/:id/accept
 * Accept an application
 * Accessible by: faculty, coordinator
 */
router.post('/:id/accept', authenticate, authorize('faculty', 'coordinator'), async (req, res) => {
  try {
    const { id } = req.params;
    const { projectId } = req.body;

    if (!projectId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PROJECT_ID',
          message: 'projectId is required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const application = await acceptApplication(
      id,
      new mongoose.Types.ObjectId(projectId),
      new mongoose.Types.ObjectId(req.user!.id)
    );

    res.json({
      success: true,
      data: application,
      message: 'Application accepted successfully',
    });
  } catch (error: any) {
    logger.error('Error accepting application:', error);

    if (error.message?.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'APPLICATION_NOT_FOUND',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    if (error.message?.includes('already assigned')) {
      res.status(409).json({
        success: false,
        error: {
          code: 'PROJECT_ALREADY_ASSIGNED',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'ACCEPT_APPLICATION_FAILED',
        message: 'Failed to accept application',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/applications/:id/reject
 * Reject an application
 * Accessible by: faculty, coordinator
 */
router.post('/:id/reject', authenticate, authorize('faculty', 'coordinator'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = await rejectApplication(
      id,
      new mongoose.Types.ObjectId(req.user!.id),
      reason
    );

    res.json({
      success: true,
      data: application,
      message: 'Application rejected',
    });
  } catch (error: any) {
    logger.error('Error rejecting application:', error);

    if (error.message?.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'APPLICATION_NOT_FOUND',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'REJECT_APPLICATION_FAILED',
        message: 'Failed to reject application',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/applications/:id/unfreeze
 * Unfreeze an application
 * Accessible by: coordinator only
 */
router.post('/:id/unfreeze', authenticate, authorize('coordinator'), async (req, res) => {
  try {
    const { id } = req.params;

    const application = await unfreezeApplication(id);

    res.json({
      success: true,
      data: application,
      message: 'Application unfrozen successfully',
    });
  } catch (error: any) {
    logger.error('Error unfreezing application:', error);

    if (error.message?.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'APPLICATION_NOT_FOUND',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'UNFREEZE_APPLICATION_FAILED',
        message: 'Failed to unfreeze application',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * DELETE /api/applications/:id
 * Revoke an application
 * Accessible by: student (owner/leader)
 */
router.delete('/:id', authenticate, authorize('student'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await revokeApplication(
      new mongoose.Types.ObjectId(id),
      new mongoose.Types.ObjectId(req.user!.id)
    );

    res.json(result);
  } catch (error: any) {
    logger.error('Error revoking application:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REVOKE_APPLICATION_FAILED',
        message: error.message || 'Failed to revoke application',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/applications
 * Get all applications
 * Accessible by: coordinator, admin
 */
router.get('/', authenticate, authorize('coordinator', 'admin'), async (req, res) => {
  try {
    const { projectType, status, semester } = req.query;

    const applications = await getAllApplications({
      projectType: projectType as any,
      status: status as any,
      semester: semester ? parseInt(semester as string) : undefined
    });

    res.json({
      success: true,
      data: applications,
      count: applications.length,
    });
  } catch (error) {
    logger.error('Error getting all applications:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_APPLICATIONS_FAILED',
        message: 'Failed to get applications',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/applications/:id
 * Get application by ID
 * Accessible by: authenticated users
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const application = await getApplicationById(id);

    if (!application) {
      res.status(404).json({
        success: false,
        error: {
          code: 'APPLICATION_NOT_FOUND',
          message: 'Application not found',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    logger.error('Error getting application:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_APPLICATION_FAILED',
        message: 'Failed to get application',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
