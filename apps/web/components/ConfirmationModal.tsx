'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { useDialogEscape } from '@/hooks/useDialogEscape';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

const iconMap = {
  danger: XCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const colorMap = {
  danger: {
    icon: 'text-red-600',
    bg: 'bg-red-100 dark:bg-red-900/20',
    button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  warning: {
    icon: 'text-orange-600',
    bg: 'bg-orange-100 dark:bg-orange-900/20',
    button: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
  },
  info: {
    icon: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  },
  success: {
    icon: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/20',
    button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
  },
};

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  loading = false,
}: ConfirmationModalProps) {
  const Icon = iconMap[type];
  const colors = colorMap[type];

  // Use standardized ESC behavior - confirmation dialogs don't have "changes" so ESC always closes
  const { handleCloseAttempt } = useDialogEscape({
    isOpen,
    onClose,
    hasChanges: false, // Confirmation dialogs don't have form changes
    enableEscapeKey: !loading, // Disable ESC if loading
  });

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={loading ? () => {} : handleCloseAttempt}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all border border-gray-200 dark:border-gray-700">
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 p-2 rounded-full ${colors.bg}`}>
                    <Icon className={`h-6 w-6 ${colors.icon}`} />
                  </div>
                  <div className="flex-1">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                    >
                      {title}
                    </Dialog.Title>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{message}</div>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3 justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={onClose}
                    disabled={loading}
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${colors.button}`}
                    onClick={handleConfirm}
                    disabled={loading}
                  >
                    {loading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    <span>{loading ? 'Processing...' : confirmText}</span>
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
