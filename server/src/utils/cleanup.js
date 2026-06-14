const cron = require("node-cron");
const { query } = require("../config/database");
const { deleteFile } = require("./storage");

const RETENTION_DAYS = parseInt(process.env.POST_RETENTION_DAYS) || 7;

/**
 * Delete posts older than RETENTION_DAYS along with all their media files
 */
const cleanupOldPosts = async () => {
  try {
    const startTime = Date.now();

    // Get media files about to be deleted (for filesystem cleanup)
    const mediaResult = await query(
      `SELECT
         pi.image_url,
         pv.video_url,
         pv.thumbnail_url
       FROM posts p
       LEFT JOIN post_images pi ON pi.post_id = p.id
       LEFT JOIN post_videos pv ON pv.post_id = p.id
       WHERE p.created_at < NOW() - INTERVAL '${RETENTION_DAYS} days'`,
    );

    // Delete the actual files from disk
    let filesDeleted = 0;
    for (const row of mediaResult.rows) {
      if (row.image_url) {
        deleteFile(row.image_url, "images");
        filesDeleted++;
      }
      if (row.video_url) {
        deleteFile(row.video_url, "videos");
        filesDeleted++;
      }
      if (row.thumbnail_url) {
        deleteFile(row.thumbnail_url, "videos");
        filesDeleted++;
      }
    }

    // Delete the post records (cascades to images, videos, text, links, likes, comments)
    const result = await query(
      `DELETE FROM posts
       WHERE created_at < NOW() - INTERVAL '${RETENTION_DAYS} days'
       RETURNING id`,
    );

    const duration = Date.now() - startTime;
    console.log(
      `🧹 Cleanup: ${result.rowCount} posts and ${filesDeleted} files deleted (${duration}ms)`,
    );

    return { postsDeleted: result.rowCount, filesDeleted };
  } catch (error) {
    console.error("❌ Post cleanup failed:", error.message);
    return { postsDeleted: 0, filesDeleted: 0 };
  }
};

/**
 * Delete expired OTPs
 */
const cleanupExpiredOTPs = async () => {
  try {
    const result = await query(
      `DELETE FROM otp_codes WHERE expires_at < NOW() - INTERVAL '1 hour'`,
    );
    if (result.rowCount > 0) {
      console.log(`🧹 Cleanup: ${result.rowCount} expired OTPs removed`);
    }
    return result.rowCount;
  } catch {
    return 0;
  }
};

/**
 * Delete expired refresh tokens
 */
const cleanupExpiredSessions = async () => {
  try {
    const result = await query(
      `DELETE FROM user_sessions WHERE expires_at < NOW()`,
    );
    if (result.rowCount > 0) {
      console.log(`🧹 Cleanup: ${result.rowCount} expired sessions removed`);
    }
    return result.rowCount;
  } catch {
    return 0;
  }
};

/**
 * Clean up orphaned notifications older than 30 days
 */
const cleanupOldNotifications = async () => {
  try {
    const result = await query(
      `DELETE FROM notifications
       WHERE created_at < NOW() - INTERVAL '30 days'`,
    );
    if (result.rowCount > 0) {
      console.log(`🧹 Cleanup: ${result.rowCount} old notifications removed`);
    }
    return result.rowCount;
  } catch {
    return 0;
  }
};

/**
 * Run all cleanup tasks
 */
const runAllCleanup = async () => {
  await Promise.all([
    cleanupOldPosts(),
    cleanupExpiredOTPs(),
    cleanupExpiredSessions(),
    cleanupOldNotifications(),
  ]);
};

/**
 * Initialize cron jobs
 */
const initCleanupJobs = () => {
  // Run cleanup daily at 3:00 AM (server time)
  cron.schedule("0 3 * * *", async () => {
    console.log("🧹 Starting scheduled cleanup...");
    await runAllCleanup();
  });

  // Run OTP cleanup every hour (lightweight)
  cron.schedule("0 * * * *", cleanupExpiredOTPs);

  console.log(
    `✅ Cleanup scheduled — posts deleted after ${RETENTION_DAYS} days`,
  );
};

module.exports = {
  cleanupOldPosts,
  cleanupExpiredOTPs,
  cleanupExpiredSessions,
  cleanupOldNotifications,
  runAllCleanup,
  initCleanupJobs,
};
