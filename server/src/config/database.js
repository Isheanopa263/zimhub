const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  // Connection pool settings optimized for ~500 users
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on("connect", () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("✅ Database connected");
  }
});

pool.on("error", (err) => {
  console.error("❌ Unexpected database error:", err);
  process.exit(-1);
});

/**
 * Execute a query with optional parameters
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === "development") {
      console.log("📊 Query executed:", {
        text: text.substring(0, 50),
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }
    return result;
  } catch (error) {
    console.error("❌ Query error:", { text, error: error.message });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
