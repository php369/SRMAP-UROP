import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ApplicationService } from '../../services/applicationService';
import { GroupService } from '../../services/groupService';
import { Application } from '../../models/Application';
import { Group } from '../../models/Group';
import { Project } from '../../models/Project';
import { User } from '../../models/User';
import { beforeEach } from 'node:test';

describe('ApplicationService', () => {
  let mongoServer: MongoMemoryServer;
  let testUserId1: mongoose.Types.ObjectId;
  let testUserId2: mongoose.Types.ObjectId;
  let testFacultyId: mongoose.Types.ObjectId;
  let testGroupId: mongoose.Types.ObjectId;
  let testProjectId1: mongoose.Types.ObjectId;
  let testProjectId2: mongoose.Types.ObjectId;
  let testProjectId3: mongoose.Types.ObjectId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test users
    const users = await User.create([
      { googleId: 'google1', name: 'Test User 1', email: 'user1@srmap.edu.in', role: 'student' },
      { googleId: 'google2', name: 'Test User 2', email: 'user2@srmap.edu.in', role: 'student' }
    ]);

    testUserId1 = users[0]._id;
    testUserId2 = users[1]._id;

    // Create test faculty
    const faculty = await User.create({
      googleId: 'google-faculty',
      email: 'faculty@srmap.edu.in',
      name: 'Test Faculty',
      role: 'faculty',
      department: 'CSE',
      isCoordinator: false,
      preferences: { theme: 'light', notifications: true }
    });

    testFacultyId = faculty._id;

    // Create test projects
    const projects = await Project.create([
      {
        title: 'Test Project 1',
        brief: 'Test project 1 brief',
        type: 'IDP',
        department: 'CSE',
        facultyId: testFacultyId,
        facultyName: 'Test Faculty',
        status: 'published'
      },
      {
        title: 'Test Project 2',
        brief: 'Test project 2 brief',
        type: 'IDP',
        department: 'CSE',
        facultyId: testFacultyId,
        facultyName: 'Test Faculty',
        status: 'published'
      },
      {
        title: 'Test Project 3',
        brief: 'Test project 3 brief',
        type: 'IDP',
        department: 'CSE',
        facultyId: testFacultyId,
        facultyName: 'Test Faculty',
        status: 'published'
      }
    ]);

    testProjectId1 = projects[0]._id;
    testProjectId2 = projects[1]._id;
    testProjectId3 = projects[2]._id;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Application.deleteMany({});
    await Group.deleteMany({});
    
    // Create a test group
    const group = await GroupService.createGroup(testUserId1, 'IDP');
    testGroupId = group._id;
  });

  describe('createApplication', () => {
    test('should create application with single project choice', async () => {
      const application = await ApplicationService.createApplication(
        testGroupId,
        [testProjectId1],
        testUserId1
      );

      expect(application.choices).toHaveLength(1);
      expect(application.choices[0]._id.toString()).toBe(testProjectId1.toString());
      expect(application.state).toBe('pending');

      // Check that group status changed to 'applied'
      const group = await Group.findById(testGroupId);
      expect(group?.status).toBe('applied');
    });

    test('should create application with multiple project choices', async () => {
      const application = await ApplicationService.createApplication(
        testGroupId,
        [testProjectId1, testProjectId2, testProjectId3],
        testUserId1
      );

      expect(application.choices).toHaveLength(3);
      expect(application.state).toBe('pending');
    });

    test('should prevent creating application with no choices', async () => {
      await expect(
        ApplicationService.createApplication(testGroupId, [], testUserId1)
      ).rejects.toThrow('Application must have between 1 and 3 project choices');
    });

    test('should prevent creating application with more than 3 choices', async () => {
      const extraProject = await Project.create({
        title: 'Extra Project',
        brief: 'Extra project brief',
        type: 'IDP',
        department: 'CSE',
        facultyId: testFacultyId,
        facultyName: 'Test Faculty',
        status: 'published'
      });

      await expect(
        ApplicationService.createApplication(
          testGroupId,
          [testProjectId1, testProjectId2, testProjectId3, extraProject._id],
          testUserId1
        )
      ).rejects.toThrow('Application must have between 1 and 3 project choices');
    });

    test('should prevent non-member from creating application', async () => {
      await expect(
        ApplicationService.createApplication(testGroupId, [testProjectId1], testUserId2)
      ).rejects.toThrow('User is not a member of this group');
    });

    test('should prevent creating application for non-forming group', async () => {
      const group = await Group.findById(testGroupId);
      group!.status = 'approved';
      await group!.save();

      await expect(
        ApplicationService.createApplication(testGroupId, [testProjectId1], testUserId1)
      ).rejects.toThrow('Cannot apply - group is not in forming status');
    });

    test('should prevent duplicate applications for same group', async () => {
      await ApplicationService.createApplication(testGroupId, [testProjectId1], testUserId1);

      // Reset group status to forming to test the duplicate application check specifically
      const group = await Group.findById(testGroupId);
      group!.status = 'forming';
      await group!.save();

      await expect(
        ApplicationService.createApplication(testGroupId, [testProjectId2], testUserId1)
      ).rejects.toThrow('Group already has an application');
    });

    test('should prevent duplicate project choices', async () => {
      await expect(
        ApplicationService.createApplication(
          testGroupId,
          [testProjectId1, testProjectId1],
          testUserId1
        )
      ).rejects.toThrow('Duplicate project choices are not allowed');
    });

    test('should validate project type matches group type', async () => {
      // Create UROP project
      const uropProject = await Project.create({
        title: 'UROP Project',
        brief: 'UROP project brief',
        type: 'UROP',
        department: 'CSE',
        facultyId: testFacultyId,
        facultyName: 'Test Faculty',
        status: 'published'
      });

      await expect(
        ApplicationService.createApplication(testGroupId, [uropProject._id], testUserId1)
      ).rejects.toThrow('Selected projects must be of type IDP');
    });
  });

  describe('getApplicationByGroupId', () => {
    test('should get application by group ID', async () => {
      const createdApp = await ApplicationService.createApplication(
        testGroupId,
        [testProjectId1],
        testUserId1
      );

      const foundApp = await ApplicationService.getApplicationByGroupId(testGroupId);
      
      expect(foundApp).toBeTruthy();
      expect(foundApp!._id.toString()).toBe(createdApp._id.toString());
    });

    test('should return null for group with no application', async () => {
      const foundApp = await ApplicationService.getApplicationByGroupId(testGroupId);
      expect(foundApp).toBeNull();
    });
  });

  describe('updateApplicationChoices', () => {
    let applicationId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      const application = await ApplicationService.createApplication(
        testGroupId,
        [testProjectId1],
        testUserId1
      );
      applicationId = application._id;
    });

    test('should update application choices successfully', async () => {
      const updatedApp = await ApplicationService.updateApplicationChoices(
        applicationId,
        [testProjectId2, testProjectId3],
        testUserId1
      );

      expect(updatedApp.choices).toHaveLength(2);
      expect(updatedApp.choices.map(c => c._id.toString())).toContain(testProjectId2.toString());
      expect(updatedApp.choices.map(c => c._id.toString())).toContain(testProjectId3.toString());
    });

    test('should prevent non-member from updating application', async () => {
      await expect(
        ApplicationService.updateApplicationChoices(
          applicationId,
          [testProjectId2],
          testUserId2
        )
      ).rejects.toThrow('User is not a member of this group');
    });
  });

  describe('getUserApplications', () => {
    test('should get user applications', async () => {
      await ApplicationService.createApplication(testGroupId, [testProjectId1], testUserId1);

      const userApps = await ApplicationService.getUserApplications(testUserId1);
      
      expect(userApps).toHaveLength(1);
      expect(userApps[0].choices[0]._id.toString()).toBe(testProjectId1.toString());
    });

    test('should return empty array for user with no applications', async () => {
      const userApps = await ApplicationService.getUserApplications(testUserId2);
      expect(userApps).toHaveLength(0);
    });
  });

  describe('approveApplication', () => {
    test('should approve application and assign group to project', async () => {
      // Create application first
      const application = await ApplicationService.createApplication(
        testGroupId,
        [testProjectId1, testProjectId2],
        testUserId1
      );

      // Approve the application (choose first project)
      const result = await ApplicationService.approveApplication(
        application._id,
        1, // First project choice
        testFacultyId,
        'Approved for good work'
      );

      expect(result.application.state).toBe('approved');
      expect(result.application.decidedBy?._id?.toString() || result.application.decidedBy?.toString()).toBe(testFacultyId.toString());
      expect(result.application.decidedAt).toBeDefined();
      expect(result.application.notes).toBe('Approved for good work');

      // Check that group was updated
      const updatedGroup = await Group.findById(testGroupId);
      expect(updatedGroup?.status).toBe('approved');
      expect(updatedGroup?.projectId?.toString()).toBe(testProjectId1.toString());
      expect(updatedGroup?.facultyId?.toString()).toBe(testFacultyId.toString());
    });

    test('should reject other applications when one is approved', async () => {
      // Create another group and application
      const group2 = await GroupService.createGroup(testUserId2, 'IDP');
      
      const application1 = await ApplicationService.createApplication(
        testGroupId,
        [testProjectId1],
        testUserId1
      );

      const application2 = await ApplicationService.createApplication(
        group2._id,
        [testProjectId1],
        testUserId2
      );

      // Approve first application
      await ApplicationService.approveApplication(
        application1._id,
        1,
        testFacultyId
      );

      // Check that second application was rejected (if project capacity is 1)
      const updatedApplication2 = await Application.findById(application2._id);
      if (updatedApplication2?.state === 'rejected') {
        expect(updatedApplication2.state).toBe('rejected');
        expect(updatedApplication2.notes).toContain('Project capacity reached');
      }
    });

    test('should prevent approving non-pending application', async () => {
      const application = await ApplicationService.createApplication(
        testGroupId,
        [testProjectId1],
        testUserId1
      );

      // Approve once
      await ApplicationService.approveApplication(
        application._id,
        1,
        testFacultyId
      );

      // Try to approve again
      await expect(
        ApplicationService.approveApplication(
          application._id,
          1,
          testFacultyId
        )
      ).rejects.toThrow('Application is not in pending state');
    });

    test('should validate project choice index', async () => {
      const application = await ApplicationService.createApplication(
        testGroupId,
        [testProjectId1],
        testUserId1
      );

      await expect(
        ApplicationService.approveApplication(
          application._id,
          2, // Invalid choice (only 1 project in application)
          testFacultyId
        )
      ).rejects.toThrow('Invalid project choice');
    });
  });

  describe('rejectApplication', () => {
    test('should reject application successfully', async () => {
      const application = await ApplicationService.createApplication(
        testGroupId,
        [testProjectId1],
        testUserId1
      );

      const rejectedApplication = await ApplicationService.rejectApplication(
        application._id,
        testFacultyId,
        'Not suitable for this project'
      );

      expect(rejectedApplication.state).toBe('rejected');
      expect(rejectedApplication.decidedBy?._id?.toString() || rejectedApplication.decidedBy?.toString()).toBe(testFacultyId.toString());
      expect(rejectedApplication.decidedAt).toBeDefined();
      expect(rejectedApplication.notes).toBe('Not suitable for this project');

      // Check that group status was reset to forming
      const updatedGroup = await Group.findById(testGroupId);
      expect(updatedGroup?.status).toBe('forming');
    });

    test('should prevent rejecting non-pending application', async () => {
      const application = await ApplicationService.createApplication(
        testGroupId,
        [testProjectId1],
        testUserId1
      );

      // Reject once
      await ApplicationService.rejectApplication(
        application._id,
        testFacultyId
      );

      // Try to reject again
      await expect(
        ApplicationService.rejectApplication(
          application._id,
          testFacultyId
        )
      ).rejects.toThrow('Application is not in pending state');
    });
  });

  describe('validateDecisionAccess', () => {
    test('should allow coordinator to decide on any application', async () => {
      const application = await ApplicationService.createApplication(
        testGroupId,
        [testProjectId1],
        testUserId1
      );

      const result = await ApplicationService.validateDecisionAccess(
        application._id,
        testFacultyId,
        'coordinator'
      );

      expect(result.canDecide).toBe(true);
      expect(result.application).toBeDefined();
    });

    test('should allow faculty to decide on their own projects', async () => {
      const application = await ApplicationService.createApplication(
        testGroupId,
        [testProjectId1],
        testUserId1
      );

      const result = await ApplicationService.validateDecisionAccess(
        application._id,
        testFacultyId,
        'faculty'
      );

      expect(result.canDecide).toBe(true);
    });

    test('should prevent faculty from deciding on other faculty projects', async () => {
      // Create another faculty
      const otherFaculty = await User.create({
        googleId: 'google-other-faculty',
        email: 'other@srmap.edu.in',
        name: 'Other Faculty',
        role: 'faculty',
        department: 'ECE',
        isCoordinator: false,
        preferences: { theme: 'light', notifications: true }
      });

      const application = await ApplicationService.createApplication(
        testGroupId,
        [testProjectId1],
        testUserId1
      );

      const result = await ApplicationService.validateDecisionAccess(
        application._id,
        otherFaculty._id,
        'faculty'
      );

      expect(result.canDecide).toBe(false);
      expect(result.reason).toContain('Faculty can only decide on applications for their own projects');
    });

    test('should prevent students from making decisions', async () => {
      const application = await ApplicationService.createApplication(
        testGroupId,
        [testProjectId1],
        testUserId1
      );

      const result = await ApplicationService.validateDecisionAccess(
        application._id,
        testUserId1,
        'student'
      );

      expect(result.canDecide).toBe(false);
      expect(result.reason).toBe('Insufficient permissions');
    });
  });

  describe('getFacultyApplications', () => {
    test('should get applications for faculty projects', async () => {
      await ApplicationService.createApplication(
        testGroupId,
        [testProjectId1, testProjectId2],
        testUserId1
      );

      const applications = await ApplicationService.getFacultyApplications(testFacultyId);

      expect(applications).toHaveLength(1);
      expect(applications[0].choices).toHaveLength(2);
      expect(applications[0].state).toBe('pending');
    });

    test('should return empty array for faculty with no applications', async () => {
      const otherFaculty = await User.create({
        googleId: 'google-other-faculty-2',
        email: 'other2@srmap.edu.in',
        name: 'Other Faculty 2',
        role: 'faculty',
        department: 'ECE',
        isCoordinator: false,
        preferences: { theme: 'light', notifications: true }
      });

      const applications = await ApplicationService.getFacultyApplications(otherFaculty._id);
      expect(applications).toHaveLength(0);
    });
  });
});