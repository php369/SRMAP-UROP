# SRM Project Portal - Seed Data

This document explains how to populate the database with sample data for development and testing.

## What Gets Created

The seed script creates comprehensive sample data including:

### 👥 Users (6 total)

- **1 Admin**: `admin@srmap.edu.in`
- **2 Faculty**:
  - `priya.sharma@srmap.edu.in` (Computer Science)
  - `rajesh.gupta@srmap.edu.in` (Information Technology)
- **5 Students**:
  - `poojan_patel@srmap.edu.in` (Computer Science, Year 3) - **Your Account**
  - `arjun.patel@srmap.edu.in` (Computer Science, Year 3)
  - `sneha.reddy@srmap.edu.in` (Computer Science, Year 3)
  - `vikram.singh@srmap.edu.in` (Information Technology, Year 2)
  - `ananya.iyer@srmap.edu.in` (Computer Science, Year 4)

### 🎓 Academic Data

- **2 Cohorts**: CS 2024 Batch, IT 2024 Batch
- **3 Courses**: Web Development, Software Engineering, System Design
- **4 Assessments**: Including React Portfolio Project, Design Patterns, etc.
- **4 Submissions**: Sample student submissions with files
- **3 Grades**: Detailed rubric-based grading

### 🎯 Eligibility Entries (Correct Rules)

- **5 Eligibility entries** following proper rules:
  - **Poojan Patel** (4th year, 7th sem): UROP only
  - **2nd & 3rd year students**: IDP only (up to 2 IDPs)
  - **4th year, 8th sem**: CAPSTONE only

### 🚀 Sample Projects (8 total)

- **3 IDP Projects**: Blockchain credentials, AR navigation, Microservices
- **3 UROP Projects**: AI analytics, NLP research, etc.
- **2 CAPSTONE Projects**: Smart campus IoT, Energy management

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

## Your Account Details

**Email**: `poojan_patel@srmap.edu.in`
**Name**: Poojan Patel
**Role**: Student
**Department**: Computer Science
**Year**: 4th Year, 7th Semester (Odd Term)
**Registration**: AP21110010001

**Project Eligibility**:

- ❌ IDP (2nd & 3rd year only)
- ✅ UROP (4th year, odd semester)
- ❌ CAPSTONE (4th year, even semester only)

## Testing the System

After running the seed script, you can:

1. **Visit the public pages**:
   - Landing page: `http://localhost:5174/`
   - Projects page: `http://localhost:5174/projects`

2. **Test authentication** with your account:
   - Email: `poojan_patel@srmap.edu.in`
   - Use Google OAuth (development setup required)

3. **Browse sample projects** on the public projects page

4. **Check eligibility** - Your account will be eligible for IDP and UROP projects

## Database Collections Created

- `users` - All user accounts
- `cohorts` - Academic cohorts
- `courses` - Course information
- `assessments` - Assignments and projects
- `submissions` - Student submissions
- `grades` - Grading data with rubrics
- `eligibilities` - Project eligibility entries
- `projects` - Published project listings

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
