import express from 'express';
import mongoose from 'mongoose';
import { StudentEvaluationService } from '../services/studentEvaluationService';
import { authenticate } from '../middleware/auth';
import { rbacGuard } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const updateInternalScoreSchema = Joi.object({
  studentId: Joi.string().required().custom((value: any, helpers: any) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }),
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
  studentId: Joi.string().required().custom((value: any, helpers: any) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }),
  groupId: Joi.string().required().custom((value: any, helpers: any) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }),
  conductScore: Joi.number().min(0).max(100).required()
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
      const { studentId, groupId, component, conductScore } = req.body;
      const facultyId = req.user!.id;

      const result = await StudentEvaluationService.updateStudentInternalScore(
        new mongoose.Types.ObjectId(studentId),
        new mongoose.Types.ObjectId(groupId),
        component as 'cla1' | 'cla2' | 'cla3',
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
      const { studentId, groupId, conductScore } = req.body;
      const facultyId = req.user!.id;

      const result = await StudentEvaluationService.updateStudentExternalScore(
        new mongoose.Types.ObjectId(studentId),
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

      const submissions = await StudentEvaluationService.getSubmissionsWithEvaluations(
        new mongoose.Types.ObjectId(facultyId)
      );

      res.json({
        success: true,
        data: submissions,
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
        data: evaluations
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

export default router;