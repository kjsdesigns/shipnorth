import { useState, useCallback, useRef, useEffect } from 'react';
import { UseApiState, ApiError } from '@/types';

interface UseApiOptions {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (apiCall: () => Promise<any>) => Promise<T>;
  reset: () => void;
  cancel: () => void;
}

export function useApi<T = any>(options: UseApiOptions = {}): UseApiReturn<T> {
  const { retries = 2, retryDelay = 1000, timeout = 10000 } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const execute = useCallback(
    async (apiCall: () => Promise<any>): Promise<T> => {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setState({
        data: null,
        loading: true,
        error: null,
      });

      let attempt = 0;
      let lastError: Error | null = null;

      const executeWithRetry = async (): Promise<T> => {
        try {
          // Set timeout
          timeoutRef.current = setTimeout(() => {
            abortControllerRef.current?.abort();
            throw new Error('Request timeout');
          }, timeout);

          const response = await apiCall();
          const data = response.data || response;

          setState({
            data,
            loading: false,
            error: null,
          });

          // Clear timeout on success
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          return data;
        } catch (error: any) {
          lastError = error;

          // Don't retry if request was aborted
          if (error.name === 'AbortError') {
            setState((prev) => ({ ...prev, loading: false }));
            throw error;
          }

          // Retry logic
          if (attempt < retries && !abortControllerRef.current?.signal.aborted) {
            attempt++;
            await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
            return executeWithRetry();
          }

          // Final error state
          const apiError: ApiError = {
            message: error.response?.data?.message || error.message || 'Request failed',
            status: error.response?.status,
            code: error.response?.data?.code,
            details: error.response?.data,
          };

          setState({
            data: null,
            loading: false,
            error: apiError.message,
          });

          throw apiError;
        }
      };

      try {
        return await executeWithRetry();
      } catch (error) {
        throw error;
      }
    },
    [retries, retryDelay, timeout]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState((prev) => ({ ...prev, loading: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    execute,
    reset,
    cancel,
  };
}

// Specialized hook for data fetching with auto-execution
export function useFetch<T = any>(
  apiCall: (() => Promise<any>) | null,
  dependencies: any[] = [],
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const api = useApi<T>(options);

  useEffect(() => {
    if (apiCall) {
      api.execute(apiCall).catch(() => {
        // Error is already handled by useApi
      });
    }
  }, [apiCall, api.execute, ...dependencies]); // Properly specify dependencies

  return api;
}

// Hook for mutations with optimistic updates
export function useMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<any>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: ApiError, variables: TVariables) => void;
    onSettled?: (data: TData | null, error: ApiError | null, variables: TVariables) => void;
    optimisticUpdate?: (variables: TVariables) => TData;
  } & UseApiOptions = {}
): UseApiReturn<TData> & {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
} {
  const { onSuccess, onError, onSettled, optimisticUpdate, ...apiOptions } = options;
  const api = useApi<TData>(apiOptions);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      let optimisticData: TData | null = null;

      try {
        // Apply optimistic update if provided
        if (optimisticUpdate) {
          optimisticData = optimisticUpdate(variables);
          api.reset();
          // We don't set optimistic data in state as it would interfere with loading state
        }

        const result = await api.execute(() => mutationFn(variables));

        onSuccess?.(result, variables);
        onSettled?.(result, null, variables);

        return result;
      } catch (error) {
        const apiError = error as ApiError;
        onError?.(apiError, variables);
        onSettled?.(null, apiError, variables);
        throw apiError;
      }
    },
    [api, mutationFn, onSuccess, onError, onSettled, optimisticUpdate]
  );

  return {
    ...api,
    mutate,
    mutateAsync: mutate, // Alias for consistency with react-query
  };
}
