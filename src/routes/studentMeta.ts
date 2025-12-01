import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth';
import { StudentMetaService } from '../services/studentMetaService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     StudentMeta:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier
 *         userId:
 *           type: string
 *           description: Reference to User
 *         stream:
 *           type: string
 *           description: Academic stream (e.g., Computer Science)
 *         specialization:
 *           type: string
 *           description: Specialization (required if semester >= 6)
 *         cgpa:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *           description: Current CGPA (optional)
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     CreateStudentMetaRequest:
 *       type: object
 *       required:
 *         - stream
 *       properties:
 *         stream:
 *           type: string
 *           description: Academic stream
 *           example: "Computer Science"
 *         specialization:
 *           type: string
 *           description: Specialization (required if semester >= 6)
 *           example: "Artificial Intelligence"
 *         cgpa:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *           description: Current CGPA
 *           example: 8.5
 *     UpdateStudentMetaRequest:
 *       type: object
 *       properties:
 *         stream:
 *           type: string
 *           description: Academic stream
 *         specialization:
 *           type: string
 *           description: Specialization
 *         cgpa:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *           description: Current CGPA
 */

/**
 * @swagger
 * /api/v1/student-meta:
 *   get:
 *     summary: Get current user's student metadata
 *     tags: [StudentMeta]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student metadata retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StudentMeta'
 *       404:
 *         description: Student metadata not found
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const studentMeta = await StudentMetaService.getStudentMeta(userId);

    if (!studentMeta) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STUDENT_META_NOT_FOUND',
          message: 'Student metadata not found'
        }
      });
    }

    res.json({
      success: true,
      data: studentMeta
    });
  } catch (error) {
    logger.error('Error getting student metadata:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve student metadata'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/student-meta:
 *   post:
 *     summary: Create or update student metadata
 *     tags: [StudentMeta]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStudentMetaRequest'
 *     responses:
 *       200:
 *         description: Student metadata created/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StudentMeta'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Cannot edit metadata outside application window
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const { stream, specialization, cgpa } = req.body;

    // Validate required fields
    if (!stream || typeof stream !== 'string' || stream.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Stream is required and must be a non-empty string'
        }
      });
    }

    // Validate CGPA if provided
    if (cgpa !== undefined && cgpa !== null) {
      if (typeof cgpa !== 'number' || cgpa < 0 || cgpa > 10) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CGPA',
            message: 'CGPA must be a number between 0 and 10'
          }
        });
      }
    }

    // Check if user can edit metadata
    const { canEdit, reason } = await StudentMetaService.canEditStudentMeta(userId);
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'EDIT_NOT_ALLOWED',
          message: reason || 'Cannot edit student metadata at this time'
        }
      });
    }

    const studentMeta = await StudentMetaService.createOrUpdateStudentMeta(userId, {
      stream: stream.trim(),
      specialization: specialization ? specialization.trim() : undefined,
      cgpa
    });

    res.json({
      success: true,
      data: studentMeta
    });
  } catch (error) {
    logger.error('Error creating/updating student metadata:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('required') || error.message.includes('must be')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      }
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create/update student metadata'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/student-meta:
 *   put:
 *     summary: Update student metadata
 *     tags: [StudentMeta]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStudentMetaRequest'
 *     responses:
 *       200:
 *         description: Student metadata updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StudentMeta'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Cannot edit metadata outside application window
 *       404:
 *         description: Student metadata not found
 */
router.put('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const { stream, specialization, cgpa } = req.body;

    // Validate CGPA if provided
    if (cgpa !== undefined && cgpa !== null) {
      if (typeof cgpa !== 'number' || cgpa < 0 || cgpa > 10) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CGPA',
            message: 'CGPA must be a number between 0 and 10'
          }
        });
      }
    }

    // Check if user can edit metadata
    const { canEdit, reason } = await StudentMetaService.canEditStudentMeta(userId);
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'EDIT_NOT_ALLOWED',
          message: reason || 'Cannot edit student metadata at this time'
        }
      });
    }

    const updateData: any = {};
    if (stream !== undefined) updateData.stream = stream.trim();
    if (specialization !== undefined) updateData.specialization = specialization ? specialization.trim() : specialization;
    if (cgpa !== undefined) updateData.cgpa = cgpa;

    const studentMeta = await StudentMetaService.updateStudentMeta(userId, updateData);

    res.json({
      success: true,
      data: studentMeta
    });
  } catch (error) {
    logger.error('Error updating student metadata:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Student metadata not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'STUDENT_META_NOT_FOUND',
            message: 'Student metadata not found'
          }
        });
      }
      
      if (error.message.includes('required') || error.message.includes('must be')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      }
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update student metadata'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/student-meta:
 *   delete:
 *     summary: Delete student metadata
 *     tags: [StudentMeta]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student metadata deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Cannot delete metadata outside application window
 *       404:
 *         description: Student metadata not found
 */
router.delete('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    // Check if user can edit metadata
    const { canEdit, reason } = await StudentMetaService.canEditStudentMeta(userId);
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'DELETE_NOT_ALLOWED',
          message: reason || 'Cannot delete student metadata at this time'
        }
      });
    }

    await StudentMetaService.deleteStudentMeta(userId);

    res.json({
      success: true,
      message: 'Student metadata deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting student metadata:', error);
    
    if (error instanceof Error && error.message === 'Student metadata not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STUDENT_META_NOT_FOUND',
          message: 'Student metadata not found'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete student metadata'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/student-meta/validate:
 *   get:
 *     summary: Validate student metadata completeness for application
 *     tags: [StudentMeta]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Validation result
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
 *                     isValid:
 *                       type: boolean
 *                     missingFields:
 *                       type: array
 *                       items:
 *                         type: string
 *                     studentMeta:
 *                       $ref: '#/components/schemas/StudentMeta'
 *       401:
 *         description: Unauthorized
 */
router.get('/validate', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const validation = await StudentMetaService.validateMetaForApplication(userId);

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    logger.error('Error validating student metadata:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to validate student metadata'
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/student-meta/can-edit:
 *   get:
 *     summary: Check if student can edit metadata
 *     tags: [StudentMeta]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Edit permission status
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
 *                     canEdit:
 *                       type: boolean
 *                     reason:
 *                       type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/can-edit', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const editPermission = await StudentMetaService.canEditStudentMeta(userId);

    res.json({
      success: true,
      data: editPermission
    });
  } catch (error) {
    logger.error('Error checking edit permissions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check edit permissions'
      }
    });
  }
});

export default router;