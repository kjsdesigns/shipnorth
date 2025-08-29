'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';

export interface ChipOption {
  value: string;
  label: string;
  subtitle?: string;
}

export interface ChipSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  options?: ChipOption[];
  placeholder?: string;
  searchable?: boolean;
  onSearch?: (query: string) => void;
  loading?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  name?: string;
  className?: string;
  maxDisplayOptions?: number;
}

interface ChipSelectorRef {
  focus: () => void;
  blur: () => void;
}

const ChipSelector = forwardRef<ChipSelectorRef, ChipSelectorProps>(
  (
    {
      value = '',
      onChange,
      options = [],
      placeholder = 'Select an option...',
      searchable = true,
      onSearch,
      loading = false,
      disabled = false,
      required = false,
      error,
      name,
      className = '',
      maxDisplayOptions = 6,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredOptions, setFilteredOptions] = useState<ChipOption[]>(options);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
    }));

    // Filter options based on search query
    useEffect(() => {
      if (!searchQuery.trim()) {
        setFilteredOptions(options);
      } else {
        const filtered = options.filter(
          (option) =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            option.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredOptions(filtered);
      }
      setHighlightedIndex(-1);
    }, [searchQuery, options]);

    // Handle search with debounce for API calls
    useEffect(() => {
      if (!onSearch || !searchQuery.trim()) return;

      const timeoutId = setTimeout(() => {
        onSearch(searchQuery);
      }, 300);

      return () => clearTimeout(timeoutId);
    }, [searchQuery, onSearch]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchQuery('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          setIsOpen(true);
          return;
        }
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
          break;

        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex]);
          }
          break;

        case 'Escape':
          setIsOpen(false);
          setSearchQuery('');
          inputRef.current?.blur();
          break;
      }
    };

    const handleSelect = (option: ChipOption) => {
      onChange(option.value);
      setIsOpen(false);
      setSearchQuery('');
      inputRef.current?.blur();
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
      setSearchQuery('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newQuery = e.target.value;
      setSearchQuery(newQuery);
      if (!isOpen) setIsOpen(true);
    };

    const handleInputClick = () => {
      if (!disabled) {
        setIsOpen(true);
        if (filteredOptions.length === 0 && options.length > 0) {
          setFilteredOptions(options);
        }
      }
    };

    const selectedOption = options.find((opt) => opt.value === value);
    const displayValue = isOpen && searchable ? searchQuery : selectedOption?.label || '';

    // Show default options when focused and empty
    const optionsToShow = isOpen
      ? searchQuery.trim()
        ? filteredOptions
        : options.slice(0, maxDisplayOptions)
      : [];

    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <div
          className={`relative w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 cursor-text transition-colors ${
            error
              ? 'border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200 dark:focus-within:ring-red-800'
              : isOpen
                ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:focus-within:ring-blue-800'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleInputClick}
        >
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            name={name}
            className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
            autoComplete="off"
          />

          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            {value && !disabled && !loading && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Searching...
              </div>
            ) : optionsToShow.length > 0 ? (
              <>
                {!searchQuery.trim() && optionsToShow.length === maxDisplayOptions && (
                  <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                    {searchable
                      ? 'Start typing to search...'
                      : `Showing ${maxDisplayOptions} options`}
                  </div>
                )}
                {optionsToShow.map((option, index) => (
                  <div
                    key={option.value}
                    className={`px-3 py-3 cursor-pointer transition-colors ${
                      index === highlightedIndex
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                    } ${value === option.value ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
                    onClick={() => handleSelect(option)}
                    role="option"
                    aria-selected={value === option.value}
                  >
                    <div className="font-medium">{option.label}</div>
                    {option.subtitle && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {option.subtitle}
                      </div>
                    )}
                  </div>
                ))}
              </>
            ) : searchQuery.trim() ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <Search className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No results found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <p className="text-sm">No options available</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

ChipSelector.displayName = 'ChipSelector';

export default ChipSelector;
