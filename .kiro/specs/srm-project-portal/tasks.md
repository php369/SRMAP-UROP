# Implementation Plan

- [x] 1. Bootstrap monorepo structure and shared configurations
  - Create monorepo with apps/web, apps/api, packages/ui, packages/config directories
  - Set up pnpm workspaces with shared TypeScript, ESLint, and Prettier configurations
  - Configure Tailwind CSS with custom design tokens for glassmorphism theme
  - _Requirements: 13.1, 13.2_

- [x] 2. Set up backend foundation and core middleware
  - [x] 2.1 Initialize Express.js server with TypeScript configuration
    - Create Express app with TypeScript setup and development scripts
    - Configure environment variable management with validation
    - Set up basic routing structure and health check endpoint
    - _Requirements: 13.1, 14.5_

  - [x] 2.2 Implement security middleware and CORS configuration
    - Configure Helmet.js for security headers and CSP policies
    - Set up CORS with frontend origin validation
    - Implement rate limiting middleware using express-rate-limit
    - _Requirements: 13.2, 13.3_

  - [x] 2.3 Set up MongoDB connection and Mongoose schemas
    - Configure MongoDB Atlas connection with Mongoose ODM
    - Create User, Assessment, Submission, Grade, and TokenStore schemas
    - Implement database connection pooling and error handling
    - _Requirements: 1.3, 2.1_

- [x] 3. Implement Google OAuth authentication system
  - [x] 3.1 Create Google OAuth integration with domain restriction
    - Set up Google OAuth 2.0 client configuration
    - Implement /auth/google endpoint with ID token verification
    - Add @srmap.edu.in domain validation and 403 error handling
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 3.2 Implement JWT session management
    - Create JWT token generation and validation middleware
    - Set up secure session storage with refresh token rotation
    - Implement /auth/me and /auth/refresh endpoints
    - _Requirements: 1.4, 2.3_

  - [x] 3.3 Create RBAC middleware for route protection
    - Implement role-based access control middleware
    - Create route guards for Student, Faculty, and Admin roles
    - Add unauthorized access logging and error responses
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Implement Google Calendar and Meet integration
  - [x] 4.1 Set up Google Calendar API client with OAuth tokens
    - Configure Google Calendar API client with proper scopes
    - Implement OAuth 3-legged flow for faculty Google account access
    - Create token storage and refresh mechanism per faculty
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 4.2 Create assessment with automatic Meet link generation
    - Implement POST /assessments endpoint with calendar event creation
    - Generate Google Meet links using conferenceData.createRequest
    - Store meetUrl and calendarEventId in assessment records
    - Handle calendar API errors and rollback on failures
    - _Requirements: 3.1, 3.5, 4.2_

- [x] 5. Build assessment management system
  - [x] 5.1 Create assessment CRUD operations
    - Implement GET /assessments with filtering by scope and cohort
    - Create PATCH /assessments/:id for faculty to edit assessments
    - Implement DELETE /assessments/:id with calendar event cleanup
    - _Requirements: 4.1, 4.3, 4.4_

  - [x] 5.2 Implement assessment visibility and access control
    - Create cohort-based assessment filtering for students
    - Implement course enrollment validation for assessment access

    - Add assessment status management (draft, published, closed)

    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Implement file upload and submission system
  - [x] 6.1 Set up Cloudinary integration for file storage
    - Configure Cloudinary client with signed upload URLs
    - Implement file type and size validation middleware
    - Create secure file access with expiring URLs
    - _Requirements: 6.1, 6.2, 6.4_

  - [x] 6.2 Create submission endpoints and validation
    - Implement POST /assessments/:id/submissions with file upload
    - Add due date validation and late submission rejection
    - Store submission metadata and file information in MongoDB
    - _Requirements: 6.3, 6.5_

  - [x] 6.3 Build submission viewing and management
    - Create GET /submissions/:id for detailed submission view
    - Implement GET /me/submissions for student submission history
    - Add submission status tracking and updates
    - _Requirements: 8.1, 8.2, 8.4, 8.5_

- [x] 7. Implement grading and feedback system
  - [x] 7.1 Create grading endpoints for faculty
    - Implement POST /submissions/:id/grade with score and rubric
    - Add detailed comments and feedback storage
    - Create timestamped grading history tracking
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 7.2 Implement grade visibility and access control
    - Ensure grades are visible only to respective students
    - Create grade update functionality with revision history
    - Add faculty grade management interface endpoints
    - _Requirements: 7.4, 7.5, 8.3_

- [x] 8. Build admin management system
  - [x] 8.1 Create user and role management endpoints
    - Implement GET /admin/users for user listing and search
    - Create PATCH /admin/users/:id for role modifications
    - Add cohort and course management functionality
    - _Requirements: 9.1, 9.2_

  - [x] 8.2 Implement reporting and analytics system
    - Create GET /admin/reports with submission and grading analytics
    - Calculate grading latency metrics and activity reports
    - Implement CSV export functionality for report data
    - _Requirements: 9.3, 9.4, 9.5_

- [x] 9. Set up real-time features with Socket.IO
  - [x] 9.1 Implement WebSocket server for presence tracking
    - Configure Socket.IO server with authentication middleware
    - Create presence tracking system with user online status
    - Implement room-based presence for different pages/contexts
    - _Requirements: 12.2_

  - [x] 9.2 Add real-time collaboration indicators
    - Create presence dots showing active users on assessments
    - Implement real-time submission notifications for faculty
    - Add live grading updates for students
    - _Requirements: 12.2_

- [ ] 10. Create frontend application shell and routing
  - [x] 10.1 Set up React application with Vite and TypeScript
    - Initialize React app with Vite build system
    - Configure TypeScript with strict mode and path mapping
    - Set up React Router with lazy loading and code splitting
    - _Requirements: 10.1, 13.1_

  - [x] 10.2 Implement theme provider and design system
    - Create theme provider with light/dark mode support
    - Implement Tailwind CSS custom design tokens
    - Build glassmorphism base components (GlassCard, GlowButton)
    - _Requirements: 10.1, 10.2_

  - [x] 10.3 Create authentication context and route guards
    - Implement React context for authentication state
    - Create protected route components with role-based access
    - Add authentication persistence and token refresh logic
    - _Requirements: 1.3, 2.1_

- [ ] 11. Build core UI components and layout system
  - [x] 11.1 Create floating glass sidebar navigation
    - Implement responsive sidebar with glassmorphism design
    - Add smooth animations and hover effects
    - Create navigation items with role-based visibility
    - _Requirements: 11.1, 11.4_

  - [x] 11.2 Implement top navigation bar with command palette
    - Create top navigation with breadcrumbs and user menu
    - Implement command palette (Cmd/Ctrl+K) with search functionality
    - Add theme toggle and user profile dropdown
    - _Requirements: 11.2, 11.3_

  - [x] 11.3 Build responsive layout components
    - Create BentoGrid layout for dashboard cards
    - Implement MasonryGrid for project listings
    - Add mobile-responsive navigation with swipe gestures
    - _Requirements: 10.4, 11.5_

- [ ] 12. Implement dashboard with animated visualizations
  - [x] 12.1 Create dashboard page with Bento grid layout
    - Build statistics cards showing key metrics
    - Implement animated counters and progress indicators
    - Add quick action cards for common tasks
    - _Requirements: 12.2_

  - [x] 12.2 Integrate Recharts with Framer Motion animations
    - Create animated area, line, and bar charts
    - Implement chart data fetching and real-time updates
    - Add interactive chart tooltips and legends
    - _Requirements: 12.2, 12.4_

  - [x] 12.3 Add Three.js hero section with 3D animations
    - Create 3D animated SRM-themed logo
    - Implement particle background and gradient mesh
    - Add magnetic call-to-action buttons with hover effects
    - _Requirements: 12.1, 12.4_

- [ ] 13. Build assessment management interface
  - [x] 13.1 Create assessment list view for faculty and students
    - Implement assessment cards with status indicators
    - Add filtering and sorting functionality
    - Display Meet links prominently for active assessments
    - _Requirements: 4.1, 4.2, 5.1, 5.2_

  - [x] 13.2 Build assessment creation and editing forms
    - Create comprehensive assessment form with validation
    - Implement cohort and course selection interface
    - Add due date picker with timezone handling
    - _Requirements: 3.1, 4.3_

  - [x] 13.3 Implement assessment detail pages
    - Create detailed assessment view with Meet link integration
    - Add submission statistics and progress tracking
    - Implement faculty grading interface within assessment view
    - _Requirements: 4.2, 4.5, 5.3_

- [ ] 14. Create submission and grading interfaces
  - [x] 14.1 Build file upload interface with drag-and-drop
    - Implement drag-and-drop file upload with progress indicators
    - Add file type validation and preview functionality
    - Create submission form with notes and metadata
    - _Requirements: 6.1, 6.5_

  - [x] 14.2 Create submission history and status tracking
    - Build submission list view for students
    - Implement submission detail pages with file downloads
    - Add grade display and feedback viewing
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 14.3 Implement grading interface for faculty
    - Create grading form with rubric support
    - Add comment system with rich text editing
    - Implement grade history and revision tracking
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [x] 15. Build project management features
  - [x] 15.1 Create project listing with masonry grid
    - Implement masonry layout for project cards
    - Add project flip cards with 3D animations
    - Create project filtering and search functionality
    - _Requirements: 12.3_

  - [x] 15.2 Implement Kanban board view
    - Create drag-and-drop Kanban board interface
    - Add project status management (Backlog, In-Progress, Review, Done)
    - Implement real-time updates for collaborative editing
    - _Requirements: 12.3_

  - [x] 15.3 Build project detail pages
    - Create parallax hero sections for project details
    - Implement 3D carousel for project artifacts
    - Add Gantt chart integration for timeline visualization
    - _Requirements: 12.3, 12.4_

- [x] 16. Create user profile and admin interfaces
  - [x] 16.1 Build user profile pages with 3D visualizations
    - Create 3D radar chart for skills visualization
    - Implement tag cloud for user interests and expertise
    - Add education timeline with interactive elements
    - _Requirements: 12.4_

  - [x] 16.2 Implement admin dashboard and user management
    - Create admin dashboard with system analytics
    - Build user management interface with role editing
    - Add cohort and course management functionality
    - _Requirements: 9.1, 9.2_

  - [x] 16.3 Create reporting interface with CSV export
    - Implement interactive reports with chart visualizations
    - Add filtering and date range selection for reports
    - Create CSV export functionality with progress indicators
    - _Requirements: 9.3, 9.4, 9.5_

- [x] 17. Implement API documentation and testing
  - [x] 17.1 Set up OpenAPI documentation with Swagger UI
    - Generate OpenAPI 3.0 specification from route definitions
    - Configure Swagger UI at /docs endpoint
    - Add comprehensive API examples and response schemas
    - _Requirements: 13.1_

  - [x] 17.2 Create comprehensive test suites
    - Write unit tests for API controllers and services
    - Implement integration tests for authentication and RBAC
    - Add E2E tests for critical user workflows
    - _Requirements: 13.5_

  - [x] 17.3 Set up performance monitoring and optimization
    - Implement Lighthouse performance auditing
    - Add bundle analysis and code splitting optimization
    - Create performance budgets and monitoring alerts
    - _Requirements: 10.5_

- [x] 18. Create seed data and development utilities
  - [x] 18.1 Build comprehensive seed data scripts
    - Create seed script for demo users (1 Admin, 2 Faculty, 4 Students)
    - Generate sample assessments with Meet links and calendar events
    - Create realistic submission and grading data
    - _Requirements: 14.5_

  - [x] 18.2 Implement development and debugging utilities
    - Create database reset and migration scripts
    - Add development logging and debugging middleware
    - Implement health check endpoints for monitoring
    - _Requirements: 14.4, 14.5_

- [x] 19. Set up deployment and CI/CD pipeline
  - [x] 19.1 Configure Vercel deployment for frontend
    - Set up Vercel project with environment variables
    - Configure build optimization and static asset handling
    - Implement preview deployments for pull requests
    - _Requirements: 14.1, 14.3_

  - [x] 19.2 Configure Render deployment for backend API
    - Set up Render service with Docker configuration
    - Configure environment variables and secrets management
    - Implement health checks and auto-deployment
    - _Requirements: 14.1, 14.3_

  - [x] 19.3 Set up CI/CD with GitHub Actions
    - Create workflows for linting, type checking, and testing
    - Implement automated deployment on main branch
    - Add smoke tests for deployed applications
    - _Requirements: 14.2, 14.3_

- [x] 20. Final integration and performance optimization
  - [x] 20.1 Implement end-to-end integration testing
    - Test complete user workflows from authentication to grading
    - Verify Google OAuth and Calendar API integration
    - Validate file upload and real-time features
    - _Requirements: 1.1, 3.1, 6.1_

  - [x] 20.2 Optimize application performance and bundle size
    - Implement code splitting and lazy loading optimization
    - Optimize images and static assets for web delivery
    - Add service worker for offline functionality
    - _Requirements: 10.5_

  - [x] 20.3 Conduct final security audit and documentation
    - Review and test all security measures and access controls
    - Create deployment guides and environment setup documentation
    - Validate compliance with all acceptance criteria
    - _Requirements: 13.2, 13.4_
