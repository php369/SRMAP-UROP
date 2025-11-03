#!/usr/bin/env tsx

import mongoose from 'mongoose';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

// Import all models to ensure they're registered
import '../models';

/**
 * Database reset utility
 * Completely clears the database and optionally reseeds with fresh data
 */

interface ResetOptions {
  confirm?: boolean;
  seed?: boolean;
  collections?: string[];
}

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB for reset operation');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function listCollections(): Promise<string[]> {
  if (!mongoose.connection.db) {
    throw new Error('Database connection not established');
  }
  const collections = await mongoose.connection.db.listCollections().toArray();
  return collections.map(c => c.name);
}

async function resetDatabase(options: ResetOptions = {}): Promise<void> {
  const { collections: targetCollections, seed = false } = options;

  try {
    const allCollections = await listCollections();
    const collectionsToReset = targetCollections || allCollections;

    if (collectionsToReset.length === 0) {
      logger.info('No collections found to reset');
      return;
    }

    logger.info(`🗑️  Resetting collections: ${collectionsToReset.join(', ')}`);

    // Drop each collection
    for (const collectionName of collectionsToReset) {
      if (allCollections.includes(collectionName)) {
        if (!mongoose.connection.db) {
          throw new Error('Database connection not established');
        }
        await mongoose.connection.db.collection(collectionName).drop();
        logger.info(`✅ Dropped collection: ${collectionName}`);
      } else {
        logger.warn(`⚠️  Collection not found: ${collectionName}`);
      }
    }

    // Optionally reseed the database
    if (seed) {
      logger.info('🌱 Reseeding database...');
      const { seedDatabase } = await import('./seed');
      await seedDatabase();
    }

    logger.info('✅ Database reset completed successfully');

  } catch (error) {
    logger.error('❌ Database reset failed:', error);
    throw error;
  }
}

async function confirmReset(): Promise<boolean> {
  // In a real CLI tool, you'd use readline or inquirer
  // For now, we'll check environment variables or command line args
  const autoConfirm = process.env.AUTO_CONFIRM === 'true' || process.argv.includes('--yes');
  
  if (autoConfirm) {
    return true;
  }

  // For safety, require explicit confirmation
  logger.warn('⚠️  This operation will permanently delete all data in the database!');
  logger.warn('⚠️  Set AUTO_CONFIRM=true or use --yes flag to bypass this check');
  return false;
}

async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    const options: ResetOptions = {
      seed: args.includes('--seed'),
      collections: args.includes('--collections') 
        ? args[args.indexOf('--collections') + 1]?.split(',')
        : undefined,
    };

    logger.info('🔄 Starting database reset operation...');
    
    // Safety check
    if (config.NODE_ENV === 'production') {
      logger.error('❌ Database reset is not allowed in production environment');
      process.exit(1);
    }

    const confirmed = await confirmReset();
    if (!confirmed) {
      logger.info('❌ Database reset cancelled - confirmation required');
      process.exit(1);
    }

    await connectToDatabase();
    await resetDatabase(options);
    
    logger.info('✅ Database reset operation completed successfully');
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Database reset operation failed:', error);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main();
}

export { resetDatabase };