const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/srm-portal';

async function debugGroups() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Import models
    const { Group } = require('./apps/api/dist/models/Group');
    const { User } = require('./apps/api/dist/models/User');

    // Test user IDs from the logs
    const testUserIds = [
      '6935dd6512270c6312b72ee0', // krishna sharma (group leader)
      '6935dd6512270c6312b72edd'  // Rudra Patel (group member)
    ];

    console.log('\n=== DEBUGGING GROUP DETECTION ===\n');

    for (const userId of testUserIds) {
      console.log(`\n--- Checking user: ${userId} ---`);
      
      // Check if user exists
      const user = await User.findById(userId);
      console.log('User found:', !!user);
      if (user) {
        console.log('User details:', {
          name: user.name,
          email: user.email,
          role: user.role
        });
      }

      // Check all groups where user is a member
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const allGroups = await Group.find({ members: userObjectId });
      console.log('All groups where user is member:', allGroups.length);
      
      for (const group of allGroups) {
        console.log('Group details:', {
          id: group._id.toString(),
          groupCode: group.groupCode,
          status: group.status,
          leaderId: group.leaderId.toString(),
          memberCount: group.members.length,
          members: group.members.map(m => m.toString()),
          isLeader: group.leaderId.toString() === userId
        });
      }

      // Check groups with specific status filter (same as getUserGroup)
      const activeGroups = await Group.find({
        members: userObjectId,
        status: { $in: ['forming', 'complete', 'applied', 'approved', 'frozen'] }
      });
      console.log('Active groups (with status filter):', activeGroups.length);

      // Check if user is a leader of any group
      const leaderGroups = await Group.find({ leaderId: userObjectId });
      console.log('Groups where user is leader:', leaderGroups.length);
    }

    // Check all groups in the system
    console.log('\n--- ALL GROUPS IN SYSTEM ---');
    const allGroups = await Group.find({});
    console.log('Total groups in database:', allGroups.length);
    
    for (const group of allGroups) {
      console.log('Group:', {
        id: group._id.toString(),
        groupCode: group.groupCode,
        status: group.status,
        projectType: group.projectType,
        leaderId: group.leaderId.toString(),
        memberCount: group.members.length,
        members: group.members.map(m => m.toString())
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugGroups();