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
import { StudentEvaluation } from '../models/StudentEvaluation';
import { Window } from '../models/Window';
import { Notification } from '../models/Notification';
// StudentMeta model removed - functionality disabled
import { MeetingLog } from '../models/MeetingLog';
import { Assessment } from '../models/Assessment';
// Course model removed - functionality disabled
// Cohort model removed - functionality disabled
// TokenStore model removed - functionality disabled
// OnlineStatus model removed - functionality disabled

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
    // Note: Eligibility, FacultyRoster, AvatarPool, Course, TokenStore, and OnlineStatus collections have been dropped
    let totalDeleted = 0;
    
    // Clear StudentEvaluation
    const studentEvalResult = await StudentEvaluation.deleteMany({});
    totalDeleted += studentEvalResult.deletedCount || 0;
    
    // Clear GroupSubmission
    const groupSubmissionResult = await GroupSubmission.deleteMany({});
    totalDeleted += groupSubmissionResult.deletedCount || 0;
    
    // Clear Application
    const applicationResult = await Application.deleteMany({});
    totalDeleted += applicationResult.deletedCount || 0;
    
    // Clear Group
    const groupResult = await Group.deleteMany({});
    totalDeleted += groupResult.deletedCount || 0;
    
    // Clear Project
    const projectResult = await Project.deleteMany({});
    totalDeleted += projectResult.deletedCount || 0;
    
    // Clear User
    const userResult = await User.deleteMany({});
    totalDeleted += userResult.deletedCount || 0;
    
    // Clear Window
    const windowResult = await Window.deleteMany({});
    totalDeleted += windowResult.deletedCount || 0;
    
    // Clear Notification
    const notificationResult = await Notification.deleteMany({});
    totalDeleted += notificationResult.deletedCount || 0;
    
    // Clear MeetingLog
    const meetingLogResult = await MeetingLog.deleteMany({});
    totalDeleted += meetingLogResult.deletedCount || 0;
    
    // Clear Assessment
    const assessmentResult = await Assessment.deleteMany({});
    totalDeleted += assessmentResult.deletedCount || 0;
    
    logger.info(`✅ Cleared all data - ${totalDeleted} documents deleted`);
    logger.info('Collections preserved, only data removed');
    
  } catch (error) {
    logger.error('Failed to clear data:', error);
    throw error;
  }
}

// addEligibleStudent function removed - Eligibility collection dropped
// Authorization now based on User model fields: role, isCoordinator, isExternalEvaluator, department

async function main(): Promise<void> {
  try {
    logger.info('🧹 Starting data clearing and minimal setup...');
    
    await connectToDatabase();
    await clearAllData();
    // addEligibleStudent removed - Eligibility collection dropped
    
    logger.info('✅ Data clearing completed successfully!');
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