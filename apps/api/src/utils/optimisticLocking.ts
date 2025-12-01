/**
 * Optimistic Locking Utilities
 * Prevents concurrent update conflicts using version numbers
 */

import mongoose from 'mongoose';
import { logger } from './logger';

export class OptimisticLockError extends Error {
  constructor(message: string = 'Document was modified by another user. Please refresh and try again.') {
    super(message);
    this.name = 'OptimisticLockError';
  }
}

/**
 * Update document with optimistic locking
 * @param model - Mongoose model
 * @param id - Document ID
 * @param version - Current version number
 * @param update - Update data
 * @returns Updated document
 * @throws OptimisticLockError if version mismatch
 */
export async function updateWithLock<T extends mongoose.Document>(
  model: mongoose.Model<T>,
  id: string | mongoose.Types.ObjectId,
  version: number,
  update: any
): Promise<T> {
  const doc = await model.findOneAndUpdate(
    { _id: id, __v: version }, // Match both ID and version
    { $set: update, $inc: { __v: 1 } }, // Update and increment version
    { new: true, runValidators: true }
  );

  if (!doc) {
    logger.warn('Optimistic lock conflict', { id, version });
    throw new OptimisticLockError();
  }

  logger.debug('Document updated with optimistic lock', { id, oldVersion: version, newVersion: version + 1 });
  return doc;
}

/**
 * Update document with retry on lock conflict
 * @param model - Mongoose model
 * @param id - Document ID
 * @param updateFn - Function that returns update data based on current document
 * @param maxRetries - Maximum number of retries
 * @returns Updated document
 */
export async function updateWithRetry<T extends mongoose.Document>(
  model: mongoose.Model<T>,
  id: string | mongoose.Types.ObjectId,
  updateFn: (doc: T) => any,
  maxRetries: number = 3
): Promise<T> {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      // Get current document
      const doc = await model.findById(id);
      if (!doc) {
        throw new Error('Document not found');
      }

      // Get update data
      const update = updateFn(doc as T);
      const version = (doc as any).__v || 0;

      // Try to update with lock
      return await updateWithLock(model, id, version, update);
    } catch (error) {
      if (error instanceof OptimisticLockError && attempts < maxRetries - 1) {
        attempts++;
        logger.info(`Retrying update due to lock conflict (attempt ${attempts}/${maxRetries})`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 100 * attempts));
        continue;
      }
      throw error;
    }
  }

  throw new OptimisticLockError('Failed to update after maximum retries');
}

/**
 * Batch update with optimistic locking
 * @param model - Mongoose model
 * @param updates - Array of { id, version, data }
 * @returns Results with success/failure for each update
 */
export async function batchUpdateWithLock<T extends mongoose.Document>(
  model: mongoose.Model<T>,
  updates: Array<{ id: string; version: number; data: any }>
): Promise<Array<{ id: string; success: boolean; doc?: T; error?: string }>> {
  const results = await Promise.allSettled(
    updates.map(({ id, version, data }) =>
      updateWithLock(model, id, version, data)
    )
  );

  return results.map((result, index) => {
    const { id } = updates[index];
    
    if (result.status === 'fulfilled') {
      return { id, success: true, doc: result.value };
    } else {
      return {
        id,
        success: false,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
      };
    }
  });
}

/**
 * Check if document has been modified since version
 * @param model - Mongoose model
 * @param id - Document ID
 * @param version - Version to check against
 * @returns true if document has been modified
 */
export async function hasBeenModified<T extends mongoose.Document>(
  model: mongoose.Model<T>,
  id: string | mongoose.Types.ObjectId,
  version: number
): Promise<boolean> {
  const doc = await model.findById(id).select('__v');
  if (!doc) {
    return true; // Document doesn't exist, consider it modified
  }
  return (doc as any).__v !== version;
}

/**
 * Get current version of document
 * @param model - Mongoose model
 * @param id - Document ID
 * @returns Current version number
 */
export async function getCurrentVersion<T extends mongoose.Document>(
  model: mongoose.Model<T>,
  id: string | mongoose.Types.ObjectId
): Promise<number | null> {
  const doc = await model.findById(id).select('__v');
  if (!doc) {
    return null;
  }
  return (doc as any).__v || 0;
}

/**
 * Middleware to add version to response
 */
export function addVersionToResponse(req: any, res: any, next: any) {
  const originalJson = res.json.bind(res);
  
  res.json = function (data: any) {
    // Add version to response if document has __v
    if (data && typeof data === 'object' && data.__v !== undefined) {
      data.version = data.__v;
    }
    
    return originalJson(data);
  };
  
  next();
}

/**
 * Usage Examples:
 * 
 * // Example 1: Simple update with lock
 * try {
 *   const updated = await updateWithLock(
 *     Project,
 *     projectId,
 *     currentVersion,
 *     { title: 'New Title' }
 *   );
 * } catch (error) {
 *   if (error instanceof OptimisticLockError) {
 *     // Handle conflict - ask user to refresh
 *   }
 * }
 * 
 * // Example 2: Update with automatic retry
 * const updated = await updateWithRetry(
 *   Project,
 *   projectId,
 *   (doc) => ({
 *     title: 'New Title',
 *     capacity: doc.capacity + 1, // Based on current value
 *   })
 * );
 * 
 * // Example 3: Check if modified
 * const modified = await hasBeenModified(Project, projectId, version);
 * if (modified) {
 *   // Warn user that document has changed
 * }
 * 
 * // Example 4: In route handler
 * router.put('/projects/:id', async (req, res) => {
 *   const { version, ...data } = req.body;
 *   
 *   try {
 *     const updated = await updateWithLock(
 *       Project,
 *       req.params.id,
 *       version,
 *       data
 *     );
 *     res.json({ success: true, data: updated });
 *   } catch (error) {
 *     if (error instanceof OptimisticLockError) {
 *       res.status(409).json({
 *         success: false,
 *         error: {
 *           code: 'CONFLICT',
 *           message: error.message,
 *         },
 *       });
 *     } else {
 *       throw error;
 *     }
 *   }
 * });
 */
