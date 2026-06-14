const NodeCache = require("node-cache");

/**
 * In-memory cache with TTL
 * Perfect for: feed data, user profiles, announcements, dashboard stats
 *
 * For 500+ users on a single server, this is enough.
 * For multi-server deployments, swap to Redis.
 */
const cache = new NodeCache({
  stdTTL: 60, // Default 60 seconds
  checkperiod: 120, // Cleanup expired keys every 2 minutes
  useClones: false, // Don't clone (faster, but values must not be mutated)
});

/**
 * Wrapper to get-or-set cache values
 *
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in seconds
 * @param {Function} fetcher - Async function to fetch if cache miss
 */
const remember = async (key, ttl, fetcher) => {
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const fresh = await fetcher();
  cache.set(key, fresh, ttl);
  return fresh;
};

/**
 * Invalidate cache by key or pattern
 */
const invalidate = (keyOrPattern) => {
  if (keyOrPattern.includes("*")) {
    // Pattern-based invalidation
    const pattern = keyOrPattern.replace(/\*/g, "");
    const keys = cache.keys().filter((k) => k.includes(pattern));
    cache.del(keys);
  } else {
    cache.del(keyOrPattern);
  }
};

/**
 * Clear all cache
 */
const flush = () => cache.flushAll();

/**
 * Cache stats (useful for monitoring)
 */
const stats = () => cache.getStats();

module.exports = {
  cache,
  remember,
  invalidate,
  flush,
  stats,
};
