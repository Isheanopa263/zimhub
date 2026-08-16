const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const testFolder = async (folder) => {
  const key = `${folder}/test-${Date.now()}.txt`;

  try {
    // Try to upload
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: "test",
        ContentType: "text/plain",
      }),
    );

    // Try to delete (cleanup)
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
        }),
      );
    } catch {}

    return { folder, status: "✅ WORKS" };
  } catch (err) {
    return {
      folder,
      status: "❌ FAILS",
      error: err.name,
      message: err.message,
      httpStatus: err.$metadata?.httpStatusCode,
    };
  }
};

const runR2Diagnostic = async (req, res) => {
  const folders = ["images", "videos", "avatars", "notices", "test-random"];
  const results = [];

  for (const folder of folders) {
    const result = await testFolder(folder);
    results.push(result);
  }

  res.json({
    bucket: process.env.R2_BUCKET_NAME,
    accountId: process.env.R2_ACCOUNT_ID ? "SET (hidden)" : "MISSING",
    accessKeyId: process.env.R2_ACCESS_KEY_ID
      ? `SET (${process.env.R2_ACCESS_KEY_ID.substring(0, 6)}...)`
      : "MISSING",
    secretKey: process.env.R2_SECRET_ACCESS_KEY ? "SET (hidden)" : "MISSING",
    publicUrl: process.env.R2_PUBLIC_URL || "MISSING",
    results,
  });
};

module.exports = { runR2Diagnostic };
