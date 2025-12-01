/**
 * JSDoc Comment Templates
 * Standard templates for documenting code
 * 
 * Use these templates to maintain consistent documentation across the codebase
 */

/**
 * TEMPLATE: Service Method
 * 
 * @example
 * ```typescript
 * /**
 *  * Create a new project
 *  * 
 *  * @param data - Project creation data
 *  * @param data.title - Project title (max 200 characters)
 *  * @param data.brief - Brief description (max 500 characters)
 *  * @param data.type - Project type (IDP, UROP, or CAPSTONE)
 *  * @param data.department - Department name
 *  * @returns Promise resolving to created project
 *  * @throws {ValidationError} If data validation fails
 *  * @throws {AuthorizationError} If user is not faculty
 *  * @throws {DatabaseError} If database operation fails
 *  * 
 *  * @example
 *  * ```typescript
 *  * const project = await ProjectService.createProject({
 *  *   title: 'AI Chatbot',
 *  *   brief: 'Build an AI-powered chatbot using NLP',
 *  *   type: 'UROP',
 *  *   department: 'Computer Science',
 *  * });
 *  * ```
 *  *\/
 * static async createProject(data: CreateProjectData): Promise<IProject> {
 *   // Implementation
 * }
 * ```
 */

/**
 * TEMPLATE: Route Handler
 * 
 * @example
 * ```typescript
 * /**
 *  * @swagger
 *  * /api/v1/projects:
 *  *   post:
 *  *     summary: Create a new project
 *  *     description: Creates a new project for the authenticated faculty member
 *  *     tags: [Projects]
 *  *     security:
 *  *       - bearerAuth: []
 *  *     requestBody:
 *  *       required: true
 *  *       content:
 *  *         application/json:
 *  *           schema:
 *  *             $ref: '#/components/schemas/CreateProjectRequest'
 *  *     responses:
 *  *       201:
 *  *         description: Project created successfully
 *  *       400:
 *  *         description: Validation error
 *  *       401:
 *  *         description: Unauthorized
 *  *       403:
 *  *         description: Forbidden (not faculty)
 *  *\/
 * router.post('/projects', authenticate, authorize('faculty'), createProject);
 * ```
 */

/**
 * TEMPLATE: Utility Function
 * 
 * @example
 * ```typescript
 * /**
 *  * Sanitize HTML content to prevent XSS attacks
 *  * 
 *  * @param dirty - Unsanitized HTML string
 *  * @returns Sanitized HTML string with only safe tags
 *  * 
 *  * @example
 *  * ```typescript
 *  * const safe = sanitizeHtml('<script>alert("XSS")</script><b>Safe</b>');
 *  * // Returns: '<b>Safe</b>'
 *  * ```
 *  * 
 *  * @remarks
 *  * Only allows safe HTML tags: b, i, em, strong, a, p, br
 *  * Removes all event handlers and javascript: protocols
 *  *\/
 * export function sanitizeHtml(dirty: string): string {
 *   // Implementation
 * }
 * ```
 */

/**
 * TEMPLATE: Class
 * 
 * @example
 * ```typescript
 * /**
 *  * Query Cache Service
 *  * 
 *  * Provides caching for database query results to reduce load
 *  * and improve response times.
 *  * 
 *  * @example
 *  * ```typescript
 *  * const cache = new QueryCache();
 *  * 
 *  * // Cache a query
 *  * const result = await cache.wrap(
 *  *   'projects:all',
 *  *   () => Project.find(),
 *  *   300 // 5 minutes
 *  * );
 *  * 
 *  * // Invalidate cache
 *  * cache.invalidatePattern('projects:');
 *  * ```
 *  * 
 *  * @remarks
 *  * - Default TTL is 5 minutes
 *  * - Maximum 1000 keys stored
 *  * - Automatic cleanup of expired keys
 *  *\/
 * export class QueryCache {
 *   // Implementation
 * }
 * ```
 */

/**
 * TEMPLATE: Interface/Type
 * 
 * @example
 * ```typescript
 * /**
 *  * Project creation data
 *  * 
 *  * @property title - Project title (1-200 characters)
 *  * @property brief - Brief description (10-500 characters)
 *  * @property type - Project type
 *  * @property department - Department name
 *  * @property prerequisites - Optional prerequisites
 *  * @property capacity - Number of students (1-10, default: 1)
 *  *\/
 * export interface CreateProjectData {
 *   title: string;
 *   brief: string;
 *   type: 'IDP' | 'UROP' | 'CAPSTONE';
 *   department: string;
 *   prerequisites?: string;
 *   capacity?: number;
 * }
 * ```
 */

/**
 * TEMPLATE: Middleware
 * 
 * @example
 * ```typescript
 * /**
 *  * Authentication middleware
 *  * 
 *  * Verifies JWT token and attaches user to request object.
 *  * 
 *  * @param req - Express request object
 *  * @param res - Express response object
 *  * @param next - Express next function
 *  * 
 *  * @throws {401} If token is missing or invalid
 *  * @throws {401} If token is expired
 *  * @throws {401} If user not found
 *  * 
 *  * @example
 *  * ```typescript
 *  * router.get('/protected', authenticate, (req, res) => {
 *  *   // req.user is available here
 *  *   res.json({ user: req.user });
 *  * });
 *  * ```
 *  * 
 *  * @remarks
 *  * Adds `user` object to request with: id, email, name, role
 *  *\/
 * export const authenticate = async (
 *   req: Request,
 *   res: Response,
 *   next: NextFunction
 * ): Promise<void> => {
 *   // Implementation
 * };
 * ```
 */

/**
 * TEMPLATE: Async Function with Error Handling
 * 
 * @example
 * ```typescript
 * /**
 *  * Fetch user by email
 *  * 
 *  * @param email - User email address
 *  * @returns User object if found, null otherwise
 *  * @throws {ValidationError} If email format is invalid
 *  * @throws {DatabaseError} If database query fails
 *  * 
 *  * @example
 *  * ```typescript
 *  * try {
 *  *   const user = await getUserByEmail('john@srmap.edu.in');
 *  *   if (user) {
 *  *     console.log('User found:', user.name);
 *  *   }
 *  * } catch (error) {
 *  *   console.error('Failed to fetch user:', error);
 *  * }
 *  * ```
 *  *\/
 * export async function getUserByEmail(email: string): Promise<IUser | null> {
 *   // Implementation
 * }
 * ```
 */

/**
 * Best Practices for JSDoc:
 * 
 * 1. Always include a brief description
 * 2. Document all parameters with @param
 * 3. Document return value with @returns
 * 4. Document thrown errors with @throws
 * 5. Include usage examples with @example
 * 6. Add remarks for important notes with @remarks
 * 7. Use @deprecated for deprecated functions
 * 8. Link to related functions with @see
 * 9. Document async functions clearly
 * 10. Keep descriptions concise but informative
 */

export const JSDocBestPractices = {
  DO: [
    'Write clear, concise descriptions',
    'Document all parameters and return values',
    'Include practical examples',
    'Document error conditions',
    'Use proper TypeScript types',
    'Keep examples up to date',
    'Document side effects',
    'Explain complex logic',
  ],
  DONT: [
    "Don't state the obvious",
    "Don't duplicate type information",
    "Don't write novels",
    "Don't forget to update when code changes",
    "Don't use vague descriptions",
    "Don't skip error documentation",
  ],
};

/**
 * Quick Reference:
 * 
 * @param {Type} name - Description
 * @returns {Type} Description
 * @throws {ErrorType} Description
 * @example Code example
 * @remarks Additional notes
 * @see RelatedFunction
 * @deprecated Use newFunction instead
 * @since Version 1.2.0
 * @async For async functions
 * @private For private methods
 * @public For public methods
 * @readonly For readonly properties
 */
