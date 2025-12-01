# Deployment Checklist

This checklist ensures all deployment requirements are met before going live.

## Pre-Deployment Checklist

### 🔧 Environment Setup

#### Vercel (Frontend)
- [ ] Vercel account created and connected to GitHub repository
- [ ] Project created in Vercel dashboard
- [ ] Custom domain configured (if applicable)
- [ ] Environment variables configured:
  - [ ] `VITE_API_URL` - Backend API URL
  - [ ] `VITE_GOOGLE_CLIENT_ID` - Google OAuth Client ID
  - [ ] `VITE_ENVIRONMENT` - Set to "production"
  - [ ] `VITE_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name

#### Render (Backend)
- [ ] Render account created and connected to GitHub repository
- [ ] Web service created with correct configuration
- [ ] Database service created (PostgreSQL/MongoDB)
- [ ] Environment variables configured:
  - [ ] `NODE_ENV=production`
  - [ ] `MONGODB_URI` - Database connection string
  - [ ] `JWT_SECRET` - Strong JWT secret (256-bit)
  - [ ] `JWT_REFRESH_SECRET` - Strong refresh token secret
  - [ ] `GOOGLE_CLIENT_ID` - Google OAuth Client ID
  - [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
  - [ ] `GOOGLE_REDIRECT_URI` - OAuth redirect URI
  - [ ] `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
  - [ ] `CLOUDINARY_API_KEY` - Cloudinary API key
  - [ ] `CLOUDINARY_API_SECRET` - Cloudinary API secret
  - [ ] `FRONTEND_URL` - Frontend application URL
  - [ ] `ALLOWED_ORIGINS` - CORS allowed origins

#### MongoDB Atlas
- [ ] MongoDB Atlas account created
- [ ] Cluster created with appropriate tier
- [ ] Database user created with read/write permissions
- [ ] Network access configured (IP whitelist)
- [ ] Connection string obtained and configured

#### Google Cloud Console
- [ ] Google Cloud project created
- [ ] OAuth 2.0 credentials created
- [ ] Authorized redirect URIs configured
- [ ] Calendar API enabled
- [ ] Domain verification completed (if using custom domain)

#### Cloudinary
- [ ] Cloudinary account created
- [ ] Upload presets configured
- [ ] API credentials obtained
- [ ] Storage limits configured

### 🔒 Security Configuration

#### SSL/TLS
- [ ] SSL certificates configured and valid
- [ ] HTTPS redirect enabled
- [ ] HSTS headers configured
- [ ] Security headers implemented (CSP, X-Frame-Options, etc.)

#### Authentication & Authorization
- [ ] JWT secrets are strong and unique
- [ ] OAuth configuration tested
- [ ] Role-based access control implemented
- [ ] Session management configured

#### Data Protection
- [ ] Input validation implemented
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] File upload security configured
- [ ] Rate limiting enabled

### 🧪 Testing & Validation

#### Automated Tests
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] End-to-end tests passing
- [ ] Security audit completed
- [ ] Performance tests completed

#### Manual Testing
- [ ] Authentication flow tested
- [ ] Core user workflows tested
- [ ] File upload functionality tested
- [ ] Google Calendar integration tested
- [ ] Email notifications tested (if applicable)

### 📊 Monitoring & Observability

#### Health Checks
- [ ] Health endpoints implemented (`/health`, `/api/v1/status`)
- [ ] Readiness probes configured
- [ ] Liveness probes configured
- [ ] Database connectivity monitoring

#### Logging & Monitoring
- [ ] Application logging configured
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured

#### Alerting
- [ ] Downtime alerts configured
- [ ] Error rate alerts configured
- [ ] Performance degradation alerts configured
- [ ] Database connection alerts configured

## Deployment Process

### 1. Pre-Deployment Validation

```bash
# Run all tests
pnpm test

# Security audit
pnpm run security:check

# Build verification
pnpm run build

# Type checking
pnpm run type-check

# Linting
pnpm run lint
```

### 2. Environment Configuration

```bash
# Verify environment variables
node scripts/validate-env.js

# Test database connectivity
node scripts/test-db-connection.js

# Verify external service connectivity
node scripts/test-external-services.js
```

### 3. Deployment Execution

#### Automated Deployment (Recommended)
```bash
# Deploy via GitHub Actions
git push origin main
```

#### Manual Deployment
```bash
# Frontend deployment
cd apps/web
npm run deploy:prod

# Backend deployment
# (Handled automatically by Render on git push)
```

### 4. Post-Deployment Validation

```bash
# Validate deployment
pnpm run deploy:validate

# Run smoke tests
pnpm run test:smoke

# Performance check
pnpm run test:performance
```

## Post-Deployment Checklist

### 🔍 Immediate Validation (0-15 minutes)

- [ ] Frontend application loads successfully
- [ ] Backend API responds to health checks
- [ ] Database connectivity verified
- [ ] Authentication flow works
- [ ] Core functionality accessible

### 📈 Extended Validation (15-60 minutes)

- [ ] All API endpoints responding correctly
- [ ] File upload functionality working
- [ ] Google Calendar integration functional
- [ ] Email notifications working (if applicable)
- [ ] Performance metrics within acceptable ranges

### 🔄 Ongoing Monitoring (1+ hours)

- [ ] Error rates within normal ranges
- [ ] Response times acceptable
- [ ] Database performance stable
- [ ] No memory leaks detected
- [ ] SSL certificates valid and auto-renewing

## Rollback Procedures

### Frontend Rollback (Vercel)
```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Backend Rollback (Render)
1. Go to Render Dashboard
2. Select the service
3. Go to "Deploys" tab
4. Click "Redeploy" on a previous successful deployment

### Database Rollback
```bash
# Restore from backup (if needed)
mongorestore --uri="mongodb+srv://..." --drop backup/
```

## Emergency Contacts

- **DevOps Team**: devops@srmap.edu.in
- **Security Team**: security@srmap.edu.in
- **Database Admin**: dba@srmap.edu.in
- **Emergency Hotline**: Available 24/7

## Deployment Environments

### Production
- **Frontend**: https://srm-portal-web.vercel.app
- **Backend**: https://srm-portal-api.onrender.com
- **Database**: MongoDB Atlas Production Cluster

### Staging
- **Frontend**: https://srm-portal-web-staging.vercel.app
- **Backend**: https://srm-portal-api-staging.onrender.com
- **Database**: MongoDB Atlas Staging Cluster

### Development
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Database**: Local MongoDB or Atlas Development Cluster

## Performance Benchmarks

### Frontend
- **First Contentful Paint**: < 2 seconds
- **Largest Contentful Paint**: < 4 seconds
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 5 seconds

### Backend
- **API Response Time**: < 200ms (95th percentile)
- **Database Query Time**: < 100ms (95th percentile)
- **Error Rate**: < 1%
- **Uptime**: > 99.9%

## Security Benchmarks

- **SSL Rating**: A+ (SSL Labs)
- **Security Headers**: All implemented
- **Vulnerability Scan**: No high/critical issues
- **Dependency Audit**: No known vulnerabilities
- **Authentication**: Multi-factor where applicable

## Compliance Requirements

- **Data Protection**: GDPR compliance for EU users
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Core Web Vitals passing
- **Security**: OWASP Top 10 protection implemented

---

**Note**: This checklist should be reviewed and updated regularly to reflect changes in infrastructure, security requirements, and deployment processes.