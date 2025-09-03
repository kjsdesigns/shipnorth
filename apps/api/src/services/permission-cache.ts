// Performance caching for CASL rules (5-minute TTL)
// This implements the performance requirements from the original sprint

interface CacheEntry {
  rules: any[];
  availablePortals: string[];
  currentPortal: string;
  timestamp: number;
  userId: string;
}

class PermissionCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  set(userId: string, data: Omit<CacheEntry, 'timestamp' | 'userId'>) {
    this.cache.set(userId, {
      ...data,
      timestamp: Date.now(),
      userId
    });
    
    // Clean up expired entries every time we add (simple cleanup)
    this.cleanup();
  }

  get(userId: string): Omit<CacheEntry, 'timestamp' | 'userId'> | null {
    const entry = this.cache.get(userId);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(userId);
      return null;
    }
    
    return {
      rules: entry.rules,
      availablePortals: entry.availablePortals,
      currentPortal: entry.currentPortal
    };
  }

  invalidate(userId: string) {
    this.cache.delete(userId);
  }

  private cleanup() {
    const now = Date.now();
    for (const [userId, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(userId);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([userId, entry]) => ({
        userId,
        age: Math.round((Date.now() - entry.timestamp) / 1000),
        rules: entry.rules.length
      }))
    };
  }
}

export const permissionCache = new PermissionCache();