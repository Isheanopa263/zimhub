const { query } = require("../../config/database");
const { getFileUrl } = require("../../utils/storage");
const { getPaginationMeta } = require("../../utils/helpers");

/**
 * Search users by username or full name
 */
const searchUsers = async (searchTerm, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const pattern = `%${searchTerm.trim()}%`;

  const countResult = await query(
    `SELECT COUNT(*) FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE (u.username ILIKE $1 OR p.full_name ILIKE $1)
       AND u.is_suspended = false`,
    [pattern],
  );

  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT 
        u.id, u.username, u.role, u.created_at,
        p.full_name, p.bio, p.avatar_url,
        COUNT(DISTINCT po.id) FILTER (WHERE po.is_deleted = false)::int AS post_count
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     LEFT JOIN posts po ON po.user_id = u.id
     WHERE (u.username ILIKE $1 OR p.full_name ILIKE $1)
       AND u.is_suspended = false
     GROUP BY u.id, p.full_name, p.bio, p.avatar_url
     ORDER BY 
       CASE WHEN u.username ILIKE $1 THEN 0 ELSE 1 END,
       p.full_name ASC
     LIMIT $2 OFFSET $3`,
    [pattern, limit, offset],
  );

  return {
    users: result.rows.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      fullName: u.full_name,
      bio: u.bio,
      avatarUrl: u.avatar_url ? getFileUrl(u.avatar_url, "avatars") : null,
      postCount: u.post_count || 0,
      joinedAt: u.created_at,
    })),
    meta: getPaginationMeta(total, page, limit),
  };
};

/**
 * Search posts by caption or text content
 */
const searchPosts = async (
  searchTerm,
  currentUserId,
  { page = 1, limit = 10 },
) => {
  const offset = (page - 1) * limit;
  const pattern = `%${searchTerm.trim()}%`;

  const countResult = await query(
    `SELECT COUNT(DISTINCT p.id) FROM posts p
     LEFT JOIN post_text_posts pt ON pt.post_id = p.id
     LEFT JOIN post_links pl ON pl.post_id = p.id
     WHERE p.is_deleted = false
       AND (
         p.caption ILIKE $1 
         OR pt.content ILIKE $1
         OR pl.title ILIKE $1
         OR pl.description ILIKE $1
       )`,
    [pattern],
  );

  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT 
        p.id, p.user_id, p.post_type, p.caption, 
        p.created_at, p.updated_at,
        u.username,
        pr.full_name, pr.avatar_url,
        pi.image_url, pi.file_size AS image_file_size,
        pv.video_url, pv.thumbnail_url, pv.duration, pv.file_size AS video_file_size,
        pt.content AS text_content, pt.background_style,
        pl.title AS link_title, pl.description AS link_description,
        pl.url AS link_url, pl.og_image AS link_og_image,
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
     LEFT JOIN (SELECT post_id, COUNT(*) AS like_count FROM likes GROUP BY post_id) lc ON lc.post_id = p.id
     LEFT JOIN (SELECT post_id, COUNT(*) AS comment_count FROM comments WHERE is_deleted = false GROUP BY post_id) cc ON cc.post_id = p.id
     LEFT JOIN likes ul ON ul.post_id = p.id AND ul.user_id = $2
     WHERE p.is_deleted = false
       AND (
         p.caption ILIKE $1
         OR pt.content ILIKE $1
         OR pl.title ILIKE $1
         OR pl.description ILIKE $1
       )
     ORDER BY p.created_at DESC
     LIMIT $3 OFFSET $4`,
    [pattern, currentUserId, limit, offset],
  );

  return {
    posts: result.rows.map(formatSearchPost),
    meta: getPaginationMeta(total, page, limit),
  };
};

/**
 * Search notices by title or description
 */
const searchNotices = async (searchTerm, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const pattern = `%${searchTerm.trim()}%`;

  const countResult = await query(
    `SELECT COUNT(*) FROM notices
     WHERE title ILIKE $1 OR description ILIKE $1`,
    [pattern],
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT 
        n.id, n.title, n.description, n.poster_url, 
        n.phone_number, n.whatsapp_number, n.email_address,
        n.status, n.created_at,
        u.id AS user_id, u.username,
        p.full_name, p.avatar_url
     FROM notices n
     JOIN users u ON u.id = n.user_id
     LEFT JOIN profiles p ON p.user_id = n.user_id
     WHERE n.title ILIKE $1 OR n.description ILIKE $1
     ORDER BY 
       CASE WHEN n.status = 'active' THEN 0 ELSE 1 END,
       n.created_at DESC
     LIMIT $2 OFFSET $3`,
    [pattern, limit, offset],
  );

  return {
    notices: result.rows.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.description,
      posterUrl: n.poster_url ? getFileUrl(n.poster_url, "notices") : null,
      status: n.status,
      contact: {
        phone: n.phone_number,
        whatsapp: n.whatsapp_number,
        email: n.email_address,
      },
      createdAt: n.created_at,
      author: {
        id: n.user_id,
        username: n.username,
        fullName: n.full_name,
        avatarUrl: n.avatar_url ? getFileUrl(n.avatar_url, "avatars") : null,
      },
    })),
    meta: getPaginationMeta(total, page, limit),
  };
};

/**
 * Global search — search all types and return top results
 */
const globalSearch = async (searchTerm, currentUserId, limit = 5) => {
  const [users, posts, notices] = await Promise.all([
    searchUsers(searchTerm, { page: 1, limit }),
    searchPosts(searchTerm, currentUserId, { page: 1, limit }),
    searchNotices(searchTerm, { page: 1, limit }),
  ]);

  return {
    users: users.users,
    posts: posts.posts,
    notices: notices.notices,
    counts: {
      users: users.meta.total,
      posts: posts.meta.total,
      notices: notices.meta.total,
    },
  };
};

/**
 * Format post for search results
 */
const formatSearchPost = (row) => {
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
  searchUsers,
  searchPosts,
  searchNotices,
  globalSearch,
};
