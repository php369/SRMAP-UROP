// Export all models for easy importing
export { User } from './User';
export { TokenStore } from './TokenStore';
export { Project } from './Project';
export { Eligibility } from './Eligibility';
export { FacultyRoster } from './FacultyRoster';
export { Group } from './Group';
export { GroupSubmission } from './GroupSubmission';
export { Application } from './Application';
export { Window } from './Window';
export { Evaluation } from './Evaluation';
export { Notification } from './Notification';
export { Assessment } from './Assessment';
export { Cohort } from './Cohort';
export { Course } from './Course';
export { MeetingLog } from './MeetingLog';
export { StudentMeta } from './StudentMeta';
export { OnlineStatus } from './OnlineStatus';
export { AvatarPool } from './AvatarPool';

// Export types separately
export type { IUser } from './User';
export type { ITokenStore } from './TokenStore';
export type { IProject } from './Project';
export type { IEligibility } from './Eligibility';
export type { IFacultyRoster } from './FacultyRoster';
export type { IGroup } from './Group';
export type { IGroupSubmission } from './GroupSubmission';
export type { IApplication } from './Application';
export type { IWindow } from './Window';
export type { IEvaluation } from './Evaluation';
export type { INotification } from './Notification';
export type { IAssessment } from './Assessment';
export type { ICohort } from './Cohort';
export type { ICourse } from './Course';
export type { IMeetingLog } from './MeetingLog';
export type { IStudentMeta } from './StudentMeta';
export type { IOnlineStatus } from './OnlineStatus';
export type { IAvatarPool } from './AvatarPool';

// Re-export mongoose types for convenience
export { Types as MongooseTypes } from 'mongoose';