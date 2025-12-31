#!/usr/bin/env node

/**
 * Simple test script to verify assessment type implementation
 */

const { execSync } = require('child_process');

console.log('🧪 Testing Assessment Type Implementation...\n');

// Test 1: Check if TypeScript compiles without errors
console.log('1. Testing TypeScript compilation...');
try {
  execSync('cd apps/api && npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ API TypeScript compilation passed');
} catch (error) {
  console.log('❌ API TypeScript compilation failed:');
  console.log(error.stdout?.toString() || error.message);
}

try {
  execSync('cd apps/web && npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ Web TypeScript compilation passed');
} catch (error) {
  console.log('❌ Web TypeScript compilation failed:');
  console.log(error.stdout?.toString() || error.message);
}

// Test 2: Check if the migration script exists and is valid
console.log('\n2. Testing migration script...');
try {
  const fs = require('fs');
  const migrationPath = 'apps/api/src/scripts/migrate-student-evaluations.ts';
  if (fs.existsSync(migrationPath)) {
    console.log('✅ Migration script exists');
    
    // Check if it compiles
    execSync('cd apps/api && npx tsc src/scripts/migrate-student-evaluations.ts --outDir dist/scripts --moduleResolution node --esModuleInterop', { stdio: 'pipe' });
    console.log('✅ Migration script compiles successfully');
  } else {
    console.log('❌ Migration script not found');
  }
} catch (error) {
  console.log('❌ Migration script compilation failed:');
  console.log(error.stdout?.toString() || error.message);
}

// Test 3: Check if assessment helper utility exists
console.log('\n3. Testing assessment helper utility...');
try {
  const fs = require('fs');
  const helperPath = 'apps/web/src/utils/assessmentHelper.ts';
  if (fs.existsSync(helperPath)) {
    console.log('✅ Assessment helper utility exists');
  } else {
    console.log('❌ Assessment helper utility not found');
  }
} catch (error) {
  console.log('❌ Error checking assessment helper:', error.message);
}

console.log('\n🎉 Assessment Type Implementation Test Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Backup your database before running migration');
console.log('2. Run migration: cd apps/api && node migrate-evaluations.js');
console.log('3. Test the application with different assessment windows');
console.log('4. Verify that CLA-1, CLA-2, CLA-3, and External assessments are isolated');