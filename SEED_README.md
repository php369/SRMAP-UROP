# SRM Project Portal - Seed Data

This document explains how to initialize the database with minimal data for production use.

## What Gets Created

The seed script creates only essential data:

### 👥 Users (1 total)

- **1 Admin**: `poojan_patel@srmap.edu.in` (Poojan Patel)

### 👨‍🏫 Faculty Roster (1 entry)

- **Admin as Coordinator**: `poojan_patel@srmap.edu.in` (Administration department)

### 🎓 No Sample Data

- **No Students**: Students will register through Google OAuth
- **No Projects**: Faculty will create projects through the admin interface
- **No Eligibilities**: Admin will upload eligibility data via CSV
- **No Groups**: Students will form groups during the grouping window
- **No Applications**: Students will apply to projects during application window
- **No Submissions**: Students will submit work through the portal
- **No Evaluations**: Faculty will evaluate submissions through the portal
- **No Windows**: Admin will configure time windows through the admin interface

## How to Run

### Prerequisites

1. MongoDB running locally or connection string configured
2. Environment variables set up (see `.env.example`)

### Run the Seed Script

```bash
# Navigate to API directory
cd apps/api

# Install dependencies (if not already done)
npm install

# Run the seed script
npm run seed
```

### Alternative Method

```bash
# Direct execution with tsx
npx tsx src/scripts/seed.ts
```

## What Happens

1. **Clears existing data** - All collections are emptied
2. **Creates users** - Admin, faculty, and students with profiles
3. **Sets up academic structure** - Cohorts and courses
4. **Creates assessments** - Sample assignments and projects
5. **Adds submissions** - Realistic student work samples
6. **Generates grades** - Detailed rubric-based evaluations
7. **Sets eligibility** - Project eligibility for all students
8. **Publishes projects** - Sample projects for browsing

## Admin Account Details

**Email**: `poojan_patel@srmap.edu.in`
**Name**: Poojan Patel
**Role**: Admin & Coordinator
**Department**: Administration

## After Running Seed Script

After running the seed script, you can:

1. **Visit the portal**:
   - Landing page: `http://localhost:5174/`
   - Login with Google OAuth using admin email

2. **Configure the system**:
   - Upload student eligibility data via CSV
   - Configure time windows for grouping and applications
   - Add faculty to the roster
   - Create or approve projects

3. **Clean slate**:
   - No dummy data to clean up
   - Ready for production use
   - All data will be real data entered by users

## Database Collections Created

- `users` - Admin user only
- `facultyRoster` - Admin as coordinator
- `eligibilities` - Empty (admin will upload)
- `projects` - Empty (faculty will create)
- `groups` - Empty (students will create)
- `applications` - Empty (students will apply)
- `submissions` - Empty (students will submit)
- `evaluations` - Empty (faculty will evaluate)
- `windows` - Empty (admin will configure)

## Troubleshooting

### Connection Issues

- Ensure MongoDB is running
- Check connection string in environment variables
- Verify network connectivity

### Permission Errors

- Ensure write permissions to database
- Check MongoDB user permissions

### Script Errors

- Check all required models are properly imported
- Verify environment variables are set
- Look for TypeScript compilation errors

## Resetting Data

To reset and re-seed:

```bash
npm run seed
```

The script automatically clears existing data before creating new entries.
