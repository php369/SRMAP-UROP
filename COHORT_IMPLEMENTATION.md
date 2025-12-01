# Cohort Management System

## Overview

The cohort management system allows administrators to organize users (students and faculty) into cohorts based on year and department. This is useful for bulk operations, eligibility management, and administrative organization.

## Features Implemented

### 1. Cohort Model
- **Location**: `apps/api/src/models/Cohort.ts`
- **Fields**:
  - `name`: Unique cohort name
  - `year`: Academic year (2020-2030)
  - `department`: Department name (enum of valid departments)
  - `members`: Array of User references
  - `status`: 'active' or 'inactive'
  - Timestamps (createdAt, updatedAt)

### 2. Cohort Service
- **Location**: `apps/api/src/services/cohortService.ts`
- **Methods**:
  - `createCohort()`: Create a new cohort
  - `getCohortById()`: Get cohort by ID with populated members
  - `getCohorts()`: Get all cohorts with optional filters (year, department, status)
  - `updateCohort()`: Update cohort details
  - `addMembers()`: Add members to a cohort
  - `removeMembers()`: Remove members from a cohort
  - `deleteCohort()`: Delete a cohort
  - `getUserCohorts()`: Get all active cohorts for a specific user
  - `bulkAddMembersByEmail()`: Bulk add members by email addresses
  - `getCohortStats()`: Get statistics (total members, members by role)

### 3. Cohort Routes
- **Location**: `apps/api/src/routes/cohorts.ts`
- **Base Path**: `/api/v1/cohorts`

#### Endpoints:

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/` | Admin | Create a new cohort |
| GET | `/` | Admin, Faculty, Coordinator | Get all cohorts (with filters) |
| GET | `/:id` | Admin, Faculty, Coordinator | Get cohort by ID |
| PUT | `/:id` | Admin | Update cohort details |
| DELETE | `/:id` | Admin | Delete cohort |
| POST | `/:id/members` | Admin | Add members to cohort |
| DELETE | `/:id/members` | Admin | Remove members from cohort |
| POST | `/:id/members/bulk` | Admin | Bulk add members by email |
| GET | `/:id/stats` | Admin, Faculty, Coordinator | Get cohort statistics |
| GET | `/user/:userId` | Authenticated | Get cohorts for a user |

### 4. Tests
- **Location**: `apps/api/src/__tests__/services/cohortService.test.ts`
- **Coverage**: 21 unit tests covering all service methods
- **Status**: ✅ All tests passing

## Usage Examples

### Create a Cohort
```bash
POST /api/v1/cohorts
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "CS 2024 Batch",
  "year": 2024,
  "department": "Computer Science",
  "members": []
}
```

### Get All Cohorts with Filters
```bash
GET /api/v1/cohorts?year=2024&department=Computer%20Science&status=active
Authorization: Bearer <token>
```

### Add Members to Cohort
```bash
POST /api/v1/cohorts/:cohortId/members
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "memberIds": ["userId1", "userId2", "userId3"]
}
```

### Bulk Add Members by Email
```bash
POST /api/v1/cohorts/:cohortId/members/bulk
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "emails": [
    "student1@srmap.edu.in",
    "student2@srmap.edu.in",
    "faculty1@srmap.edu.in"
  ]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "added": 2,
    "notFound": ["nonexistent@srmap.edu.in"],
    "alreadyInCohort": ["student1@srmap.edu.in"]
  }
}
```

### Get Cohort Statistics
```bash
GET /api/v1/cohorts/:cohortId/stats
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "totalMembers": 50,
    "membersByRole": {
      "student": 45,
      "faculty": 5
    },
    "status": "active"
  }
}
```

## Security & Access Control

- **Admin Only**: Create, update, delete cohorts, manage members
- **Admin/Faculty/Coordinator**: View cohorts and statistics
- **Authenticated Users**: View their own cohorts only

## Database Indexes

The following indexes are created for performance:
- `{ year: 1, department: 1 }` - For filtering by year and department
- `{ status: 1 }` - For filtering by status
- `{ name: 1 }` - Unique index for cohort names

## Integration

The cohort routes are registered in `apps/api/src/routes/index.ts` at:
```
/api/v1/cohorts
```

## Future Enhancements

Potential improvements:
1. Cohort-based eligibility management
2. Bulk operations on cohort members
3. Cohort templates for quick setup
4. Historical cohort data and analytics
5. Export cohort member lists to CSV
6. Cohort-based notifications

## Testing

Run the cohort service tests:
```bash
npm test -- cohortService.test.ts
```

All 21 tests should pass successfully.


## Student Interface

### Student Application Page
**Location**: `/dashboard/application`

Students can now:
- Browse all active cohorts
- View cohort details (name, year, department, member count, status)
- Join cohorts with a single click
- See their joined cohorts at the top of the page
- Cannot join the same cohort twice

### Features:
1. **My Cohorts Section**: Shows all cohorts the student has joined
2. **Available Cohorts Grid**: Displays all active cohorts with join buttons
3. **Join Confirmation Modal**: Confirms cohort details before joining
4. **Real-time Updates**: Automatically refreshes after joining
5. **Visual Feedback**: Toast notifications for success/error states

### Navigation:
- Added "Application" link to student sidebar navigation
- Uses the Users icon
- Protected route (students only)

The cohort system is now fully functional with both admin management and student participation interfaces!
