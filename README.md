# SRM University-AP Project Management Portal

A comprehensive project management portal for SRM University-AP with Google OAuth integration, assessment workflows, group management, and modern UI. The system supports IDP, UROP, and CAPSTONE project types with streamlined application and submission workflows.

## Features

### 🔐 Authentication & Security

- Google OAuth 2.0 authentication with domain restriction (@srmap.edu.in)
- JWT-based session management with refresh tokens
- Role-based access control (Student, Faculty, Admin)
- Comprehensive security headers and CORS protection
- Rate limiting and DDoS protection
- Input validation and sanitization with Zod schemas

### 📝 Assessment & Meeting Management

- Assessment creation and management for faculty
- Meeting scheduling with Google Meet integration
- Student meeting log submissions and faculty approval
- Real-time assessment status tracking
- Grading system for submissions and meeting logs
- Assessment window management

### 📁 Project & Submission Management

- Project management for IDP, UROP, and CAPSTONE types
- Application system with eligibility checking
- Group and individual submission workflows
- Secure file upload with Cloudinary integration
- File type validation and size restrictions
- Submission tracking and status management
- Faculty evaluation and grading system

### 👥 User & Group Management

- User profile management with role assignment (Student, Faculty, Admin)
- Dynamic group formation and management
- Project application system with group/solo options
- Faculty coordinator assignment
- Admin user management interface
- Group member details tracking

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

- Live application status updates
- Real-time group formation tracking
- Assessment window status monitoring
- Meeting scheduling notifications
- Submission status updates

### 🛡️ Security & Compliance

- Comprehensive security audit system
- Automated vulnerability scanning
- OWASP Top 10 protection
- Data encryption in transit and at rest
- Security monitoring and incident response

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Framer Motion + Three.js
- **Backend**: Node.js + Express + TypeScript + MongoDB + Mongoose
- **Authentication**: Google OAuth 2.0 + JWT with domain restriction (@srmap.edu.in)
- **File Storage**: Cloudinary with secure upload and validation
- **Database**: MongoDB Atlas with optimized schemas
- **Deployment**: Vercel (Frontend) + Render (Backend)
- **Testing**: Playwright (E2E) + Jest (Unit/Integration)

## Recent Updates & Current Status

### ✅ Latest Improvements (December 2025)

- **Complete Database Reset**: Cleaned and optimized database schema, removed deprecated models
- **Assessment & Meetings System**: Fixed API endpoints and improved faculty/student workflows
- **Vercel Deployment**: Resolved all deployment issues and removed legacy cohort system
- **Group Management**: Enhanced group formation and application system
- **API Standardization**: Consistent response formats across all endpoints
- **TypeScript Compliance**: Resolved all compilation errors and improved type safety

### 🎯 Current System Focus

The system now focuses on core functionality:
- **Users**: Student, Faculty, and Admin roles with proper authentication
- **Projects**: IDP, UROP, and CAPSTONE project types
- **Groups**: Dynamic group formation and management
- **Applications**: Streamlined project application workflow
- **Submissions**: File upload and evaluation system
- **Assessments**: Meeting scheduling and grading system

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

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all packages
- `pnpm clean` - Clean build artifacts

#### Testing & Quality

- `pnpm test` - Run all tests
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages

#### Database

- `pnpm seed` - Seed database with initial users

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
│   │   │   │   ├── common/     # Common UI components
│   │   │   │   ├── projects/   # Project management
│   │   │   │   ├── submissions/# File submission system
│   │   │   │   └── ui/         # Reusable UI components
│   │   │   ├── contexts/       # React contexts (Auth, Theme)
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── pages/          # Page components
│   │   │   │   ├── admin/      # Admin pages
│   │   │   │   ├── faculty/    # Faculty pages
│   │   │   │   ├── student/    # Student pages
│   │   │   │   └── dashboard/  # Dashboard pages
│   │   │   ├── services/       # API service layer
│   │   │   ├── types/          # TypeScript type definitions
│   │   │   └── utils/          # Utility functions
│   │   └── scripts/           # Build and deployment scripts
│   └── api/                   # Express backend API
│       ├── src/
│       │   ├── config/        # Configuration files
│       │   ├── middleware/    # Express middleware
│       │   ├── models/        # MongoDB/Mongoose models
│       │   │   ├── User.ts    # User model with roles
│       │   │   ├── Project.ts # Project model (IDP/UROP/CAPSTONE)
│       │   │   ├── Group.ts   # Group management
│       │   │   ├── Application.ts # Application system
│       │   │   ├── Submission.ts  # Submission tracking
│       │   │   └── Assessment.ts  # Assessment management
│       │   ├── routes/        # API route handlers
│       │   ├── services/      # Business logic services
│       │   ├── utils/         # Utility functions
│       │   └── scripts/       # Database management scripts
│       └── scripts/           # Database utilities and reset tools
├── packages/
│   └── config/                # Shared configurations
│       ├── eslint/            # ESLint configurations
│       ├── prettier/          # Prettier configurations
│       ├── tailwind/          # Tailwind CSS configurations
│       └── typescript/        # TypeScript configurations
├── scripts/                   # Project-wide scripts
│   ├── security-audit.js      # Comprehensive security auditing
│   ├── security-validation.js # Security validation testing
│   └── validate-deployment.js # Deployment health checks
└── docs/                      # Documentation and fix logs
```

## Deployment

### Deployment Status

- **Frontend**: ✅ Deployment ready (all TypeScript errors resolved)
- **Backend**: ✅ Build successful (all deprecated models removed)
- **Database**: ✅ Clean state with optimized schema
- **API Endpoints**: ✅ Standardized and tested

### Quick Deployment

#### Automated Deployment (Recommended)

```bash
# Deploy via GitHub Actions (configured for main branch)
git push origin main

# Validate deployment
pnpm run deploy:validate
```

#### Manual Deployment

**Frontend (Vercel)**
- Automatic deployment on push to main branch
- Environment variables configured in Vercel dashboard

**Backend (Render)**
- Connected to GitHub repository
- Build command: `cd apps/api && pnpm build`
- Start command: `cd apps/api && pnpm start`
- Environment variables configured in Render dashboard

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

- Real-time health checks (`/health`, `/api/status`)
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