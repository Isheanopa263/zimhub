const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,

  // Tuned for 500+ concurrent users
  max: 50, // Max connections (was 20)
  min: 5, // Keep min connections warm
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Increased from 2s

  // Statement timeout — kill slow queries
  statement_timeout: 30000, // 30 seconds

  // Application name for monitoring
  application_name: "zimhub-api",
});

pool.on("error", (err) => {
  console.error("❌ Database error:", err.message);
});

const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error("❌ Query error:", error.message);
    throw error;
  }
};

const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
