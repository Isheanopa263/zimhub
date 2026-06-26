const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const FileType = require("file-type");

const UPLOAD_BASE = path.join(__dirname, "../../uploads");

const createStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(UPLOAD_BASE, folder));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${uuidv4()}${ext}`;
      cb(null, uniqueName);
    },
  });

/* ─── MIME type filters (first line of defense) ──────────────────────────── */

const imageFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, GIF and WebP images are allowed"), false);
  }
};

const videoFilter = (req, file, cb) => {
  const allowed = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only MP4, WebM, MOV and AVI videos are allowed"), false);
  }
};

/* ─── Magic byte validation (second line of defense) ─────────────────────── */

const ALLOWED_IMAGE_TYPES = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

const ALLOWED_VIDEO_TYPES = new Set(["mp4", "webm", "mov", "avi", "m4v"]);

/**
 * Verify file signature matches declared type
 * Deletes the file if it's a disguised malicious file
 */
const verifyFileSignature = async (filePath, allowedExtensions) => {
  try {
    const detected = await FileType.fromFile(filePath);

    if (!detected) {
      throw new Error("Could not determine file type");
    }

    if (!allowedExtensions.has(detected.ext)) {
      throw new Error(`File signature shows ${detected.ext}, not allowed`);
    }

    return true;
  } catch (err) {
    // Delete the bad file
    try {
      fs.unlinkSync(filePath);
    } catch {}
    throw err;
  }
};

/**
 * Middleware to verify file signatures AFTER multer saves them
 * Runs after multer middleware in the route chain
 */
const verifyImageSignature = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    for (const file of files) {
      await verifyFileSignature(file.path, ALLOWED_IMAGE_TYPES);
    }

    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid file. Files must be genuine images (JPEG, PNG, GIF, WebP).",
    });
  }
};

const verifyVideoSignature = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    for (const file of files) {
      await verifyFileSignature(file.path, ALLOWED_VIDEO_TYPES);
    }

    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid file. Files must be genuine videos (MP4, WebM, MOV, AVI).",
    });
  }
};

/* ─── Uploaders ──────────────────────────────────────────────────────────── */

const uploadImage = multer({
  storage: createStorage("images"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadMultipleImages = multer({
  storage: createStorage("images"),
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
});

const uploadVideo = multer({
  storage: createStorage("videos"),
  fileFilter: videoFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

const uploadAvatar = multer({
  storage: createStorage("avatars"),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const uploadNoticeImage = multer({
  storage: createStorage("notices"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* ─── Error handler ──────────────────────────────────────────────────────── */

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File is too large",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
};

module.exports = {
  uploadImage,
  uploadMultipleImages,
  uploadVideo,
  uploadAvatar,
  uploadNoticeImage,
  handleUploadError,
  verifyImageSignature,
  verifyVideoSignature,
};
