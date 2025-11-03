# Security Policy

## Overview

The SRM University-AP Project Management Portal implements comprehensive security measures to protect user data, prevent unauthorized access, and ensure system integrity. This document outlines our security policies, procedures, and guidelines.

## 🔒 Security Architecture

### Authentication & Authorization

#### Google OAuth 2.0 Integration
- **Domain Restriction**: Only `@srmap.edu.in` email addresses are permitted
- **Token Verification**: Complete ID token validation including audience, issuer, and expiration
- **Email Verification**: Requires verified Google accounts
- **3-Legged OAuth**: Separate calendar access permissions for faculty

#### JWT Token Management
- **Access Tokens**: Short-lived (15 minutes) for API access
- **Refresh Tokens**: Long-lived (7 days) with rotation on use
- **Secure Storage**: httpOnly cookies with sameSite protection
- **Token Validation**: Comprehensive signature and expiration verification

#### Role-Based Access Control (RBAC)
- **Student Role**: Assessment viewing, submission creation, grade viewing
- **Faculty Role**: Assessment management, grading, submission viewing
- **Admin Role**: User management, system administration, reporting

### API Security

#### Input Validation & Sanitization
- **Zod Schema Validation**: All API endpoints validate input using Zod schemas
- **Request Size Limits**: 10MB limit for file uploads, 1MB for JSON payloads
- **SQL Injection Prevention**: Mongoose ODM with parameterized queries
- **XSS Prevention**: Input sanitization and output encoding

#### Rate Limiting & DDoS Protection
- **Global Rate Limiting**: 100 requests per 15 minutes per IP
- **Endpoint-Specific Limits**: Stricter limits on authentication endpoints
- **Progressive Delays**: Exponential backoff for repeated violations
- **IP Whitelisting**: Support for trusted IP ranges

#### Security Headers
```javascript
// Helmet.js configuration
{
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}
```

### Data Protection

#### Encryption
- **Data in Transit**: TLS 1.3 for all communications
- **Data at Rest**: MongoDB Atlas encryption with customer-managed keys
- **Password Hashing**: bcrypt with 12 rounds (where applicable)
- **Sensitive Data**: Environment variables for all secrets

#### File Upload Security
- **File Type Validation**: MIME type and file signature verification
- **Size Restrictions**: Configurable limits per user role
- **Virus Scanning**: Cloudinary security features integration
- **Access Control**: Signed URLs with expiration for file access
- **Storage Isolation**: User files isolated by permissions

#### Database Security
- **Connection Security**: TLS-encrypted MongoDB connections
- **Access Control**: Database-level user permissions
- **Query Optimization**: Indexed queries to prevent DoS
- **Backup Encryption**: Encrypted automated backups

### Frontend Security

#### Content Security Policy (CSP)
- **Strict CSP**: Prevents XSS attacks through content restrictions
- **Nonce-based Scripts**: Dynamic script loading with nonces
- **Trusted Sources**: Whitelist for external resources

#### Client-Side Protection
- **Token Storage**: Secure storage in httpOnly cookies
- **CSRF Protection**: SameSite cookie attributes
- **XSS Prevention**: React's built-in XSS protection + sanitization
- **Dependency Scanning**: Regular vulnerability audits

## 🛡️ Security Procedures

### Vulnerability Management

#### Dependency Scanning
```bash
# Automated daily scans
npm audit --audit-level moderate
npm audit fix

# Manual security review
npm outdated
npm update
```

#### Code Security Review
- **Static Analysis**: ESLint security rules
- **Dynamic Testing**: OWASP ZAP integration
- **Manual Review**: Security-focused code reviews
- **Penetration Testing**: Quarterly external assessments

### Incident Response

#### Security Incident Classification
1. **Critical**: Data breach, system compromise, authentication bypass
2. **High**: Privilege escalation, sensitive data exposure
3. **Medium**: DoS attacks, configuration vulnerabilities
4. **Low**: Information disclosure, minor security misconfigurations

#### Response Procedures
1. **Detection**: Automated monitoring and manual reporting
2. **Assessment**: Impact analysis and classification
3. **Containment**: Immediate threat mitigation
4. **Investigation**: Root cause analysis
5. **Recovery**: System restoration and hardening
6. **Documentation**: Incident report and lessons learned

### Access Control Procedures

#### User Account Management
- **Account Creation**: Automated via Google OAuth with domain verification
- **Role Assignment**: Admin-controlled role management
- **Account Deactivation**: Immediate token revocation
- **Audit Logging**: All access control changes logged

#### Administrative Access
- **Multi-Factor Authentication**: Required for admin accounts
- **Privileged Access Management**: Time-limited admin sessions
- **Audit Trails**: Complete logging of administrative actions
- **Separation of Duties**: Multiple approvals for critical changes

## 🔍 Security Monitoring

### Logging & Auditing

#### Security Event Logging
```javascript
// Security events logged
{
  authentication: ['login', 'logout', 'token_refresh', 'failed_login'],
  authorization: ['access_denied', 'privilege_escalation', 'role_change'],
  data_access: ['sensitive_data_access', 'bulk_export', 'admin_query'],
  system: ['configuration_change', 'security_policy_update']
}
```

#### Log Management
- **Centralized Logging**: Structured JSON logs
- **Log Retention**: 90 days for security logs, 30 days for application logs
- **Log Integrity**: Tamper-evident logging with checksums
- **Real-time Monitoring**: Automated alerting for security events

### Performance & Security Metrics

#### Key Security Indicators
- **Authentication Success Rate**: Target >99%
- **Failed Login Attempts**: Alert threshold >10/hour per IP
- **Token Validation Errors**: Alert threshold >5% error rate
- **API Response Times**: Security middleware impact <50ms
- **Vulnerability Scan Results**: Zero high/critical findings

## 🚨 Security Compliance

### Data Privacy Compliance

#### GDPR Compliance (where applicable)
- **Data Minimization**: Collect only necessary user data
- **Purpose Limitation**: Use data only for stated purposes
- **User Rights**: Data access, correction, and deletion capabilities
- **Consent Management**: Clear consent for data processing

#### Educational Data Protection
- **FERPA Compliance**: Student record confidentiality
- **Access Controls**: Role-based access to educational records
- **Data Retention**: Automatic cleanup of old submissions
- **Audit Trails**: Complete access logging for compliance

### Security Standards Alignment

#### OWASP Top 10 Mitigation
1. **Injection**: Parameterized queries, input validation
2. **Broken Authentication**: Secure session management, MFA
3. **Sensitive Data Exposure**: Encryption, secure headers
4. **XML External Entities**: JSON-only API, no XML processing
5. **Broken Access Control**: RBAC, resource ownership validation
6. **Security Misconfiguration**: Automated security scanning
7. **Cross-Site Scripting**: CSP, input sanitization, React protection
8. **Insecure Deserialization**: JSON-only, schema validation
9. **Known Vulnerabilities**: Automated dependency scanning
10. **Insufficient Logging**: Comprehensive security event logging

## 📋 Security Checklist

### Pre-Deployment Security Review

#### Code Security
- [ ] No hardcoded secrets or credentials
- [ ] All inputs validated with Zod schemas
- [ ] SQL injection prevention verified
- [ ] XSS protection implemented
- [ ] CSRF protection enabled
- [ ] Security headers configured
- [ ] Error handling doesn't leak information

#### Infrastructure Security
- [ ] TLS/SSL certificates valid and configured
- [ ] Database access restricted to application
- [ ] Environment variables properly configured
- [ ] Rate limiting configured and tested
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery procedures tested

#### Authentication & Authorization
- [ ] Google OAuth configuration verified
- [ ] JWT token security validated
- [ ] Role-based access control tested
- [ ] Session management secure
- [ ] Password policies enforced (where applicable)
- [ ] Account lockout mechanisms working

### Post-Deployment Security Validation

#### Security Testing
- [ ] Vulnerability scan completed
- [ ] Penetration testing performed
- [ ] Authentication bypass testing
- [ ] Authorization boundary testing
- [ ] Input validation testing
- [ ] Session management testing

#### Operational Security
- [ ] Security monitoring active
- [ ] Log aggregation working
- [ ] Incident response procedures tested
- [ ] Backup and recovery validated
- [ ] Security documentation updated
- [ ] Team security training completed

## 🔧 Security Configuration

### Environment Variables Security

#### Required Security Variables
```bash
# JWT Configuration
JWT_SECRET=<256-bit-random-key>
JWT_REFRESH_SECRET=<256-bit-random-key>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Database Security
MONGODB_URI=<encrypted-connection-string>
DB_SSL=true
DB_AUTH_SOURCE=admin

# API Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12

# CORS Configuration
FRONTEND_URL=<trusted-frontend-url>
ALLOWED_ORIGINS=<comma-separated-trusted-origins>

# External Service Security
GOOGLE_CLIENT_SECRET=<oauth-client-secret>
CLOUDINARY_API_SECRET=<cloudinary-secret>
```

### Security Headers Configuration

#### Vercel Configuration (vercel.json)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    }
  ]
}
```

## 📞 Security Contact

### Reporting Security Vulnerabilities

#### Contact Information
- **Security Team**: security@srmap.edu.in
- **Emergency Contact**: +91-XXX-XXX-XXXX
- **Response Time**: 24 hours for critical, 72 hours for others

#### Vulnerability Disclosure Process
1. **Report**: Send detailed vulnerability report to security team
2. **Acknowledgment**: Confirmation within 24 hours
3. **Assessment**: Security team evaluates severity and impact
4. **Fix**: Development and testing of security patch
5. **Disclosure**: Coordinated disclosure after fix deployment

#### Bug Bounty Program
- **Scope**: Production systems and applications
- **Rewards**: Recognition and potential monetary rewards
- **Rules**: Responsible disclosure, no data access/modification
- **Exclusions**: Social engineering, physical attacks, DoS

## 📚 Security Resources

### Training & Awareness
- [OWASP Web Application Security](https://owasp.org/www-project-top-ten/)
- [Google OAuth 2.0 Security Best Practices](https://developers.google.com/identity/protocols/oauth2/security-best-practices)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)

### Security Tools
- **Static Analysis**: ESLint Security Plugin, Semgrep
- **Dependency Scanning**: npm audit, Snyk, GitHub Dependabot
- **Dynamic Testing**: OWASP ZAP, Burp Suite
- **Infrastructure**: Nessus, OpenVAS

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Next Review**: March 2025