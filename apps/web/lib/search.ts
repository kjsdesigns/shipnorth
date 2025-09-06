export interface SearchResult {
  id: string;
  type: 'package' | 'customer' | 'load' | 'user' | 'documentation';
  title: string;
  subtitle?: string;
  description?: string;
  relevanceScore: number;
  matchedFields: string[];
  data: any;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  categories: {
    packages: number;
    customers: number;
    loads: number;
    users: number;
    documentation: number;
  };
  query: string;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface SearchOptions {
  query: string;
  categories?: string[];
  limit?: number;
  offset?: number;
}

export class SearchAPI {
  private static baseURL =
    process.env.NODE_ENV === 'production' ? 'https://api.shipnorth.com' : '/api'; // Use Next.js API proxy for same-origin session cookie support

  /**
   * Perform global search across all entities
   */
  static async search(options: SearchOptions): Promise<SearchResponse> {
    const { query, categories, limit = 20, offset = 0 } = options;

    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (categories && categories.length > 0) {
      params.append('categories', categories.join(','));
    }

    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/search?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Search failed');
    }

    return await response.json();
  }

  /**
   * Get quick search suggestions (top 5 results)
   */
  static async getSuggestions(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const params = new URLSearchParams({ q: query });
    const token = this.getAuthToken();

    if (!token) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseURL}/search/suggestions?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Suggestions request failed:', response.status);
        return [];
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  }

  /**
   * Search specific category
   */
  static async searchCategory(
    category: string,
    query: string,
    limit = 20
  ): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/search/${category}?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `${category} search failed`);
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Get auth token from localStorage
   */
  private static getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }
}

/**
 * Highlight matching text in search results
 */
export function highlightText(text: string, query: string): string {
  if (!query || !text) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
}

/**
 * Get result type icon
 */
export function getResultIcon(type: string): string {
  switch (type) {
    case 'package':
      return '📦';
    case 'customer':
      return '👤';
    case 'load':
      return '🚛';
    case 'user':
      return '👨‍💼';
    case 'documentation':
      return '📄';
    default:
      return '🔍';
  }
}

/**
 * Get result type color
 */
export function getResultTypeColor(type: string): string {
  switch (type) {
    case 'package':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    case 'customer':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    case 'load':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
    case 'user':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
    case 'documentation':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  }
}

/**
 * Get navigation URL for search result
 */
export function getResultURL(result: SearchResult, userRole: string): string {
  const { type, id } = result;

  switch (type) {
    case 'package':
      return `/${userRole}/packages?id=${id}`;
    case 'customer':
      if (['admin', 'staff'].includes(userRole)) {
        return `/${userRole}/customers?id=${id}`;
      }
      return `/${userRole}/packages`; // Customers see their packages
    case 'load':
      return `/${userRole}/loads?id=${id}`;
    case 'user':
      if (userRole === 'admin') {
        return `/admin/staff?id=${id}`;
      }
      return `/${userRole}`;
    default:
      return `/${userRole}`;
  }
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
}

/**
 * Cache for recent searches
 */
class SearchCache {
  private cache = new Map<string, { results: SearchResult[]; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  set(query: string, results: SearchResult[]): void {
    this.cache.set(query.toLowerCase(), {
      results,
      timestamp: Date.now(),
    });
  }

  get(query: string): SearchResult[] | null {
    const entry = this.cache.get(query.toLowerCase());
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(query.toLowerCase());
      return null;
    }

    return entry.results;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const searchCache = new SearchCache();
