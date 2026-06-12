const { query, getClient } = require("../../config/database");
const ApiError = require("../../utils/ApiError");
const { getFileUrl, deleteFile } = require("../../utils/storage");
const { getPaginationMeta } = require("../../utils/helpers");

// ─── Shared SQL fragment — avoids repetition ──────────────────────────────────
const POST_SELECT_SQL = `
  SELECT 
    p.id,
    p.user_id,
    p.post_type,
    p.caption,
    p.created_at,
    p.updated_at,
    
    u.username,
    pr.full_name,
    pr.avatar_url,
    
    pi.image_url,
    pi.file_size AS image_file_size,
    
    pv.video_url,
    pv.thumbnail_url,
    pv.duration,
    pv.file_size AS video_file_size,
    
    pt.content AS text_content,
    pt.background_style,
    
    pl.title AS link_title,
    pl.description AS link_description,
    pl.url AS link_url,
    pl.og_image AS link_og_image,
    
    COALESCE(lc.like_count, 0)::int AS like_count,
    COALESCE(cc.comment_count, 0)::int AS comment_count,
    
    CASE WHEN ul.id IS NOT NULL THEN true ELSE false END AS is_liked
    
  FROM posts p
  JOIN users u ON u.id = p.user_id
  LEFT JOIN profiles pr ON pr.user_id = p.user_id
  LEFT JOIN post_images pi ON pi.post_id = p.id
  LEFT JOIN post_videos pv ON pv.post_id = p.id
  LEFT JOIN post_text_posts pt ON pt.post_id = p.id
  LEFT JOIN post_links pl ON pl.post_id = p.id
  LEFT JOIN (
    SELECT post_id, COUNT(*) AS like_count 
    FROM likes 
    GROUP BY post_id
  ) lc ON lc.post_id = p.id
  LEFT JOIN (
    SELECT post_id, COUNT(*) AS comment_count 
    FROM comments 
    WHERE is_deleted = false 
    GROUP BY post_id
  ) cc ON cc.post_id = p.id
  LEFT JOIN likes ul ON ul.post_id = p.id AND ul.user_id = $1
`;

// ─── Create Image Post ─────────────────────────────────────────────────────────
const createImagePost = async (userId, caption, file) => {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const postResult = await client.query(
      `INSERT INTO posts (user_id, post_type, caption)
       VALUES ($1, 'image', $2)
       RETURNING id`,
      [userId, caption || null],
    );

    const postId = postResult.rows[0].id;

    await client.query(
      `INSERT INTO post_images (post_id, image_url, file_size)
       VALUES ($1, $2, $3)`,
      [postId, file.filename, file.size],
    );

    await client.query("COMMIT");
    return await getPostById(postId, userId);
  } catch (error) {
    await client.query("ROLLBACK");
    if (file?.filename) deleteFile(file.filename, "images");
    throw error;
  } finally {
    client.release();
  }
};

// ─── Create Video Post ─────────────────────────────────────────────────────────
const createVideoPost = async (userId, caption, file) => {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const postResult = await client.query(
      `INSERT INTO posts (user_id, post_type, caption)
       VALUES ($1, 'video', $2)
       RETURNING id`,
      [userId, caption || null],
    );

    const postId = postResult.rows[0].id;

    await client.query(
      `INSERT INTO post_videos (post_id, video_url, file_size)
       VALUES ($1, $2, $3)`,
      [postId, file.filename, file.size],
    );

    await client.query("COMMIT");
    return await getPostById(postId, userId);
  } catch (error) {
    await client.query("ROLLBACK");
    if (file?.filename) deleteFile(file.filename, "videos");
    throw error;
  } finally {
    client.release();
  }
};

// ─── Create Text Post ──────────────────────────────────────────────────────────
const createTextPost = async (userId, content, backgroundStyle) => {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const postResult = await client.query(
      `INSERT INTO posts (user_id, post_type)
       VALUES ($1, 'text')
       RETURNING id`,
      [userId],
    );

    const postId = postResult.rows[0].id;

    await client.query(
      `INSERT INTO post_text_posts (post_id, content, background_style)
       VALUES ($1, $2, $3)`,
      [postId, content, backgroundStyle || "default"],
    );

    await client.query("COMMIT");
    return await getPostById(postId, userId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ─── Create Link Post ──────────────────────────────────────────────────────────
const createLinkPost = async (userId, { url, title, description, caption }) => {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const postResult = await client.query(
      `INSERT INTO posts (user_id, post_type, caption)
       VALUES ($1, 'link', $2)
       RETURNING id`,
      [userId, caption || null],
    );

    const postId = postResult.rows[0].id;

    await client.query(
      `INSERT INTO post_links (post_id, title, description, url)
       VALUES ($1, $2, $3, $4)`,
      [postId, title || null, description || null, url],
    );

    await client.query("COMMIT");
    return await getPostById(postId, userId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ─── Get Single Post ───────────────────────────────────────────────────────────
const getPostById = async (postId, currentUserId = null) => {
  const result = await query(
    `${POST_SELECT_SQL}
     WHERE p.id = $2 AND p.is_deleted = false`,
    [currentUserId, postId],
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound("Post not found");
  }

  return formatPost(result.rows[0]);
};

// ─── Get Feed Posts ────────────────────────────────────────────────────────────
const getFeedPosts = async (
  currentUserId,
  { page = 1, limit = 10, type = "all" },
) => {
  const offset = (page - 1) * limit;

  // ── Count query ──────────────────────────────────────────────
  let totalCount;
  if (type && type !== "all") {
    const countResult = await query(
      `SELECT COUNT(*) FROM posts 
       WHERE is_deleted = false AND post_type = $1`,
      [type],
    );
    totalCount = parseInt(countResult.rows[0].count);
  } else {
    const countResult = await query(
      `SELECT COUNT(*) FROM posts WHERE is_deleted = false`,
    );
    totalCount = parseInt(countResult.rows[0].count);
  }

  // ── Data query ───────────────────────────────────────────────
  let dataQuery;
  let params;

  if (type && type !== "all") {
    dataQuery = `
      ${POST_SELECT_SQL}
      WHERE p.is_deleted = false AND p.post_type = $2
      ORDER BY p.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    params = [currentUserId, type, limit, offset];
  } else {
    dataQuery = `
      ${POST_SELECT_SQL}
      WHERE p.is_deleted = false
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    params = [currentUserId, limit, offset];
  }

  const result = await query(dataQuery, params);

  return {
    posts: result.rows.map(formatPost),
    meta: getPaginationMeta(totalCount, page, limit),
  };
};

// ─── Get User Posts ────────────────────────────────────────────────────────────
const getUserPosts = async (
  userId,
  currentUserId,
  { page = 1, limit = 10 },
) => {
  const offset = (page - 1) * limit;

  const countResult = await query(
    `SELECT COUNT(*) FROM posts 
     WHERE user_id = $1 AND is_deleted = false`,
    [userId],
  );
  const totalCount = parseInt(countResult.rows[0].count);

  const result = await query(
    `${POST_SELECT_SQL}
     WHERE p.user_id = $2 AND p.is_deleted = false
     ORDER BY p.created_at DESC
     LIMIT $3 OFFSET $4`,
    [currentUserId, userId, limit, offset],
  );

  return {
    posts: result.rows.map(formatPost),
    meta: getPaginationMeta(totalCount, page, limit),
  };
};

// ─── Delete Post ───────────────────────────────────────────────────────────────
const deletePost = async (postId, userId, isAdmin = false) => {
  const postResult = await query(
    "SELECT user_id FROM posts WHERE id = $1 AND is_deleted = false",
    [postId],
  );

  if (postResult.rows.length === 0) {
    throw ApiError.notFound("Post not found");
  }

  if (postResult.rows[0].user_id !== userId && !isAdmin) {
    throw ApiError.forbidden("You can only delete your own posts");
  }

  await query("UPDATE posts SET is_deleted = true WHERE id = $1", [postId]);

  return { deleted: true };
};

// ─── Format Post ───────────────────────────────────────────────────────────────
const formatPost = (row) => {
  const post = {
    id: row.id,
    type: row.post_type,
    caption: row.caption,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      id: row.user_id,
      username: row.username,
      fullName: row.full_name,
      avatarUrl: row.avatar_url ? getFileUrl(row.avatar_url, "avatars") : null,
    },
    stats: {
      likes: row.like_count || 0,
      comments: row.comment_count || 0,
    },
    isLiked: row.is_liked || false,
  };

  switch (row.post_type) {
    case "image":
      post.image = {
        url: getFileUrl(row.image_url, "images"),
        fileSize: row.image_file_size,
      };
      break;

    case "video":
      post.video = {
        url: getFileUrl(row.video_url, "videos"),
        thumbnailUrl: row.thumbnail_url
          ? getFileUrl(row.thumbnail_url, "videos")
          : null,
        duration: row.duration,
        fileSize: row.video_file_size,
      };
      break;

    case "text":
      post.text = {
        content: row.text_content,
        backgroundStyle: row.background_style || "default",
      };
      break;

    case "link":
      post.link = {
        url: row.link_url,
        title: row.link_title,
        description: row.link_description,
        ogImage: row.link_og_image,
      };
      break;
  }

  return post;
};

module.exports = {
  createImagePost,
  createVideoPost,
  createTextPost,
  createLinkPost,
  getPostById,
  getFeedPosts,
  getUserPosts,
  deletePost,
};
