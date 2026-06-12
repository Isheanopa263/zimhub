require("dotenv").config();
const { pool } = require("./database");

async function reset() {
  const client = await pool.connect();

  try {
    console.log("⚠️  Resetting database — dropping all tables...");

    await client.query(`
      DROP TABLE IF EXISTS 
        announcements,
        notifications,
        notices,
        comments,
        likes,
        post_links,
        post_text_posts,
        post_images,
        post_videos,
        posts,
        user_sessions,
        profiles,
        users
      CASCADE;
      
      DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
    `);

    console.log("✅ All tables dropped");
    console.log("👉 Now run: npm run migrate:fresh");
  } catch (error) {
    console.error("❌ Reset failed:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

reset();
