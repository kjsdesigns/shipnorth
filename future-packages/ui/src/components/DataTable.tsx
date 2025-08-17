import React, { useState } from 'react';
import { ChevronUp, ChevronDown, MoreVertical } from 'lucide-react';

export interface Column<T = any> {
  key: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface TableAction<T = any> {
  label: string;
  onClick: (item: T) => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary' | 'danger';
  show?: (item: T) => boolean;
}

interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  actions?: TableAction<T>[];
  loading?: boolean;
  emptyMessage?: string;
  selectable?: boolean;
  selectedItems?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  getItemId?: (item: T) => string;
  className?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
  sorting?: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  };
}

export default function DataTable<T = any>({
  data,
  columns,
  actions = [],
  loading = false,
  emptyMessage = 'No data available',
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  getItemId = (item: any) => item.id,
  className = '',
  pagination,
  sorting,
}: DataTableProps<T>) {
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (selectedItems.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map(getItemId));
    }
  };

  const handleSelectItem = (itemId: string) => {
    if (!onSelectionChange) return;
    
    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  const handleSort = (columnKey: string) => {
    if (!sorting?.onSortChange) return;
    
    const newOrder = 
      sorting.sortBy === columnKey && sorting.sortOrder === 'asc' 
        ? 'desc' 
        : 'asc';
    
    sorting.onSortChange(columnKey, newOrder);
  };

  const renderSortIcon = (columnKey: string) => {
    if (!sorting || sorting.sortBy !== columnKey) return null;
    
    return sorting.sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  const getActionButtonClass = (variant: string) => {
    const variants = {
      primary: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200',
      secondary: 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
      danger: 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200',
    };
    return variants[variant as keyof typeof variants] || variants.secondary;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {selectable && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''
                  } ${column.headerClassName || ''}`}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && renderSortIcon(column.key)}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item, index) => {
              const itemId = getItemId(item);
              return (
                <tr key={itemId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  {selectable && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(itemId)}
                        onChange={() => handleSelectItem(itemId)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 text-sm ${column.className || ''}`}
                    >
                      {column.accessor(item)}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center space-x-2">
                        {actions
                          .filter(action => !action.show || action.show(item))
                          .slice(0, 3)
                          .map((action, actionIndex) => (
                            <button
                              key={actionIndex}
                              onClick={() => action.onClick(item)}
                              className={getActionButtonClass(action.variant || 'secondary')}
                              title={action.label}
                            >
                              {action.icon && <action.icon className="h-4 w-4" />}
                            </button>
                          ))}
                        
                        {actions.filter(action => !action.show || action.show(item)).length > 3 && (
                          <div className="relative">
                            <button
                              onClick={() => setActionMenuOpen(
                                actionMenuOpen === itemId ? null : itemId
                              )}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            
                            {actionMenuOpen === itemId && (
                              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                                {actions
                                  .filter(action => !action.show || action.show(item))
                                  .slice(3)
                                  .map((action, actionIndex) => (
                                    <button
                                      key={actionIndex}
                                      onClick={() => {
                                        action.onClick(item);
                                        setActionMenuOpen(null);
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                      {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                                      {action.label}
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {data.length === 0 && !loading && (
        <div className="p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={pagination.limit}
                onChange={(e) => pagination.onLimitChange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={250}>250 per page</option>
                <option value={500}>500 per page</option>
              </select>
              
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              
              <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
              </span>
              
              <button
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}