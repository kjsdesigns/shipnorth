'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import ModernLayout from '@/components/ModernLayout';
import {
  SearchAPI,
  SearchResult,
  SearchResponse,
  highlightText,
  getResultIcon,
  getResultTypeColor,
  getResultURL,
} from '@/lib/search';
import { authAPI } from '@/lib/api';

const CATEGORY_LABELS = {
  packages: 'Packages',
  customers: 'Customers',
  loads: 'Loads',
  users: 'Users',
  documentation: 'Documentation',
};

const CATEGORY_ICONS = {
  packages: '📦',
  customers: '👤',
  loads: '🚛',
  users: '👨‍💼',
  documentation: '📄',
};

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const RESULTS_PER_PAGE = 20;
  const availableCategories = getAvailableCategories(user?.role);

  // Initialize from URL params
  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);

    const urlQuery = searchParams.get('q');
    const urlCategories = searchParams.get('categories');
    const urlPage = searchParams.get('page');

    if (urlQuery) {
      setQuery(urlQuery);
      if (urlCategories) {
        setSelectedCategories(urlCategories.split(','));
      }
      if (urlPage) {
        setCurrentPage(parseInt(urlPage) || 1);
      }
      performSearch(urlQuery, urlCategories?.split(',') || [], parseInt(urlPage || '1') || 1);
    }
  }, [searchParams, router]);

  // Update URL when search params change
  const updateURL = useCallback((newQuery: string, newCategories: string[], newPage: number) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newCategories.length > 0) params.set('categories', newCategories.join(','));
    if (newPage > 1) params.set('page', newPage.toString());

    const url = `/search${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', url);
  }, []);

  // Perform search
  const performSearch = async (searchQuery: string, cats: string[], page: number) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotalCount(0);
      setCategories({});
      setHasSearched(false);
      return;
    }

    try {
      setIsLoading(true);
      setHasSearched(true);

      const response = await SearchAPI.search({
        query: searchQuery,
        categories: cats.length > 0 ? cats : availableCategories,
        limit: RESULTS_PER_PAGE,
        offset: (page - 1) * RESULTS_PER_PAGE,
      });

      setResults(response.results);
      setTotalCount(response.totalCount);
      setCategories(response.categories);

      updateURL(searchQuery, cats, page);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalCount(0);
      setCategories({});
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    performSearch(query, selectedCategories, 1);
  };

  // Handle category filter change
  const handleCategoryChange = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    setSelectedCategories(newCategories);
    setCurrentPage(1);

    if (query.trim()) {
      performSearch(query, newCategories, 1);
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    performSearch(query, selectedCategories, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(totalCount / RESULTS_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <ModernLayout role={user.role}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Global Search</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Search across packages, customers, loads, and more
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search packages, customers, loads..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-3 pl-10 pr-4 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>

        {/* Category Filters */}
        {availableCategories.length > 1 && (
          <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Filter by category:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategories.includes(category)
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <span>{CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}</span>
                  <span>{CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}</span>
                  {categories[category] > 0 && (
                    <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                      {categories[category]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Searching...</span>
          </div>
        ) : hasSearched && results.length > 0 ? (
          <>
            {/* Results summary */}
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                Found {totalCount.toLocaleString()} result{totalCount !== 1 ? 's' : ''} for "{query}
                "
                {selectedCategories.length > 0 && (
                  <span className="ml-1">
                    in{' '}
                    {selectedCategories
                      .map((c) => CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS])
                      .join(', ')}
                  </span>
                )}
              </p>
            </div>

            {/* Results list */}
            <div className="space-y-4 mb-8">
              {results.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 text-2xl">{getResultIcon(result.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          href={getResultURL(result, user.role)}
                          className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <span
                            dangerouslySetInnerHTML={{
                              __html: highlightText(result.title, query),
                            }}
                          />
                        </Link>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${getResultTypeColor(result.type)}`}
                        >
                          {result.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          Score: {result.relevanceScore}
                        </span>
                      </div>

                      {result.subtitle && (
                        <p
                          className="text-sm text-gray-600 dark:text-gray-400 mb-2"
                          dangerouslySetInnerHTML={{
                            __html: highlightText(result.subtitle, query),
                          }}
                        />
                      )}

                      {result.description && (
                        <p
                          className="text-sm text-gray-500 dark:text-gray-500 mb-3"
                          dangerouslySetInnerHTML={{
                            __html: highlightText(result.description, query),
                          }}
                        />
                      )}

                      {result.matchedFields.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          <span className="text-xs text-gray-500 mr-2">Matched fields:</span>
                          {result.matchedFields.map((field) => (
                            <span
                              key={field}
                              className="rounded bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-400"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      )}

                      <Link
                        href={getResultURL(result, user.role)}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        View details
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({(currentPage - 1) * RESULTS_PER_PAGE + 1}-
                    {Math.min(currentPage * RESULTS_PER_PAGE, totalCount)} of{' '}
                    {totalCount.toLocaleString()})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPrevPage}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNextPage}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : hasSearched && results.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
              No results found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Try adjusting your search terms or category filters
            </p>
            <div className="text-sm text-gray-400">
              <p>Search tips:</p>
              <ul className="mt-2 space-y-1">
                <li>• Try different keywords or synonyms</li>
                <li>• Check for typos in your search query</li>
                <li>• Use broader terms or remove category filters</li>
                <li>• Search for partial matches (e.g., "john" instead of "johnson")</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
              Start searching
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Enter a search term to find packages, customers, loads, and more
            </p>
          </div>
        )}
      </div>
    </ModernLayout>
  );
}

function getAvailableCategories(role?: string): string[] {
  switch (role) {
    case 'admin':
      return ['packages', 'customers', 'loads', 'users'];
    case 'staff':
      return ['packages', 'customers', 'loads'];
    case 'driver':
      return ['loads', 'packages'];
    case 'customer':
      return ['packages'];
    default:
      return ['packages', 'customers', 'loads'];
  }
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <ModernLayout role="staff">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </ModernLayout>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
