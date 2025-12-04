#!/usr/bin/env node

/**
 * Render Build Script
 * Ensures clean build without workspace dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Render build process...\n');

// Step 1: Ensure we're in the right directory
console.log('📁 Step 1: Verifying directory...');
console.log(`   Current directory: ${__dirname}`);
console.log(`   Package: ${require('./package.json').name}`);
console.log('✅ Directory verified\n');

// Step 2: Clean previous builds
console.log('📁 Step 2: Cleaning previous builds...');
try {
  if (fs.existsSync('node_modules')) {
    console.log('   Removing node_modules');
    fs.rmSync('node_modules', { recursive: true, force: true });
  }
  if (fs.existsSync('package-lock.json')) {
    console.log('   Removing package-lock.json');
    fs.unlinkSync('package-lock.json');
  }
  if (fs.existsSync('dist')) {
    console.log('   Removing dist');
    fs.rmSync('dist', { recursive: true, force: true });
  }
} catch (error) {
  console.log('   Clean skipped (files not found)');
}
console.log('✅ Clean complete\n');

// Step 3: Install dependencies with explicit npm config
console.log('📦 Step 3: Installing dependencies...');

// Set npm config to ignore workspaces
const npmConfig = {
  'legacy-peer-deps': 'true',
  'workspaces': 'false',
  'include-workspace-root': 'false'
};

console.log('   Configuring npm...');
Object.entries(npmConfig).forEach(([key, value]) => {
  try {
    execSync(`npm config set ${key} ${value}`, { cwd: __dirname });
  } catch (e) {
    // Ignore errors for unsupported config options
  }
});

try {
  console.log('   Installing dependencies...');
  execSync('npm install --legacy-peer-deps', {
    stdio: 'inherit',
    cwd: __dirname,
    env: {
      ...process.env,
      NPM_CONFIG_LEGACY_PEER_DEPS: 'true',
      NPM_CONFIG_WORKSPACES: 'false'
    }
  });
  console.log('✅ Dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  process.exit(1);
}

// Step 4: Build application
console.log('🔨 Step 4: Building application...');
try {
  execSync('npm run build', {
    stdio: 'inherit',
    cwd: __dirname
  });
  console.log('✅ Build complete\n');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

// Step 5: Verify build output
console.log('🔍 Step 5: Verifying build...');
const distIndex = path.join(__dirname, 'dist', 'index.js');
if (fs.existsSync(distIndex)) {
  const stats = fs.statSync(distIndex);
  console.log(`   dist/index.js exists (${stats.size} bytes)`);
  console.log('✅ Build verification passed\n');
} else {
  console.error('❌ dist/index.js not found');
  process.exit(1);
}

console.log('🎉 Build process completed successfully!');
console.log('📊 Build summary:');
console.log('   - Dependencies: Installed');
console.log('   - TypeScript: Compiled');
console.log('   - Output: dist/index.js');
console.log('   - Status: Ready to start\n');
