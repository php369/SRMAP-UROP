/**
 * Get the appropriate dashboard route for a given user role
 * @param role - User role
 * @returns Dashboard route path
 */
export function getDashboardRouteForRole(role: 'student' | 'faculty' | 'coordinator' | 'admin'): string {
    const dashboardRoutes: Record<string, string> = {
        student: '/app/dashboard',
        faculty: '/app/faculty/dashboard',
        coordinator: '/app/coordinator/dashboard',
        admin: '/app/admin/dashboard'
    };

    return dashboardRoutes[role] || '/app/dashboard';
}

/**
 * Validate that a redirect URL matches the expected dashboard for a role
 * @param role - User role
 * @param redirectUrl - The redirect URL to validate
 * @returns true if the redirect URL is correct for the role
 */
export function validateRoleBasedRedirect(
    role: 'student' | 'faculty' | 'coordinator' | 'admin',
    redirectUrl: string
): boolean {
    const expectedRoute = getDashboardRouteForRole(role);
    return redirectUrl === expectedRoute || redirectUrl.startsWith(expectedRoute);
}

/**
 * Get all valid dashboard routes
 * @returns Array of valid dashboard routes
 */
export function getAllDashboardRoutes(): string[] {
    return [
        '/app/dashboard',
        '/app/faculty/dashboard',
        '/app/coordinator/dashboard',
        '/app/admin/dashboard'
    ];
}
