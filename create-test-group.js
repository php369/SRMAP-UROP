// Simple test script to create a group for testing submission system
const axios = require('axios');

const API_BASE_URL = 'https://srm-portal-api.onrender.com/api/v1';

async function createTestGroup() {
  try {
    console.log('🧪 Creating test group for submission testing...');

    // Test user credentials (you'll need to get actual auth tokens)
    const leaderUserId = '6935dd6512270c6312b72ee0'; // krishna sharma
    const memberUserId = '6935dd6512270c6312b72edd'; // Rudra Patel

    console.log('👤 Leader User ID:', leaderUserId);
    console.log('👤 Member User ID:', memberUserId);

    // Note: This script requires authentication tokens
    // You would need to:
    // 1. Login as the leader user to get auth token
    // 2. Create a group
    // 3. Login as the member user to get auth token  
    // 4. Join the group using the group code

    console.log('📝 Manual steps to test:');
    console.log('1. Login as krishna sharma (leader)');
    console.log('2. Go to Application page and create a group');
    console.log('3. Note the group code');
    console.log('4. Login as Rudra Patel (member)');
    console.log('5. Go to Application page and join the group using the code');
    console.log('6. Both users should now see proper submission behavior');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestGroup();