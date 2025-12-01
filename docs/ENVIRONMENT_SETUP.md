# Environment Setup Guide

This guide provides comprehensive instructions for setting up the SRM Project Portal development and production environments with proper security configurations.

## 🏗️ Development Environment Setup

### Prerequisites

1. **System Requirements**:
   - Node.js 18+ (LTS recommended)
   - pnpm package manager
   - Git 2.30+
   - MongoDB 6.0+ (local) or MongoDB Atlas account
   - Google Cloud Console account
   - Cloudinary account

2. **Development Tools** (Recommended):
   - VS Code with extensions:
     - ESLint
     - Prettier
     - TypeScript and JavaScript Language Features
     - Tailwind CSS IntelliSense
   - MongoDB Compass (for database management)
   - Postman or similar API testing tool

### Initial Setup

1. **Clone Repository**:
   ```bash
   git clone https://github.com/your-org/srm-project-portal.git
   cd srm-project-portal
   ```

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```

3. **Environment Configuration**:
   ```bash
   # Copy environment templates
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

### Backend Environment Configuration

Create `apps/api/.env` with the following variables:

```bash
# Application Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/srm_portal_dev
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/srm_portal_dev

# JWT Configuration (Generate secure random strings)
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-at-least-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# CORS Configuration
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12

# Development Configuration
LOG_LEVEL=debug
ENABLE_CORS=true
ENABLE_SWAGGER=true
```

### Frontend Environment Configuration

Create `apps/web/.env` with the following variables:

```bash
# API Configuration
VITE_API_URL=http://localhost:3001
VITE_API_VERSION=v1

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Application Configuration
VITE_APP_NAME=SRM Project Portal
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
VITE_ENABLE_PERFORMANCE_MONITORING=false

# External Services
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_WEBSOCKET_URL=ws://localhost:3001
```

### Google OAuth Setup

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one
   - Enable Google+ API and Google Calendar API

2. **Configure OAuth Consent Screen**:
   - Go to APIs & Services > OAuth consent screen
   - Choose "Internal" for development
   - Fill in application details
   - Add authorized domains: `localhost`, `srmap.edu.in`

3. **Create OAuth Credentials**:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/auth/callback`

4. **Domain Restriction Configuration**:
   - In OAuth consent screen, set up domain restriction
   - Add `srmap.edu.in` to authorized domains
   - Configure user type restrictions

### MongoDB Setup

#### Option 1: Local MongoDB
```bash
# Install MongoDB (macOS with Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# Create database and user
mongosh
use srm_portal_dev
db.createUser({
  user: "srm_user",
  pwd: "secure_password",
  roles: ["readWrite"]
})
```

#### Option 2: MongoDB Atlas
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster (M0 free tier for development)
3. Configure network access (add your IP)
4. Create database user with read/write permissions
5. Get connection string and update `MONGODB_URI`

### Cloudinary Setup

1. **Create Account**:
   - Sign up at [Cloudinary](https://cloudinary.com)
   - Get cloud name, API key, and API secret from dashboard

2. **Configure Upload Presets**:
   - Go to Settings > Upload
   - Create upload preset for file uploads
   - Configure allowed file types and size limits

### Development Scripts

```bash
# Start development servers
pnpm dev

# Start individual services
pnpm dev:api    # Backend only
pnpm dev:web    # Frontend only

# Database operations
pnpm db:seed    # Seed development data
pnpm db:reset   # Reset database
pnpm db:migrate # Run migrations

# Testing
pnpm test       # Run all tests
pnpm test:api   # Backend tests only
pnpm test:web   # Frontend tests only

# Security
pnpm security:audit    # Run security audit
pnpm security:validate # Validate security measures

# Build
pnpm build      # Build all applications
pnpm build:api  # Build backend only
pnpm build:web  # Build frontend only
```

## 🚀 Production Environment Setup

### Infrastructure Requirements

1. **Frontend Hosting**: Vercel (recommended) or Netlify
2. **Backend Hosting**: Render (recommended) or Railway
3. **Database**: MongoDB Atlas (production cluster)
4. **CDN**: Cloudinary for file storage
5. **Monitoring**: Built-in platform monitoring + custom dashboards

### Production Environment Variables

#### Backend Production Environment

```bash
# Application Configuration
NODE_ENV=production
PORT=10000

# Database Configuration (MongoDB Atlas)
MONGODB_URI=mongodb+srv://prod_user:secure_password@cluster.mongodb.net/srm_portal_production?retryWrites=true&w=majority

# JWT Configuration (Use strong, unique secrets)
JWT_SECRET=production-jwt-secret-256-bit-random-string
JWT_REFRESH_SECRET=production-refresh-secret-256-bit-random-string
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=production-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=production-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/callback

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=production-cloudinary-cloud-name
CLOUDINARY_API_KEY=production-cloudinary-api-key
CLOUDINARY_API_SECRET=production-cloudinary-api-secret

# CORS Configuration
FRONTEND_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://your-domain.vercel.app

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12

# Production Configuration
LOG_LEVEL=info
ENABLE_CORS=true
ENABLE_SWAGGER=false
```

#### Frontend Production Environment

```bash
# API Configuration
VITE_API_URL=https://your-api-domain.com
VITE_API_VERSION=v1

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=production-google-client-id.apps.googleusercontent.com

# Application Configuration
VITE_APP_NAME=SRM Project Portal
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
VITE_ENABLE_PERFORMANCE_MONITORING=true

# External Services
VITE_CLOUDINARY_CLOUD_NAME=production-cloudinary-cloud-name
VITE_WEBSOCKET_URL=wss://your-api-domain.com
```

### Security Configuration

#### SSL/TLS Configuration

1. **Automatic HTTPS**: Both Vercel and Render provide automatic HTTPS
2. **Custom Domains**: Configure custom domains with SSL certificates
3. **HSTS**: Configured in security headers
4. **Certificate Monitoring**: Set up alerts for certificate expiration

#### Database Security

```javascript
// MongoDB Atlas Security Checklist
- Enable authentication
- Use strong passwords (20+ characters)
- Configure IP whitelist (specific IPs only)
- Enable encryption at rest
- Enable audit logging
- Set up backup encryption
- Configure network peering (if needed)
```

#### API Security Headers

```javascript
// Helmet.js configuration for production
{
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "https://accounts.google.com", "https://apis.google.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}
```

### Monitoring and Alerting

#### Application Monitoring

1. **Performance Monitoring**:
   - Response time tracking
   - Error rate monitoring
   - Database query performance
   - Memory and CPU usage

2. **Security Monitoring**:
   - Failed authentication attempts
   - Rate limit violations
   - Suspicious activity patterns
   - Security header compliance

3. **Business Metrics**:
   - User registration rates
   - Assessment creation/completion
   - File upload success rates
   - API endpoint usage

#### Alert Configuration

```javascript
// Example alert thresholds
{
  errorRate: "> 5% over 5 minutes",
  responseTime: "> 2000ms average over 5 minutes",
  failedLogins: "> 10 attempts per IP per hour",
  rateLimitHits: "> 50% of limit per IP per window",
  databaseConnections: "> 80% of pool size",
  diskSpace: "> 85% usage",
  memoryUsage: "> 90% usage"
}
```

### Backup and Recovery

#### Database Backup Strategy

1. **Automated Backups**:
   - MongoDB Atlas: Continuous backup with point-in-time recovery
   - Retention: 7 days for development, 30 days for production
   - Cross-region backup replication

2. **Application Data Backup**:
   - File uploads: Cloudinary automatic backup
   - Configuration: Version controlled in Git
   - Environment variables: Secure backup in password manager

#### Disaster Recovery Plan

1. **Recovery Time Objective (RTO)**: 4 hours
2. **Recovery Point Objective (RPO)**: 1 hour
3. **Backup Testing**: Monthly restore tests
4. **Documentation**: Step-by-step recovery procedures

### Performance Optimization

#### Frontend Optimization

```javascript
// Vite build optimization
{
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@headlessui/react', 'framer-motion'],
          three: ['three']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
}
```

#### Backend Optimization

```javascript
// Express.js optimization
{
  compression: true,
  keepAliveTimeout: 65000,
  headersTimeout: 66000,
  maxConnections: 1000,
  timeout: 30000
}
```

### Compliance and Auditing

#### Security Compliance

1. **OWASP Top 10**: Regular assessment and mitigation
2. **Data Protection**: GDPR compliance where applicable
3. **Educational Records**: FERPA compliance for student data
4. **Access Logging**: Comprehensive audit trails

#### Regular Security Tasks

```bash
# Weekly tasks
- Dependency vulnerability scan
- Security header validation
- SSL certificate check
- Access log review

# Monthly tasks
- Security configuration review
- Penetration testing
- Backup restoration test
- Performance optimization review

# Quarterly tasks
- Security policy update
- Third-party security assessment
- Disaster recovery drill
- Compliance audit
```

## 🔧 Troubleshooting

### Common Issues

#### Authentication Issues

```bash
# Google OAuth errors
- Check client ID and secret
- Verify redirect URIs
- Confirm domain restrictions
- Test with different browsers

# JWT token issues
- Verify secret configuration
- Check token expiration
- Validate token format
- Review middleware order
```

#### Database Connection Issues

```bash
# MongoDB connection errors
- Verify connection string format
- Check network access settings
- Confirm user permissions
- Test connection with MongoDB Compass

# Performance issues
- Review query indexes
- Monitor connection pool usage
- Check query execution times
- Optimize aggregation pipelines
```

#### Deployment Issues

```bash
# Build failures
- Check environment variables
- Verify Node.js version
- Review build logs
- Test local build

# Runtime errors
- Check application logs
- Verify external service connectivity
- Review security configurations
- Test API endpoints
```

### Debug Commands

```bash
# Check environment configuration
pnpm env:check

# Test database connection
pnpm db:test

# Validate security configuration
pnpm security:validate

# Run health checks
curl http://localhost:3001/health

# Test authentication
curl -X POST http://localhost:3001/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{"code":"test"}'
```

### Support Resources

- **Documentation**: [Project Wiki](https://github.com/your-org/srm-project-portal/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/srm-project-portal/issues)
- **Security**: security@srmap.edu.in
- **Development**: dev-team@srmap.edu.in

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Next Review**: March 2025