#!/usr/bin/env node

const https = require('https');
const http = require('http');

const config = {
  frontend: {
    url: process.env.FRONTEND_URL || 'https://srm-portal-web.vercel.app',
    endpoints: [
      '/',
      '/projects',
      '/auth/login'
    ]
  },
  backend: {
    url: process.env.BACKEND_URL || 'https://srm-portal-api.onrender.com',
    endpoints: [
      '/health',
      '/api/v1/status',
      '/api/v1/status/ready',
      '/api/v1/status/live',
      '/docs'
    ]
  }
};

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const startTime = Date.now();
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          url,
          statusCode: res.statusCode,
          responseTime,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject({
        url,
        error: error.message
      });
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject({
        url,
        error: 'Request timeout'
      });
    });
  });
}

async function validateEndpoint(baseUrl, endpoint) {
  const fullUrl = `${baseUrl}${endpoint}`;
  
  try {
    const result = await makeRequest(fullUrl);
    
    const isHealthy = result.statusCode >= 200 && result.statusCode < 400;
    const status = isHealthy ? '✅' : '❌';
    
    console.log(`${status} ${fullUrl} - ${result.statusCode} (${result.responseTime}ms)`);
    
    if (!isHealthy) {
      console.log(`   Error: HTTP ${result.statusCode}`);
      if (result.body) {
        try {
          const errorData = JSON.parse(result.body);
          console.log(`   Message: ${errorData.message || errorData.error || 'Unknown error'}`);
        } catch (e) {
          console.log(`   Response: ${result.body.substring(0, 200)}...`);
        }
      }
    }
    
    return { url: fullUrl, healthy: isHealthy, ...result };
    
  } catch (error) {
    console.log(`❌ ${fullUrl} - ${error.error}`);
    return { url: fullUrl, healthy: false, error: error.error };
  }
}

async function validateService(serviceName, serviceConfig) {
  console.log(`\n🔍 Validating ${serviceName}...`);
  console.log(`Base URL: ${serviceConfig.url}`);
  console.log('─'.repeat(60));
  
  const results = [];
  
  for (const endpoint of serviceConfig.endpoints) {
    const result = await validateEndpoint(serviceConfig.url, endpoint);
    results.push(result);
  }
  
  const healthyCount = results.filter(r => r.healthy).length;
  const totalCount = results.length;
  const healthPercentage = Math.round((healthyCount / totalCount) * 100);
  
  console.log(`\n📊 ${serviceName} Health: ${healthyCount}/${totalCount} (${healthPercentage}%)`);
  
  return {
    service: serviceName,
    healthy: healthyCount === totalCount,
    healthPercentage,
    results
  };
}

async function validateDeployment() {
  console.log('🚀 SRM Project Portal - Deployment Validation');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  const validationResults = [];
  
  // Validate frontend
  const frontendResults = await validateService('Frontend', config.frontend);
  validationResults.push(frontendResults);
  
  // Validate backend
  const backendResults = await validateService('Backend', config.backend);
  validationResults.push(backendResults);
  
  // Overall summary
  console.log('\n📋 Deployment Summary');
  console.log('='.repeat(60));
  
  const allHealthy = validationResults.every(r => r.healthy);
  const overallStatus = allHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY';
  
  console.log(`Overall Status: ${overallStatus}`);
  console.log(`Validation Time: ${Date.now() - startTime}ms`);
  
  validationResults.forEach(result => {
    const status = result.healthy ? '✅' : '❌';
    console.log(`${status} ${result.service}: ${result.healthPercentage}%`);
  });
  
  // Detailed error reporting
  const unhealthyServices = validationResults.filter(r => !r.healthy);
  if (unhealthyServices.length > 0) {
    console.log('\n🚨 Issues Found:');
    console.log('─'.repeat(60));
    
    unhealthyServices.forEach(service => {
      console.log(`\n${service.service}:`);
      service.results.filter(r => !r.healthy).forEach(result => {
        console.log(`  ❌ ${result.url}: ${result.error || `HTTP ${result.statusCode}`}`);
      });
    });
  }
  
  // Performance summary
  console.log('\n⚡ Performance Summary:');
  console.log('─'.repeat(60));
  
  validationResults.forEach(service => {
    const responseTimes = service.results
      .filter(r => r.responseTime)
      .map(r => r.responseTime);
    
    if (responseTimes.length > 0) {
      const avgResponseTime = Math.round(
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      );
      const maxResponseTime = Math.max(...responseTimes);
      
      console.log(`${service.service}: Avg ${avgResponseTime}ms, Max ${maxResponseTime}ms`);
    }
  });
  
  // Security headers check (for production)
  if (process.env.NODE_ENV === 'production') {
    console.log('\n🔒 Security Headers Check:');
    console.log('─'.repeat(60));
    
    const securityEndpoints = [
      config.frontend.url,
      config.backend.url + '/health'
    ];
    
    for (const url of securityEndpoints) {
      try {
        const result = await makeRequest(url);
        const headers = result.headers;
        
        const securityHeaders = [
          'strict-transport-security',
          'x-content-type-options',
          'x-frame-options',
          'x-xss-protection',
          'content-security-policy'
        ];
        
        console.log(`\n${url}:`);
        securityHeaders.forEach(header => {
          const present = headers[header] ? '✅' : '❌';
          console.log(`  ${present} ${header}`);
        });
        
      } catch (error) {
        console.log(`❌ Could not check security headers for ${url}`);
      }
    }
  }
  
  // Exit with appropriate code
  if (allHealthy) {
    console.log('\n🎉 Deployment validation passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Deployment validation failed!');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--frontend-only')) {
  config.backend = null;
}

if (process.argv.includes('--backend-only')) {
  config.frontend = null;
}

// Custom URLs from command line
const frontendUrlArg = process.argv.find(arg => arg.startsWith('--frontend-url='));
if (frontendUrlArg) {
  config.frontend.url = frontendUrlArg.split('=')[1];
}

const backendUrlArg = process.argv.find(arg => arg.startsWith('--backend-url='));
if (backendUrlArg) {
  config.backend.url = backendUrlArg.split('=')[1];
}

// Run validation
validateDeployment().catch(error => {
  console.error('💥 Validation script failed:', error);
  process.exit(1);
});