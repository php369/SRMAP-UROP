#!/usr/bin/env tsx

import mongoose from 'mongoose';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

// Import all models to ensure they're registered
import '../models';

// Import specific models
import { User } from '../models/User';
// Eligibility and FacultyRoster models removed - collections dropped from database
import { Project } from '../models/Project';
import { Group } from '../models/Group';
import { Application } from '../models/Application';
import { GroupSubmission } from '../models/GroupSubmission';
import { Evaluation } from '../models/Evaluation';
import { Window } from '../models/Window';
import { Notification } from '../models/Notification';
import { StudentMeta } from '../models/StudentMeta';
import { TokenStore } from '../models/TokenStore';
import { MeetingLog } from '../models/MeetingLog';
import { Assessment } from '../models/Assessment';
import { Course } from '../models/Course';
import { Cohort } from '../models/Cohort';

/**
 * Clear all data from collections (but keep the collections)
 */

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB for data clearing');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function clearAllData(): Promise<void> {
  logger.info('🧹 Clearing all data from collections...');
  
  try {
    // Clear all collections by deleting documents (not dropping collections)
    // Note: Eligibility, FacultyRoster, and AvatarPool collections have been dropped
    const clearPromises = [
      Evaluation.deleteMany({}),
      GroupSubmission.deleteMany({}),
      Application.deleteMany({}),
      Group.deleteMany({}),
      Project.deleteMany({}),
      User.deleteMany({}),
      Window.deleteMany({}),
      Notification.deleteMany({}),
      StudentMeta.deleteMany({}),
      TokenStore.deleteMany({}),
      MeetingLog.deleteMany({}),
      Assessment.deleteMany({}),
      Course.deleteMany({}),
      Cohort.deleteMany({})
    ];

    const results = await Promise.all(clearPromises);
    
    const totalDeleted = results.reduce((sum, result) => sum + result.deletedCount, 0);
    
    logger.info(`✅ Cleared all data - ${totalDeleted} documents deleted`);
    logger.info('Collections preserved, only data removed');
    
  } catch (error) {
    logger.error('Failed to clear data:', error);
    throw error;
  }
}

async function addEligibleStudent(): Promise<void> {
  logger.info('🎯 Adding eligible student entry...');

  // Set validity period (6 months from now)
  const validFrom = new Date();
  const validTo = new Date();
  validTo.setMonth(validTo.getMonth() + 6);

  const eligibilityData = {
    studentEmail: 'poojan_patel@srmap.edu.in',
    regNo: 'AP21110010001', // Sample registration number
    year: 3,
    semester: 7, // 7th semester (odd term) - valid enum value
    termKind: 'odd',
    type: 'UROP', // Making eligible for UROP projects
    validFrom,
    validTo,
  };

  const eligibility = new Eligibility(eligibilityData);
  await eligibility.save();

  logger.info('✅ Created eligibility entry for poojan_patel@srmap.edu.in');
  logger.info(`   - Type: ${eligibilityData.type}`);
  logger.info(`   - Year: ${eligibilityData.year}, Semester: ${eligibilityData.semester}`);
  logger.info(`   - Valid from: ${validFrom.toDateString()}`);
  logger.info(`   - Valid to: ${validTo.toDateString()}`);
}

async function main(): Promise<void> {
  try {
    logger.info('🧹 Starting data clearing and minimal setup...');
    
    await connectToDatabase();
    await clearAllData();
    await addEligibleStudent();
    
    logger.info('✅ Data clearing and minimal setup completed successfully!');
    logger.info('📊 Current state:');
    logger.info('   - All demo data removed');
    logger.info('   - Collections preserved');
    logger.info('   - One eligible student added: poojan_patel@srmap.edu.in');
    
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Data clearing failed:', error);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main();
}

export { main as clearDataAndSetup };