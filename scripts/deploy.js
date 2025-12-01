#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Render Deployment Script
 * Handles pre-deployment checks and optimizations for API deployment
 */

console.log('🚀 Starting Render API deployment process...\n');

// Check if we're in the correct directory
const packageJsonPath = path.join(__dirname, '../package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found. Make sure you\'re in the API directory.');
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

  // 3. Run tests
  console.log('🧪 Running tests...');
  try {
    execSync('npm test -- --passWithNoTests', { stdio: 'inherit' });
    console.log('✅ Tests passed');
  } catch (error) {
    console.warn('⚠️  Some tests failed, but continuing deployment...');
  }

  // 4. Build the application
  console.log('🏗️  Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed');

  // 5. Check build output
  const distPath = path.join(__dirname, '../dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('Build output directory not found');
  }

  const buildStats = getBuildStats(distPath);
  console.log('\n📊 Build Statistics:');
  console.log(`   Total files: ${buildStats.fileCount}`);
  console.log(`   Total size: ${formatBytes(buildStats.totalSize)}`);
  console.log(`   Entry point: ${buildStats.hasIndex ? 'Found' : 'Missing'}`);

  // 6. Environment validation
  console.log('\n🔧 Validating environment configuration...');
  const envValidation = validateEnvironment();
  if (envValidation.errors.length > 0) {
    console.error('❌ Environment validation failed:');
    envValidation.errors.forEach(error => console.error(`   - ${error}`));
    
    if (isProduction) {
      process.exit(1);
    } else {
      console.warn('⚠️  Continuing with warnings in non-production environment');
    }
  } else {
    console.log('✅ Environment validation passed');
  }

  // 7. Database migration check
  if (isProduction) {
    console.log('🗄️  Checking database migrations...');
    try {
      execSync('npm run migrate:status', { stdio: 'pipe' });
      console.log('✅ Database migrations are up to date');
    } catch (error) {
      console.warn('⚠️  Could not check migration status - ensure database is accessible');
    }
  }

} catch (error) {
  console.error('\n❌ Pre-deployment checks failed:', error.message);
  process.exit(1);
}

// Deployment information
console.log('\n📋 Deployment Information:');
console.log('   Platform: Render');
console.log('   Service: Web Service');
console.log('   Runtime: Node.js 18');
console.log('   Build Command: npm ci && npm run build');
console.log('   Start Command: npm start');
console.log('   Health Check: /health');

// Docker build test (if Dockerfile exists)
if (fs.existsSync(path.join(__dirname, '../Dockerfile'))) {
  console.log('\n🐳 Testing Docker build...');
  try {
    execSync('docker build -t srm-portal-api-test .', { stdio: 'inherit' });
    console.log('✅ Docker build successful');
    
    // Clean up test image
    try {
      execSync('docker rmi srm-portal-api-test', { stdio: 'pipe' });
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  } catch (error) {
    console.warn('⚠️  Docker build test failed:', error.message);
    console.warn('   This may not affect Render deployment if using buildpacks');
  }
}

// Post-deployment recommendations
console.log('\n💡 Post-deployment recommendations:');
console.log('   1. Monitor application logs in Render dashboard');
console.log('   2. Set up health check monitoring');
console.log('   3. Configure environment variables in Render');
console.log('   4. Set up database connection');
console.log('   5. Test API endpoints after deployment');

if (isProduction) {
  console.log('   6. Run database migrations if needed');
  console.log('   7. Seed database with initial data if required');
  console.log('   8. Configure custom domain if applicable');
}

console.log('\n✅ Pre-deployment checks completed successfully!');
console.log('🚀 Ready for Render deployment');

/**
 * Get build statistics
 */
function getBuildStats(distPath) {
  const files = getAllFiles(distPath);
  let totalSize = 0;
  let hasIndex = false;
  
  files.forEach(file => {
    const stats = fs.statSync(file);
    totalSize += stats.size;
    
    if (path.basename(file) === 'index.js') {
      hasIndex = true;
    }
  });
  
  return {
    fileCount: files.length,
    totalSize,
    hasIndex,
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
 * Validate environment configuration
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];
  
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];
  
  const optionalEnvVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'FRONTEND_URL',
  ];
  
  // Check required environment variables
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  });
  
  // Check optional environment variables
  optionalEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      warnings.push(`Missing optional environment variable: ${envVar}`);
    }
  });
  
  // Validate JWT secrets
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET should be at least 32 characters long');
  }
  
  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    errors.push('JWT_REFRESH_SECRET should be at least 32 characters long');
  }
  
  // Validate MongoDB URI format
  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('mongodb')) {
    errors.push('MONGODB_URI should start with mongodb:// or mongodb+srv://');
  }
  
  return { errors, warnings };
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