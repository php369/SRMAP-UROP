#!/usr/bin/env node

/**
 * Test script to verify the grading fixes work correctly
 */

const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:3001/api';

// Test configuration
const TEST_CONFIG = {
  facultyToken: process.env.FACULTY_TOKEN || '',
  studentToken: process.env.STUDENT_TOKEN || '',
  testGroupId: process.env.TEST_GROUP_ID || '',
  testStudentId: process.env.TEST_STUDENT_ID || ''
};

async function makeRequest(endpoint, method = 'GET', data = null, token = '') {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Request failed: ${method} ${endpoint}`);
    console.error(`   Error: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testGradingFixes() {
  console.log('🧪 Testing Grading Fixes\n');

  try {
    // Test 1: Check student evaluations endpoint
    console.log('1️⃣ Testing student evaluations endpoint...');
    const studentEvaluations = await makeRequest('/student-evaluations/my', 'GET', null, TEST_CONFIG.studentToken);
    console.log(`   ✅ Student evaluations response:`, JSON.stringify(studentEvaluations, null, 2));

    // Test 2: Submit a grade as faculty
    console.log('\n2️⃣ Testing faculty grade submission...');
    const gradeResult = await makeRequest('/student-evaluations/internal/score', 'PUT', {
      studentId: TEST_CONFIG.testStudentId,
      groupId: TEST_CONFIG.testGroupId,
      component: 'cla1',
      conductScore: 18,
      comments: 'Great work on the project proposal!'
    }, TEST_CONFIG.facultyToken);
    console.log(`   ✅ Grade submission result:`, gradeResult);

    // Test 3: Check student evaluations after grading
    console.log('\n3️⃣ Checking student evaluations after grading...');
    const updatedEvaluations = await makeRequest('/student-evaluations/my', 'GET', null, TEST_CONFIG.studentToken);
    console.log(`   ✅ Updated evaluations:`, JSON.stringify(updatedEvaluations, null, 2));

    // Test 4: Check faculty submissions view
    console.log('\n4️⃣ Testing faculty submissions view...');
    const facultySubmissions = await makeRequest('/student-evaluations/submissions', 'GET', null, TEST_CONFIG.facultyToken);
    console.log(`   ✅ Faculty submissions:`, JSON.stringify(facultySubmissions, null, 2));

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Usage instructions
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Grading Fixes Test Script

Usage:
  node test-grading-fixes.js

Environment Variables:
  API_URL           - API base URL (default: http://localhost:3001/api)
  FACULTY_TOKEN     - JWT token for faculty user
  STUDENT_TOKEN     - JWT token for student user  
  TEST_GROUP_ID     - MongoDB ObjectId of test group
  TEST_STUDENT_ID   - MongoDB ObjectId of test student

Example:
  FACULTY_TOKEN=eyJ... STUDENT_TOKEN=eyJ... node test-grading-fixes.js
`);
  process.exit(0);
}

// Validate required config
const requiredFields = ['facultyToken', 'studentToken', 'testGroupId', 'testStudentId'];
const missingFields = requiredFields.filter(field => !TEST_CONFIG[field]);

if (missingFields.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingFields.forEach(field => console.error(`   ${field.toUpperCase()}`));
  console.error('\nRun with --help for usage instructions');
  process.exit(1);
}

// Run the test
testGradingFixes();