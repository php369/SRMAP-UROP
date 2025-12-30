import express from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth';
import { MeetingLogService, CreateMeetingLogData, UpdateMeetingLogData } from '../services/meetingLogService';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/meeting-logs/group/:groupId
 * Get meeting logs for a specific group
 */
router.get('/group/:groupId', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: 'Invalid group ID' });
    }

    // Get meeting logs for the group
    const meetingLogs = await MeetingLogService.getMeetingLogs(
      new mongoose.Types.ObjectId(groupId)
    );

    // Filter logs based on user access and approval status
    const accessibleLogs = [];
    
    for (const log of meetingLogs) {
      const { canAccess } = await MeetingLogService.validateMeetingLogAccess(
        log._id,
        new mongoose.Types.ObjectId(userId),
        userRole
      );

      if (canAccess) {
        // Students can only see approved meeting logs (unless they created it)
        if (userRole.endsWith('-student')) {
          if (log.status === 'approved' || log.createdBy._id.toString() === userId) {
            accessibleLogs.push(log);
          }
        } else {
          // Faculty, coordinators, and admins can see all logs
          accessibleLogs.push(log);
        }
      }
    }

    res.json({
      success: true,
      data: accessibleLogs
    });

  } catch (error) {
    logger.error('Error getting meeting logs for group:', error);
    res.status(500).json({ 
      error: 'Failed to get meeting logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/meeting-logs
 * Create a new meeting log
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { groupId, ...meetingLogData }: { groupId: string } & CreateMeetingLogData = req.body;

    // Only students can create meeting logs
    if (!userRole.endsWith('-student')) {
      return res.status(403).json({ error: 'Only students can create meeting logs' });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: 'Invalid group ID' });
    }

    // Validate required fields
    if (!meetingLogData.attendees || !meetingLogData.mode || !meetingLogData.startedAt) {
      return res.status(400).json({ 
        error: 'Missing required fields: attendees, mode, and startedAt are required' 
      });
    }

    // Convert startedAt and endedAt to Date objects
    const processedData: CreateMeetingLogData = {
      ...meetingLogData,
      startedAt: new Date(meetingLogData.startedAt),
      endedAt: meetingLogData.endedAt ? new Date(meetingLogData.endedAt) : undefined
    };

    const meetingLog = await MeetingLogService.createMeetingLog(
      new mongoose.Types.ObjectId(groupId),
      new mongoose.Types.ObjectId(userId),
      processedData
    );

    res.status(201).json({
      success: true,
      data: meetingLog,
      message: 'Meeting log created successfully'
    });

  } catch (error) {
    logger.error('Error creating meeting log:', error);
    res.status(400).json({ 
      error: 'Failed to create meeting log',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/meeting-logs/:id
 * Update a meeting log (only allowed if editable)
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const meetingLogData: UpdateMeetingLogData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid meeting log ID' });
    }

    // Only students can update meeting logs
    if (!userRole.endsWith('-student')) {
      return res.status(403).json({ error: 'Only students can update meeting logs' });
    }

    // Check if meeting log can be edited
    const canEdit = await MeetingLogService.canEditMeetingLog(
      new mongoose.Types.ObjectId(id)
    );

    if (!canEdit) {
      return res.status(403).json({ error: 'Meeting log cannot be edited (already approved)' });
    }

    // Convert date fields to Date objects if provided
    const processedData: UpdateMeetingLogData = {
      ...meetingLogData,
      startedAt: meetingLogData.startedAt ? new Date(meetingLogData.startedAt) : undefined,
      endedAt: meetingLogData.endedAt ? new Date(meetingLogData.endedAt) : undefined
    };

    const meetingLog = await MeetingLogService.updateMeetingLog(
      new mongoose.Types.ObjectId(id),
      new mongoose.Types.ObjectId(userId),
      processedData
    );

    res.json({
      success: true,
      data: meetingLog,
      message: 'Meeting log updated successfully'
    });

  } catch (error) {
    logger.error('Error updating meeting log:', error);
    res.status(400).json({ 
      error: 'Failed to update meeting log',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/meeting-logs/:id
 * Get a specific meeting log by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid meeting log ID' });
    }

    // Validate access to the meeting log
    const { canAccess, reason, meetingLog } = await MeetingLogService.validateMeetingLogAccess(
      new mongoose.Types.ObjectId(id),
      new mongoose.Types.ObjectId(userId),
      userRole
    );

    if (!canAccess) {
      return res.status(403).json({ error: reason || 'Access denied' });
    }

    if (!meetingLog) {
      return res.status(404).json({ error: 'Meeting log not found' });
    }

    // Students can only see approved meeting logs (unless they created it)
    if (userRole.endsWith('-student') && meetingLog.status !== 'approved' && meetingLog.createdBy._id.toString() !== userId) {
      return res.status(403).json({ error: 'Meeting log is not yet approved' });
    }

    res.json({
      success: true,
      data: meetingLog
    });

  } catch (error) {
    logger.error('Error getting meeting log:', error);
    res.status(500).json({ 
      error: 'Failed to get meeting log',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/meeting-logs/:id/approve
 * Approve a meeting log (faculty only)
 */
router.post('/:id/approve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid meeting log ID' });
    }

    // Only faculty, coordinators, and admins can approve meeting logs
    if (!['faculty', 'coordinator', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Only faculty can approve meeting logs' });
    }

    const meetingLog = await MeetingLogService.approveMeetingLog(
      new mongoose.Types.ObjectId(id),
      new mongoose.Types.ObjectId(userId)
    );

    res.json({
      success: true,
      data: meetingLog,
      message: 'Meeting log approved successfully'
    });

  } catch (error) {
    logger.error('Error approving meeting log:', error);
    res.status(400).json({ 
      error: 'Failed to approve meeting log',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/meeting-logs/:id/reject
 * Reject a meeting log (faculty only)
 */
router.post('/:id/reject', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid meeting log ID' });
    }

    // Only faculty, coordinators, and admins can reject meeting logs
    if (!['faculty', 'coordinator', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Only faculty can reject meeting logs' });
    }

    const meetingLog = await MeetingLogService.rejectMeetingLog(
      new mongoose.Types.ObjectId(id),
      new mongoose.Types.ObjectId(userId),
      reason
    );

    res.json({
      success: true,
      data: meetingLog,
      message: 'Meeting log rejected successfully'
    });

  } catch (error) {
    logger.error('Error rejecting meeting log:', error);
    res.status(400).json({ 
      error: 'Failed to reject meeting log',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/meeting-logs/faculty/pending
 * Get pending meeting logs for faculty review
 */
router.get('/faculty/pending', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Only faculty, coordinators, and admins can access this endpoint
    if (!['faculty', 'coordinator', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let meetingLogs;
    
    if (userRole === 'faculty') {
      // Faculty can only see meeting logs for their projects
      meetingLogs = await MeetingLogService.getFacultyMeetingLogs(
        new mongoose.Types.ObjectId(userId),
        'completed'
      );
    } else {
      // Coordinators and admins can see all pending meeting logs
      meetingLogs = await MeetingLogService.getFacultyMeetingLogs(
        new mongoose.Types.ObjectId(userId)
      );
    }

    res.json({
      success: true,
      data: meetingLogs
    });

  } catch (error) {
    logger.error('Error getting pending meeting logs:', error);
    res.status(500).json({ 
      error: 'Failed to get pending meeting logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/meeting-logs/user/my-logs
 * Get meeting logs for the current user (through their groups)
 */
router.get('/user/my-logs', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;

    const meetingLogs = await MeetingLogService.getUserMeetingLogs(
      new mongoose.Types.ObjectId(userId)
    );

    res.json({
      success: true,
      data: meetingLogs
    });

  } catch (error) {
    logger.error('Error getting user meeting logs:', error);
    res.status(500).json({ 
      error: 'Failed to get user meeting logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;