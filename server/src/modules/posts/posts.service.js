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
    
    -- Multi-image
    (
      SELECT json_agg(
        json_build_object(
          'url',  pi.image_url,
          'size', pi.file_size,
          'order', pi.display_order
        )
        ORDER BY pi.display_order ASC
      )
      FROM post_images pi
      WHERE pi.post_id = p.id
    ) AS images,
    
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
    
    -- Poll data
    pp.id AS poll_id,
    pp.question AS poll_question,
    pp.expires_at AS poll_expires_at,
    pp.allow_multiple AS poll_allow_multiple,
    pp.total_votes AS poll_total_votes,
    (
      SELECT json_agg(
        json_build_object(
          'id', po.id,
          'text', po.option_text,
          'voteCount', po.vote_count,
          'order', po.display_order
        )
        ORDER BY po.display_order ASC
      )
      FROM poll_options po
      WHERE po.poll_id = pp.id
    ) AS poll_options,
    -- Check if current user has voted
    (
      SELECT json_agg(pvo.option_id)
      FROM poll_votes pvo
      WHERE pvo.poll_id = pp.id AND pvo.user_id = $1
    ) AS poll_user_votes,
    
    COALESCE(lc.like_count, 0)::int AS like_count,
    COALESCE(cc.comment_count, 0)::int AS comment_count,
    
    CASE WHEN ul.id IS NOT NULL THEN true ELSE false END AS is_liked
    
  FROM posts p
  JOIN users u ON u.id = p.user_id
  LEFT JOIN profiles pr ON pr.user_id = p.user_id
  LEFT JOIN post_videos pv ON pv.post_id = p.id
  LEFT JOIN post_text_posts pt ON pt.post_id = p.id
  LEFT JOIN post_links pl ON pl.post_id = p.id
  LEFT JOIN post_polls pp ON pp.post_id = p.id
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

/**
 * Create an image post (single or multi-image carousel)
 * @param {string} userId
 * @param {string} caption
 * @param {Array<File>} files - Array of uploaded files (1-10)
 */
const createImagePost = async (userId, caption, files) => {
  if (!files || files.length === 0) {
    throw ApiError.badRequest("At least one image is required");
  }

  if (files.length > 10) {
    throw ApiError.badRequest("Maximum 10 images per post");
  }

  const client = await getClient();

  try {
    await client.query("BEGIN");

    // Create base post
    const postResult = await client.query(
      `INSERT INTO posts (user_id, post_type, caption)
       VALUES ($1, 'image', $2)
       RETURNING id`,
      [userId, caption || null],
    );

    const postId = postResult.rows[0].id;

    // Insert all images with display order
    for (let i = 0; i < files.length; i++) {
      await client.query(
        `INSERT INTO post_images (post_id, image_url, file_size, display_order)
         VALUES ($1, $2, $3, $4)`,
        [postId, files[i].filename, files[i].size, i],
      );
    }

    await client.query("COMMIT");
    return await getPostById(postId, userId);
  } catch (error) {
    await client.query("ROLLBACK");
    // Clean up uploaded files on error
    if (files) {
      files.forEach((f) => {
        if (f?.filename) deleteFile(f.filename, "images");
      });
    }
    throw error;
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

// Create a poll post

const createPollPost = async (
  userId,
  { question, options, caption, expiresIn, allowMultiple },
) => {
  if (!question?.trim()) {
    throw ApiError.badRequest("Poll question is required");
  }

  if (!options || options.length < 2) {
    throw ApiError.badRequest("At least 2 options are required");
  }

  if (options.length > 6) {
    throw ApiError.badRequest("Maximum 6 options allowed");
  }

  // Validate each option
  for (const opt of options) {
    if (!opt?.trim() || opt.trim().length > 200) {
      throw ApiError.badRequest("Each option must be 1-200 characters");
    }
  }

  // Check for duplicate options
  const uniqueOptions = new Set(options.map((o) => o.trim().toLowerCase()));
  if (uniqueOptions.size !== options.length) {
    throw ApiError.badRequest("Duplicate options are not allowed");
  }

  const client = await getClient();

  try {
    await client.query("BEGIN");

    // Create base post
    const postResult = await client.query(
      `INSERT INTO posts (user_id, post_type, caption)
       VALUES ($1, 'poll', $2)
       RETURNING id`,
      [userId, caption?.trim() || null],
    );

    const postId = postResult.rows[0].id;

    // Calculate expiry
    let expiresAt = null;
    if (expiresIn) {
      const hours = parseInt(expiresIn);
      if (hours > 0 && hours <= 168) {
        // Max 7 days
        expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      }
    }

    // Create poll
    const pollResult = await client.query(
      `INSERT INTO post_polls (post_id, question, expires_at, allow_multiple)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [postId, question.trim(), expiresAt, allowMultiple || false],
    );

    const pollId = pollResult.rows[0].id;

    // Create options
    for (let i = 0; i < options.length; i++) {
      await client.query(
        `INSERT INTO poll_options (poll_id, option_text, display_order)
         VALUES ($1, $2, $3)`,
        [pollId, options[i].trim(), i],
      );
    }

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
    case "image": {
      // Multiple images stored in JSON array
      const images = (row.images || []).map((img) => ({
        url: getFileUrl(img.url, "images"),
        fileSize: img.size,
        order: img.order,
      }));

      post.images = images; // New: array of all images
      post.imageCount = images.length; // Convenience field

      // Backward compatibility — first image as "image"
      if (images.length > 0) {
        post.image = images[0];
      }
      break;
    }

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

    case "poll": {
      const options = (row.poll_options || []).map((opt) => ({
        id: opt.id,
        text: opt.text,
        voteCount: opt.voteCount || 0,
        order: opt.order,
      }));

      const userVotes = row.poll_user_votes || [];
      const hasVoted = userVotes.length > 0;
      const isExpired = row.poll_expires_at
        ? new Date(row.poll_expires_at) < new Date()
        : false;

      post.poll = {
        id: row.poll_id,
        question: row.poll_question,
        options,
        totalVotes: row.poll_total_votes || 0,
        allowMultiple: row.poll_allow_multiple,
        expiresAt: row.poll_expires_at,
        isExpired,
        hasVoted,
        userVotes,
      };
      break;
    }
  }

  return post;
};

//Vote on a poll

const votePoll = async (postId, userId, optionIds) => {
  if (!optionIds || optionIds.length === 0) {
    throw ApiError.badRequest("Select at least one option");
  }

  const client = await getClient();

  try {
    await client.query("BEGIN");

    // Get poll info
    const pollResult = await client.query(
      `SELECT pp.id, pp.expires_at, pp.allow_multiple
       FROM post_polls pp
       JOIN posts p ON p.id = pp.post_id
       WHERE pp.post_id = $1 AND p.is_deleted = false`,
      [postId],
    );

    if (pollResult.rows.length === 0) {
      throw ApiError.notFound("Poll not found");
    }

    const poll = pollResult.rows[0];

    // Check if expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      throw ApiError.badRequest("This poll has expired");
    }

    // Check multiple votes
    if (!poll.allow_multiple && optionIds.length > 1) {
      throw ApiError.badRequest("This poll only allows one vote");
    }

    // Check if user already voted
    const existingVotes = await client.query(
      `SELECT option_id FROM poll_votes
       WHERE poll_id = $1 AND user_id = $2`,
      [poll.id, userId],
    );

    if (existingVotes.rows.length > 0) {
      throw ApiError.badRequest("You have already voted on this poll");
    }

    // Verify all option IDs belong to this poll
    const validOptions = await client.query(
      `SELECT id FROM poll_options WHERE poll_id = $1`,
      [poll.id],
    );
    const validIds = new Set(validOptions.rows.map((o) => o.id));

    for (const optId of optionIds) {
      if (!validIds.has(optId)) {
        throw ApiError.badRequest("Invalid option selected");
      }
    }

    // Cast votes
    for (const optId of optionIds) {
      await client.query(
        `INSERT INTO poll_votes (poll_id, option_id, user_id)
         VALUES ($1, $2, $3)`,
        [poll.id, optId, userId],
      );

      // Increment option vote count
      await client.query(
        `UPDATE poll_options SET vote_count = vote_count + 1
         WHERE id = $1`,
        [optId],
      );
    }

    // Update total votes on poll
    await client.query(
      `UPDATE post_polls SET total_votes = total_votes + 1
       WHERE id = $1`,
      [poll.id],
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

module.exports = {
  createImagePost,
  createVideoPost,
  createTextPost,
  createLinkPost,
  createPollPost,
  votePoll,
  getPostById,
  getFeedPosts,
  getUserPosts,
  deletePost,
};
