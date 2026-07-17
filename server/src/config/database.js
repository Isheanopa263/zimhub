const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  application_name: "zimhub-api",

  // Force IPv4 to avoid Render's IPv6 issues
  ...(process.env.NODE_ENV === "production" && {
    host: undefined, // Let connectionString handle it
  }),
});

pool.on("error", (err) => {
  console.error("❌ Database error:", err.message);
});

pool.on("connect", () => {
  if (!pool._connected) {
    console.log("✅ Database connected");
    pool._connected = true;
  }
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
