import mongoose from 'mongoose';
import { config } from '../config/environment';
import '../models'; // Import all models
import { MeetingLog } from '../models/MeetingLog';
import { Application } from '../models/Application';
import { Group } from '../models/Group';
import { Project } from '../models/Project';
import { logger } from '../utils/logger';

async function checkMeetings() {
    try {
        await mongoose.connect(config.MONGODB_URI);
        logger.info('Connected to database');

        // Check meetings
        const meetings = await MeetingLog.find({})
            .populate('projectId', 'title projectId')
            .populate('facultyId', 'name email')
            .populate('groupId', 'groupCode members')
            .populate('studentId', 'name email');

        logger.info(`\n=== MEETINGS (${meetings.length}) ===`);
        meetings.forEach((meeting: any) => {
            logger.info(`\nMeeting ID: ${meeting._id}`);
            logger.info(`  Project: ${meeting.projectId?.projectId} - ${meeting.projectId?.title}`);
            logger.info(`  Faculty: ${meeting.facultyId?.name}`);
            logger.info(`  Group: ${meeting.groupId?.groupCode || 'N/A'}`);
            logger.info(`  Student: ${meeting.studentId?.name || 'N/A'}`);
            logger.info(`  Date: ${meeting.meetingDate}`);
            logger.info(`  Status: ${meeting.status}`);
        });

        // Check applications
        const applications = await Application.find({ status: 'approved' })
            .populate('projectId', 'title projectId')
            .populate('studentId', 'name email')
            .populate('groupId', 'groupCode members');

        logger.info(`\n=== APPROVED APPLICATIONS (${applications.length}) ===`);
        applications.forEach((app: any) => {
            logger.info(`\nApplication ID: ${app._id}`);
            logger.info(`  Project: ${app.projectId?.projectId} - ${app.projectId?.title}`);
            logger.info(`  Student: ${app.studentId?.name || 'N/A'}`);
            logger.info(`  Group: ${app.groupId?.groupCode || 'N/A'}`);
            if (app.groupId) {
                logger.info(`  Group Members: ${app.groupId.members?.length || 0}`);
            }
        });

        // Check groups
        const groups = await Group.find({})
            .populate('assignedProjectId', 'title projectId')
            .populate('members', 'name email');

        logger.info(`\n=== GROUPS (${groups.length}) ===`);
        groups.forEach((group: any) => {
            logger.info(`\nGroup ID: ${group._id}`);
            logger.info(`  Code: ${group.groupCode}`);
            logger.info(`  Number: ${group.groupNumber || 'N/A'}`);
            logger.info(`  Status: ${group.status}`);
            logger.info(`  Assigned Project: ${group.assignedProjectId?.projectId || 'N/A'}`);
            logger.info(`  Members: ${group.members?.length || 0}`);
            if (group.members) {
                group.members.forEach((member: any) => {
                    logger.info(`    - ${member.name} (${member.email})`);
                });
            }
        });

        // Check projects
        const projects = await Project.find({ status: 'assigned' })
            .populate('facultyId', 'name email')
            .populate('assignedTo', 'name email groupCode');

        logger.info(`\n=== ASSIGNED PROJECTS (${projects.length}) ===`);
        projects.forEach((project: any) => {
            logger.info(`\nProject ID: ${project._id}`);
            logger.info(`  Project ID: ${project.projectId}`);
            logger.info(`  Title: ${project.title}`);
            logger.info(`  Faculty: ${project.facultyId?.name}`);
            logger.info(`  Assigned To: ${project.assignedTo?.name || project.assignedTo?.groupCode || 'N/A'}`);
        });

        process.exit(0);
    } catch (error) {
        logger.error('Error:', error);
        process.exit(1);
    }
}

checkMeetings();
