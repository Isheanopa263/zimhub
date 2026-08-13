const NodeCache = require("node-cache");
const { isReady, getClient } = require("../config/redis");

/* ─── Fallback in-memory cache ─── */
const memoryCache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120,
  useClones: false,
});

/* ─── Helper: check if Redis is available ─── */
const useRedis = () => isReady();

/* ─── Get value from cache ─── */
const get = async (key) => {
  if (useRedis()) {
    try {
      const raw = await getClient().get(key);
      return raw ? JSON.parse(raw) : undefined;
    } catch (err) {
      console.error("Redis get error:", err.message);
      return memoryCache.get(key);
    }
  }
  return memoryCache.get(key);
};

/* ─── Set value in cache ─── */
const set = async (key, value, ttl = 60) => {
  if (useRedis()) {
    try {
      await getClient().set(key, JSON.stringify(value), "EX", ttl);
      return true;
    } catch (err) {
      console.error("Redis set error:", err.message);
      return memoryCache.set(key, value, ttl);
    }
  }
  return memoryCache.set(key, value, ttl);
};

/* ─── Delete key(s) from cache ─── */
const del = async (key) => {
  if (useRedis()) {
    try {
      await getClient().del(key);
    } catch (err) {
      console.error("Redis del error:", err.message);
    }
  }
  memoryCache.del(key);
};

/* ─── Remember (get or set) ─── */
const remember = async (key, ttl, fetcher) => {
  const cached = await get(key);
  if (cached !== undefined && cached !== null) {
    return cached;
  }

  const fresh = await fetcher();
  await set(key, fresh, ttl);
  return fresh;
};

/* ─── Invalidate by key or pattern ─── */
const invalidate = async (keyOrPattern) => {
  if (keyOrPattern.includes("*")) {
    const pattern = keyOrPattern.replace(/\*/g, "");

    if (useRedis()) {
      try {
        const prefix = process.env.REDIS_KEY_PREFIX || "zimhub:";
        const searchPattern = `${prefix}*${pattern}*`;

        // Use SCAN to safely find keys matching pattern
        const stream = getClient().scanStream({
          match: searchPattern,
          count: 100,
        });

        const keysToDelete = [];
        stream.on("data", (keys) => {
          if (keys.length) {
            // Strip prefix since ioredis adds it automatically on del
            const cleaned = keys.map((k) =>
              k.startsWith(prefix) ? k.slice(prefix.length) : k,
            );
            keysToDelete.push(...cleaned);
          }
        });

        await new Promise((resolve, reject) => {
          stream.on("end", resolve);
          stream.on("error", reject);
        });

        if (keysToDelete.length > 0) {
          await getClient().del(...keysToDelete);
        }
      } catch (err) {
        console.error("Redis pattern invalidate error:", err.message);
      }
    }

    // Also invalidate memory cache
    const memoryKeys = memoryCache.keys().filter((k) => k.includes(pattern));
    memoryCache.del(memoryKeys);
  } else {
    await del(keyOrPattern);
  }
};

/* ─── Clear all cache ─── */
const flush = async () => {
  if (useRedis()) {
    try {
      const prefix = process.env.REDIS_KEY_PREFIX || "zimhub:";
      const stream = getClient().scanStream({
        match: `${prefix}*`,
        count: 100,
      });

      const keysToDelete = [];
      stream.on("data", (keys) => {
        if (keys.length) {
          const cleaned = keys.map((k) =>
            k.startsWith(prefix) ? k.slice(prefix.length) : k,
          );
          keysToDelete.push(...cleaned);
        }
      });

      await new Promise((resolve, reject) => {
        stream.on("end", resolve);
        stream.on("error", reject);
      });

      if (keysToDelete.length > 0) {
        await getClient().del(...keysToDelete);
      }
    } catch (err) {
      console.error("Redis flush error:", err.message);
    }
  }
  memoryCache.flushAll();
};

/* ─── Get cache stats ─── */
const getStats = async () => {
  const memory = memoryCache.getStats();
  const memoryKeys = memoryCache.keys().length;

  const stats = {
    backend: useRedis() ? "redis" : "memory",
    connected: useRedis(),
    memory: {
      keys: memoryKeys,
      hits: memory.hits,
      misses: memory.misses,
    },
  };

  if (useRedis()) {
    try {
      const info = await getClient().info("stats");
      const prefix = process.env.REDIS_KEY_PREFIX || "zimhub:";
      const stream = getClient().scanStream({
        match: `${prefix}*`,
        count: 100,
      });

      let redisKeyCount = 0;
      stream.on("data", (keys) => (redisKeyCount += keys.length));
      await new Promise((resolve, reject) => {
        stream.on("end", resolve);
        stream.on("error", reject);
      });

      stats.redis = {
        keys: redisKeyCount,
        connected: true,
      };

      // Parse hits/misses from Redis INFO
      const hitsMatch = info.match(/keyspace_hits:(\d+)/);
      const missesMatch = info.match(/keyspace_misses:(\d+)/);
      if (hitsMatch) stats.redis.hits = parseInt(hitsMatch[1]);
      if (missesMatch) stats.redis.misses = parseInt(missesMatch[1]);
    } catch (err) {
      stats.redis = { connected: false, error: err.message };
    }
  }

  return stats;
};

module.exports = {
  get,
  set,
  del,
  remember,
  invalidate,
  flush,
  getStats,
  // Alias for backwards compatibility
  stats: getStats,
};
