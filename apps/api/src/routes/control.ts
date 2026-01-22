import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { Window } from '../models/Window';
import { Submission } from '../models/Submission';
import { Project } from '../models/Project';
import { Application } from '../models/Application';
import { Group } from '../models/Group';
import { User } from '../models/User';
import { WindowService } from '../services/windowService';
import { StudentEvaluationService } from '../services/studentEvaluationService';
import { StudentEvaluation } from '../models/StudentEvaluation';
import { MeetingLog } from '../models/MeetingLog';
import mongoose from 'mongoose';

const router: Router = Router();

/**
 * Middleware to check if user is coordinator or admin
 */
const isCoordinatorOrAdmin = (req: Request, res: Response, next: Function) => {
  if (req.user!.role === 'admin' || req.user!.isCoordinator) {
    next();
  } else {
    res.status(403).json({ message: 'Only coordinators and admins can access this resource' });
  }
};

/**
 * @route   GET /api/v1/control/windows
 * @desc    Get all windows
 * @access  Private (Coordinator, Admin)
 */
router.get('/windows', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { projectType, windowType, isActive } = req.query;

    // Update window statuses before fetching
    await WindowService.updateWindowStatuses();

    const query: any = {};
    if (projectType) query.projectType = projectType;
    if (windowType) query.windowType = windowType;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const windows = await Window.find(query)
      .populate('createdBy', 'name email')
      .sort({ startDate: -1 });

    res.json({
      success: true,
      data: windows
    });
  } catch (error: any) {
    console.error('Get windows error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_WINDOWS_FAILED',
        message: 'Failed to get windows'
      }
    });
  }
});

/**
 * @route   POST /api/v1/control/windows
 * @desc    Create a new window
 * @access  Private (Coordinator, Admin)
 */
router.post('/windows', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
  try {
    console.log('=== CREATE WINDOW REQUEST ===');
    console.log('User:', req.user);
    console.log('Body:', req.body);

    const { windowType, projectType, assessmentType, startDate, endDate } = req.body;

    // Validate required fields
    if (!windowType || !projectType || !startDate || !endDate) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Missing required fields'
        }
      });
    }

    // Validate dates
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATES',
          message: 'End date must be after start date'
        }
      });
    }

    // Check for overlapping windows
    const query: any = {
      windowType,
      projectType,
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
      ]
    };

    // Only add assessmentType to query if it's provided
    if (assessmentType) {
      query.assessmentType = assessmentType;
    } else {
      // For windows without assessmentType, check for documents where assessmentType is null or undefined
      query.assessmentType = { $in: [null, undefined] };
    }

    const overlapping = await Window.findOne(query);

    if (overlapping) {
      console.log('Overlapping window found:', overlapping);
      return res.status(400).json({
        success: false,
        error: {
          code: 'WINDOW_OVERLAP',
          message: 'Window overlaps with existing window'
        }
      });
    }

    console.log('Creating window with data:', {
      windowType,
      projectType,
      assessmentType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      userId: req.user!.id
    });

    const window = new Window({
      windowType,
      projectType,
      assessmentType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdBy: new mongoose.Types.ObjectId(req.user!.id)
    });

    await window.save();

    res.status(201).json({
      success: true,
      message: 'Window created successfully',
      data: window
    });
  } catch (error: any) {
    console.error('Create window error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(400).json({
      success: false,
      error: {
        code: 'CREATE_WINDOW_FAILED',
        message: error.message || 'Failed to create window'
      }
    });
  }
});

/**
 * @route   PUT /api/v1/control/windows/:id
 * @desc    Update a window
 * @access  Private (Coordinator, Admin)
 */
router.put('/windows/:id', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.body;

    const window = await Window.findById(req.params.id);
    if (!window) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'WINDOW_NOT_FOUND',
          message: 'Window not found'
        }
      });
    }

    // Validate dates if provided
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATES',
          message: 'End date must be after start date'
        }
      });
    }

    if (startDate) window.startDate = new Date(startDate);
    if (endDate) window.endDate = new Date(endDate);

    await window.save();

    res.json({
      success: true,
      message: 'Window updated successfully',
      data: window
    });
  } catch (error: any) {
    console.error('Update window error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_WINDOW_FAILED',
        message: error.message || 'Failed to update window'
      }
    });
  }
});



/**
 * @route   POST /api/v1/control/grades/release
 * @desc    Release grades for a project type and assessment
 * @access  Private (Coordinator, Admin)
 */
router.post('/grades/release', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { projectType, assessmentType } = req.body;

    if (!projectType) {
      return res.status(400).json({ message: 'Project type is required' });
    }

    const query: any = {
      projectType,
      isGraded: true,
      isGradeReleased: false
    };

    if (assessmentType) {
      query.assessmentType = assessmentType;
    }

    const result = await Submission.updateMany(query, { isGradeReleased: true });

    res.json({
      success: true,
      message: `Released grades for ${result.modifiedCount} submissions`,
      data: { count: result.modifiedCount }
    });
  } catch (error: any) {
    console.error('Release grades error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RELEASE_GRADES_FAILED',
        message: 'Failed to release grades'
      }
    });
  }
});

/**
 * @route   POST /api/v1/control/grades/release-final
 * @desc    Release final grades for all students in a project type
 * @access  Private (Coordinator, Admin)
 */
router.post('/grades/release-final', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { projectType } = req.body;

    if (!projectType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PROJECT_TYPE',
          message: 'Project type is required'
        }
      });
    }

    // Validate project type
    if (!['IDP', 'UROP', 'CAPSTONE'].includes(projectType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROJECT_TYPE',
          message: 'Invalid project type. Must be IDP, UROP, or CAPSTONE'
        }
      });
    }

    // Import StudentEvaluation model
    // StudentEvaluation is imported at top level

    // Find all groups of the specified project type
    const groups = await Group.find({
      type: projectType,
      status: 'approved',
      assignedProjectId: { $exists: true }
    }).select('_id');

    if (groups.length === 0) {
      return res.json({
        success: true,
        message: `No approved groups found for ${projectType}`,
        data: { count: 0 }
      });
    }

    const groupIds = groups.map(g => g._id);

    // Release final grades for all student evaluations in these groups
    const result = await StudentEvaluation.updateMany(
      {
        groupId: { $in: groupIds },
        isPublished: false
      },
      {
        isPublished: true,
        publishedAt: new Date(),
        publishedBy: new mongoose.Types.ObjectId(req.user!.id)
      }
    );

    // Also release grades for legacy submissions if any exist
    const submissionResult = await Submission.updateMany(
      {
        projectType,
        isGraded: true,
        isGradeReleased: false
      },
      {
        isGradeReleased: true
      }
    );

    const totalReleased = result.modifiedCount + submissionResult.modifiedCount;

    res.json({
      success: true,
      message: `Released final grades for ${totalReleased} evaluations in ${projectType}`,
      data: {
        count: totalReleased,
        studentEvaluations: result.modifiedCount,
        legacySubmissions: submissionResult.modifiedCount
      }
    });
  } catch (error: any) {
    console.error('Release final grades error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RELEASE_FINAL_GRADES_FAILED',
        message: 'Failed to release final grades'
      }
    });
  }
});

/**
 * @route   POST /api/v1/control/windows/update-statuses
 * @desc    Update isActive status for all windows based on current time
 * @access  Private (Coordinator, Admin)
 */
router.post('/windows/update-statuses', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const result = await WindowService.updateWindowStatuses();

    res.json({
      success: true,
      message: `Updated ${result.updated} window statuses`,
      data: result
    });
  } catch (error: any) {
    console.error('Update window statuses error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_STATUSES_FAILED',
        message: 'Failed to update window statuses'
      }
    });
  }
});




/**
 * @route   GET /api/v1/control/scheduler/status
 * @desc    Get scheduler service status
 * @access  Private (Coordinator, Admin)
 */
router.get('/scheduler/status', authenticate, isCoordinatorOrAdmin, async (_req: Request, res: Response) => {
  try {
    const { SchedulerService } = await import('../services/schedulerService');
    const status = SchedulerService.getStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    console.error('Get scheduler status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SCHEDULER_STATUS_FAILED',
        message: 'Failed to get scheduler status'
      }
    });
  }
});

/**
 * @route   GET /api/v1/control/stats
 * @desc    Get dashboard statistics
 * @access  Private (Coordinator, Admin)
 */
router.get('/stats', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { projectType } = req.query;
    const query = projectType ? { projectType } : {};

    // Get counts
    const [
      totalProjects,
      totalGroups,
      totalApplications,
      pendingApplications,
      activeWindows,
      // New stats data sources
      groupsWithMembers,
      allEvaluationsCount,
      completedEvaluationsCount,
      allMeetingsCount,
      completedMeetingsCount,
      upcomingWindows
    ] = await Promise.all([
      Project.countDocuments(query),
      Group.countDocuments(query),
      Application.countDocuments(query),
      Application.countDocuments({ ...query, status: 'pending' }),
      Window.countDocuments({ ...query, isActive: true }),
      // Fetch groups to calculate average size (only need members array length)
      Group.find(query).select('members'),
      // Evaluation stats
      StudentEvaluation.countDocuments(query),
      StudentEvaluation.countDocuments({ ...query, isPublished: true }),
      // Meeting stats
      query.projectType ? MeetingLog.countDocuments({ projectId: { $in: await Project.find({ type: query.projectType }).distinct('_id') } }) : MeetingLog.countDocuments({}),
      query.projectType ? MeetingLog.countDocuments({ projectId: { $in: await Project.find({ type: query.projectType }).distinct('_id') }, status: { $in: ['completed', 'approved'] } }) : MeetingLog.countDocuments({ status: { $in: ['completed', 'approved'] } }),
      // Upcoming deadlines (next 14 days)
      Window.find({
        ...query,
        $or: [
          { isActive: true },
          { startDate: { $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) } }
        ],
        endDate: { $gte: new Date() }
      }).sort({ endDate: 1 }).select('windowType projectType endDate startDate')
    ]);

    // Calculate Average Group Size
    const totalStudentsInGroups = groupsWithMembers.reduce((acc, group) => acc + (group.members?.length || 0), 0);
    const averageGroupSize = totalGroups > 0 ? Number((totalStudentsInGroups / totalGroups).toFixed(1)) : 0;

    // Calculate Evaluation Progress
    const evaluationProgress = {
      completed: completedEvaluationsCount,
      total: allEvaluationsCount,
      percentage: allEvaluationsCount > 0 ? Math.round((completedEvaluationsCount / allEvaluationsCount) * 100) : 0
    };

    // Calculate Meeting Completion Rate
    const meetingCompletionRate = {
      completed: completedMeetingsCount,
      total: allMeetingsCount,
      percentage: allMeetingsCount > 0 ? Math.round((completedMeetingsCount / allMeetingsCount) * 100) : 0
    };

    // Format Upcoming Deadlines
    // Format Upcoming Deadlines
    const upcomingDeadlines = upcomingWindows.map(window => {
      const now = new Date();
      const startDate = new Date(window.startDate);
      const isUpcoming = startDate > now;
      const targetDate = isUpcoming ? window.startDate : window.endDate;
      const daysLeft = Math.ceil((new Date(targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        _id: window._id,
        title: `${window.projectType} ${window.windowType.replace(/([A-Z])/g, ' $1').trim()}`,
        date: targetDate, // Uses start date if upcoming, end date if active
        startDate: window.startDate,
        status: isUpcoming ? 'upcoming' as const : 'active' as const,
        daysLeft: daysLeft
      };
    });

    // Get project breakdown
    const projectsByType = await Project.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Get application breakdown
    const applicationsByStatus = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get submission breakdown
    const submissionsByAssessment = await Submission.aggregate([
      { $group: { _id: '$assessmentType', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalProjects,
          totalGroups,
          totalApplications,
          pendingApplications,
          activeWindows,
          averageGroupSize,
          evaluationProgress,
          meetingCompletionRate,
          upcomingDeadlines
        },
        breakdown: {
          projectsByType,
          applicationsByStatus,
          submissionsByAssessment
        }
      }
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_STATS_FAILED',
        message: 'Failed to get statistics'
      }
    });
  }
});

/**
 * @route   GET /api/v1/control/users/stats
 * @desc    Get user statistics
 * @access  Private (Coordinator, Admin)
 */
router.get('/users/stats', authenticate, isCoordinatorOrAdmin, async (_req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalFaculty,
      totalCoordinators,
      totalExternalEvaluators,
      totalAdmins
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: { $in: ['idp-student', 'urop-student', 'capstone-student'] } }),
      User.countDocuments({ role: 'faculty' }),
      User.countDocuments({ isCoordinator: true }),
      User.countDocuments({ isExternalEvaluator: true }),
      User.countDocuments({ role: 'admin' })
    ]);

    res.json({
      totalUsers,
      totalStudents,
      totalFaculty,
      totalCoordinators,
      totalExternalEvaluators,
      totalAdmins
    });
  } catch (error: any) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Failed to get user statistics' });
  }
});

// ===== EXTERNAL EVALUATOR MANAGEMENT ENDPOINTS =====

/**
 * @route   GET /api/v1/control/external-evaluators/assignments
 * @desc    Get all external evaluator assignments (groups and solo students)
 * @access  Private (Coordinator, Admin)
 */
router.get('/external-evaluators/assignments', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { projectType } = req.query;
    const assignments = await StudentEvaluationService.getExternalEvaluatorAssignments(projectType as string);

    res.json({
      success: true,
      data: assignments,
      message: `Found ${assignments.length} assignments`
    });
  } catch (error: any) {
    console.error('Get external evaluator assignments error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_ASSIGNMENTS_FAILED',
        message: error.message || 'Failed to get external evaluator assignments'
      }
    });
  }
});

/**
 * @route   GET /api/v1/control/external-evaluators/validate
 * @desc    Validate assignment constraints and distribution
 * @access  Private (Coordinator, Admin)
 */
router.get('/external-evaluators/validate', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { projectType } = req.query;
    const validation = await StudentEvaluationService.validateAssignmentConstraints(projectType as string);

    res.json({
      success: true,
      data: validation,
      message: validation.isValid ? 'Assignment constraints are valid' : 'Assignment validation issues found'
    });
  } catch (error: any) {
    console.error('Validate assignment constraints error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: error.message || 'Failed to validate assignment constraints'
      }
    });
  }
});

/**
 * @route   GET /api/v1/control/external-evaluators/available
 * @desc    Get available external evaluators with assignment counts
 * @access  Private (Coordinator, Admin)
 */
router.get('/external-evaluators/available', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { projectType } = req.query;
    const evaluators = await StudentEvaluationService.getAvailableExternalEvaluators(projectType as string);

    res.json({
      success: true,
      data: evaluators,
      message: `Found ${evaluators.length} available external evaluators`
    });
  } catch (error: any) {
    console.error('Get available external evaluators error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_EVALUATORS_FAILED',
        message: error.message || 'Failed to get available external evaluators'
      }
    });
  }
});

/**
 * @route   POST /api/v1/control/external-evaluators/auto-assign
 * @desc    Auto-assign external evaluators to all unassigned groups and solo students
 * @access  Private (Coordinator, Admin)
 */
router.post('/external-evaluators/auto-assign', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { projectType } = req.body;
    const result = await StudentEvaluationService.autoAssignExternalEvaluators(projectType);

    res.json({
      success: true,
      data: result,
      message: `Successfully assigned external evaluators to ${result.groupsAssigned + result.soloStudentsAssigned} projects`
    });
  } catch (error: any) {
    console.error('Auto-assign external evaluators error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTO_ASSIGN_FAILED',
        message: error.message || 'Failed to auto-assign external evaluators'
      }
    });
  }
});

/**
 * @route   POST /api/v1/control/external-evaluators/assign
 * @desc    Assign external evaluator to a specific group
 * @access  Private (Coordinator, Admin)
 */
router.post('/external-evaluators/assign', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { groupId, evaluatorId } = req.body;

    if (!groupId || !evaluatorId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Group ID and evaluator ID are required'
        }
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(evaluatorId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OBJECT_ID',
          message: 'Invalid group ID or evaluator ID'
        }
      });
    }

    // Update group with external evaluator
    const group = await Group.findByIdAndUpdate(
      groupId,
      { externalEvaluatorId: new mongoose.Types.ObjectId(evaluatorId) },
      { new: true }
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: 'Group not found'
        }
      });
    }

    // Assign external evaluator to all students in the group
    const result = await StudentEvaluationService.assignExternalEvaluatorToStudents(
      new mongoose.Types.ObjectId(groupId),
      new mongoose.Types.ObjectId(evaluatorId),
      new mongoose.Types.ObjectId(req.user!.id)
    );

    res.json({
      success: true,
      data: result,
      message: `External evaluator assigned to group ${group.groupCode}`
    });
  } catch (error: any) {
    console.error('Assign external evaluator to group error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ASSIGN_EVALUATOR_FAILED',
        message: error.message || 'Failed to assign external evaluator to group'
      }
    });
  }
});

/**
 * @route   POST /api/v1/control/external-evaluators/assign-solo
 * @desc    Assign external evaluator to a solo student
 * @access  Private (Coordinator, Admin)
 */
router.post('/external-evaluators/assign-solo', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { studentId, evaluatorId } = req.body;

    if (!studentId || !evaluatorId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Student ID and evaluator ID are required'
        }
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(evaluatorId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OBJECT_ID',
          message: 'Invalid student ID or evaluator ID'
        }
      });
    }

    const result = await StudentEvaluationService.assignExternalEvaluatorToSoloStudent(
      new mongoose.Types.ObjectId(studentId),
      new mongoose.Types.ObjectId(evaluatorId),
      new mongoose.Types.ObjectId(req.user!.id)
    );

    res.json({
      success: true,
      data: result,
      message: 'External evaluator assigned to solo student successfully'
    });
  } catch (error: any) {
    console.error('Assign external evaluator to solo student error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ASSIGN_EVALUATOR_SOLO_FAILED',
        message: error.message || 'Failed to assign external evaluator to solo student'
      }
    });
  }
});

/**
 * @route   DELETE /api/v1/control/external-evaluators/assign/:groupId
 * @desc    Remove external evaluator assignment from a group
 * @access  Private (Coordinator, Admin)
 */
router.delete('/external-evaluators/assign/:groupId', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OBJECT_ID',
          message: 'Invalid group ID'
        }
      });
    }

    const result = await StudentEvaluationService.removeExternalEvaluatorAssignment(
      new mongoose.Types.ObjectId(groupId)
    );

    res.json({
      success: true,
      data: result,
      message: 'External evaluator assignment removed from group'
    });
  } catch (error: any) {
    console.error('Remove external evaluator from group error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REMOVE_EVALUATOR_FAILED',
        message: error.message || 'Failed to remove external evaluator assignment'
      }
    });
  }
});

/**
 * @route   DELETE /api/v1/control/external-evaluators/assign-solo/:studentId
 * @desc    Remove external evaluator assignment from a solo student
 * @access  Private (Coordinator, Admin)
 */
router.delete('/external-evaluators/assign-solo/:studentId', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OBJECT_ID',
          message: 'Invalid student ID'
        }
      });
    }

    const result = await StudentEvaluationService.removeExternalEvaluatorFromSoloStudent(
      new mongoose.Types.ObjectId(studentId)
    );

    res.json({
      success: true,
      data: result,
      message: 'External evaluator assignment removed from solo student'
    });
  } catch (error: any) {
    console.error('Remove external evaluator from solo student error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REMOVE_EVALUATOR_SOLO_FAILED',
        message: error.message || 'Failed to remove external evaluator assignment from solo student'
      }
    });
  }
});

/**
 * @route   POST /api/v1/control/external-evaluators/rebalance
 * @desc    Rebalance assignments for fair distribution
 * @access  Private (Coordinator, Admin)
 */
router.post('/external-evaluators/rebalance', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const result = await StudentEvaluationService.rebalanceAssignments();

    res.json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (error: any) {
    console.error('Rebalance assignments error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REBALANCE_FAILED',
        message: error.message || 'Failed to rebalance assignments'
      }
    });
  }
});

export default router;
