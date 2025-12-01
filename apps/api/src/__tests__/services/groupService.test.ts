import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { GroupService, GroupCodeGenerator } from '../../services/groupService';
import { Group } from '../../models/Group';
import { User } from '../../models/User';
import { beforeEach } from 'node:test';
import { beforeEach } from 'node:test';
import { beforeEach } from 'node:test';
import { beforeEach } from 'node:test';
import { beforeEach } from 'node:test';
import { beforeEach } from 'node:test';

describe('GroupService', () => {
  let mongoServer: MongoMemoryServer;
  let testUserId1: mongoose.Types.ObjectId;
  let testUserId2: mongoose.Types.ObjectId;
  let testUserId3: mongoose.Types.ObjectId;
  let testUserId4: mongoose.Types.ObjectId;
  let testUserId5: mongoose.Types.ObjectId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test users
    const users = await User.create([
      { googleId: 'google1', name: 'Test User 1', email: 'user1@srmap.edu.in', role: 'student' },
      { googleId: 'google2', name: 'Test User 2', email: 'user2@srmap.edu.in', role: 'student' },
      { googleId: 'google3', name: 'Test User 3', email: 'user3@srmap.edu.in', role: 'student' },
      { googleId: 'google4', name: 'Test User 4', email: 'user4@srmap.edu.in', role: 'student' },
      { googleId: 'google5', name: 'Test User 5', email: 'user5@srmap.edu.in', role: 'student' }
    ]);

    testUserId1 = users[0]._id;
    testUserId2 = users[1]._id;
    testUserId3 = users[2]._id;
    testUserId4 = users[3]._id;
    testUserId5 = users[4]._id;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Group.deleteMany({});
  });

  describe('GroupCodeGenerator', () => {
    test('should generate 6-character code', () => {
      const code = GroupCodeGenerator.generate();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRTUVWXYZ23456789]{6}$/);
    });

    test('should exclude O/0, I/1, S/5 characters', () => {
      // Generate multiple codes to test exclusion
      for (let i = 0; i < 100; i++) {
        const code = GroupCodeGenerator.generate();
        expect(code).not.toMatch(/[OI15S0]/);
      }
    });

    test('should generate unique codes', async () => {
      const code1 = await GroupCodeGenerator.generateUnique();
      const code2 = await GroupCodeGenerator.generateUnique();
      
      expect(code1).toHaveLength(6);
      expect(code2).toHaveLength(6);
      expect(code1).not.toBe(code2);
    });

    test('should handle collision and generate unique code', async () => {
      // Create a group with a specific code
      const existingCode = 'ABC234';
      await Group.create({
        code: existingCode,
        type: 'IDP',
        memberIds: [testUserId1],
        status: 'forming'
      });

      // Mock the generator to return the existing code first, then a new one
      const originalGenerate = GroupCodeGenerator.generate;
      let callCount = 0;
      GroupCodeGenerator.generate = jest.fn(() => {
        callCount++;
        return callCount === 1 ? existingCode : 'DEF567';
      });

      const uniqueCode = await GroupCodeGenerator.generateUnique();
      expect(uniqueCode).toBe('DEF567');

      // Restore original method
      GroupCodeGenerator.generate = originalGenerate;
    });
  });

  describe('createGroup', () => {
    test('should create group successfully', async () => {
      const group = await GroupService.createGroup(testUserId1, 'IDP');
      
      expect(group.code).toHaveLength(6);
      expect(group.type).toBe('IDP');
      expect(group.memberIds).toHaveLength(1);
      expect(group.memberIds[0].toString()).toBe(testUserId1.toString());
      expect(group.status).toBe('forming');
    });

    test('should prevent user from creating multiple groups of same type', async () => {
      await GroupService.createGroup(testUserId1, 'IDP');
      
      await expect(GroupService.createGroup(testUserId1, 'IDP'))
        .rejects.toThrow('User already belongs to a IDP group');
    });

    test('should allow user to create groups of different types', async () => {
      const idpGroup = await GroupService.createGroup(testUserId1, 'IDP');
      const uropGroup = await GroupService.createGroup(testUserId1, 'UROP');
      
      expect(idpGroup.type).toBe('IDP');
      expect(uropGroup.type).toBe('UROP');
    });
  });

  describe('joinGroup', () => {
    let groupCode: string;

    beforeEach(async () => {
      const group = await GroupService.createGroup(testUserId1, 'IDP');
      groupCode = group.code;
    });

    test('should join group successfully', async () => {
      const group = await GroupService.joinGroup(testUserId2, groupCode);
      
      expect(group.memberIds).toHaveLength(2);
      expect(group.memberIds.map(id => id.toString())).toContain(testUserId2.toString());
    });

    test('should handle case insensitive group codes', async () => {
      const group = await GroupService.joinGroup(testUserId2, groupCode.toLowerCase());
      
      expect(group.memberIds).toHaveLength(2);
      expect(group.memberIds.map(id => id.toString())).toContain(testUserId2.toString());
    });

    test('should prevent joining non-existent group', async () => {
      await expect(GroupService.joinGroup(testUserId2, 'INVALID'))
        .rejects.toThrow('Group not found');
    });

    test('should prevent joining same group twice', async () => {
      await GroupService.joinGroup(testUserId2, groupCode);
      
      await expect(GroupService.joinGroup(testUserId2, groupCode))
        .rejects.toThrow('User is already a member of this group');
    });

    test('should prevent joining full group', async () => {
      // Fill the group to capacity (4 members)
      await GroupService.joinGroup(testUserId2, groupCode);
      await GroupService.joinGroup(testUserId3, groupCode);
      await GroupService.joinGroup(testUserId4, groupCode);
      
      await expect(GroupService.joinGroup(testUserId5, groupCode))
        .rejects.toThrow('Group is full (maximum 4 members)');
    });

    test('should prevent joining group not in forming status', async () => {
      const group = await Group.findOne({ code: groupCode });
      group!.status = 'applied';
      await group!.save();
      
      await expect(GroupService.joinGroup(testUserId2, groupCode))
        .rejects.toThrow('Cannot join group - group is not in forming status');
    });

    test('should prevent user from joining multiple groups of same type', async () => {
      const anotherGroup = await GroupService.createGroup(testUserId3, 'IDP');
      await GroupService.joinGroup(testUserId2, anotherGroup.code);
      
      await expect(GroupService.joinGroup(testUserId2, groupCode))
        .rejects.toThrow('User already belongs to a IDP group');
    });
  });

  describe('leaveGroup', () => {
    let group: any;

    beforeEach(async () => {
      group = await GroupService.createGroup(testUserId1, 'IDP');
      await GroupService.joinGroup(testUserId2, group.code);
    });

    test('should leave group successfully', async () => {
      const updatedGroup = await GroupService.leaveGroup(testUserId2, group._id);
      
      expect(updatedGroup!.memberIds).toHaveLength(1);
      expect(updatedGroup!.memberIds.map((id: any) => id.toString())).not.toContain(testUserId2.toString());
    });

    test('should delete group when last member leaves', async () => {
      await GroupService.leaveGroup(testUserId2, group._id);
      const result = await GroupService.leaveGroup(testUserId1, group._id);
      
      expect(result).toBeNull();
      
      const deletedGroup = await Group.findById(group._id);
      expect(deletedGroup).toBeNull();
    });

    test('should prevent leaving non-existent group', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await expect(GroupService.leaveGroup(testUserId1, fakeId))
        .rejects.toThrow('Group not found');
    });

    test('should prevent leaving group not in forming status', async () => {
      group.status = 'applied';
      await group.save();
      
      await expect(GroupService.leaveGroup(testUserId2, group._id))
        .rejects.toThrow('Cannot leave group - group is not in forming status');
    });

    test('should prevent non-member from leaving group', async () => {
      await expect(GroupService.leaveGroup(testUserId3, group._id))
        .rejects.toThrow('User is not a member of this group');
    });
  });

  describe('resetGroupCode', () => {
    let group: any;

    beforeEach(async () => {
      group = await GroupService.createGroup(testUserId1, 'IDP');
    });

    test('should reset group code successfully', async () => {
      const originalCode = group.code;
      const updatedGroup = await GroupService.resetGroupCode(testUserId1, group._id);
      
      expect(updatedGroup.code).not.toBe(originalCode);
      expect(updatedGroup.code).toHaveLength(6);
    });

    test('should prevent non-creator from resetting code', async () => {
      await GroupService.joinGroup(testUserId2, group.code);
      
      await expect(GroupService.resetGroupCode(testUserId2, group._id))
        .rejects.toThrow('Only the group creator can reset the code');
    });

    test('should prevent resetting code for non-forming group', async () => {
      group.status = 'applied';
      await group.save();
      
      await expect(GroupService.resetGroupCode(testUserId1, group._id))
        .rejects.toThrow('Cannot reset code - group is not in forming status');
    });
  });

  describe('deleteGroup', () => {
    let group: any;

    beforeEach(async () => {
      group = await GroupService.createGroup(testUserId1, 'IDP');
    });

    test('should delete group successfully', async () => {
      await GroupService.deleteGroup(testUserId1, group._id);
      
      const deletedGroup = await Group.findById(group._id);
      expect(deletedGroup).toBeNull();
    });

    test('should prevent non-creator from deleting group', async () => {
      await GroupService.joinGroup(testUserId2, group.code);
      
      await expect(GroupService.deleteGroup(testUserId2, group._id))
        .rejects.toThrow('Only the group creator can delete the group');
    });

    test('should prevent deleting non-forming group', async () => {
      group.status = 'applied';
      await group.save();
      
      await expect(GroupService.deleteGroup(testUserId1, group._id))
        .rejects.toThrow('Cannot delete group - group is not in forming status');
    });
  });

  describe('getGroupById and getGroupByCode', () => {
    let group: any;

    beforeEach(async () => {
      group = await GroupService.createGroup(testUserId1, 'IDP');
    });

    test('should get group by ID', async () => {
      const foundGroup = await GroupService.getGroupById(group._id);
      
      expect(foundGroup).toBeTruthy();
      expect(foundGroup!._id.toString()).toBe(group._id.toString());
    });

    test('should get group by code', async () => {
      const foundGroup = await GroupService.getGroupByCode(group.code);
      
      expect(foundGroup).toBeTruthy();
      expect(foundGroup!.code).toBe(group.code);
    });

    test('should return null for non-existent group', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const foundGroup = await GroupService.getGroupById(fakeId);
      
      expect(foundGroup).toBeNull();
    });
  });

  describe('getUserGroups', () => {
    test('should get all user groups', async () => {
      const idpGroup = await GroupService.createGroup(testUserId1, 'IDP');
      const uropGroup = await GroupService.createGroup(testUserId1, 'UROP');
      
      const userGroups = await GroupService.getUserGroups(testUserId1);
      
      expect(userGroups).toHaveLength(2);
      expect(userGroups.map(g => g.type)).toContain('IDP');
      expect(userGroups.map(g => g.type)).toContain('UROP');
    });

    test('should return empty array for user with no groups', async () => {
      const userGroups = await GroupService.getUserGroups(testUserId1);
      
      expect(userGroups).toHaveLength(0);
    });
  });
});