import request from 'supertest';
import express, { Express } from 'express';
import mongoose from 'mongoose';

// Mock dependencies BEFORE importing routes
jest.mock('../../services/cohortService');
jest.mock('../../middleware/auth', () => ({
    authenticate: jest.fn((req: any, res: any, next: any) => {
        req.user = {
            userId: new mongoose.Types.ObjectId().toString(),
            role: 'admin',
            email: 'admin@srmap.edu.in'
        };
        next();
    })
}));
jest.mock('../../middleware/rbac', () => ({
    rbacGuard: jest.fn(() => (req: any, res: any, next: any) => next()),
    adminGuard: jest.fn(() => (req: any, res: any, next: any) => next())
}));

import cohortRoutes from '../../routes/cohorts';
import { cohortService } from '../../services/cohortService';
import { authenticate } from '../../middleware/auth';
import { rbacGuard, adminGuard } from '../../middleware/rbac';

describe('Cohort Routes', () => {
    let app: Express;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/api/cohorts', cohortRoutes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/cohorts', () => {
        it('should create a new cohort', async () => {
            const cohortData = {
                name: 'CS 2024 Batch',
                year: 2024,
                department: 'Computer Science'
            };

            const mockCohort = {
                _id: new mongoose.Types.ObjectId(),
                ...cohortData,
                members: [],
                status: 'active'
            };

            (cohortService.createCohort as jest.Mock).mockResolvedValue(mockCohort);

            const response = await request(app)
                .post('/api/cohorts')
                .send(cohortData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject(cohortData);
            expect(cohortService.createCohort).toHaveBeenCalledWith(cohortData);
        });

        it('should return 400 if required fields are missing', async () => {
            const response = await request(app)
                .post('/api/cohorts')
                .send({ name: 'CS 2024' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should return 400 if cohort creation fails', async () => {
            const cohortData = {
                name: 'CS 2024 Batch',
                year: 2024,
                department: 'Computer Science'
            };

            (cohortService.createCohort as jest.Mock).mockRejectedValue(
                new Error('Cohort with this name already exists')
            );

            const response = await request(app)
                .post('/api/cohorts')
                .send(cohortData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('COHORT_CREATION_FAILED');
        });
    });

    describe('GET /api/cohorts', () => {
        it('should return all cohorts', async () => {
            const mockCohorts = [
                { name: 'CS 2024', year: 2024, department: 'Computer Science' },
                { name: 'IT 2024', year: 2024, department: 'Information Technology' }
            ];

            (cohortService.getCohorts as jest.Mock).mockResolvedValue(mockCohorts);

            const response = await request(app)
                .get('/api/cohorts')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockCohorts);
            expect(cohortService.getCohorts).toHaveBeenCalledWith({});
        });

        it('should filter cohorts by query parameters', async () => {
            const mockCohorts = [
                { name: 'CS 2024', year: 2024, department: 'Computer Science', status: 'active' }
            ];

            (cohortService.getCohorts as jest.Mock).mockResolvedValue(mockCohorts);

            const response = await request(app)
                .get('/api/cohorts?year=2024&department=Computer Science&status=active')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(cohortService.getCohorts).toHaveBeenCalledWith({
                year: 2024,
                department: 'Computer Science',
                status: 'active'
            });
        });
    });

    describe('GET /api/cohorts/:id', () => {
        it('should return cohort by ID', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();
            const mockCohort = {
                _id: cohortId,
                name: 'CS 2024',
                year: 2024,
                department: 'Computer Science'
            };

            (cohortService.getCohortById as jest.Mock).mockResolvedValue(mockCohort);

            const response = await request(app)
                .get(`/api/cohorts/${cohortId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockCohort);
        });

        it('should return 404 if cohort not found', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();

            (cohortService.getCohortById as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .get(`/api/cohorts/${cohortId}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('COHORT_NOT_FOUND');
        });
    });

    describe('PUT /api/cohorts/:id', () => {
        it('should update cohort successfully', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();
            const updates = { name: 'Updated Name' };

            const mockCohort = {
                _id: cohortId,
                ...updates,
                year: 2024,
                department: 'Computer Science'
            };

            (cohortService.updateCohort as jest.Mock).mockResolvedValue(mockCohort);

            const response = await request(app)
                .put(`/api/cohorts/${cohortId}`)
                .send(updates)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Name');
        });

        it('should return 404 if cohort not found', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();

            (cohortService.updateCohort as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .put(`/api/cohorts/${cohortId}`)
                .send({ name: 'Updated Name' })
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('COHORT_NOT_FOUND');
        });
    });

    describe('DELETE /api/cohorts/:id', () => {
        it('should delete cohort successfully', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();

            (cohortService.deleteCohort as jest.Mock).mockResolvedValue(true);

            const response = await request(app)
                .delete(`/api/cohorts/${cohortId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Cohort deleted successfully');
        });

        it('should return 404 if cohort not found', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();

            (cohortService.deleteCohort as jest.Mock).mockResolvedValue(false);

            const response = await request(app)
                .delete(`/api/cohorts/${cohortId}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('COHORT_NOT_FOUND');
        });
    });

    describe('POST /api/cohorts/:id/members', () => {
        it('should add members to cohort', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();
            const memberIds = [
                new mongoose.Types.ObjectId().toString(),
                new mongoose.Types.ObjectId().toString()
            ];

            const mockCohort = {
                _id: cohortId,
                members: memberIds
            };

            (cohortService.addMembers as jest.Mock).mockResolvedValue(mockCohort);

            const response = await request(app)
                .post(`/api/cohorts/${cohortId}/members`)
                .send({ memberIds })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.members).toEqual(memberIds);
        });

        it('should return 400 if memberIds is missing', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();

            const response = await request(app)
                .post(`/api/cohorts/${cohortId}/members`)
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('DELETE /api/cohorts/:id/members', () => {
        it('should remove members from cohort', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();
            const memberIds = [new mongoose.Types.ObjectId().toString()];

            const mockCohort = {
                _id: cohortId,
                members: []
            };

            (cohortService.removeMembers as jest.Mock).mockResolvedValue(mockCohort);

            const response = await request(app)
                .delete(`/api/cohorts/${cohortId}/members`)
                .send({ memberIds })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.members).toEqual([]);
        });
    });

    describe('POST /api/cohorts/:id/members/bulk', () => {
        it('should bulk add members by email', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();
            const emails = ['user1@srmap.edu.in', 'user2@srmap.edu.in'];

            const mockResult = {
                added: 2,
                notFound: [],
                alreadyInCohort: []
            };

            (cohortService.bulkAddMembersByEmail as jest.Mock).mockResolvedValue(mockResult);

            const response = await request(app)
                .post(`/api/cohorts/${cohortId}/members/bulk`)
                .send({ emails })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.added).toBe(2);
        });

        it('should return 400 if emails array is missing', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();

            const response = await request(app)
                .post(`/api/cohorts/${cohortId}/members/bulk`)
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('GET /api/cohorts/:id/stats', () => {
        it('should return cohort statistics', async () => {
            const cohortId = new mongoose.Types.ObjectId().toString();

            const mockStats = {
                totalMembers: 50,
                membersByRole: {
                    student: 45,
                    faculty: 5
                },
                status: 'active'
            };

            (cohortService.getCohortStats as jest.Mock).mockResolvedValue(mockStats);

            const response = await request(app)
                .get(`/api/cohorts/${cohortId}/stats`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockStats);
        });
    });

    describe('GET /api/cohorts/user/:userId', () => {
        it('should return cohorts for a user', async () => {
            const userId = new mongoose.Types.ObjectId().toString();

            const mockCohorts = [
                { name: 'CS 2024', status: 'active' }
            ];

            (cohortService.getUserCohorts as jest.Mock).mockResolvedValue(mockCohorts);

            const response = await request(app)
                .get(`/api/cohorts/user/${userId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockCohorts);
        });
    });
});
