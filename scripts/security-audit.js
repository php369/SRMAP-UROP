#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Comprehensive Security Audit Script for SRM Project Portal
 * Performs automated security checks across the entire application
 */

console.log('🔒 Starting Security Audit for SRM Project Portal\n');

const auditResults = {
  passed: [],
  warnings: [],
  failed: [],
  info: []
};

// Helper functions
function addResult(type, check, message, details = null) {
  auditResults[type].push({
    check,
    message,
    details,
    timestamp: new Date().toISOString()
  });
}

function runCommand(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', ...options });
  } catch (error) {
    return null;
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function scanDirectory(dir, pattern, recursive = true) {
  const results = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && recursive) {
        if (!item.startsWith('.') && item !== 'node_modules') {
          scan(fullPath);
        }
      } else if (stat.isFile() && pattern.test(item)) {
        results.push(fullPath);
      }
    }
  }
  
  if (fs.existsSync(dir)) {
    scan(dir);
  }
  
  return results;
}

// Security Checks

console.log('1. 🔍 Checking Environment Configuration...');

function checkEnvironmentSecurity() {
  // Check for .env files in version control
  const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
  const gitignoreContent = readFileContent('.gitignore') || '';
  
  envFiles.forEach(envFile => {
    if (checkFileExists(envFile)) {
      if (!gitignoreContent.includes(envFile)) {
        addResult('failed', 'Environment Files', 
          `${envFile} exists but is not in .gitignore`, 
          'Environment files may contain sensitive data and should not be committed');
      } else {
        addResult('passed', 'Environment Files', `${envFile} is properly ignored`);
      }
    }
  });
  
  // Check for hardcoded secrets
  const sourceFiles = [
    ...scanDirectory('apps/web/src', /\.(ts|tsx|js|jsx)$/),
    ...scanDirectory('apps/api/src', /\.(ts|js)$/)
  ].filter(file => 
    // Exclude test files and mock data
    !file.includes('__tests__') && 
    !file.includes('.test.') && 
    !file.includes('.spec.') &&
    !file.includes('mock') &&
    !file.includes('fixture')
  );
  
  const secretPatterns = [
    /(?:password|pwd|secret|key|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    /(?:api[_-]?key|access[_-]?token|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/gi,
    /mongodb:\/\/[^:]+:[^@]+@/gi,
    /postgres:\/\/[^:]+:[^@]+@/gi
  ];
  
  // Whitelist of acceptable constants that aren't secrets
  const whitelistedConstants = [
    'srm_portal_token', // Local storage key name
    'srm_portal_refresh_token', // Local storage key name
    'srm_portal_user', // Local storage key name
    'srm_portal_theme', // Local storage key name
    'submissions', // Query key
    'assessments', // Query key
    'users', // Query key
    'grades', // Query key
  ];
  
  let secretsFound = 0;
  sourceFiles.forEach(file => {
    const content = readFileContent(file);
    if (content) {
      secretPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // Check if this is a whitelisted constant
            const isWhitelisted = whitelistedConstants.some(constant => 
              match.toLowerCase().includes(constant.toLowerCase())
            );
            
            if (!isWhitelisted) {
              secretsFound++;
              addResult('failed', 'Hardcoded Secrets', 
                `Potential hardcoded secret found in ${file}`,
                match.substring(0, 50) + '...');
            }
          });
        }
      });
    }
  });
  
  if (secretsFound === 0) {
    addResult('passed', 'Hardcoded Secrets', 'No hardcoded secrets detected');
  }
}

console.log('2. 🛡️ Checking Dependencies for Vulnerabilities...');

function checkDependencyVulnerabilities() {
  // Run npm audit for both apps
  const apps = ['apps/web', 'apps/api'];
  
  apps.forEach(app => {
    if (checkFileExists(path.join(app, 'package.json'))) {
      console.log(`   Auditing ${app}...`);
      
      const auditResult = runCommand(`cd ${app} && npm audit --json`, { stdio: 'pipe' });
      
      if (auditResult) {
        try {
          const audit = JSON.parse(auditResult);
          
          if (audit.metadata && audit.metadata.vulnerabilities) {
            const vulns = audit.metadata.vulnerabilities;
            const total = vulns.info + vulns.low + vulns.moderate + vulns.high + vulns.critical;
            
            if (total === 0) {
              addResult('passed', 'Dependencies', `${app}: No vulnerabilities found`);
            } else {
              const severity = vulns.critical > 0 ? 'failed' : vulns.high > 0 ? 'failed' : 'warnings';
              addResult(severity, 'Dependencies', 
                `${app}: ${total} vulnerabilities found`,
                `Critical: ${vulns.critical}, High: ${vulns.high}, Moderate: ${vulns.moderate}, Low: ${vulns.low}`);
            }
          }
        } catch (error) {
          addResult('warnings', 'Dependencies', `${app}: Could not parse audit results`);
        }
      } else {
        addResult('warnings', 'Dependencies', `${app}: Could not run npm audit`);
      }
    }
  });
}

console.log('3. 🔐 Checking Authentication and Authorization...');

function checkAuthSecurity() {
  // Check JWT configuration
  const apiEnvExample = readFileContent('apps/api/.env.example');
  if (apiEnvExample) {
    if (apiEnvExample.includes('JWT_SECRET') && apiEnvExample.includes('JWT_REFRESH_SECRET')) {
      addResult('passed', 'JWT Configuration', 'JWT secrets are properly configured');
    } else {
      addResult('failed', 'JWT Configuration', 'JWT secrets not found in environment configuration');
    }
  }
  
  // Check for proper CORS configuration
  const corsConfig = scanDirectory('apps/api/src', /\.(ts|js)$/)
    .map(file => readFileContent(file))
    .join('\n');
  
  if (corsConfig.includes('cors') && corsConfig.includes('origin')) {
    addResult('passed', 'CORS Configuration', 'CORS is configured');
  } else {
    addResult('warnings', 'CORS Configuration', 'CORS configuration not found');
  }
  
  // Check for rate limiting
  if (corsConfig.includes('rate-limit') || corsConfig.includes('rateLimit')) {
    addResult('passed', 'Rate Limiting', 'Rate limiting is implemented');
  } else {
    addResult('warnings', 'Rate Limiting', 'Rate limiting not detected');
  }
}

console.log('4. 🌐 Checking Web Security Headers...');

function checkWebSecurity() {
  // Check for security headers in configuration
  const webConfig = [
    readFileContent('apps/web/vercel.json'),
    readFileContent('apps/web/vite.config.ts'),
    readFileContent('apps/api/src/index.ts')
  ].filter(Boolean).join('\n');
  
  const securityHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options', 
    'X-XSS-Protection',
    'Referrer-Policy',
    'Content-Security-Policy'
  ];
  
  securityHeaders.forEach(header => {
    if (webConfig.includes(header)) {
      addResult('passed', 'Security Headers', `${header} is configured`);
    } else {
      addResult('warnings', 'Security Headers', `${header} not found in configuration`);
    }
  });
  
  // Check for HTTPS enforcement
  if (webConfig.includes('https') || webConfig.includes('secure')) {
    addResult('passed', 'HTTPS', 'HTTPS configuration detected');
  } else {
    addResult('warnings', 'HTTPS', 'HTTPS enforcement not clearly configured');
  }
}

console.log('5. 📝 Checking Input Validation and Sanitization...');

function checkInputValidation() {
  const apiFiles = scanDirectory('apps/api/src', /\.(ts|js)$/);
  let validationFound = false;
  let sanitizationFound = false;
  
  apiFiles.forEach(file => {
    const content = readFileContent(file);
    if (content) {
      // Check for validation libraries
      if (content.includes('zod') || content.includes('joi') || content.includes('express-validator')) {
        validationFound = true;
      }
      
      // Check for sanitization
      if (content.includes('sanitize') || content.includes('escape') || content.includes('validator')) {
        sanitizationFound = true;
      }
    }
  });
  
  if (validationFound) {
    addResult('passed', 'Input Validation', 'Input validation library detected');
  } else {
    addResult('failed', 'Input Validation', 'No input validation library found');
  }
  
  if (sanitizationFound) {
    addResult('passed', 'Input Sanitization', 'Input sanitization detected');
  } else {
    addResult('warnings', 'Input Sanitization', 'Input sanitization not clearly implemented');
  }
}

console.log('6. 🗄️ Checking Database Security...');

function checkDatabaseSecurity() {
  const apiFiles = scanDirectory('apps/api/src', /\.(ts|js)$/);
  let mongooseFound = false;
  let sqlInjectionProtection = false;
  
  apiFiles.forEach(file => {
    const content = readFileContent(file);
    if (content) {
      if (content.includes('mongoose') || content.includes('Schema')) {
        mongooseFound = true;
      }
      
      // Check for parameterized queries or ORM usage
      if (content.includes('findById') || content.includes('findOne') || content.includes('$')) {
        sqlInjectionProtection = true;
      }
    }
  });
  
  if (mongooseFound) {
    addResult('passed', 'Database ORM', 'Mongoose ORM detected for MongoDB');
  }
  
  if (sqlInjectionProtection) {
    addResult('passed', 'SQL Injection Protection', 'Parameterized queries/ORM usage detected');
  } else {
    addResult('warnings', 'SQL Injection Protection', 'Could not verify SQL injection protection');
  }
}

console.log('7. 📁 Checking File Upload Security...');

function checkFileUploadSecurity() {
  const apiFiles = scanDirectory('apps/api/src', /\.(ts|js)$/);
  let fileUploadFound = false;
  let fileValidationFound = false;
  
  apiFiles.forEach(file => {
    const content = readFileContent(file);
    if (content) {
      if (content.includes('multer') || content.includes('upload') || content.includes('cloudinary')) {
        fileUploadFound = true;
      }
      
      if (content.includes('fileFilter') || content.includes('allowedFileTypes') || content.includes('maxFileSize')) {
        fileValidationFound = true;
      }
    }
  });
  
  if (fileUploadFound) {
    addResult('info', 'File Upload', 'File upload functionality detected');
    
    if (fileValidationFound) {
      addResult('passed', 'File Upload Validation', 'File validation detected');
    } else {
      addResult('failed', 'File Upload Validation', 'File upload validation not found');
    }
  } else {
    addResult('info', 'File Upload', 'No file upload functionality detected');
  }
}

console.log('8. 🔍 Checking for Common Security Anti-patterns...');

function checkSecurityAntiPatterns() {
  const allFiles = [
    ...scanDirectory('apps/web/src', /\.(ts|tsx|js|jsx)$/),
    ...scanDirectory('apps/api/src', /\.(ts|js)$/)
  ];
  
  const antiPatterns = [
    {
      pattern: /eval\s*\(/gi,
      name: 'eval() usage',
      severity: 'failed'
    },
    {
      pattern: /innerHTML\s*=/gi,
      name: 'innerHTML usage',
      severity: 'warnings'
    },
    {
      pattern: /document\.write\s*\(/gi,
      name: 'document.write() usage',
      severity: 'warnings'
    },
    {
      pattern: /setTimeout\s*\(\s*['"][^'"]*['"],/gi,
      name: 'setTimeout with string',
      severity: 'warnings'
    },
    {
      pattern: /setInterval\s*\(\s*['"][^'"]*['"],/gi,
      name: 'setInterval with string',
      severity: 'warnings'
    }
  ];
  
  let patternsFound = 0;
  
  allFiles.forEach(file => {
    const content = readFileContent(file);
    if (content) {
      antiPatterns.forEach(({ pattern, name, severity }) => {
        const matches = content.match(pattern);
        if (matches) {
          patternsFound++;
          addResult(severity, 'Security Anti-patterns', 
            `${name} found in ${file}`,
            `Found ${matches.length} occurrence(s)`);
        }
      });
    }
  });
  
  if (patternsFound === 0) {
    addResult('passed', 'Security Anti-patterns', 'No common security anti-patterns detected');
  }
}

console.log('9. 📋 Checking Security Documentation...');

function checkSecurityDocumentation() {
  const securityDocs = [
    'SECURITY.md',
    'docs/security.md',
    'DEPLOYMENT.md'
  ];
  
  let docsFound = 0;
  securityDocs.forEach(doc => {
    if (checkFileExists(doc)) {
      docsFound++;
      addResult('passed', 'Security Documentation', `${doc} exists`);
    }
  });
  
  if (docsFound === 0) {
    addResult('warnings', 'Security Documentation', 'No security documentation found');
  }
  
  // Check if deployment guide mentions security
  const deploymentDoc = readFileContent('DEPLOYMENT.md');
  if (deploymentDoc && deploymentDoc.toLowerCase().includes('security')) {
    addResult('passed', 'Security Documentation', 'Deployment guide includes security information');
  }
}

// Run all security checks
async function runSecurityAudit() {
  try {
    checkEnvironmentSecurity();
    checkDependencyVulnerabilities();
    checkAuthSecurity();
    checkWebSecurity();
    checkInputValidation();
    checkDatabaseSecurity();
    checkFileUploadSecurity();
    checkSecurityAntiPatterns();
    checkSecurityDocumentation();
    
    // Generate report
    console.log('\n' + '='.repeat(60));
    console.log('🔒 SECURITY AUDIT REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n✅ PASSED: ${auditResults.passed.length}`);
    auditResults.passed.forEach(result => {
      console.log(`   ✓ ${result.check}: ${result.message}`);
    });
    
    if (auditResults.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS: ${auditResults.warnings.length}`);
      auditResults.warnings.forEach(result => {
        console.log(`   ⚠ ${result.check}: ${result.message}`);
        if (result.details) console.log(`     Details: ${result.details}`);
      });
    }
    
    if (auditResults.failed.length > 0) {
      console.log(`\n❌ FAILED: ${auditResults.failed.length}`);
      auditResults.failed.forEach(result => {
        console.log(`   ✗ ${result.check}: ${result.message}`);
        if (result.details) console.log(`     Details: ${result.details}`);
      });
    }
    
    if (auditResults.info.length > 0) {
      console.log(`\nℹ️  INFO: ${auditResults.info.length}`);
      auditResults.info.forEach(result => {
        console.log(`   ℹ ${result.check}: ${result.message}`);
      });
    }
    
    // Overall assessment
    console.log('\n' + '='.repeat(60));
    const totalIssues = auditResults.failed.length;
    const totalWarnings = auditResults.warnings.length;
    
    if (totalIssues === 0 && totalWarnings === 0) {
      console.log('🎉 SECURITY AUDIT PASSED - No issues found!');
    } else if (totalIssues === 0) {
      console.log(`⚠️  SECURITY AUDIT PASSED WITH WARNINGS - ${totalWarnings} warnings to review`);
    } else {
      console.log(`❌ SECURITY AUDIT FAILED - ${totalIssues} critical issues, ${totalWarnings} warnings`);
    }
    
    // Save detailed report
    const reportPath = 'security-audit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        passed: auditResults.passed.length,
        warnings: auditResults.warnings.length,
        failed: auditResults.failed.length,
        info: auditResults.info.length
      },
      results: auditResults
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    process.exit(totalIssues > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ Security audit failed:', error);
    process.exit(1);
  }
}

// Run the audit
runSecurityAudit();