import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { connectDatabase } from '../../config/database';
import { User } from '../../models/User';
import { Assessment } from '../../models/Assessment';
import { Course } from '../../models/Course';
import { Cohort } from '../../models/Cohort';
import { setupRoutes } from '../../routes';
import { generateTokenPair } from '../../services/jwtService';
import { afterEach } from 'node:test';

// Mock external services
const mockGoogleAuth = require('../../services/googleAuth');
const mockGoogleCalendar = require('../../services/googleCalendar');
const mockStorage = require('../../services/storageService');

describe('E2E User Workflows', () => {
  let app: express.Application;
  let studentUser: any;
  let facultyUser: any;
  let adminUser: any;
  let course: any;
  let cohort: any;
  let studentToken: string;
  let facultyToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await connectDatabase();
    
    app = express();
    app.use(express.json());
    setupRoutes(app);

    // Create test users first (needed for course facultyId)
    facultyUser = new User({
      googleId: 'faculty123',
      name: 'Faculty User',
      email: 'faculty@srmap.edu.in',
      role: 'faculty',
    });
    await facultyUser.save();

    // Create test data
    course = new Course({
      title: 'Web Development',
      code: 'CS301',
      description: 'Full-stack web development course',
      credits: 3,
      facultyId: facultyUser._id,
      semester: 'Fall',
      year: 2024,
    });
    await course.save();

    cohort = new Cohort({
      name: 'CS 2024',
      year: 2024,
      department: 'Computer Science',
      courseIds: [course._id],
    });
    await cohort.save();

    // Create test users
    studentUser = new User({
      googleId: 'student123',
      name: 'Student User',
      email: 'student@srmap.edu.in',
      role: 'student',
      profile: { cohortIds: [cohort._id] },
    });
    await studentUser.save();

    adminUser = new User({
      googleId: 'admin123',
      name: 'Admin User',
      email: 'admin@srmap.edu.in',
      role: 'admin',
    });
    await adminUser.save();

    // Generate tokens
    studentToken = generateTokenPair({
      userId: studentUser._id.toString(),
      email: studentUser.email,
      name: studentUser.name,
      role: studentUser.role,
    }).accessToken;

    facultyToken = generateTokenPair({
      userId: facultyUser._id.toString(),
      email: facultyUser.email,
      name: facultyUser.name,
      role: facultyUser.role,
    }).accessToken;

    adminToken = generateTokenPair({
      userId: adminUser._id.toString(),
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    }).accessToken;

    // Mock external services
    mockGoogleCalendar.createCalendarEvent.mockResolvedValue({
      id: 'calendar-event-123',
      meetUrl: 'https://meet.google.com/test-meet-link',
    });
    mockStorage.uploadFile.mockResolvedValue({
      url: 'https://supabase.co/storage/test-file.pdf',
      path: 'submissions/test-file.pdf',
    });
  });

  afterEach(async () => {
    await Assessment.deleteMany({});
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
    await Cohort.deleteMany({});
    await Assessment.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Complete Assessment Workflow', () => {
    it('should complete full assessment lifecycle', async () => {
      // 1. Faculty creates assessment
      const createResponse = await request(app)
        .post('/api/v1/assessments')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          title: 'Final Project',
          description: 'Create a full-stack web application',
          courseId: course._id.toString(),
          dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          cohortIds: [cohort._id.toString()],
          settings: {
            allowLateSubmissions: false,
            maxFileSize: 10485760, // 10MB
            allowedFileTypes: ['pdf', 'zip'],
          },
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.assessment).toHaveProperty('_id');
      expect(createResponse.body.data.assessment.title).toBe('Final Project');
      
      const assessmentId = createResponse.body.data.assessment._id;

      // 2. Student views available assessments
      const studentAssessmentsResponse = await request(app)
        .get('/api/v1/assessments')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(studentAssessmentsResponse.body.success).toBe(true);
      expect(studentAssessmentsResponse.body.data.assessments).toHaveLength(1);
      expect(studentAssessmentsResponse.body.data.assessments[0]._id).toBe(assessmentId);

      // 3. Student views specific assessment details
      const assessmentDetailResponse = await request(app)
        .get(`/api/v1/assessments/${assessmentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(assessmentDetailResponse.body.success).toBe(true);
      expect(assessmentDetailResponse.body.data.assessment.title).toBe('Final Project');

      // 4. Faculty views their assessments
      const facultyAssessmentsResponse = await request(app)
        .get('/api/v1/assessments')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(facultyAssessmentsResponse.body.success).toBe(true);
      expect(facultyAssessmentsResponse.body.data.assessments).toHaveLength(1);

      // 5. Faculty updates assessment
      const updateResponse = await request(app)
        .patch(`/api/v1/assessments/${assessmentId}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          description: 'Updated: Create a full-stack web application with authentication',
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.assessment.description).toContain('Updated:');

      // 6. Admin views all assessments
      const adminAssessmentsResponse = await request(app)
        .get('/api/v1/assessments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminAssessmentsResponse.body.success).toBe(true);
      expect(adminAssessmentsResponse.body.data.assessments).toHaveLength(1);
    });

    it('should enforce proper access control', async () => {
      // Create assessment as faculty
      const createResponse = await request(app)
        .post('/api/v1/assessments')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          title: 'Test Assessment',
          description: 'Test description',
          courseId: course._id.toString(),
          dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          cohortIds: [cohort._id.toString()],
        })
        .expect(201);

      const assessmentId = createResponse.body.data.assessment._id;

      // Student should not be able to create assessments
      await request(app)
        .post('/api/v1/assessments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Unauthorized Assessment',
          description: 'This should fail',
          courseId: course._id.toString(),
          dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          cohortIds: [cohort._id.toString()],
        })
        .expect(403);

      // Student should not be able to update assessments
      await request(app)
        .patch(`/api/v1/assessments/${assessmentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Hacked Assessment',
        })
        .expect(403);

      // Student should not be able to delete assessments
      await request(app)
        .delete(`/api/v1/assessments/${assessmentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('Authentication Workflow', () => {
    it('should require authentication for protected routes', async () => {
      // Test various protected endpoints without token
      await request(app)
        .get('/api/v1/assessments')
        .expect(401);

      await request(app)
        .post('/api/v1/assessments')
        .send({})
        .expect(401);

      await request(app)
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('should reject invalid tokens', async () => {
      const invalidToken = 'invalid.jwt.token';

      await request(app)
        .get('/api/v1/assessments')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });

    it('should allow access with valid tokens', async () => {
      // Test that valid tokens work
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      await request(app)
        .get('/api/v1/assessments')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);
    });
  });

  describe('System Health Checks', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: 'test',
      });
    });

    it('should return API status', async () => {
      const response = await request(app)
        .get('/api/v1/status')
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'SRM Project Portal API is running',
        version: '1.0.0',
        timestamp: expect.any(String),
        endpoints: expect.any(Object),
      });
    });
  });
});