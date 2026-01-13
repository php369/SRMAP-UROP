import { api } from '../utils/api';
import { ExternalEvaluator, EvaluatorAssignment, EvaluatorInviteRequest } from '../types/externalEvaluator';

export const ExternalEvaluatorService = {
    // Fetch all external evaluators
    getAllEvaluators: async (): Promise<ExternalEvaluator[]> => {
        const response = await api.get<ExternalEvaluator[]>('/control/external-evaluators/available');
        return response.data || [];
    },

    // Invite a new evaluator
    inviteEvaluator: async (data: EvaluatorInviteRequest): Promise<ExternalEvaluator> => {
        // TODO: Implement backend endpoint for inviting external evaluators
        console.warn('Backend endpoint for inviting evaluators is not implemented yet. Using mock response.');

        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            _id: `eval_${Date.now()}`,
            ...data,
            isActive: true,
            assignmentCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        } as ExternalEvaluator;
    },

    // Fetch all assignments (Groups/Students needing evaluation)
    getAllAssignments: async (): Promise<EvaluatorAssignment[]> => {
        const response = await api.get<EvaluatorAssignment[]>('/control/external-evaluators/assignments');
        return response.data || [];
    },

    // Auto-assign evaluators
    autoAssign: async (): Promise<{ assigned: number, failed: number }> => {
        const response = await api.post<{ groupsAssigned: number, soloStudentsAssigned: number }>('/control/external-evaluators/auto-assign');
        // The backend returns { groupsAssigned: number, soloStudentsAssigned: number }
        // We map it to the interface expected by the frontend
        if (response.data) {
            const { groupsAssigned, soloStudentsAssigned } = response.data;
            return {
                assigned: groupsAssigned + soloStudentsAssigned,
                failed: 0 // Backend currently doesn't report failed counts
            };
        }
        return { assigned: 0, failed: 0 };
    },

    // Manually assign evaluator
    assignEvaluator: async (assignmentId: string, evaluatorId: string, type: 'group' | 'solo'): Promise<void> => {
        if (type === 'group') {
            await api.post('/control/external-evaluators/assign', {
                groupId: assignmentId,
                evaluatorId
            });
        } else {
            await api.post('/control/external-evaluators/assign-solo', {
                studentId: assignmentId,
                evaluatorId
            });
        }
    },

    // Remove evaluator assignment
    removeAssignment: async (assignmentId: string): Promise<void> => {
        await api.delete(`/control/external-evaluators/assign/${assignmentId}`);
    }
};
