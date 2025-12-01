/**
 * Cursor-Based Pagination
 * More efficient than offset-based pagination for large datasets
 */

import mongoose from 'mongoose';
import { logger } from './logger';

export interface CursorPaginationOptions {
  limit?: number;
  cursor?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
  hasPrevious: boolean;
  total?: number;
}

export interface DecodedCursor {
  value: any;
  id: string;
}

/**
 * Encode cursor from value and ID
 */
export function encodeCursor(value: any, id: string): string {
  const cursor = {
    value,
    id,
  };
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

/**
 * Decode cursor to value and ID
 */
export function decodeCursor(cursor: string): DecodedCursor {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error('Invalid cursor format');
  }
}

/**
 * Paginate query results using cursor-based pagination
 * @param model - Mongoose model
 * @param query - Base query filter
 * @param options - Pagination options
 * @returns Paginated results with cursors
 */
export async function cursorPaginate<T>(
  model: mongoose.Model<any>,
  query: any = {},
  options: CursorPaginationOptions = {}
): Promise<CursorPaginationResult<T>> {
  const {
    limit = 20,
    cursor,
    sortField = 'createdAt',
    sortOrder = 'desc',
  } = options;

  // Validate limit
  const validLimit = Math.min(Math.max(1, limit), 100); // Between 1 and 100

  // Build query with cursor
  const paginatedQuery = { ...query };
  
  if (cursor) {
    try {
      const decodedCursor = decodeCursor(cursor);
      const { value, id } = decodedCursor;

      // Add cursor condition
      if (sortOrder === 'desc') {
        paginatedQuery.$or = [
          { [sortField]: { $lt: value } },
          { [sortField]: value, _id: { $lt: new mongoose.Types.ObjectId(id) } },
        ];
      } else {
        paginatedQuery.$or = [
          { [sortField]: { $gt: value } },
          { [sortField]: value, _id: { $gt: new mongoose.Types.ObjectId(id) } },
        ];
      }
    } catch (error) {
      logger.error('Invalid cursor:', error);
      throw new Error('Invalid cursor');
    }
  }

  // Fetch one extra to check if there are more results
  const sortDirection = sortOrder === 'desc' ? -1 : 1;
  const data = await model
    .find(paginatedQuery)
    .sort({ [sortField]: sortDirection, _id: sortDirection })
    .limit(validLimit + 1)
    .lean();

  // Check if there are more results
  const hasMore = data.length > validLimit;
  if (hasMore) {
    data.pop(); // Remove extra item
  }

  // Generate next cursor
  let nextCursor: string | null = null;
  if (hasMore && data.length > 0) {
    const lastItem = data[data.length - 1];
    nextCursor = encodeCursor(lastItem[sortField], lastItem._id.toString());
  }

  // For previous cursor, we'd need to query in reverse
  // This is a simplified implementation
  const prevCursor: string | null = cursor || null;
  const hasPrevious = !!cursor;

  return {
    data: data as T[],
    nextCursor,
    prevCursor,
    hasMore,
    hasPrevious,
  };
}

/**
 * Paginate with total count (slower but provides total)
 */
export async function cursorPaginateWithCount<T>(
  model: mongoose.Model<any>,
  query: any = {},
  options: CursorPaginationOptions = {}
): Promise<CursorPaginationResult<T>> {
  const result = await cursorPaginate<T>(model, query, options);
  
  // Get total count (expensive operation)
  const total = await model.countDocuments(query);

  return {
    ...result,
    total,
  };
}

/**
 * Paginate with search
 */
export async function cursorPaginateWithSearch<T>(
  model: mongoose.Model<any>,
  searchFields: string[],
  searchTerm: string,
  query: any = {},
  options: CursorPaginationOptions = {}
): Promise<CursorPaginationResult<T>> {
  // Build search query
  const searchQuery = searchTerm
    ? {
        $or: searchFields.map(field => ({
          [field]: { $regex: searchTerm, $options: 'i' },
        })),
      }
    : {};

  // Combine with base query
  const combinedQuery = {
    ...query,
    ...searchQuery,
  };

  return cursorPaginate<T>(model, combinedQuery, options);
}

/**
 * Paginate with filters
 */
export async function cursorPaginateWithFilters<T>(
  model: mongoose.Model<any>,
  filters: Record<string, any>,
  options: CursorPaginationOptions = {}
): Promise<CursorPaginationResult<T>> {
  // Build filter query
  const filterQuery: any = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        filterQuery[key] = { $in: value };
      } else {
        filterQuery[key] = value;
      }
    }
  });

  return cursorPaginate<T>(model, filterQuery, options);
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  result: CursorPaginationResult<any>,
  limit: number
): {
  hasMore: boolean;
  hasPrevious: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
  limit: number;
  count: number;
  total?: number;
} {
  return {
    hasMore: result.hasMore,
    hasPrevious: result.hasPrevious,
    nextCursor: result.nextCursor,
    prevCursor: result.prevCursor,
    limit,
    count: result.data.length,
    total: result.total,
  };
}

/**
 * Express middleware for cursor pagination
 */
export function cursorPaginationMiddleware(req: any, res: any, next: any) {
  // Parse pagination parameters from query
  const cursor = req.query.cursor as string | undefined;
  const limit = parseInt(req.query.limit as string) || 20;
  const sortField = (req.query.sortField as string) || 'createdAt';
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

  // Attach to request
  req.pagination = {
    cursor,
    limit: Math.min(Math.max(1, limit), 100), // Between 1 and 100
    sortField,
    sortOrder,
  };

  next();
}

/**
 * Usage Examples:
 * 
 * // Example 1: Basic cursor pagination
 * router.get('/projects', async (req, res) => {
 *   const { cursor, limit } = req.query;
 *   
 *   const result = await cursorPaginate(
 *     Project,
 *     { status: 'published' },
 *     { cursor, limit: parseInt(limit) || 20 }
 *   );
 *   
 *   res.json({
 *     success: true,
 *     data: result.data,
 *     pagination: {
 *       nextCursor: result.nextCursor,
 *       hasMore: result.hasMore,
 *     },
 *   });
 * });
 * 
 * // Example 2: With search
 * const result = await cursorPaginateWithSearch(
 *   Project,
 *   ['title', 'description'], // Search fields
 *   'AI chatbot', // Search term
 *   { status: 'published' }, // Base query
 *   { cursor, limit: 20 }
 * );
 * 
 * // Example 3: With filters
 * const result = await cursorPaginateWithFilters(
 *   Project,
 *   {
 *     type: 'UROP',
 *     department: 'Computer Science',
 *     status: 'published',
 *   },
 *   { cursor, limit: 20 }
 * );
 * 
 * // Example 4: With middleware
 * router.get('/projects',
 *   cursorPaginationMiddleware,
 *   async (req, res) => {
 *     const result = await cursorPaginate(
 *       Project,
 *       {},
 *       req.pagination
 *     );
 *     res.json({ success: true, ...result });
 *   }
 * );
 * 
 * // Frontend usage:
 * const [cursor, setCursor] = useState(null);
 * const [projects, setProjects] = useState([]);
 * 
 * const loadMore = async () => {
 *   const response = await api.get('/projects', {
 *     cursor,
 *     limit: 20,
 *   });
 *   setProjects([...projects, ...response.data]);
 *   setCursor(response.pagination.nextCursor);
 * };
 */
