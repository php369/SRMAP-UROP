// Export all models for easy importing
export { User } from './User';
export { Project } from './Project';
export { Group } from './Group';
export { GroupSubmission } from './GroupSubmission';
export { GroupMemberDetails } from './GroupMemberDetails';
export { Application } from './Application';
export { Window } from './Window';
export { StudentEvaluation } from './StudentEvaluation';
export { Notification } from './Notification';
export { Assessment } from './Assessment';
export { MeetingLog } from './MeetingLog';
export { Submission } from './Submission';

// Export types separately
export type { IUser } from './User';
export type { IProject } from './Project';
export type { IGroup } from './Group';
export type { IGroupSubmission } from './GroupSubmission';
export type { IGroupMemberDetails } from './GroupMemberDetails';
export type { IApplication } from './Application';
export type { IWindow } from './Window';
export type { IStudentEvaluation } from './StudentEvaluation';
export type { INotification } from './Notification';
export type { IAssessment } from './Assessment';
export type { IMeetingLog } from './MeetingLog';
export type { ISubmission } from './Submission';

// Re-export mongoose types for convenience
export { Types as MongooseTypes } from 'mongoose';