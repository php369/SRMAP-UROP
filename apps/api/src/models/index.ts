// Export all models for easy importing
export { User } from './User';
export { Assessment } from './Assessment';
export { Submission } from './Submission';
export { Grade } from './Grade';
export { TokenStore } from './TokenStore';
export { Cohort } from './Cohort';
export { Course } from './Course';

// Export types separately
export type { IUser } from './User';
export type { IAssessment } from './Assessment';
export type { ISubmission, FileMetadata } from './Submission';
export type { IGrade, RubricCriteria, GradeHistory } from './Grade';
export type { ITokenStore } from './TokenStore';
export type { ICohort } from './Cohort';
export type { ICourse } from './Course';

// Re-export mongoose types for convenience
export { Types as MongooseTypes } from 'mongoose';