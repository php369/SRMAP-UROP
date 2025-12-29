#!/usr/bin/env node

/**
 * Complete Database Reset Script
 * 
 * This script:
 * 1. Drops all removed model collections (cohorts, eligibilities, facultyrosters, studentmetas, avatarpools, courses)
 * 2. Clears ALL data from existing collections (deleteMany, not drop)
 * 3. Seeds ONLY the 2 required users
 */

import mongoose from 'mongoose';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Group } from '../models/Group';
import { Application } from '../models/Application';
import { GroupSubmission } from '../models/GroupSubmission';
import { Submission } from '../models/Submission';
import { StudentEvaluation } from '../models/StudentEvaluation';
import { Assessment } from '../models/Assessment';
import { MeetingLog } from '../models/MeetingLog';
import { Notification } from '../models/Notification';
import { Window } from '../models/Window';
import { TokenStore } from '../models/TokenStore';
import { GroupMemberDetails } from '../models/GroupMemberDetails';
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

// Collections to drop completely (removed models)
const COLLECTIONS_TO_DROP = [
  'cohorts',
  'eligibilities', 
  'facultyrosters',
  'studentmetas',
  'avatarpools',
  'courses'
];

async function completeReset() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/srm-project-portal';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    console.log('======================');
    console.log('COMPLETE DATABASE RESET');
    console.log('======================\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Step 1: Drop removed model collections
    console.log('🗑️  Step 1: Dropping removed model collections...');
    for (const collectionName of COLLECTIONS_TO_DROP) {
      try {
        await db.dropCollection(collectionName);
        console.log(`   ✓ Dropped collection: ${collectionName}`);
      } catch (error: any) {
        if (error.message.includes('ns not found')) {
          console.log(`   ⚠️  Collection ${collectionName} not found (already removed)`);
        } else {
          console.log(`   ❌ Error dropping ${collectionName}: ${error.message}`);
        }
      }
    }

    // Step 2: Clear all data from existing collections (but keep collections)
    console.log('\n🧹 Step 2: Clearing all data from existing collections...');
    
    const clearOperations = [
      { model: User, name: 'Users' },
      { model: Project, name: 'Projects' },
      { model: Group, name: 'Groups' },
      { model: Application, name: 'Applications' },
      { model: GroupSubmission, name: 'Group Submissions' },
      { model: Submission, name: 'Submissions' },
      { model: StudentEvaluation, name: 'Student Evaluations' },
      { model: Assessment, name: 'Assessments' },
      { model: MeetingLog, name: 'Meeting Logs' },
      { model: Notification, name: 'Notifications' },
      { model: Window, name: 'Windows' },
      { model: TokenStore, name: 'Token Store' },
      { model: GroupMemberDetails, name: 'Group Member Details' }
    ];

    for (const { model, name } of clearOperations) {
      try {
        const result = await (model as any).deleteMany({});
        console.log(`   ✓ Cleared ${name}: ${result.deletedCount} documents deleted`);
      } catch (error: any) {
        console.log(`   ❌ Error clearing ${name}: ${error.message}`);
      }
    }

    // Step 3: Seed the 2 required users
    console.log('\n👥 Step 3: Seeding initial users...');
    
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
      console.log(`   ✓ Created ${userData.role}: ${userData.name} (${userData.email})`);
    }

    // Step 4: Verify final state
    console.log('\n📊 Step 4: Verifying final state...');
    const userCount = await User.countDocuments();
    const projectCount = await Project.countDocuments();
    const groupCount = await Group.countDocuments();
    const applicationCount = await Application.countDocuments();
    
    console.log(`   Users: ${userCount}`);
    console.log(`   Projects: ${projectCount}`);
    console.log(`   Groups: ${groupCount}`);
    console.log(`   Applications: ${applicationCount}`);

    console.log('\n======================');
    console.log('RESET COMPLETE');
    console.log('======================');
    console.log('✓ Dropped removed model collections');
    console.log('✓ Cleared all data from existing collections');
    console.log('✓ Seeded 2 initial users');
    console.log('\n📧 Users in database:');
    console.log('   • Admin: krish_nariya@srmap.edu.in');
    console.log('   • Coordinator: poojan_patel@srmap.edu.in');
    console.log('\n🎯 Database is completely clean and ready!');
    console.log('======================\n');

    logger.info('Complete database reset completed successfully');

  } catch (error) {
    logger.error('Complete database reset failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the reset if this script is executed directly
if (require.main === module) {
  completeReset()
    .then(() => {
      console.log('✅ Complete database reset completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Complete database reset failed:', error);
      process.exit(1);
    });
}

export { completeReset };