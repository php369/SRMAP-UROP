import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { User } from '../../models/User';
import { Project } from '../../models/Project';
import { Group } from '../../models/Group';
import { Application } from '../../models/Application';
import { Eligibility } from '../../models/Eligibility';
import { FacultyRoster } from '../../models/FacultyRoster';
import { Evaluation } from '../../models/Evaluation';
import { GroupSubmission } from '../../models/GroupSubmission';
import { generateTokenPair } from '../../services/jwtService';

// Mock external services
jest.mock('../../services/googleAuth');
jest.mock('../../services/googleCalendar');
jest.mock('../../services/cloudinaryService');

describe('E2E Smoke Tests', () => {
  let app: express.Application;
  let studentUser: any;
  let facultyUser: any;
  let coordinatorUser: any;
  let adminUser: any;
  let project: any;
  let studentToken: string;
  let facultyToken: string;
  let coordinatorToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Use the global MongoDB connection
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    // Create Express app with routes
    app = express();
    app.use(express.json());
    
    // Import and setup routes
    const authRoutes = require('../../routes/auth');
    const projectRoutes = require('../../routes/projects');
    const groupRoutes = require('../../routes/groups');
    const applicationRoutes = require('../../routes/applications');
    const evaluationRoutes = require('../../routes/evaluations');
    const submissionRoutes = require('../../routes/submissions');
    const adminRoutes = require('../../routes/admin');

    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/projects', projectRoutes);
    app.use('/api/v1/groups', groupRoutes);
    app.use('/api/v1/applications', applicationRoutes);
    app.use('/api/v1/evaluations', evaluationRoutes);
    app.use('/api/v1/submissions', submissionRoutes);
    app.use('/api/v1/admin', adminRoutes);

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'test',
      });
    });

    // Create test eligibility record
    await Eligibility.create({
      studentEmail: 'student@srmap.edu.in',
      regNo: 'AP21110010001',
      year: 3,
      semester: 7,
      termKind: 'odd',
      type: 'IDP',
      validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Create test faculty roster
    const facultyRoster = await FacultyRoster.create({
      email: 'faculty@srmap.edu.in',
      name: 'Dr. Faculty User',
      dept: 'CSE',
      isCoordinator: false,
      active: true,
    });

    const coordinatorRoster = await FacultyRoster.create({
      email: 'coordinator@srmap.edu.in',
      name: 'Dr. Coordinator User',
      dept: 'CSE',
      isCoordinator: true,
      active: true,
    });

    // Create test users
    studentUser = await User.create({
      googleId: 'student123',
      name: 'Student User',
      email: 'student@srmap.edu.in',
      role: 'student',
    });

    facultyUser = await User.create({
      googleId: 'faculty123',
      name: 'Faculty User',
      email: 'faculty@srmap.edu.in',
      role: 'faculty',
    });

    coordinatorUser = await User.create({
      googleId: 'coordinator123',
      name: 'Coordinator User',
      email: 'coordinator@srmap.edu.in',
      role: 'coordinator',
    });

    adminUser = await User.create({
      googleId: 'admin123',
      name: 'Admin User',
      email: 'admin@srmap.edu.in',
      role: 'admin',
    });

    // Create test project
    project = await Project.create({
      title: 'Machine Learning Research',
      brief: 'Research project on ML algorithms',
      description: 'Detailed research on machine learning algorithms and their applications',
      type: 'IDP',
      department: 'CSE',
      facultyId: facultyUser._id,
      facultyName: 'Dr. Faculty User',
      capacity: 2,
      status: 'published',
    });

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

    coordinatorToken = generateTokenPair({
      userId: coordinatorUser._id.toString(),
      email: coordinatorUser.email,
      name: coordinatorUser.name,
      role: coordinatorUser.role,
    }).accessToken;

    adminToken = generateTokenPair({
      userId: adminUser._id.toString(),
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    }).accessToken;
  });

  afterEach(async () => {
    // Clean up test data between tests
    await Group.deleteMany({});
    await Application.deleteMany({});
    await Evaluation.deleteMany({});
    await GroupSubmission.deleteMany({});
  });

  afterAll(async () => {
    // Clean up all test data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Eligibility.deleteMany({});
    await FacultyRoster.deleteMany({});
    await Group.deleteMany({});
    await Application.deleteMany({});
    await Evaluation.deleteMany({});
    await GroupSubmission.deleteMany({});
  });

  describe('Student Workflow: Auth → Group → Apply → Submit → View Grades', () => {
    it('should complete full student workflow', async () => {
      // 1. Student authentication check
      const authResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(authResponse.body.success).toBe(true);
      expect(authResponse.body.data.user.email).toBe('student@srmap.edu.in');

      // 2. Student creates a group
      const createGroupResponse = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ type: 'IDP' })
        .expect(201);

      expect(createGroupResponse.body.success).toBe(true);
      expect(createGroupResponse.body.data.group.type).toBe('IDP');
      expect(createGroupResponse.body.data.group.code).toHaveLength(6);
      
      const groupId = createGroupResponse.body.data.group._id;

      // 3. Student views available projects
      const projectsResponse = await request(app)
        .get('/api/v1/projects')
        .expect(200);

      expect(projectsResponse.body.success).toBe(true);
      expect(projectsResponse.body.data.projects).toHaveLength(1);
      expect(projectsResponse.body.data.projects[0].title).toBe('Machine Learning Research');

      // 4. Student applies for project
      const applyResponse = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          groupId: groupId,
          projectChoices: [project._id.toString()],
        })
        .expect(201);

      expect(applyResponse.body.success).toBe(true);
      expect(applyResponse.body.data.application.choices).toHaveLength(1);
      
      const applicationId = applyResponse.body.data.application._id;

      // 5. Faculty approves application
      const approveResponse = await request(app)
        .post(`/api/v1/applications/${applicationId}/approve`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          projectChoice: 1,
          notes: 'Good application, approved',
        })
        .expect(200);

      expect(approveResponse.body.success).toBe(true);
      expect(approveResponse.body.data.application.state).toBe('approved');

      // 6. Student submits project deliverables
      const submitResponse = await request(app)
        .post('/api/v1/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          groupId: groupId,
          githubUrl: 'https://github.com/student/ml-project',
          comments: 'Final submission with all requirements',
        })
        .expect(201);

      expect(submitResponse.body.success).toBe(true);
      expect(submitResponse.body.data.submission.githubUrl).toBe('https://github.com/student/ml-project');

      // 7. Faculty creates evaluation
      const evaluationResponse = await request(app)
        .post('/api/v1/evaluations')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          groupId: groupId,
          projectId: project._id.toString(),
          internal: {
            a1: { conduct: 18 },
            a2: { conduct: 25 },
            a3: { conduct: 45 },
          },
        })
        .expect(201);

      expect(evaluationResponse.body.success).toBe(true);
      expect(evaluationResponse.body.data.evaluation.totalInternal).toBeGreaterThan(0);

      // 8. Student views assessments (grades should be hidden until published)
      const assessmentsResponse = await request(app)
        .get('/api/v1/evaluations/my-assessments')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(assessmentsResponse.body.success).toBe(true);
      // Grades should be hidden until coordinator publishes
    });
  });

  describe('Faculty Workflow: Project Creation → Approval → Evaluation', () => {
    it('should complete faculty workflow', async () => {
      // 1. Faculty creates project
      const createProjectResponse = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          title: 'AI Ethics Research',
          brief: 'Research on ethical implications of AI',
          description: 'Comprehensive study on AI ethics and societal impact',
          type: 'UROP',
          department: 'CSE',
          capacity: 3,
        })
        .expect(201);

      expect(createProjectResponse.body.success).toBe(true);
      expect(createProjectResponse.body.data.project.title).toBe('AI Ethics Research');
      expect(createProjectResponse.body.data.project.status).toBe('draft');

      const newProjectId = createProjectResponse.body.data.project._id;

      // 2. Faculty submits project for approval
      const submitForApprovalResponse = await request(app)
        .post(`/api/v1/projects/${newProjectId}/submit-for-approval`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(submitForApprovalResponse.body.success).toBe(true);
      expect(submitForApprovalResponse.body.data.project.status).toBe('pending');

      // 3. Coordinator approves project
      const approveProjectResponse = await request(app)
        .post(`/api/v1/projects/${newProjectId}/approve`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          notes: 'Excellent project proposal, approved',
        })
        .expect(200);

      expect(approveProjectResponse.body.success).toBe(true);
      expect(approveProjectResponse.body.data.project.status).toBe('published');

      // 4. Faculty views their projects
      const facultyProjectsResponse = await request(app)
        .get('/api/v1/projects/my-projects')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(facultyProjectsResponse.body.success).toBe(true);
      expect(facultyProjectsResponse.body.data.projects.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Coordinator Workflow: Window Management → Grade Publication', () => {
    it('should complete coordinator workflow', async () => {
      // Create test evaluation first
      const group = await Group.create({
        code: 'TEST01',
        type: 'IDP',
        memberIds: [studentUser._id],
        projectId: project._id,
        facultyId: facultyUser._id,
        status: 'approved',
      });

      const evaluation = await Evaluation.create({
        groupId: group._id,
        projectId: project._id,
        facultyId: facultyUser._id,
        internal: {
          a1: { conduct: 18, convert: 9 },
          a2: { conduct: 25, convert: 13 },
          a3: { conduct: 45, convert: 23 },
        },
        external: {
          reportPresentation: { conduct: 80, convert: 40 },
        },
        totalInternal: 45,
        totalExternal: 40,
        total: 85,
        isPublished: false,
      });

      // 1. Coordinator views pending evaluations
      const pendingEvaluationsResponse = await request(app)
        .get('/api/v1/evaluations/pending')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .expect(200);

      expect(pendingEvaluationsResponse.body.success).toBe(true);

      // 2. Coordinator publishes evaluations
      const publishResponse = await request(app)
        .post('/api/v1/evaluations/bulk-publish')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          evaluationIds: [evaluation._id.toString()],
        })
        .expect(200);

      expect(publishResponse.body.success).toBe(true);

      // 3. Verify evaluation is now published
      const publishedEvaluation = await Evaluation.findById(evaluation._id);
      expect(publishedEvaluation?.isPublished).toBe(true);
    });
  });

  describe('System Health and Security', () => {
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

    it('should enforce authentication on protected routes', async () => {
      // Test various protected endpoints without token
      await request(app)
        .post('/api/v1/groups')
        .send({ type: 'IDP' })
        .expect(401);

      await request(app)
        .post('/api/v1/projects')
        .send({ title: 'Test Project' })
        .expect(401);

      await request(app)
        .get('/api/v1/evaluations/my-assessments')
        .expect(401);
    });

    it('should enforce role-based access control', async () => {
      // Student should not be able to create projects
      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Unauthorized Project',
          brief: 'This should fail',
          type: 'IDP',
          department: 'CSE',
        })
        .expect(403);

      // Faculty should not be able to publish evaluations
      await request(app)
        .post('/api/v1/evaluations/bulk-publish')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          evaluationIds: ['507f1f77bcf86cd799439011'],
        })
        .expect(403);

      // Student should not be able to access admin functions
      await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should validate input data', async () => {
      // Test invalid group creation
      await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ type: 'INVALID_TYPE' })
        .expect(400);

      // Test invalid project creation
      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          title: '', // Empty title should fail
          brief: 'Test brief',
          type: 'IDP',
          department: 'CSE',
        })
        .expect(400);
    });
  });

  describe('Data Integrity and Consistency', () => {
    it('should maintain data consistency across operations', async () => {
      // Create group
      const groupResponse = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ type: 'IDP' })
        .expect(201);

      const groupId = groupResponse.body.data.group._id;

      // Apply for project
      const applicationResponse = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          groupId: groupId,
          projectChoices: [project._id.toString()],
        })
        .expect(201);

      // Verify group status changed to 'applied'
      const updatedGroup = await Group.findById(groupId);
      expect(updatedGroup?.status).toBe('applied');

      // Approve application
      await request(app)
        .post(`/api/v1/applications/${applicationResponse.body.data.application._id}/approve`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          projectChoice: 1,
          notes: 'Approved',
        })
        .expect(200);

      // Verify group status changed to 'approved' and has project assigned
      const approvedGroup = await Group.findById(groupId);
      expect(approvedGroup?.status).toBe('approved');
      expect(approvedGroup?.projectId?.toString()).toBe(project._id.toString());
      expect(approvedGroup?.facultyId?.toString()).toBe(facultyUser._id.toString());
    });

    it('should handle concurrent operations safely', async () => {
      // This test would ideally test race conditions, but for simplicity
      // we'll test that multiple groups can be created without conflicts
      const group1Promise = request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ type: 'IDP' });

      // Create another student for concurrent test
      const student2 = await User.create({
        googleId: 'student2',
        name: 'Student 2',
        email: 'student2@srmap.edu.in',
        role: 'student',
      });

      await Eligibility.create({
        studentEmail: 'student2@srmap.edu.in',
        regNo: 'AP21110010002',
        year: 3,
        semester: 7,
        termKind: 'odd',
        type: 'IDP',
        validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const student2Token = generateTokenPair({
        userId: student2._id.toString(),
        email: student2.email,
        name: student2.name,
        role: student2.role,
      }).accessToken;

      const group2Promise = request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${student2Token}`)
        .send({ type: 'IDP' });

      const [group1Response, group2Response] = await Promise.all([
        group1Promise,
        group2Promise,
      ]);

      expect(group1Response.status).toBe(201);
      expect(group2Response.status).toBe(201);
      expect(group1Response.body.data.group.code).not.toBe(
        group2Response.body.data.group.code
      );
    });
  });
});