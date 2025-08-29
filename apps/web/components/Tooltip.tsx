'use client';

import { Fragment, useState } from 'react';
import { Transition } from '@headlessui/react';
import { HelpCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
  delay = 200,
}: TooltipProps) {
  const [show, setShow] = useState(false);
  let timeout: NodeJS.Timeout;

  const showTooltip = () => {
    timeout = setTimeout(() => setShow(true), delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeout);
    setShow(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
    bottom:
      'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
    right:
      'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900',
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <Transition
        show={show}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 transform scale-95"
        enterTo="opacity-100 transform scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 transform scale-100"
        leaveTo="opacity-0 transform scale-95"
      >
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg py-2 px-3 max-w-xs shadow-lg">
            {content}
            <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}></div>
          </div>
        </div>
      </Transition>
    </div>
  );
}

// Help icon with tooltip
interface HelpTooltipProps {
  content: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  iconSize?: 'sm' | 'md' | 'lg';
}

export function HelpTooltip({
  content,
  position = 'top',
  className = '',
  iconSize = 'sm',
}: HelpTooltipProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <Tooltip content={content} position={position} className={className}>
      <HelpCircle
        className={`text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help ${sizeClasses[iconSize]}`}
      />
    </Tooltip>
  );
}

// Status indicator with tooltip
interface StatusTooltipProps {
  status: 'success' | 'warning' | 'error' | 'info';
  content: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function StatusTooltip({
  status,
  content,
  position = 'top',
  className = '',
}: StatusTooltipProps) {
  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'text-green-500',
    warning: 'text-orange-500',
    error: 'text-red-500',
    info: 'text-blue-500',
  };

  const Icon = icons[status];

  return (
    <Tooltip content={content} position={position} className={className}>
      <Icon className={`h-4 w-4 cursor-help ${colors[status]}`} />
    </Tooltip>
  );
}

// Complex tooltip with custom styling
interface ComplexTooltipProps {
  title: string;
  description: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  maxWidth?: string;
}

export function ComplexTooltip({
  title,
  description,
  children,
  position = 'top',
  className = '',
  maxWidth = 'max-w-sm',
}: ComplexTooltipProps) {
  const [show, setShow] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <Transition
        show={show}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 transform scale-95"
        enterTo="opacity-100 transform scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 transform scale-100"
        leaveTo="opacity-0 transform scale-95"
      >
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div
            className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 ${maxWidth}`}
          >
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{title}</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
          </div>
        </div>
      </Transition>
    </div>
  );
}

// Field tooltip for form inputs
interface FieldTooltipProps {
  label: string;
  description: string;
  required?: boolean;
  example?: string;
  children: React.ReactNode;
  className?: string;
}

export function FieldTooltip({
  label,
  description,
  required = false,
  example,
  children,
  className = '',
}: FieldTooltipProps) {
  const tooltipContent = (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <span className="font-medium">{label}</span>
        {required && <span className="text-red-400 text-xs">*</span>}
      </div>
      <p className="text-sm">{description}</p>
      {example && (
        <div className="bg-gray-800 dark:bg-gray-600 rounded px-2 py-1">
          <span className="text-xs text-gray-300">Example: {example}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        <span>{children}</span>
        <HelpTooltip content={tooltipContent} position="right" />
      </div>
    </div>
  );
}
