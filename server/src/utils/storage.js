const path = require("path");
const fs = require("fs");

const UPLOAD_BASE = path.join(__dirname, "../../uploads");

const ensureDir = (dir) => {
  const fullPath = path.join(UPLOAD_BASE, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
};

["images", "videos", "avatars", "notices"].forEach(ensureDir);

/**
 * Get public URL for a file
 * Handles ALL cases:
 *  - plain filename:           "uuid.jpg"           → "/uploads/images/uuid.jpg"
 *  - already full path:        "/uploads/images/uuid.jpg" → "/uploads/images/uuid.jpg"
 *  - already full URL:         "https://..."        → "https://..."
 *  - accidental double path:   "/uploads/images//uploads/images/uuid.jpg" → fixed
 */
const getFileUrl = (filenameOrPath, folder) => {
  if (!filenameOrPath) return null;

  // Already a full http/https URL — return as-is
  if (
    filenameOrPath.startsWith("http://") ||
    filenameOrPath.startsWith("https://")
  ) {
    return filenameOrPath;
  }

  // Already a correct /uploads/ path — return as-is
  if (filenameOrPath.startsWith("/uploads/")) {
    return filenameOrPath;
  }

  // Plain filename only — build the full path
  // Extract just the basename in case something weird was stored
  const filename = path.basename(filenameOrPath);
  return `/uploads/${folder}/${filename}`;
};

/**
 * Delete a file from local storage
 */
const deleteFile = (filenameOrPath, folder) => {
  if (!filenameOrPath) return;

  try {
    const filename = path.basename(filenameOrPath);
    const filePath = path.join(UPLOAD_BASE, folder, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Deleted: ${filePath}`);
    }
  } catch (error) {
    console.error("Failed to delete file:", error.message);
  }
};

const getFileSize = (filename, folder) => {
  try {
    const name = path.basename(filename);
    const filePath = path.join(UPLOAD_BASE, folder, name);
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
};

module.exports = { UPLOAD_BASE, getFileUrl, deleteFile, getFileSize };
