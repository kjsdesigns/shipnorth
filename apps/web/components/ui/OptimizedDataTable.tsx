import React, { ReactNode, memo, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Search, CheckSquare, Square, Minus } from 'lucide-react';
import { useDataTable, useStableCallback, useVirtualList, useElementSize } from '@/hooks';

// Helper function to detect if a column should be right-aligned based on its data
function shouldAlignRight<T>(column: Column<T>, data: T[]): boolean {
  if (column.align !== undefined) return column.align === 'right';
  
  // Check if column title suggests numeric data
  const title = column.title.toLowerCase();
  if (title.includes('weight') || title.includes('price') || title.includes('cost') || 
      title.includes('rate') || title.includes('amount') || title.includes('total') ||
      title.includes('count') || title.includes('packages') || title.includes('qty') ||
      title.includes('quantity')) {
    return true;
  }
  
  // Sample first few non-null values to detect numeric patterns
  const sampleValues = data.slice(0, 5).map(item => item[column.key]).filter(val => val != null);
  
  if (sampleValues.length === 0) return false;
  
  return sampleValues.every(value => {
    const str = String(value).trim();
    // Check for number patterns: "24", "24.5", "$24.50", "24 kg", "24.5 lbs", etc.
    return /^[\$€£¥]?\d+\.?\d*\s*(kg|lbs|g|oz|%|$)?$/i.test(str) || !isNaN(Number(str));
  });
}

export interface Column<T> {
  key: keyof T;
  title: string;
  render?: (value: any, item: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface OptimizedDataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  selectable?: boolean;
  onSelectionChange?: (selectedItems: T[]) => void;
  actions?: (item: T) => ReactNode;
  loading?: boolean;
  emptyState?: ReactNode;
  virtualized?: boolean;
  itemHeight?: number;
  maxHeight?: number;
  className?: string;
}

// Memoized cell component
const TableCell = memo<{
  column: Column<any>;
  item: any;
  index: number;
  data: any[];
}>(({ column, item, index, data }) => {
  const value = item[column.key];
  const isRightAligned = shouldAlignRight(column, data);
  const alignClass = column.align === 'center' 
    ? 'text-center' 
    : isRightAligned 
      ? 'text-right' 
      : 'text-left';

  return (
    <td className={`px-6 py-4 text-sm text-gray-900 dark:text-white ${alignClass}`}>
      {column.render ? column.render(value, item, index) : String(value || '')}
    </td>
  );
});

TableCell.displayName = 'TableCell';

// Memoized row component
const TableRow = memo<{
  item: any;
  columns: Column<any>[];
  index: number;
  selectable: boolean;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  actions?: (item: any) => ReactNode;
  data: any[];
}>(({ item, columns, index, selectable, isSelected, onToggleSelection, actions, data }) => {
  const handleToggleSelection = useCallback(() => {
    onToggleSelection(item.id);
  }, [item.id, onToggleSelection]);

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      {selectable && (
        <td className="px-6 py-4">
          <button
            onClick={handleToggleSelection}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label={isSelected ? 'Deselect item' : 'Select item'}
          >
            {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          </button>
        </td>
      )}
      {columns.map((column) => (
        <TableCell key={String(column.key)} column={column} item={item} index={index} data={data} />
      ))}
      {actions && <td className="px-6 py-4 text-sm">{actions(item)}</td>}
    </tr>
  );
});

TableRow.displayName = 'TableRow';

// Memoized header component
const TableHeader = memo<{
  columns: Column<any>[];
  selectable: boolean;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onToggleAllSelection: () => void;
  actions: boolean;
  data: any[];
}>(
  ({
    columns,
    selectable,
    sortField,
    sortDirection,
    onSort,
    isAllSelected,
    isIndeterminate,
    onToggleAllSelection,
    actions,
    data,
  }) => {
    const SortButton = memo<{ column: Column<any> }>(({ column }) => {
      if (!column.sortable) return null;

      const isSorted = sortField === column.key;
      const isAsc = isSorted && sortDirection === 'asc';
      const isDesc = isSorted && sortDirection === 'desc';

      const handleSort = useCallback(() => {
        onSort(String(column.key));
      }, [column.key]);

      return (
        <button
          onClick={handleSort}
          className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label={`Sort by ${column.title}`}
        >
          {!isSorted && <ChevronUp className="h-4 w-4 opacity-30" />}
          {isAsc && <ChevronUp className="h-4 w-4" />}
          {isDesc && <ChevronDown className="h-4 w-4" />}
        </button>
      );
    });

    SortButton.displayName = 'SortButton';

    const SelectAllIcon = isAllSelected ? CheckSquare : isIndeterminate ? Minus : Square;

    return (
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-700">
          {selectable && (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
              <button
                onClick={onToggleAllSelection}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label={isAllSelected ? 'Deselect all' : 'Select all'}
              >
                <SelectAllIcon className="h-4 w-4" />
              </button>
            </th>
          )}
          {columns.map((column) => {
            const isRightAligned = shouldAlignRight(column, data);
            const alignClass = column.align === 'center' 
              ? 'text-center' 
              : isRightAligned 
                ? 'text-right' 
                : 'text-left';
            
            return (
            <th
              key={String(column.key)}
              className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${alignClass}`}
              style={column.width ? { width: column.width } : undefined}
            >
              <div className="flex items-center">
                {column.title}
                <SortButton column={column} />
              </div>
            </th>
            );
          })}
          {actions && (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
              Actions
            </th>
          )}
        </tr>
      </thead>
    );
  }
);

TableHeader.displayName = 'TableHeader';

// Virtualized table body component
const VirtualizedTableBody = memo<{
  items: any[];
  columns: Column<any>[];
  containerHeight: number;
  itemHeight: number;
  selectable: boolean;
  isSelected: (id: string) => boolean;
  onToggleSelection: (id: string) => void;
  actions?: (item: any) => ReactNode;
}>(
  ({
    items,
    columns,
    containerHeight,
    itemHeight,
    selectable,
    isSelected,
    onToggleSelection,
    actions,
  }) => {
    const { visibleItems, totalHeight, handleScroll } = useVirtualList({
      items,
      itemHeight,
      containerHeight,
    });

    return (
      <div style={{ height: containerHeight, overflow: 'auto' }} onScroll={handleScroll}>
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleItems.map(({ item, index, top }) => (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
            >
              <table className="w-full">
                <tbody>
                  <TableRow
                    item={item}
                    columns={columns}
                    index={index}
                    selectable={selectable}
                    isSelected={isSelected(item.id)}
                    onToggleSelection={onToggleSelection}
                    actions={actions}
                    data={items}
                  />
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

VirtualizedTableBody.displayName = 'VirtualizedTableBody';

// Main optimized data table component
export const OptimizedDataTable = memo(function OptimizedDataTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  searchFields,
  selectable = false,
  onSelectionChange,
  actions,
  loading = false,
  emptyState,
  virtualized = false,
  itemHeight = 60,
  maxHeight = 400,
  className = '',
}: OptimizedDataTableProps<T>) {
  const table = useDataTable(data, {
    searchFields,
  });

  const [containerRef, containerSize] = useElementSize();

  // Stable callbacks to prevent unnecessary re-renders
  const handleSelectionChange = useStableCallback(
    (selectedItems: T[]) => {
      onSelectionChange?.(selectedItems);
    },
    [onSelectionChange]
  );

  // Memoize selection change effect
  useMemo(() => {
    handleSelectionChange(table.selectedItems);
  }, [table.selectedItems, handleSelectionChange]);

  const handleSort = useStableCallback(
    (field: string) => {
      table.sort(field as keyof T);
    },
    [table.sort]
  );

  const handleSearch = useStableCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      table.setSearchQuery(e.target.value);
    },
    [table.setSearchQuery]
  );

  // Memoized components
  const SearchBar = useMemo(
    () => (
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={table.searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {table.searchQuery && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Found {table.searchMatches} result{table.searchMatches !== 1 ? 's' : ''} for "
            {table.searchQuery}"
          </p>
        )}
      </div>
    ),
    [searchPlaceholder, table.searchQuery, table.searchMatches, handleSearch]
  );

  const TableContent = useMemo(() => {
    if (loading) {
      return (
        <tbody>
          <tr>
            <td
              colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
              className="px-6 py-4"
            >
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading...</span>
              </div>
            </td>
          </tr>
        </tbody>
      );
    }

    if (table.filteredItems.length === 0) {
      return (
        <tbody>
          <tr>
            <td
              colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
              className="px-6 py-8"
            >
              {emptyState || (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  {table.searchQuery ? (
                    <div>
                      <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No results found</p>
                      <p className="text-sm">No items match "{table.searchQuery}"</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-medium mb-2">No data available</p>
                      <p className="text-sm">There are no items to display</p>
                    </div>
                  )}
                </div>
              )}
            </td>
          </tr>
        </tbody>
      );
    }

    if (virtualized && containerSize.height > 0) {
      return null; // Virtualized content is rendered separately
    }

    return (
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {table.filteredItems.map((item, index) => (
          <TableRow
            key={item.id}
            item={item}
            columns={columns}
            index={index}
            selectable={selectable}
            isSelected={table.isSelected(item.id)}
            onToggleSelection={table.toggleSelection}
            actions={actions}
            data={data}
          />
        ))}
      </tbody>
    );
  }, [
    loading,
    table.filteredItems,
    table.searchQuery,
    table.searchMatches,
    columns,
    selectable,
    actions,
    emptyState,
    virtualized,
    containerSize.height,
    table.isSelected,
    table.toggleSelection,
  ]);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {SearchBar}

      <div ref={containerRef} className="overflow-x-auto">
        {virtualized && !loading && table.filteredItems.length > 0 ? (
          <>
            <table className="w-full">
              <TableHeader
                columns={columns}
                selectable={selectable}
                sortField={table.sortField ? String(table.sortField) : null}
                sortDirection={table.sortDirection}
                onSort={handleSort}
                isAllSelected={table.isAllSelected}
                isIndeterminate={table.isIndeterminate}
                onToggleAllSelection={table.toggleAllSelection}
                actions={!!actions}
                data={data}
              />
            </table>
            <VirtualizedTableBody
              items={table.filteredItems}
              columns={columns}
              containerHeight={Math.min(maxHeight, containerSize.height)}
              itemHeight={itemHeight}
              selectable={selectable}
              isSelected={table.isSelected}
              onToggleSelection={table.toggleSelection}
              actions={actions}
            />
          </>
        ) : (
          <table className="w-full">
            <TableHeader
              columns={columns}
              selectable={selectable}
              sortField={table.sortField ? String(table.sortField) : null}
              sortDirection={table.sortDirection}
              onSort={handleSort}
              isAllSelected={table.isAllSelected}
              isIndeterminate={table.isIndeterminate}
              onToggleAllSelection={table.toggleAllSelection}
              actions={!!actions}
              data={data}
            />
            {TableContent}
          </table>
        )}
      </div>
    </div>
  );
});

export default OptimizedDataTable;
