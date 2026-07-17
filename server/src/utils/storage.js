const path = require("path");
const fs = require("fs");

const UPLOAD_BASE =
  process.env.LOCAL_UPLOAD_PATH || path.join(__dirname, "../../uploads");

// Detect if R2 is configured
const USE_R2 = !!(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME
);

let r2 = null;
if (USE_R2) {
  r2 = require("./r2Storage");
  console.log("✅ R2 storage configured");
} else {
  console.log("ℹ️  Using local file storage");
}

// Ensure local directories exist (needed for multer temp files even with R2)
const ensureDir = (dir) => {
  const fullPath = path.join(UPLOAD_BASE, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
};

["images", "videos", "avatars", "notices"].forEach(ensureDir);

/**
 * Upload file — to R2 if configured, otherwise keep local
 * Call this AFTER multer saves the temp file
 *
 * @param {string} filename - UUID filename from multer
 * @param {string} folder - 'images' | 'videos' | 'avatars' | 'notices'
 * @returns {string} - filename (local) or full URL (R2)
 */
const uploadFile = async (filename, folder) => {
  if (!filename) return null;

  if (USE_R2) {
    const localPath = path.join(UPLOAD_BASE, folder, filename);
    if (fs.existsSync(localPath)) {
      const url = await r2.uploadToR2(localPath, folder, filename);
      return url; // Returns full R2 URL
    }
  }

  // Local: multer already saved it, just return filename
  return filename;
};

/**
 * Get public URL for a stored file
 */
const getFileUrl = (value, folder) => {
  if (!value) return null;

  // Already a full URL (R2 or external)
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  // R2 mode — convert filename to R2 URL
  if (USE_R2 && r2) {
    return r2.getR2Url(folder, value);
  }

  // Local mode — return /uploads/ path
  if (value.startsWith("/uploads/")) return value;
  const filename = path.basename(value);
  return `/uploads/${folder}/${filename}`;
};

/**
 * Delete a file from storage
 */
const deleteFile = (value, folder) => {
  if (!value) return;

  // R2 file (URL)
  if (USE_R2 && r2 && value.startsWith("http")) {
    r2.deleteFromR2(value).catch(() => {});
    return;
  }

  // R2 mode but value is just filename
  if (USE_R2 && r2) {
    r2.deleteFromR2(`${process.env.R2_PUBLIC_URL}/${folder}/${value}`).catch(
      () => {},
    );
    return;
  }

  // Local file
  try {
    const filename = path.basename(value);
    const filePath = path.join(UPLOAD_BASE, folder, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {}
};

const getFileSize = (value, folder) => {
  try {
    const filename = path.basename(value);
    const filePath = path.join(UPLOAD_BASE, folder, filename);
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
};

module.exports = {
  UPLOAD_BASE,
  getFileUrl,
  uploadFile,
  deleteFile,
  getFileSize,
  USE_R2,
};
