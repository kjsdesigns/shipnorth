import { useState, useCallback, useEffect } from 'react';

interface UseLocalStorageOptions {
  serializer?: {
    read: (value: string) => any;
    write: (value: any) => string;
  };
}

const defaultSerializer = {
  read: (value: string) => {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },
  write: (value: any) => JSON.stringify(value),
};

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions = {}
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
  const { serializer = defaultSerializer } = options;

  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? serializer.read(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((prevValue: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        setStoredValue((prevValue) => {
          const valueToStore = value instanceof Function ? value(prevValue) : value;

          // Save to localStorage
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, serializer.write(valueToStore));
          }

          return valueToStore;
        });
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serializer] // Remove storedValue dependency
  );

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for storage changes in other tabs
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(serializer.read(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage change for key "${key}":`, error);
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue, serializer]);

  return [storedValue, setValue, removeValue];
}

// Specialized hooks for common use cases
export function useLocalStorageState<T>(key: string, initialValue: T) {
  return useLocalStorage(key, initialValue);
}

// Hook for storing objects with automatic merging
export function useLocalStorageObject<T extends Record<string, any>>(
  key: string,
  initialValue: T
): [T, (updates: Partial<T>) => void, (value: T | ((prevValue: T) => T)) => void, () => void] {
  const [value, setValue, removeValue] = useLocalStorage(key, initialValue);

  const updateValue = useCallback(
    (updates: Partial<T>) => {
      setValue((prev) => ({ ...prev, ...updates }));
    },
    [setValue]
  );

  return [value, updateValue, setValue, removeValue];
}

// Hook for arrays with helper methods
export function useLocalStorageArray<T>(
  key: string,
  initialValue: T[] = []
): [
  T[],
  {
    push: (...items: T[]) => void;
    filter: (predicate: (item: T, index: number) => boolean) => void;
    update: (index: number, item: T) => void;
    remove: (index: number) => void;
    clear: () => void;
    set: (items: T[]) => void;
  },
] {
  const [array, setArray, removeValue] = useLocalStorage(key, initialValue);

  const push = useCallback(
    (...items: T[]) => {
      setArray((prev) => [...prev, ...items]);
    },
    [setArray]
  );

  const filter = useCallback(
    (predicate: (item: T, index: number) => boolean) => {
      setArray((prev) => prev.filter(predicate));
    },
    [setArray]
  );

  const update = useCallback(
    (index: number, item: T) => {
      setArray((prev) => {
        const newArray = [...prev];
        newArray[index] = item;
        return newArray;
      });
    },
    [setArray]
  );

  const remove = useCallback(
    (index: number) => {
      setArray((prev) => prev.filter((_, i) => i !== index));
    },
    [setArray]
  );

  const clear = useCallback(() => {
    setArray([]);
  }, [setArray]);

  const set = useCallback(
    (items: T[]) => {
      setArray(items);
    },
    [setArray]
  );

  return [
    array,
    {
      push,
      filter,
      update,
      remove,
      clear,
      set,
    },
  ];
}
