const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { query, getClient } = require("../../config/database");
const ApiError = require("../../utils/ApiError");
const { sanitizeUser } = require("../../utils/helpers");

/**
 * Generate JWT access token (short lived - 15 minutes)
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });
};

/**
 * Generate JWT refresh token (long lived - 7 days)
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

/**
 * Store refresh token in database
 */
const storeRefreshToken = async (userId, refreshToken) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await query(
    `INSERT INTO user_sessions (user_id, refresh_token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, refreshToken, expiresAt],
  );
};

/**
 * Register a new student
 */
const registerUser = async ({ fullName, username, email, password, bio }) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    // Check if email already exists
    const emailExists = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    if (emailExists.rows.length > 0) {
      throw ApiError.conflict("An account with this email already exists");
    }

    // Check if username already exists
    const usernameExists = await client.query(
      "SELECT id FROM users WHERE username = $1",
      [username],
    );

    if (usernameExists.rows.length > 0) {
      throw ApiError.conflict("This username is already taken");
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (username, email, password_hash, role, is_verified)
       VALUES ($1, $2, $3, 'student', true)
       RETURNING id, username, email, role, is_verified, created_at`,
      [username, email, passwordHash],
    );

    const user = userResult.rows[0];

    // Create profile
    const profileResult = await client.query(
      `INSERT INTO profiles (user_id, full_name, bio)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, bio, avatar_url`,
      [user.id, fullName, bio || null],
    );

    await client.query("COMMIT");

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await storeRefreshToken(user.id, refreshToken);

    return {
      user: {
        ...user,
        profile: profileResult.rows[0],
      },
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

/**
 * Login user with email and password
 */
const loginUser = async ({ email, password }) => {
  // Find user with profile
  const result = await query(
    `SELECT 
        u.id, u.username, u.email, u.password_hash, u.role, 
        u.is_suspended, u.is_verified, u.created_at,
        p.full_name, p.bio, p.avatar_url
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.email = $1`,
    [email],
  );

  if (result.rows.length === 0) {
    // Generic message to prevent user enumeration
    throw ApiError.unauthorized("Invalid email or password");
  }

  const user = result.rows[0];

  // Check if account is suspended
  if (user.is_suspended) {
    throw ApiError.forbidden("Your account has been suspended. Contact admin.");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  // Store refresh token
  await storeRefreshToken(user.id, refreshToken);

  // Remove sensitive data
  const { password_hash, ...safeUser } = user;

  return {
    user: {
      id: safeUser.id,
      username: safeUser.username,
      email: safeUser.email,
      role: safeUser.role,
      is_verified: safeUser.is_verified,
      created_at: safeUser.created_at,
      profile: {
        full_name: safeUser.full_name,
        bio: safeUser.bio,
        avatar_url: safeUser.avatar_url,
      },
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (refreshToken) => {
  // Verify refresh token signature
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  // Check if token exists in database and is not expired
  const sessionResult = await query(
    `SELECT id, user_id, expires_at 
     FROM user_sessions 
     WHERE refresh_token = $1 AND expires_at > NOW()`,
    [refreshToken],
  );

  if (sessionResult.rows.length === 0) {
    throw ApiError.unauthorized("Refresh token not found or expired");
  }

  const session = sessionResult.rows[0];

  // Get user info
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

  // Rotate tokens (invalidate old, issue new)
  await query("DELETE FROM user_sessions WHERE id = $1", [session.id]);

  const newAccessToken = generateAccessToken(user.id, user.role);
  const newRefreshToken = generateRefreshToken(user.id);

  await storeRefreshToken(user.id, newRefreshToken);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Logout - invalidate refresh token
 */
const logoutUser = async (refreshToken) => {
  await query("DELETE FROM user_sessions WHERE refresh_token = $1", [
    refreshToken,
  ]);
};

/**
 * Logout from all devices
 */
const logoutAllDevices = async (userId) => {
  await query("DELETE FROM user_sessions WHERE user_id = $1", [userId]);
};

/**
 * Change user password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  // Get current password hash
  const result = await query("SELECT password_hash FROM users WHERE id = $1", [
    userId,
  ]);

  if (result.rows.length === 0) {
    throw ApiError.notFound("User not found");
  }

  const isValid = await bcrypt.compare(
    currentPassword,
    result.rows[0].password_hash,
  );

  if (!isValid) {
    throw ApiError.badRequest("Current password is incorrect");
  }

  if (currentPassword === newPassword) {
    throw ApiError.badRequest(
      "New password must be different from current password",
    );
  }

  const newHash = await bcrypt.hash(newPassword, 12);

  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    newHash,
    userId,
  ]);

  // Logout all devices for security
  await logoutAllDevices(userId);
};

/**
 * Get current authenticated user
 */
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

  if (result.rows.length === 0) {
    throw ApiError.notFound("User not found");
  }

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
    stats: {
      total_posts: parseInt(user.total_posts) || 0,
    },
  };
};

// Clean up expired sessions (call periodically)
const cleanExpiredSessions = async () => {
  const result = await query(
    "DELETE FROM user_sessions WHERE expires_at < NOW()",
  );
  return result.rowCount;
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices,
  changePassword,
  getCurrentUser,
  cleanExpiredSessions,
};
