import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate } from '../middleware/auth';
import { rbacGuard } from '../middleware/rbac';
import { logger } from '../utils/logger';
import { Submission } from '../models/Submission';
import { GroupSubmission } from '../models/GroupSubmission';
import { Group } from '../models/Group';
import https from 'https';
import http from 'http';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * GET /api/files/pdf/:publicId
 * Stream PDF from Cloudinary through backend to bypass untrusted customer restrictions
 */
router.get('/pdf/:publicId', authenticate, rbacGuard('student', 'faculty', 'coordinator'), async (req, res) => {
  try {
    const { publicId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    logger.info('PDF access request:', { publicId, userId, userRole });

    // Verify user has access to this PDF
    const hasAccess = await verifyPdfAccess(publicId, userId, userRole);
    if (!hasAccess) {
      logger.warn('Unauthorized PDF access attempt:', { publicId, userId });
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this file'
      });
    }

    // Generate Cloudinary URL using API credentials (bypasses untrusted restrictions)
    const cloudinaryUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      type: 'upload',
      secure: true,
      sign_url: true,
      auth_token: {
        key: process.env.CLOUDINARY_API_KEY,
        duration: 3600, // 1 hour
        start_time: Math.floor(Date.now() / 1000)
      }
    });

    logger.info('Streaming PDF from Cloudinary:', { publicId, cloudinaryUrl: cloudinaryUrl.substring(0, 100) + '...' });

    // Stream the PDF from Cloudinary to client
    const protocol = cloudinaryUrl.startsWith('https:') ? https : http;
    
    const cloudinaryRequest = protocol.get(cloudinaryUrl, (cloudinaryResponse) => {
      // Check if Cloudinary response is successful
      if (cloudinaryResponse.statusCode !== 200) {
        logger.error('Cloudinary PDF fetch failed:', { 
          publicId, 
          statusCode: cloudinaryResponse.statusCode,
          statusMessage: cloudinaryResponse.statusMessage 
        });
        return res.status(404).json({
          success: false,
          error: 'PDF file not found or inaccessible'
        });
      }

      // Set appropriate headers for PDF streaming
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // Forward content length if available
      if (cloudinaryResponse.headers['content-length']) {
        res.setHeader('Content-Length', cloudinaryResponse.headers['content-length']);
      }

      // Stream the PDF data to client
      cloudinaryResponse.pipe(res);

      cloudinaryResponse.on('end', () => {
        logger.info('PDF streaming completed:', { publicId, userId });
      });

      cloudinaryResponse.on('error', (error) => {
        logger.error('Cloudinary stream error:', { publicId, error: error.message });
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Error streaming PDF file'
          });
        }
      });
    });

    cloudinaryRequest.on('error', (error) => {
      logger.error('Cloudinary request error:', { publicId, error: error.message });
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch PDF from storage'
        });
      }
    });

    // Handle client disconnect
    req.on('close', () => {
      cloudinaryRequest.destroy();
      logger.info('Client disconnected during PDF streaming:', { publicId, userId });
    });

  } catch (error: any) {
    logger.error('PDF streaming error:', { 
      publicId: req.params.publicId, 
      userId: req.user?.id, 
      error: error.message 
    });
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Internal server error while accessing PDF'
      });
    }
  }
});

/**
 * Verify if user has access to the PDF based on submission ownership
 */
async function verifyPdfAccess(publicId: string, userId: string, userRole: string): Promise<boolean> {
  try {
    // Faculty and coordinators can access all PDFs
    if (userRole.includes('faculty') || userRole.includes('coordinator')) {
      return true;
    }

    // For students, check if they own the submission or are part of the group
    
    // Check solo submissions
    const soloSubmission = await Submission.findOne({
      'reportFile.cloudinaryId': publicId,
      studentId: userId
    });
    
    if (soloSubmission) {
      return true;
    }

    // Check group submissions
    const groupSubmission = await GroupSubmission.findOne({
      'reportFile.cloudinaryId': publicId
    }).populate('groupId');

    if (groupSubmission && groupSubmission.groupId) {
      // Check if user is a member of the group
      const group = await Group.findById(groupSubmission.groupId);
      if (group) {
        const memberIds = group.members.map((member: any) => 
          typeof member === 'object' ? member.user?.toString() || member._id?.toString() : member.toString()
        );
        return memberIds.includes(userId);
      }
    }

    return false;
  } catch (error) {
    logger.error('Error verifying PDF access:', { publicId, userId, error });
    return false;
  }
}

export default router;