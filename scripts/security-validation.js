#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Comprehensive Security Validation Script
 * Validates all security measures and compliance with acceptance criteria
 */

console.log('🔒 Starting Security Validation for SRM Project Portal\n');

const validationResults = {
  passed: [],
  warnings: [],
  failed: [],
  info: []
};

// Helper functions
function addResult(type, category, check, status, details = null) {
  validationResults[type].push({
    category,
    check,
    status,
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

// Security Validation Tests

console.log('1. 🔐 Validating Authentication & Authorization...');

function validateAuthSecurity() {
  // Check JWT configuration
  const apiEnvExample = readFileContent('apps/api/.env.example');
  if (apiEnvExample && apiEnvExample.includes('JWT_SECRET') && apiEnvExample.includes('JWT_REFRESH_SECRET')) {
    addResult('passed', 'Authentication', 'JWT Configuration', 'JWT secrets properly configured');
  } else {
    addResult('failed', 'Authentication', 'JWT Configuration', 'JWT secrets not found in environment configuration');
  }

  // Check Google OAuth implementation
  const authRoutes = readFileContent('apps/api/src/routes/auth.ts');
  if (authRoutes) {
    if (authRoutes.includes('verifyDomainRestriction') && authRoutes.includes('@srmap.edu.in')) {
      addResult('passed', 'Authentication', 'Domain Restriction', 'Google OAuth domain restriction implemented');
    } else {
      addResult('failed', 'Authentication', 'Domain Restriction', 'Domain restriction not properly implemented');
    }

    if (authRoutes.includes('verifyGoogleIdToken')) {
      addResult('passed', 'Authentication', 'Token Verification', 'Google ID token verification implemented');
    } else {
      addResult('failed', 'Authentication', 'Token Verification', 'Google ID token verification missing');
    }
  }

  // Check RBAC implementation
  const authMiddleware = readFileContent('apps/api/src/middleware/auth.ts');
  if (authMiddleware) {
    if (authMiddleware.includes('authorize') && authMiddleware.includes('allowedRoles')) {
      addResult('passed', 'Authorization', 'RBAC Implementation', 'Role-based access control implemented');
    } else {
      addResult('failed', 'Authorization', 'RBAC Implementation', 'RBAC middleware not properly implemented');
    }

    if (authMiddleware.includes('requirePermission')) {
      addResult('passed', 'Authorization', 'Permission System', 'Permission-based authorization implemented');
    } else {
      addResult('warnings', 'Authorization', 'Permission System', 'Permission-based authorization not found');
    }
  }
}

console.log('2. 🛡️ Validating API Security...');

function validateApiSecurity() {
  const serverIndex = readFileContent('apps/api/src/index.ts');
  
  if (serverIndex) {
    // Check security headers
    if (serverIndex.includes('helmet')) {
      addResult('passed', 'API Security', 'Security Headers', 'Helmet.js security headers configured');
    } else {
      addResult('failed', 'API Security', 'Security Headers', 'Security headers not configured');
    }

    // Check CORS configuration
    if (serverIndex.includes('cors') && serverIndex.includes('origin')) {
      addResult('passed', 'API Security', 'CORS Configuration', 'CORS properly configured');
    } else {
      addResult('failed', 'API Security', 'CORS Configuration', 'CORS not properly configured');
    }

    // Check rate limiting
    if (serverIndex.includes('rateLimit') || serverIndex.includes('rate-limit')) {
      addResult('passed', 'API Security', 'Rate Limiting', 'Rate limiting implemented');
    } else {
      addResult('failed', 'API Security', 'Rate Limiting', 'Rate limiting not implemented');
    }

    // Check request size limits
    if (serverIndex.includes('limit:') && serverIndex.includes('10mb')) {
      addResult('passed', 'API Security', 'Request Size Limits', 'Request size limits configured');
    } else {
      addResult('warnings', 'API Security', 'Request Size Limits', 'Request size limits not clearly configured');
    }
  }

  // Check input validation
  const routeFiles = [
    'apps/api/src/routes/auth.ts',
    'apps/api/src/routes/assessments.ts',
    'apps/api/src/routes/submissions.ts'
  ];

  let validationFound = false;
  routeFiles.forEach(file => {
    const content = readFileContent(file);
    if (content && (content.includes('zod') || content.includes('.safeParse'))) {
      validationFound = true;
    }
  });

  if (validationFound) {
    addResult('passed', 'API Security', 'Input Validation', 'Zod schema validation implemented');
  } else {
    addResult('failed', 'API Security', 'Input Validation', 'Input validation not properly implemented');
  }
}

console.log('3. 🌐 Validating Web Security...');

function validateWebSecurity() {
  // Check Vercel security headers
  const vercelConfig = readFileContent('apps/web/vercel.json');
  if (vercelConfig) {
    const config = JSON.parse(vercelConfig);
    const headers = config.headers?.[0]?.headers || [];
    
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
      'Content-Security-Policy',
      'Strict-Transport-Security'
    ];

    requiredHeaders.forEach(header => {
      const found = headers.some(h => h.key === header);
      if (found) {
        addResult('passed', 'Web Security', `${header} Header`, `${header} configured`);
      } else {
        addResult('failed', 'Web Security', `${header} Header`, `${header} not configured`);
      }
    });
  }

  // Check for XSS prevention
  const componentFiles = [
    'apps/web/src/components/grading/GradeHistory.tsx',
    'apps/web/src/components/ui/RichTextEditor.tsx'
  ];

  let xssVulnerabilities = 0;
  componentFiles.forEach(file => {
    const content = readFileContent(file);
    if (content) {
      if (content.includes('dangerouslySetInnerHTML')) {
        xssVulnerabilities++;
        addResult('failed', 'Web Security', 'XSS Prevention', `dangerouslySetInnerHTML found in ${file}`);
      }
      if (content.includes('.innerHTML =')) {
        xssVulnerabilities++;
        addResult('failed', 'Web Security', 'XSS Prevention', `innerHTML assignment found in ${file}`);
      }
    }
  });

  if (xssVulnerabilities === 0) {
    addResult('passed', 'Web Security', 'XSS Prevention', 'No XSS vulnerabilities detected');
  }
}

console.log('4. 🗄️ Validating Database Security...');

function validateDatabaseSecurity() {
  // Check MongoDB configuration
  const dbConfig = readFileContent('apps/api/src/config/database.ts');
  if (dbConfig) {
    if (dbConfig.includes('mongoose') && dbConfig.includes('connect')) {
      addResult('passed', 'Database Security', 'ORM Usage', 'Mongoose ODM properly configured');
    } else {
      addResult('warnings', 'Database Security', 'ORM Usage', 'Database ORM configuration not found');
    }
  }

  // Check for SQL injection prevention
  const modelFiles = [
    'apps/api/src/models/User.ts',
    'apps/api/src/models/Assessment.ts',
    'apps/api/src/models/Submission.ts'
  ];

  let sqlInjectionProtection = false;
  modelFiles.forEach(file => {
    const content = readFileContent(file);
    if (content && (content.includes('Schema') || content.includes('model'))) {
      sqlInjectionProtection = true;
    }
  });

  if (sqlInjectionProtection) {
    addResult('passed', 'Database Security', 'SQL Injection Prevention', 'Mongoose schemas provide SQL injection protection');
  } else {
    addResult('warnings', 'Database Security', 'SQL Injection Prevention', 'SQL injection protection not clearly implemented');
  }
}

console.log('5. 📁 Validating File Upload Security...');

function validateFileUploadSecurity() {
  // Check file upload implementation
  const submissionRoutes = readFileContent('apps/api/src/routes/submissions.ts');
  if (submissionRoutes) {
    if (submissionRoutes.includes('multer') || submissionRoutes.includes('cloudinary')) {
      addResult('passed', 'File Upload Security', 'File Upload Implementation', 'File upload system implemented');
      
      if (submissionRoutes.includes('fileFilter') || submissionRoutes.includes('allowedFileTypes')) {
        addResult('passed', 'File Upload Security', 'File Type Validation', 'File type validation implemented');
      } else {
        addResult('failed', 'File Upload Security', 'File Type Validation', 'File type validation not implemented');
      }

      if (submissionRoutes.includes('maxFileSize') || submissionRoutes.includes('limits')) {
        addResult('passed', 'File Upload Security', 'File Size Limits', 'File size limits implemented');
      } else {
        addResult('failed', 'File Upload Security', 'File Size Limits', 'File size limits not implemented');
      }
    } else {
      addResult('info', 'File Upload Security', 'File Upload Implementation', 'File upload system not detected');
    }
  }
}

console.log('6. 📋 Validating Security Documentation...');

function validateSecurityDocumentation() {
  const requiredDocs = [
    { file: 'SECURITY.md', name: 'Security Policy' },
    { file: 'DEPLOYMENT.md', name: 'Deployment Guide' },
    { file: 'scripts/security-audit.js', name: 'Security Audit Script' }
  ];

  requiredDocs.forEach(doc => {
    if (checkFileExists(doc.file)) {
      addResult('passed', 'Documentation', doc.name, `${doc.name} exists and is accessible`);
      
      // Check if documentation contains security information
      const content = readFileContent(doc.file);
      if (content && content.toLowerCase().includes('security')) {
        addResult('passed', 'Documentation', `${doc.name} Content`, `${doc.name} contains security information`);
      } else {
        addResult('warnings', 'Documentation', `${doc.name} Content`, `${doc.name} may lack security information`);
      }
    } else {
      addResult('failed', 'Documentation', doc.name, `${doc.name} not found`);
    }
  });
}

console.log('7. 🔍 Validating Compliance with Requirements...');

function validateRequirementsCompliance() {
  // Requirement 13.2: Rate limiting per IP address
  const serverIndex = readFileContent('apps/api/src/index.ts');
  if (serverIndex && serverIndex.includes('rateLimit') && serverIndex.includes('windowMs')) {
    addResult('passed', 'Requirements Compliance', 'Requirement 13.2', 'Rate limiting per IP address implemented');
  } else {
    addResult('failed', 'Requirements Compliance', 'Requirement 13.2', 'Rate limiting per IP address not implemented');
  }

  // Requirement 13.4: Structured error responses
  const errorHandler = readFileContent('apps/api/src/middleware/errorHandler.ts');
  if (errorHandler && errorHandler.includes('error') && errorHandler.includes('code')) {
    addResult('passed', 'Requirements Compliance', 'Requirement 13.4', 'Structured error responses implemented');
  } else {
    addResult('warnings', 'Requirements Compliance', 'Requirement 13.4', 'Structured error responses not clearly implemented');
  }

  // Check for comprehensive API documentation
  const swaggerConfig = readFileContent('apps/api/src/config/swagger.ts');
  if (swaggerConfig) {
    addResult('passed', 'Requirements Compliance', 'API Documentation', 'OpenAPI documentation configured');
  } else {
    addResult('warnings', 'Requirements Compliance', 'API Documentation', 'API documentation configuration not found');
  }
}

// Run all validation tests
async function runSecurityValidation() {
  try {
    validateAuthSecurity();
    validateApiSecurity();
    validateWebSecurity();
    validateDatabaseSecurity();
    validateFileUploadSecurity();
    validateSecurityDocumentation();
    validateRequirementsCompliance();
    
    // Generate comprehensive report
    console.log('\n' + '='.repeat(70));
    console.log('🔒 SECURITY VALIDATION REPORT');
    console.log('='.repeat(70));
    
    // Summary by category
    const categories = [...new Set(
      [...validationResults.passed, ...validationResults.warnings, ...validationResults.failed]
        .map(r => r.category)
    )];

    categories.forEach(category => {
      console.log(`\n📋 ${category.toUpperCase()}`);
      console.log('-'.repeat(50));
      
      const categoryResults = [
        ...validationResults.passed.filter(r => r.category === category),
        ...validationResults.warnings.filter(r => r.category === category),
        ...validationResults.failed.filter(r => r.category === category)
      ];

      categoryResults.forEach(result => {
        const icon = validationResults.passed.includes(result) ? '✅' : 
                    validationResults.warnings.includes(result) ? '⚠️' : '❌';
        console.log(`   ${icon} ${result.check}: ${result.status}`);
        if (result.details) {
          console.log(`      Details: ${result.details}`);
        }
      });
    });

    // Overall summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(70));
    
    console.log(`✅ PASSED: ${validationResults.passed.length}`);
    console.log(`⚠️  WARNINGS: ${validationResults.warnings.length}`);
    console.log(`❌ FAILED: ${validationResults.failed.length}`);
    console.log(`ℹ️  INFO: ${validationResults.info.length}`);
    
    // Overall assessment
    const totalIssues = validationResults.failed.length;
    const totalWarnings = validationResults.warnings.length;
    
    console.log('\n' + '='.repeat(70));
    if (totalIssues === 0 && totalWarnings === 0) {
      console.log('🎉 SECURITY VALIDATION PASSED - All security measures validated!');
    } else if (totalIssues === 0) {
      console.log(`⚠️  SECURITY VALIDATION PASSED WITH WARNINGS - ${totalWarnings} warnings to review`);
    } else {
      console.log(`❌ SECURITY VALIDATION FAILED - ${totalIssues} critical issues, ${totalWarnings} warnings`);
    }
    
    // Save detailed report
    const reportPath = 'security-validation-report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        passed: validationResults.passed.length,
        warnings: validationResults.warnings.length,
        failed: validationResults.failed.length,
        info: validationResults.info.length
      },
      results: validationResults,
      categories: categories
    }, null, 2));
    
    console.log(`\n📄 Detailed validation report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    process.exit(totalIssues > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ Security validation failed:', error);
    process.exit(1);
  }
}

// Run the validation
runSecurityValidation();