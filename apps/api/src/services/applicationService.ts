import { Application, IApplication } from '../models/Application';
import { Group } from '../models/Group';
import { Project } from '../models/Project';
import { User } from '../models/User';
import { GroupMemberDetails } from '../models/GroupMemberDetails';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Create multiple applications (one per project)
 * @param data - Application data
 * @returns Created applications
 */
export async function createApplications(data: {
  studentId?: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  projectType: IApplication['projectType'];
  selectedProjects: mongoose.Types.ObjectId[];
  department: string;
  stream?: string;
  specialization?: string;
  cgpa?: number;
  semester: number;
}): Promise<IApplication[]> {
  try {
    const { studentId, groupId, projectType, selectedProjects, department, stream, specialization, cgpa, semester } = data;

    // Validate that either studentId or groupId is provided
    if (!studentId && !groupId) {
      throw new Error('Either studentId or groupId must be provided');
    }

    if (studentId && groupId) {
      throw new Error('Cannot provide both studentId and groupId');
    }

    // Validate project selection (max 3)
    if (selectedProjects.length === 0 || selectedProjects.length > 3) {
      throw new Error('Must select between 1 and 3 projects');
    }

    // Validate specialization requirement for semester >= 6
    if (semester >= 6 && !specialization) {
      throw new Error('Specialization is required for semester 6 and above');
    }

    // If group application, verify user is the group leader
    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Clear draft projects on final submission
      group.draftProjects = [];
      await group.save();
    }

    // Verify all selected projects exist and are published
    const projects = await Project.find({
      _id: { $in: selectedProjects },
      type: projectType,
      status: 'published'
    });

    if (projects.length !== selectedProjects.length) {
      throw new Error('One or more selected projects are not available');
    }

    // Check for existing pending or approved applications (allow reapplication after rejection)
    const existingQuery: any = {
      projectId: { $in: selectedProjects },
      status: { $in: ['pending', 'approved'] }
    };
    if (studentId) {
      existingQuery.studentId = studentId;
    } else {
      existingQuery.groupId = groupId;
    }

    const existingApplications = await Application.find(existingQuery);
    if (existingApplications.length > 0) {
      const existingProjects = await Project.find({
        _id: { $in: existingApplications.map(app => app.projectId) }
      }).select('title');
      const projectTitles = existingProjects.map(p => p.title).join(', ');
      throw new Error(`You already have pending or approved applications for: ${projectTitles}`);
    }

    // Create one application per project
    const applications: IApplication[] = [];
    for (const projectId of selectedProjects) {
      const application = new Application({
        studentId,
        groupId,
        projectType,
        projectId,
        department,
        stream,
        specialization,
        cgpa,
        semester,
        status: 'pending',
        isFrozen: true,
        submittedAt: new Date()
      });

      await application.save();
      applications.push(application);
    }

    logger.info(`Created ${applications.length} applications`);
    return applications;
  } catch (error) {
    logger.error('Error creating applications:', error);
    throw error;
  }
}

/**
 * Get application by ID
 * @param applicationId - Application ID
 * @returns Application with populated fields
 */
export async function getApplicationById(
  applicationId: string | mongoose.Types.ObjectId
): Promise<IApplication | null> {
  try {
    return await Application.findById(applicationId)
      .populate('studentId', 'name email studentId department')
      .populate('groupId')
      .populate('projectPreferences', 'title abstract facultyName department')
      .populate('assignedProject', 'title abstract facultyName');
  } catch (error) {
    logger.error('Error getting application:', error);
    return null;
  }
}

/**
 * Get all applications for a user (by user ID)
 * @param userId - User ID
 * @returns Array of applications
 */
export async function getApplicationsForUser(
  userId: mongoose.Types.ObjectId
): Promise<IApplication[]> {
  try {
    // Get user to check if they're in a group
    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return [];
    }

    const query: any = {};

    // If user is in a group, get group applications
    if (user.currentGroupId) {
      query.groupId = user.currentGroupId;
    } else {
      // Otherwise get individual applications
      query.studentId = userId;
    }

    logger.info('Querying applications for user:', {
      userId: userId.toString(),
      query,
      hasGroup: !!user.currentGroupId
    });

    const applications = await Application.find(query)
      .populate('projectId', 'title brief facultyName department')
      .populate({
        path: 'groupId',
        populate: [
          { path: 'members', select: 'name email studentId' },
          { path: 'leaderId', select: 'name email studentId' }
        ]
      })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    logger.info('Applications query result for user:', {
      userId: userId.toString(),
      count: applications.length,
      applicationIds: applications.map(app => app._id?.toString()),
      statuses: applications.map(app => app.status)
    });

    return applications;
  } catch (error) {
    logger.error('Error getting applications for user:', error);
    return [];
  }
}

/**
 * Get all applications for a student or group
 * @param studentId - Student ID
 * @param groupId - Group ID
 * @returns Array of applications
 */
export async function getUserApplications(
  studentId?: mongoose.Types.ObjectId,
  groupId?: mongoose.Types.ObjectId
): Promise<IApplication[]> {
  try {
    const query: any = {};
    if (studentId) query.studentId = studentId;
    if (groupId) query.groupId = groupId;

    logger.info('Querying applications with:', {
      query,
      studentId: studentId?.toString(),
      groupId: groupId?.toString()
    });

    const applications = await Application.find(query)
      .populate('projectId', 'title brief facultyName department')
      .populate({
        path: 'groupId',
        populate: [
          { path: 'members', select: 'name email studentId' },
          { path: 'leaderId', select: 'name email studentId' }
        ]
      })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    logger.info('Applications query result:', {
      count: applications.length,
      applicationIds: applications.map(app => app._id?.toString()),
      statuses: applications.map(app => app.status)
    });

    return applications;
  } catch (error) {
    logger.error('Error getting user applications:', error);
    return [];
  }
}

/**
 * Get approved application for a student or group
 * @param studentId - Student ID
 * @param groupId - Group ID
 * @returns Approved application or null
 */
export async function getApprovedApplication(
  studentId?: mongoose.Types.ObjectId,
  groupId?: mongoose.Types.ObjectId
): Promise<IApplication | null> {
  try {
    const query: any = { status: 'approved' };
    if (studentId) query.studentId = studentId;
    if (groupId) query.groupId = groupId;

    logger.info('Querying approved application with:', {
      query,
      studentId: studentId?.toString(),
      groupId: groupId?.toString()
    });

    const application = await Application.findOne(query)
      .populate('projectId', 'title brief facultyName department')
      .populate('reviewedBy', 'name email')
      .populate({
        path: 'groupId',
        populate: [
          { path: 'members', select: 'name email studentId' },
          { path: 'leaderId', select: 'name email studentId' }
        ]
      })
      .populate('studentId', 'name email studentId');

    logger.info('Approved application query result:', {
      found: !!application,
      applicationId: application?._id?.toString(),
      status: application?.status,
      projectId: application?.projectId?._id?.toString()
    });

    return application;
  } catch (error) {
    logger.error('Error getting approved application:', error);
    return null;
  }
}

/**
 * Get applications for a faculty member's projects
 * @param facultyId - Faculty ID
 * @param projectType - Optional project type filter
 * @returns Array of applications
 */
export async function getFacultyApplications(
  facultyId: mongoose.Types.ObjectId,
  projectType?: IApplication['projectType']
): Promise<IApplication[]> {
  try {
    // Get faculty's projects
    const query: any = { facultyId };
    if (projectType) query.projectType = projectType;
    const projects = await Project.find(query).select('_id');
    const projectIds = projects.map(p => p._id);

    // Get applications for these projects only
    const applications = await Application.find({
      projectId: { $in: projectIds }
    })
      .populate('studentId', 'name email studentId department')
      .populate({
        path: 'groupId',
        populate: [
          { path: 'leaderId', select: 'name email studentId' },
          { path: 'members', select: 'name email studentId' }
        ]
      })
      .populate('projectId', 'title brief facultyName')
      .sort({ createdAt: -1 })
      .lean();

    // For group applications, attach member details (CGPA, department etc)
    const processedApplications = await Promise.all(applications.map(async (app: any) => {
      if (app.groupId) {
        const memberDetails = await GroupMemberDetails.find({
          groupId: app.groupId._id
        }).lean();
        app.groupId.memberData = memberDetails;
      }
      return app;
    }));

    return processedApplications as any;
  } catch (error) {
    logger.error('Error getting faculty applications:', error);
    return [];
  }
}

/**
 * Accept an application
 * @param applicationId - Application ID
 * @param projectId - Project to assign
 * @param facultyId - Faculty ID accepting the application
 * @returns Updated application
 */
export async function acceptApplication(
  applicationId: string | mongoose.Types.ObjectId,
  projectId: mongoose.Types.ObjectId,
  facultyId: mongoose.Types.ObjectId
): Promise<IApplication> {
  try {
    const application = await Application.findById(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'pending') {
      throw new Error('Application is not in pending status');
    }

    // Verify project matches the application's project
    if (application.projectId.toString() !== projectId.toString()) {
      throw new Error('Project does not match this application');
    }

    // Verify project belongs to faculty
    const project = await Project.findOne({ _id: projectId, facultyId });
    if (!project) {
      throw new Error('Project not found or does not belong to faculty');
    }

    // Check if project is already assigned
    if (project.status === 'assigned') {
      throw new Error('Project is already assigned to another student/group');
    }

    // Update application
    application.status = 'approved';
    application.reviewedBy = facultyId;
    application.reviewedAt = new Date();
    await application.save();

    // Update project status
    project.status = 'assigned';
    project.assignedTo = application.groupId || application.studentId;
    await project.save();

    // Update group status and user assignments if group application
    if (application.groupId) {
      // Get the next group number for this project type and year
      const maxGroupNumber = await Group.findOne({
        projectType: application.projectType,
        year: new Date().getFullYear(),
        groupNumber: { $exists: true }
      })
        .sort({ groupNumber: -1 })
        .select('groupNumber');

      const nextGroupNumber = maxGroupNumber ? maxGroupNumber.groupNumber! + 1 : 1;

      // Update group
      await Group.findByIdAndUpdate(application.groupId, {
        status: 'approved',
        assignedProjectId: projectId,
        assignedFacultyId: facultyId,
        groupNumber: nextGroupNumber
      });

      // Update all group members with project and faculty assignment
      const group = await Group.findById(application.groupId).populate('members');
      if (group && group.members) {
        await User.updateMany(
          { _id: { $in: group.members } },
          {
            assignedProjectId: projectId,
            assignedFacultyId: facultyId,
            currentGroupId: application.groupId
          }
        );
        logger.info(`Updated ${group.members.length} group members with project assignment`);
      }

      logger.info(`Assigned group number ${nextGroupNumber} to group ${application.groupId}`);
    } else if (application.studentId) {
      // Update solo student with project and faculty assignment
      await User.findByIdAndUpdate(application.studentId, {
        assignedProjectId: projectId,
        assignedFacultyId: facultyId,
        currentGroupId: null // Clear group ID for solo students
      });
      logger.info(`Updated solo student ${application.studentId} with project assignment`);
    }

    // Reject ALL other applications from the same student/group
    // This includes applications to other projects and other faculty
    const rejectionQuery: any = {
      _id: { $ne: applicationId },
      status: 'pending'
    };

    // Match by student or group
    if (application.groupId) {
      rejectionQuery.groupId = application.groupId;
    } else if (application.studentId) {
      rejectionQuery.studentId = application.studentId;
    }

    const rejectedCount = await Application.updateMany(
      rejectionQuery,
      {
        status: 'rejected',
        reviewedBy: facultyId,
        reviewedAt: new Date(),
        $set: {
          'metadata.autoRejected': true,
          'metadata.rejectionReason': 'Student/group accepted to another project'
        }
      }
    );

    logger.info(`Application ${applicationId} accepted for project ${projectId}. Auto-rejected ${rejectedCount.modifiedCount} other applications from the same student/group.`);
    return application;
  } catch (error) {
    logger.error('Error accepting application:', error);
    throw error;
  }
}

/**
 * Reject an application
 * @param applicationId - Application ID
 * @param facultyId - Faculty ID rejecting the application
 * @param reason - Optional rejection reason
 * @returns Updated application
 */
export async function rejectApplication(
  applicationId: string | mongoose.Types.ObjectId,
  facultyId: mongoose.Types.ObjectId,
  reason?: string
): Promise<IApplication> {
  try {
    const application = await Application.findById(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'pending') {
      throw new Error('Application is not in pending status');
    }

    application.status = 'rejected';
    application.reviewedBy = facultyId;
    application.reviewedAt = new Date();
    if (reason) {
      application.metadata = { ...application.metadata, rejectionReason: reason };
    }
    await application.save();

    logger.info(`Application ${applicationId} rejected`);
    return application;
  } catch (error) {
    logger.error('Error rejecting application:', error);
    throw error;
  }
}

/**
 * Revoke an application
 * @param applicationId - Application ID to revoke
 * @param userId - ID of the user requesting revocation
 * @returns Object indicating success
 */
export async function revokeApplication(
  applicationId: string | mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
): Promise<{ success: boolean; message: string }> {
  try {
    const application = await Application.findById(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    // Only pending applications can be revoked
    if (application.status !== 'pending') {
      throw new Error(`Cannot revoke application with status: ${application.status}`);
    }

    // Verify ownership
    if (application.groupId) {
      // For group applications, only the leader can revoke
      const group = await Group.findById(application.groupId);
      if (!group) {
        throw new Error('Group associated with application not found');
      }

      const leaderId = group.leaderId?._id || group.leaderId;
      if (leaderId.toString() !== userId.toString()) {
        throw new Error('Only the group leader can revoke this application');
      }
    } else {
      // For solo applications, only the student who applied can revoke
      if (application.studentId!.toString() !== userId.toString()) {
        throw new Error('You do not have permission to revoke this application');
      }
    }

    await Application.findByIdAndDelete(applicationId);
    logger.info(`Application ${applicationId} revoked by user ${userId}`);

    return { success: true, message: 'Application revoked successfully' };
  } catch (error: any) {
    logger.error('Error revoking application:', error);
    throw error;
  }
}

/**
 * Unfreeze an application (coordinator only)
 * @param applicationId - Application ID
 * @returns Updated application
 */
export async function unfreezeApplication(
  applicationId: string | mongoose.Types.ObjectId
): Promise<IApplication> {
  try {
    const application = await Application.findById(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    application.isFrozen = false;
    await application.save();

    logger.info(`Application ${applicationId} unfrozen`);
    return application;
  } catch (error) {
    logger.error('Error unfreezing application:', error);
    throw error;
  }
}

/**
 * Get all applications (coordinator/admin)
 * @param filters - Optional filters
 * @returns Array of applications
 */
export async function getAllApplications(filters?: {
  projectType?: IApplication['projectType'];
  status?: IApplication['status'];
  semester?: number;
}): Promise<IApplication[]> {
  try {
    const query: any = {};
    if (filters?.projectType) query.projectType = filters.projectType;
    if (filters?.status) query.status = filters.status;
    if (filters?.semester) query.semester = filters.semester;

    return await Application.find(query)
      .populate('studentId', 'name email studentId department')
      .populate('groupId')
      .populate('projectPreferences', 'title abstract facultyName')
      .populate('assignedProject', 'title abstract facultyName')
      .sort({ submittedAt: -1 });
  } catch (error) {
    logger.error('Error getting all applications:', error);
    return [];
  }
}
