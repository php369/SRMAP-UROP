#!/usr/bin/env node

const https = require('https');
const http = require('http');

/**
 * Comprehensive API Testing Script for SRM Project Portal
 * Tests all API endpoints to ensure deployment readiness
 */

const API_BASE_URL = 'http://localhost:3001';
const API_V1_URL = `${API_BASE_URL}/api/v1`;

console.log('🧪 Starting Comprehensive API Testing for SRM Project Portal');
console.log('='.repeat(70));

const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

function addResult(type, endpoint, status, message, details = null) {
  testResults[type].push({
    endpoint,
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  });
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const startTime = Date.now();
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            url,
            statusCode: res.statusCode,
            responseTime,
            headers: res.headers,
            body: jsonData,
            rawBody: data
          });
        } catch (error) {
          resolve({
            url,
            statusCode: res.statusCode,
            responseTime,
            headers: res.headers,
            body: data,
            rawBody: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject({
        url,
        error: error.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject({
        url,
        error: 'Request timeout'
      });
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testEndpoint(name, url, expectedStatus = 200, options = {}) {
  console.log(`Testing ${name}...`);
  
  try {
    const result = await makeRequest(url, options);
    
    if (result.statusCode === expectedStatus) {
      addResult('passed', name, result.statusCode, `✅ ${name} - ${result.statusCode} (${result.responseTime}ms)`);
      console.log(`  ✅ ${result.statusCode} (${result.responseTime}ms)`);
      return result;
    } else {
      addResult('failed', name, result.statusCode, `❌ ${name} - Expected ${expectedStatus}, got ${result.statusCode}`, result.body);
      console.log(`  ❌ Expected ${expectedStatus}, got ${result.statusCode}`);
      return result;
    }
  } catch (error) {
    addResult('failed', name, 'ERROR', `❌ ${name} - ${error.error}`, error);
    console.log(`  ❌ ${error.error}`);
    return null;
  }
}

async function testCORS(name, url) {
  console.log(`Testing CORS for ${name}...`);
  
  try {
    const result = await makeRequest(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });
    
    const corsHeaders = result.headers;
    const hasOrigin = corsHeaders['access-control-allow-origin'];
    const hasMethods = corsHeaders['access-control-allow-methods'];
    const hasHeaders = corsHeaders['access-control-allow-headers'];
    
    if (hasOrigin && hasMethods && hasHeaders) {
      addResult('passed', `${name} CORS`, result.statusCode, `✅ CORS configured for ${name}`);
      console.log(`  ✅ CORS properly configured`);
    } else {
      addResult('failed', `${name} CORS`, result.statusCode, `❌ CORS not properly configured for ${name}`);
      console.log(`  ❌ CORS not properly configured`);
    }
  } catch (error) {
    addResult('failed', `${name} CORS`, 'ERROR', `❌ CORS test failed for ${name}`, error);
    console.log(`  ❌ CORS test failed: ${error.error}`);
  }
}

async function runAPITests() {
  console.log('\n1. 🏥 Health Check Endpoints');
  console.log('-'.repeat(50));
  
  await testEndpoint('Health Check', `${API_BASE_URL}/health`);
  await testEndpoint('API Status', `${API_V1_URL}/status`);
  await testEndpoint('Ready Check', `${API_V1_URL}/status/ready`);
  await testEndpoint('Live Check', `${API_V1_URL}/status/live`);
  
  console.log('\n2. 🔐 Authentication Endpoints');
  console.log('-'.repeat(50));
  
  await testEndpoint('Google Auth URL', `${API_V1_URL}/auth/google/url`);
  await testEndpoint('Auth Status', `${API_V1_URL}/auth/status`, 401); // Should fail without token
  await testEndpoint('Logout', `${API_V1_URL}/auth/logout`, 401); // Should fail without token
  
  console.log('\n3. 👥 User Management Endpoints');
  console.log('-'.repeat(50));
  
  await testEndpoint('Get Users', `${API_V1_URL}/users`, 401); // Should fail without token
  await testEndpoint('Get Profile', `${API_V1_URL}/users/profile`, 401); // Should fail without token
  
  console.log('\n4. 📚 Project Management Endpoints');
  console.log('-'.repeat(50));
  
  await testEndpoint('Get Projects', `${API_V1_URL}/projects`, 401); // Should fail without token
  await testEndpoint('Create Project', `${API_V1_URL}/projects`, 401, { method: 'POST' }); // Should fail without token
  
  console.log('\n5. 👥 Group Management Endpoints');
  console.log('-'.repeat(50));
  
  await testEndpoint('Get Groups', `${API_V1_URL}/groups`, 401); // Should fail without token
  await testEndpoint('Create Group', `${API_V1_URL}/groups`, 401, { method: 'POST' }); // Should fail without token
  
  console.log('\n7. 📝 Assessment Endpoints');
  console.log('-'.repeat(50));
  
  await testEndpoint('Get Assessments', `${API_V1_URL}/assessments`, 401); // Should fail without token
  await testEndpoint('Create Assessment', `${API_V1_URL}/assessments`, 401, { method: 'POST' }); // Should fail without token
  
  console.log('\n8. 📤 Submission Endpoints');
  console.log('-'.repeat(50));
  
  await testEndpoint('Get Submissions', `${API_V1_URL}/submissions`, 401); // Should fail without token
  await testEndpoint('Create Submission', `${API_V1_URL}/submissions`, 401, { method: 'POST' }); // Should fail without token
  
  console.log('\n9. 📋 Application Endpoints');
  console.log('-'.repeat(50));
  
  await testEndpoint('Get Applications', `${API_V1_URL}/applications`, 401); // Should fail without token
  await testEndpoint('Create Application', `${API_V1_URL}/applications`, 401, { method: 'POST' }); // Should fail without token
  
  console.log('\n10. 🏛️ Admin Endpoints');
  console.log('-'.repeat(50));
  
  await testEndpoint('Admin Dashboard', `${API_V1_URL}/admin/dashboard`, 401); // Should fail without token
  await testEndpoint('Admin Users', `${API_V1_URL}/admin/users`, 401); // Should fail without token
  
  console.log('\n11. 🌐 CORS Configuration Tests');
  console.log('-'.repeat(50));
  
  await testCORS('Projects', `${API_V1_URL}/projects`);
  await testCORS('Users', `${API_V1_URL}/users`);
  await testCORS('Auth', `${API_V1_URL}/auth/status`);
  
  console.log('\n12. 📚 API Documentation');
  console.log('-'.repeat(50));
  
  await testEndpoint('API Docs', `${API_BASE_URL}/docs/`);
  await testEndpoint('OpenAPI Spec', `${API_BASE_URL}/docs/swagger.json`);
  
  console.log('\n13. 🔒 Security Headers Test');
  console.log('-'.repeat(50));
  
  try {
    const result = await makeRequest(`${API_BASE_URL}/health`);
    const headers = result.headers;
    
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy'
    ];
    
    console.log('Checking security headers...');
    securityHeaders.forEach(header => {
      if (headers[header]) {
        addResult('passed', `Security Header: ${header}`, 'PRESENT', `✅ ${header} header present`);
        console.log(`  ✅ ${header}: ${headers[header]}`);
      } else {
        addResult('warnings', `Security Header: ${header}`, 'MISSING', `⚠️ ${header} header missing`);
        console.log(`  ⚠️ ${header}: missing`);
      }
    });
  } catch (error) {
    addResult('failed', 'Security Headers', 'ERROR', 'Failed to check security headers', error);
    console.log('  ❌ Failed to check security headers');
  }
  
  console.log('\n14. ⚡ Performance Tests');
  console.log('-'.repeat(50));
  
  // Test response times
  const performanceEndpoints = [
    { name: 'Health Check', url: `${API_BASE_URL}/health` },
    { name: 'API Status', url: `${API_V1_URL}/status` },
    { name: 'Auth URL', url: `${API_V1_URL}/auth/google/url` }
  ];
  
  for (const endpoint of performanceEndpoints) {
    try {
      const result = await makeRequest(endpoint.url);
      if (result.responseTime < 1000) {
        addResult('passed', `Performance: ${endpoint.name}`, result.responseTime, `✅ ${endpoint.name} responds in ${result.responseTime}ms`);
        console.log(`  ✅ ${endpoint.name}: ${result.responseTime}ms`);
      } else {
        addResult('warnings', `Performance: ${endpoint.name}`, result.responseTime, `⚠️ ${endpoint.name} slow response: ${result.responseTime}ms`);
        console.log(`  ⚠️ ${endpoint.name}: ${result.responseTime}ms (slow)`);
      }
    } catch (error) {
      addResult('failed', `Performance: ${endpoint.name}`, 'ERROR', `❌ Performance test failed for ${endpoint.name}`, error);
      console.log(`  ❌ ${endpoint.name}: test failed`);
    }
  }
  
  // Generate comprehensive report
  console.log('\n' + '='.repeat(70));
  console.log('🧪 API TESTING REPORT');
  console.log('='.repeat(70));
  
  console.log(`\n✅ PASSED: ${testResults.passed.length}`);
  testResults.passed.forEach(result => {
    console.log(`   ${result.message}`);
  });
  
  if (testResults.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS: ${testResults.warnings.length}`);
    testResults.warnings.forEach(result => {
      console.log(`   ${result.message}`);
    });
  }
  
  if (testResults.failed.length > 0) {
    console.log(`\n❌ FAILED: ${testResults.failed.length}`);
    testResults.failed.forEach(result => {
      console.log(`   ${result.message}`);
      if (result.details && typeof result.details === 'object') {
        console.log(`      Details: ${JSON.stringify(result.details, null, 2).substring(0, 200)}...`);
      }
    });
  }
  
  // Overall assessment
  console.log('\n' + '='.repeat(70));
  const totalTests = testResults.passed.length + testResults.warnings.length + testResults.failed.length;
  const successRate = Math.round((testResults.passed.length / totalTests) * 100);
  
  console.log(`📊 OVERALL RESULTS:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Success Rate: ${successRate}%`);
  console.log(`   Passed: ${testResults.passed.length}`);
  console.log(`   Warnings: ${testResults.warnings.length}`);
  console.log(`   Failed: ${testResults.failed.length}`);
  
  if (testResults.failed.length === 0) {
    console.log('\n🎉 API TESTING PASSED - All critical endpoints working!');
    if (testResults.warnings.length > 0) {
      console.log(`⚠️  Note: ${testResults.warnings.length} warnings to review`);
    }
  } else {
    console.log(`\n💥 API TESTING FAILED - ${testResults.failed.length} critical issues found`);
  }
  
  // Save detailed report
  const fs = require('fs');
  const reportPath = 'api-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: testResults.passed.length,
      warnings: testResults.warnings.length,
      failed: testResults.failed.length,
      successRate
    },
    results: testResults
  }, null, 2));
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return testResults.failed.length === 0;
}

// Run the tests
runAPITests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('\n💥 API testing script failed:', error);
  process.exit(1);
});