import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '../../../../utils/api';
import { ExternalEvaluator, ExternalEvaluatorAssignment, ExternalEvaluatorValidationResult } from '../types';

export function useExternalEvaluators() {
  const [assignments, setAssignments] = useState<ExternalEvaluatorAssignment[]>([]);
  const [evaluators, setEvaluators] = useState<ExternalEvaluator[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [evaluatorsLoading, setEvaluatorsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ExternalEvaluatorValidationResult | null>(null);

  // Validate assignment constraints
  const validateAssignments = useCallback(async (): Promise<ExternalEvaluatorValidationResult | null> => {
    try {
      const response = await api.get<ExternalEvaluatorValidationResult>('/control/external-evaluators/validate');
      if (response.success && response.data) {
        setValidationResult(response.data);
        return response.data;
      } else {
        // Silent fail - don't show toast for expected empty state
        return null;
      }
    } catch (error: any) {
      console.error('Error validating assignments:', error);
      // Silent fail - don't show toast for expected errors during application phase
      return null;
    }
  }, []);

  // Fetch all external evaluator assignments
  const fetchAssignments = useCallback(async () => {
    setAssignmentsLoading(true);
    try {
      const response = await api.get<ExternalEvaluatorAssignment[]>('/control/external-evaluators/assignments');
      if (response.success) {
        setAssignments(response.data || []);
      } else {
        // Silent fail - don't show toast for expected empty state
        setAssignments([]);
      }
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      // Silent fail - don't show toast for expected errors during application phase
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  }, []);

  // Fetch available external evaluators
  const fetchEvaluators = useCallback(async () => {
    setEvaluatorsLoading(true);
    try {
      const response = await api.get<ExternalEvaluator[]>('/control/external-evaluators/available');
      if (response.success) {
        setEvaluators(response.data || []);
      } else {
        // Silent fail - don't show toast for expected empty state
        setEvaluators([]);
      }
    } catch (error: any) {
      console.error('Error fetching evaluators:', error);
      // Silent fail - don't show toast for expected errors during application phase
      setEvaluators([]);
    } finally {
      setEvaluatorsLoading(false);
    }
  }, []);

  // Auto-assign external evaluators
  const autoAssignEvaluators = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.post('/control/external-evaluators/auto-assign');
      if (response.success) {
        toast.success(response.message || 'External evaluators assigned successfully');
        await Promise.all([fetchAssignments(), fetchEvaluators()]);
        return true;
      } else {
        toast.error(response.message || 'Failed to auto-assign evaluators');
        return false;
      }
    } catch (error: any) {
      console.error('Error auto-assigning evaluators:', error);
      toast.error(error.response?.data?.message || 'Failed to auto-assign evaluators');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAssignments, fetchEvaluators]);

  // Assign external evaluator to group
  const assignEvaluatorToGroup = useCallback(async (groupId: string, evaluatorId: string) => {
    setLoading(true);
    try {
      const response = await api.post('/control/external-evaluators/assign', {
        groupId,
        evaluatorId
      });
      if (response.success) {
        toast.success('External evaluator assigned successfully');
        await Promise.all([fetchAssignments(), fetchEvaluators()]);
        return true;
      } else {
        toast.error(response.message || 'Failed to assign evaluator');
        return false;
      }
    } catch (error: any) {
      console.error('Error assigning evaluator:', error);
      toast.error(error.response?.data?.message || 'Failed to assign evaluator');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAssignments, fetchEvaluators]);

  // Assign external evaluator to solo student
  const assignEvaluatorToSoloStudent = useCallback(async (studentId: string, evaluatorId: string) => {
    setLoading(true);
    try {
      const response = await api.post('/control/external-evaluators/assign-solo', {
        studentId,
        evaluatorId
      });
      if (response.success) {
        toast.success('External evaluator assigned to solo student successfully');
        await Promise.all([fetchAssignments(), fetchEvaluators()]);
        return true;
      } else {
        toast.error(response.message || 'Failed to assign evaluator to solo student');
        return false;
      }
    } catch (error: any) {
      console.error('Error assigning evaluator to solo student:', error);
      toast.error(error.response?.data?.message || 'Failed to assign evaluator to solo student');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAssignments, fetchEvaluators]);

  // Remove external evaluator assignment from group
  const removeEvaluatorFromGroup = useCallback(async (groupId: string) => {
    setLoading(true);
    try {
      const response = await api.delete(`/control/external-evaluators/assign/${groupId}`);
      if (response.success) {
        toast.success('External evaluator assignment removed');
        await Promise.all([fetchAssignments(), fetchEvaluators()]);
        return true;
      } else {
        toast.error(response.message || 'Failed to remove assignment');
        return false;
      }
    } catch (error: any) {
      console.error('Error removing assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to remove assignment');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAssignments, fetchEvaluators]);

  // Remove external evaluator assignment from solo student
  const removeEvaluatorFromSoloStudent = useCallback(async (studentId: string) => {
    setLoading(true);
    try {
      const response = await api.delete(`/control/external-evaluators/assign-solo/${studentId}`);
      if (response.success) {
        toast.success('External evaluator assignment removed from solo student');
        await Promise.all([fetchAssignments(), fetchEvaluators()]);
        return true;
      } else {
        toast.error(response.message || 'Failed to remove assignment from solo student');
        return false;
      }
    } catch (error: any) {
      console.error('Error removing assignment from solo student:', error);
      toast.error(error.response?.data?.message || 'Failed to remove assignment from solo student');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAssignments, fetchEvaluators]);

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