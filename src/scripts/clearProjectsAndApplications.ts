import mongoose from 'mongoose';
import { config } from '../config/environment';
import { Project } from '../models/Project';
import { Application } from '../models/Application';
import { Group } from '../models/Group';
import { MeetingLog } from '../models/MeetingLog';
import { logger } from '../utils/logger';

async function clearProjectsAndApplications() {
    try {
        // Connect to database
        await mongoose.connect(config.MONGODB_URI);
        logger.info('Connected to database');

        // Delete all projects
        const projectsResult = await Project.deleteMany({});
        logger.info(`Deleted ${projectsResult.deletedCount} projects`);

        // Delete all applications
        const applicationsResult = await Application.deleteMany({});
        logger.info(`Deleted ${applicationsResult.deletedCount} applications`);

        // Reset groups (remove assignments and group numbers)
        const groupsResult = await Group.updateMany(
            {},
            {
                $unset: {
                    assignedProjectId: '',
                    assignedFacultyId: '',
                    groupNumber: '',
                },
                $set: {
                    status: 'forming',
                },
            }
        );
        logger.info(`Reset ${groupsResult.modifiedCount} groups`);

        // Delete all meeting logs
        const meetingsResult = await MeetingLog.deleteMany({});
        logger.info(`Deleted ${meetingsResult.deletedCount} meeting logs`);

        logger.info('✅ Successfully cleared all projects and applications data');
        logger.info('Summary:');
        logger.info(`  - Projects deleted: ${projectsResult.deletedCount}`);
        logger.info(`  - Applications deleted: ${applicationsResult.deletedCount}`);
        logger.info(`  - Groups reset: ${groupsResult.modifiedCount}`);
        logger.info(`  - Meeting logs deleted: ${meetingsResult.deletedCount}`);

        process.exit(0);
    } catch (error) {
        logger.error('Error clearing data:', error);
        process.exit(1);
    }
}

// Run the script
clearProjectsAndApplications();
