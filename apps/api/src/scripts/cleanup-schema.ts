/**
 * Database Schema Cleanup Script
 * 
 * This script performs the following operations:
 * 1. Updates poojan_patel@srmap.edu.in to have isCoordinator: true
 * 2. Removes avatar and profile fields from all users
 * 3. Drops the Eligibility collection
 * 4. Drops the AvatarPool collection
 * 5. Drops the FacultyRoster collection
 */

import mongoose from 'mongoose';
import { User } from '../models/User';
// Models removed - collections dropped from database
// import { Eligibility } from '../models/Eligibility';
// import { AvatarPool } from '../models/AvatarPool';
// import { FacultyRoster } from '../models/FacultyRoster';
import { logger } from '../utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/srm-portal';

async function cleanupSchema() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // 1. Update poojan_patel@srmap.edu.in to have isCoordinator: true
    logger.info('Updating poojan_patel@srmap.edu.in...');
    const updateResult = await User.updateOne(
      { email: 'poojan_patel@srmap.edu.in' },
      { $set: { isCoordinator: true } }
    );
    logger.info(`Updated poojan_patel: ${updateResult.modifiedCount} document(s) modified`);

    // 2. Remove avatar and profile fields from all users
    logger.info('Removing avatar and profile fields from all users...');
    const removeFieldsResult = await User.updateMany(
      {},
      { 
        $unset: { 
          avatar: '',
          profile: ''
        } 
      }
    );
    logger.info(`Removed fields from ${removeFieldsResult.modifiedCount} user(s)`);

    // 3. Drop Eligibility collection
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

    // 4. Drop AvatarPool collection
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

    // 5. Drop FacultyRoster collection
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

    logger.info('✅ Schema cleanup completed successfully!');
    
    // Display summary
    console.log('\n=== CLEANUP SUMMARY ===');
    console.log('✓ Updated poojan_patel@srmap.edu.in isCoordinator to true');
    console.log('✓ Removed avatar and profile fields from all users');
    console.log('✓ Dropped Eligibility collection');
    console.log('✓ Dropped AvatarPool collection');
    console.log('✓ Dropped FacultyRoster collection');
    console.log('======================\n');

  } catch (error) {
    logger.error('Error during schema cleanup:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupSchema()
  .then(() => {
    console.log('Schema cleanup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schema cleanup failed:', error);
    process.exit(1);
  });
