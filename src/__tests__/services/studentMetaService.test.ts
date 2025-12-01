import mongoose from 'mongoose';
import { StudentMetaService } from '../../services/studentMetaService';
import { StudentMeta } from '../../models/StudentMeta';
import { User } from '../../models/User';
import { Eligibility } from '../../models/Eligibility';
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

describe('StudentMetaService', () => {
  let userId: mongoose.Types.ObjectId;
  let userEmail: string;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test-student-meta-service';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await StudentMeta.deleteMany({});
    await User.deleteMany({});
    await Eligibility.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections
    await StudentMeta.deleteMany({});
    await User.deleteMany({});
    await Eligibility.deleteMany({});

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
  });

  describe('createOrUpdateStudentMeta', () => {
    it('should create new student metadata', async () => {
      const data = {
        stream: 'Computer Science',
        specialization: 'Artificial Intelligence',
        cgpa: 8.5
      };

      const result = await StudentMetaService.createOrUpdateStudentMeta(userId, data);

      expect(result).toBeDefined();
      expect(result.userId.toString()).toBe(userId.toString());
      expect(result.stream).toBe(data.stream);
      expect(result.specialization).toBe(data.specialization);
      expect(result.cgpa).toBe(data.cgpa);
    });

    it('should update existing student metadata', async () => {
      // Create initial metadata
      await StudentMeta.create({
        userId,
        stream: 'Information Technology',
        cgpa: 7.5
      });

      const updateData = {
        stream: 'Computer Science',
        specialization: 'Machine Learning',
        cgpa: 8.0
      };

      const result = await StudentMetaService.createOrUpdateStudentMeta(userId, updateData);

      expect(result.stream).toBe(updateData.stream);
      expect(result.specialization).toBe(updateData.specialization);
      expect(result.cgpa).toBe(updateData.cgpa);
    });

    it('should require specialization for semester >= 6', async () => {
      // Create eligibility with semester 7
      await Eligibility.create({
        studentEmail: userEmail,
        regNo: 'AP21110010001',
        year: 4,
        semester: 7,
        termKind: 'odd',
        type: 'CAPSTONE',
        validFrom: new Date(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const data = {
        stream: 'Computer Science'
        // Missing specialization
      };

      await expect(
        StudentMetaService.createOrUpdateStudentMeta(userId, data)
      ).rejects.toThrow('Specialization is required for students in semester 6 or higher');
    });

    it('should validate CGPA range', async () => {
      const data = {
        stream: 'Computer Science',
        cgpa: 11 // Invalid CGPA > 10
      };

      await expect(
        StudentMetaService.createOrUpdateStudentMeta(userId, data)
      ).rejects.toThrow('CGPA must be between 0 and 10');
    });
  });

  describe('getStudentMeta', () => {
    it('should return student metadata if exists', async () => {
      const metadata = await StudentMeta.create({
        userId,
        stream: 'Computer Science',
        specialization: 'AI',
        cgpa: 8.5
      });

      const result = await StudentMetaService.getStudentMeta(userId);

      expect(result).toBeDefined();
      expect(result!._id.toString()).toBe(metadata._id.toString());
    });

    it('should return null if metadata does not exist', async () => {
      const result = await StudentMetaService.getStudentMeta(userId);
      expect(result).toBeNull();
    });
  });

  describe('validateMetaForApplication', () => {
    it('should validate complete metadata', async () => {
      await StudentMeta.create({
        userId,
        stream: 'Computer Science',
        specialization: 'AI',
        cgpa: 8.5
      });

      await Eligibility.create({
        studentEmail: userEmail,
        regNo: 'AP21110010001',
        year: 4,
        semester: 7,
        termKind: 'odd',
        type: 'CAPSTONE',
        validFrom: new Date(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const result = await StudentMetaService.validateMetaForApplication(userId);

      expect(result.isValid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
      expect(result.studentMeta).toBeDefined();
    });

    it('should identify missing stream', async () => {
      const result = await StudentMetaService.validateMetaForApplication(userId);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('stream');
      expect(result.studentMeta).toBeNull();
    });

    it('should identify missing specialization for semester >= 6', async () => {
      await StudentMeta.create({
        userId,
        stream: 'Computer Science'
        // Missing specialization
      });

      await Eligibility.create({
        studentEmail: userEmail,
        regNo: 'AP21110010001',
        year: 4,
        semester: 7,
        termKind: 'odd',
        type: 'CAPSTONE',
        validFrom: new Date(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const result = await StudentMetaService.validateMetaForApplication(userId);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('specialization');
    });
  });

  describe('canEditStudentMeta', () => {
    it('should allow editing when application window is active', async () => {
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

      // Create active window
      const { Window } = await import('../../models/Window');
      await Window.create({
        kind: 'application',
        type: 'IDP',
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        end: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        enforced: true
      });

      const result = await StudentMetaService.canEditStudentMeta(userId);

      expect(result.canEdit).toBe(true);
    });

    it('should not allow editing when application window is not active', async () => {
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

      // No active window exists

      const result = await StudentMetaService.canEditStudentMeta(userId);

      expect(result.canEdit).toBe(false);
      expect(result.reason).toContain('Application window is not currently active');
    });
  });
});