import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../../utils/api';
import { 
  Submission, 
  Grade, 
  GradeHistory, 
  GradingData, 
  RubricCriterion,
  ApiResponse 
} from '../../types';

export interface GradingHookReturn {
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  submitGrade: (submissionId: string, gradingData: GradingData) => Promise<Grade | null>;
  updateGrade: (gradeId: string, gradingData: GradingData) => Promise<Grade | null>;
  saveDraft: (submissionId: string, gradingData: GradingData) => Promise<boolean>;
  getGradeHistory: (submissionId: string) => Promise<GradeHistory[]>;
  restoreGradeVersion: (gradeId: string, version: number) => Promise<Grade | null>;
  
  // Utility
  clearError: () => void;
}

export function useGrading(): GradingHookReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleApiCall = useCallback(async <T>(
    apiCall: () => Promise<ApiResponse<T>>,
    successMessage?: string
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCall();
      
      if (response.success && response.data) {
        if (successMessage) {
          // You could integrate with a toast notification system here
          console.log(successMessage);
        }
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Operation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Grading API error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitGrade = useCallback(async (
    submissionId: string, 
    gradingData: GradingData
  ): Promise<Grade | null> => {
    return handleApiCall(
      () => apiClient.post<Grade>(`/submissions/${submissionId}/grade`, gradingData),
      'Grade submitted successfully'
    );
  }, [handleApiCall]);

  const updateGrade = useCallback(async (
    gradeId: string, 
    gradingData: GradingData
  ): Promise<Grade | null> => {
    return handleApiCall(
      () => apiClient.patch<Grade>(`/grades/${gradeId}`, gradingData),
      'Grade updated successfully'
    );
  }, [handleApiCall]);

  const saveDraft = useCallback(async (
    submissionId: string, 
    gradingData: GradingData
  ): Promise<boolean> => {
    const result = await handleApiCall(
      () => apiClient.post<{ saved: boolean }>(`/submissions/${submissionId}/grade/draft`, gradingData),
      'Draft saved successfully'
    );
    return result?.saved || false;
  }, [handleApiCall]);

  const getGradeHistory = useCallback(async (
    submissionId: string
  ): Promise<GradeHistory[]> => {
    const result = await handleApiCall(
      () => apiClient.get<{ history: GradeHistory[] }>(`/submissions/${submissionId}/grade/history`)
    );
    return result?.history || [];
  }, [handleApiCall]);

  const restoreGradeVersion = useCallback(async (
    gradeId: string, 
    version: number
  ): Promise<Grade | null> => {
    return handleApiCall(
      () => apiClient.post<Grade>(`/grades/${gradeId}/restore`, { version }),
      `Grade restored to version ${version}`
    );
  }, [handleApiCall]);

  return {
    loading,
    error,
    submitGrade,
    updateGrade,
    saveDraft,
    getGradeHistory,
    restoreGradeVersion,
    clearError,
  };
}

// Hook for fetching submission details with grading context
export function useSubmissionGrading(submissionId: string) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [rubric, setRubric] = useState<RubricCriterion[]>([]);
  const [gradeHistory, setGradeHistory] = useState<GradeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch submission details
      const submissionResponse = await apiClient.get<Submission>(`/submissions/${submissionId}`);
      if (submissionResponse.success && submissionResponse.data) {
        setSubmission(submissionResponse.data);

        // Fetch rubric for the assessment
        const rubricResponse = await apiClient.get<{ rubric: RubricCriterion[] }>(
          `/assessments/${submissionResponse.data.assessmentId}/rubric`
        );
        if (rubricResponse.success && rubricResponse.data) {
          setRubric(rubricResponse.data.rubric);
        }

        // Fetch grade history
        const historyResponse = await apiClient.get<{ history: GradeHistory[] }>(
          `/submissions/${submissionId}/grade/history`
        );
        if (historyResponse.success && historyResponse.data) {
          setGradeHistory(historyResponse.data.history);
        }
      } else {
        throw new Error(submissionResponse.error?.message || 'Failed to fetch submission');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load submission data';
      setError(errorMessage);
      console.error('Submission grading fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  const refreshData = useCallback(() => {
    fetchSubmissionData();
  }, [fetchSubmissionData]);

  // Fetch data on mount
  useEffect(() => {
    if (submissionId) {
      fetchSubmissionData();
    }
  }, [submissionId, fetchSubmissionData]);

  return {
    submission,
    rubric,
    gradeHistory,
    loading,
    error,
    refreshData,
  };
}
