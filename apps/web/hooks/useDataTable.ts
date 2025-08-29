import { useState, useCallback, useMemo, useEffect } from 'react';
import { UseDataTableState } from '@/types';

interface UseDataTableOptions<T> {
  initialItemsPerPage?: number;
  searchFields?: (keyof T)[];
  defaultSort?: {
    field: keyof T;
    direction: 'asc' | 'desc';
  };
}

interface UseDataTableReturn<T> extends UseDataTableState<T> {
  setItems: (items: T[]) => void;
  setSearchQuery: (query: string) => void;
  toggleSelection: (id: string) => void;
  toggleAllSelection: () => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  sort: (field: keyof T) => void;
  setPage: (page: number) => void;
  setItemsPerPage: (count: number) => void;
  paginatedItems: T[];
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  selectedItems: T[];
  searchMatches: number;
}

export function useDataTable<T extends { id: string }>(
  initialItems: T[] = [],
  options: UseDataTableOptions<T> = {}
): UseDataTableReturn<T> {
  const { initialItemsPerPage = 10, searchFields, defaultSort } = options;

  const [state, setState] = useState<UseDataTableState<T>>({
    items: initialItems,
    filteredItems: initialItems,
    searchQuery: '',
    selectedIds: new Set(),
    sortField: defaultSort?.field || null,
    sortDirection: defaultSort?.direction || 'asc',
    currentPage: 1,
    itemsPerPage: initialItemsPerPage,
  });

  // Update items when initialItems change
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      items: initialItems,
      filteredItems: initialItems,
    }));
  }, [initialItems]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!state.searchQuery.trim()) {
      return state.items;
    }

    const query = state.searchQuery.toLowerCase();

    return state.items.filter((item) => {
      if (searchFields) {
        return searchFields.some((field) => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query);
          }
          if (typeof value === 'number') {
            return value.toString().includes(query);
          }
          return false;
        });
      }

      // Default: search all string fields
      return Object.values(item).some((value: any) => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        if (typeof value === 'number') {
          return value.toString().includes(query);
        }
        return false;
      });
    });
  }, [state.items, state.searchQuery, searchFields]);

  // Sort filtered items
  const sortedItems = useMemo(() => {
    if (!state.sortField) {
      return filteredItems;
    }

    return [...filteredItems].sort((a, b) => {
      const aValue = a[state.sortField!];
      const bValue = b[state.sortField!];

      let comparison = 0;

      if (aValue === null || aValue === undefined) comparison = 1;
      else if (bValue === null || bValue === undefined) comparison = -1;
      else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return state.sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [filteredItems, state.sortField, state.sortDirection]);

  // Remove this useEffect - it creates infinite loops
  // filteredItems is now handled by useMemo directly

  // Pagination
  const totalPages = Math.ceil(state.filteredItems.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  const paginatedItems = state.filteredItems.slice(startIndex, endIndex);

  const setItems = useCallback((items: T[]) => {
    setState((prev) => ({
      ...prev,
      items,
      filteredItems: items,
      selectedIds: new Set(),
      currentPage: 1,
    }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({
      ...prev,
      searchQuery: query,
      currentPage: 1,
    }));
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setState((prev) => {
      const newSelectedIds = new Set(prev.selectedIds);
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id);
      } else {
        newSelectedIds.add(id);
      }
      return {
        ...prev,
        selectedIds: newSelectedIds,
      };
    });
  }, []);

  const toggleAllSelection = useCallback(() => {
    setState((prev) => {
      const allIds = prev.filteredItems.map((item) => item.id);
      const isAllSelected = allIds.every((id) => prev.selectedIds.has(id));

      const newSelectedIds = new Set(prev.selectedIds);
      if (isAllSelected) {
        // Deselect all filtered items
        allIds.forEach((id) => newSelectedIds.delete(id));
      } else {
        // Select all filtered items
        allIds.forEach((id) => newSelectedIds.add(id));
      }

      return {
        ...prev,
        selectedIds: newSelectedIds,
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedIds: new Set(),
    }));
  }, []);

  const isSelected = useCallback(
    (id: string) => {
      return state.selectedIds.has(id);
    },
    [state.selectedIds]
  );

  const isAllSelected = useMemo(() => {
    if (state.filteredItems.length === 0) return false;
    return state.filteredItems.every((item) => state.selectedIds.has(item.id));
  }, [state.filteredItems, state.selectedIds]);

  const isIndeterminate = useMemo(() => {
    const selectedFromFiltered = state.filteredItems.filter((item) =>
      state.selectedIds.has(item.id)
    );
    return (
      selectedFromFiltered.length > 0 && selectedFromFiltered.length < state.filteredItems.length
    );
  }, [state.filteredItems, state.selectedIds]);

  const sort = useCallback((field: keyof T) => {
    setState((prev) => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === 'asc' ? 'desc' : 'asc',
      currentPage: 1,
    }));
  }, []);

  const setPage = useCallback(
    (page: number) => {
      setState((prev) => ({
        ...prev,
        currentPage: Math.max(1, Math.min(page, totalPages)),
      }));
    },
    [totalPages]
  );

  const setItemsPerPage = useCallback((count: number) => {
    setState((prev) => ({
      ...prev,
      itemsPerPage: count,
      currentPage: 1,
    }));
  }, []);

  const hasNextPage = state.currentPage < totalPages;
  const hasPreviousPage = state.currentPage > 1;

  const selectedItems = useMemo(() => {
    return state.items.filter((item) => state.selectedIds.has(item.id));
  }, [state.items, state.selectedIds]);

  const searchMatches = state.filteredItems.length;

  return {
    ...state,
    filteredItems: sortedItems, // Use computed value instead of state
    setItems,
    setSearchQuery,
    toggleSelection,
    toggleAllSelection,
    clearSelection,
    isSelected,
    isAllSelected,
    isIndeterminate,
    sort,
    setPage,
    setItemsPerPage,
    paginatedItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    selectedItems,
    searchMatches,
  };
}
