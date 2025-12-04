#!/usr/bin/env node

/**
 * Prepare for deployment by ensuring no workspace references
 * This script runs before npm install to clean up any workspace issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Preparing for deployment...');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  console.log('❌ package.json not found in current directory');
  process.exit(1);
}

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log(`📦 Package: ${packageJson.name}`);

// Check for workspace dependencies
let hasWorkspace = false;

if (packageJson.dependencies) {
  Object.keys(packageJson.dependencies).forEach(dep => {
    if (packageJson.dependencies[dep].startsWith('workspace:')) {
      console.log(`⚠️  Found workspace dependency: ${dep}`);
      hasWorkspace = true;
      delete packageJson.dependencies[dep];
    }
  });
}

if (packageJson.devDependencies) {
  Object.keys(packageJson.devDependencies).forEach(dep => {
    if (packageJson.devDependencies[dep].startsWith('workspace:')) {
      console.log(`⚠️  Found workspace devDependency: ${dep}`);
      hasWorkspace = true;
      delete packageJson.devDependencies[dep];
    }
  });
}

if (hasWorkspace) {
  console.log('🔄 Removing workspace dependencies...');
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Workspace dependencies removed');
} else {
  console.log('✅ No workspace dependencies found');
}

console.log('✅ Ready for deployment!');
