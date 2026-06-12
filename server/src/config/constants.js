module.exports = {
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,

  // File uploads
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  ALLOWED_VIDEO_TYPES: ["video/mp4", "video/webm", "video/quicktime"],

  // User roles
  ROLES: {
    STUDENT: "student",
    ADMIN: "admin",
  },

  // Post types
  POST_TYPES: {
    VIDEO: "video",
    IMAGE: "image",
    TEXT: "text",
    LINK: "link",
  },

  // Notice status
  NOTICE_STATUS: {
    ACTIVE: "active",
    CLOSED: "closed",
  },

  // Notification types
  NOTIFICATION_TYPES: {
    POST_LIKED: "post_liked",
    NEW_COMMENT: "new_comment",
    ADMIN_ANNOUNCEMENT: "admin_announcement",
  },
};
