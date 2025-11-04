# Implementation Plan

- [x] 1. Phase 0 - Cleanup & Theme
  - [x] 1.1 Add theme tokens to apps/web/src/styles/theme.css and map in Tailwind
    - Create CSS custom properties for --bg, --surface, --textPrimary, --textSecondary, --border, --accent
    - Map theme tokens to Tailwind colors in theme.extend.colors
    - Create :root and .dark class variants for light/dark themes
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 1.2 Replace all hardcoded text-white/black usages with tokenized classes
    - Search and replace text-white with text-textPrimary
    - Search and replace text-black with text-textPrimary
    - Update bg-white/bg-black to use theme tokens
    - _Requirements: 12.4, 12.5_

  - [x] 1.3 Keep floating glass sidebar and inject SRM logos
    - Maintain existing glass sidebar design
    - Add SRM logo files to apps/web/public/branding/ directory
    - Update sidebar to display SRM branding
    - _Requirements: 12.5_

- [x] 2. Phase 1 - Models & Indexes
  - [x] 2.1 Implement Mongoose models for Project, Eligibility, FacultyRoster
    - Create Project model with title, brief, description, type, department, facultyId, facultyName, capacity, status fields
    - Create Eligibility model with studentEmail, regNo, year, semester, termKind, type, validFrom, validTo fields
    - Create FacultyRoster model with email, name, dept, isCoordinator, active fields
    - _Requirements: 1.1, 1.2, 2.1, 11.1, 11.2_

  - [x] 2.2 Implement Mongoose models for Group, Application, Window, Evaluation
    - Create Group model with code, type, memberIds, projectId, facultyId, meetUrl, calendarEventId, status fields
    - Create Application model with groupId, choices, state, decidedBy, decidedAt, notes fields
    - Create Window model with kind, type, start, end, enforced fields
    - Create Evaluation model with groupId, projectId, facultyId, internal/external scores, totals, isPublished fields
    - _Requirements: 3.1, 3.2, 4.1, 7.1, 7.2, 9.1_

  - [x] 2.3 Add database indexes for performance optimization
    - Add compound index on Eligibility: { studentEmail:1, type:1, termKind:1, year:1, semester:1 }
    - Add unique index on FacultyRoster: { email:1 }
    - Add compound index on Project: { status:1, type:1, department:1 }
    - Add unique index on Group: { code:1 }
    - Add compound index on Evaluation: { groupId:1, projectId:1 }
    - _Requirements: 1.1, 2.1, 3.1, 7.1_

  - [x] 2.4 Implement evaluation converters and totals calculation
    - Create conversion logic: A1 (0-20→0-10), A2 (0-30→0-15), A3 (0-50→0-25), External (0-100→0-50)
    - Implement automatic totals calculation on score updates
    - Add validation for score ranges and conversion accuracy
    - _Requirements: 7.2, 7.3, 7.4_

- [x] 3. Phase 2 - Auth & Guards
  - [x] 3.1 Update /auth/google to enforce Eligibility/FacultyRoster/Admin rules
    - Verify Google ID token and extract user information
    - Check student eligibility in Eligibility collection for active term
    - Verify faculty presence in FacultyRoster with active status
    - Return 403 with clear guidance for unauthorized users (IDP year-2, UROP sem-7, CAPSTONE sem-8)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 3.2 Add role guards and Window enforcement middleware
    - Create RBAC middleware for Student, Faculty, Coordinator, Admin roles
    - Implement Window enforcement middleware for time-based access control
    - Add route protection based on user roles and active windows
    - Create error responses for unauthorized access and inactive windows
    - _Requirements: 1.1, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 4. Phase 3 - Public Pages
  - [x] 4.1 Build landing page (/) with SRM branding
    - Create public landing page with SRM logo and one-liner description
    - Add "Browse Projects" and "Sign in" navigation buttons
    - Implement responsive design with theme token integration
    - _Requirements: 2.1, 12.1, 12.5_

  - [x] 4.2 Build public projects page (/projects) with filtering
    - Display published projects with title, brief, type, department, facultyName
    - Generate department filter chips dynamically from project data
    - Implement filtering by department and type without authentication
    - Add responsive grid layout for project cards
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 5. Phase 4 - Faculty Projects & Approvals
  - [x] 5.1 Implement faculty project CRUD operations
    - Create project creation form with title, brief, description, department, prerequisites, type, capacity fields
    - Implement project editing functionality for faculty-owned projects
    - Add draft/save functionality before submission for approval
    - _Requirements: 4.1, 4.3_

  - [x] 5.2 Add project submit-for-approval workflow
    - Create submit-for-approval endpoint for faculty projects
    - Change project status from draft to pending approval
    - Notify coordinators of pending project approvals
    - _Requirements: 4.1, 4.3_

  - [x] 5.3 Implement coordinator approve/reject functionality
    - Create coordinator interface for project approvals
    - Add approve/reject actions that change status to published/archived
    - Implement bulk approval functionality for multiple projects
    - _Requirements: 4.1, 4.3_

- [ ] 6. Phase 5 - Groups & Applications
  - [ ] 6.1 Implement group code generator and management
    - Create 6-character code generator using A-Z + 2-9 (exclude O/0 I/1 S/5)
    - Implement group creation with unique code generation
    - Add group join functionality with code validation
    - Create reset-code and delete-group functionality for forming status
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [ ] 6.2 Build group application system with project choices
    - Implement application creation with up to 3 project choices
    - Lock group membership when application is submitted
    - Validate project eligibility based on student type and group type
    - _Requirements: 4.1, 4.2, 3.4_

  - [ ] 6.3 Create application decision workflow
    - Implement faculty/coordinator approve/reject functionality
    - On approval: set group projectId/facultyId, reject other applications
    - Add decision tracking with timestamp and decision maker
    - Create notification system for application status changes
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ] 7. Phase 6 - Meet Integration
  - [ ] 7.1 Implement Google Calendar event creation on approval
    - Create Calendar API integration with OAuth 2.0 authentication
    - Generate Calendar events with conferenceData for Meet links
    - Include group members and assigned faculty as attendees
    - Store meetUrl and calendarEventId in group record
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 7.2 Add external evaluator assignment and calendar updates
    - Implement external faculty assignment to groups
    - Update existing calendar events to add external evaluator as attendee
    - Handle calendar API errors gracefully with fallback options
    - _Requirements: 5.1, 5.5_

- [ ] 8. Phase 7 - Submissions & Assessments
  - [ ] 8.1 Build submission system with file upload
    - Create submission form with GitHub URL (required), report PDF (≤50MB), presentation URL/file (≤50MB)
    - Implement file validation and size limits
    - Add optional comments field for submissions
    - Maintain single "submitted" state per group
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 8.2 Implement student assessments view with grade masking
    - Create assessments page showing A1/A2/A3 + External components
    - Mask all scores until coordinator publishes evaluations
    - Show component scores, conversions, and totals after publication
    - Add Meet button for accessing group video calls
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 9. Phase 8 - Evaluations & Publish
  - [ ] 9.1 Create faculty evaluation endpoints for internal assessments
    - Implement A1/A2/A3 conduct score entry endpoints for faculty
    - Add automatic score conversion and totals calculation
    - Validate score ranges and prevent invalid entries
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 9.2 Implement external evaluation system
    - Create external evaluator endpoints for final conduct scores
    - Add external evaluation form with 0-100 point scale
    - Implement automatic conversion to 50-point maximum
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

  - [ ] 9.3 Build coordinator bulk publish/unpublish functionality
    - Create coordinator interface for evaluation publication control
    - Implement bulk publish/unpublish for multiple evaluations
    - Record publication timestamp and coordinator identity
    - Add grade visibility toggle for students
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 10. Phase 9 - Eligibility Import & Admin
  - [ ] 10.1 Create eligibility CSV import system
    - Implement POST /admin/eligibility/import endpoint
    - Parse CSV files matching pattern /seed/eligibility\_\*.csv
    - Upsert records by (email, type, termKind, year, semester) combination
    - Set validFrom/validTo dates based on term windows
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 10.2 Build admin user and faculty roster management
    - Create admin interface for FacultyRoster management
    - Implement toggle functionality for coordinator and active status
    - Add user management with role assignments
    - Create export functionality for reports and data
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 11. Phase 10 - Remove/Defer Heavy Features
  - [ ] 11.1 Remove Three.js, particles, 3D visualizations
    - Remove Three.js dependencies and 3D components
    - Remove particle background and gradient mesh effects
    - Simplify hero sections to use standard CSS/Tailwind
    - _Requirements: 12.5_

  - [ ] 11.2 Remove analytics, Gantt charts, Kanban boards
    - Remove complex analytics dashboards and reporting
    - Remove Gantt chart components and timeline visualizations
    - Remove Kanban board drag-and-drop functionality
    - Simplify project management to basic list views
    - _Requirements: 12.5_

  - [ ] 11.3 Remove command palette and presence indicators
    - Remove command palette (Cmd/Ctrl+K) functionality
    - Remove real-time presence dots and collaboration features
    - Remove complex filtering and search interfaces
    - Simplify navigation to basic menu structure
    - _Requirements: 12.5_

  - [ ] 11.4 Consolidate grades into assessments page
    - Remove separate "Grades" page from navigation
    - Show all grade information within Assessments page
    - Simplify grade display to essential information only
    - _Requirements: 8.1, 8.2_

- [ ] 12. Phase 11 - Tests & Deploy
  - [ ] 12.1 Write unit tests for core functionality
    - Test group code generation and uniqueness validation
    - Test evaluation score converters and totals calculation
    - Test authentication guards and role validation
    - Test CSV parsers and data import functionality
    - _Requirements: 3.1, 7.4, 1.1, 10.1_

  - [ ] 12.2 Create end-to-end smoke tests
    - Test complete student workflow: auth → group → apply → submit → view grades
    - Test faculty workflow: project creation → approval → evaluation
    - Test coordinator workflow: window management → grade publication
    - _Requirements: 1.1, 4.1, 7.1, 8.1_

  - [ ] 12.3 Configure deployment environments
    - Set up Vercel deployment for apps/web with environment variables
    - Configure Render deployment for apps/api with health checks
    - Set up MongoDB Atlas connection and environment secrets
    - Configure Google OAuth and Calendar API credentials
    - _Requirements: 1.1, 5.1_

  - [ ] 12.4 Create seed data and run initial deployment
    - Create seed scripts for eligibility, faculty roster, and sample projects
    - Run database migrations and seed data in production
    - Perform smoke tests on deployed applications
    - Validate Google integrations in production environment
    - _Requirements: 10.1, 11.1_
