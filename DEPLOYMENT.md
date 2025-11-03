# Deployment Guide

This document provides comprehensive instructions for deploying the SRM Project Portal to production environments.

## 🏗️ Architecture Overview

The SRM Project Portal consists of two main components:

- **Frontend (Web App)**: React application deployed on Vercel
- **Backend (API)**: Node.js/Express API deployed on Render
- **Database**: MongoDB Atlas (cloud database)

## 🚀 Deployment Environments

### Production
- **Frontend**: https://srm-portal-web.vercel.app
- **Backend**: https://srm-portal-api.onrender.com
- **Database**: MongoDB Atlas Production Cluster

### Staging/Preview
- **Frontend**: https://srm-portal-web-preview.vercel.app
- **Backend**: https://srm-portal-api-preview.onrender.com
- **Database**: MongoDB Atlas Staging Cluster

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Accounts Setup**:
   - [Vercel](https://vercel.com) account for frontend deployment
   - [Render](https://render.com) account for backend deployment
   - [MongoDB Atlas](https://cloud.mongodb.com) account for database
   - [Google Cloud Console](https://console.cloud.google.com) for OAuth setup
   - [Cloudinary](https://cloudinary.com) account for file storage

2. **Local Development Environment**:
   - Node.js 18+ installed
   - pnpm package manager
   - Git configured
   - Environment variables configured

3. **Security Prerequisites**:
   - SSL/TLS certificates configured
   - Strong JWT secrets generated (256-bit minimum)
   - Google OAuth domain restrictions configured
   - Database access controls configured
   - Security scanning tools available

## 🔧 Environment Variables

### Frontend (Vercel)

Create these environment variables in your Vercel project settings:

```bash
# API Configuration
VITE_API_URL=https://srm-portal-api.onrender.com
VITE_API_VERSION=v1

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Application Settings
VITE_APP_NAME=SRM Project Portal
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
VITE_ENABLE_PERFORMANCE_MONITORING=true

# External Services
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_WEBSOCKET_URL=wss://srm-portal-api.onrender.com
```

### Backend (Render)

Configure these environment variables in your Render service:

```bash
# Application
NODE_ENV=production
PORT=10000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/srm_portal_production

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-at-least-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth & Calendar
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://srm-portal-web.vercel.app/auth/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# CORS & Security
FRONTEND_URL=https://srm-portal-web.vercel.app
ALLOWED_ORIGINS=https://srm-portal-web.vercel.app,https://srm-portal-web-*.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12
```

## 🚀 Manual Deployment

### Frontend Deployment (Vercel)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from Web App Directory**:
   ```bash
   cd apps/web
   npm run deploy:prod
   ```

4. **Configure Custom Domain** (Optional):
   - Go to Vercel Dashboard
   - Select your project
   - Go to Settings > Domains
   - Add your custom domain

### Backend Deployment (Render)

1. **Connect Repository**:
   - Go to Render Dashboard
   - Click "New +" > "Web Service"
   - Connect your GitHub repository
   - Select the repository

2. **Configure Service**:
   - **Name**: `srm-portal-api`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`

3. **Set Environment Variables**:
   - Add all required environment variables listed above
   - Use Render's secret management for sensitive values

4. **Configure Health Checks**:
   - **Health Check Path**: `/health`
   - **Health Check Grace Period**: 30 seconds

### Database Setup (MongoDB Atlas)

1. **Create Cluster**:
   - Log in to MongoDB Atlas
   - Create a new cluster
   - Choose appropriate tier (M0 for development, M10+ for production)

2. **Configure Network Access**:
   - Go to Network Access
   - Add IP addresses (0.0.0.0/0 for Render, or specific IPs)

3. **Create Database User**:
   - Go to Database Access
   - Create a new user with read/write permissions
   - Note the username and password

4. **Get Connection String**:
   - Go to Clusters > Connect
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

## 🤖 Automated Deployment (CI/CD)

### GitHub Actions Setup

1. **Repository Secrets**:
   Go to your GitHub repository > Settings > Secrets and variables > Actions, and add:

   ```bash
   # Vercel
   VERCEL_TOKEN=your-vercel-token
   VERCEL_ORG_ID=your-vercel-org-id
   VERCEL_PROJECT_ID=your-vercel-project-id

   # Render
   RENDER_API_KEY=your-render-api-key
   RENDER_SERVICE_ID=your-render-service-id

   # Application Environment Variables
   VITE_API_URL=https://srm-portal-api.onrender.com
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   ```

2. **Automatic Deployment**:
   - Push to `main` branch triggers production deployment
   - Pull requests create preview deployments
   - All deployments run through CI/CD pipeline

### Workflow Overview

1. **CI Pipeline** (`ci.yml`):
   - Lint and type checking
   - Unit and integration tests
   - Build verification
   - Security audit
   - Performance budget checks

2. **Deployment Pipeline** (`deploy.yml`):
   - Runs CI checks first
   - Deploys frontend to Vercel
   - Deploys backend to Render
   - Runs smoke tests
   - Sends deployment notifications

3. **PR Checks** (`pr-checks.yml`):
   - Full CI pipeline for PRs
   - Preview deployments
   - Code quality analysis
   - Accessibility checks
   - Security scanning

## 🔍 Post-Deployment Verification

### Health Checks

1. **API Health**:
   ```bash
   curl https://srm-portal-api.onrender.com/health
   ```

2. **API Status**:
   ```bash
   curl https://srm-portal-api.onrender.com/api/v1/status
   ```

3. **Frontend Accessibility**:
   ```bash
   curl https://srm-portal-web.vercel.app
   ```

### Database Migration

After deployment, run database migrations:

```bash
# Connect to production database
MONGODB_URI=your-production-uri npm run migrate:up
```

### Seed Data (Optional)

For initial setup, you may want to seed the database:

```bash
# Only run this once for initial setup
MONGODB_URI=your-production-uri npm run seed
```

## 📊 Monitoring and Maintenance

### Application Monitoring

1. **Vercel Analytics**:
   - Enable Web Analytics in Vercel dashboard
   - Monitor Core Web Vitals
   - Track deployment frequency

2. **Render Monitoring**:
   - Monitor service health in Render dashboard
   - Set up log aggregation
   - Configure alerting for downtime

3. **Database Monitoring**:
   - Use MongoDB Atlas monitoring
   - Set up performance alerts
   - Monitor connection pool usage

### Performance Monitoring

1. **Lighthouse CI**:
   - Automated performance audits on deployment
   - Performance budget enforcement
   - Accessibility compliance checking

2. **Bundle Analysis**:
   - Automated bundle size monitoring
   - Performance budget alerts
   - Code splitting optimization

### Security Monitoring

1. **Dependency Scanning**:
   - Automated security audits
   - Vulnerability alerts
   - Automated dependency updates

2. **Runtime Security**:
   - Monitor for suspicious activity
   - Rate limiting effectiveness
   - Authentication failure patterns

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check environment variables
   - Verify Node.js version compatibility
   - Review build logs for specific errors

2. **Database Connection Issues**:
   - Verify MongoDB URI format
   - Check network access settings
   - Confirm database user permissions

3. **CORS Errors**:
   - Verify FRONTEND_URL environment variable
   - Check ALLOWED_ORIGINS configuration
   - Ensure proper domain configuration

4. **Authentication Issues**:
   - Verify Google OAuth configuration
   - Check JWT secret configuration
   - Confirm redirect URI settings

### Rollback Procedures

1. **Frontend Rollback**:
   ```bash
   vercel rollback [deployment-url]
   ```

2. **Backend Rollback**:
   - Use Render dashboard to rollback to previous deployment
   - Or redeploy from a previous Git commit

3. **Database Rollback**:
   ```bash
   npm run migrate:down [version]
   ```

## 🔒 Security Considerations

### Pre-Deployment Security Checklist

#### Environment Security
- [ ] All secrets stored in environment variables (never in code)
- [ ] JWT secrets are 256-bit random strings
- [ ] Database connection strings use TLS encryption
- [ ] Google OAuth client secrets properly configured
- [ ] Cloudinary API secrets secured

#### Application Security
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] Rate limiting enabled and tested
- [ ] CORS properly configured for production domains
- [ ] Input validation implemented on all endpoints
- [ ] Authentication and authorization working correctly

#### Infrastructure Security
- [ ] TLS/SSL certificates valid and auto-renewing
- [ ] Database network access restricted
- [ ] CDN security features enabled
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery procedures tested

### Security Monitoring

#### Post-Deployment Security Validation
```bash
# Run security audit
npm run security:audit

# Check SSL configuration
curl -I https://your-domain.com

# Verify security headers
curl -I https://your-api-domain.com/health

# Test authentication endpoints
curl -X POST https://your-api-domain.com/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{"code":"invalid"}'
```

#### Ongoing Security Maintenance
- **Weekly**: Dependency vulnerability scans
- **Monthly**: Security configuration review
- **Quarterly**: Penetration testing
- **Annually**: Security policy review

### Incident Response

#### Security Incident Procedures
1. **Immediate Response**: Isolate affected systems
2. **Assessment**: Determine scope and impact
3. **Containment**: Apply temporary fixes
4. **Recovery**: Restore normal operations
5. **Post-Incident**: Document and improve

#### Emergency Contacts
- **Security Team**: security@srmap.edu.in
- **DevOps Team**: devops@srmap.edu.in
- **Emergency Hotline**: Available 24/7

## 📞 Support

For deployment issues:

1. Check the deployment logs in respective platforms
2. Review environment variable configuration
3. Verify external service connectivity
4. Check GitHub Actions workflow logs
5. Run security audit: `npm run security:audit`
6. Contact the development team with specific error messages

For security issues:
1. Review [SECURITY.md](./SECURITY.md) documentation
2. Check security monitoring dashboards
3. Contact security team immediately for critical issues

## 📚 Additional Resources

### Deployment Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Security Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [React Security Guide](https://snyk.io/blog/10-react-security-best-practices/)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

### Project Resources
- [Project Repository](https://github.com/your-org/srm-project-portal)
- [Security Policy](./SECURITY.md)
- [API Documentation](https://your-api-domain.com/docs)