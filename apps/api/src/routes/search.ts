import express from 'express';
import { SearchService } from '../services/search';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * Global search endpoint
 * GET /api/search?q=query&categories=packages,customers&limit=20&offset=0
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { q: query, categories, limit, offset } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query parameter "q" is required and must be a non-empty string',
      });
    }

    // Parse categories
    let categoryList: string[] | undefined;
    if (categories && typeof categories === 'string') {
      categoryList = categories.split(',').map((c) => c.trim());
    }

    // Parse pagination
    const limitNum = limit && typeof limit === 'string' ? parseInt(limit) : 20;
    const offsetNum = offset && typeof offset === 'string' ? parseInt(offset) : 0;

    // Validate pagination
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: 'Limit must be a number between 1 and 100',
      });
    }

    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        error: 'Offset must be a non-negative number',
      });
    }

    // Filter categories based on user role
    const userRole = req.user?.role;
    const allowedCategories = getAllowedCategories(userRole);

    if (categoryList) {
      categoryList = categoryList.filter((cat) => allowedCategories.includes(cat));
    } else {
      categoryList = allowedCategories;
    }

    const searchResults = await SearchService.search({
      query: query.toString(),
      categories: categoryList,
      limit: limitNum,
      offset: offsetNum,
    });

    res.json({
      success: true,
      ...searchResults,
      query: query,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < searchResults.totalCount,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Internal server error during search',
      success: false,
    });
  }
});

/**
 * Quick search suggestions endpoint
 * GET /api/search/suggestions?q=query
 */
router.get('/suggestions', authenticate, async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.json({
        success: true,
        results: [],
        query: '',
      });
    }

    const suggestions = await SearchService.getQuickSuggestions(query.toString(), req.user?.role);

    res.json({
      success: true,
      results: suggestions,
      query: query,
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      error: 'Internal server error during suggestions',
      success: false,
    });
  }
});

/**
 * Search specific category
 * GET /api/search/packages?q=query
 * GET /api/search/customers?q=query
 * GET /api/search/loads?q=query
 * GET /api/search/users?q=query
 */
router.get('/packages', authenticate, async (req, res) => {
  try {
    const { q: query, limit } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query parameter "q" is required',
      });
    }

    const limitNum = limit && typeof limit === 'string' ? parseInt(limit) : 20;

    const results = await SearchService.searchPackages(query.toString());
    const limitedResults = results.slice(0, limitNum);

    res.json({
      success: true,
      results: limitedResults,
      totalCount: results.length,
      query: query,
    });
  } catch (error) {
    console.error('Package search error:', error);
    res.status(500).json({
      error: 'Internal server error during package search',
      success: false,
    });
  }
});

router.get('/customers', authenticate, async (req, res) => {
  try {
    const { q: query, limit } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query parameter "q" is required',
      });
    }

    // Check permission
    if (!['admin', 'staff'].includes(req.user?.role || '')) {
      return res.status(403).json({
        error: 'Insufficient permissions to search customers',
      });
    }

    const limitNum = limit && typeof limit === 'string' ? parseInt(limit) : 20;

    const results = await SearchService.searchCustomers(query.toString());
    const limitedResults = results.slice(0, limitNum);

    res.json({
      success: true,
      results: limitedResults,
      totalCount: results.length,
      query: query,
    });
  } catch (error) {
    console.error('Customer search error:', error);
    res.status(500).json({
      error: 'Internal server error during customer search',
      success: false,
    });
  }
});

router.get('/loads', authenticate, async (req, res) => {
  try {
    const { q: query, limit } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query parameter "q" is required',
      });
    }

    const limitNum = limit && typeof limit === 'string' ? parseInt(limit) : 20;

    const results = await SearchService.searchLoads(query.toString());
    const limitedResults = results.slice(0, limitNum);

    res.json({
      success: true,
      results: limitedResults,
      totalCount: results.length,
      query: query,
    });
  } catch (error) {
    console.error('Load search error:', error);
    res.status(500).json({
      error: 'Internal server error during load search',
      success: false,
    });
  }
});

router.get('/users', authenticate, async (req, res) => {
  try {
    const { q: query, limit } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query parameter "q" is required',
      });
    }

    // Only admin can search users
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions to search users',
      });
    }

    const limitNum = limit && typeof limit === 'string' ? parseInt(limit) : 20;

    const results = await SearchService.searchUsers(query.toString());
    const limitedResults = results.slice(0, limitNum);

    res.json({
      success: true,
      results: limitedResults,
      totalCount: results.length,
      query: query,
    });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({
      error: 'Internal server error during user search',
      success: false,
    });
  }
});

/**
 * Get allowed search categories for user role
 */
function getAllowedCategories(role?: string): string[] {
  switch (role) {
    case 'admin':
      return ['packages', 'customers', 'loads', 'users'];
    case 'staff':
      return ['packages', 'customers', 'loads'];
    case 'driver':
      return ['loads', 'packages'];
    case 'customer':
      return ['packages']; // Only their own packages in practice
    default:
      return ['packages', 'customers', 'loads'];
  }
}

export default router;
