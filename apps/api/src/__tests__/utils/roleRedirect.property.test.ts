import * as fc from 'fast-check';
import { getDashboardRouteForRole, validateRoleBasedRedirect, getAllDashboardRoutes } from '../../utils/roleRedirect';

/**
 * Feature: academic-portal, Property 4: Role-Based Dashboard Redirect
 * Validates: Requirements 1.7
 * 
 * Property: For any authenticated user, the redirect URL after login should match
 * their role's designated dashboard route.
 */
describe('Role Redirect - Property-Based Tests', () => {
    describe('Property 4: Role-Based Dashboard Redirect', () => {
        it('should return correct dashboard route for any valid role', async () => {
            await fc.assert(
                fc.property(
                    fc.constantFrom('student', 'faculty', 'coordinator', 'admin'),
                    (role) => {
                        const dashboardRoute = getDashboardRouteForRole(role as any);

                        // Verify the route is a valid dashboard route
                        const allRoutes = getAllDashboardRoutes();
                        expect(allRoutes).toContain(dashboardRoute);

                        // Verify the route starts with /app/
                        expect(dashboardRoute).toMatch(/^\/app\//);

                        // Verify the route contains 'dashboard'
                        expect(dashboardRoute).toContain('dashboard');
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should map each role to a unique dashboard route', async () => {
            await fc.assert(
                fc.property(
                    fc.constantFrom('student', 'faculty', 'coordinator', 'admin'),
                    fc.constantFrom('student', 'faculty', 'coordinator', 'admin'),
                    (role1, role2) => {
                        const route1 = getDashboardRouteForRole(role1 as any);
                        const route2 = getDashboardRouteForRole(role2 as any);

                        // If roles are different, routes should be different
                        if (role1 !== role2) {
                            expect(route1).not.toBe(route2);
                        } else {
                            // If roles are same, routes should be same
                            expect(route1).toBe(route2);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should validate correct role-based redirects', async () => {
            await fc.assert(
                fc.property(
                    fc.constantFrom('student', 'faculty', 'coordinator', 'admin'),
                    (role) => {
                        const correctRoute = getDashboardRouteForRole(role as any);

                        // Validation should pass for correct route
                        const isValid = validateRoleBasedRedirect(role as any, correctRoute);
                        expect(isValid).toBe(true);

                        // Validation should also pass for routes that start with correct route
                        const subRoute = `${correctRoute}/sub-page`;
                        const isValidSub = validateRoleBasedRedirect(role as any, subRoute);
                        expect(isValidSub).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should reject incorrect role-based redirects', async () => {
            await fc.assert(
                fc.property(
                    fc.constantFrom('student', 'faculty', 'coordinator', 'admin'),
                    fc.constantFrom('student', 'faculty', 'coordinator', 'admin'),
                    (userRole, wrongRole) => {
                        // Skip if roles are the same
                        if (userRole === wrongRole) {
                            return true;
                        }

                        const wrongRoute = getDashboardRouteForRole(wrongRole as any);

                        // Validation should fail for wrong role's route
                        const isValid = validateRoleBasedRedirect(userRole as any, wrongRoute);
                        expect(isValid).toBe(false);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should handle role-specific dashboard routes correctly', async () => {
            const testCases = [
                { role: 'student' as const, expectedRoute: '/app/dashboard' },
                { role: 'faculty' as const, expectedRoute: '/app/faculty/dashboard' },
                { role: 'coordinator' as const, expectedRoute: '/app/coordinator/dashboard' },
                { role: 'admin' as const, expectedRoute: '/app/admin/dashboard' }
            ];

            testCases.forEach(({ role, expectedRoute }) => {
                const actualRoute = getDashboardRouteForRole(role);
                expect(actualRoute).toBe(expectedRoute);

                const isValid = validateRoleBasedRedirect(role, actualRoute);
                expect(isValid).toBe(true);
            });
        });

        it('should return consistent routes for the same role across multiple calls', async () => {
            await fc.assert(
                fc.property(
                    fc.constantFrom('student', 'faculty', 'coordinator', 'admin'),
                    fc.integer({ min: 2, max: 10 }),
                    (role, callCount) => {
                        // Call the function multiple times
                        const routes = Array.from({ length: callCount }, () =>
                            getDashboardRouteForRole(role as any)
                        );

                        // All routes should be identical
                        const uniqueRoutes = new Set(routes);
                        expect(uniqueRoutes.size).toBe(1);

                        // All routes should match the first one
                        routes.forEach(route => {
                            expect(route).toBe(routes[0]);
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
