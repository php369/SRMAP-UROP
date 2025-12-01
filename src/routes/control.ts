import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { Window } from '../models/Window';
import { Submission } from '../models/Submission';
import { Project } from '../models/Project';
import { Application } from '../models/Application';
import { Group } from '../models/Group';
import { User } from '../models/User';

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
    
    const query: any = {};
    if (projectType) query.projectType = projectType;
    if (windowType) query.windowType = windowType;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const windows = await Window.find(query)
      .populate('createdBy', 'name email')
      .sort({ startDate: -1 });

    res.json(windows);
  } catch (error: any) {
    console.error('Get windows error:', error);
    res.status(500).json({ message: 'Failed to get windows' });
  }
});

/**
 * @route   POST /api/v1/control/windows
 * @desc    Create a new window
 * @access  Private (Coordinator, Admin)
 */
router.post('/windows', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { windowType, projectType, assessmentType, startDate, endDate } = req.body;

    // Validate required fields
    if (!windowType || !projectType || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate dates
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Check for overlapping windows
    const overlapping = await Window.findOne({
      windowType,
      projectType,
      assessmentType: assessmentType || null,
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({ message: 'Window overlaps with existing window' });
    }

    const window = new Window({
      windowType,
      projectType,
      assessmentType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdBy: req.user!._id
    });

    await window.save();

    res.status(201).json({
      message: 'Window created successfully',
      window
    });
  } catch (error: any) {
    console.error('Create window error:', error);
    res.status(400).json({ message: error.message || 'Failed to create window' });
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
      return res.status(404).json({ message: 'Window not found' });
    }

    // Validate dates if provided
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    if (startDate) window.startDate = new Date(startDate);
    if (endDate) window.endDate = new Date(endDate);

    await window.save();

    res.json({
      message: 'Window updated successfully',
      window
    });
  } catch (error: any) {
    console.error('Update window error:', error);
    res.status(400).json({ message: error.message || 'Failed to update window' });
  }
});

/**
 * @route   DELETE /api/v1/control/windows/:id
 * @desc    Delete a window
 * @access  Private (Coordinator, Admin)
 */
router.delete('/windows/:id', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
  try {
    const window = await Window.findByIdAndDelete(req.params.id);
    
    if (!window) {
      return res.status(404).json({ message: 'Window not found' });
    }

    res.json({ message: 'Window deleted successfully' });
  } catch (error: any) {
    console.error('Delete window error:', error);
    res.status(500).json({ message: 'Failed to delete window' });
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
      message: `Released grades for ${result.modifiedCount} submissions`,
      count: result.modifiedCount
    });
  } catch (error: any) {
    console.error('Release grades error:', error);
    res.status(500).json({ message: 'Failed to release grades' });
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
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to get statistics' });
  }
});

/**
 * @route   GET /api/v1/control/users/stats
 * @desc    Get user statistics
 * @access  Private (Coordinator, Admin)
 */
router.get('/users/stats', authenticate, isCoordinatorOrAdmin, async (req: Request, res: Response) => {
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
      User.countDocuments({ role: 'student' }),
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
