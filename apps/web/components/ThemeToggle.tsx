'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState } from 'react';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const buttons = [
    {
      value: 'light',
      icon: Sun,
      tooltip: 'Light mode',
      description: 'Always use light theme'
    },
    {
      value: 'dark',
      icon: Moon,
      tooltip: 'Dark mode',
      description: 'Always use dark theme'
    },
    {
      value: 'system',
      icon: Monitor,
      tooltip: 'System',
      description: 'Follow system preference'
    }
  ];

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-md border border-gray-200 dark:border-gray-700">
        {buttons.map(({ value, icon: Icon, tooltip, description }) => (
          <div key={value} className="relative">
            <button
              onClick={() => setTheme(value as 'light' | 'dark' | 'system')}
              onMouseEnter={() => setHoveredButton(value)}
              onMouseLeave={() => setHoveredButton(null)}
              className={`p-2 rounded-md transition-all duration-200 ${
                theme === value
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-label={tooltip}
            >
              <Icon className="h-4 w-4" />
            </button>
            
            {/* Enhanced Tooltip - positioned below */}
            {hoveredButton === value && (
              <div className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-2 pointer-events-none">
                <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                  <div className="font-semibold">{tooltip}</div>
                  <div className="text-gray-300 text-[10px] mt-0.5">{description}</div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1">
                    <div className="border-4 border-transparent border-b-gray-900 dark:border-b-gray-700"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}