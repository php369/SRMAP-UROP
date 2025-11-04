// Export all models for easy importing
export { User } from './User';
export { Assessment } from './Assessment';
export { Submission } from './Submission';
export { Grade } from './Grade';
export { TokenStore } from './TokenStore';
export { Cohort } from './Cohort';
export { Course } from './Course';
export { Project } from './Project';
export { Eligibility } from './Eligibility';
export { FacultyRoster } from './FacultyRoster';
export { Group } from './Group';
export { Application } from './Application';
export { Window } from './Window';
export { Evaluation } from './Evaluation';

// Export types separately
export type { IUser } from './User';
export type { IAssessment } from './Assessment';
export type { ISubmission, FileMetadata } from './Submission';
export type { IGrade, RubricCriteria, GradeHistory } from './Grade';
export type { ITokenStore } from './TokenStore';
export type { ICohort } from './Cohort';
export type { ICourse } from './Course';
export type { IProject } from './Project';
export type { IEligibility } from './Eligibility';
export type { IFacultyRoster } from './FacultyRoster';
export type { IGroup } from './Group';
export type { IApplication } from './Application';
export type { IWindow } from './Window';
export type { IEvaluation } from './Evaluation';

// Re-export mongoose types for convenience
export { Types as MongooseTypes } from 'mongoose';