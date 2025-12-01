import { Application, IApplication } from '../models/Application';
import { Group } from '../models/Group';
import { Project } from '../models/Project';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Create a new application
 * @param data - Application data
 * @returns Created application
 */
export async function createApplication(data: {
  studentId?: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  projectType: IApplication['projectType'];
  selectedProjects: mongoose.Types.ObjectId[];
  department: string;
  stream?: string;
  specialization?: string;
  cgpa?: number;
  semester: number;
}): Promise<IApplication> {
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

    // Check if application already exists
    const existingQuery: any = { projectType };
    if (studentId) {
      existingQuery.studentId = studentId;
    } else {
      existingQuery.groupId = groupId;
    }

    const existing = await Application.findOne(existingQuery);
    if (existing) {
      throw new Error('Application already exists for this student/group');
    }

    // If group application, verify user is the group leader
    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }
      // Note: Authorization check should be done in the route handler
    }

    // Verify all selected projects exist and are published
    const projects = await Project.find({
      _id: { $in: selectedProjects },
      projectType,
      status: 'published'
    });

    if (projects.length !== selectedProjects.length) {
      throw new Error('One or more selected projects are not available');
    }

    // Create application
    const application = new Application({
      studentId,
      groupId,
      projectType,
      selectedProjects,
      department,
      stream,
      specialization,
      cgpa,
      semester,
      status: 'pending',
      isFrozen: true, // Freeze on submission
      submittedAt: new Date()
    });

    await application.save();

    logger.info(`Application created: ${application._id}`);
    return application;
  } catch (error) {
    logger.error('Error creating application:', error);
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
      .populate('selectedProjects', 'title abstract facultyName department')
      .populate('assignedProject', 'title abstract facultyName');
  } catch (error) {
    logger.error('Error getting application:', error);
    return null;
  }
}

/**
 * Get applications for a student or group
 * @param studentId - Student ID
 * @param groupId - Group ID
 * @returns Application or null
 */
export async function getUserApplication(
  studentId?: mongoose.Types.ObjectId,
  groupId?: mongoose.Types.ObjectId
): Promise<IApplication | null> {
  try {
    const query: any = {};
    if (studentId) query.studentId = studentId;
    if (groupId) query.groupId = groupId;

    return await Application.findOne(query)
      .populate('selectedProjects', 'title abstract facultyName department')
      .populate('assignedProject', 'title abstract facultyName');
  } catch (error) {
    logger.error('Error getting user application:', error);
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

    // Get applications that selected these projects
    return await Application.find({
      selectedProjects: { $in: projectIds }
    })
      .populate('studentId', 'name email studentId department')
      .populate('groupId')
      .populate('selectedProjects', 'title abstract')
      .sort({ submittedAt: -1 });
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

    // Verify project is in selected projects
    const isSelected = application.selectedProjects.some(
      p => p.toString() === projectId.toString()
    );
    if (!isSelected) {
      throw new Error('Project is not in the application\'s selected projects');
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
    application.assignedProject = projectId;
    application.reviewedBy = facultyId;
    application.reviewedAt = new Date();
    await application.save();

    // Update project status
    project.status = 'assigned';
    project.assignedTo = application.groupId || application.studentId;
    await project.save();

    // Update group status if group application
    if (application.groupId) {
      await Group.findByIdAndUpdate(application.groupId, {
        status: 'approved',
        assignedProjectId: projectId,
        assignedFacultyId: facultyId
      });
    }

    // Reject other applications for this project
    await Application.updateMany(
      {
        _id: { $ne: applicationId },
        selectedProjects: projectId,
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
      .populate('selectedProjects', 'title abstract facultyName')
      .populate('assignedProject', 'title abstract facultyName')
      .sort({ submittedAt: -1 });
  } catch (error) {
    logger.error('Error getting all applications:', error);
    return [];
  }
}
