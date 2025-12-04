import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { MeetingLog } from '../models/MeetingLog';
import { Group } from '../models/Group';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * POST /api/meetings
 * Schedule a meeting
 * Accessible by: faculty, coordinator
 */
router.post('/', authenticate, authorize('faculty', 'coordinator'), async (req, res) => {
    try {
        const { projectId, meetingDate, meetingLink, mode, location } = req.body;

        if (!meetingDate) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_REQUIRED_FIELDS',
                    message: 'Meeting date is required',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        if (!projectId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_REQUIRED_FIELDS',
                    message: 'Project ID is required',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        // Verify project exists and belongs to faculty
        const { Project } = await import('../models/Project');
        const project = await Project.findOne({
            _id: new mongoose.Types.ObjectId(projectId),
            facultyId: new mongoose.Types.ObjectId(req.user!.id),
            status: 'assigned'
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PROJECT_NOT_FOUND',
                    message: 'Project not found or not assigned to you',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        // Find the group or student assigned to this project
        const group = await Group.findOne({ assignedProjectId: new mongoose.Types.ObjectId(projectId) }).populate('members');

        let attendees: Array<{ studentId: mongoose.Types.ObjectId; present: boolean }> = [];
        let groupId: mongoose.Types.ObjectId | undefined;
        let studentId: mongoose.Types.ObjectId | undefined;

        if (group) {
            // Group project
            groupId = group._id;
            attendees = group.members.map((memberId: any) => ({
                studentId: new mongoose.Types.ObjectId(memberId.toString()),
                present: false,
            }));
        } else if (project.assignedTo) {
            // Solo project
            studentId = project.assignedTo as mongoose.Types.ObjectId;
            attendees = [{
                studentId: studentId,
                present: false,
            }];
        } else {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_ASSIGNEE',
                    message: 'Project has no assigned student or group',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        const meetingLog = new MeetingLog({
            groupId,
            studentId,
            projectId: new mongoose.Types.ObjectId(projectId),
            facultyId: new mongoose.Types.ObjectId(req.user!.id),
            meetingDate: new Date(meetingDate),
            startedAt: new Date(meetingDate),
            meetUrl: meetingLink,
            mode: mode || 'online',
            location,
            status: 'submitted',
            attendees,
            minutesOfMeeting: '',
            createdBy: new mongoose.Types.ObjectId(req.user!.id),
        });

        await meetingLog.save();

        logger.info(`Meeting scheduled by ${req.user!.email}:`, {
            meetingId: meetingLog._id,
            projectId,
            groupId,
            studentId,
            date: meetingDate,
        });

        res.status(201).json({
            success: true,
            data: meetingLog,
            message: 'Meeting scheduled successfully',
        });
    } catch (error: any) {
        logger.error('Error scheduling meeting:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SCHEDULE_MEETING_FAILED',
                message: error.message || 'Failed to schedule meeting',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * GET /api/meetings/faculty
 * Get meetings for faculty
 * Accessible by: faculty, coordinator
 */
router.get('/faculty', authenticate, authorize('faculty', 'coordinator'), async (req, res) => {
    try {
        const facultyId = new mongoose.Types.ObjectId(req.user!.id);

        const meetings = await MeetingLog.find({
            facultyId,
            status: { $in: ['submitted', 'completed', 'approved'] },
        })
            .populate('groupId', 'groupCode members')
            .populate('studentId', 'name email studentId')
            .populate('projectId', 'title projectId')
            .sort({ meetingDate: -1 });

        res.json({
            success: true,
            data: meetings,
            count: meetings.length,
        });
    } catch (error) {
        logger.error('Error fetching faculty meetings:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_MEETINGS_FAILED',
                message: 'Failed to fetch meetings',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * GET /api/meetings/logs/faculty
 * Get meeting logs for faculty to approve
 * Accessible by: faculty, coordinator
 */
router.get('/logs/faculty', authenticate, authorize('faculty', 'coordinator'), async (req, res) => {
    try {
        const facultyId = new mongoose.Types.ObjectId(req.user!.id);

        const logs = await MeetingLog.find({
            facultyId,
            status: { $in: ['completed', 'approved', 'rejected'] },
            mom: { $ne: '' }, // Only logs with minutes
        })
            .populate('groupId', 'groupCode')
            .populate('studentId', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: logs,
            count: logs.length,
        });
    } catch (error) {
        logger.error('Error fetching meeting logs:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_LOGS_FAILED',
                message: 'Failed to fetch meeting logs',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * PUT /api/meetings/logs/:id/approve
 * Approve or reject a meeting log
 * Accessible by: faculty, coordinator
 */
router.put('/logs/:id/approve', authenticate, authorize('faculty', 'coordinator'), async (req, res) => {
    try {
        const { id } = req.params;
        const { approved, facultyNotes } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_LOG_ID',
                    message: 'Invalid meeting log ID',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        const log = await MeetingLog.findById(id);

        if (!log) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'LOG_NOT_FOUND',
                    message: 'Meeting log not found',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        // Verify faculty owns this meeting
        if (log.facultyId.toString() !== req.user!.id) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'ACCESS_DENIED',
                    message: 'You can only approve your own meeting logs',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        logger.info('Approving meeting log:', {
            logId: id,
            currentStatus: log.status,
            newStatus: approved ? 'approved' : 'rejected',
            facultyId: req.user!.id
        });

        log.status = approved ? 'approved' : 'rejected';
        log.reviewedBy = new mongoose.Types.ObjectId(req.user!.id);
        log.reviewedAt = new Date();
        if (facultyNotes) {
            log.rejectionReason = facultyNotes;
        }

        await log.save();

        logger.info(`Meeting log ${approved ? 'approved' : 'rejected'} successfully by ${req.user!.email}:`, {
            logId: id,
            finalStatus: log.status
        });

        res.json({
            success: true,
            data: log,
            message: `Meeting log ${approved ? 'approved' : 'rejected'} successfully`,
        });
    } catch (error: any) {
        logger.error('Error approving meeting log:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'APPROVE_LOG_FAILED',
                message: error.message || 'Failed to approve meeting log',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * GET /api/meetings/student
 * Get meetings for student
 * Accessible by: student
 */
router.get('/student', authenticate, authorize('student'), async (req, res) => {
    try {
        const studentId = new mongoose.Types.ObjectId(req.user!.id);
        const { Application } = await import('../models/Application');

        // First, check if student is in a group
        const group = await Group.findOne({ members: studentId });

        let projectId: mongoose.Types.ObjectId | undefined;

        if (group && group.assignedProjectId) {
            // Student is in a group with an assigned project
            projectId = group.assignedProjectId;
        } else {
            // Check for solo application
            const application = await Application.findOne({
                studentId,
                status: 'approved'
            });

            if (application) {
                projectId = application.projectId;
            }
        }

        if (!projectId) {
            return res.json({
                success: true,
                data: [],
                count: 0,
                message: 'No assigned project found. Apply for a project and wait for approval.'
            });
        }

        // Get meetings for this project (include rejected so students can resubmit)
        const meetings = await MeetingLog.find({
            projectId,
            status: { $in: ['submitted', 'completed', 'approved', 'rejected'] },
        })
            .populate('facultyId', 'name email')
            .populate('projectId', 'title projectId')
            .sort({ meetingDate: -1 });

        res.json({
            success: true,
            data: meetings,
            count: meetings.length,
        });
    } catch (error) {
        logger.error('Error fetching student meetings:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_MEETINGS_FAILED',
                message: 'Failed to fetch meetings',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * POST /api/meetings/:id/log
 * Submit meeting log (minutes)
 * Accessible by: student (group leader only)
 */
router.post('/:id/log', authenticate, authorize('student'), async (req, res) => {
    try {
        const { id } = req.params;
        const { participants, mom } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_MEETING_ID',
                    message: 'Invalid meeting ID',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        const meeting = await MeetingLog.findById(id);

        if (!meeting) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'MEETING_NOT_FOUND',
                    message: 'Meeting not found',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        // If group meeting, verify user is group leader
        if (meeting.groupId) {
            const group = await Group.findById(meeting.groupId);
            if (!group || group.leaderId.toString() !== req.user!.id) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'NOT_GROUP_LEADER',
                        message: 'Only group leader can submit meeting logs',
                        timestamp: new Date().toISOString(),
                    },
                });
            }
        } else if (meeting.studentId) {
            // For solo students, verify the meeting belongs to them
            if (meeting.studentId.toString() !== req.user!.id) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'NOT_AUTHORIZED',
                        message: 'You can only submit logs for your own meetings',
                        timestamp: new Date().toISOString(),
                    },
                });
            }
        }

        // Update attendees with presence information
        if (participants && participants.length > 0) {
            meeting.attendees = participants;
        }

        meeting.minutesOfMeeting = mom;
        meeting.status = 'completed';
        await meeting.save();

        logger.info(`Meeting log submitted by ${req.user!.email}:`, {
            meetingId: id,
        });

        res.json({
            success: true,
            data: meeting,
            message: 'Meeting log submitted successfully',
        });
    } catch (error: any) {
        logger.error('Error submitting meeting log:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SUBMIT_LOG_FAILED',
                message: error.message || 'Failed to submit meeting log',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

/**
 * PUT /api/meetings/logs/:id/grade
 * Grade a meeting log (out of 5)
 * Accessible by: faculty, coordinator
 */
router.put('/logs/:id/grade', authenticate, authorize('faculty', 'coordinator'), async (req, res) => {
    try {
        const { id } = req.params;
        const { grade } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_LOG_ID',
                    message: 'Invalid meeting log ID',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        if (grade === undefined || grade < 0 || grade > 5) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_GRADE',
                    message: 'Grade must be between 0 and 5',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        const log = await MeetingLog.findById(id);

        if (!log) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'LOG_NOT_FOUND',
                    message: 'Meeting log not found',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        // Verify faculty owns this meeting
        if (log.facultyId.toString() !== req.user!.id) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'ACCESS_DENIED',
                    message: 'You can only grade your own meeting logs',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        log.grade = grade;
        await log.save();

        logger.info(`Meeting log graded by ${req.user!.email}:`, {
            logId: id,
            grade,
        });

        res.json({
            success: true,
            data: log,
            message: 'Meeting log graded successfully',
        });
    } catch (error: any) {
        logger.error('Error grading meeting log:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'GRADE_LOG_FAILED',
                message: error.message || 'Failed to grade meeting log',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

export default router;
