import { ReactNode, useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, CheckSquare, Square, Minus } from 'lucide-react';
import { useDataTable } from '@/hooks/useDataTable';

export interface Column<T> {
  key: keyof T;
  title: string;
  render?: (value: any, item: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  selectable?: boolean;
  onSelectionChange?: (selectedItems: T[]) => void;
  actions?: (item: T) => ReactNode;
  loading?: boolean;
  emptyState?: ReactNode;
  pagination?: boolean;
  pageSize?: number;
  className?: string;
}

export default function DataTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  searchFields,
  selectable = false,
  onSelectionChange,
  actions,
  loading = false,
  emptyState,
  pagination = true,
  pageSize = 10,
  className = '',
}: DataTableProps<T>) {
  const table = useDataTable(data, {
    initialItemsPerPage: pageSize,
    searchFields,
  });

  // Notify parent of selection changes
  useMemo(() => {
    if (onSelectionChange) {
      onSelectionChange(table.selectedItems);
    }
  }, [table.selectedItems, onSelectionChange]);

  const LoadingRow = () => (
    <tr>
      <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="px-6 py-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading...</span>
        </div>
      </td>
    </tr>
  );

  const EmptyRow = () => (
    <tr>
      <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="px-6 py-8">
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
  );

  const SortButton = ({ column }: { column: Column<T> }) => {
    if (!column.sortable) return null;

    const isSorted = table.sortField === column.key;
    const isAsc = isSorted && table.sortDirection === 'asc';
    const isDesc = isSorted && table.sortDirection === 'desc';

    return (
      <button
        onClick={() => table.sort(column.key)}
        className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label={`Sort by ${column.title}`}
      >
        {!isSorted && <ChevronUp className="h-4 w-4 opacity-30" />}
        {isAsc && <ChevronUp className="h-4 w-4" />}
        {isDesc && <ChevronDown className="h-4 w-4" />}
      </button>
    );
  };

  const SelectAllCheckbox = () => {
    const Icon = table.isAllSelected ? CheckSquare : table.isIndeterminate ? Minus : Square;

    return (
      <button
        onClick={table.toggleAllSelection}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label={table.isAllSelected ? 'Deselect all' : 'Select all'}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  };

  const SelectCheckbox = ({ item }: { item: T }) => {
    const isSelected = table.isSelected(item.id);
    const Icon = isSelected ? CheckSquare : Square;

    return (
      <button
        onClick={() => table.toggleSelection(item.id)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label={isSelected ? 'Deselect item' : 'Select item'}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  };

  const Pagination = () => {
    if (!pagination || table.totalPages <= 1) return null;

    const pages = Array.from({ length: table.totalPages }, (_, i) => i + 1);
    const showPages = pages.slice(
      Math.max(0, table.currentPage - 3),
      Math.min(pages.length, table.currentPage + 2)
    );

    return (
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {(table.currentPage - 1) * table.itemsPerPage + 1} to{' '}
          {Math.min(table.currentPage * table.itemsPerPage, table.searchMatches)} of{' '}
          {table.searchMatches} results
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => table.setPage(table.currentPage - 1)}
            disabled={!table.hasPreviousPage}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {showPages[0] > 1 && (
            <>
              <button
                onClick={() => table.setPage(1)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                1
              </button>
              {showPages[0] > 2 && <span className="text-gray-400">...</span>}
            </>
          )}

          {showPages.map((page) => (
            <button
              key={page}
              onClick={() => table.setPage(page)}
              className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                page === table.currentPage
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {page}
            </button>
          ))}

          {showPages[showPages.length - 1] < table.totalPages && (
            <>
              {showPages[showPages.length - 1] < table.totalPages - 1 && (
                <span className="text-gray-400">...</span>
              )}
              <button
                onClick={() => table.setPage(table.totalPages)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {table.totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => table.setPage(table.currentPage + 1)}
            disabled={!table.hasNextPage}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Search bar */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={table.searchQuery}
            onChange={(e) => table.setSearchQuery(e.target.value)}
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {selectable && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                  <SelectAllCheckbox />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    column.align === 'center'
                      ? 'text-center'
                      : column.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                  }`}
                  style={column.width ? { width: column.width } : undefined}
                >
                  <div className="flex items-center">
                    {column.title}
                    <SortButton column={column} />
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <LoadingRow />
            ) : table.paginatedItems.length === 0 ? (
              <EmptyRow />
            ) : (
              table.paginatedItems.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {selectable && (
                    <td className="px-6 py-4">
                      <SelectCheckbox item={item} />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`px-6 py-4 text-sm text-gray-900 dark:text-white ${
                        column.align === 'center'
                          ? 'text-center'
                          : column.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                      }`}
                    >
                      {column.render
                        ? column.render(item[column.key], item, index)
                        : String(item[column.key] || '')}
                    </td>
                  ))}
                  {actions && <td className="px-6 py-4 text-sm">{actions(item)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination />
    </div>
  );
}
