'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  FileText,
  Code,
  Users,
  History,
  ChevronRight,
  Command,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  section: 'api' | 'business' | 'changes' | 'overview';
  url: string;
  content?: string;
  type: 'page' | 'section' | 'endpoint' | 'workflow';
}

interface DocsSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocsSearch({ isOpen, onClose }: DocsSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Mock search data - in a real implementation, this would come from an index
  const searchData: SearchResult[] = [
    {
      id: 'api-overview',
      title: 'API Reference',
      description: 'Complete API documentation with interactive examples',
      section: 'api',
      url: '/docs/api',
      type: 'page',
      content: 'API documentation authentication endpoints interactive swagger openapi',
    },
    {
      id: 'api-auth',
      title: 'Authentication',
      description: 'User login and token management',
      section: 'api',
      url: '/docs/api#authentication',
      type: 'section',
      content: 'login register jwt tokens access refresh bearer authorization',
    },
    {
      id: 'api-customers',
      title: 'Customer Endpoints',
      description: 'Manage customer accounts and information',
      section: 'api',
      url: '/docs/api#customers',
      type: 'section',
      content: 'customers create update list get customer management accounts',
    },
    {
      id: 'api-packages',
      title: 'Package Endpoints',
      description: 'Package management and shipping operations',
      section: 'api',
      url: '/docs/api#packages',
      type: 'section',
      content: 'packages shipping labels rates quotes purchase tracking status',
    },
    {
      id: 'api-loads',
      title: 'Load Endpoints',
      description: 'Load planning and management for deliveries',
      section: 'api',
      url: '/docs/api#loads',
      type: 'section',
      content: 'loads delivery truck planning manifest assignment gps tracking',
    },
    {
      id: 'api-invoices',
      title: 'Invoice Endpoints',
      description: 'Invoice and payment management',
      section: 'api',
      url: '/docs/api#invoices',
      type: 'section',
      content: 'invoices payments billing retry refund stripe processing',
    },
    {
      id: 'business-overview',
      title: 'Business Documentation',
      description: 'Workflows, processes, and user guides',
      section: 'business',
      url: '/docs/business',
      type: 'page',
      content: 'business workflows processes user guides roles permissions',
    },
    {
      id: 'business-roles',
      title: 'User Roles & Permissions',
      description: 'Different user types and their access levels',
      section: 'business',
      url: '/docs/business#roles',
      type: 'section',
      content: 'roles permissions staff admin customer driver access control',
    },
    {
      id: 'business-package-workflow',
      title: 'Package Intake & Labeling',
      description: 'Complete workflow from package receipt to shipping',
      section: 'business',
      url: '/docs/business#package-workflow',
      type: 'workflow',
      content:
        'package intake registration address validation rate shopping label purchase payment',
    },
    {
      id: 'business-payments',
      title: 'Payment Processing',
      description: 'How payments are handled from charge to completion',
      section: 'business',
      url: '/docs/business#payments',
      type: 'workflow',
      content: 'payment processing stripe charging refunds failed payments retry',
    },
    {
      id: 'business-load-planning',
      title: 'Load Planning & Delivery',
      description: 'Optimizing package grouping and delivery routing',
      section: 'business',
      url: '/docs/business#load-planning',
      type: 'workflow',
      content: 'load planning ai optimization manual review driver assignment delivery',
    },
    {
      id: 'business-tracking',
      title: 'Tracking & Delivery',
      description: 'Real-time tracking and delivery confirmation',
      section: 'business',
      url: '/docs/business#tracking',
      type: 'workflow',
      content: 'tracking delivery gps updates status polling notifications confirmation',
    },
    {
      id: 'changes-overview',
      title: 'Change History',
      description: 'Track feature rollouts and implementation dates',
      section: 'changes',
      url: '/docs/changes',
      type: 'page',
      content: 'change history releases versions features enhancements bugfixes',
    },
    {
      id: 'login-endpoint',
      title: 'POST /auth/login',
      description: 'Authenticate a user and receive access/refresh tokens',
      section: 'api',
      url: '/docs/api#authentication',
      type: 'endpoint',
      content: 'login authentication credentials email password tokens jwt access refresh',
    },
    {
      id: 'register-endpoint',
      title: 'POST /auth/register',
      description: 'Create a new customer account',
      section: 'api',
      url: '/docs/api#authentication',
      type: 'endpoint',
      content: 'register customer account creation signup new user',
    },
    {
      id: 'create-package-endpoint',
      title: 'POST /packages',
      description: 'Create a new package for shipping',
      section: 'api',
      url: '/docs/api#packages',
      type: 'endpoint',
      content: 'create package new shipping dimensions weight value address',
    },
    {
      id: 'quote-rates-endpoint',
      title: 'POST /packages/{id}/quote',
      description: 'Get shipping rate quotes from available carriers',
      section: 'api',
      url: '/docs/api#packages',
      type: 'endpoint',
      content: 'quote rates shipping carriers ups fedex pricing estimates',
    },
  ];

  const sectionIcons = {
    api: Code,
    business: Users,
    changes: History,
    overview: FileText,
  };

  const sectionLabels = {
    api: 'API Reference',
    business: 'Business Docs',
    changes: 'Change History',
    overview: 'Overview',
  };

  const typeLabels = {
    page: 'Page',
    section: 'Section',
    endpoint: 'API Endpoint',
    workflow: 'Workflow',
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    // Simulate search delay
    const timeoutId = setTimeout(() => {
      const searchTerms = query
        .toLowerCase()
        .split(' ')
        .filter((term) => term.length > 1);

      const filteredResults = searchData
        .filter((item) => {
          const searchableContent =
            `${item.title} ${item.description} ${item.content || ''}`.toLowerCase();
          return searchTerms.some((term) => searchableContent.includes(term));
        })
        .sort((a, b) => {
          // Prioritize exact title matches
          const aTitle = a.title.toLowerCase();
          const bTitle = b.title.toLowerCase();
          const queryLower = query.toLowerCase();

          if (aTitle.includes(queryLower) && !bTitle.includes(queryLower)) return -1;
          if (!aTitle.includes(queryLower) && bTitle.includes(queryLower)) return 1;

          // Then by relevance score
          const aScore = searchTerms.reduce((score, term) => {
            const content = `${a.title} ${a.description} ${a.content || ''}`.toLowerCase();
            return score + (content.split(term).length - 1);
          }, 0);

          const bScore = searchTerms.reduce((score, term) => {
            const content = `${b.title} ${b.description} ${b.content || ''}`.toLowerCase();
            return score + (content.split(term).length - 1);
          }, 0);

          return bScore - aScore;
        })
        .slice(0, 8);

      setResults(filteredResults);
      setSelectedIndex(0);
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      window.location.href = results[selectedIndex].url;
      onClose();
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(
      `(${query
        .split(' ')
        .filter((t) => t.length > 1)
        .join('|')})`,
      'gi'
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-800 text-gray-900 dark:text-yellow-200 px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-start justify-center p-4 sm:p-6 lg:p-8">
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl transition-all border border-gray-200 dark:border-gray-700">
          {/* Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search documentation..."
              className="w-full border-0 bg-transparent py-4 pl-12 pr-12 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 text-lg"
            />
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Results */}
          {query && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">Searching...</span>
                </div>
              ) : results.length > 0 ? (
                <div ref={resultsRef} className="max-h-96 overflow-y-auto">
                  {results.map((result, index) => {
                    const Icon = sectionIcons[result.section];
                    return (
                      <Link
                        key={result.id}
                        href={result.url}
                        onClick={onClose}
                        className={`flex items-start space-x-3 p-4 transition-colors ${
                          index === selectedIndex
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            result.section === 'api'
                              ? 'bg-blue-100 dark:bg-blue-900/20'
                              : result.section === 'business'
                                ? 'bg-green-100 dark:bg-green-900/20'
                                : result.section === 'changes'
                                  ? 'bg-purple-100 dark:bg-purple-900/20'
                                  : 'bg-gray-100 dark:bg-gray-700'
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${
                              result.section === 'api'
                                ? 'text-blue-600 dark:text-blue-400'
                                : result.section === 'business'
                                  ? 'text-green-600 dark:text-green-400'
                                  : result.section === 'changes'
                                    ? 'text-purple-600 dark:text-purple-400'
                                    : 'text-gray-600 dark:text-gray-400'
                            }`}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {highlightText(result.title, query)}
                            </h3>
                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded text-xs font-medium flex-shrink-0">
                              {typeLabels[result.type]}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {highlightText(result.description, query)}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{sectionLabels[result.section]}</span>
                            <ChevronRight className="h-3 w-3 mx-1" />
                            <span className="truncate">{result.url}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Search className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No results found for "{query}"</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Try different keywords or check spelling
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          {!query && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Search across all documentation</span>
                <div className="flex items-center space-x-2">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                    ↑↓
                  </kbd>
                  <span>navigate</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                    ↵
                  </kbd>
                  <span>select</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                    esc
                  </kbd>
                  <span>close</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
