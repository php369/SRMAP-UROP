import express from 'express';
import mongoose from 'mongoose';
import { EvaluationService } from '../services/evaluationService';
import { authenticate } from '../middleware/auth';
import { rbacGuard } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const assignExternalEvaluatorSchema = Joi.object({
  groupId: Joi.string().required().custom((value: any, helpers: any) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }),
  externalFacultyId: Joi.string().required().custom((value: any, helpers: any) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  })
});

const removeExternalEvaluatorSchema = Joi.object({
  groupId: Joi.string().required().custom((value: any, helpers: any) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  })
});

const updateInternalScoreSchema = Joi.object({
  groupId: Joi.string().required().custom((value: any, helpers: any) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }),
  component: Joi.string().valid('cla1', 'cla2', 'cla3').required(),
  conductScore: Joi.number().min(0).required()
});

const updateExternalScoreSchema = Joi.object({
  groupId: Joi.string().required().custom((value: any, helpers: any) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }),
  conductScore: Joi.number().min(0).max(100).required()
});

/**
 * @swagger
 * /api/evaluations/internal/score:
 *   put:
 *     summary: Update internal assessment score (CLA-1/CLA-2/CLA-3)
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *               - component
 *               - conductScore
 *             properties:
 *               groupId:
 *                 type: string
 *                 description: Group ID to update evaluation for
 *               component:
 *                 type: string
 *                 enum: [cla1, cla2, cla3]
 *                 description: Assessment component to update
 *               conductScore:
 *                 type: number
 *                 minimum: 0
 *                 description: Conduct score (A1:0-20, A2:0-30, A3:0-50)
 *     responses:
 *       200:
 *         description: Internal score updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Evaluation'
 *       400:
 *         description: Invalid request data or score range
 *       403:
 *         description: Insufficient permissions or not assigned faculty
 *       404:
 *         description: Group or evaluation not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/internal/score',
  authenticate,
  rbacGuard('faculty', 'coordinator', 'admin'),
  validateRequest(updateInternalScoreSchema),
  async (req, res) => {
    try {
      const { groupId, component, conductScore } = req.body;
      const facultyId = req.user!.id;

      const result = await EvaluationService.updateInternalScore(
        new mongoose.Types.ObjectId(groupId),
        component as 'a1' | 'a2' | 'a3',
        conductScore,
        new mongoose.Types.ObjectId(facultyId),
        req.user!.role
      );

      res.json({
        success: true,
        message: `${component.toUpperCase()} score updated successfully`,
        data: result
      });

    } catch (error) {
      logger.error('Error updating internal score:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            message: error.message
          });
        }
        
        if (error.message.includes('not assigned') || 
            error.message.includes('must be between') ||
            error.message.includes('window not active')) {
          return res.status(400).json({
            success: false,
            message: error.message
          });
        }

        if (error.message.includes('not authorized')) {
          return res.status(403).json({
            success: false,
            message: error.message
          });
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update internal score'
      });
    }
  }
);

/**
 * @swagger
 * /api/evaluations/external/score:
 *   put:
 *     summary: Update external assessment score
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *               - conductScore
 *             properties:
 *               groupId:
 *                 type: string
 *                 description: Group ID to update evaluation for
 *               conductScore:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: External conduct score (0-100)
 *     responses:
 *       200:
 *         description: External score updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Evaluation'
 *       400:
 *         description: Invalid request data or score range
 *       403:
 *         description: Insufficient permissions or not assigned external evaluator
 *       404:
 *         description: Group or evaluation not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/external/score',
  authenticate,
  rbacGuard('faculty', 'coordinator', 'admin'),
  validateRequest(updateExternalScoreSchema),
  async (req, res) => {
    try {
      const { groupId, conductScore } = req.body;
      const facultyId = req.user!.id;

      const result = await EvaluationService.updateExternalScore(
        new mongoose.Types.ObjectId(groupId),
        conductScore,
        new mongoose.Types.ObjectId(facultyId),
        req.user!.role
      );

      res.json({
        success: true,
        message: 'External score updated successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error updating external score:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            message: error.message
          });
        }
        
        if (error.message.includes('not assigned') || 
            error.message.includes('must be between') ||
            error.message.includes('window not active')) {
          return res.status(400).json({
            success: false,
            message: error.message
          });
        }

        if (error.message.includes('not authorized')) {
          return res.status(403).json({
            success: false,
            message: error.message
          });
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update external score'
      });
    }
  }
);

/**
 * @swagger
 * /api/evaluations/faculty/{facultyId}:
 *   get:
 *     summary: Get evaluations assigned to faculty for grading
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facultyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Faculty ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [IDP, UROP, CAPSTONE]
 *         description: Filter by project type
 *     responses:
 *       200:
 *         description: List of evaluations assigned to faculty
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Evaluation'
 *       400:
 *         description: Invalid faculty ID
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/faculty/:facultyId',
  authenticate,
  rbacGuard('faculty', 'coordinator', 'admin'),
  async (req, res) => {
    try {
      const { facultyId } = req.params;
      const { type } = req.query;

      if (!mongoose.Types.ObjectId.isValid(facultyId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid faculty ID'
        });
      }

      // Faculty can only view their own evaluations, coordinators/admins can view any
      if (req.user!.role === 'faculty' && req.user!.id !== facultyId) {
        return res.status(403).json({
          success: false,
          message: 'Can only view your own evaluations'
        });
      }

      const evaluations = await EvaluationService.getFacultyEvaluations(
        new mongoose.Types.ObjectId(facultyId),
        type as 'IDP' | 'UROP' | 'CAPSTONE' | undefined
      );

      res.json({
        success: true,
        data: evaluations,
        message: evaluations.length === 0 ? 'No evaluations are available yet. Evaluations will appear once groups are assigned to your projects.' : undefined
      });

    } catch (error) {
      logger.error('Error getting faculty evaluations:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get faculty evaluations'
      });
    }
  }
);

/**
 * @swagger
 * /api/evaluations/external-evaluator/assign:
 *   post:
 *     summary: Assign external evaluator to a group
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *               - externalFacultyId
 *             properties:
 *               groupId:
 *                 type: string
 *                 description: Group ID to assign external evaluator to
 *               externalFacultyId:
 *                 type: string
 *                 description: External faculty ID to assign as evaluator
 *     responses:
 *       200:
 *         description: External evaluator assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     evaluation:
 *                       $ref: '#/components/schemas/Evaluation'
 *                     calendarUpdated:
 *                       type: boolean
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Group or faculty not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/external-evaluator/assign',
  authenticate,
  rbacGuard('coordinator', 'admin'),
  validateRequest(assignExternalEvaluatorSchema),
  async (req, res) => {
    try {
      const { groupId, externalFacultyId } = req.body;
      const assignedBy = req.user!.id;

      const result = await EvaluationService.assignExternalEvaluator(
        new mongoose.Types.ObjectId(groupId),
        new mongoose.Types.ObjectId(externalFacultyId),
        new mongoose.Types.ObjectId(assignedBy)
      );

      res.json({
        success: true,
        message: 'External evaluator assigned successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error assigning external evaluator:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            message: error.message
          });
        }
        
        if (error.message.includes('cannot be the same') || 
            error.message.includes('not active') ||
            error.message.includes('must be assigned')) {
          return res.status(400).json({
            success: false,
            message: error.message
          });
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to assign external evaluator'
      });
    }
  }
);

/**
 * @swagger
 * /api/evaluations/external-evaluator/remove:
 *   post:
 *     summary: Remove external evaluator from a group
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *             properties:
 *               groupId:
 *                 type: string
 *                 description: Group ID to remove external evaluator from
 *     responses:
 *       200:
 *         description: External evaluator removed successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Group or evaluation not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/external-evaluator/remove',
  authenticate,
  rbacGuard('coordinator', 'admin'),
  validateRequest(removeExternalEvaluatorSchema),
  async (req, res) => {
    try {
      const { groupId } = req.body;
      const removedBy = req.user!.id;

      const result = await EvaluationService.removeExternalEvaluator(
        new mongoose.Types.ObjectId(groupId),
        new mongoose.Types.ObjectId(removedBy)
      );

      res.json({
        success: true,
        message: 'External evaluator removed successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error removing external evaluator:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            message: error.message
          });
        }
        
        if (error.message.includes('No external evaluator')) {
          return res.status(400).json({
            success: false,
            message: error.message
          });
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to remove external evaluator'
      });
    }
  }
);

/**
 * @swagger
 * /api/evaluations/needing-external:
 *   get:
 *     summary: Get evaluations that need external evaluator assignment
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [IDP, UROP, CAPSTONE]
 *         description: Filter by project type
 *     responses:
 *       200:
 *         description: List of evaluations needing external evaluators
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Evaluation'
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/needing-external',
  authenticate,
  rbacGuard('coordinator', 'admin'),
  async (req, res) => {
    try {
      const { type } = req.query;
      const projectType = type as 'IDP' | 'UROP' | 'CAPSTONE' | undefined;

      const evaluations = await EvaluationService.getEvaluationsNeedingExternalEvaluator(projectType);

      res.json({
        success: true,
        data: evaluations,
        message: evaluations.length === 0 ? 'No evaluations currently need external evaluator assignment.' : undefined
      });

    } catch (error) {
      logger.error('Error getting evaluations needing external evaluator:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get evaluations needing external evaluator'
      });
    }
  }
);

/**
 * @swagger
 * /api/evaluations/external-assignments/{facultyId}:
 *   get:
 *     summary: Get evaluations assigned to external faculty
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facultyId
 *         required: true
 *         schema:
 *           type: string
 *         description: External faculty ID
 *     responses:
 *       200:
 *         description: List of evaluations assigned to external faculty
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Evaluation'
 *       400:
 *         description: Invalid faculty ID
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/external-assignments/:facultyId',
  authenticate,
  rbacGuard('faculty', 'coordinator', 'admin'),
  async (req, res) => {
    try {
      const { facultyId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(facultyId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid faculty ID'
        });
      }

      // Faculty can only view their own assignments, coordinators/admins can view any
      if (req.user!.role === 'faculty' && req.user!.id !== facultyId) {
        return res.status(403).json({
          success: false,
          message: 'Can only view your own external evaluator assignments'
        });
      }

      const evaluations = await EvaluationService.getExternalEvaluatorAssignments(
        new mongoose.Types.ObjectId(facultyId)
      );

      res.json({
        success: true,
        data: evaluations,
        message: evaluations.length === 0 ? 'You have not been assigned as an external evaluator for any projects yet.' : undefined
      });

    } catch (error) {
      logger.error('Error getting external evaluator assignments:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get external evaluator assignments'
      });
    }
  }
);

/**
 * @swagger
 * /api/evaluations/my:
 *   get:
 *     summary: Get evaluations for current user's groups (student view)
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of evaluations for user's groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 evaluations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       groupId:
 *                         type: string
 *                       groupCode:
 *                         type: string
 *                       projectTitle:
 *                         type: string
 *                       evaluation:
 *                         $ref: '#/components/schemas/Evaluation'
 *                       hasSubmission:
 *                         type: boolean
 *                       meetUrl:
 *                         type: string
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/my',
  authenticate,
  rbacGuard('student'),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const evaluations = await EvaluationService.getStudentEvaluations(userId);

      res.json({
        success: true,
        evaluations
      });

    } catch (error) {
      logger.error('Error getting student evaluations:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get evaluations'
      });
    }
  }
);

/**
 * @swagger
 * /api/evaluations/publish:
 *   put:
 *     summary: Bulk publish or unpublish evaluations
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - evaluationIds
 *               - isPublished
 *             properties:
 *               evaluationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of evaluation IDs to update
 *               isPublished:
 *                 type: boolean
 *                 description: Whether to publish (true) or unpublish (false)
 *     responses:
 *       200:
 *         description: Evaluations publication status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated:
 *                       type: number
 *                     evaluations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Evaluation'
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.put(
  '/publish',
  authenticate,
  rbacGuard('coordinator', 'admin'),
  async (req, res) => {
    try {
      const { evaluationIds, isPublished } = req.body;
      const publishedBy = req.user!.id;

      // Validate input
      if (!Array.isArray(evaluationIds) || evaluationIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'evaluationIds must be a non-empty array'
        });
      }

      if (typeof isPublished !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isPublished must be a boolean'
        });
      }

      // Validate all evaluation IDs
      for (const id of evaluationIds) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: `Invalid evaluation ID: ${id}`
          });
        }
      }

      const result = await EvaluationService.bulkUpdatePublishStatus(
        evaluationIds.map(id => new mongoose.Types.ObjectId(id)),
        isPublished,
        new mongoose.Types.ObjectId(publishedBy)
      );

      res.json({
        success: true,
        message: `${result.updated} evaluation(s) ${isPublished ? 'published' : 'unpublished'} successfully`,
        data: result
      });

    } catch (error) {
      logger.error('Error updating evaluation publication status:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            message: error.message
          });
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update evaluation publication status'
      });
    }
  }
);

/**
 * @swagger
 * /api/evaluations/coordinator/overview:
 *   get:
 *     summary: Get evaluation overview for coordinator management
 *     tags: [Evaluations]
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
 *         name: published
 *         schema:
 *           type: boolean
 *         description: Filter by publication status
 *     responses:
 *       200:
 *         description: Evaluation overview for coordinator
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     evaluations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Evaluation'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         published:
 *                           type: number
 *                         unpublished:
 *                           type: number
 *                         complete:
 *                           type: number
 *                         incomplete:
 *                           type: number
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  '/coordinator/overview',
  authenticate,
  rbacGuard('coordinator', 'admin'),
  async (req, res) => {
    try {
      const { type, published } = req.query;
      
      const projectType = type as 'IDP' | 'UROP' | 'CAPSTONE' | undefined;
      const publishedFilter = published === 'true' ? true : published === 'false' ? false : undefined;

      const result = await EvaluationService.getCoordinatorOverview(projectType, publishedFilter);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error getting coordinator evaluation overview:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get evaluation overview'
      });
    }
  }
);

/**
 * @swagger
 * /api/evaluations/group/{groupId}:
 *   get:
 *     summary: Get evaluation for a specific group (student view)
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Evaluation for the specified group
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 evaluation:
 *                   type: object
 *                   properties:
 *                     groupId:
 *                       type: string
 *                     groupCode:
 *                       type: string
 *                     projectTitle:
 *                       type: string
 *                     evaluation:
 *                       $ref: '#/components/schemas/Evaluation'
 *                     hasSubmission:
 *                       type: boolean
 *                     meetUrl:
 *                       type: string
 *       400:
 *         description: Invalid group ID
 *       403:
 *         description: Insufficient permissions or not a group member
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/group/:groupId',
  authenticate,
  rbacGuard('student', 'faculty', 'coordinator'),
  async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user!.id;

      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid group ID'
        });
      }

      const evaluation = await EvaluationService.getGroupEvaluationForStudent(
        new mongoose.Types.ObjectId(groupId),
        userId,
        req.user!.role
      );

      if (!evaluation) {
        return res.status(404).json({
          success: false,
          message: 'Evaluation not found or access denied'
        });
      }

      res.json({
        success: true,
        evaluation
      });

    } catch (error) {
      logger.error('Error getting group evaluation:', error);
      
      if (error instanceof Error && error.message.includes('not a member')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get evaluation'
      });
    }
  }
);

export default router;