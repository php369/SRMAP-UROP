const axios = require('axios');

// Test the applications API endpoint
async function testApplicationsAPI() {
  try {
    console.log('Testing applications API...');
    
    // First, let's test without authentication to see if server is running
    try {
      const response = await axios.get('http://localhost:3001/api/v1/applications');
      console.log('✅ API server is running');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ API server is running (got 401 as expected without auth)');
      } else {
        console.log('❌ API server might not be running:', error.message);
        return;
      }
    }
    
    // Test with a mock token (this will fail but we can see the response)
    try {
      const response = await axios.get('http://localhost:3001/api/v1/applications/my-application', {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });
      console.log('Response:', response.data);
    } catch (error) {
      console.log('Expected error (invalid token):', error.response?.status, error.response?.data?.error?.message);
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testApplicationsAPI();