# Requirements Document

## Introduction

The SRM University-AP Project Management Portal is a lean MVP designed to streamline project management for students and faculty. The system provides a public landing page with department-filtered project listings, strict authentication controls based on eligibility rosters, student group formation with unique codes, integrated Google Meet links, simplified submissions, and a comprehensive evaluation system with coordinator-controlled grade release.

## Glossary

- **Portal_System**: The SRM University-AP Project Management Portal web application
- **Eligibility_System**: The student eligibility validation system based on imported CSV data
- **Faculty_Roster**: The approved faculty member database with coordinator privileges
- **Group_System**: The student group formation and management system using 6-character codes
- **Project_System**: The project creation, approval, and assignment system
- **Evaluation_System**: The multi-component grading system with internal and external assessments
- **Window_System**: The time-based control system for various portal activities
- **Meet_Integration**: The Google Calendar and Meet link generation system

## Requirements

### Requirement 1: Authentication and Access Control

**User Story:** As a system administrator, I want strict access control based on eligibility and faculty rosters, so that only authorized users can access the portal.

#### Acceptance Criteria

1. WHEN a student attempts to authenticate, THE Portal_System SHALL verify their presence in the Eligibility_System for the active term
2. IF a student is not found in the Eligibility_System, THEN THE Portal_System SHALL return a 403 error with guidance based on their year (IDP for year-2, UROP for sem-7, CAPSTONE for sem-8)
3. WHEN a faculty member attempts to authenticate, THE Portal_System SHALL verify their presence in the Faculty_Roster with active status
4. WHERE a faculty member has isCoordinator set to true in Faculty_Roster, THE Portal_System SHALL grant coordinator privileges
5. THE Portal_System SHALL allow access to a single pre-seeded admin email with full administrative rights

### Requirement 2: Public Project Discovery

**User Story:** As a prospective student or visitor, I want to browse published projects filtered by department, so that I can understand available opportunities.

#### Acceptance Criteria

1. THE Portal_System SHALL display a public landing page with SRM branding and navigation to project listings
2. THE Portal_System SHALL show only projects with status "published" on the public projects page
3. WHEN displaying projects publicly, THE Portal_System SHALL show title, brief description, type, department, and faculty name
4. THE Portal_System SHALL generate department filter chips dynamically from the loaded project data
5. THE Portal_System SHALL allow filtering projects by department and type without requiring authentication

### Requirement 3: Group Formation and Management

**User Story:** As a student, I want to create or join groups using unique codes, so that I can collaborate with peers on project applications.

#### Acceptance Criteria

1. WHEN a student creates a group, THE Group_System SHALL generate a unique 6-character code using A-Z and 2-9 (excluding O/0, I/1, S/5)
2. THE Group_System SHALL allow up to 4 students to join a single group
3. WHILE a group has status "forming", THE Group_System SHALL allow members to leave and the creator to reset the code
4. WHEN a group submits an application, THE Group_System SHALL change status to "applied" and lock membership changes
5. THE Group_System SHALL prevent students from joining multiple groups of the same project type

### Requirement 4: Project Application and Assignment

**User Story:** As a student group, I want to apply for up to 3 project choices, so that I have options for project assignment.

#### Acceptance Criteria

1. THE Portal_System SHALL allow groups to select up to 3 project choices when applying
2. WHEN a faculty member or coordinator approves an application, THE Portal_System SHALL assign the group to the selected project
3. WHEN a group is approved for a project, THE Portal_System SHALL automatically reject their other pending applications
4. THE Portal_System SHALL set the group's projectId and facultyId upon approval
5. THE Portal_System SHALL create a Google Calendar event with Meet link for the approved group

### Requirement 5: Google Meet Integration

**User Story:** As a faculty member, I want automatic Google Meet links created for approved groups, so that I can conduct virtual meetings efficiently.

#### Acceptance Criteria

1. WHEN a group is approved for a project, THE Meet_Integration SHALL create a Google Calendar event with conferenceData
2. THE Meet_Integration SHALL include all group members and the assigned faculty as attendees
3. THE Meet_Integration SHALL store the meetUrl and calendarEventId in the group record
4. WHEN an external evaluator is assigned, THE Meet_Integration SHALL update the calendar event to include the external attendee
5. THE Meet_Integration SHALL handle calendar API errors gracefully and provide fallback options

### Requirement 6: Submission Management

**User Story:** As a student, I want to submit project deliverables including GitHub repository, report, and presentation, so that my work can be evaluated.

#### Acceptance Criteria

1. THE Portal_System SHALL require a GitHub URL for all submissions
2. THE Portal_System SHALL accept PDF reports with a maximum size of 50 MB
3. THE Portal_System SHALL accept presentation files (URL or PPT/PPTX) with a maximum size of 50 MB
4. THE Portal_System SHALL allow optional comments with submissions
5. THE Portal_System SHALL maintain a single "submitted" state per group

### Requirement 7: Evaluation System

**User Story:** As a faculty member, I want to evaluate student projects using a structured scoring system, so that grades are consistent and fair.

#### Acceptance Criteria

1. THE Evaluation_System SHALL provide three internal assessment components (A1: 0-20 points, A2: 0-30 points, A3: 0-50 points)
2. THE Evaluation_System SHALL automatically convert internal scores to final grades (A1: max 10, A2: max 15, A3: max 25)
3. THE Evaluation_System SHALL provide external evaluation with 0-100 points converting to maximum 50 points
4. THE Evaluation_System SHALL calculate total scores as sum of converted internal and external components
5. THE Evaluation_System SHALL recalculate totals automatically when any component score is updated

### Requirement 8: Grade Publication Control

**User Story:** As a coordinator, I want to control when evaluation results are visible to students, so that grades are released appropriately.

#### Acceptance Criteria

1. THE Portal_System SHALL hide all evaluation scores from students until coordinator publishes them
2. WHEN a coordinator publishes evaluations, THE Portal_System SHALL make component scores, conversions, and totals visible to students
3. THE Portal_System SHALL allow coordinators to bulk publish or unpublish multiple evaluations
4. THE Portal_System SHALL record publication timestamp and coordinator identity for audit purposes
5. THE Portal_System SHALL show Meet button to students for accessing group video calls

### Requirement 9: Window-Based Access Control

**User Story:** As a coordinator, I want to control time periods for different activities, so that the portal workflow follows academic schedules.

#### Acceptance Criteria

1. THE Window_System SHALL support five window types: grouping, application, faculty-edit-title, internal-eval, and external-eval
2. THE Window_System SHALL enforce time restrictions when enforced flag is set to true
3. WHEN a window is not active and enforcement is enabled, THE Portal_System SHALL reject related API requests
4. THE Window_System SHALL allow different windows for different project types (IDP, UROP, CAPSTONE)
5. THE Portal_System SHALL display appropriate user interface indicators for active and inactive windows

### Requirement 10: Eligibility Import and Management

**User Story:** As an administrator, I want to import student eligibility data from CSV files, so that access control is maintained for each academic term.

#### Acceptance Criteria

1. THE Portal_System SHALL accept CSV files matching the pattern eligibility_*.csv for bulk import
2. THE Portal_System SHALL upsert eligibility records based on the combination of email, type, termKind, year, and semester
3. THE Portal_System SHALL set validFrom and validTo dates based on term windows (odd: Jan-May, even: Aug-Dec)
4. THE Portal_System SHALL validate required fields (studentEmail, year, semester, termKind, type) during import
5. THE Portal_System SHALL provide import status feedback including success and error counts

### Requirement 11: Faculty Roster Management

**User Story:** As an administrator, I want to manage faculty roster with coordinator privileges, so that access levels are properly controlled.

#### Acceptance Criteria

1. THE Portal_System SHALL maintain a Faculty_Roster with email, name, department, coordinator status, and active status
2. THE Portal_System SHALL allow administrators to toggle coordinator and active status for faculty members
3. THE Portal_System SHALL prevent inactive faculty from accessing the portal
4. THE Portal_System SHALL grant coordinator privileges only to faculty with isCoordinator set to true
5. THE Portal_System SHALL support bulk import of faculty roster from CSV files

### Requirement 12: Theme and Accessibility

**User Story:** As a user, I want accessible light and dark themes with consistent design tokens, so that the portal is usable in different environments.

#### Acceptance Criteria

1. THE Portal_System SHALL provide CSS custom properties for background, surface, text colors, borders, and accent colors
2. THE Portal_System SHALL support both light and dark theme variants using CSS classes
3. THE Portal_System SHALL map theme tokens to Tailwind CSS utility classes
4. THE Portal_System SHALL replace all hardcoded color references with tokenized classes
5. THE Portal_System SHALL maintain the floating glass sidebar design while ensuring accessibility compliance