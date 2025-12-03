/**
 * Fix Group collection index issue
 * Run this script to drop the old 'code' index and fix duplicate key errors
 * 
 * Usage: node scripts/fix-group-index.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixGroupIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/srm-portal');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('groups');

    // Check if collection exists
    const collections = await db.listCollections({ name: 'groups' }).toArray();
    
    if (collections.length === 0) {
      console.log('ℹ️  Groups collection does not exist yet - will be created with correct schema');
      console.log('✅ No fix needed!');
    } else {
      // Get existing indexes
      const indexes = await collection.indexes();
      console.log('Existing indexes:', indexes.map(i => i.name));

      // Drop the old 'code_1' index if it exists
      try {
        await collection.dropIndex('code_1');
        console.log('✅ Dropped old code_1 index');
      } catch (error) {
        console.log('ℹ️  code_1 index does not exist or already dropped');
      }

      // Ensure groupCode_1 index exists
      await collection.createIndex({ groupCode: 1 }, { unique: true });
      console.log('✅ Created groupCode_1 index');
    }

    console.log('\n✅ Group index fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing group index:', error);
    process.exit(1);
  }
}

fixGroupIndex();
