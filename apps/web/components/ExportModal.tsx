'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Download, FileText, X, Calendar } from 'lucide-react';
import { LoadingButton } from './LoadingState';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  title: string;
  description: string;
  availableFormats?: ExportFormat[];
  availableFields?: ExportField[];
  dateRangeEnabled?: boolean;
}

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  extension: string;
}

interface ExportField {
  id: string;
  name: string;
  description?: string;
  required?: boolean;
}

interface ExportOptions {
  format: string;
  fields: string[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  includeHeaders: boolean;
}

const DEFAULT_FORMATS: ExportFormat[] = [
  {
    id: 'csv',
    name: 'CSV',
    description: 'Comma-separated values for spreadsheets',
    extension: 'csv',
  },
  { id: 'xlsx', name: 'Excel', description: 'Microsoft Excel format', extension: 'xlsx' },
  { id: 'pdf', name: 'PDF', description: 'Printable document format', extension: 'pdf' },
];

export default function ExportModal({
  isOpen,
  onClose,
  onExport,
  title,
  description,
  availableFormats = DEFAULT_FORMATS,
  availableFields = [],
  dateRangeEnabled = true,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState(availableFormats[0]?.id || 'csv');
  const [selectedFields, setSelectedFields] = useState<string[]>(
    availableFields.filter((f) => f.required).map((f) => f.id)
  );
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  const handleFieldToggle = (fieldId: string) => {
    const field = availableFields.find((f) => f.id === fieldId);
    if (field?.required) return; // Can't deselect required fields

    setSelectedFields((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    );
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const options: ExportOptions = {
        format: selectedFormat,
        fields: selectedFields,
        includeHeaders,
        ...(dateRangeEnabled && { dateRange }),
      };

      await onExport(options);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={loading ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                      <div className="flex items-center space-x-2">
                        <Download className="h-5 w-5 text-blue-600" />
                        <span>{title}</span>
                      </div>
                    </Dialog.Title>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{description}</p>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Format Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Export Format
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {availableFormats.map((format) => (
                        <label key={format.id} className="cursor-pointer">
                          <input
                            type="radio"
                            name="format"
                            value={format.id}
                            checked={selectedFormat === format.id}
                            onChange={(e) => setSelectedFormat(e.target.value)}
                            className="sr-only"
                          />
                          <div
                            className={`p-4 rounded-lg border-2 transition-all ${
                              selectedFormat === format.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <FileText
                                className={`h-5 w-5 ${
                                  selectedFormat === format.id ? 'text-blue-600' : 'text-gray-400'
                                }`}
                              />
                              <div>
                                <p
                                  className={`font-medium ${
                                    selectedFormat === format.id
                                      ? 'text-blue-900 dark:text-blue-200'
                                      : 'text-gray-900 dark:text-white'
                                  }`}
                                >
                                  {format.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {format.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date Range */}
                  {dateRangeEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) =>
                              setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) =>
                              setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Field Selection */}
                  {availableFields.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Fields to Include
                      </label>
                      <div className="max-h-48 overflow-y-auto space-y-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        {availableFields.map((field) => (
                          <label
                            key={field.id}
                            className="flex items-center space-x-3 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedFields.includes(field.id)}
                              onChange={() => handleFieldToggle(field.id)}
                              disabled={field.required}
                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <p
                                className={`text-sm font-medium text-gray-900 dark:text-white ${
                                  field.required ? 'text-gray-600 dark:text-gray-400' : ''
                                }`}
                              >
                                {field.name}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                              </p>
                              {field.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {field.description}
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Options */}
                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeHeaders}
                        onChange={(e) => setIncludeHeaders(e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Include column headers
                      </span>
                    </label>
                  </div>
                </div>

                <div className="mt-8 flex space-x-3 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <LoadingButton
                    onClick={handleExport}
                    loading={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Export Data
                  </LoadingButton>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
