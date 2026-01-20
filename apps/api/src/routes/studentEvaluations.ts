import express from 'express';
import mongoose from 'mongoose';
import { StudentEvaluationService } from '../services/studentEvaluationService';
import { authenticate } from '../middleware/auth';
import { rbacGuard } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';
import Joi from 'joi';

const router: express.Router = express.Router();

// Validation schemas
const updateInternalScoreSchema = Joi.object({
  studentId: Joi.string().required().custom((value: any, helpers: any) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }),
  groupId: Joi.string().allow(null, '').optional().custom((value: any, helpers: any) => {
    if (value && !mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }),
  component: Joi.string().valid('cla1', 'cla2', 'cla3').required(),
  conductScore: Joi.number().min(0).required(),
  assessmentType: Joi.string().valid('CLA-1', 'CLA-2', 'CLA-3').required(),
  comments: Joi.string().max(1000).allow('').optional()
});

const updateExternalScoreSchema = Joi.object({
  studentId: Joi.string().required().custom((value: any, helpers: any) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }),
  groupId: Joi.string().allow(null, '').optional().custom((value: any, helpers: any) => {
    if (value && !mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }),
  conductScore: Joi.number().min(0).max(100).required(),
  comments: Joi.string().max(1000).allow('').optional()
});

/**
 * PUT /api/student-evaluations/internal/score
 * Update internal assessment score for a student (CLA-1/CLA-2/CLA-3)
 */
router.put(
  '/internal/score',
  authenticate,
  rbacGuard('faculty', 'coordinator', 'admin'),
  validateRequest(updateInternalScoreSchema),
  async (req, res) => {
    try {
      const { studentId, groupId, component, conductScore, assessmentType, comments } = req.body;
      const facultyId = req.user!.id;

      const result = await StudentEvaluationService.updateStudentInternalScore(
        new mongoose.Types.ObjectId(studentId),
        groupId ? new mongoose.Types.ObjectId(groupId) : null,
        component as 'cla1' | 'cla2' | 'cla3',
        conductScore,
        new mongoose.Types.ObjectId(facultyId),
        req.user!.role,
        assessmentType as 'CLA-1' | 'CLA-2' | 'CLA-3',
        comments
      );

      res.json({
        success: true,
        message: `${component.toUpperCase()} score updated successfully`,
        data: result
      });

    } catch (error) {
      logger.error('Error updating student internal score:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            message: error.message
          });
        }

        if (error.message.includes('not authorized') ||
          error.message.includes('must be between') ||
          error.message.includes('not a member')) {
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
        message: 'Failed to update student internal score'
      });
    }
  }
);

/**
 * PUT /api/student-evaluations/external/score
 * Update external assessment score for a student
 */
router.put(
  '/external/score',
  authenticate,
  rbacGuard('faculty', 'coordinator', 'admin'),
  validateRequest(updateExternalScoreSchema),
  async (req, res) => {
    try {
      const { studentId, groupId, conductScore, comments } = req.body;
      const facultyId = req.user!.id;

      const result = await StudentEvaluationService.updateStudentExternalScore(
        new mongoose.Types.ObjectId(studentId),
        groupId ? new mongoose.Types.ObjectId(groupId) : null,
        conductScore,
        new mongoose.Types.ObjectId(facultyId),
        req.user!.role,
        comments
      );

      res.json({
        success: true,
        message: 'External score updated successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error updating student external score:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            message: error.message
          });
        }

        if (error.message.includes('not assigned') ||
          error.message.includes('must be between')) {
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
        message: 'Failed to update student external score'
      });
    }
  }
);

/**
 * GET /api/student-evaluations/faculty
 * Get student evaluations for faculty grading
 */
router.get(
  '/faculty',
  authenticate,
  rbacGuard('faculty', 'coordinator', 'admin'),
  async (req, res) => {
    try {
      const facultyId = req.user!.id;
      const { type } = req.query;

      const evaluations = await StudentEvaluationService.getFacultyStudentEvaluations(
        new mongoose.Types.ObjectId(facultyId),
        type as 'IDP' | 'UROP' | 'CAPSTONE' | undefined
      );

      res.json({
        success: true,
        data: evaluations,
        message: evaluations.length === 0 ? 'No student evaluations are available yet.' : undefined
      });

    } catch (error) {
      logger.error('Error getting faculty student evaluations:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to get student evaluations'
      });
    }
  }
);

/**
 * GET /api/student-evaluations/submissions
 * Get submissions with student evaluation data for faculty assessment page
 */
router.get(
  '/submissions',
  authenticate,
  rbacGuard('faculty', 'coordinator', 'admin'),
  async (req, res) => {
    try {
      const facultyId = req.user!.id;

      const { submissions, assignedGroupCount, assignedSoloCount } = await StudentEvaluationService.getSubmissionsWithEvaluations(
        new mongoose.Types.ObjectId(facultyId)
      );

      res.json({
        success: true,
        data: {
          submissions,
          assignedGroupCount,
          assignedSoloCount
        },
        message: submissions.length === 0 ? 'No submissions are available yet.' : undefined
      });

    } catch (error) {
      logger.error('Error getting submissions with evaluations:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to get submissions'
      });
    }
  }
);

/**
 * GET /api/student-evaluations/my
 * Get student's own evaluations
 */
router.get(
  '/my',
  authenticate,
  rbacGuard('student'),
  async (req, res) => {
    try {
      const studentId = req.user!.id;

      const evaluations = await StudentEvaluationService.getStudentOwnEvaluation(
        new mongoose.Types.ObjectId(studentId)
      );

      res.json({
        success: true,
        evaluations: evaluations
      });

    } catch (error) {
      logger.error('Error getting student own evaluation:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to get evaluations'
      });
    }
  }
);

/**
 * GET /api/student-evaluations/group/:groupId
 * Get evaluation for a specific group (student view)
 */
router.get(
  '/group/:groupId',
  authenticate,
  rbacGuard('student', 'faculty', 'coordinator', 'admin'),
  async (req, res) => {
    try {
      const { groupId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid group ID'
        });
      }

      // For now, return null as this endpoint needs to be implemented in the service
      // This is a placeholder to prevent 404 errors
      res.json({
        success: true,
        evaluation: null
      });

    } catch (error) {
      logger.error('Error getting group evaluation:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to get group evaluation'
      });
    }
  }
);

/**
 * GET /api/student-evaluations/faculty/:facultyId
 * Get evaluations assigned to faculty for grading
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

      const evaluations = await StudentEvaluationService.getFacultyStudentEvaluations(
        new mongoose.Types.ObjectId(facultyId),
        type as 'IDP' | 'UROP' | 'CAPSTONE' | undefined
      );

      res.json({
        success: true,
        data: evaluations,
        message: evaluations.length === 0 ? 'No student evaluations are available yet.' : undefined
      });

    } catch (error) {
      logger.error('Error getting faculty student evaluations:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to get student evaluations'
      });
    }
  }
);

/**
 * GET /api/student-evaluations/external-assignments/:facultyId
 * Get evaluations assigned to external faculty
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

      // Get external evaluator assignments for this faculty
      const assignments = await StudentEvaluationService.getExternalEvaluatorAssignmentsForFaculty(
        new mongoose.Types.ObjectId(facultyId)
      );

      res.json({
        success: true,
        data: assignments,
        message: assignments.length > 0
          ? `Found ${assignments.length} external evaluator assignments`
          : 'You have not been assigned as an external evaluator for any projects yet.'
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
 * PUT /api/student-evaluations/publish
 * Bulk publish or unpublish student evaluations
 */
router.put(
  '/publish',
  authenticate,
  rbacGuard('coordinator', 'admin'),
  async (req, res) => {
    try {
      const { evaluationIds, isPublished } = req.body;

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

      // For now, return success with 0 updated as this functionality needs to be implemented
      res.json({
        success: true,
        message: `0 evaluation(s) ${isPublished ? 'published' : 'unpublished'} successfully`,
        data: { updated: 0, evaluations: [] }
      });

    } catch (error) {
      logger.error('Error updating evaluation publication status:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to update evaluation publication status'
      });
    }
  }
);

/**
 * GET /api/student-evaluations/released-count
 * Get count of released evaluations by project type
 */
router.get(
  '/released-count',
  authenticate,
  rbacGuard('coordinator', 'admin'),
  async (req, res) => {
    try {
      const { projectType } = req.query;

      if (!projectType) {
        return res.status(400).json({
          success: false,
          message: 'Project type is required'
        });
      }

      // Validate project type
      if (!['IDP', 'UROP', 'CAPSTONE'].includes(projectType as string)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project type. Must be IDP, UROP, or CAPSTONE'
        });
      }

      const { StudentEvaluation } = await import('../models/StudentEvaluation');
      const { Group } = await import('../models/Group');

      // Find all groups of the specified project type
      const groups = await Group.find({
        type: projectType,
        status: 'approved',
        assignedProjectId: { $exists: true }
      }).select('_id');

      if (groups.length === 0) {
        return res.json({
          success: true,
          data: { count: 0 }
        });
      }

      const groupIds = groups.map(g => g._id);

      // Count published student evaluations for these groups
      const count = await StudentEvaluation.countDocuments({
        groupId: { $in: groupIds },
        isPublished: true
      });

      res.json({
        success: true,
        data: { count }
      });

    } catch (error) {
      logger.error('Error getting released evaluations count:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to get released evaluations count'
      });
    }
  }
);

/**
 * GET /api/student-evaluations/coordinator/overview
 * Get evaluation overview for coordinator management
 */
router.get(
  '/coordinator/overview',
  authenticate,
  rbacGuard('coordinator', 'admin'),
  async (_req, res) => {
    try {
      // For now, return empty data as this functionality needs to be implemented
      const result = {
        evaluations: [],
        stats: {
          total: 0,
          published: 0,
          unpublished: 0,
          complete: 0,
          incomplete: 0
        }
      };

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

export default router;