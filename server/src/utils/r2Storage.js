const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
};

/**
 * Upload a local file to R2
 * Returns the public URL
 */
const uploadToR2 = async (localPath, folder, filename) => {
  const key = `${folder}/${filename}`;
  const ext = path.extname(filename).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

  const fileBuffer = fs.readFileSync(localPath);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    }),
  );

  // Delete local temp file after successful upload
  try {
    fs.unlinkSync(localPath);
  } catch {}

  return `${PUBLIC_URL}/${key}`;
};

/**
 * Delete a file from R2
 */
const deleteFromR2 = async (fileUrl) => {
  if (!fileUrl || !PUBLIC_URL) return;

  // Extract key from URL
  let key;
  if (fileUrl.startsWith(PUBLIC_URL)) {
    key = fileUrl.replace(`${PUBLIC_URL}/`, "");
  } else if (fileUrl.startsWith("http")) {
    return; // Not an R2 URL
  } else {
    // Might be a relative path — extract folder/filename
    key = fileUrl.replace(/^\/uploads\//, "");
  }

  if (!key) return;

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
    );
  } catch {}
};

/**
 * Get public URL for a file
 */
const getR2Url = (folder, filename) => {
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;
  if (filename.startsWith("/uploads/")) {
    // Convert local path to R2 URL
    const stripped = filename.replace("/uploads/", "");
    return `${PUBLIC_URL}/${stripped}`;
  }
  return `${PUBLIC_URL}/${folder}/${filename}`;
};

module.exports = { uploadToR2, deleteFromR2, getR2Url };
