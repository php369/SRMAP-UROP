#!/usr/bin/env tsx

import mongoose from 'mongoose';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

// Import models
import { User, IUser } from '../models/User';
// Eligibility and FacultyRoster models removed - collections dropped from database
import { Project, IProject } from '../models/Project';
import { Group, IGroup } from '../models/Group';
import { Application, IApplication } from '../models/Application';
import { GroupSubmission, IGroupSubmission } from '../models/GroupSubmission';
import { Evaluation, IEvaluation } from '../models/Evaluation';
import { Window, IWindow } from '../models/Window';

/**
 * Comprehensive seed data script for SRM Project Portal
 * Creates demo users, courses, cohorts, assessments, submissions, and grades
 */

interface SeedData {
  users: {
    admin: IUser;
    students: IUser[];
  };
  facultyRoster: IFacultyRoster[];
  eligibilities: IEligibility[];
  projects: IProject[];
  groups: IGroup[];
  applications: IApplication[];
  submissions: IGroupSubmission[];
  evaluations: IEvaluation[];
  windows: IWindow[];
}

const seedData: Partial<SeedData> = {};

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB for seeding');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function clearExistingData(): Promise<void> {
  logger.info('🧹 Clearing existing data...');

  try {
    await Promise.all([
      Evaluation.deleteMany({}),
      GroupSubmission.deleteMany({}),
      Application.deleteMany({}),
      Group.deleteMany({}),
      Project.deleteMany({}),
      User.deleteMany({}),
      Window.deleteMany({}),
    ]);

    logger.info('✅ Existing data cleared');
  } catch (error) {
    logger.error('Failed to clear existing data:', error);
    throw error;
  }
}

async function createUsers(): Promise<void> {
  logger.info('👥 Creating users...');

  // Create Admin User - Poojan Patel
  const admin = new User({
    googleId: 'admin_poojan_patel',
    name: 'Poojan Patel',
    email: 'poojan_patel@srmap.edu.in',
    picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  });

  await admin.save();

  seedData.users = { admin, students: [] };
  logger.info(`✅ Created 1 admin user`);
}

async function createFacultyRoster(): Promise<void> {
  logger.info('👨‍🏫 Creating faculty roster...');

  // Only create admin as coordinator
  const facultyData = [
    {
      email: 'poojan_patel@srmap.edu.in',
      name: 'Poojan Patel',
      dept: 'Administration',
      isCoordinator: true,
      active: true,
    },
  ];

  const facultyRoster = await Promise.all(
    facultyData.map(f => new FacultyRoster(f).save())
  );

  seedData.facultyRoster = facultyRoster;
  logger.info(`✅ Created ${facultyRoster.length} faculty member (admin)`);
}

async function createWindows(): Promise<void> {
  logger.info('🪟 Creating time windows...');

  // No windows created - admin will configure these
  seedData.windows = [];
  logger.info(`✅ No time windows created (admin will configure)`);
}

async function createGroups(): Promise<void> {
  logger.info('👥 Creating sample groups...');

  // No groups created - will be created by students
  seedData.groups = [];
  logger.info(`✅ No groups created (students will create groups)`);
}

async function createApplications(): Promise<void> {
  logger.info('📋 Creating sample applications...');

  // No applications created - will be created by students
  seedData.applications = [];
  logger.info(`✅ No applications created (students will apply to projects)`);
}

async function createSubmissions(): Promise<void> {
  logger.info('📤 Creating group submissions...');

  // No submissions created - will be created by students
  seedData.submissions = [];
  logger.info(`✅ No submissions created (students will submit work)`);
}

async function createProjects(): Promise<void> {
  logger.info('🚀 Creating sample projects...');

  // No projects created - faculty will create projects
  seedData.projects = [];
  logger.info(`✅ No projects created (faculty will create projects)`);
}

async function createEligibilities(): Promise<void> {
  logger.info('🎯 Creating eligibility entries...');

  // No eligibilities created - admin will upload eligibility data
  seedData.eligibilities = [];
  logger.info(`✅ No eligibility entries created (admin will upload)`);
}

async function createEvaluations(): Promise<void> {
  logger.info('📊 Creating evaluations...');

  // No evaluations created - faculty will evaluate submissions
  seedData.evaluations = [];
  logger.info(`✅ No evaluations created (faculty will evaluate work)`);
}

async function displaySeedSummary(): Promise<void> {
  logger.info('\n🎉 Seed data creation completed successfully!');
  logger.info('='.repeat(50));

  const summary = {
    users: {
      admin: 1,
      students: seedData.users!.students.length,
    },
    facultyRoster: seedData.facultyRoster!.length,
    eligibilities: seedData.eligibilities!.length,
    projects: seedData.projects!.length,
    windows: seedData.windows!.length,
    groups: seedData.groups!.length,
    applications: seedData.applications!.length,
    submissions: seedData.submissions!.length,
    evaluations: seedData.evaluations!.length,
  };

  console.log('\n📊 Summary:');
  console.log(`👤 Users: ${summary.users.admin} admin only`);
  console.log(`👨‍🏫 Faculty Roster: ${summary.facultyRoster} (admin as coordinator)`);
  console.log(`🎯 Eligibilities: ${summary.eligibilities} (admin will upload)`);
  console.log(`🚀 Projects: ${summary.projects} (faculty will create)`);
  console.log(`🪟 Windows: ${summary.windows} (admin will configure)`);
  console.log(`👥 Groups: ${summary.groups} (students will create)`);
  console.log(`📋 Applications: ${summary.applications} (students will apply)`);
  console.log(`📤 Submissions: ${summary.submissions} (students will submit)`);
  console.log(`📊 Evaluations: ${summary.evaluations} (faculty will evaluate)`);

  console.log('\n🔑 Admin Login:');
  console.log('Email: poojan_patel@srmap.edu.in');

  console.log('\n📋 Clean Database:');
  console.log('• Only admin user exists');
  console.log('• No dummy/sample data');
  console.log('• Ready for real data entry through admin interface');
}

async function main(): Promise<void> {
  try {
    logger.info('🌱 Starting SRM Project Portal seed data creation...');

    await connectToDatabase();
    await clearExistingData();

    // Create data in dependency order
    await createUsers();
    await createFacultyRoster();
    await createEligibilities();
    await createProjects();
    await createWindows();
    await createGroups();
    await createApplications();
    await createSubmissions();
    await createEvaluations();

    await displaySeedSummary();

    logger.info('\n✅ Seed data creation completed successfully!');
    process.exit(0);

  } catch (error) {
    logger.error('❌ Seed data creation failed:', error);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main();
}

export { main as seedDatabase };