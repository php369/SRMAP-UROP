/**
 * API Response Validation
 * Validates API responses against schemas for type safety at runtime
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

export const userSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['student', 'faculty', 'coordinator', 'admin']),
  avatar: z.string().optional().nullable(),
  googleId: z.string().optional(),
  profile: z.object({
    department: z.string().optional(),
    year: z.number().optional(),
    semester: z.number().optional(),
    specialization: z.string().optional(),
  }).optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark']).optional(),
    notifications: z.boolean().optional(),
  }).optional(),
  lastSeen: z.string().or(z.date()).optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export const projectSchema = z.object({
  _id: z.string(),
  projectId: z.string(),
  title: z.string(),
  brief: z.string(),
  description: z.string().optional(),
  type: z.enum(['IDP', 'UROP', 'CAPSTONE']),
  department: z.string(),
  prerequisites: z.string().optional(),
  facultyId: z.string(),
  facultyName: z.string(),
  facultyIdNumber: z.string(),
  capacity: z.number().optional(),
  status: z.enum(['draft', 'published', 'frozen', 'assigned']),
  assignedTo: z.string().optional().nullable(),
  isFrozen: z.boolean().optional(),
  semester: z.string(),
  year: z.number(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export const assessmentSchema = z.object({
  _id: z.string(),
  title: z.string(),
  description: z.string(),
  courseId: z.string(),
  facultyId: z.string(),
  dueAt: z.string().or(z.date()),
  meetUrl: z.string().url().optional().nullable(),
  calendarEventId: z.string().optional().nullable(),
  visibility: z.object({
    cohortIds: z.array(z.string()).optional(),
    courseIds: z.array(z.string()).optional(),
  }).optional(),
  settings: z.object({
    allowLateSubmissions: z.boolean().optional(),
    maxFileSize: z.number().optional(),
    allowedFileTypes: z.array(z.string()).optional(),
  }).optional(),
  status: z.enum(['draft', 'published', 'closed']),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export const submissionSchema = z.object({
  _id: z.string(),
  submissionId: z.string().optional(),
  assessmentId: z.string(),
  studentId: z.string().optional(),
  groupId: z.string().optional(),
  files: z.array(z.object({
    filename: z.string(),
    url: z.string().url(),
    size: z.number(),
    contentType: z.string(),
  })),
  notes: z.string().optional(),
  submittedAt: z.string().or(z.date()),
  status: z.enum(['submitted', 'graded', 'returned']),
  facultyGrade: z.number().optional().nullable(),
  externalGrade: z.number().optional().nullable(),
  isGraded: z.boolean().optional(),
  isGradeReleased: z.boolean().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export const groupSchema = z.object({
  _id: z.string(),
  groupCode: z.string(),
  leaderId: z.string(),
  members: z.array(z.string()),
  projectType: z.enum(['IDP', 'UROP', 'CAPSTONE']),
  projectId: z.string().optional().nullable(),
  semester: z.string(),
  year: z.number(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

// ============================================================================
// Response Wrappers
// ============================================================================

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
      timestamp: z.string().optional(),
    }).optional(),
  });

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.object({
      items: z.array(itemSchema),
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
    }).optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
    }).optional(),
  });

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate API response against schema
 * @throws {Error} If validation fails
 */
export function validateResponse<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('API response validation failed:', {
        errors: error.errors,
        data,
      });
      throw new Error(`Invalid API response format: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Validate array response
 */
export function validateArrayResponse<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): T[] {
  if (!Array.isArray(data)) {
    throw new Error('Expected array response');
  }
  return data.map((item, index) => {
    try {
      return validateResponse(item, schema);
    } catch (error) {
      console.error(`Validation failed for item at index ${index}:`, item);
      throw error;
    }
  });
}

/**
 * Validate response with optional validation (returns null on error)
 */
export function validateResponseSafe<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): T | null {
  try {
    return validateResponse(data, schema);
  } catch (error) {
    console.warn('API response validation failed (safe mode):', error);
    return null;
  }
}

/**
 * Validate partial response (allows missing fields)
 */
export function validatePartialResponse<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): Partial<T> {
  const partialSchema = schema.partial();
  return validateResponse(data, partialSchema);
}

// ============================================================================
// Type Exports
// ============================================================================

export type User = z.infer<typeof userSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type Submission = z.infer<typeof submissionSchema>;
export type Group = z.infer<typeof groupSchema>;

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example 1: Validate single user response
 * 
 * const response = await api.get('/auth/me');
 * const user = validateResponse(response.data, userSchema);
 */

/**
 * Example 2: Validate array of projects
 * 
 * const response = await api.get('/projects');
 * const projects = validateArrayResponse(response.data, projectSchema);
 */

/**
 * Example 3: Safe validation (returns null on error)
 * 
 * const response = await api.get('/user/profile');
 * const user = validateResponseSafe(response.data, userSchema);
 * if (user) {
 *   // Use validated user
 * }
 */

/**
 * Example 4: Validate API response wrapper
 * 
 * const responseSchema = apiResponseSchema(userSchema);
 * const response = await api.get('/auth/me');
 * const validated = validateResponse(response, responseSchema);
 * if (validated.success && validated.data) {
 *   // Use validated.data
 * }
 */
