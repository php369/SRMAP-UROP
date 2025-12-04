#!/usr/bin/env node

/**
 * Deployment Configuration Verification Script
 * Checks if all necessary files and configurations are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Deployment Configuration...\n');

let allChecks = true;

// Check function
function check(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
    return true;
  } else {
    console.log(`❌ ${message}`);
    allChecks = false;
    return false;
  }
}

// File checks
console.log('📁 Checking Configuration Files:\n');

check(
  fs.existsSync('apps/api/.env.production'),
  'Backend production environment file exists'
);

check(
  fs.existsSync('apps/web/.env.production'),
  'Frontend production environment file exists'
);

check(
  fs.existsSync('apps/web/vercel.json'),
  'Vercel configuration file exists'
);

check(
  fs.existsSync('render.yaml'),
  'Render configuration file exists'
);

check(
  fs.existsSync('apps/api/.npmrc'),
  'NPM configuration file exists in API'
);

// Check render.yaml configuration
console.log('\n🔧 Checking Render Configuration:\n');

try {
  const renderConfig = fs.readFileSync('render.yaml', 'utf8');
  
  check(
    renderConfig.includes('rootDirectory: apps/api'),
    'Render root directory set to apps/api'
  );
  
  check(
    renderConfig.includes('npm install --legacy-peer-deps'),
    'Render build command includes --legacy-peer-deps'
  );
  
  check(
    renderConfig.includes('healthCheckPath: /health'),
    'Render health check configured'
  );
  
  check(
    renderConfig.includes('https://srmap-urop-web.vercel.app'),
    'Render configured with production frontend URL'
  );
} catch (error) {
  console.log(`❌ Error reading render.yaml: ${error.message}`);
  allChecks = false;
}

// Check vercel.json configuration
console.log('\n🌐 Checking Vercel Configuration:\n');

try {
  const vercelConfig = JSON.parse(fs.readFileSync('apps/web/vercel.json', 'utf8'));
  
  check(
    vercelConfig.buildCommand === 'npm run build',
    'Vercel build command configured'
  );
  
  check(
    vercelConfig.outputDirectory === 'dist',
    'Vercel output directory set to dist'
  );
  
  check(
    vercelConfig.env && vercelConfig.env.VITE_API_BASE_URL,
    'Vercel environment variables configured'
  );
  
  check(
    vercelConfig.env.VITE_API_BASE_URL.includes('srm-portal-api.onrender.com'),
    'Vercel configured with production backend URL'
  );
} catch (error) {
  console.log(`❌ Error reading vercel.json: ${error.message}`);
  allChecks = false;
}

// Check .npmrc
console.log('\n📦 Checking NPM Configuration:\n');

try {
  const npmrc = fs.readFileSync('apps/api/.npmrc', 'utf8');
  
  check(
    npmrc.includes('legacy-peer-deps=true'),
    'NPM configured for legacy peer dependencies'
  );
} catch (error) {
  console.log(`❌ Error reading .npmrc: ${error.message}`);
  allChecks = false;
}

// Check environment files content
console.log('\n🔐 Checking Environment Variables:\n');

try {
  const apiEnvProd = fs.readFileSync('apps/api/.env.production', 'utf8');
  
  check(
    apiEnvProd.includes('NODE_ENV=production'),
    'Backend NODE_ENV set to production'
  );
  
  check(
    apiEnvProd.includes('MONGODB_URI='),
    'Backend MongoDB URI configured'
  );
  
  check(
    apiEnvProd.includes('JWT_SECRET='),
    'Backend JWT secret configured'
  );
  
  check(
    apiEnvProd.includes('GOOGLE_CLIENT_ID='),
    'Backend Google OAuth configured'
  );
  
  check(
    apiEnvProd.includes('CLOUDINARY_CLOUD_NAME='),
    'Backend Cloudinary configured'
  );
  
  check(
    apiEnvProd.includes('https://srmap-urop-web.vercel.app'),
    'Backend configured with production frontend URL'
  );
} catch (error) {
  console.log(`❌ Error reading backend .env.production: ${error.message}`);
  allChecks = false;
}

try {
  const webEnvProd = fs.readFileSync('apps/web/.env.production', 'utf8');
  
  check(
    webEnvProd.includes('VITE_ENVIRONMENT=production'),
    'Frontend environment set to production'
  );
  
  check(
    webEnvProd.includes('https://srm-portal-api.onrender.com'),
    'Frontend configured with production backend URL'
  );
  
  check(
    webEnvProd.includes('VITE_ENABLE_DEBUG=false'),
    'Frontend debug mode disabled'
  );
  
  check(
    webEnvProd.includes('wss://srm-portal-api.onrender.com'),
    'Frontend WebSocket configured for production'
  );
} catch (error) {
  console.log(`❌ Error reading frontend .env.production: ${error.message}`);
  allChecks = false;
}

// Check documentation
console.log('\n📚 Checking Documentation:\n');

check(
  fs.existsSync('QUICK_DEPLOY.md'),
  'Quick deployment guide exists'
);

check(
  fs.existsSync('DEPLOYMENT_CHECKLIST.md'),
  'Deployment checklist exists'
);

check(
  fs.existsSync('PRODUCTION_DEPLOYMENT.md'),
  'Production deployment guide exists'
);

check(
  fs.existsSync('DEPLOYMENT_SUMMARY.md'),
  'Deployment summary exists'
);

// Final summary
console.log('\n' + '='.repeat(50));
if (allChecks) {
  console.log('✅ All checks passed! Ready for deployment.');
  console.log('\n📖 Next steps:');
  console.log('   1. Read QUICK_DEPLOY.md for deployment instructions');
  console.log('   2. Follow DEPLOYMENT_CHECKLIST.md step by step');
  console.log('   3. Deploy backend to Render');
  console.log('   4. Deploy frontend to Vercel');
  console.log('   5. Configure Google OAuth');
  console.log('   6. Test the deployment');
  console.log('\n🚀 Good luck with your deployment!');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  console.log('\n📖 Refer to PRODUCTION_DEPLOYMENT.md for help.');
  process.exit(1);
}
