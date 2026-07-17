const nodemailer = require("nodemailer");

let transporter = null;
let isConfigured = false;

/**
 * Initialize email transporter
 * Auto-detects whether real SMTP is configured
 */
const initTransporter = () => {
  const hasSmtpConfig = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

  if (hasSmtpConfig) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
    const dns = require("dns");
    // Force IPv4 for SMTP — Render free tier doesn't support IPv6
    dns.setDefaultResultOrder("ipv4first");

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      // Force IPv4
      family: 4,
      // Increase timeout for Render's network
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  } else {
    console.log("ℹ️  Email service: console mode (dev)");
    setupConsoleTransporter();
  }
};

/**
 * Fallback: log emails to console
 */
const setupConsoleTransporter = () => {
  isConfigured = false;
  transporter = {
    sendMail: async (opts) => {
      // Only show OTP code in dev console — no spam
      const codeMatch = (opts.text || "").match(/Your Code:\s*(\d{6})/);
      const code = codeMatch ? codeMatch[1] : "???";

      console.log(`\n📧 OTP for ${opts.to} → ${code}\n`);
      return { messageId: "dev-" + Date.now() };
    },
  };
};

initTransporter();

/**
 * Build the OTP email HTML
 */
const buildOTPEmail = (code, purpose, recipientName = "there") => {
  const config = {
    register: {
      emoji: "🎓",
      subject: "Verify your ZimHub account",
      title: "Welcome to ZimHub!",
      intro: `Hi ${recipientName},`,
      message:
        "Thanks for joining ZimHub! Please use the verification code below to complete your registration:",
      action: "verify your email",
      warning: "",
    },
    password_reset: {
      emoji: "🔑",
      subject: "Reset your ZimHub password",
      title: "Password Reset Request",
      intro: `Hi ${recipientName},`,
      message:
        "We received a request to reset your password. Use the verification code below to proceed:",
      action: "reset your password",
      warning:
        "If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.",
    },
    account_deletion: {
      emoji: "⚠️",
      subject: "Confirm account deletion",
      title: "Account Deletion Request",
      intro: `Hi ${recipientName},`,
      message:
        "We received a request to permanently delete your ZimHub account. Use the verification code below to confirm this action:",
      action: "confirm the deletion",
      warning:
        "WARNING: This action is permanent. Your account, posts, notices, comments, and all media will be deleted forever and cannot be recovered.",
    },
  };

  const c = config[purpose] || config.register;

  return {
    subject: `${c.emoji} ${c.subject}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${c.subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">

          <!-- Header gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#3B82F6 0%,#2563eb 100%);padding:32px 24px;text-align:center;">
              <div style="display:inline-block;width:60px;height:60px;line-height:60px;background:rgba(255,255,255,0.2);border-radius:16px;margin-bottom:12px;">
                <span style="color:#ffffff;font-weight:900;font-size:28px;font-family:Arial,sans-serif;">Z</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                ZimHub
              </h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">
                Private student community
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 28px 24px;">

              <h2 style="margin:0 0 20px;color:#0F172A;font-size:22px;font-weight:800;line-height:1.3;">
                ${c.emoji} ${c.title}
              </h2>

              <p style="margin:0 0 12px;color:#0F172A;font-size:15px;line-height:1.6;">
                ${c.intro}
              </p>

              <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
                ${c.message}
              </p>

              <!-- OTP Code Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border:2px solid #bfdbfe;border-radius:14px;padding:28px 24px;text-align:center;">
                    <p style="margin:0 0 10px;color:#3B82F6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">
                      Your Verification Code
                    </p>
                    <div style="font-family:'Courier New',Monaco,monospace;font-size:42px;font-weight:900;color:#0F172A;letter-spacing:12px;line-height:1;padding:8px 0;">
                      ${code}
                    </div>
                    <p style="margin:14px 0 0;color:#64748b;font-size:12px;">
                      Code expires in <strong>10 minutes</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Action note -->
              <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
                Enter this code in the ZimHub app to ${c.action}.
              </p>

              ${
                c.warning
                  ? `
                <!-- Warning -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
                  <tr>
                    <td style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:14px 16px;">
                      <p style="margin:0;color:#991b1b;font-size:13px;line-height:1.5;">
                        <strong>${purpose === "account_deletion" ? "⚠️ Warning:" : "🔒 Security:"}</strong> ${c.warning}
                      </p>
                    </td>
                  </tr>
                </table>
              `
                  : ""
              }

              <!-- Security note -->
              <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f1f5f9;">
                <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                  🔐 Never share this code with anyone. ZimHub will never ask for your code via phone or email.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 24px;text-align:center;border-top:1px solid #f1f5f9;">
              <p style="margin:0 0 6px;color:#64748b;font-size:12px;">
                Didn't request this email? You can safely ignore it.
              </p>
              <p style="margin:0;color:#94a3b8;font-size:11px;">
                © ${new Date().getFullYear()} ZimHub · Private Student Platform
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `.trim(),
    text: `
${c.emoji} ${c.title}

${c.intro}

${c.message}

═══════════════════════
  Your Code: ${code}
═══════════════════════

Code expires in 10 minutes.

${c.warning ? `⚠️  ${c.warning}\n\n` : ""}🔐 Never share this code with anyone. ZimHub will never ask for your code via phone or email.

— ZimHub
    `.trim(),
  };
};

/**
 * Send an OTP email
 */
const sendOTPEmail = async (email, code, purpose, recipientName) => {
  const { subject, html, text } = buildOTPEmail(code, purpose, recipientName);

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"ZimHub" <noreply@zimhub.app>',
      to: email,
      subject,
      text,
      html,
    });

    // No log on success — keep it quiet
    return true;
  } catch (err) {
    console.error("❌ Email failed:", err.message);

    if (err.code === "EAUTH") {
      console.error("   → Check SMTP credentials");
    }
    if (err.code === "ECONNECTION" || err.code === "ETIMEDOUT") {
      console.error("   → Check SMTP host/port");
    }

    throw err;
  }
};

/**
 * Test the email configuration
 */
const testEmailConfig = async (testEmail) => {
  if (!isConfigured) {
    return { success: false, message: "SMTP not configured" };
  }

  try {
    await sendOTPEmail(testEmail, "123456", "register", "Test User");
    return { success: true, message: "Test email sent successfully" };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

module.exports = { sendOTPEmail, testEmailConfig, isConfigured };
