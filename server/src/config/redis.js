const Redis = require("ioredis");

let client = null;
let isConnected = false;

const initRedis = () => {
  const url = process.env.REDIS_URL || "redis://localhost:6379";

  client = new Redis(url, {
    keyPrefix: process.env.REDIS_KEY_PREFIX || "zimhub:",
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        return null; // Stop retrying after 3 attempts
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  client.on("connect", () => {
    isConnected = true;
    console.log("✅ Redis connected");
  });

  client.on("error", (err) => {
    // Only log first error to avoid spam
    if (isConnected) {
      console.error("❌ Redis error:", err.message);
      isConnected = false;
    }
  });

  client.on("close", () => {
    isConnected = false;
  });

  client.on("reconnecting", () => {
    // Silent reconnect attempts
  });

  // Connect
  client.connect().catch(() => {
    console.error("⚠️  Redis unavailable — caching disabled");
    isConnected = false;
  });
};

initRedis();

/**
 * Check if Redis is connected
 */
const isReady = () => isConnected && client?.status === "ready";

/**
 * Get the raw client
 */
const getClient = () => client;

module.exports = { initRedis, isReady, getClient };
