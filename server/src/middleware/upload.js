const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const UPLOAD_BASE = path.join(__dirname, "../../uploads");

/**
 * Configure multer storage — unique filenames
 */
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

/**
 * File filter — images only
 */
const imageFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, GIF and WebP images are allowed"), false);
  }
};

/**
 * File filter — videos only
 */
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

/**
 * File filter — images + videos combined
 */
const mediaFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File type not supported"), false);
  }
};

// ─── Export configured uploaders ──────────────────────────────────────────────

const uploadImage = multer({
  storage: createStorage("images"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadMultipleImages = multer({
  storage: createStorage("images"),
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per image
    files: 10, // Max 10 images
  },
});

const uploadVideo = multer({
  storage: createStorage("videos"),
  fileFilter: videoFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

const uploadAvatar = multer({
  storage: createStorage("avatars"),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

const uploadNoticeImage = multer({
  storage: createStorage("notices"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * Multer error handler middleware
 */
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
};
