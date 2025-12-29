#!/usr/bin/env node

/**
 * Test script to verify assessment status updates work correctly
 * This script tests the flow: faculty grades -> student sees "pending release" -> coordinator releases -> student sees "graded"
 */

const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:3001/api';

// Test configuration
const TEST_CONFIG = {
  facultyToken: process.env.FACULTY_TOKEN || '',
  studentToken: process.env.STUDENT_TOKEN || '',
  coordinatorToken: process.env.COORDINATOR_TOKEN || '',
  testGroupId: process.env.TEST_GROUP_ID || '',
  testStudentId: process.env.TEST_STUDENT_ID || '',
  projectType: process.env.PROJECT_TYPE || 'IDP'
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

async function testAssessmentStatusFlow() {
  console.log('🧪 Testing Assessment Status Update Flow\n');

  try {
    // Step 1: Check initial student evaluation status
    console.log('1️⃣ Checking initial student evaluation status...');
    const initialEvaluations = await makeRequest('/student-evaluations/my', 'GET', null, TEST_CONFIG.studentToken);
    console.log(`   Found ${initialEvaluations.evaluations?.length || 0} evaluations`);
    
    if (initialEvaluations.evaluations?.length > 0) {
      const evaluation = initialEvaluations.evaluations[0];
      console.log(`   Status: ${evaluation.evaluation.isPublished ? 'Published' : 'Unpublished'}`);
      console.log(`   Has scores: ${hasAnyScores(evaluation.evaluation)}`);
    }

    // Step 2: Faculty grades a student (CLA-1)
    console.log('\n2️⃣ Faculty submitting CLA-1 grade...');
    const gradeResult = await makeRequest('/student-evaluations/internal/score', 'PUT', {
      studentId: TEST_CONFIG.testStudentId,
      groupId: TEST_CONFIG.testGroupId,
      component: 'cla1',
      conductScore: 15
    }, TEST_CONFIG.facultyToken);
    console.log(`   ✅ Grade submitted: ${gradeResult.message}`);

    // Step 3: Check student evaluation status after grading
    console.log('\n3️⃣ Checking student evaluation status after grading...');
    const afterGradingEvaluations = await makeRequest('/student-evaluations/my', 'GET', null, TEST_CONFIG.studentToken);
    
    if (afterGradingEvaluations.evaluations?.length > 0) {
      const evaluation = afterGradingEvaluations.evaluations[0];
      const isPublished = evaluation.evaluation.isPublished;
      const hasScores = hasAnyScores(evaluation.evaluation);
      
      console.log(`   Published: ${isPublished}`);
      console.log(`   Has scores: ${hasScores}`);
      console.log(`   Expected status: ${isPublished ? 'Graded' : hasScores ? 'Pending Release' : 'Under Review'}`);
      
      if (!isPublished && hasScores) {
        console.log('   ✅ Status should show "Pending Release" - CORRECT!');
      } else if (isPublished) {
        console.log('   ⚠️  Status shows "Graded" - grades already released');
      } else {
        console.log('   ❌ Status shows "Under Review" - grade not recorded properly');
      }
    }

    // Step 4: Coordinator releases grades
    console.log('\n4️⃣ Coordinator releasing final grades...');
    const releaseResult = await makeRequest('/control/grades/release-final', 'POST', {
      projectType: TEST_CONFIG.projectType
    }, TEST_CONFIG.coordinatorToken);
    console.log(`   ✅ Grades released: ${releaseResult.message}`);

    // Step 5: Check final student evaluation status
    console.log('\n5️⃣ Checking final student evaluation status...');
    const finalEvaluations = await makeRequest('/student-evaluations/my', 'GET', null, TEST_CONFIG.studentToken);
    
    if (finalEvaluations.evaluations?.length > 0) {
      const evaluation = finalEvaluations.evaluations[0];
      const isPublished = evaluation.evaluation.isPublished;
      
      console.log(`   Published: ${isPublished}`);
      console.log(`   Total score: ${evaluation.evaluation.total}`);
      
      if (isPublished) {
        console.log('   ✅ Status should show "Graded" - CORRECT!');
      } else {
        console.log('   ❌ Status still shows "Pending Release" - release failed');
      }
    }

    console.log('\n🎉 Assessment status flow test completed!');

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

function hasAnyScores(evaluation) {
  if (!evaluation) return false;
  return (
    evaluation.internal.cla1.conduct > 0 ||
    evaluation.internal.cla2.conduct > 0 ||
    evaluation.internal.cla3.conduct > 0 ||
    evaluation.external.reportPresentation.conduct > 0
  );
}

// Usage instructions
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Assessment Status Test Script

Usage:
  node test-assessment-status.js

Environment Variables:
  API_URL           - API base URL (default: http://localhost:3001/api)
  FACULTY_TOKEN     - JWT token for faculty user
  STUDENT_TOKEN     - JWT token for student user  
  COORDINATOR_TOKEN - JWT token for coordinator user
  TEST_GROUP_ID     - MongoDB ObjectId of test group
  TEST_STUDENT_ID   - MongoDB ObjectId of test student
  PROJECT_TYPE      - Project type (IDP, UROP, CAPSTONE)

Example:
  FACULTY_TOKEN=eyJ... STUDENT_TOKEN=eyJ... node test-assessment-status.js
`);
  process.exit(0);
}

// Validate required config
const requiredFields = ['facultyToken', 'studentToken', 'coordinatorToken', 'testGroupId', 'testStudentId'];
const missingFields = requiredFields.filter(field => !TEST_CONFIG[field]);

if (missingFields.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingFields.forEach(field => console.error(`   ${field.toUpperCase()}`));
  console.error('\nRun with --help for usage instructions');
  process.exit(1);
}

// Run the test
testAssessmentStatusFlow();