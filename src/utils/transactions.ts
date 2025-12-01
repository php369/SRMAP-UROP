/**
 * Database Transaction Utilities
 * Provides atomic operations for multi-document updates
 */

import mongoose from 'mongoose';
import { logger } from './logger';

/**
 * Execute operations within a transaction
 * @param callback - Function containing operations to execute
 * @returns Result from callback
 */
export async function withTransaction<T>(
  callback: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    logger.debug('Transaction started');

    const result = await callback(session);

    await session.commitTransaction();
    logger.debug('Transaction committed');

    return result;
  } catch (error) {
    await session.abortTransaction();
    logger.error('Transaction aborted', { error });
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Execute operations with retry on transient errors
 * @param callback - Function containing operations
 * @param maxRetries - Maximum retry attempts
 * @returns Result from callback
 */
export async function withTransactionRetry<T>(
  callback: (session: mongoose.ClientSession) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withTransaction(callback);
    } catch (error: any) {
      lastError = error;

      // Check if error is transient (can be retried)
      if (isTransientError(error) && attempt < maxRetries) {
        logger.warn(`Transaction failed (attempt ${attempt}/${maxRetries}), retrying...`, {
          error: error.message,
        });
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)));
        continue;
      }

      // Non-transient error or max retries reached
      throw error;
    }
  }

  throw lastError;
}

/**
 * Check if error is transient (can be retried)
 */
function isTransientError(error: any): boolean {
  if (!error) return false;

  const transientErrorCodes = [
    112, // WriteConflict
    251, // TransactionTooLarge
  ];

  const transientErrorLabels = [
    'TransientTransactionError',
    'UnknownTransactionCommitResult',
  ];

  // Check error code
  if (error.code && transientErrorCodes.includes(error.code)) {
    return true;
  }

  // Check error labels
  if (error.errorLabels) {
    return error.errorLabels.some((label: string) =>
      transientErrorLabels.includes(label)
    );
  }

  return false;
}

/**
 * Execute multiple operations atomically
 * @param operations - Array of operations to execute
 * @returns Array of results
 */
export async function executeAtomic<T>(
  operations: Array<(session: mongoose.ClientSession) => Promise<T>>
): Promise<T[]> {
  return withTransaction(async (session) => {
    const results: T[] = [];

    for (const operation of operations) {
      const result = await operation(session);
      results.push(result);
    }

    return results;
  });
}

/**
 * Create document with transaction
 */
export async function createWithTransaction<T>(
  model: mongoose.Model<any>,
  data: any,
  session?: mongoose.ClientSession
): Promise<T> {
  if (session) {
    const [doc] = await model.create([data], { session });
    return doc;
  }

  return withTransaction(async (session) => {
    const [doc] = await model.create([data], { session });
    return doc;
  });
}

/**
 * Update document with transaction
 */
export async function updateWithTransaction<T>(
  model: mongoose.Model<any>,
  id: string | mongoose.Types.ObjectId,
  update: any,
  session?: mongoose.ClientSession
): Promise<T | null> {
  if (session) {
    return model.findByIdAndUpdate(id, update, { session, new: true });
  }

  return withTransaction(async (session) => {
    return model.findByIdAndUpdate(id, update, { session, new: true });
  });
}

/**
 * Delete document with transaction
 */
export async function deleteWithTransaction<T>(
  model: mongoose.Model<any>,
  id: string | mongoose.Types.ObjectId,
  session?: mongoose.ClientSession
): Promise<T | null> {
  if (session) {
    return model.findByIdAndDelete(id, { session });
  }

  return withTransaction(async (session) => {
    return model.findByIdAndDelete(id, { session });
  });
}

/**
 * Batch create with transaction
 */
export async function batchCreateWithTransaction<T>(
  model: mongoose.Model<any>,
  dataArray: any[]
): Promise<T[]> {
  return withTransaction(async (session) => {
    return model.create(dataArray, { session });
  });
}

/**
 * Batch update with transaction
 */
export async function batchUpdateWithTransaction(
  updates: Array<{
    model: mongoose.Model<any>;
    id: string | mongoose.Types.ObjectId;
    data: any;
  }>
): Promise<any[]> {
  return withTransaction(async (session) => {
    const results = [];

    for (const { model, id, data } of updates) {
      const result = await model.findByIdAndUpdate(id, data, {
        session,
        new: true,
      });
      results.push(result);
    }

    return results;
  });
}

/**
 * Transfer operation (debit from one, credit to another)
 */
export async function transferOperation<T>(
  sourceModel: mongoose.Model<any>,
  sourceId: string | mongoose.Types.ObjectId,
  sourceUpdate: any,
  targetModel: mongoose.Model<any>,
  targetId: string | mongoose.Types.ObjectId,
  targetUpdate: any
): Promise<{ source: T; target: T }> {
  return withTransaction(async (session) => {
    const source = await sourceModel.findByIdAndUpdate(sourceId, sourceUpdate, {
      session,
      new: true,
    });

    if (!source) {
      throw new Error('Source document not found');
    }

    const target = await targetModel.findByIdAndUpdate(targetId, targetUpdate, {
      session,
      new: true,
    });

    if (!target) {
      throw new Error('Target document not found');
    }

    return { source, target };
  });
}

/**
 * Usage Examples:
 * 
 * // Example 1: Simple transaction
 * await withTransaction(async (session) => {
 *   const group = await Group.create([groupData], { session });
 *   await Project.findByIdAndUpdate(
 *     projectId,
 *     { assignedTo: group[0]._id },
 *     { session }
 *   );
 * });
 * 
 * // Example 2: With retry
 * await withTransactionRetry(async (session) => {
 *   // Operations that might have transient failures
 *   await Model1.create([data1], { session });
 *   await Model2.create([data2], { session });
 * });
 * 
 * // Example 3: Multiple operations
 * const results = await executeAtomic([
 *   (session) => User.create([userData], { session }),
 *   (session) => Profile.create([profileData], { session }),
 *   (session) => Settings.create([settingsData], { session }),
 * ]);
 * 
 * // Example 4: Transfer operation
 * await transferOperation(
 *   Project,
 *   oldProjectId,
 *   { assignedTo: null },
 *   Project,
 *   newProjectId,
 *   { assignedTo: groupId }
 * );
 * 
 * // Example 5: Batch operations
 * await batchUpdateWithTransaction([
 *   { model: Project, id: 'id1', data: { status: 'published' } },
 *   { model: Project, id: 'id2', data: { status: 'published' } },
 *   { model: Project, id: 'id3', data: { status: 'published' } },
 * ]);
 * 
 * // Example 6: In service
 * async function assignProjectToGroup(projectId: string, groupId: string) {
 *   return withTransaction(async (session) => {
 *     // Update project
 *     const project = await Project.findByIdAndUpdate(
 *       projectId,
 *       { assignedTo: groupId, status: 'assigned' },
 *       { session, new: true }
 *     );
 * 
 *     if (!project) {
 *       throw new Error('Project not found');
 *     }
 * 
 *     // Update group
 *     const group = await Group.findByIdAndUpdate(
 *       groupId,
 *       { projectId: projectId },
 *       { session, new: true }
 *     );
 * 
 *     if (!group) {
 *       throw new Error('Group not found');
 *     }
 * 
 *     // Create notification
 *     await Notification.create([{
 *       userId: group.leaderId,
 *       message: `Project ${project.title} assigned to your group`,
 *     }], { session });
 * 
 *     return { project, group };
 *   });
 * }
 */
