const { query } = require("../../config/database");
const ApiError = require("../../utils/ApiError");
const { sendOTPEmail } = require("../../utils/email");

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 60;

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create and send an OTP
 * @param {string} email
 * @param {string} purpose - 'register' | 'password_reset' | 'account_deletion'
 * @param {string} [recipientName] - Optional name for personalization
 */
const createAndSendOTP = async (email, purpose, recipientName = null) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Rate limit
  const recentResult = await query(
    `SELECT created_at FROM otp_codes
     WHERE email = $1 AND purpose = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalizedEmail, purpose],
  );

  if (recentResult.rows.length > 0) {
    const lastSent = new Date(recentResult.rows[0].created_at);
    const secondsAgo = (Date.now() - lastSent.getTime()) / 1000;

    if (secondsAgo < COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(COOLDOWN_SECONDS - secondsAgo);
      throw ApiError.badRequest(
        `Please wait ${waitSeconds} seconds before requesting a new code`,
      );
    }
  }

  // Try to get user's name if not provided
  let nameToUse = recipientName;
  if (!nameToUse) {
    try {
      const userResult = await query(
        `SELECT p.full_name FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         WHERE u.email = $1`,
        [normalizedEmail],
      );
      if (userResult.rows.length > 0 && userResult.rows[0].full_name) {
        nameToUse = userResult.rows[0].full_name.split(" ")[0];
      }
    } catch {}
  }

  // Invalidate existing OTPs
  await query(
    `UPDATE otp_codes SET is_used = true 
     WHERE email = $1 AND purpose = $2 AND is_used = false`,
    [normalizedEmail, purpose],
  );

  // Create new OTP
  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await query(
    `INSERT INTO otp_codes (email, code, purpose, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [normalizedEmail, code, purpose, expiresAt],
  );

  // Send email
  try {
    await sendOTPEmail(normalizedEmail, code, purpose, nameToUse || "there");
  } catch (err) {
    console.error("Failed to send OTP email:", err.message);
    // Don't throw — still allow user to use the code if email fails
    // The code is shown in console in dev mode
  }

  return {
    email: normalizedEmail,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  };
};

/**
 * Verify an OTP code
 */
const verifyOTP = async (email, code, purpose) => {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await query(
    `SELECT id, code, attempts, expires_at, is_used
     FROM otp_codes
     WHERE email = $1 AND purpose = $2 AND is_used = false
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalizedEmail, purpose],
  );

  if (result.rows.length === 0) {
    throw ApiError.badRequest(
      "No verification code found. Please request a new one.",
    );
  }

  const otp = result.rows[0];

  if (new Date(otp.expires_at) < new Date()) {
    throw ApiError.badRequest(
      "This code has expired. Please request a new one.",
    );
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    await query(`UPDATE otp_codes SET is_used = true WHERE id = $1`, [otp.id]);
    throw ApiError.badRequest(
      "Too many failed attempts. Please request a new code.",
    );
  }

  if (otp.code !== code.trim()) {
    await query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [
      otp.id,
    ]);
    const attemptsLeft = MAX_ATTEMPTS - (otp.attempts + 1);
    throw ApiError.badRequest(
      `Invalid code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining.`,
    );
  }

  return { valid: true, otpId: otp.id };
};

const consumeOTP = async (otpId) => {
  await query(`UPDATE otp_codes SET is_used = true WHERE id = $1`, [otpId]);
};

const cleanExpiredOTPs = async () => {
  const result = await query(
    `DELETE FROM otp_codes WHERE expires_at < NOW() - INTERVAL '1 hour'`,
  );
  return result.rowCount;
};

module.exports = {
  createAndSendOTP,
  verifyOTP,
  consumeOTP,
  cleanExpiredOTPs,
};
