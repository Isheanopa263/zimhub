const { query, getClient } = require("../../config/database");
const ApiError = require("../../utils/ApiError");
const { getFileUrl, deleteFile, uploadFile } = require("../../utils/storage");
const { remember, invalidate } = require("../../utils/cache");

const getProfileByUsername = async (username, currentUserId = null) => {
  const cacheKey = `profile:${username.toLowerCase()}:viewer:${currentUserId || "guest"}`;

  return remember(cacheKey, 120, async () => {
    // 2 min cache
    const result = await query(
      `SELECT 
          u.id, u.username, u.email, u.role, u.is_verified, 
          u.is_suspended, u.created_at,
          p.full_name, p.bio, p.avatar_url,
          COUNT(DISTINCT po.id) FILTER (WHERE po.is_deleted = false)::int AS post_count,
          COUNT(DISTINCT n.id)::int AS notice_count
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN posts po ON po.user_id = u.id
       LEFT JOIN notices n ON n.user_id = u.id
       WHERE LOWER(u.username) = LOWER($1)
       GROUP BY u.id, p.full_name, p.bio, p.avatar_url`,
      [username],
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound("User not found");
    }

    const u = result.rows[0];
    const isOwnProfile = currentUserId === u.id;

    return {
      id: u.id,
      username: u.username,
      email: isOwnProfile ? u.email : null,
      role: u.role,
      isVerified: u.is_verified,
      isSuspended: u.is_suspended,
      isOwnProfile,
      joinedAt: u.created_at,
      profile: {
        fullName: u.full_name,
        bio: u.bio,
        avatarUrl: u.avatar_url ? getFileUrl(u.avatar_url, "avatars") : null,
      },
      stats: {
        posts: u.post_count || 0,
        notices: u.notice_count || 0,
      },
    };
  });
};

const updateProfile = async (
  userId,
  { fullName, bio, username },
  avatarFile = null,
) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT u.username, p.avatar_url 
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId],
    );

    if (existing.rows.length === 0) {
      throw ApiError.notFound("User not found");
    }

    const current = existing.rows[0];
    const oldUsername = current.username;

    // Username change
    if (username && username !== current.username) {
      const usernameTaken = await client.query(
        `SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2`,
        [username, userId],
      );

      if (usernameTaken.rows.length > 0) {
        throw ApiError.conflict("Username is already taken");
      }

      await client.query(`UPDATE users SET username = $1 WHERE id = $2`, [
        username,
        userId,
      ]);
    }

    // Profile fields
    const profileUpdates = [];
    const profileParams = [];

    if (fullName !== undefined) {
      profileParams.push(fullName.trim());
      profileUpdates.push(`full_name = $${profileParams.length}`);
    }

    if (bio !== undefined) {
      profileParams.push(bio === "" ? null : bio.trim());
      profileUpdates.push(`bio = $${profileParams.length}`);
    }

    if (avatarFile?.filename) {
      if (current.avatar_url) {
        deleteFile(current.avatar_url, "avatars");
      }
      const avatarUrl = await uploadFile(avatarFile.filename, "avatars");
      profileParams.push(avatarUrl);
      profileUpdates.push(`avatar_url = $${profileParams.length}`);
    }

    if (profileUpdates.length > 0) {
      profileParams.push(userId);
      await client.query(
        `UPDATE profiles SET ${profileUpdates.join(", ")} 
         WHERE user_id = $${profileParams.length}`,
        profileParams,
      );
    }

    await client.query("COMMIT");

    // Invalidate caches for old AND new username
    await invalidate(`profile:${oldUsername}:*`);
    if (username && username !== oldUsername) {
      await invalidate(`profile:${username}:*`);
    }

    const updated = await client.query(
      `SELECT username FROM users WHERE id = $1`,
      [userId],
    );

    return await getProfileByUsername(updated.rows[0].username, userId);
  } catch (error) {
    await client.query("ROLLBACK");
    if (avatarFile?.filename) deleteFile(avatarFile.filename, "avatars");
    throw error;
  } finally {
    client.release();
  }
};

const removeAvatar = async (userId) => {
  const result = await query(
    `SELECT u.username, p.avatar_url 
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = $1`,
    [userId],
  );

  if (result.rows.length > 0 && result.rows[0].avatar_url) {
    deleteFile(result.rows[0].avatar_url, "avatars");
  }

  await query(`UPDATE profiles SET avatar_url = NULL WHERE user_id = $1`, [
    userId,
  ]);

  // Invalidate profile cache
  if (result.rows[0]?.username) {
    await invalidate(`profile:${result.rows[0].username}:*`);
  }

  return { removed: true };
};

module.exports = {
  getProfileByUsername,
  updateProfile,
  removeAvatar,
};
