import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { StudentMeta } from '../../models/StudentMeta';
import { User } from '../../models/User';
import { Eligibility } from '../../models/Eligibility';
import { Window } from '../../models/Window';
import studentMetaRoutes from '../../routes/studentMeta';
import { beforeEach } from 'node:test';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock the auth middleware
jest.mock('../../middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = {
      id: req.headers['x-test-user-id'] || 'test-user-id',
      email: 'test@srmap.edu.in',
      name: 'Test User',
      role: 'student'
    };
    next();
  })
}));

describe('StudentMeta Routes', () => {
  let app: express.Application;
  let userId: mongoose.Types.ObjectId;
  let userEmail: string;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test-student-meta-routes';
    await mongoose.connect(mongoUri);
    
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/v1/student-meta', studentMetaRoutes);
  });

  afterAll(async () => {
    await StudentMeta.deleteMany({});
    await User.deleteMany({});
    await Eligibility.deleteMany({});
    await Window.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections
    await StudentMeta.deleteMany({});
    await User.deleteMany({});
    await Eligibility.deleteMany({});
    await Window.deleteMany({});

    // Create test user
    userId = new mongoose.Types.ObjectId();
    userEmail = 'test.student@srmap.edu.in';

    await User.create({
      _id: userId,
      googleId: 'test-google-id',
      name: 'Test Student',
      email: userEmail,
      role: 'student',
      profile: {
        department: 'Computer Science',
        year: 3
      },
      preferences: {
        theme: 'light',
        notifications: true
      }
    });

    // Create eligibility
    await Eligibility.create({
      studentEmail: userEmail,
      regNo: 'AP21110010001',
      year: 2,
      semester: 3,
      termKind: 'odd',
      type: 'IDP',
      validFrom: new Date(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    // Create active application window
    await Window.create({
      kind: 'application',
      type: 'IDP',
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      end: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      enforced: true
    });
  });

  describe('POST /api/v1/student-meta', () => {
    it('should create student metadata', async () => {
      const data = {
        stream: 'Computer Science',
        specialization: 'Artificial Intelligence',
        cgpa: 8.5
      };

      const response = await request(app)
        .post('/api/v1/student-meta')
        .set('x-test-user-id', userId.toString())
        .send(data)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stream).toBe(data.stream);
      expect(response.body.data.specialization).toBe(data.specialization);
      expect(response.body.data.cgpa).toBe(data.cgpa);
    });

    it('should require stream field', async () => {
      const data = {
        specialization: 'AI',
        cgpa: 8.5
      };

      const response = await request(app)
        .post('/api/v1/student-meta')
        .set('x-test-user-id', userId.toString())
        .send(data)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should validate CGPA range', async () => {
      const data = {
        stream: 'Computer Science',
        cgpa: 11 // Invalid
      };

      const response = await request(app)
        .post('/api/v1/student-meta')
        .set('x-test-user-id', userId.toString())
        .send(data)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CGPA');
    });

    it('should require authentication', async () => {
      const data = {
        stream: 'Computer Science'
      };

      await request(app)
        .post('/api/v1/student-meta')
        .send(data)
        .expect(401);
    });
  });

  describe('GET /api/v1/student-meta', () => {
    it('should get existing student metadata', async () => {
      // Create metadata first
      await StudentMeta.create({
        userId,
        stream: 'Computer Science',
        specialization: 'AI',
        cgpa: 8.5
      });

      const response = await request(app)
        .get('/api/v1/student-meta')
        .set('x-test-user-id', userId.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stream).toBe('Computer Science');
      expect(response.body.data.specialization).toBe('AI');
      expect(response.body.data.cgpa).toBe(8.5);
    });

    it('should return 404 if metadata does not exist', async () => {
      const response = await request(app)
        .get('/api/v1/student-meta')
        .set('x-test-user-id', userId.toString())
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('STUDENT_META_NOT_FOUND');
    });
  });

  describe('GET /api/v1/student-meta/validate', () => {
    it('should validate complete metadata', async () => {
      await StudentMeta.create({
        userId,
        stream: 'Computer Science',
        specialization: 'AI',
        cgpa: 8.5
      });

      const response = await request(app)
        .get('/api/v1/student-meta/validate')
        .set('x-test-user-id', userId.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.missingFields).toHaveLength(0);
    });

    it('should identify missing fields', async () => {
      const response = await request(app)
        .get('/api/v1/student-meta/validate')
        .set('x-test-user-id', userId.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.missingFields.length).toBeGreaterThan(0);
    });
  });
});