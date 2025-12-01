/**
 * Get the appropriate dashboard route for a given user role
 * @param role - User role
 * @returns Dashboard route path
 */
export function getDashboardRouteForRole(role: 'student' | 'faculty' | 'coordinator' | 'admin'): string {
    const dashboardRoutes: Record<string, string> = {
        student: '/dashboard',
        faculty: '/dashboard/faculty',
        coordinator: '/dashboard/coordinator',
        admin: '/dashboard/admin'
    };

    return dashboardRoutes[role] || '/dashboard';
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
        '/dashboard',
        '/dashboard/faculty',
        '/dashboard/coordinator',
        '/dashboard/admin'
    ];
}
