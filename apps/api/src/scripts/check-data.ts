#!/usr/bin/env tsx

import mongoose from 'mongoose';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

// Import models
// Eligibility model removed - collection dropped from database

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function checkData(): Promise<void> {
  logger.info('🔍 Checking current data...');
  
  try {
    // Note: Eligibility collection has been dropped from database
    // Authorization now based on User model fields: role, isCoordinator, isExternalEvaluator, department
    logger.info('📊 Eligibility collection has been removed - authorization now uses User model');
    
  } catch (error) {
    logger.error('Failed to check data:', error);
    throw error;
  }
}

async function main(): Promise<void> {
  try {
    await connectToDatabase();
    await checkData();
    
    logger.info('✅ Data check completed!');
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Data check failed:', error);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main();
}