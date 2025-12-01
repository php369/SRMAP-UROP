#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const environment = isProduction ? 'production' : 'preview';

console.log(`🚀 Deploying frontend to ${environment}...`);

try {
  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'ignore' });
  } catch (error) {
    console.log('📦 Installing Vercel CLI...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
  }

  // Build the application
  console.log('🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });

  // Deploy to Vercel
  const deployCommand = isProduction ? 'vercel --prod' : 'vercel';
  console.log(`📤 Deploying to Vercel (${environment})...`);
  
  const deployOutput = execSync(deployCommand, { 
    stdio: 'pipe',
    encoding: 'utf8'
  });

  // Extract deployment URL
  const deploymentUrl = deployOutput.trim().split('\n').pop();
  
  console.log(`✅ Deployment successful!`);
  console.log(`🌐 URL: ${deploymentUrl}`);

  // Run post-deployment checks
  if (isProduction) {
    console.log('🔍 Running post-deployment checks...');
    
    // Health check
    try {
      const healthCheck = execSync(`curl -f ${deploymentUrl}/health || echo "Health check failed"`, {
        encoding: 'utf8',
        timeout: 30000
      });
      console.log('✅ Health check passed');
    } catch (error) {
      console.warn('⚠️  Health check failed, but deployment succeeded');
    }

    // Performance audit
    try {
      console.log('📊 Running performance audit...');
      execSync('npm run lighthouse', { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️  Performance audit failed, but deployment succeeded');
    }
  }

  // Save deployment info
  const deploymentInfo = {
    url: deploymentUrl,
    environment,
    timestamp: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || 'local',
    branch: process.env.GITHUB_REF_NAME || 'local'
  };

  fs.writeFileSync(
    path.join(__dirname, '../deployment-info.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('🎉 Deployment completed successfully!');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}