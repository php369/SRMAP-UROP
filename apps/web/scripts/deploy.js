#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Vercel Deployment Script
 * Handles pre-deployment checks and optimizations
 */

console.log('🚀 Starting Vercel deployment process...\n');

// Check if we're in the correct directory
const packageJsonPath = path.join(__dirname, '../package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found. Make sure you\'re in the web app directory.');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
console.log(`📦 Deploying ${packageJson.name} v${packageJson.version}`);

// Environment checks
const environment = process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';

console.log(`🌍 Environment: ${environment}`);
console.log(`🏗️  Production build: ${isProduction ? 'Yes' : 'No'}`);

// Pre-deployment checks
console.log('\n🔍 Running pre-deployment checks...');

try {
  // 1. Type checking
  console.log('📝 Type checking...');
  execSync('npm run type-check', { stdio: 'inherit' });
  console.log('✅ Type checking passed');

  // 2. Linting
  console.log('🔍 Linting...');
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('✅ Linting passed');

  // 3. Build the application
  console.log('🏗️  Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed');

  // 4. Bundle analysis (if enabled)
  if (process.env.ANALYZE_BUNDLE === 'true') {
    console.log('📊 Analyzing bundle...');
    try {
      execSync('npm run analyze', { stdio: 'inherit' });
      console.log('✅ Bundle analysis completed');
    } catch (error) {
      console.warn('⚠️  Bundle analysis failed, continuing deployment...');
    }
  }

  // 5. Check build output
  const distPath = path.join(__dirname, '../dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('Build output directory not found');
  }

  const buildStats = getBuildStats(distPath);
  console.log('\n📊 Build Statistics:');
  console.log(`   Total files: ${buildStats.fileCount}`);
  console.log(`   Total size: ${formatBytes(buildStats.totalSize)}`);
  console.log(`   Largest file: ${buildStats.largestFile.name} (${formatBytes(buildStats.largestFile.size)})`);

  // Performance budget check
  const budgetViolations = checkPerformanceBudget(buildStats);
  if (budgetViolations.length > 0) {
    console.warn('\n⚠️  Performance budget violations:');
    budgetViolations.forEach(violation => console.warn(`   - ${violation}`));
    
    if (isProduction && process.env.STRICT_BUDGET === 'true') {
      console.error('\n❌ Deployment blocked due to performance budget violations');
      process.exit(1);
    }
  }

} catch (error) {
  console.error('\n❌ Pre-deployment checks failed:', error.message);
  process.exit(1);
}

// Deployment
console.log('\n🚀 Deploying to Vercel...');

try {
  const deployCommand = isProduction ? 'vercel --prod' : 'vercel';
  
  // Add environment variables if specified
  const envVars = getEnvironmentVariables();
  const envFlags = envVars.map(env => `--env ${env.key}=${env.value}`).join(' ');
  
  const fullCommand = `${deployCommand} ${envFlags}`.trim();
  
  console.log(`📋 Command: ${deployCommand}`);
  if (envVars.length > 0) {
    console.log(`🔧 Environment variables: ${envVars.length} variables`);
  }
  
  execSync(fullCommand, { stdio: 'inherit' });
  
  console.log('\n✅ Deployment completed successfully!');
  
  // Post-deployment tasks
  if (isProduction) {
    console.log('\n🔍 Running post-deployment checks...');
    
    // You could add smoke tests here
    console.log('💨 Smoke tests: Skipped (implement if needed)');
    
    // Performance monitoring
    if (process.env.RUN_LIGHTHOUSE === 'true') {
      console.log('🔍 Running Lighthouse audit...');
      try {
        execSync('npm run lighthouse', { stdio: 'inherit' });
        console.log('✅ Lighthouse audit completed');
      } catch (error) {
        console.warn('⚠️  Lighthouse audit failed:', error.message);
      }
    }
  }
  
  console.log('\n🎉 Deployment process completed successfully!');
  
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  process.exit(1);
}

/**
 * Get build statistics
 */
function getBuildStats(distPath) {
  const files = getAllFiles(distPath);
  let totalSize = 0;
  let largestFile = { name: '', size: 0 };
  
  files.forEach(file => {
    const stats = fs.statSync(file);
    totalSize += stats.size;
    
    if (stats.size > largestFile.size) {
      largestFile = {
        name: path.relative(distPath, file),
        size: stats.size,
      };
    }
  });
  
  return {
    fileCount: files.length,
    totalSize,
    largestFile,
  };
}

/**
 * Get all files recursively
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

/**
 * Check performance budget
 */
function checkPerformanceBudget(buildStats) {
  const violations = [];
  
  // Total bundle size budget: 2MB
  if (buildStats.totalSize > 2 * 1024 * 1024) {
    violations.push(`Total bundle size (${formatBytes(buildStats.totalSize)}) exceeds 2MB budget`);
  }
  
  // Individual file size budget: 1MB
  if (buildStats.largestFile.size > 1024 * 1024) {
    violations.push(`Largest file (${buildStats.largestFile.name}: ${formatBytes(buildStats.largestFile.size)}) exceeds 1MB budget`);
  }
  
  // File count budget: 100 files
  if (buildStats.fileCount > 100) {
    violations.push(`File count (${buildStats.fileCount}) exceeds 100 files budget`);
  }
  
  return violations;
}

/**
 * Get environment variables for deployment
 */
function getEnvironmentVariables() {
  const envVars = [];
  
  // Add environment-specific variables
  const envFile = isProduction ? '.env.production' : '.env.local';
  const envPath = path.join(__dirname, '..', envFile);
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        envVars.push({ key: key.trim(), value: value.trim() });
      }
    });
  }
  
  return envVars;
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}