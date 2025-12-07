import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/User';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/project-management';

async function cleanupDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Step 1: Drop unused collections
    console.log('📦 Step 1: Dropping unused collections...');
    const collectionsToCheck = ['avatarpools', 'eligibilites', 'facultyroaters'];
    
    for (const collectionName of collectionsToCheck) {
      try {
        const collections = await db.listCollections({ name: collectionName }).toArray();
        if (collections.length > 0) {
          await db.dropCollection(collectionName);
          console.log(`  ✅ Dropped collection: ${collectionName}`);
        } else {
          console.log(`  ℹ️  Collection not found: ${collectionName}`);
        }
      } catch (error: any) {
        if (error.message.includes('ns not found')) {
          console.log(`  ℹ️  Collection not found: ${collectionName}`);
        } else {
          console.error(`  ❌ Error dropping ${collectionName}:`, error.message);
        }
      }
    }

    // Step 2: Remove avatar and profile fields from users
    console.log('\n👤 Step 2: Cleaning up User collection...');
    
    const usersWithOldFields = await User.countDocuments({
      $or: [
        { avatar: { $exists: true } },
        { profile: { $exists: true } }
      ]
    });
    
    console.log(`  Found ${usersWithOldFields} users with old fields`);
    
    if (usersWithOldFields > 0) {
      const result = await User.updateMany(
        {},
        {
          $unset: {
            avatar: '',
            profile: ''
          }
        }
      );
      console.log(`  ✅ Removed avatar and profile fields from ${result.modifiedCount} users`);
    } else {
      console.log('  ℹ️  No users with old fields found');
    }

    // Step 3: Fix isCoordinator for poojan_patel@srmap.edu.in
    console.log('\n🔧 Step 3: Fixing coordinator status...');
    
    const poojanUser = await User.findOne({ email: 'poojan_patel@srmap.edu.in' });
    
    if (poojanUser) {
      console.log(`  Current status: isCoordinator = ${poojanUser.isCoordinator}`);
      
      if (!poojanUser.isCoordinator) {
        poojanUser.isCoordinator = true;
        await poojanUser.save();
        console.log('  ✅ Updated poojan_patel@srmap.edu.in to coordinator');
      } else {
        console.log('  ℹ️  Already set as coordinator');
      }
    } else {
      console.log('  ⚠️  User poojan_patel@srmap.edu.in not found');
    }

    // Step 4: Verify cleanup
    console.log('\n🔍 Step 4: Verifying cleanup...');
    
    const remainingCollections = await db.listCollections().toArray();
    const collectionNames = remainingCollections.map(c => c.name);
    console.log('  Active collections:', collectionNames.join(', '));
    
    const usersWithIssues = await User.countDocuments({
      $or: [
        { avatar: { $exists: true } },
        { profile: { $exists: true } }
      ]
    });
    console.log(`  Users with old fields: ${usersWithIssues}`);
    
    const coordinators = await User.find({ isCoordinator: true }).select('email name');
    console.log(`  Coordinators (${coordinators.length}):`);
    coordinators.forEach(c => console.log(`    - ${c.email} (${c.name})`));

    console.log('\n✨ Database cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupDatabase()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });
