const cron = require("node-cron");
const { query } = require("../config/database");
const { deleteFile } = require("./storage");

const RETENTION_DAYS = parseInt(process.env.POST_RETENTION_DAYS) || 7;

/**
 * Delete posts older than RETENTION_DAYS + their files
 */
const cleanupOldPosts = async () => {
  try {
    const startTime = Date.now();

    // Find media files attached to old posts
    const mediaResult = await query(
      `SELECT
         p.id AS post_id,
         pi.image_url,
         pv.video_url,
         pv.thumbnail_url
       FROM posts p
       LEFT JOIN post_images pi ON pi.post_id = p.id
       LEFT JOIN post_videos pv ON pv.post_id = p.id
       WHERE p.created_at < NOW() - INTERVAL '${RETENTION_DAYS} days'`,
    );

    if (mediaResult.rows.length === 0) {
      return { postsDeleted: 0, filesDeleted: 0 };
    }

    // Delete files (deduplicated)
    let filesDeleted = 0;
    const processedFiles = new Set();

    for (const row of mediaResult.rows) {
      if (row.image_url && !processedFiles.has(row.image_url)) {
        deleteFile(row.image_url, "images");
        processedFiles.add(row.image_url);
        filesDeleted++;
      }
      if (row.video_url && !processedFiles.has(row.video_url)) {
        deleteFile(row.video_url, "videos");
        processedFiles.add(row.video_url);
        filesDeleted++;
      }
      if (row.thumbnail_url && !processedFiles.has(row.thumbnail_url)) {
        deleteFile(row.thumbnail_url, "videos");
        processedFiles.add(row.thumbnail_url);
        filesDeleted++;
      }
    }

    // Delete posts (cascades to all related tables)
    const result = await query(
      `DELETE FROM posts
       WHERE created_at < NOW() - INTERVAL '${RETENTION_DAYS} days'
       RETURNING id`,
    );

    const duration = Date.now() - startTime;
    console.log(
      `🧹 Cleanup: ${result.rowCount} posts + ${filesDeleted} files deleted (${duration}ms)`,
    );

    return { postsDeleted: result.rowCount, filesDeleted };
  } catch (error) {
    console.error("❌ Post cleanup failed:", error.message);
    return { postsDeleted: 0, filesDeleted: 0, error: error.message };
  }
};

const cleanupExpiredOTPs = async () => {
  try {
    const result = await query(
      `DELETE FROM otp_codes WHERE expires_at < NOW() - INTERVAL '1 hour'`,
    );
    if (result.rowCount > 0) {
      console.log(`🧹 Removed ${result.rowCount} expired OTPs`);
    }
    return result.rowCount;
  } catch {
    return 0;
  }
};

const cleanupExpiredSessions = async () => {
  try {
    const result = await query(
      `DELETE FROM user_sessions WHERE expires_at < NOW()`,
    );
    if (result.rowCount > 0) {
      console.log(`🧹 Removed ${result.rowCount} expired sessions`);
    }
    return result.rowCount;
  } catch {
    return 0;
  }
};

const cleanupOldNotifications = async () => {
  try {
    const result = await query(
      `DELETE FROM notifications
       WHERE created_at < NOW() - INTERVAL '30 days'`,
    );
    if (result.rowCount > 0) {
      console.log(`🧹 Removed ${result.rowCount} old notifications`);
    }
    return result.rowCount;
  } catch {
    return 0;
  }
};

const runAllCleanup = async () => {
  const postsResult = await cleanupOldPosts();
  await cleanupExpiredOTPs();
  await cleanupExpiredSessions();
  await cleanupOldNotifications();
  return postsResult;
};

/**
 * Initialize cleanup cron jobs
 *
 * - Startup (30s delay): Catches missed cleanups from server downtime
 * - Every 6 hours: Full cleanup
 * - Every hour: Quick OTP/session cleanup
 */
const initCleanupJobs = () => {
  console.log(
    `✅ Cleanup scheduled — posts retained for ${RETENTION_DAYS} days`,
  );

  // Run on startup to catch up
  setTimeout(async () => {
    console.log("🧹 Startup cleanup check...");
    await runAllCleanup();
  }, 30 * 1000);

  // Every 6 hours: full cleanup
  cron.schedule("0 */6 * * *", async () => {
    console.log("🧹 Scheduled 6-hour cleanup...");
    await runAllCleanup();
  });

  // Every hour: lightweight OTP/session cleanup
  cron.schedule("0 * * * *", async () => {
    await cleanupExpiredOTPs();
    await cleanupExpiredSessions();
  });
};

module.exports = {
  cleanupOldPosts,
  cleanupExpiredOTPs,
  cleanupExpiredSessions,
  cleanupOldNotifications,
  runAllCleanup,
  initCleanupJobs,
};
