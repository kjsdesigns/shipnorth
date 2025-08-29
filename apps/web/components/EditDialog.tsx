'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { useDialogForm } from '@/hooks/useDialogEscape';
import { Save, X, AlertTriangle } from 'lucide-react';

interface EditDialogProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: T) => Promise<void> | void;
  initialData: T;
  title: string;
  children: (props: {
    data: T;
    updateField: (field: keyof T, value: any) => void;
    hasChanges: boolean;
  }) => React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function EditDialog<T extends Record<string, any>>({
  isOpen,
  onClose,
  onSave,
  initialData,
  title,
  children,
  size = 'md',
}: EditDialogProps<T>) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { formData, hasChanges, updateField, resetForm, handleCloseAttempt } = useDialogForm(
    initialData,
    isOpen,
    onClose
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    handleCloseAttempt();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size={size}
      hasChanges={hasChanges}
      onConfirmClose={resetForm}
      closeOnOverlayClick={!hasChanges} // Prevent accidental close if there are changes
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center text-red-700 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Form content */}
        <div className="max-h-96 overflow-y-auto">
          {children({
            data: formData,
            updateField,
            hasChanges,
          })}
        </div>

        {/* Footer with action buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            {hasChanges && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                Unsaved changes
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="h-4 w-4 inline mr-1" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 inline mr-1" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* ESC instruction */}
        <div className="text-xs text-gray-400 text-center pt-2">
          Press{' '}
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
            ESC
          </kbd>{' '}
          to close
          {hasChanges && ' (will warn about unsaved changes)'}
        </div>
      </div>
    </Modal>
  );
}
