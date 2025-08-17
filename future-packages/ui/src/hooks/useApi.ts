import { useState, useEffect, useCallback } from 'react';
import { ApiResponse } from '@shipnorth/shared';

interface UseApiOptions {
  immediate?: boolean;
  dependencies?: any[];
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<{ data: T }>,
  options: UseApiOptions = {}
): UseApiState<T> {
  const { immediate = false, dependencies = [] } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiFunction(...args);
      const result = response.data;
      
      setData(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

// Specialized hooks for common patterns
export function useApiList<T = any>(
  listFunction: (params?: any) => Promise<{ data: { items?: T[]; [key: string]: any } }>,
  initialParams: any = {}
) {
  const [params, setParams] = useState(initialParams);
  const { data, loading, error, execute } = useApi(
    () => listFunction(params),
    { immediate: true, dependencies: [params] }
  );

  const refresh = useCallback(() => execute(), [execute]);
  
  const updateParams = useCallback((newParams: any) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  return {
    items: data?.items || data || [],
    pagination: data?.pagination,
    loading,
    error,
    refresh,
    params,
    updateParams,
  };
}

export function useApiMutation<T = any, P = any>(
  mutationFunction: (data: P) => Promise<{ data: T }>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const mutate = useCallback(async (mutationData: P): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await mutationFunction(mutationData);
      const result = response.data;
      
      setData(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [mutationFunction]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    loading,
    error,
    data,
    reset,
  };
}