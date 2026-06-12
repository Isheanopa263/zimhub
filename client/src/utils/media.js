/**
 * ZimHub Media URL Helper
 *
 * The backend always returns paths like:
 *   /uploads/images/uuid.jpg
 *   /uploads/videos/uuid.mp4
 *   /uploads/avatars/uuid.jpg
 *
 * In development:  Vite proxy forwards /uploads → localhost:5000/uploads
 * With ngrok:      VITE_API_URL is set → prepend it
 * In production:   VITE_API_URL is the deployed backend
 */

const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * Core helper — takes any path/url and returns a usable src
 */
export const getMediaUrl = (pathOrUrl) => {
  if (!pathOrUrl) return null;

  // Already absolute URL
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  // Ensure single leading slash
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;

  // Fix accidental double paths like /uploads/images//uploads/images/x.jpg
  const deduplicated = cleanPath.replace(
    /\/uploads\/\w+\/\/uploads\//,
    "/uploads/",
  );

  // Prepend API base if set (ngrok / production)
  return API_BASE ? `${API_BASE}${deduplicated}` : deduplicated;
};

/**
 * Avatar URL
 * Input: "/uploads/avatars/uuid.jpg"  OR  "uuid.jpg"  OR  null
 */
export const getAvatarUrl = (input) => {
  if (!input) return null;
  if (input.startsWith("http")) return input;

  // If it's already a full /uploads/ path
  if (input.startsWith("/uploads/")) return getMediaUrl(input);

  // Plain filename
  return getMediaUrl(`/uploads/avatars/${input}`);
};

/**
 * Image post URL
 * Input: "/uploads/images/uuid.jpg"  OR  "uuid.jpg"
 */
export const getImageUrl = (input) => {
  if (!input) return null;
  if (input.startsWith("http")) return input;
  if (input.startsWith("/uploads/")) return getMediaUrl(input);
  return getMediaUrl(`/uploads/images/${input}`);
};

/**
 * Video post URL
 * Input: "/uploads/videos/uuid.mp4"  OR  "uuid.mp4"
 */
export const getVideoUrl = (input) => {
  if (!input) return null;
  if (input.startsWith("http")) return input;
  if (input.startsWith("/uploads/")) return getMediaUrl(input);
  return getMediaUrl(`/uploads/videos/${input}`);
};

/**
 * Notice poster URL
 */
export const getNoticeUrl = (input) => {
  if (!input) return null;
  if (input.startsWith("http")) return input;
  if (input.startsWith("/uploads/")) return getMediaUrl(input);
  return getMediaUrl(`/uploads/notices/${input}`);
};
