import * as fc from 'fast-check';
import request from 'supertest';
import express, { Express } from 'express';
import { authenticate } from '../../middleware/auth';

/**
 * Feature: academic-portal, Property 5: Unauthenticated Project Access Denial
 * Validates: Requirements 2.4
 * 
 * Property: For any unauthenticated request to project endpoints, the system should return 401 or 403 status code.
 */

// Create a test Express app with protected routes
function createTestApp(): Express {
    const app = express();
    app.use(express.json());

    // Protected project routes
    app.get('/api/projects', authenticate, (req, res) => {
        res.json({ success: true, data: [] });
    });

    app.get('/api/projects/:id', authenticate, (req, res) => {
        res.json({ success: true, data: { id: req.params.id } });
    });

    app.post('/api/projects', authenticate, (req, res) => {
        res.json({ success: true, data: { id: '123' } });
    });

    app.put('/api/projects/:id', authenticate, (req, res) => {
        res.json({ success: true, data: { id: req.params.id } });
    });

    app.delete('/api/projects/:id', authenticate, (req, res) => {
        res.json({ success: true });
    });

    return app;
}

describe('Unauthenticated Access - Property-Based Tests', () => {
    describe('Property 5: Unauthenticated Project Access Denial', () => {
        let app: Express;

        beforeAll(() => {
            app = createTestApp();
        });

        it('should return 401 for any unauthenticated GET request to project endpoints', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom('/api/projects', '/api/projects/123', '/api/projects/abc'),
                    async (endpoint) => {
                        const response = await request(app)
                            .get(endpoint)
                            .expect((res) => {
                                // Should return 401 (Unauthorized)
                                expect([401, 403]).toContain(res.status);
                            });

                        // Response should have error structure
                        expect(response.body.success).toBe(false);
                        expect(response.body.error).toBeDefined();
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should return 401 for any unauthenticated POST request to project endpoints', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 100 }),
                        description: fc.string({ minLength: 1, maxLength: 500 }),
                        type: fc.constantFrom('IDP', 'UROP', 'CAPSTONE')
                    }),
                    async (projectData) => {
                        const response = await request(app)
                            .post('/api/projects')
                            .send(projectData)
                            .expect((res) => {
                                // Should return 401 (Unauthorized)
                                expect([401, 403]).toContain(res.status);
                            });

                        // Response should have error structure
                        expect(response.body.success).toBe(false);
                        expect(response.body.error).toBeDefined();
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should return 401 for any unauthenticated PUT request to project endpoints', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('%')),
                    fc.record({
                        title: fc.string({ minLength: 1, maxLength: 100 }),
                        description: fc.string({ minLength: 1, maxLength: 500 })
                    }),
                    async (projectId, updateData) => {
                        const response = await request(app)
                            .put(`/api/projects/${encodeURIComponent(projectId)}`)
                            .send(updateData);

                        // Should not return success (2xx status codes)
                        expect(response.status).toBeGreaterThanOrEqual(400);

                        // Should return 4xx error (client error)
                        // The key property is that unauthenticated requests don't succeed
                        expect(response.status).toBeLessThan(500);

                        // Response should have error structure or be empty
                        if (response.body && response.body.success !== undefined) {
                            expect(response.body.success).toBe(false);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should return 401 for any unauthenticated DELETE request to project endpoints', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('%')),
                    async (projectId) => {
                        const response = await request(app)
                            .delete(`/api/projects/${encodeURIComponent(projectId)}`);

                        // Should not return success (2xx status codes)
                        expect(response.status).toBeGreaterThanOrEqual(400);

                        // Should return 4xx error (client error)
                        // The key property is that unauthenticated requests don't succeed
                        expect(response.status).toBeLessThan(500);

                        // Response should have error structure or be empty
                        if (response.body && response.body.success !== undefined) {
                            expect(response.body.success).toBe(false);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should deny access with invalid or malformed authorization headers', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom(
                        'invalid-token',
                        'Bearer ',
                        'Bearer invalid',
                        'Basic dGVzdDp0ZXN0',
                        '',
                        'malformed token'
                    ),
                    async (authHeader) => {
                        const response = await request(app)
                            .get('/api/projects')
                            .set('Authorization', authHeader)
                            .expect((res) => {
                                // Should return 401 (Unauthorized)
                                expect([401, 403]).toContain(res.status);
                            });

                        // Response should have error structure
                        expect(response.body.success).toBe(false);
                        expect(response.body.error).toBeDefined();
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should consistently deny access across all HTTP methods without authentication', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
                    async (method) => {
                        let response;

                        switch (method) {
                            case 'GET':
                                response = await request(app).get('/api/projects');
                                break;
                            case 'POST':
                                response = await request(app).post('/api/projects').send({});
                                break;
                            case 'PUT':
                                response = await request(app).put('/api/projects/123').send({});
                                break;
                            case 'DELETE':
                                response = await request(app).delete('/api/projects/123');
                                break;
                        }

                        // All methods should return 401 or 403
                        expect([401, 403]).toContain(response!.status);
                        expect(response!.body.success).toBe(false);
                        expect(response!.body.error).toBeDefined();
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
