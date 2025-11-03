# Requirements Document

## Introduction

The SRM University-AP Project Management Portal is a comprehensive web application designed to facilitate project management, assessment workflows, and collaboration between students, faculty, and administrators. The system integrates with Google services for authentication, calendar management, and video conferencing, while providing a modern, high-performance user interface with advanced visualizations and animations.

## Glossary

- **Portal**: The SRM University-AP Project Management Portal web application
- **User**: Any person accessing the Portal (Student, Faculty, or Admin)
- **Student**: A user with student role privileges enrolled at SRM University-AP
- **Faculty**: A user with faculty role privileges who can create assessments and grade submissions
- **Admin**: A user with administrative privileges who can manage users, roles, and system configuration
- **Assessment**: A task or assignment created by Faculty with associated deadlines and evaluation criteria
- **Submission**: Student work uploaded in response to an Assessment
- **Cohort**: A group of students organized by year, department, or course
- **Meet Link**: A Google Meet video conference URL automatically generated for assessments
- **Calendar Event**: A Google Calendar entry created automatically when an assessment is scheduled
- **RBAC**: Role-Based Access Control system that restricts access based on user roles
- **OAuth Token**: Authentication credential used to access Google services on behalf of a user
- **Domain Restriction**: Security measure limiting access to users with @srmap.edu.in email addresses

## Requirements

### Requirement 1

**User Story:** As a user, I want to authenticate using my Google account with domain restrictions, so that only authorized SRM University-AP members can access the portal.

#### Acceptance Criteria

1. WHEN a user attempts to sign in, THE Portal SHALL verify the Google ID token including audience, issuer, expiration, and email verification status
2. IF a user's email domain is not @srmap.edu.in, THEN THE Portal SHALL block access with HTTP 403 status and display a clear error message
3. WHEN authentication succeeds, THE Portal SHALL create a session containing user ID, name, email, and role information
4. THE Portal SHALL maintain secure session management using JWT tokens
5. WHEN a user's Google account lacks email verification, THE Portal SHALL reject the authentication attempt

### Requirement 2

**User Story:** As a system administrator, I want role-based access control implemented throughout the application, so that users can only access features appropriate to their role.

#### Acceptance Criteria

1. THE Portal SHALL implement three distinct roles: Student, Faculty, and Admin
2. WHEN a user attempts to access a protected route, THE Portal SHALL verify their role permissions using RBAC middleware
3. IF a user lacks required permissions for a route, THEN THE Portal SHALL return HTTP 403 status and deny access
4. THE Portal SHALL guard every protected API endpoint with role-based authorization
5. WHEN role verification fails, THE Portal SHALL log the unauthorized access attempt

### Requirement 3

**User Story:** As faculty, I want to create assessments that automatically generate Google Meet links and calendar events, so that I can efficiently schedule and conduct virtual assessment sessions.

#### Acceptance Criteria

1. WHEN faculty creates an assessment, THE Portal SHALL automatically generate a Google Calendar event with conference data
2. THE Portal SHALL store Google Meet URL and calendar event ID in the assessment record
3. WHEN creating calendar events, THE Portal SHALL use OAuth 3-legged flow for faculty Google account access
4. THE Portal SHALL store and refresh OAuth tokens per faculty member
5. IF calendar event creation fails, THEN THE Portal SHALL return an error and prevent assessment creation

### Requirement 4

**User Story:** As faculty, I want to manage my assessments and view submission statistics, so that I can track student engagement and progress.

#### Acceptance Criteria

1. THE Portal SHALL display a list of assessments created by the authenticated faculty member
2. WHEN faculty views assessment details, THE Portal SHALL show Meet link, submission count, and current status
3. THE Portal SHALL allow faculty to edit assessment details including title, description, and due date
4. THE Portal SHALL enable faculty to delete assessments and automatically remove associated calendar events
5. THE Portal SHALL display real-time submission statistics for each assessment

### Requirement 5

**User Story:** As a student, I want to view assessments assigned to my cohort and access Meet links, so that I can participate in scheduled assessment sessions.

#### Acceptance Criteria

1. THE Portal SHALL display assessments targeted to the student's cohort and enrolled courses
2. WHEN a student views an assessment, THE Portal SHALL show the Google Meet link prominently
3. THE Portal SHALL display assessment due dates and remaining time until deadline
4. THE Portal SHALL show assessment status (upcoming, active, completed)
5. THE Portal SHALL filter assessments based on student's cohort membership and course enrollment

### Requirement 6

**User Story:** As a student, I want to submit work files and notes before assessment deadlines, so that I can complete my assignments and receive evaluation.

#### Acceptance Criteria

1. WHEN a student uploads files, THE Portal SHALL save them to cloud storage with progress indication
2. THE Portal SHALL validate file types and sizes before accepting uploads
3. IF submission occurs after due date, THEN THE Portal SHALL reject the submission with appropriate error message
4. THE Portal SHALL store submission metadata including file URLs, names, sizes, and content types in MongoDB
5. THE Portal SHALL allow students to include text notes with their file submissions

### Requirement 7

**User Story:** As faculty, I want to grade student submissions with scores and detailed feedback, so that I can provide comprehensive evaluation and guidance.

#### Acceptance Criteria

1. THE Portal SHALL allow faculty to assign numerical scores to submissions
2. WHEN faculty grades a submission, THE Portal SHALL record rubric fields and detailed comments
3. THE Portal SHALL maintain timestamped history of all grading actions
4. THE Portal SHALL make grades visible only to the respective student who submitted the work
5. THE Portal SHALL allow faculty to update grades and maintain revision history

### Requirement 8

**User Story:** As a student, I want to view my submissions and received grades, so that I can track my academic progress and understand feedback.

#### Acceptance Criteria

1. THE Portal SHALL display all submissions made by the authenticated student
2. WHEN a student views submission details, THE Portal SHALL show grading information if available
3. THE Portal SHALL display faculty comments and rubric scores for graded submissions
4. THE Portal SHALL show submission timestamps and grade history
5. THE Portal SHALL indicate pending submissions awaiting grading

### Requirement 9

**User Story:** As an admin, I want to manage users, roles, and generate reports, so that I can oversee system usage and academic performance.

#### Acceptance Criteria

1. THE Portal SHALL allow admins to view and modify user roles
2. THE Portal SHALL enable admins to manage cohorts and course assignments
3. WHEN admin requests reports, THE Portal SHALL generate analytics on submissions by assessment and course
4. THE Portal SHALL calculate and display grading latency metrics
5. THE Portal SHALL export report data in CSV format for external analysis

### Requirement 10

**User Story:** As a user, I want a modern, responsive interface with smooth animations and dark/light themes, so that I have an engaging and accessible user experience.

#### Acceptance Criteria

1. THE Portal SHALL implement glassmorphism design with gradient borders and glowing interactive elements
2. THE Portal SHALL provide dark and light theme options with smooth transitions
3. WHEN users interact with elements, THE Portal SHALL display neon hover effects and backdrop blur
4. THE Portal SHALL maintain responsive design across desktop, tablet, and mobile devices
5. THE Portal SHALL achieve Lighthouse performance scores of 90 or higher on key pages

### Requirement 11

**User Story:** As a user, I want advanced navigation features including a command palette and floating sidebar, so that I can efficiently navigate the application.

#### Acceptance Criteria

1. THE Portal SHALL provide a floating glass sidebar for primary navigation
2. WHEN users press Cmd/Ctrl+K, THE Portal SHALL open a command palette for quick actions
3. THE Portal SHALL display smooth breadcrumb navigation showing current location
4. THE Portal SHALL implement magnetic call-to-action buttons with hover animations
5. THE Portal SHALL provide swipe gesture support on mobile devices

### Requirement 12

**User Story:** As a user, I want interactive 3D visualizations and animated charts, so that I can better understand data and have an engaging experience.

#### Acceptance Criteria

1. THE Portal SHALL display a 3D animated SRM-themed logo using Three.js on the hero section
2. THE Portal SHALL implement animated Recharts for data visualization with area, line, and bar chart types
3. WHEN displaying project data, THE Portal SHALL use masonry grid layout with flip card animations
4. THE Portal SHALL provide 3D radar charts for user profiles and skill visualization
5. THE Portal SHALL implement parallax scrolling effects and smooth page transitions

### Requirement 13

**User Story:** As a developer, I want comprehensive API documentation and security measures, so that the system is maintainable and secure.

#### Acceptance Criteria

1. THE Portal SHALL serve OpenAPI 3.0 specification at /docs endpoint with interactive Swagger UI
2. THE Portal SHALL implement rate limiting per IP address to prevent abuse
3. WHEN processing user input, THE Portal SHALL validate all data using Zod or Joi schemas
4. THE Portal SHALL implement security headers using Helmet and proper CORS configuration
5. THE Portal SHALL provide structured error responses with appropriate HTTP status codes

### Requirement 14

**User Story:** As a system operator, I want automated deployment and monitoring capabilities, so that I can maintain system reliability and performance.

#### Acceptance Criteria

1. THE Portal SHALL support deployment to Vercel for frontend and Render for backend
2. THE Portal SHALL include CI/CD scripts for type checking, linting, and testing
3. WHEN deployment occurs, THE Portal SHALL run automated smoke tests to verify functionality
4. THE Portal SHALL provide health check endpoints for monitoring system status
5. THE Portal SHALL include seed data scripts for quick demonstration and testing