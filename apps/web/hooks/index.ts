// Export all hooks
export { useAuth } from '../contexts/AuthContext';
export { useApi, useFetch, useMutation } from './useApi';
export { useDataTable } from './useDataTable';
export {
  useLocalStorage,
  useLocalStorageState,
  useLocalStorageObject,
  useLocalStorageArray,
} from './useLocalStorage';

// Additional utility hooks
export { useDebounce, useDebouncedCallback } from './useDebounce';
export { useFormValidation } from './useFormValidation';
export { useToast } from './useToast';
export { useDialogEscape, useDialogForm } from './useDialogEscape';

// Performance hooks
export {
  useStableCallback,
  useExpensiveComputation,
  useLazyRef,
  useThrottle,
  useIntersectionObserver,
  useVirtualList,
  useElementSize,
  useWebWorker,
  useIdleCallback,
  usePrefetch,
  usePerformanceMonitor,
} from './usePerformance';
