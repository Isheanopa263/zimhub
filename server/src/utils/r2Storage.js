const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
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
 * Uses streaming for large files (videos)
 */
const uploadToR2 = async (localPath, folder, filename) => {
  const key = `${folder}/${filename}`;
  const ext = path.extname(filename).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

  const stats = fs.statSync(localPath);
  const fileSize = stats.size;

  try {
    // Files under 5MB — use simple upload
    if (fileSize < 5 * 1024 * 1024) {
      const fileBuffer = fs.readFileSync(localPath);
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
          ContentLength: fileSize,
        }),
      );
    } else {
      // Files over 5MB — use streaming multipart upload
      const fileStream = fs.createReadStream(localPath);

      const upload = new Upload({
        client: s3,
        params: {
          Bucket: BUCKET,
          Key: key,
          Body: fileStream,
          ContentType: contentType,
        },
        queueSize: 4, // 4 concurrent parts
        partSize: 5 * 1024 * 1024, // 5MB per part
      });

      await upload.done();
    }

    // Delete local temp file after successful upload
    try {
      fs.unlinkSync(localPath);
    } catch {}

    return `${PUBLIC_URL}/${key}`;
  } catch (err) {
    console.error("R2 upload failed:", {
      key,
      size: fileSize,
      error: err.message,
      code: err.Code,
      statusCode: err.$metadata?.httpStatusCode,
    });
    throw err;
  }
};

const deleteFromR2 = async (fileUrl) => {
  if (!fileUrl || !PUBLIC_URL) return;

  let key;
  if (fileUrl.startsWith(PUBLIC_URL)) {
    key = fileUrl.replace(`${PUBLIC_URL}/`, "");
  } else if (fileUrl.startsWith("http")) {
    return;
  } else {
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
  } catch (err) {
    console.error("R2 delete failed:", err.message);
  }
};

const getR2Url = (folder, filename) => {
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;
  if (filename.startsWith("/uploads/")) {
    const stripped = filename.replace("/uploads/", "");
    return `${PUBLIC_URL}/${stripped}`;
  }
  return `${PUBLIC_URL}/${folder}/${filename}`;
};

module.exports = { uploadToR2, deleteFromR2, getR2Url };
