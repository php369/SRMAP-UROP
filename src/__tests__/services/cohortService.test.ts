import { cohortService } from '../../services/cohortService';
import { Cohort } from '../../models/Cohort';
import { User } from '../../models/User';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../../models/Cohort');
jest.mock('../../models/User');

describe('CohortService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createCohort', () => {
        it('should create a new cohort successfully', async () => {
            const mockCohortData = {
                name: 'CS 2024 Batch',
                year: 2024,
                department: 'Computer Science',
                members: []
            };

            const mockCohort = {
                _id: new mongoose.Types.ObjectId(),
                ...mockCohortData,
                status: 'active',
                save: jest.fn().mockResolvedValue(true)
            };

            (Cohort.findOne as jest.Mock).mockResolvedValue(null);
            (Cohort as any).mockImplementation(() => mockCohort);

            const result = await cohortService.createCohort(mockCohortData);

            expect(Cohort.findOne).toHaveBeenCalledWith({ name: mockCohortData.name });
            expect(mockCohort.save).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw error if cohort with same name exists', async () => {
            const mockCohortData = {
                name: 'CS 2024 Batch',
                year: 2024,
                department: 'Computer Science'
            };

            (Cohort.findOne as jest.Mock).mockResolvedValue({ name: 'CS 2024 Batch' });

            await expect(cohortService.createCohort(mockCohortData)).rejects.toThrow(
                'Cohort with this name already exists'
            );
        });

        it('should validate members exist when provided', async () => {
            const memberIds = [
                new mongoose.Types.ObjectId(),
                new mongoose.Types.ObjectId()
            ];

            const mockCohortData = {
                name: 'CS 2024 Batch',
                year: 2024,
                department: 'Computer Science',
                members: memberIds
            };

            (Cohort.findOne as jest.Mock).mockResolvedValue(null);
            (User.find as jest.Mock).mockResolvedValue([{ _id: memberIds[0] }]); // Only one user found

            await expect(cohortService.createCohort(mockCohortData)).rejects.toThrow(
                'One or more members not found'
            );
        });
    });

    describe('getCohortById', () => {
        it('should return cohort with populated members', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();
            const mockCohort = {
                _id: cohortId,
                name: 'CS 2024 Batch',
                members: []
            };

            const mockPopulate = jest.fn().mockResolvedValue(mockCohort);
            (Cohort.findById as jest.Mock).mockReturnValue({ populate: mockPopulate });

            const result = await cohortService.getCohortById(cohortId);

            expect(Cohort.findById).toHaveBeenCalledWith(cohortId);
            expect(mockPopulate).toHaveBeenCalledWith('members', 'name email role');
            expect(result).toEqual(mockCohort);
        });

        it('should throw error for invalid cohort ID', async () => {
            await expect(cohortService.getCohortById('invalid-id')).rejects.toThrow(
                'Invalid cohort ID'
            );
        });
    });

    describe('getCohorts', () => {
        it('should return all cohorts without filters', async () => {
            const mockCohorts = [
                { name: 'CS 2024', year: 2024 },
                { name: 'IT 2024', year: 2024 }
            ];

            const mockSort = jest.fn().mockResolvedValue(mockCohorts);
            const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
            (Cohort.find as jest.Mock).mockReturnValue({ populate: mockPopulate });

            const result = await cohortService.getCohorts();

            expect(Cohort.find).toHaveBeenCalledWith({});
            expect(result).toEqual(mockCohorts);
        });

        it('should filter cohorts by year', async () => {
            const mockCohorts = [{ name: 'CS 2024', year: 2024 }];

            const mockSort = jest.fn().mockResolvedValue(mockCohorts);
            const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
            (Cohort.find as jest.Mock).mockReturnValue({ populate: mockPopulate });

            await cohortService.getCohorts({ year: 2024 });

            expect(Cohort.find).toHaveBeenCalledWith({ year: 2024 });
        });

        it('should filter cohorts by department and status', async () => {
            const mockCohorts = [{ name: 'CS 2024', department: 'Computer Science', status: 'active' }];

            const mockSort = jest.fn().mockResolvedValue(mockCohorts);
            const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
            (Cohort.find as jest.Mock).mockReturnValue({ populate: mockPopulate });

            await cohortService.getCohorts({ department: 'Computer Science', status: 'active' });

            expect(Cohort.find).toHaveBeenCalledWith({
                department: 'Computer Science',
                status: 'active'
            });
        });
    });

    describe('updateCohort', () => {
        it('should update cohort successfully', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();
            const updates = { name: 'Updated Name' };

            const mockCohort = { _id: cohortId, ...updates };
            const mockPopulate = jest.fn().mockResolvedValue(mockCohort);

            (Cohort.findOne as jest.Mock).mockResolvedValue(null);
            (Cohort.findByIdAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate });

            const result = await cohortService.updateCohort(cohortId, updates);

            expect(Cohort.findByIdAndUpdate).toHaveBeenCalledWith(
                cohortId,
                { $set: updates },
                { new: true, runValidators: true }
            );
            expect(result).toEqual(mockCohort);
        });

        it('should throw error if updating to existing name', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();
            const updates = { name: 'Existing Name' };

            (Cohort.findOne as jest.Mock).mockResolvedValue({ name: 'Existing Name' });

            await expect(cohortService.updateCohort(cohortId, updates)).rejects.toThrow(
                'Cohort with this name already exists'
            );
        });

        it('should throw error for invalid cohort ID', async () => {
            await expect(cohortService.updateCohort('invalid-id', {})).rejects.toThrow(
                'Invalid cohort ID'
            );
        });
    });

    describe('addMembers', () => {
        it('should add members to cohort successfully', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();
            const memberIds = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];

            const mockCohort = { _id: cohortId, members: memberIds };
            const mockPopulate = jest.fn().mockResolvedValue(mockCohort);

            (User.find as jest.Mock).mockResolvedValue([{ _id: memberIds[0] }, { _id: memberIds[1] }]);
            (Cohort.findByIdAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate });

            const result = await cohortService.addMembers(cohortId, memberIds);

            expect(User.find).toHaveBeenCalledWith({ _id: { $in: memberIds } });
            expect(Cohort.findByIdAndUpdate).toHaveBeenCalledWith(
                cohortId,
                { $addToSet: { members: { $each: memberIds } } },
                { new: true }
            );
            expect(result).toEqual(mockCohort);
        });

        it('should throw error if members not found', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();
            const memberIds = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];

            (User.find as jest.Mock).mockResolvedValue([{ _id: memberIds[0] }]); // Only one found

            await expect(cohortService.addMembers(cohortId, memberIds)).rejects.toThrow(
                'One or more members not found'
            );
        });
    });

    describe('removeMembers', () => {
        it('should remove members from cohort successfully', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();
            const memberIds = [new mongoose.Types.ObjectId()];

            const mockCohort = { _id: cohortId, members: [] };
            const mockPopulate = jest.fn().mockResolvedValue(mockCohort);

            (Cohort.findByIdAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate });

            const result = await cohortService.removeMembers(cohortId, memberIds);

            expect(Cohort.findByIdAndUpdate).toHaveBeenCalledWith(
                cohortId,
                { $pull: { members: { $in: memberIds } } },
                { new: true }
            );
            expect(result).toEqual(mockCohort);
        });
    });

    describe('deleteCohort', () => {
        it('should delete cohort successfully', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();

            (Cohort.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: cohortId });

            const result = await cohortService.deleteCohort(cohortId);

            expect(Cohort.findByIdAndDelete).toHaveBeenCalledWith(cohortId);
            expect(result).toBe(true);
        });

        it('should return false if cohort not found', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();

            (Cohort.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

            const result = await cohortService.deleteCohort(cohortId);

            expect(result).toBe(false);
        });
    });

    describe('getUserCohorts', () => {
        it('should return active cohorts for user', async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const mockCohorts = [
                { name: 'CS 2024', status: 'active' },
                { name: 'IT 2024', status: 'active' }
            ];

            const mockSort = jest.fn().mockResolvedValue(mockCohorts);
            (Cohort.find as jest.Mock).mockReturnValue({ sort: mockSort });

            const result = await cohortService.getUserCohorts(userId);

            expect(Cohort.find).toHaveBeenCalledWith({
                members: userId,
                status: 'active'
            });
            expect(result).toEqual(mockCohorts);
        });
    });

    describe('bulkAddMembersByEmail', () => {
        it('should add members by email successfully', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();
            const emails = ['user1@srmap.edu.in', 'user2@srmap.edu.in', 'user3@srmap.edu.in'];

            const mockUsers = [
                { _id: new mongoose.Types.ObjectId(), email: 'user1@srmap.edu.in' },
                { _id: new mongoose.Types.ObjectId(), email: 'user2@srmap.edu.in' }
            ];

            const mockCohort = {
                _id: cohortId,
                members: [mockUsers[0]._id]
            };

            (Cohort.findById as jest.Mock).mockResolvedValue(mockCohort);
            (User.find as jest.Mock).mockResolvedValue(mockUsers);
            (Cohort.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockCohort);

            const result = await cohortService.bulkAddMembersByEmail(cohortId, emails);

            expect(result.added).toBe(1); // Only user2 is new
            expect(result.notFound).toEqual(['user3@srmap.edu.in']);
            expect(result.alreadyInCohort).toEqual(['user1@srmap.edu.in']);
        });

        it('should throw error if cohort not found', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();
            const emails = ['user1@srmap.edu.in'];

            (Cohort.findById as jest.Mock).mockResolvedValue(null);

            await expect(cohortService.bulkAddMembersByEmail(cohortId, emails)).rejects.toThrow(
                'Cohort not found'
            );
        });
    });

    describe('getCohortStats', () => {
        it('should return cohort statistics', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();

            const mockMembers = [
                { role: 'student' },
                { role: 'student' },
                { role: 'faculty' }
            ];

            const mockCohort = {
                _id: cohortId,
                members: mockMembers,
                status: 'active'
            };

            const mockPopulate = jest.fn().mockResolvedValue(mockCohort);
            (Cohort.findById as jest.Mock).mockReturnValue({ populate: mockPopulate });

            const result = await cohortService.getCohortStats(cohortId);

            expect(result.totalMembers).toBe(3);
            expect(result.membersByRole).toEqual({
                student: 2,
                faculty: 1
            });
            expect(result.status).toBe('active');
        });

        it('should throw error if cohort not found', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();

            const mockPopulate = jest.fn().mockResolvedValue(null);
            (Cohort.findById as jest.Mock).mockReturnValue({ populate: mockPopulate });

            await expect(cohortService.getCohortStats(cohortId)).rejects.toThrow(
                'Cohort not found'
            );
        });
    });
});
