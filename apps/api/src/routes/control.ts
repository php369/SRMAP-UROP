import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { Window } from '../models/Window';
import { Submission } from '../models/Submission';
import { Project } from '../models/Project';
import { Application } from '../models/Application';
import { Group } from '../models/Group';
import { User } from '../models/User';
import { WindowService } from '../services/windowService';
import mongoose from 'mongoose';

const router = Router();

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
    const { StudentEvaluation } = await import('../models/StudentEvaluation');
    
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
      totalSubmissions,
      pendingApplications,
      gradedSubmissions,
      releasedGrades,
      activeWindows
    ] = await Promise.all([
      Project.countDocuments(query),
      Group.countDocuments(query),
      Application.countDocuments(query),
      Submission.countDocuments(query),
      Application.countDocuments({ ...query, status: 'pending' }),
      Submission.countDocuments({ ...query, isGraded: true }),
      Submission.countDocuments({ ...query, isGradeReleased: true }),
      Window.countDocuments({ ...query, isActive: true })
    ]);

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
          totalSubmissions,
          pendingApplications,
          gradedSubmissions,
          releasedGrades,
          activeWindows
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

export default router;
