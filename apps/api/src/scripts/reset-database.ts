import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Group } from '../models/Group';
import { Application } from '../models/Application';
import { GroupSubmission } from '../models/GroupSubmission';
import { Submission } from '../models/Submission';
import { Evaluation } from '../models/Evaluation';
import { Assessment } from '../models/Assessment';
import { MeetingLog } from '../models/MeetingLog';
import { Notification } from '../models/Notification';
import { Window } from '../models/Window';
// Cohort model removed - functionality disabled
import { Course } from '../models/Course';
// StudentMeta model removed - functionality disabled

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/project-management';

// Users to keep
const USERS_TO_KEEP = [
  'krish_nariya@srmap.edu.in',
  'poojan_patel@srmap.edu.in'
];

async function resetDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Remove all users except admin and coordinator
    console.log('👤 Step 1: Cleaning up Users...');
    const usersToDelete = await User.find({
      email: { $nin: USERS_TO_KEEP }
    });
    
    console.log(`  Found ${usersToDelete.length} users to delete`);
    
    const deleteResult = await User.deleteMany({
      email: { $nin: USERS_TO_KEEP }
    });
    
    console.log(`  ✅ Deleted ${deleteResult.deletedCount} users`);
    
    // Verify remaining users
    const remainingUsers = await User.find().select('email name role isCoordinator');
    console.log(`  Remaining users (${remainingUsers.length}):`);
    remainingUsers.forEach(u => {
      console.log(`    - ${u.email} (${u.name}) - Role: ${u.role}${u.isCoordinator ? ' [COORDINATOR]' : ''}`);
    });

    // Step 2: Clear all projects
    console.log('\n📁 Step 2: Clearing Projects...');
    const projectCount = await Project.countDocuments();
    await Project.deleteMany({});
    console.log(`  ✅ Deleted ${projectCount} projects`);

    // Step 3: Clear all groups
    console.log('\n👥 Step 3: Clearing Groups...');
    const groupCount = await Group.countDocuments();
    await Group.deleteMany({});
    console.log(`  ✅ Deleted ${groupCount} groups`);

    // Step 4: Clear all applications
    console.log('\n📝 Step 4: Clearing Applications...');
    const applicationCount = await Application.countDocuments();
    await Application.deleteMany({});
    console.log(`  ✅ Deleted ${applicationCount} applications`);

    // Step 5: Clear all submissions
    console.log('\n📤 Step 5: Clearing Submissions...');
    const submissionCount = await Submission.countDocuments();
    const groupSubmissionCount = await GroupSubmission.countDocuments();
    await Submission.deleteMany({});
    await GroupSubmission.deleteMany({});
    console.log(`  ✅ Deleted ${submissionCount} submissions and ${groupSubmissionCount} group submissions`);

    // Step 6: Clear all evaluations
    console.log('\n⭐ Step 6: Clearing Evaluations...');
    const evaluationCount = await Evaluation.countDocuments();
    await Evaluation.deleteMany({});
    console.log(`  ✅ Deleted ${evaluationCount} evaluations`);

    // Step 7: Clear all assessments
    console.log('\n📊 Step 7: Clearing Assessments...');
    const assessmentCount = await Assessment.countDocuments();
    await Assessment.deleteMany({});
    console.log(`  ✅ Deleted ${assessmentCount} assessments`);

    // Step 8: Clear all meeting logs
    console.log('\n📅 Step 8: Clearing Meeting Logs...');
    const meetingLogCount = await MeetingLog.countDocuments();
    await MeetingLog.deleteMany({});
    console.log(`  ✅ Deleted ${meetingLogCount} meeting logs`);

    // Step 9: Clear all notifications
    console.log('\n🔔 Step 9: Clearing Notifications...');
    const notificationCount = await Notification.countDocuments();
    await Notification.deleteMany({});
    console.log(`  ✅ Deleted ${notificationCount} notifications`);

    // Step 10: Clear all windows
    console.log('\n🪟 Step 10: Clearing Windows...');
    const windowCount = await Window.countDocuments();
    await Window.deleteMany({});
    console.log(`  ✅ Deleted ${windowCount} windows`);

    // Step 11: Clear all cohorts (disabled - model removed)
    console.log('\n🎓 Step 11: Cohorts (skipped - model removed)...');
    const cohortCount = 0; // Model removed

    // Step 12: Clear all courses
    console.log('\n📚 Step 12: Clearing Courses...');
    const courseCount = await Course.countDocuments();
    await Course.deleteMany({});
    console.log(`  ✅ Deleted ${courseCount} courses`);

    // Step 13: Clear all student metadata (disabled - model removed)
    console.log('\n📋 Step 13: Student Metadata (skipped - model removed)...');
    const studentMetaCount = 0; // Model removed

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✨ Database Reset Complete!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`  Users: ${remainingUsers.length} remaining (${deleteResult.deletedCount} deleted)`);
    console.log(`  Projects: ${projectCount} deleted`);
    console.log(`  Groups: ${groupCount} deleted`);
    console.log(`  Applications: ${applicationCount} deleted`);
    console.log(`  Submissions: ${submissionCount + groupSubmissionCount} deleted`);
    console.log(`  Evaluations: ${evaluationCount} deleted`);
    console.log(`  Assessments: ${assessmentCount} deleted`);
    console.log(`  Meeting Logs: ${meetingLogCount} deleted`);
    console.log(`  Notifications: ${notificationCount} deleted`);
    console.log(`  Windows: ${windowCount} deleted`);
    console.log(`  Cohorts: ${cohortCount} deleted`);
    console.log(`  Courses: ${courseCount} deleted`);
    console.log(`  Student Metadata: ${studentMetaCount} deleted`);
    console.log('\n✅ Database is now clean and ready for fresh data!');

  } catch (error) {
    console.error('❌ Error during database reset:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the reset
resetDatabase()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Reset failed:', error);
    process.exit(1);
  });
