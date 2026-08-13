const Redis = require("ioredis");

let client = null;
let isConnected = false;

const initRedis = () => {
  const url = process.env.REDIS_URL;

  if (!url) {
    console.log("ℹ️  No REDIS_URL — using in-memory cache");
    return;
  }

  const isUpstash = url.startsWith("rediss://") || url.includes("upstash");

  const config = {
    keyPrefix: process.env.REDIS_KEY_PREFIX || "zimhub:",
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
    enableOfflineQueue: false,
  };

  // Upstash requires TLS
  if (isUpstash) {
    config.tls = { rejectUnauthorized: false };
  }

  client = new Redis(url, config);

  client.on("connect", () => {
    isConnected = true;
    console.log(`✅ Redis connected (${isUpstash ? "Upstash" : "local"})`);
  });

  client.on("ready", () => {
    isConnected = true;
  });

  client.on("error", (err) => {
    if (isConnected) {
      console.error("❌ Redis error:", err.message);
      isConnected = false;
    }
  });

  client.on("close", () => {
    isConnected = false;
  });

  client.connect().catch((err) => {
    console.error("⚠️  Redis unavailable:", err.message);
    console.log("ℹ️  Falling back to in-memory cache");
    isConnected = false;
  });
};

initRedis();

const isReady = () => isConnected && client?.status === "ready";
const getClient = () => client;

module.exports = { initRedis, isReady, getClient };
