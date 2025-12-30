#!/usr/bin/env tsx

import mongoose from 'mongoose';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

// Import all models to ensure they're registered
import '../models';

/**
 * Database migration utility
 * Handles schema updates and data migrations
 */

interface Migration {
  version: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

interface MigrationRecord {
  version: string;
  description: string;
  appliedAt: Date;
}

// Migration tracking collection
const MigrationSchema = new mongoose.Schema({
  version: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  appliedAt: { type: Date, default: Date.now },
});

const MigrationModel = mongoose.model('Migration', MigrationSchema);

// Define migrations
const migrations: Migration[] = [
  {
    version: '001',
    description: 'Initial schema setup',
    up: async () => {
      logger.info('Creating initial indexes...');
      
      // Ensure indexes are created for all collections
      if (!mongoose.connection.db) {
        throw new Error('Database connection not established');
      }
      const collections = await mongoose.connection.db.listCollections().toArray();
      
      for (const collection of collections) {
        const model = mongoose.models[collection.name];
        if (model && model.createIndexes) {
          await model.createIndexes();
          logger.info(`✅ Indexes created for ${collection.name}`);
        }
      }
    },
    down: async () => {
      logger.info('Dropping all indexes...');
      // This would drop custom indexes if needed
    },
  },
  {
    version: '002',
    description: 'Add performance monitoring indexes',
    up: async () => {
      logger.info('Adding performance monitoring indexes...');
      
      // Add compound indexes for better query performance
      const User = mongoose.models.User;
      if (User) {
        await User.collection.createIndex({ role: 1, 'profile.department': 1 });
        await User.collection.createIndex({ email: 1, role: 1 });
        logger.info('✅ User performance indexes created');
      }

      const Assessment = mongoose.models.Assessment;
      if (Assessment) {
        await Assessment.collection.createIndex({ 
          facultyId: 1, 
          status: 1, 
          dueAt: 1 
        });
        await Assessment.collection.createIndex({ 
          courseId: 1, 
          status: 1, 
          dueAt: 1 
        });
        logger.info('✅ Assessment performance indexes created');
      }

      const Submission = mongoose.models.Submission;
      if (Submission) {
        await Submission.collection.createIndex({ 
          assessmentId: 1, 
          submittedAt: -1 
        });
        await Submission.collection.createIndex({ 
          studentId: 1, 
          status: 1, 
          submittedAt: -1 
        });
        logger.info('✅ Submission performance indexes created');
      }
    },
    down: async () => {
      logger.info('Removing performance monitoring indexes...');
      // Drop the specific indexes if needed
    },
  },
  {
    version: '003',
    description: 'Update user profile schema for enhanced features',
    up: async () => {
      logger.info('Updating user profiles...');
      
      const User = mongoose.models.User;
      if (User) {
        // Add default values for new fields
        await User.updateMany(
          { 'profile.skills': { $exists: false } },
          { $set: { 'profile.skills': [] } }
        );
        
        await User.updateMany(
          { 'preferences.theme': { $exists: false } },
          { $set: { 'preferences.theme': 'light' } }
        );
        
        await User.updateMany(
          { 'preferences.notifications': { $exists: false } },
          { $set: { 'preferences.notifications': true } }
        );
        
        logger.info('✅ User profiles updated');
      }
    },
    down: async () => {
      logger.info('Reverting user profile updates...');
      // Remove the added fields if needed
    },
  },
];

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB for migration');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function getAppliedMigrations(): Promise<MigrationRecord[]> {
  try {
    return await MigrationModel.find().sort({ version: 1 });
  } catch (error) {
    // Migration collection doesn't exist yet
    return [];
  }
}

async function recordMigration(migration: Migration): Promise<void> {
  await MigrationModel.create({
    version: migration.version,
    description: migration.description,
  });
}

async function removeMigrationRecord(version: string): Promise<void> {
  await MigrationModel.deleteOne({ version });
}

async function runMigrations(targetVersion?: string): Promise<void> {
  logger.info('🔄 Running database migrations...');
  
  const appliedMigrations = await getAppliedMigrations();
  const appliedVersions = new Set(appliedMigrations.map(m => m.version));
  
  let migrationsToRun = migrations.filter(m => !appliedVersions.has(m.version));
  
  if (targetVersion) {
    migrationsToRun = migrationsToRun.filter(m => m.version <= targetVersion);
  }
  
  if (migrationsToRun.length === 0) {
    logger.info('✅ No migrations to run - database is up to date');
    return;
  }
  
  logger.info(`📋 Found ${migrationsToRun.length} migrations to run`);
  
  for (const migration of migrationsToRun) {
    try {
      logger.info(`⏳ Running migration ${migration.version}: ${migration.description}`);
      
      await migration.up();
      await recordMigration(migration);
      
      logger.info(`✅ Migration ${migration.version} completed successfully`);
    } catch (error) {
      logger.error(`❌ Migration ${migration.version} failed:`, error);
      throw error;
    }
  }
  
  logger.info('✅ All migrations completed successfully');
}

async function rollbackMigration(version: string): Promise<void> {
  logger.info(`🔄 Rolling back migration ${version}...`);
  
  const migration = migrations.find(m => m.version === version);
  if (!migration) {
    throw new Error(`Migration ${version} not found`);
  }
  
  const appliedMigrations = await getAppliedMigrations();
  const isApplied = appliedMigrations.some(m => m.version === version);
  
  if (!isApplied) {
    logger.warn(`⚠️  Migration ${version} is not applied`);
    return;
  }
  
  try {
    await migration.down();
    await removeMigrationRecord(version);
    
    logger.info(`✅ Migration ${version} rolled back successfully`);
  } catch (error) {
    logger.error(`❌ Rollback of migration ${version} failed:`, error);
    throw error;
  }
}

async function showMigrationStatus(): Promise<void> {
  const appliedMigrations = await getAppliedMigrations();
  const appliedVersions = new Set(appliedMigrations.map(m => m.version));
  
  logger.info('📊 Migration Status:');
  logger.info('=' .repeat(50));
  
  for (const migration of migrations) {
    const status = appliedVersions.has(migration.version) ? '✅ Applied' : '⏳ Pending';
    const appliedDate = appliedMigrations.find(m => m.version === migration.version)?.appliedAt;
    
    console.log(`${status} ${migration.version}: ${migration.description}`);
    if (appliedDate) {
      console.log(`    Applied: ${appliedDate.toISOString()}`);
    }
  }
  
  const pendingCount = migrations.length - appliedMigrations.length;
  console.log(`\n📈 Summary: ${appliedMigrations.length} applied, ${pendingCount} pending`);
}

async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    const command = args[0];
    
    await connectToDatabase();
    
    switch (command) {
      case 'up':
        const targetVersion = args[1];
        await runMigrations(targetVersion);
        break;
        
      case 'down':
        const rollbackVersion = args[1];
        if (!rollbackVersion) {
          logger.error('❌ Please specify a migration version to rollback');
          process.exit(1);
        }
        await rollbackMigration(rollbackVersion);
        break;
        
      case 'status':
        await showMigrationStatus();
        break;
        
      default:
        logger.info('📋 Available commands:');
        logger.info('  up [version]    - Run migrations (optionally up to specific version)');
        logger.info('  down <version>  - Rollback specific migration');
        logger.info('  status          - Show migration status');
        break;
    }
    
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Migration operation failed:', error);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main();
}

export { runMigrations, rollbackMigration, showMigrationStatus };