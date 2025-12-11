#!/usr/bin/env node

/**
 * Database State Verification Script
 * 
 * This script verifies the database state after reset and initialization
 */

import mongoose from 'mongoose';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Window } from '../models/Window';
import { Group } from '../models/Group';
import { Application } from '../models/Application';
import { Submission } from '../models/Submission';
import { logger } from '../utils/logger';

async function verifyDatabaseState() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/srm-project-portal';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    console.log('======================');
    console.log('DATABASE STATE VERIFICATION');
    console.log('======================\n');

    // Check collections and counts
    const collections = [
      { name: 'Users', model: User },
      { name: 'Projects', model: Project },
      { name: 'Windows', model: Window },
      { name: 'Groups', model: Group },
      { name: 'Applications', model: Application },
      { name: 'Submissions', model: Submission },
    ];

    console.log('📊 Collection Counts:');
    for (const collection of collections) {
      const count = await collection.model.countDocuments();
      console.log(`   ${collection.name}: ${count}`);
    }

    console.log('\n👥 Users:');
    const users = await User.find().select('name email role isCoordinator');
    for (const user of users) {
      const roleInfo = user.isCoordinator ? `${user.role} (Coordinator)` : user.role;
      console.log(`   • ${user.name} (${user.email}) - ${roleInfo}`);
    }

    console.log('\n📋 Projects:');
    const projects = await Project.find().select('title type status');
    if (projects.length === 0) {
      console.log('   • No projects created (as expected for clean setup)');
    } else {
      for (const project of projects) {
        console.log(`   • [${project.type}] ${project.title} - ${project.status}`);
      }
    }

    console.log('\n🪟 Active Windows:');
    const windows = await Window.find({ isActive: true }).select('title windowType projectType');
    if (windows.length === 0) {
      console.log('   • No windows created (as expected for clean setup)');
    } else {
      for (const window of windows) {
        console.log(`   • ${window.title} (${window.windowType}/${window.projectType})`);
      }
    }

    // Check for any old collections that should have been removed
    console.log('\n🗑️  Checking for removed collections:');
    const allCollections = await mongoose.connection.db.listCollections().toArray();
    const removedCollections = ['cohorts', 'studentmetas', 'avatarpools', 'eligibilities', 'facultyrosters'];
    
    let foundOldCollections = false;
    for (const collectionName of removedCollections) {
      const exists = allCollections.some(col => col.name === collectionName);
      if (exists) {
        console.log(`   ⚠️  Found old collection: ${collectionName}`);
        foundOldCollections = true;
      }
    }
    
    if (!foundOldCollections) {
      console.log('   ✓ No old collections found - cleanup successful');
    }

    console.log('\n📋 Current Collections:');
    for (const collection of allCollections) {
      console.log(`   • ${collection.name}`);
    }

    console.log('\n======================');
    console.log('VERIFICATION COMPLETE');
    console.log('======================');

    if (users.length === 2 && projects.length === 0 && windows.length === 0) {
      console.log('✅ Clean database setup successful!');
    } else {
      console.log('⚠️  Database state may need attention');
      console.log(`   Expected: 2 users, 0 projects, 0 windows`);
      console.log(`   Found: ${users.length} users, ${projects.length} projects, ${windows.length} windows`);
    }

  } catch (error) {
    logger.error('Database verification failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the verification if this script is executed directly
if (require.main === module) {
  verifyDatabaseState()
    .then(() => {
      console.log('\n✅ Database verification completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Database verification failed:', error);
      process.exit(1);
    });
}

export { verifyDatabaseState };