const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query, getClient } = require("../../config/database");
const ApiError = require("../../utils/ApiError");
const { sanitizeUser } = require("../../utils/helpers");
const { deleteFile } = require("../../utils/storage");
const otpService = require("./otp.service");

/* ─── EXISTING HELPERS (keep these) ────────────────────────────────────────── */

const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

const storeRefreshToken = async (userId, refreshToken) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await query(
    `INSERT INTO user_sessions (user_id, refresh_token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, refreshToken, expiresAt],
  );
};

/* ─── REGISTRATION FLOW (now 2 steps) ──────────────────────────────────────── */

/**
 * STEP 1: Request OTP for registration
 * Validates email+username availability before sending OTP
 */
const requestRegistrationOTP = async ({
  fullName,
  username,
  email,
  password,
  bio,
}) => {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedUsername = username.toLowerCase().trim();

  // Check email availability
  const emailCheck = await query("SELECT id FROM users WHERE email = $1", [
    normalizedEmail,
  ]);
  if (emailCheck.rows.length > 0) {
    throw ApiError.conflict("An account with this email already exists");
  }

  // Check username availability
  const usernameCheck = await query(
    "SELECT id FROM users WHERE username = $1",
    [normalizedUsername],
  );
  if (usernameCheck.rows.length > 0) {
    throw ApiError.conflict("This username is already taken");
  }

  // Send OTP — pass first name for personalization
  const firstName = fullName?.trim().split(" ")[0] || "there";
  await otpService.createAndSendOTP(normalizedEmail, "register", firstName);

  return {
    email: normalizedEmail,
    message: "Verification code sent to your email",
  };
};

/**
 * STEP 2: Verify OTP & create account
 */
const verifyAndCreateAccount = async ({
  fullName,
  username,
  email,
  password,
  bio,
  otp,
}) => {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedUsername = username.toLowerCase().trim();

  // Verify OTP
  const { otpId } = await otpService.verifyOTP(
    normalizedEmail,
    otp,
    "register",
  );

  const client = await getClient();

  try {
    await client.query("BEGIN");

    // Double-check availability (in case someone registered while user was verifying)
    const emailCheck = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail],
    );
    if (emailCheck.rows.length > 0) {
      throw ApiError.conflict("An account with this email already exists");
    }

    const usernameCheck = await client.query(
      "SELECT id FROM users WHERE username = $1",
      [normalizedUsername],
    );
    if (usernameCheck.rows.length > 0) {
      throw ApiError.conflict("This username is already taken");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user (verified since OTP confirmed)
    const userResult = await client.query(
      `INSERT INTO users (username, email, password_hash, role, is_verified)
       VALUES ($1, $2, $3, 'student', true)
       RETURNING id, username, email, role, is_verified, created_at`,
      [normalizedUsername, normalizedEmail, passwordHash],
    );

    const user = userResult.rows[0];

    // Create profile
    const profileResult = await client.query(
      `INSERT INTO profiles (user_id, full_name, bio)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, bio, avatar_url`,
      [user.id, fullName.trim(), bio?.trim() || null],
    );

    await client.query("COMMIT");

    // Consume OTP
    await otpService.consumeOTP(otpId);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await storeRefreshToken(user.id, refreshToken);

    return {
      user: { ...user, profile: profileResult.rows[0] },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/* ─── LOGIN (now supports email OR username) ──────────────────────────────── */

const loginUser = async ({ identifier, password }) => {
  if (!identifier?.trim() || !password) {
    throw ApiError.badRequest("Email/username and password are required");
  }

  const normalized = identifier.toLowerCase().trim();

  // Try matching email OR username
  const result = await query(
    `SELECT 
        u.id, u.username, u.email, u.password_hash, u.role,
        u.is_suspended, u.is_verified, u.created_at,
        p.full_name, p.bio, p.avatar_url
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE LOWER(u.email) = $1 OR LOWER(u.username) = $1`,
    [normalized],
  );

  if (result.rows.length === 0) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  const user = result.rows[0];

  if (user.is_suspended) {
    throw ApiError.forbidden("Your account has been suspended. Contact admin.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  await storeRefreshToken(user.id, refreshToken);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
      created_at: user.created_at,
      profile: {
        full_name: user.full_name,
        bio: user.bio,
        avatar_url: user.avatar_url,
      },
    },
    accessToken,
    refreshToken,
  };
};

/* ─── PASSWORD RESET (OTP-based) ──────────────────────────────────────────── */

/**
 * STEP 1: Request password reset OTP
 */
const requestPasswordResetOTP = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check user exists (silently — don't reveal user enumeration)
  const userCheck = await query("SELECT id FROM users WHERE email = $1", [
    normalizedEmail,
  ]);

  // Always say "code sent" to prevent enumeration
  if (userCheck.rows.length === 0) {
    // Wait a bit to mimic actual sending time
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { message: "If this email exists, a code has been sent" };
  }

  await otpService.createAndSendOTP(normalizedEmail, "password_reset");

  return { message: "If this email exists, a code has been sent" };
};

/**
 * STEP 2: Verify OTP & reset password
 */
const resetPassword = async ({ email, otp, newPassword }) => {
  const normalizedEmail = email.toLowerCase().trim();

  if (!newPassword || newPassword.length < 8) {
    throw ApiError.badRequest("Password must be at least 8 characters");
  }

  // Verify OTP
  const { otpId } = await otpService.verifyOTP(
    normalizedEmail,
    otp,
    "password_reset",
  );

  // Get user
  const userResult = await query("SELECT id FROM users WHERE email = $1", [
    normalizedEmail,
  ]);

  if (userResult.rows.length === 0) {
    throw ApiError.notFound("User not found");
  }

  const userId = userResult.rows[0].id;

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 12);

  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    passwordHash,
    userId,
  ]);

  // Invalidate all sessions for this user
  await query("DELETE FROM user_sessions WHERE user_id = $1", [userId]);

  // Consume OTP
  await otpService.consumeOTP(otpId);

  return { message: "Password reset successfully. Please login." };
};

/* ─── ACCOUNT DELETION (OTP-based) ────────────────────────────────────────── */

/**
 * STEP 1: Request account deletion OTP
 */
const requestAccountDeletion = async (userId) => {
  const userResult = await query(
    "SELECT email, role FROM users WHERE id = $1",
    [userId],
  );

  if (userResult.rows.length === 0) {
    throw ApiError.notFound("User not found");
  }

  if (userResult.rows[0].role === "admin") {
    throw ApiError.forbidden(
      "Admin accounts cannot be self-deleted. Contact another admin.",
    );
  }

  const email = userResult.rows[0].email;

  await otpService.createAndSendOTP(email, "account_deletion");

  return { email, message: "Confirmation code sent to your email" };
};

/**
 * STEP 2: Confirm with OTP and delete account
 */
const confirmAccountDeletion = async (userId, otp) => {
  const userResult = await query(
    `SELECT u.email, u.role, p.avatar_url 
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = $1`,
    [userId],
  );

  if (userResult.rows.length === 0) {
    throw ApiError.notFound("User not found");
  }

  if (userResult.rows[0].role === "admin") {
    throw ApiError.forbidden("Admin accounts cannot be self-deleted");
  }

  const { email, avatar_url } = userResult.rows[0];

  // Verify OTP
  const { otpId } = await otpService.verifyOTP(email, otp, "account_deletion");

  // Get all media files to delete
  const mediaResult = await query(
    `SELECT
      (SELECT array_agg(image_url) FROM post_images pi 
       JOIN posts p ON p.id = pi.post_id WHERE p.user_id = $1) AS images,
      (SELECT array_agg(video_url) FROM post_videos pv 
       JOIN posts p ON p.id = pv.post_id WHERE p.user_id = $1) AS videos,
      (SELECT array_agg(poster_url) FROM notices WHERE user_id = $1) AS notice_posters`,
    [userId],
  );

  const media = mediaResult.rows[0];

  // Delete files
  if (avatar_url) deleteFile(avatar_url, "avatars");
  (media.images || []).forEach((f) => f && deleteFile(f, "images"));
  (media.videos || []).forEach((f) => f && deleteFile(f, "videos"));
  (media.notice_posters || []).forEach((f) => f && deleteFile(f, "notices"));

  // Delete user (cascades to all related data)
  await query("DELETE FROM users WHERE id = $1", [userId]);

  // Consume OTP
  await otpService.consumeOTP(otpId);

  return { deleted: true };
};

/* ─── KEEP EXISTING FUNCTIONS ─────────────────────────────────────────────── */

const refreshAccessToken = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const sessionResult = await query(
    `SELECT id, user_id, expires_at FROM user_sessions
     WHERE refresh_token = $1 AND expires_at > NOW()`,
    [refreshToken],
  );

  if (sessionResult.rows.length === 0) {
    throw ApiError.unauthorized("Refresh token not found or expired");
  }

  const session = sessionResult.rows[0];

  const userResult = await query(
    "SELECT id, username, email, role, is_suspended FROM users WHERE id = $1",
    [session.user_id],
  );

  if (userResult.rows.length === 0) {
    throw ApiError.unauthorized("User not found");
  }

  const user = userResult.rows[0];

  if (user.is_suspended) {
    throw ApiError.forbidden("Account is suspended");
  }

  await query("DELETE FROM user_sessions WHERE id = $1", [session.id]);

  const newAccessToken = generateAccessToken(user.id, user.role);
  const newRefreshToken = generateRefreshToken(user.id);
  await storeRefreshToken(user.id, newRefreshToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logoutUser = async (refreshToken) => {
  await query("DELETE FROM user_sessions WHERE refresh_token = $1", [
    refreshToken,
  ]);
};

const logoutAllDevices = async (userId) => {
  await query("DELETE FROM user_sessions WHERE user_id = $1", [userId]);
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const result = await query("SELECT password_hash FROM users WHERE id = $1", [
    userId,
  ]);

  if (result.rows.length === 0) throw ApiError.notFound("User not found");

  const isValid = await bcrypt.compare(
    currentPassword,
    result.rows[0].password_hash,
  );
  if (!isValid) throw ApiError.badRequest("Current password is incorrect");

  if (currentPassword === newPassword) {
    throw ApiError.badRequest("New password must be different");
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    newHash,
    userId,
  ]);
  await logoutAllDevices(userId);
};

const getCurrentUser = async (userId) => {
  const result = await query(
    `SELECT 
        u.id, u.username, u.email, u.role, u.is_verified, u.created_at,
        p.full_name, p.bio, p.avatar_url,
        COUNT(DISTINCT po.id) FILTER (WHERE po.is_deleted = false) AS total_posts
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     LEFT JOIN posts po ON po.user_id = u.id
     WHERE u.id = $1
     GROUP BY u.id, p.full_name, p.bio, p.avatar_url`,
    [userId],
  );

  if (result.rows.length === 0) throw ApiError.notFound("User not found");

  const user = result.rows[0];

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    is_verified: user.is_verified,
    created_at: user.created_at,
    profile: {
      full_name: user.full_name,
      bio: user.bio,
      avatar_url: user.avatar_url,
    },
    stats: { total_posts: parseInt(user.total_posts) || 0 },
  };
};

module.exports = {
  requestRegistrationOTP,
  verifyAndCreateAccount,
  loginUser,
  requestPasswordResetOTP,
  resetPassword,
  requestAccountDeletion,
  confirmAccountDeletion,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices,
  changePassword,
  getCurrentUser,
};
