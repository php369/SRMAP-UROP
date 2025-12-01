import request from 'supertest';
import express from 'express';
import meetingLogRoutes from '../../routes/meetingLogs';
import { MeetingLogService } from '../../services/meetingLogService';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock the authentication middleware
jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      id: '507f1f77bcf86cd799439011',
      role: 'student',
      email: 'test@srmist.edu.in'
    };
    next();
  }
}));

// Mock the MeetingLogService
jest.mock('../../services/meetingLogService');

const app = express();
app.use(express.json());
app.use('/api/meeting-logs', meetingLogRoutes);

describe('Meeting Log Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/meeting-logs/group/:groupId', () => {
    it('should return 400 for invalid group ID', async () => {
      const response = await request(app)
        .get('/api/meeting-logs/group/invalid-id')
        .expect(400);

      expect(response.body.error).toBe('Invalid group ID');
    });

    it('should return meeting logs for valid group ID', async () => {
      const mockLogs = [
        {
          _id: '507f1f77bcf86cd799439012',
          status: 'approved',
          createdBy: { _id: '507f1f77bcf86cd799439011' }
        }
      ];

      jest.spyOn(MeetingLogService, 'getMeetingLogs').mockResolvedValue(mockLogs as any);
      jest.spyOn(MeetingLogService, 'validateMeetingLogAccess').mockResolvedValue({
        canAccess: true,
        meetingLog: mockLogs[0] as any
      });

      const response = await request(app)
        .get('/api/meeting-logs/group/507f1f77bcf86cd799439013')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/meeting-logs', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/meeting-logs')
        .send({
          groupId: '507f1f77bcf86cd799439013'
          // Missing attendees, mode, startedAt
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields: attendees, mode, and startedAt are required');
    });

    it('should return 400 for invalid group ID', async () => {
      const response = await request(app)
        .post('/api/meeting-logs')
        .send({
          groupId: 'invalid-id',
          attendees: [{ studentId: '507f1f77bcf86cd799439011', present: true }],
          mode: 'online',
          startedAt: new Date().toISOString()
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid group ID');
    });

    it('should create meeting log successfully', async () => {
      const mockMeetingLog = {
        _id: '507f1f77bcf86cd799439012',
        status: 'submitted',
        attendees: [{ studentId: '507f1f77bcf86cd799439011', present: true }]
      };

      jest.spyOn(MeetingLogService, 'createMeetingLog').mockResolvedValue(mockMeetingLog as any);

      const response = await request(app)
        .post('/api/meeting-logs')
        .send({
          groupId: '507f1f77bcf86cd799439013',
          attendees: [{ studentId: '507f1f77bcf86cd799439011', present: true }],
          mode: 'online',
          startedAt: new Date().toISOString()
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockMeetingLog);
      expect(response.body.message).toBe('Meeting log created successfully');
    });
  });

  describe('POST /api/meeting-logs/:id/approve', () => {
    it('should return 400 for invalid meeting log ID', async () => {
      const response = await request(app)
        .post('/api/meeting-logs/invalid-id/approve')
        .expect(400);

      expect(response.body.error).toBe('Invalid meeting log ID');
    });

    it('should return 403 for non-faculty user', async () => {
      // Mock user as student (already set in auth mock)
      const response = await request(app)
        .post('/api/meeting-logs/507f1f77bcf86cd799439012/approve')
        .expect(403);

      expect(response.body.error).toBe('Only faculty can approve meeting logs');
    });
  });

  describe('POST /api/meeting-logs/:id/reject', () => {
    it('should return 400 for invalid meeting log ID', async () => {
      const response = await request(app)
        .post('/api/meeting-logs/invalid-id/reject')
        .send({ reason: 'Test reason' })
        .expect(400);

      expect(response.body.error).toBe('Invalid meeting log ID');
    });

    it('should return 403 for non-faculty user', async () => {
      const response = await request(app)
        .post('/api/meeting-logs/507f1f77bcf86cd799439012/reject')
        .send({ reason: 'Test reason' })
        .expect(403);

      expect(response.body.error).toBe('Only faculty can reject meeting logs');
    });
  });

  describe('GET /api/meeting-logs/faculty/pending', () => {
    it('should return 403 for non-faculty user', async () => {
      const response = await request(app)
        .get('/api/meeting-logs/faculty/pending')
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('GET /api/meeting-logs/user/my-logs', () => {
    it('should return user meeting logs', async () => {
      const mockLogs = [
        {
          _id: '507f1f77bcf86cd799439012',
          status: 'submitted'
        }
      ];

      jest.spyOn(MeetingLogService, 'getUserMeetingLogs').mockResolvedValue(mockLogs as any);

      const response = await request(app)
        .get('/api/meeting-logs/user/my-logs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockLogs);
    });
  });
});