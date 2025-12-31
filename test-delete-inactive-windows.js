const axios = require('axios');

// Test the delete inactive windows functionality
async function testDeleteInactiveWindows() {
  try {
    console.log('Testing delete inactive windows functionality...');
    
    // You'll need to replace this with a valid auth token
    const authToken = 'your-auth-token-here';
    
    const response = await axios.delete('http://localhost:3001/api/v1/control/windows/inactive', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response:', response.data);
    
    if (response.data.success) {
      console.log(`✅ Successfully deleted ${response.data.data.deleted} inactive windows`);
    } else {
      console.log('❌ Failed to delete inactive windows:', response.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing delete inactive windows:', error.response?.data || error.message);
  }
}

// Test getting inactive windows count
async function testGetInactiveCount() {
  try {
    console.log('Testing get inactive windows count...');
    
    const authToken = 'your-auth-token-here';
    
    const response = await axios.get('http://localhost:3001/api/v1/control/windows/inactive/count', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Inactive count response:', response.data);
    
    if (response.data.success) {
      console.log(`✅ Found ${response.data.data.count} inactive windows`);
    } else {
      console.log('❌ Failed to get inactive count:', response.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error getting inactive count:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('=== Testing Delete Inactive Windows Functionality ===\n');
  
  await testGetInactiveCount();
  console.log('\n---\n');
  await testDeleteInactiveWindows();
  
  console.log('\n=== Tests Complete ===');
}

// Uncomment to run the tests (make sure to add a valid auth token first)
// runTests();

console.log('Test script created. To run:');
console.log('1. Add a valid auth token to the script');
console.log('2. Make sure the API server is running');
console.log('3. Uncomment the runTests() call and run: node test-delete-inactive-windows.js');