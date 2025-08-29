import { useCallback, useRef, useMemo, useEffect, useState } from 'react';

// Hook for memoized callbacks with stable references
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback(((...args: Parameters<T>) => callbackRef.current(...args)) as T, deps);
}

// Hook for expensive computations with memoization
export function useExpensiveComputation<T>(computeFn: () => T, deps: React.DependencyList): T {
  return useMemo(computeFn, deps);
}

// Hook for lazy initialization of expensive resources
export function useLazyRef<T>(init: () => T): React.MutableRefObject<T> {
  const ref = useRef<T | undefined>(undefined);

  if (ref.current === undefined) {
    ref.current = init();
  }

  return ref as React.MutableRefObject<T>;
}

// Hook for throttled values
export function useThrottle<T>(value: T, delay: number): T {
  const throttledValueRef = useRef<T>(value);
  const lastRanRef = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();

    if (now >= lastRanRef.current + delay) {
      throttledValueRef.current = value;
      lastRanRef.current = now;
    } else {
      const timeoutId = setTimeout(
        () => {
          throttledValueRef.current = value;
          lastRanRef.current = Date.now();
        },
        delay - (now - lastRanRef.current)
      );

      return () => clearTimeout(timeoutId);
    }
  }, [value, delay]);

  return throttledValueRef.current;
}

// Hook for intersection observer (lazy loading, infinite scroll, etc.)
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, IntersectionObserverEntry | null] {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const observer = useRef<IntersectionObserver | undefined>(undefined);

  const ref = useCallback(
    (element: Element | null) => {
      if (observer.current) {
        observer.current.disconnect();
      }

      if (element) {
        observer.current = new IntersectionObserver(([entry]) => {
          setEntry(entry);
        }, options);
        observer.current.observe(element);
      }
    },
    [options.threshold, options.root, options.rootMargin]
  );

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return [ref, entry];
}

// Hook for virtualization/windowing
export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const virtualItems = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
      index: startIndex + index,
      item,
      top: (startIndex + index) * itemHeight,
    }));

    return {
      totalHeight,
      visibleItems,
      startIndex,
      endIndex,
    };
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    ...virtualItems,
    handleScroll,
  };
}

// Hook for measuring element dimensions
export function useElementSize(): [
  React.RefCallback<HTMLElement>,
  { width: number; height: number },
] {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const resizeObserver = useRef<ResizeObserver | undefined>(undefined);

  const ref = useCallback((element: HTMLElement | null) => {
    if (resizeObserver.current) {
      resizeObserver.current.disconnect();
    }

    if (element && window.ResizeObserver) {
      resizeObserver.current = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      });
      resizeObserver.current.observe(element);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
      }
    };
  }, []);

  return [ref, size];
}

// Hook for web workers
export function useWebWorker<T = any, R = any>(
  workerFactory: () => Worker,
  deps: React.DependencyList = []
) {
  const worker = useRef<Worker | undefined>(undefined);
  const [result, setResult] = useState<R | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    worker.current = workerFactory();

    worker.current.onmessage = (e) => {
      setResult(e.data);
      setLoading(false);
      setError(null);
    };

    worker.current.onerror = (e) => {
      setError(new Error(e.message));
      setLoading(false);
    };

    return () => {
      if (worker.current) {
        worker.current.terminate();
      }
    };
  }, deps);

  const postMessage = useCallback((data: T) => {
    if (worker.current) {
      setLoading(true);
      setError(null);
      worker.current.postMessage(data);
    }
  }, []);

  return { postMessage, result, loading, error };
}

// Hook for idle callback scheduling
export function useIdleCallback(
  callback: () => void,
  deps: React.DependencyList,
  options: IdleRequestOptions = {}
) {
  useEffect(() => {
    if (window.requestIdleCallback) {
      const id = window.requestIdleCallback(callback, options);
      return () => window.cancelIdleCallback(id);
    } else {
      // Fallback for browsers without requestIdleCallback
      const id = setTimeout(callback, 0);
      return () => clearTimeout(id);
    }
  }, deps);
}

// Hook for prefetching data
export function usePrefetch<T>(prefetchFn: () => Promise<T>, condition: boolean = true) {
  const cache = useRef<Map<string, Promise<T>>>(new Map());

  const prefetch = useCallback(
    (key: string) => {
      if (!condition) return;

      if (!cache.current.has(key)) {
        cache.current.set(key, prefetchFn());
      }

      return cache.current.get(key);
    },
    [prefetchFn, condition]
  );

  const getCached = useCallback((key: string) => {
    return cache.current.get(key);
  }, []);

  const invalidate = useCallback((key?: string) => {
    if (key) {
      cache.current.delete(key);
    } else {
      cache.current.clear();
    }
  }, []);

  return { prefetch, getCached, invalidate };
}

// Performance monitoring hook
export function usePerformanceMonitor(name: string) {
  const startTime = useRef<number | undefined>(undefined);

  const start = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const end = useCallback(() => {
    if (startTime.current !== undefined) {
      const duration = performance.now() - startTime.current;
      console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);

      // Send to analytics if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'timing_complete', {
          name,
          value: Math.round(duration),
        });
      }
    }
  }, [name]);

  return { start, end };
}
