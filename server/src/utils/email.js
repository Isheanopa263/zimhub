const nodemailer = require("nodemailer");
const dns = require("dns");

// Force IPv4 globally — Render free tier doesn't support IPv6
dns.setDefaultResultOrder("ipv4first");

let transporter = null;
let isConfigured = false;

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
      // Force IPv4 connection
      family: 4,
      // Connection settings
      pool: false,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      // TLS settings for Gmail
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify connection
    transporter.verify((error) => {
      if (error) {
        console.error("❌ SMTP failed:", error.message);
        isConfigured = false;
        setupConsoleTransporter();
      } else {
        console.log("✅ Email service ready");
        isConfigured = true;
      }
    });
  } else {
    console.log("ℹ️  Email service: console mode (dev)");
    setupConsoleTransporter();
  }
};

const setupConsoleTransporter = () => {
  isConfigured = false;
  transporter = {
    sendMail: async (opts) => {
      const codeMatch = (opts.text || "").match(/Your Code:\s*(\d{6})/);
      const code = codeMatch ? codeMatch[1] : "???";
      console.log(`\n📧 OTP for ${opts.to} → ${code}\n`);
      return { messageId: "dev-" + Date.now() };
    },
  };
};

initTransporter();

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
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:40px auto;padding:24px;background:#f1f5f9;">
  <div style="background:white;border-radius:16px;padding:32px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:60px;height:60px;line-height:60px;background:linear-gradient(135deg,#3B82F6,#2563eb);color:white;font-weight:900;font-size:28px;border-radius:14px;">Z</div>
      <h1 style="margin:12px 0 0;font-size:22px;color:#0F172A;">ZimHub</h1>
    </div>
    <h2 style="font-size:18px;color:#0F172A;margin:0 0 20px;">${c.emoji} ${c.title}</h2>
    <p style="margin:0 0 12px;color:#0F172A;font-size:15px;line-height:1.6;">${c.intro}</p>
    <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">${c.message}</p>
    <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:2px solid #bfdbfe;border-radius:14px;padding:28px 24px;text-align:center;">
      <p style="margin:0 0 10px;color:#3B82F6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Your Verification Code</p>
      <div style="font-family:'Courier New',monospace;font-size:42px;font-weight:900;color:#0F172A;letter-spacing:12px;padding:8px 0;">${code}</div>
      <p style="margin:14px 0 0;color:#64748b;font-size:12px;">Code expires in <strong>10 minutes</strong></p>
    </div>
    <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.6;">Enter this code in the ZimHub app to ${c.action}.</p>
    ${c.warning ? `<div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:14px 16px;margin-top:24px;"><p style="margin:0;color:#991b1b;font-size:13px;line-height:1.5;"><strong>⚠️ Warning:</strong> ${c.warning}</p></div>` : ""}
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f1f5f9;">
      <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">🔐 Never share this code with anyone.</p>
    </div>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px;">© ${new Date().getFullYear()} ZimHub · Private Student Platform</p>
</body>
</html>`.trim(),
    text: `${c.emoji} ${c.title}\n\n${c.intro}\n\n${c.message}\n\nYour Code: ${code}\n\nExpires in 10 minutes.\n\n${c.warning ? `⚠️ ${c.warning}\n\n` : ""}— ZimHub`.trim(),
  };
};

const sendOTPEmail = async (email, code, purpose, recipientName) => {
  const { subject, html, text } = buildOTPEmail(code, purpose, recipientName);

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"ZimHub" <noreply@zimhub.app>',
      to: email,
      subject,
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error("❌ Email failed:", err.message);
    if (err.code === "EAUTH") {
      console.error("   → Check SMTP credentials");
    }
    if (
      err.code === "ECONNECTION" ||
      err.code === "ETIMEDOUT" ||
      err.code === "ENETUNREACH"
    ) {
      console.error("   → Check SMTP host/port");
    }
    throw err;
  }
};

const testEmailConfig = async (testEmail) => {
  if (!isConfigured) {
    return { success: false, message: "SMTP not configured" };
  }
  try {
    await sendOTPEmail(testEmail, "123456", "register", "Test User");
    return { success: true, message: "Test email sent" };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

module.exports = { sendOTPEmail, testEmailConfig, isConfigured };
