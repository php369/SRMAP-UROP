import { User, Group } from './index';

export interface ExternalEvaluator {
    _id: string;
    name: string;
    email: string;
    organization: string;
    designation: string;
    expertise: string[];
    assignmentCount: number;
    phone?: string;
    isActive: boolean;
    status?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ExternalEvaluatorAssignment {
    _id?: string; // Optional if not yet persisted as a separate document, but usually tracked
    submissionType: 'group' | 'solo';
    groupId?: {
        _id: string;
        groupCode: string;
        assignedProjectId: {
            _id: string;
            title: string;
        };
        members: User[];
        assignedFacultyId?: {
            _id: string;
            name: string;
            email: string;
        };
        externalEvaluatorId?: ExternalEvaluator;
    };
    studentId?: {
        _id: string;
        name: string;
        email: string;
        assignedProjectId: {
            _id: string;
            title: string;
        };
        assignedFacultyId?: {
            _id: string;
            name: string;
            email: string;
        };
        externalEvaluator?: ExternalEvaluator;
    };
    externalEvaluator?: ExternalEvaluator; // For direct access in unified object
    isAssigned: boolean;
    hasConflict: boolean;
}

export type EvaluatorAssignment = ExternalEvaluatorAssignment;

export interface EvaluatorInviteRequest {
    name: string;
    email: string;
    organization: string;
    designation: string;
    expertise: string[];
}
