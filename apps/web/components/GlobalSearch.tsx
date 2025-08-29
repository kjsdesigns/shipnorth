'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Command, ArrowUp, ArrowDown, CornerDownLeft, Loader2 } from 'lucide-react';
import {
  SearchAPI,
  SearchResult,
  debounce,
  highlightText,
  getResultIcon,
  getResultTypeColor,
  getResultURL,
} from '@/lib/search';

interface GlobalSearchProps {
  userRole: string;
  className?: string;
}

export default function GlobalSearch({ userRole, className = '' }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const suggestions = await SearchAPI.getSuggestions(searchQuery);
        setResults(suggestions);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (value.trim()) {
      setIsOpen(true);
      debouncedSearch(value);
    } else {
      setIsOpen(false);
      setResults([]);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        // Navigate to full search results
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          const result = results[selectedIndex];
          const url = getResultURL(result, userRole);
          router.push(url);
          setIsOpen(false);
          inputRef.current?.blur();
        } else if (query.trim()) {
          // Navigate to full search results
          router.push(`/search?q=${encodeURIComponent(query)}`);
          setIsOpen(false);
          inputRef.current?.blur();
        }
        break;

      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    const url = getResultURL(result, userRole);
    router.push(url);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Global keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="search"
          placeholder="Search packages, customers, loads..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim() && results.length > 0) {
              setIsOpen(true);
            }
          }}
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-10 pr-20 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-400">
          <kbd className="inline-flex items-center rounded border border-gray-200 dark:border-gray-700 px-1 font-mono">
            <Command className="h-3 w-3" />
          </kbd>
          <span>K</span>
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="max-h-80 overflow-y-auto">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className={`flex w-full items-start gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 text-lg">{getResultIcon(result.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className="text-sm font-medium text-gray-900 dark:text-gray-100"
                          dangerouslySetInnerHTML={{
                            __html: highlightText(result.title, query),
                          }}
                        />
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getResultTypeColor(result.type)}`}
                        >
                          {result.type}
                        </span>
                      </div>
                      {result.subtitle && (
                        <p
                          className="text-xs text-gray-600 dark:text-gray-400"
                          dangerouslySetInnerHTML={{
                            __html: highlightText(result.subtitle, query),
                          }}
                        />
                      )}
                      {result.description && (
                        <p
                          className="text-xs text-gray-500 dark:text-gray-500 mt-1"
                          dangerouslySetInnerHTML={{
                            __html: highlightText(result.description, query),
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-shrink-0 text-gray-400">
                      <CornerDownLeft className="h-4 w-4" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Footer with more results link */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                <button
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                    setIsOpen(false);
                    inputRef.current?.blur();
                  }}
                  className="flex w-full items-center justify-between text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <span>View all results</span>
                  <div className="flex items-center gap-1">
                    <kbd className="inline-flex items-center rounded border border-gray-200 dark:border-gray-700 px-1 font-mono text-xs">
                      <CornerDownLeft className="h-3 w-3" />
                    </kbd>
                  </div>
                </button>
              </div>
            </>
          ) : query.trim() ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
