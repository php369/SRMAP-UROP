import { Application, IApplication } from '../models/Application';
import { Group } from '../models/Group';
import { Project } from '../models/Project';
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

    return await Application.find(query)
      .populate('projectId', 'title brief facultyName department')
      .sort({ createdAt: -1 });
  } catch (error) {
    logger.error('Error getting user applications:', error);
    return [];
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
    return await Application.find({
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
      .sort({ createdAt: -1 });
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

    // Update group status if group application
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

      await Group.findByIdAndUpdate(application.groupId, {
        status: 'approved',
        assignedProjectId: projectId,
        assignedFacultyId: facultyId,
        groupNumber: nextGroupNumber
      });

      logger.info(`Assigned group number ${nextGroupNumber} to group ${application.groupId}`);
    }

    // Reject other applications for this project
    await Application.updateMany(
      {
        _id: { $ne: applicationId },
        projectPreferences: projectId,
        status: 'pending'
      },
      {
        status: 'rejected',
        reviewedBy: facultyId,
        reviewedAt: new Date()
      }
    );

    logger.info(`Application ${applicationId} accepted for project ${projectId}`);
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
