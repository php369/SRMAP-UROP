# SRM University-AP Project Management Portal

A comprehensive project management portal for SRM University-AP with Google OAuth integration, assessment workflows, and modern UI.

## Features

### 🔐 Authentication & Security

- Google OAuth 2.0 authentication with domain restriction (@srmap.edu.in)
- JWT-based session management with refresh tokens
- Role-based access control (Student, Faculty, Admin)
- Comprehensive security headers and CORS protection
- Rate limiting and DDoS protection
- Input validation and sanitization with Zod schemas

### 📝 Assessment Management

- Assessment creation with automatic Google Meet links
- Google Calendar integration for scheduling
- Real-time assessment status tracking
- Assessment eligibility and window management
- Automated assessment workflows

### 📁 File Management & Submissions

- Secure file upload with Cloudinary integration
- File type validation and size restrictions
- Group submission system
- Submission tracking and management
- File access control with signed URLs

### 👥 User & Group Management

- User profile management with role assignment
- Group formation and management
- Faculty roster management
- Student enrollment tracking
- Admin user management interface

### 📊 Grading & Evaluation

- Comprehensive grading system
- Grade history and tracking
- Evaluation workflows
- Performance analytics and reporting
- Real-time grade updates

### 🎨 Modern UI/UX

- Glassmorphism design with 3D animations
- Dark/light theme support with system preference detection
- Fully responsive design for all devices
- Interactive dashboard with real-time updates
- Accessibility-compliant interface (WCAG 2.1 AA)

### 🔄 Real-time Features

- WebSocket integration for live updates
- Real-time notifications
- Live assessment status updates
- Instant grade notifications

### 🛡️ Security & Compliance

- Comprehensive security audit system
- Automated vulnerability scanning
- OWASP Top 10 protection
- Data encryption in transit and at rest
- Security monitoring and incident response

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Framer Motion + Three.js
- **Backend**: Node.js + Express + TypeScript + MongoDB + Socket.IO
- **Authentication**: Google OAuth 2.0 + JWT
- **File Storage**: Cloudinary
- **Deployment**: Vercel (Frontend) + Render (Backend) + MongoDB Atlas

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- MongoDB Atlas account
- Google Cloud Console project
- Cloudinary account

### Installation

1. Clone the repository:


```bash
git clone <repository-url>
cd srm-project-portal
```

2. Install dependencies:


```bash
pnpm install
```

3. Set up environment variables (see Environment Setup section below)

4. Start development servers:


```bash
pnpm dev
```

## Environment Setup

### Required API Keys and Tokens

The following environment variables need to be configured:

#### Backend (.env in apps/api)


```env
# Database
MONGODB_URI=

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=

# Google OAuth & Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_CALENDAR_API_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# App Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001
```

#### Frontend (.env in apps/web)


```env
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=
```

### Google Cloud Console Setup

1. Create a new project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the following APIs:
   - Google+ API
   - Google Calendar API
3. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:5173/auth/callback`
   - Authorized JavaScript origins: `http://localhost:5173`
4. Configure OAuth consent screen with @srmap.edu.in domain restriction

### MongoDB Atlas Setup

1. Create a cluster in [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a database user
3. Whitelist your IP address
4. Get the connection string

### Cloudinary Setup

1. Create account at [Cloudinary](https://cloudinary.com)
2. Get your cloud name, API key, and API secret from the dashboard

## Development

### Available Scripts

#### Development

#### Development

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all packages
- `pnpm clean` - Clean build artifacts

#### Testing & Quality

- `pnpm clean` - Clean build artifacts

#### Testing & Quality

- `pnpm test` - Run all tests
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages

#### Database


#### Database

- `pnpm seed` - Seed database with demo data

#### Security & Deployment

- `pnpm security:audit` - Run comprehensive security audit
- `pnpm security:validate` - Validate security measures
- `pnpm security:check` - Run both audit and validation
- `pnpm deploy:validate` - Validate deployment health
- `pnpm deploy:validate:frontend` - Validate frontend deployment only
- `pnpm deploy:validate:backend` - Validate backend deployment only

#### Security & Deployment

- `pnpm security:audit` - Run comprehensive security audit
- `pnpm security:validate` - Validate security measures
- `pnpm security:check` - Run both audit and validation
- `pnpm deploy:validate` - Validate deployment health
- `pnpm deploy:validate:frontend` - Validate frontend deployment only
- `pnpm deploy:validate:backend` - Validate backend deployment only

### Project Structure

```
├── apps/
│   ├── web/                    # React frontend application
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   │   ├── admin/      # Admin-specific components
│   │   │   │   ├── assessments/# Assessment management
│   │   │   │   ├── auth/       # Authentication components
│   │   │   │   ├── grading/    # Grading system
│   │   │   │   ├── projects/   # Project management
│   │   │   │   ├── submissions/# File submission system
│   │   │   │   └── ui/         # Reusable UI components
│   │   │   ├── contexts/       # React contexts
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── pages/          # Page components
│   │   │   ├── services/       # API service layer
│   │   │   ├── stores/         # State management (Zustand)
│   │   │   └── utils/          # Utility functions
│   │   ├── e2e/               # End-to-end tests (Playwright)
│   │   └── scripts/           # Build and deployment scripts
│   └── api/                   # Express backend API
│       ├── src/
│       │   ├── config/        # Configuration files
│       │   ├── middleware/    # Express middleware
│       │   ├── models/        # MongoDB/Mongoose models
│       │   ├── routes/        # API route handlers
│       │   ├── services/      # Business logic services
│       │   ├── utils/         # Utility functions
│       │   └── __tests__/     # API tests (Jest)
│       └── scripts/           # Database scripts and utilities
│   ├── web/                    # React frontend application
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   │   ├── admin/      # Admin-specific components
│   │   │   │   ├── assessments/# Assessment management
│   │   │   │   ├── auth/       # Authentication components
│   │   │   │   ├── grading/    # Grading system
│   │   │   │   ├── projects/   # Project management
│   │   │   │   ├── submissions/# File submission system
│   │   │   │   └── ui/         # Reusable UI components
│   │   │   ├── contexts/       # React contexts
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── pages/          # Page components
│   │   │   ├── services/       # API service layer
│   │   │   ├── stores/         # State management (Zustand)
│   │   │   └── utils/          # Utility functions
│   │   ├── e2e/               # End-to-end tests (Playwright)
│   │   └── scripts/           # Build and deployment scripts
│   └── api/                   # Express backend API
│       ├── src/
│       │   ├── config/        # Configuration files
│       │   ├── middleware/    # Express middleware
│       │   ├── models/        # MongoDB/Mongoose models
│       │   ├── routes/        # API route handlers
│       │   ├── services/      # Business logic services
│       │   ├── utils/         # Utility functions
│       │   └── __tests__/     # API tests (Jest)
│       └── scripts/           # Database scripts and utilities
├── packages/
│   ├── ui/                    # Shared UI component library
│   └── config/                # Shared configurations
│       ├── eslint/            # ESLint configurations
│       ├── prettier/          # Prettier configurations
│       ├── tailwind/          # Tailwind CSS configurations
│       └── typescript/        # TypeScript configurations
├── scripts/                   # Project-wide scripts
│   ├── security-audit.js      # Comprehensive security auditing
│   ├── security-validation.js # Security validation testing
│   └── validate-deployment.js # Deployment health checks
├── docs/                      # Documentation
│   ├── ENVIRONMENT_SETUP.md   # Environment setup guide
│   └── SECURITY_COMPLIANCE.md # Security compliance documentation
├── DEPLOYMENT.md              # Deployment guide
├── DEPLOYMENT-CHECKLIST.md    # Pre-deployment checklist
└── SECURITY.md                # Security policy and procedures
│   ├── ui/                    # Shared UI component library
│   └── config/                # Shared configurations
│       ├── eslint/            # ESLint configurations
│       ├── prettier/          # Prettier configurations
│       ├── tailwind/          # Tailwind CSS configurations
│       └── typescript/        # TypeScript configurations
├── scripts/                   # Project-wide scripts
│   ├── security-audit.js      # Comprehensive security auditing
│   ├── security-validation.js # Security validation testing
│   └── validate-deployment.js # Deployment health checks
├── docs/                      # Documentation
│   ├── ENVIRONMENT_SETUP.md   # Environment setup guide
│   └── SECURITY_COMPLIANCE.md # Security compliance documentation
├── DEPLOYMENT.md              # Deployment guide
├── DEPLOYMENT-CHECKLIST.md    # Pre-deployment checklist
└── SECURITY.md                # Security policy and procedures
```

## Deployment

### Quick Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md) and [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md).

#### Automated Deployment (Recommended)

```bash
# Deploy via GitHub Actions (configured for main branch)
git push origin main

# Validate deployment
pnpm run deploy:validate
```

#### Manual Deployment

**Frontend (Vercel)**

```bash
cd apps/web
npm run deploy:prod
```

**Backend (Render)**

1. Connect GitHub repository to Render
2. Configure build: `cd apps/api && pnpm build`
3. Configure start: `cd apps/api && pnpm start`
4. Set environment variables from `.env.example`

### Deployment Environments

- **Production**: https://srm-portal-web.vercel.app
- **Staging**: https://srm-portal-web-staging.vercel.app
- **API**: https://srm-portal-api.onrender.com

### Security & Monitoring

```bash
# Pre-deployment security check
pnpm run security:check

# Post-deployment validation
pnpm run deploy:validate

# Monitor deployment health
pnpm run deploy:validate --watch
```

## API Documentation

The API includes comprehensive OpenAPI/Swagger documentation available at:

- **Production**: https://srm-portal-api.onrender.com/docs
- **Local Development**: http://localhost:3001/docs

## Testing

### Frontend Testing

```bash
cd apps/web
pnpm test:e2e          # End-to-end tests with Playwright
pnpm test:e2e:ui       # Interactive test runner
pnpm lighthouse        # Performance and accessibility audits
```

### Backend Testing

```bash
cd apps/api
pnpm test              # Unit and integration tests
pnpm test:coverage     # Test coverage report
```

### Security Testing

```bash
pnpm security:audit    # Comprehensive security audit
pnpm security:validate # Security validation tests
```

## Performance & Monitoring

### Performance Benchmarks

- **Frontend**: Core Web Vitals compliant, Lighthouse score >90
- **Backend**: API response time <200ms (95th percentile)
- **Database**: Query time <100ms (95th percentile)

### Monitoring Features

- Real-time health checks (`/health`, `/api/v1/status`)
- Performance monitoring with Web Vitals
- Error tracking and alerting
- Security monitoring and audit trails
- Automated dependency vulnerability scanning

## Security

This project implements comprehensive security measures including:

- **Authentication**: Google OAuth 2.0 with domain restrictions
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encryption in transit and at rest
- **Input Validation**: Zod schema validation on all endpoints
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- **Rate Limiting**: IP-based request throttling
- **File Security**: Type validation and secure cloud storage

For detailed security information, see [SECURITY.md](./SECURITY.md).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Run security audit before submitting PRs
- Ensure accessibility compliance
- Follow the established code style (ESLint + Prettier)

## Support

- **Documentation**: Check the `/docs` directory for detailed guides
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Security**: Report security vulnerabilities to security@srmap.edu.in
- **General**: Contact the development team for general inquiries
### Quick Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md) and [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md).

#### Automated Deployment (Recommended)

```bash
# Deploy via GitHub Actions (configured for main branch)
git push origin main

# Validate deployment
pnpm run deploy:validate
```

#### Manual Deployment

**Frontend (Vercel)**

```bash
cd apps/web
npm run deploy:prod
```

**Backend (Render)**

1. Connect GitHub repository to Render
2. Configure build: `cd apps/api && pnpm build`
3. Configure start: `cd apps/api && pnpm start`
4. Set environment variables from `.env.example`

### Deployment Environments

- **Production**: https://srm-portal-web.vercel.app
- **Staging**: https://srm-portal-web-staging.vercel.app
- **API**: https://srm-portal-api.onrender.com

### Security & Monitoring

```bash
# Pre-deployment security check
pnpm run security:check

# Post-deployment validation
pnpm run deploy:validate

# Monitor deployment health
pnpm run deploy:validate --watch
```

## API Documentation

The API includes comprehensive OpenAPI/Swagger documentation available at:

- **Production**: https://srm-portal-api.onrender.com/docs
- **Local Development**: http://localhost:3001/docs

## Testing

### Frontend Testing

```bash
cd apps/web
pnpm test:e2e          # End-to-end tests with Playwright
pnpm test:e2e:ui       # Interactive test runner
pnpm lighthouse        # Performance and accessibility audits
```

### Backend Testing

```bash
cd apps/api
pnpm test              # Unit and integration tests
pnpm test:coverage     # Test coverage report
```

### Security Testing

```bash
pnpm security:audit    # Comprehensive security audit
pnpm security:validate # Security validation tests
```

## Performance & Monitoring

### Performance Benchmarks

- **Frontend**: Core Web Vitals compliant, Lighthouse score >90
- **Backend**: API response time <200ms (95th percentile)
- **Database**: Query time <100ms (95th percentile)

### Monitoring Features

- Real-time health checks (`/health`, `/api/v1/status`)
- Performance monitoring with Web Vitals
- Error tracking and alerting
- Security monitoring and audit trails
- Automated dependency vulnerability scanning

## Security

This project implements comprehensive security measures including:

- **Authentication**: Google OAuth 2.0 with domain restrictions
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encryption in transit and at rest
- **Input Validation**: Zod schema validation on all endpoints
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- **Rate Limiting**: IP-based request throttling
- **File Security**: Type validation and secure cloud storage

For detailed security information, see [SECURITY.md](./SECURITY.md).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Run security audit before submitting PRs
- Ensure accessibility compliance
- Follow the established code style (ESLint + Prettier)

## Support

- **Documentation**: Check the `/docs` directory for detailed guides
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Security**: Report security vulnerabilities to security@srmap.edu.in
- **General**: Contact the development team for general inquiries

## License

MIT License - see LICENSE file for details

