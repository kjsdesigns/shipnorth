import { useEffect, useCallback, useState } from 'react';

interface UseDialogEscapeProps {
  isOpen: boolean;
  onClose: () => void;
  hasChanges: boolean;
  onConfirmClose?: () => void;
  enableEscapeKey?: boolean;
}

interface UseDialogEscapeReturn {
  handleEscapeKey: (event: KeyboardEvent) => void;
  handleCloseAttempt: () => void;
}

/**
 * Standardized dialog ESC behavior with change detection
 * - ESC closes dialog if no changes
 * - ESC warns and offers options if there are unsaved changes
 */
export function useDialogEscape({
  isOpen,
  onClose,
  hasChanges,
  onConfirmClose,
  enableEscapeKey = true,
}: UseDialogEscapeProps): UseDialogEscapeReturn {
  const handleCloseAttempt = useCallback(() => {
    if (hasChanges) {
      // Warn user about unsaved changes
      const shouldClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close this dialog?\n\n' +
          'Click "OK" to discard changes and close\n' +
          'Click "Cancel" to continue editing'
      );

      if (shouldClose) {
        if (onConfirmClose) {
          onConfirmClose();
        } else {
          onClose();
        }
      }
      // If they clicked Cancel, do nothing (stay in dialog)
    } else {
      // No changes, safe to close
      onClose();
    }
  }, [hasChanges, onClose, onConfirmClose]);

  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (!enableEscapeKey || !isOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        handleCloseAttempt();
      }
    },
    [isOpen, enableEscapeKey, handleCloseAttempt]
  );

  useEffect(() => {
    if (isOpen && enableEscapeKey) {
      document.addEventListener('keydown', handleEscapeKey, true);

      return () => {
        document.removeEventListener('keydown', handleEscapeKey, true);
      };
    }
  }, [isOpen, enableEscapeKey, handleEscapeKey]);

  return {
    handleEscapeKey,
    handleCloseAttempt,
  };
}

/**
 * Enhanced dialog hook with form change tracking
 */
export function useDialogForm<T extends Record<string, any>>(
  initialData: T,
  isOpen: boolean,
  onClose: () => void
) {
  const [formData, setFormData] = useState<T>(initialData);
  const [originalData, setOriginalData] = useState<T>(initialData);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      setOriginalData(initialData);
    }
  }, [isOpen, initialData]);

  // Detect if form has changes
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  // Handle form field changes
  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Reset form to original state
  const resetForm = useCallback(() => {
    setFormData(originalData);
  }, [originalData]);

  // ESC behavior
  const { handleCloseAttempt } = useDialogEscape({
    isOpen,
    onClose,
    hasChanges,
    onConfirmClose: resetForm, // Reset form when closing with changes
  });

  return {
    formData,
    hasChanges,
    updateField,
    resetForm,
    handleCloseAttempt,
  };
}
