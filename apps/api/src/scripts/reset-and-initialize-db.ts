#!/usr/bin/env node

/**
 * Database Reset and Initialization Script
 * 
 * This script:
 * 1. Drops all existing collections to start fresh
 * 2. Creates ONLY the two initial users (admin and coordinator)
 * 3. No dummy data - everything else will be created manually
 */

import mongoose from 'mongoose';
import { User } from '../models/User';
import { logger } from '../utils/logger';

interface InitialUser {
  googleId: string;
  name: string;
  email: string;
  role: 'admin' | 'faculty';
  studentId?: string;
  facultyId?: string;
  department?: string;
  isCoordinator?: boolean;
}

const INITIAL_USERS: InitialUser[] = [
  {
    googleId: 'admin_krish_nariya',
    name: 'Krish Nariya',
    email: 'krish_nariya@srmap.edu.in',
    role: 'admin',
    department: 'Computer Science',
  },
  {
    googleId: 'faculty_poojan_patel',
    name: 'Poojan Patel',
    email: 'poojan_patel@srmap.edu.in',
    role: 'faculty',
    facultyId: 'FAC001',
    department: 'Computer Science',
    isCoordinator: true,
  }
];

async function resetAndInitializeDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/srm-project-portal';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    console.log('======================');
    console.log('DATABASE RESET & INITIALIZATION');
    console.log('======================\n');

    // 1. Drop all collections to start fresh
    logger.info('🗑️  Dropping all existing collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      try {
        await mongoose.connection.db.dropCollection(collection.name);
        logger.info(`   ✓ Dropped collection: ${collection.name}`);
      } catch (error: any) {
        if (!error.message.includes('ns not found')) {
          logger.warn(`   ⚠️  Could not drop collection ${collection.name}: ${error.message}`);
        }
      }
    }
    
    console.log('\n� Creating  ONLY initial users (no dummy data)...\n');

    // 2. Create ONLY the two initial users
    logger.info('👥 Creating initial users...');
    
    for (const userData of INITIAL_USERS) {
      const user = new User({
        googleId: userData.googleId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        studentId: userData.studentId,
        facultyId: userData.facultyId,
        department: userData.department,
        isCoordinator: userData.isCoordinator || false,
        isExternalEvaluator: false,
        preferences: {
          theme: 'light',
          notifications: true,
          emailNotifications: true,
        },
        lastSeen: new Date(),
      });

      await user.save();
      logger.info(`   ✓ Created ${userData.role}: ${userData.name} (${userData.email})`);
    }

    console.log('\n======================');
    console.log('INITIALIZATION SUMMARY');
    console.log('======================');
    console.log('✓ Dropped all existing collections');
    console.log('✓ Created ONLY the two initial users');
    console.log('✓ NO dummy data created');
    console.log('\n📧 Initial Users Created:');
    console.log('   • Admin: krish_nariya@srmap.edu.in');
    console.log('   • Coordinator: poojan_patel@srmap.edu.in');
    console.log('\n🎯 Clean database ready for manual testing!');
    console.log('======================\n');

    logger.info('Database reset and initialization completed successfully');

  } catch (error) {
    logger.error('Database reset and initialization failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the reset if this script is executed directly
if (require.main === module) {
  resetAndInitializeDatabase()
    .then(() => {
      console.log('✅ Database reset and initialization completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database reset and initialization failed:', error);
      process.exit(1);
    });
}

export { resetAndInitializeDatabase };