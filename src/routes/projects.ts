import { Router, Request, Response } from 'express';
import { Project } from '../models/Project';
import { authenticate } from '../middleware/auth';
import { facultyGuard } from '../middleware/rbac';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  brief: z.string().min(1, 'Brief description is required').max(500, 'Brief too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  type: z.enum(['IDP', 'UROP', 'CAPSTONE'], { required_error: 'Project type is required' }),
  department: z.string().min(1, 'Department is required'),
  prerequisites: z.string().max(1000, 'Prerequisites too long').optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(10, 'Capacity cannot exceed 10').optional()
});

const updateProjectSchema = createProjectSchema.partial();

/**
 * @swagger
 * /api/v1/projects/public:
 *   get:
 *     summary: Get published projects for public viewing
 *     description: Returns all published projects with optional filtering by department and type
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [IDP, UROP, CAPSTONE]
 *         description: Filter by project type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, brief, and description
 *     responses:
 *       200:
 *         description: List of published projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *       500:
 *         description: Server error
 */
router.get('/public', async (req: Request, res: Response) => {
  try {
    const { department, type, search } = req.query;
    
    // Build query for published projects only
    const query: any = { status: 'published' };
    
    // Add department filter
    if (department && typeof department === 'string') {
      query.department = department;
    }
    
    // Add type filter
    if (type && typeof type === 'string') {
      query.type = type;
    }
    
    // Add search filter
    if (search && typeof search === 'string') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { brief: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const projects = await Project.find(query)
      .select('title brief description type department facultyName capacity status createdAt updatedAt prerequisites')
      .sort({ createdAt: -1 });
    
    logger.info(`Retrieved ${projects.length} published projects`, {
      filters: { department, type, search },
      count: projects.length
    });
    
    res.json({
      success: true,
      data: projects,
      message: projects.length === 0 ? 'No projects are currently available. Please check back later.' : undefined
    });
  } catch (error) {
    logger.error('Error fetching published projects:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PROJECTS_ERROR',
        message: 'Failed to fetch projects'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/projects/departments:
 *   get:
 *     summary: Get unique departments from published projects
 *     description: Returns a list of unique departments that have published projects
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: List of unique departments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Computer Science", "Electronics", "Mechanical"]
 *       500:
 *         description: Server error
 */
router.get('/departments', async (_req: Request, res: Response) => {
  try {
    const departments = await Project.distinct('department', { status: 'published' });
    
    logger.info(`Retrieved ${departments.length} unique departments`);
    
    res.json({
      success: true,
      data: departments.sort(),
      message: departments.length === 0 ? 'No departments have published projects yet.' : undefined
    });
  } catch (error) {
    logger.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_DEPARTMENTS_ERROR',
        message: 'Failed to fetch departments'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     summary: Create a new project (Faculty only)
 *     description: Creates a new project in draft status for faculty members
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - brief
 *               - type
 *               - department
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               brief:
 *                 type: string
 *                 maxLength: 500
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               type:
 *                 type: string
 *                 enum: [IDP, UROP, CAPSTONE]
 *               department:
 *                 type: string
 *               prerequisites:
 *                 type: string
 *                 maxLength: 1000
 *               capacity:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Faculty access required
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, facultyGuard(), async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = createProjectSchema.parse(req.body);
    
    // Get faculty info from auth context
    const authContext = (req as any).authContext;
    const facultyInfo = authContext?.facultyInfo;
    
    if (!facultyInfo) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FACULTY_INFO_MISSING',
          message: 'Faculty information not found'
        }
      });
    }

    // Create project
    const project = new Project({
      ...validatedData,
      facultyId: new mongoose.Types.ObjectId(req.user!.id),
      facultyName: facultyInfo.name,
      status: 'draft'
    });

    await project.save();

    logger.info(`Project created by faculty ${req.user!.email}:`, {
      projectId: project._id,
      title: project.title,
      type: project.type
    });

    res.status(201).json({
      success: true,
      data: project
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid project data',
          details: error.errors
        }
      });
    }

    logger.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_PROJECT_ERROR',
        message: 'Failed to create project'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/projects/faculty:
 *   get:
 *     summary: Get faculty's own projects
 *     description: Returns all projects created by the authenticated faculty member
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, published, archived]
 *         description: Filter by project status
 *     responses:
 *       200:
 *         description: List of faculty projects
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Faculty access required
 *       500:
 *         description: Server error
 */
router.get('/faculty', authenticate, facultyGuard(), async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    // Build query for faculty's projects
    const query: any = { facultyId: new mongoose.Types.ObjectId(req.user!.id) };
    
    if (status && typeof status === 'string') {
      query.status = status;
    }
    
    const projects = await Project.find(query)
      .sort({ updatedAt: -1 });
    
    logger.info(`Retrieved ${projects.length} projects for faculty ${req.user!.email}`);
    
    res.json({
      success: true,
      data: projects,
      message: projects.length === 0 ? 'You have not created any projects yet. Create your first project to get started.' : undefined
    });

  } catch (error) {
    logger.error('Error fetching faculty projects:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FACULTY_PROJECTS_ERROR',
        message: 'Failed to fetch faculty projects'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     description: Returns a specific project by ID (faculty can access their own, coordinators can access all)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticate, facultyGuard(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROJECT_ID',
          message: 'Invalid project ID format'
        }
      });
    }

    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        }
      });
    }

    // Check access permissions
    const authContext = (req as any).authContext;
    const isCoordinator = authContext?.isCoordinator;
    const isOwner = project.facultyId.toString() === req.user!.id;

    if (!isCoordinator && !isOwner) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You can only access your own projects'
        }
      });
    }

    res.json({
      success: true,
      data: project
    });

  } catch (error) {
    logger.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PROJECT_ERROR',
        message: 'Failed to fetch project'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   put:
 *     summary: Update project
 *     description: Updates a project (faculty can update their own drafts, coordinators can update any)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               brief:
 *                 type: string
 *                 maxLength: 500
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               type:
 *                 type: string
 *                 enum: [IDP, UROP, CAPSTONE]
 *               department:
 *                 type: string
 *               prerequisites:
 *                 type: string
 *                 maxLength: 1000
 *               capacity:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticate, facultyGuard(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROJECT_ID',
          message: 'Invalid project ID format'
        }
      });
    }

    // Validate request body
    const validatedData = updateProjectSchema.parse(req.body);
    
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        }
      });
    }

    // Check access permissions
    const authContext = (req as any).authContext;
    const isCoordinator = authContext?.isCoordinator;
    const isOwner = project.facultyId.toString() === req.user!.id;

    if (!isCoordinator && !isOwner) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You can only update your own projects'
        }
      });
    }

    // Faculty can only edit their own draft projects (unless coordinator)
    if (!isCoordinator && project.status !== 'draft') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'EDIT_NOT_ALLOWED',
          message: 'You can only edit draft projects'
        }
      });
    }

    // Update project
    Object.assign(project, validatedData);
    await project.save();

    logger.info(`Project updated by ${req.user!.email}:`, {
      projectId: project._id,
      title: project.title,
      changes: Object.keys(validatedData)
    });

    res.json({
      success: true,
      data: project
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid project data',
          details: error.errors
        }
      });
    }

    logger.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_PROJECT_ERROR',
        message: 'Failed to update project'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/projects/{id}/submit:
 *   post:
 *     summary: Submit project for approval (Faculty only)
 *     description: Changes project status from draft to pending approval
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project submitted for approval successfully
 *       400:
 *         description: Invalid project ID or project not in draft status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.post('/:id/submit', authenticate, facultyGuard(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROJECT_ID',
          message: 'Invalid project ID format'
        }
      });
    }

    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        }
      });
    }

    // Check access permissions - only project owner can submit
    const isOwner = project.facultyId.toString() === req.user!.id;

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You can only submit your own projects'
        }
      });
    }

    // Can only submit draft projects
    if (project.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Only draft projects can be submitted for approval'
        }
      });
    }

    // Validate required fields before submission
    if (!project.title || !project.brief || !project.type || !project.department) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INCOMPLETE_PROJECT',
          message: 'Project must have title, brief, type, and department before submission'
        }
      });
    }

    // Update status to pending
    project.status = 'pending';
    await project.save();

    logger.info(`Project submitted for approval by ${req.user!.email}:`, {
      projectId: project._id,
      title: project.title,
      type: project.type
    });

    // TODO: Notify coordinators of pending project approval
    // This could be implemented with email notifications or in-app notifications

    res.json({
      success: true,
      data: project,
      message: 'Project submitted for approval successfully'
    });

  } catch (error) {
    logger.error('Error submitting project for approval:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUBMIT_PROJECT_ERROR',
        message: 'Failed to submit project for approval'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/projects/pending:
 *   get:
 *     summary: Get pending projects for coordinator approval
 *     description: Returns all projects with pending status for coordinator review
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [IDP, UROP, CAPSTONE]
 *         description: Filter by project type
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *     responses:
 *       200:
 *         description: List of pending projects
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Coordinator access required
 *       500:
 *         description: Server error
 */
router.get('/pending', authenticate, facultyGuard(true), async (req: Request, res: Response) => {
  try {
    const { type, department } = req.query;
    
    // Build query for pending projects
    const query: any = { status: 'pending' };
    
    if (type && typeof type === 'string') {
      query.type = type;
    }
    
    if (department && typeof department === 'string') {
      query.department = department;
    }
    
    const projects = await Project.find(query)
      .sort({ updatedAt: -1 });
    
    logger.info(`Retrieved ${projects.length} pending projects for coordinator ${req.user!.email}`);
    
    res.json({
      success: true,
      data: projects,
      message: projects.length === 0 ? 'No projects are pending approval at this time.' : undefined
    });

  } catch (error) {
    logger.error('Error fetching pending projects:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PENDING_PROJECTS_ERROR',
        message: 'Failed to fetch pending projects'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/projects/{id}/approve:
 *   post:
 *     summary: Approve project (Coordinator only)
 *     description: Changes project status from pending to published
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project approved successfully
 *       400:
 *         description: Invalid project ID or project not in pending status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Coordinator access required
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.post('/:id/approve', authenticate, facultyGuard(true), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROJECT_ID',
          message: 'Invalid project ID format'
        }
      });
    }

    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        }
      });
    }

    // Can only approve pending projects
    if (project.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Only pending projects can be approved'
        }
      });
    }

    // Update status to published
    project.status = 'published';
    await project.save();

    logger.info(`Project approved by coordinator ${req.user!.email}:`, {
      projectId: project._id,
      title: project.title,
      facultyId: project.facultyId
    });

    res.json({
      success: true,
      data: project,
      message: 'Project approved successfully'
    });

  } catch (error) {
    logger.error('Error approving project:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'APPROVE_PROJECT_ERROR',
        message: 'Failed to approve project'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/projects/{id}/reject:
 *   post:
 *     summary: Reject project (Coordinator only)
 *     description: Changes project status from pending to archived with optional reason
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Optional reason for rejection
 *     responses:
 *       200:
 *         description: Project rejected successfully
 *       400:
 *         description: Invalid project ID or project not in pending status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Coordinator access required
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.post('/:id/reject', authenticate, facultyGuard(true), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROJECT_ID',
          message: 'Invalid project ID format'
        }
      });
    }

    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        }
      });
    }

    // Can only reject pending projects
    if (project.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Only pending projects can be rejected'
        }
      });
    }

    // Update status to archived (rejected projects are archived)
    project.status = 'archived';
    await project.save();

    logger.info(`Project rejected by coordinator ${req.user!.email}:`, {
      projectId: project._id,
      title: project.title,
      facultyId: project.facultyId,
      reason: reason || 'No reason provided'
    });

    // TODO: Notify faculty member of rejection with reason
    // This could be implemented with email notifications or in-app notifications

    res.json({
      success: true,
      data: project,
      message: 'Project rejected successfully'
    });

  } catch (error) {
    logger.error('Error rejecting project:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REJECT_PROJECT_ERROR',
        message: 'Failed to reject project'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/projects/bulk-approve:
 *   post:
 *     summary: Bulk approve projects (Coordinator only)
 *     description: Approves multiple projects at once
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectIds
 *             properties:
 *               projectIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of project IDs to approve
 *     responses:
 *       200:
 *         description: Bulk approval completed
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Coordinator access required
 *       500:
 *         description: Server error
 */
router.post('/bulk-approve', authenticate, facultyGuard(true), async (req: Request, res: Response) => {
  try {
    const { projectIds } = req.body;
    
    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROJECT_IDS',
          message: 'Project IDs must be a non-empty array'
        }
      });
    }

    // Validate all project IDs
    const invalidIds = projectIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROJECT_ID_FORMAT',
          message: 'One or more project IDs have invalid format',
          details: { invalidIds }
        }
      });
    }

    // Find all pending projects with the given IDs
    const projects = await Project.find({
      _id: { $in: projectIds },
      status: 'pending'
    });

    if (projects.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_PENDING_PROJECTS',
          message: 'No pending projects found with the provided IDs'
        }
      });
    }

    // Update all found projects to published
    const result = await Project.updateMany(
      { _id: { $in: projects.map(p => p._id) } },
      { status: 'published' }
    );

    logger.info(`Bulk approval completed by coordinator ${req.user!.email}:`, {
      approvedCount: result.modifiedCount,
      requestedCount: projectIds.length,
      projectIds: projects.map(p => p._id)
    });

    res.json({
      success: true,
      data: {
        approvedCount: result.modifiedCount,
        requestedCount: projectIds.length,
        skippedCount: projectIds.length - result.modifiedCount
      },
      message: `Successfully approved ${result.modifiedCount} projects`
    });

  } catch (error) {
    logger.error('Error in bulk approval:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BULK_APPROVE_ERROR',
        message: 'Failed to perform bulk approval'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   delete:
 *     summary: Delete project
 *     description: Deletes a project (faculty can delete their own drafts, coordinators can delete any)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, facultyGuard(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROJECT_ID',
          message: 'Invalid project ID format'
        }
      });
    }

    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        }
      });
    }

    // Check access permissions
    const authContext = (req as any).authContext;
    const isCoordinator = authContext?.isCoordinator;
    const isOwner = project.facultyId.toString() === req.user!.id;

    if (!isCoordinator && !isOwner) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You can only delete your own projects'
        }
      });
    }

    // Faculty can only delete their own draft projects (unless coordinator)
    if (!isCoordinator && project.status !== 'draft') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'DELETE_NOT_ALLOWED',
          message: 'You can only delete draft projects'
        }
      });
    }

    await Project.findByIdAndDelete(id);

    logger.info(`Project deleted by ${req.user!.email}:`, {
      projectId: id,
      title: project.title
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_PROJECT_ERROR',
        message: 'Failed to delete project'
      }
    });
  }
});

export default router;