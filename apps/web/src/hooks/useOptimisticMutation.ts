import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import toast from 'react-hot-toast';

/**
 * Custom hook for optimistic updates with React Query
 * 
 * Example usage:
 * 
 * const updateProject = useOptimisticMutation({
 *   mutationFn: (data) => api.put(`/projects/${data.id}`, data),
 *   queryKey: ['projects'],
 *   updateCache: (oldData, newData) => {
 *     return oldData.map(project => 
 *       project.id === newData.id ? { ...project, ...newData } : project
 *     );
 *   },
 *   successMessage: 'Project updated successfully',
 *   errorMessage: 'Failed to update project',
 * });
 */

interface UseOptimisticMutationOptions<TData, TVariables, TContext = unknown> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: unknown[];
  updateCache?: (oldData: any, variables: TVariables) => any;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
  onError?: (error: Error, variables: TVariables, context: TContext | undefined) => void;
}

export function useOptimisticMutation<TData = unknown, TVariables = unknown, TContext = unknown>({
  mutationFn,
  queryKey,
  updateCache,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
}: UseOptimisticMutationOptions<TData, TVariables, TContext>) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables, TContext>({
    mutationFn,
    
    // Optimistic update
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update the cache
      if (updateCache && previousData) {
        queryClient.setQueryData(queryKey, (old: any) => updateCache(old, variables));
      }

      // Return context with the previous data
      return { previousData } as TContext;
    },

    // On success
    onSuccess: (data, variables, context) => {
      if (successMessage) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },

    // On error, rollback
    onError: (error, variables, context) => {
      // Rollback to previous data
      if (context && 'previousData' in context) {
        queryClient.setQueryData(queryKey, (context as any).previousData);
      }

      if (errorMessage) {
        toast.error(errorMessage);
      }

      if (onError) {
        onError(error, variables, context);
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Example: Optimistic update for updating a project
 */
export function useUpdateProject() {
  return useOptimisticMutation({
    mutationFn: async (data: { id: string; title: string; brief: string }) => {
      const response = await fetch(`/api/v1/projects/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    queryKey: ['projects'],
    updateCache: (oldProjects, newData) => {
      return oldProjects.map((project: any) =>
        project._id === newData.id ? { ...project, ...newData } : project
      );
    },
    successMessage: 'Project updated successfully',
    errorMessage: 'Failed to update project',
  });
}

/**
 * Example: Optimistic update for deleting a project
 */
export function useDeleteProject() {
  return useOptimisticMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/v1/projects/${projectId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    queryKey: ['projects'],
    updateCache: (oldProjects, projectId) => {
      return oldProjects.filter((project: any) => project._id !== projectId);
    },
    successMessage: 'Project deleted successfully',
    errorMessage: 'Failed to delete project',
  });
}

/**
 * Example: Optimistic update for creating a project
 */
export function useCreateProject() {
  return useOptimisticMutation({
    mutationFn: async (data: { title: string; brief: string; type: string }) => {
      const response = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    queryKey: ['projects'],
    updateCache: (oldProjects, newData) => {
      // Add temporary ID for optimistic update
      const tempProject = {
        _id: `temp-${Date.now()}`,
        ...newData,
        status: 'draft',
        createdAt: new Date().toISOString(),
      };
      return [...oldProjects, tempProject];
    },
    successMessage: 'Project created successfully',
    errorMessage: 'Failed to create project',
  });
}
