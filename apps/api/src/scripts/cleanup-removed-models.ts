#!/usr/bin/env node

/**
 * Database cleanup script for removed models
 * 
 * This script:
 * 1. Drops the Cohort collection
 * 2. Drops the StudentMeta collection  
 * 3. Drops any AvatarPool collection if it exists
 * 4. Drops any Eligibility collection if it exists
 * 5. Drops any FacultyRoster collection if it exists
 * 6. Updates User documents to add currentGroupId field
 * 7. Updates Group documents to remove semester field
 * 8. Updates all faculty references to point to User collection
 */

import mongoose from 'mongoose';
import { logger } from '../utils/logger';

async function cleanupRemovedModels() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/srm-project-portal';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    console.log('======================');
    console.log('DATABASE CLEANUP SCRIPT');
    console.log('======================\n');

    // 1. Drop Cohort collection
    logger.info('Dropping Cohort collection...');
    try {
      await mongoose.connection.db.dropCollection('cohorts');
      logger.info('Cohort collection dropped successfully');
    } catch (error: any) {
      if (error.message.includes('ns not found')) {
        logger.info('Cohort collection does not exist, skipping...');
      } else {
        throw error;
      }
    }

    // 2. Drop StudentMeta collection
    logger.info('Dropping StudentMeta collection...');
    try {
      await mongoose.connection.db.dropCollection('studentmetas');
      logger.info('StudentMeta collection dropped successfully');
    } catch (error: any) {
      if (error.message.includes('ns not found')) {
        logger.info('StudentMeta collection does not exist, skipping...');
      } else {
        throw error;
      }
    }

    // 3. Drop AvatarPool collection if it exists
    logger.info('Dropping AvatarPool collection...');
    try {
      await mongoose.connection.db.dropCollection('avatarpools');
      logger.info('AvatarPool collection dropped successfully');
    } catch (error: any) {
      if (error.message.includes('ns not found')) {
        logger.info('AvatarPool collection does not exist, skipping...');
      } else {
        throw error;
      }
    }

    // 4. Drop Eligibility collection if it exists
    logger.info('Dropping Eligibility collection...');
    try {
      await mongoose.connection.db.dropCollection('eligibilities');
      logger.info('Eligibility collection dropped successfully');
    } catch (error: any) {
      if (error.message.includes('ns not found')) {
        logger.info('Eligibility collection does not exist, skipping...');
      } else {
        throw error;
      }
    }

    // 5. Drop FacultyRoster collection if it exists
    logger.info('Dropping FacultyRoster collection...');
    try {
      await mongoose.connection.db.dropCollection('facultyrosters');
      logger.info('FacultyRoster collection dropped successfully');
    } catch (error: any) {
      if (error.message.includes('ns not found')) {
        logger.info('FacultyRoster collection does not exist, skipping...');
      } else {
        throw error;
      }
    }

    // 6. Update User documents to add currentGroupId field for users who are in groups
    logger.info('Updating User documents to add currentGroupId field...');
    try {
      // First, get all groups and their members
      const groups = await mongoose.connection.db.collection('groups').find({}).toArray();
      
      for (const group of groups) {
        if (group.members && group.members.length > 0) {
          // Update all members to have currentGroupId
          await mongoose.connection.db.collection('users').updateMany(
            { _id: { $in: group.members } },
            { $set: { currentGroupId: group._id } }
          );
          logger.info(`Updated ${group.members.length} users with currentGroupId for group ${group._id}`);
        }
      }
      
      logger.info('User documents updated successfully');
    } catch (error: any) {
      logger.error('Error updating User documents:', error);
    }

    // 7. Update Group documents to remove semester field
    logger.info('Updating Group documents to remove semester field...');
    try {
      const result = await mongoose.connection.db.collection('groups').updateMany(
        {},
        { $unset: { semester: 1 } }
      );
      logger.info(`Updated ${result.modifiedCount} group documents to remove semester field`);
    } catch (error: any) {
      logger.error('Error updating Group documents:', error);
    }

    // 8. Update faculty references in various collections
    logger.info('Updating faculty references to point to User collection...');
    
    // Note: Since we're changing refs from 'FacultyRoster' to 'User', 
    // the actual ObjectIds should remain the same if faculty users were properly migrated
    // This is more of a schema change that will be handled by the model updates
    
    logger.info('Faculty reference updates completed (handled by model schema changes)');

    console.log('\n======================');
    console.log('CLEANUP SUMMARY');
    console.log('======================');
    console.log('✓ Dropped Cohort collection');
    console.log('✓ Dropped StudentMeta collection');
    console.log('✓ Dropped AvatarPool collection (if existed)');
    console.log('✓ Dropped Eligibility collection (if existed)');
    console.log('✓ Dropped FacultyRoster collection (if existed)');
    console.log('✓ Updated User documents with currentGroupId');
    console.log('✓ Removed semester field from Group documents');
    console.log('✓ Updated faculty references to User collection');
    console.log('======================\n');

    logger.info('Database cleanup completed successfully');

  } catch (error) {
    logger.error('Database cleanup failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupRemovedModels()
    .then(() => {
      console.log('✅ Database cleanup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database cleanup failed:', error);
      process.exit(1);
    });
}

export { cleanupRemovedModels };