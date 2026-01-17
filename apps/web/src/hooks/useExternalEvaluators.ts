import { useState, useCallback } from 'react';
import { ExternalEvaluator, EvaluatorAssignment } from '../types/externalEvaluator';
import { ExternalEvaluatorService } from '../services/externalEvaluatorService';
import { toast } from 'sonner';

export function useExternalEvaluators() {
    const [evaluators, setEvaluators] = useState<ExternalEvaluator[]>([]);
    const [assignments, setAssignments] = useState<EvaluatorAssignment[]>([]);
    const [loading, setLoading] = useState(false);
    const [assignmentsLoading, setAssignmentsLoading] = useState(false);
    const [evaluatorsLoading, setEvaluatorsLoading] = useState(false);
    const [validationResult, setValidationResult] = useState<{ isValid: boolean; issues: string[]; recommendations: string[] } | null>(null);

    const fetchEvaluators = useCallback(async () => {
        setEvaluatorsLoading(true);
        try {
            const data = await ExternalEvaluatorService.getAllEvaluators();
            setEvaluators(data);
        } catch (error) {
            console.error('Failed to fetch evaluators:', error);
            toast.error('Failed to load evaluators');
        } finally {
            setEvaluatorsLoading(false);
        }
    }, []);

    const fetchAssignments = useCallback(async () => {
        setAssignmentsLoading(true);
        try {
            const data = await ExternalEvaluatorService.getAllAssignments();
            setAssignments(data);
        } catch (error) {
            console.error('Failed to fetch assignments:', error);
            toast.error('Failed to load assignments');
        } finally {
            setAssignmentsLoading(false);
        }
    }, []);

    const autoAssignEvaluators = async () => {
        setLoading(true);
        try {
            const result = await ExternalEvaluatorService.autoAssign();
            toast.success(`Auto-assigned ${result.assigned} evaluators. ${result.failed} failed/skipped.`);
            await Promise.all([fetchEvaluators(), fetchAssignments()]);
            return true;
        } catch (error) {
            toast.error('Auto-assignment failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const assignEvaluatorToGroup = async (assignmentId: string, evaluatorId: string) => {
        try {
            await ExternalEvaluatorService.assignEvaluator(assignmentId, evaluatorId, 'group');
            toast.success('Evaluator assigned successfully');
            setAssignments(prev => prev.map(a =>
                a._id === assignmentId ? { ...a, isAssigned: true, externalEvaluator: evaluators.find(e => e._id === evaluatorId) } : a
            ));
        } catch (error) {
            toast.error('Failed to assign evaluator');
        }
    };

    const assignEvaluatorToSoloStudent = async (assignmentId: string, evaluatorId: string) => {
        try {
            await ExternalEvaluatorService.assignEvaluator(assignmentId, evaluatorId, 'solo');
            toast.success('Evaluator assigned successfully');
            setAssignments(prev => prev.map(a =>
                a._id === assignmentId ? { ...a, isAssigned: true, externalEvaluator: evaluators.find(e => e._id === evaluatorId) } : a
            ));
        } catch (error) {
            toast.error('Failed to assign evaluator');
        }
    };

    const removeEvaluatorFromGroup = async (assignmentId: string) => {
        try {
            await ExternalEvaluatorService.removeAssignment(assignmentId);
            toast.success('Evaluator removed');
            setAssignments(prev => prev.map(a =>
                a._id === assignmentId ? { ...a, isAssigned: false, externalEvaluator: undefined } : a
            ));
        } catch (error) {
            toast.error('Failed to remove evaluator');
        }
    };

    const removeEvaluatorFromSoloStudent = async (assignmentId: string) => {
        try {
            await ExternalEvaluatorService.removeAssignment(assignmentId);
            toast.success('Evaluator removed');
            setAssignments(prev => prev.map(a =>
                a._id === assignmentId ? { ...a, isAssigned: false, externalEvaluator: undefined } : a
            ));
        } catch (error) {
            toast.error('Failed to remove evaluator');
        }
    };

    const validateAssignments = async () => {
        // Mock validation logic
        const issues: string[] = [];
        if (assignments.some(a => !a.isAssigned)) {
            issues.push('Some projects are missing evaluators.');
        }
        setValidationResult({
            isValid: issues.length === 0,
            issues,
            recommendations: issues.length > 0 ? ['Run auto-assign to fill gaps'] : []
        });
        return { isValid: issues.length === 0, issues, recommendations: [] };
    };

    return {
        assignments,
        evaluators,
        loading,
        assignmentsLoading,
        evaluatorsLoading,
        validationResult,
        fetchAssignments,
        fetchEvaluators,
        validateAssignments,
        autoAssignEvaluators,
        assignEvaluatorToGroup,
        assignEvaluatorToSoloStudent,
        removeEvaluatorFromGroup,
        removeEvaluatorFromSoloStudent
    };
}
