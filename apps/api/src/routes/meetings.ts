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
 * Accessible by: students, faculty, coordinator
 */
router.post('/', authenticate, authorize('student', 'faculty', 'coordinator'), async (req, res) => {
    try {
        const { projectId, meetingDate, meetingLink, mode, location } = req.body;
        
        // Validate user ID
        if (!req.user?.id || !mongoose.Types.ObjectId.isValid(req.user.id)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_USER_ID',
                    message: 'Invalid user ID',
                    timestamp: new Date().toISOString(),
                },
            });
        }
        
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const userRole = req.user.role;

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

        // Log timezone conversion for debugging
        const meetingDateObj = new Date(meetingDate);
        logger.info('Meeting scheduling timezone conversion:', {
            received: meetingDate,
            parsedAsDate: meetingDateObj.toString(),
            parsedAsUTC: meetingDateObj.toISOString(),
            currentServerTime: new Date().toISOString(),
            userRole,
            userId: userId.toString()
        });

        let projectIdToUse: mongoose.Types.ObjectId;
        let facultyId: mongoose.Types.ObjectId;

        if (userRole.endsWith('-student')) {
            // For students, we need to find their project and faculty
            const { Application } = await import('../models/Application');
            
            logger.info('Student scheduling meeting:', {
                userId: userId.toString(),
                userRole
            });
            
            // Check if student is in a group
            const group = await Group.findOne({ members: userId });
            
            if (group) {
                // User is in a group - all group members can schedule meetings
                logger.info('Found group for student:', {
                    groupId: group._id.toString(),
                    assignedProjectId: group.assignedProjectId?.toString()
                });
                
                // Check if group has assigned project
                if (!group.assignedProjectId) {
                    return res.status(404).json({
                        success: false,
                        error: {
                            code: 'NO_ASSIGNED_PROJECT',
                            message: 'Group has no assigned project',
                            timestamp: new Date().toISOString(),
                        },
                    });
                }
                
                projectIdToUse = group.assignedProjectId;
            } else {
                // Solo student
                logger.info('No group found, checking solo application for student');
                
                const application = await Application.findOne({
                    studentId: userId,
                    status: 'approved'
                });

                if (!application) {
                    return res.status(404).json({
                        success: false,
                        error: {
                            code: 'NO_APPROVED_APPLICATION',
                            message: 'No approved application found',
                            timestamp: new Date().toISOString(),
                        },
                    });
                }

                projectIdToUse = application.projectId;
                logger.info('Found solo application:', {
                    applicationId: application._id.toString(),
                    projectId: application.projectId.toString()
                });
            }

            // Get project to find faculty
            const { Project } = await import('../models/Project');
            const project = await Project.findById(projectIdToUse);
            
            if (!project) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'PROJECT_NOT_FOUND',
                        message: 'Project not found',
                        timestamp: new Date().toISOString(),
                    },
                });
            }

            facultyId = project.facultyId;
        } else {
            // Faculty/coordinator scheduling
            logger.info('Faculty scheduling meeting:', {
                userId: userId.toString(),
                userRole,
                projectId
            });
            
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

            // Validate projectId format
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_PROJECT_ID',
                        message: 'Invalid project ID format',
                        timestamp: new Date().toISOString(),
                    },
                });
            }

            projectIdToUse = new mongoose.Types.ObjectId(projectId);
            
            // Verify project exists and belongs to faculty
            const { Project } = await import('../models/Project');
            const project = await Project.findOne({
                _id: projectIdToUse,
                facultyId: userId,
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

            facultyId = userId;
        }

        // Find the group or student assigned to this project
        const group = await Group.findOne({ assignedProjectId: projectIdToUse });

        let attendees: Array<{ studentId: mongoose.Types.ObjectId; present: boolean }> = [];
        let groupId: mongoose.Types.ObjectId | undefined;
        let studentId: mongoose.Types.ObjectId | undefined;

        if (group) {
            // Group project
            groupId = group._id;
            attendees = group.members.map((memberId: mongoose.Types.ObjectId) => ({
                studentId: memberId,
                present: false,
            }));
        } else {
            // Solo project - find the student from application
            const { Application } = await import('../models/Application');
            const application = await Application.findOne({
                projectId: projectIdToUse,
                status: 'approved'
            });

            if (application && application.studentId) {
                studentId = application.studentId;
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
        }

        const meetingLog = new MeetingLog({
            groupId,
            studentId,
            projectId: projectIdToUse,
            facultyId: facultyId,
            meetingDate: new Date(meetingDate),
            startedAt: new Date(meetingDate),
            meetUrl: meetingLink,
            mode: mode || 'online',
            location,
            status: 'scheduled',
            attendees,
            minutesOfMeeting: '',
            createdBy: userId,
        });

        logger.info('Creating meeting log with data:', {
            groupId: groupId?.toString(),
            studentId: studentId?.toString(),
            projectId: projectIdToUse.toString(),
            facultyId: facultyId.toString(),
            createdBy: userId.toString(),
            attendeesCount: attendees.length,
            attendees: attendees.map(a => ({ studentId: a.studentId.toString(), present: a.present }))
        });

        await meetingLog.save();

        logger.info(`Meeting scheduled by ${req.user!.email}:`, {
            meetingId: meetingLog._id,
            projectId: projectIdToUse,
            groupId,
            studentId,
            date: meetingDate,
            scheduledBy: userRole
        });

        res.status(201).json({
            success: true,
            data: meetingLog,
            message: 'Meeting scheduled successfully',
        });
    } catch (error: any) {
        logger.error('Error scheduling meeting:', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            userRole: req.user?.role,
            requestBody: req.body
        });
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
            status: { $in: ['scheduled', 'completed', 'approved'] },
        })
            .populate('groupId', 'groupCode members')
            .populate('studentId', 'name email studentId')
            .populate('projectId', 'title projectId')
            .populate('attendees.studentId', 'name email studentId')
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
            status: { $in: ['completed', 'pending', 'approved', 'rejected'] },
            $or: [
                { minutesOfMeeting: { $ne: '' } },
                { mom: { $ne: '' } }
            ], // Only logs with minutes
        })
            .populate('groupId', 'groupCode')
            .populate('studentId', 'name email')
            .populate('attendees.studentId', 'name email studentId')
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

        // Validate rejection requires feedback
        if (!approved && (!facultyNotes || !facultyNotes.trim())) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'REJECTION_FEEDBACK_REQUIRED',
                    message: 'Feedback is required when rejecting a meeting log',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        logger.info('Approving meeting log:', {
            logId: id,
            currentStatus: log.status,
            newStatus: approved ? 'approved' : 'pending', // Rejected logs go back to pending
            facultyId: req.user!.id,
            hasFeedback: !!facultyNotes
        });

        // Set status based on approval
        if (approved) {
            log.status = 'approved';
        } else {
            log.status = 'pending'; // Rejected logs go back to pending for resubmission
        }
        
        log.reviewedBy = new mongoose.Types.ObjectId(req.user!.id);
        log.reviewedAt = new Date();
        
        // Store feedback (required for rejection, optional for approval)
        if (facultyNotes && facultyNotes.trim()) {
            log.rejectionReason = facultyNotes.trim();
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

        // Get meetings for this project (include pending so students can resubmit)
        const meetings = await MeetingLog.find({
            projectId,
            status: { $in: ['scheduled', 'completed', 'pending', 'approved', 'rejected'] },
        })
            .populate('facultyId', 'name email')
            .populate('projectId', 'title projectId')
            .populate('attendees.studentId', 'name email studentId')
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
        
        // Set status based on current state
        if (meeting.status === 'pending') {
            // Resubmission after rejection - set to completed for review
            meeting.status = 'completed';
            // Clear previous rejection reason since it's being resubmitted
            meeting.rejectionReason = undefined;
            meeting.reviewedBy = undefined;
            meeting.reviewedAt = undefined;
        } else {
            // First submission
            meeting.status = 'completed';
        }
        
        await meeting.save();

        logger.info(`Meeting log ${meeting.status === 'completed' ? 'submitted' : 'resubmitted'} by ${req.user!.email}:`, {
            meetingId: id,
            previousStatus: meeting.status,
            newStatus: 'completed'
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

/**
 * PUT /api/meetings/:id/complete
 * Mark meeting as completed (faculty only)
 * Accessible by: faculty, coordinator
 */
router.put('/:id/complete', authenticate, authorize('faculty', 'coordinator'), async (req, res) => {
    try {
        const { id } = req.params;

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

        // Verify faculty owns this meeting
        if (meeting.facultyId.toString() !== req.user!.id) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'ACCESS_DENIED',
                    message: 'You can only complete your own meetings',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        // Check if meeting is already completed
        if (meeting.status === 'completed') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MEETING_ALREADY_COMPLETED',
                    message: 'Meeting is already marked as completed',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        // Update meeting status to completed and set end time
        const currentTime = new Date();
        meeting.status = 'completed';
        meeting.endedAt = currentTime;
        
        // Log timezone information for debugging
        logger.info('Meeting completion timezone info:', {
            meetingId: id,
            startedAt: meeting.startedAt?.toISOString(),
            endedAt: currentTime.toISOString(),
            startedAtLocal: meeting.startedAt?.toString(),
            endedAtLocal: currentTime.toString(),
            timeDifference: meeting.startedAt ? (currentTime.getTime() - meeting.startedAt.getTime()) / (1000 * 60) : null // minutes
        });
        
        // Save the meeting
        const savedMeeting = await meeting.save();
        
        logger.info('Meeting status updated successfully:', {
            meetingId: id,
            newStatus: savedMeeting.status,
            endedAt: savedMeeting.endedAt
        });

        logger.info(`Meeting marked as completed by ${req.user!.email}:`, {
            meetingId: id,
            facultyId: req.user!.id
        });

        res.json({
            success: true,
            data: savedMeeting,
            message: 'Meeting marked as completed successfully',
        });
    } catch (error: any) {
        logger.error('Error completing meeting:', {
            error: error.message,
            stack: error.stack,
            meetingId: req.params.id,
            facultyId: req.user?.id
        });
        res.status(500).json({
            success: false,
            error: {
                code: 'COMPLETE_MEETING_FAILED',
                message: error.message || 'Failed to complete meeting',
                timestamp: new Date().toISOString(),
            },
        });
    }
});

export default router;
