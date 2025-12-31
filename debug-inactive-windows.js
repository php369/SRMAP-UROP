const mongoose = require('mongoose');
require('dotenv').config({ path: './apps/api/.env' });

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/srm-portal');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Define Window schema (simplified)
const windowSchema = new mongoose.Schema({
  windowType: { type: String, required: true },
  projectType: { type: String, required: true },
  assessmentType: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Window = mongoose.model('Window', windowSchema);

// Debug function to analyze windows
async function debugWindows() {
  try {
    console.log('=== DEBUGGING WINDOWS ===\n');
    
    const now = new Date();
    console.log('Current time:', now.toISOString());
    console.log('Current time (local):', now.toLocaleString());
    
    // Get all windows
    const allWindows = await Window.find().sort({ startDate: -1 });
    console.log(`\nTotal windows in database: ${allWindows.length}`);
    
    if (allWindows.length === 0) {
      console.log('No windows found in database');
      return;
    }
    
    // Analyze each window
    console.log('\n=== WINDOW ANALYSIS ===');
    let shouldBeActive = 0;
    let shouldBeInactive = 0;
    let currentlyActive = 0;
    let currentlyInactive = 0;
    
    allWindows.forEach((window, index) => {
      const start = new Date(window.startDate);
      const end = new Date(window.endDate);
      const isCurrentlyActive = now >= start && now <= end;
      const hasEnded = now > end;
      const isUpcoming = now < start;
      
      console.log(`\nWindow ${index + 1}:`);
      console.log(`  ID: ${window._id}`);
      console.log(`  Type: ${window.windowType} - ${window.projectType}`);
      console.log(`  Assessment: ${window.assessmentType || 'N/A'}`);
      console.log(`  Start: ${start.toISOString()} (${start.toLocaleString()})`);
      console.log(`  End: ${end.toISOString()} (${end.toLocaleString()})`);
      console.log(`  Database isActive: ${window.isActive}`);
      console.log(`  Should be active: ${isCurrentlyActive}`);
      console.log(`  Status: ${isCurrentlyActive ? 'ACTIVE' : hasEnded ? 'ENDED' : 'UPCOMING'}`);
      
      if (isCurrentlyActive) {
        shouldBeActive++;
      } else {
        shouldBeInactive++;
      }
      
      if (window.isActive) {
        currentlyActive++;
      } else {
        currentlyInactive++;
      }
      
      // Flag mismatches
      if (window.isActive !== isCurrentlyActive) {
        console.log(`  ⚠️  MISMATCH: DB says ${window.isActive ? 'active' : 'inactive'}, should be ${isCurrentlyActive ? 'active' : 'inactive'}`);
      }
    });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Should be active: ${shouldBeActive}`);
    console.log(`Should be inactive: ${shouldBeInactive}`);
    console.log(`Currently marked active: ${currentlyActive}`);
    console.log(`Currently marked inactive: ${currentlyInactive}`);
    
    if (shouldBeInactive !== currentlyInactive) {
      console.log(`⚠️  Status mismatch detected! ${currentlyInactive} marked inactive, but ${shouldBeInactive} should be inactive`);
    }
    
    return {
      total: allWindows.length,
      shouldBeActive,
      shouldBeInactive,
      currentlyActive,
      currentlyInactive
    };
    
  } catch (error) {
    console.error('Error debugging windows:', error);
  }
}

// Test the update statuses logic
async function testUpdateStatuses() {
  try {
    console.log('\n=== TESTING UPDATE STATUSES ===');
    
    const now = new Date();
    
    // Update windows that should be active but aren't marked as active
    const activateResult = await Window.updateMany(
      {
        startDate: { $lte: now },
        endDate: { $gte: now },
        isActive: false
      },
      { isActive: true }
    );

    // Update windows that should be inactive but are marked as active
    const deactivateResult = await Window.updateMany(
      {
        $or: [
          { endDate: { $lt: now } },
          { startDate: { $gt: now } }
        ],
        isActive: true
      },
      { isActive: false }
    );

    console.log(`Activated ${activateResult.modifiedCount} windows`);
    console.log(`Deactivated ${deactivateResult.modifiedCount} windows`);
    console.log(`Total updated: ${activateResult.modifiedCount + deactivateResult.modifiedCount}`);
    
    return {
      activated: activateResult.modifiedCount,
      deactivated: deactivateResult.modifiedCount,
      total: activateResult.modifiedCount + deactivateResult.modifiedCount
    };
    
  } catch (error) {
    console.error('Error testing update statuses:', error);
  }
}

// Test delete inactive windows
async function testDeleteInactive() {
  try {
    console.log('\n=== TESTING DELETE INACTIVE ===');
    
    // First, get count of inactive windows
    const inactiveCount = await Window.countDocuments({ isActive: false });
    console.log(`Found ${inactiveCount} inactive windows to delete`);
    
    if (inactiveCount === 0) {
      console.log('No inactive windows to delete');
      return { deleted: 0 };
    }
    
    // Show which windows will be deleted
    const inactiveWindows = await Window.find({ isActive: false }).select('windowType projectType assessmentType startDate endDate');
    console.log('\nWindows to be deleted:');
    inactiveWindows.forEach((window, index) => {
      console.log(`  ${index + 1}. ${window.windowType} - ${window.projectType} (${window.assessmentType || 'N/A'}) - ${new Date(window.endDate).toLocaleDateString()}`);
    });
    
    // Delete inactive windows
    const deleteResult = await Window.deleteMany({ isActive: false });
    console.log(`\nDeleted ${deleteResult.deletedCount} inactive windows`);
    
    return { deleted: deleteResult.deletedCount };
    
  } catch (error) {
    console.error('Error testing delete inactive:', error);
  }
}

// Main function
async function main() {
  await connectDB();
  
  console.log('=== BEFORE UPDATE ===');
  const beforeStats = await debugWindows();
  
  console.log('\n=== UPDATING STATUSES ===');
  const updateStats = await testUpdateStatuses();
  
  console.log('\n=== AFTER UPDATE ===');
  const afterStats = await debugWindows();
  
  // Only delete if there are inactive windows and user confirms
  if (afterStats && afterStats.currentlyInactive > 0) {
    console.log(`\n⚠️  Found ${afterStats.currentlyInactive} inactive windows`);
    console.log('To delete them, uncomment the delete test below and run again');
    
    // Check if there are any windows left after deletion
    console.log(`\n⚠️  Found ${afterStats.currentlyInactive} inactive windows after deletion`);
    
    // Uncomment the line below to actually delete inactive windows
    // const deleteStats = await testDeleteInactive();
  }
  
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}

// Run the debug script
main().catch(console.error);