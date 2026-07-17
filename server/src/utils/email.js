const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

let sendEmail = null;
let isConfigured = false;

const initTransporter = () => {
  const resendKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;

  // ── Option 1: Resend HTTP API (works on Render) ──
  if (resendKey) {
    const { Resend } = require("resend");
    const resend = new Resend(resendKey);

    sendEmail = async (opts) => {
      const fromName =
        process.env.RESEND_FROM_NAME ||
        process.env.SMTP_FROM?.split("<")[0]?.trim() ||
        "ZimHub";
      const fromEmail =
        process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      });

      if (error) throw new Error(error.message);
      return { messageId: data?.id || "resend-" + Date.now() };
    };

    console.log("✅ Email service ready (Resend API)");
    isConfigured = true;
    return;
  }

  // ── Option 2: SMTP (for local dev or non-Render hosts) ──
  if (smtpHost && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nodemailer = require("nodemailer");

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      family: 4,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      tls: { rejectUnauthorized: false },
    });

    transporter.verify((error) => {
      if (error) {
        console.error("❌ SMTP failed:", error.message);
        isConfigured = false;
        setupConsoleTransporter();
      } else {
        console.log("✅ Email service ready (SMTP)");
        isConfigured = true;
      }
    });

    sendEmail = async (opts) => {
      return transporter.sendMail(opts);
    };

    return;
  }

  // ── Option 3: Console fallback (dev mode) ──
  console.log("ℹ️  Email service: console mode (no SMTP/Resend configured)");
  setupConsoleTransporter();
};

const setupConsoleTransporter = () => {
  isConfigured = false;
  sendEmail = async (opts) => {
    const codeMatch = (opts.text || "").match(/Your Code:\s*(\d{6})/);
    const code = codeMatch ? codeMatch[1] : "???";
    console.log(`\n📧 OTP for ${opts.to} → ${code}\n`);
    return { messageId: "dev-" + Date.now() };
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
        "If you did not request a password reset, you can safely ignore this email.",
    },
    account_deletion: {
      emoji: "⚠️",
      subject: "Confirm account deletion",
      title: "Account Deletion Request",
      intro: `Hi ${recipientName},`,
      message:
        "We received a request to permanently delete your ZimHub account. Use the verification code below to confirm:",
      action: "confirm the deletion",
      warning: "WARNING: This action is permanent and cannot be undone.",
    },
  };

  const c = config[purpose] || config.register;

  return {
    subject: `${c.emoji} ${c.subject}`,
    html: `<!DOCTYPE html>
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
    <p style="margin:24px 0 0;color:#64748b;font-size:13px;">Enter this code in ZimHub to ${c.action}.</p>
    ${c.warning ? `<div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:14px 16px;margin-top:24px;"><p style="margin:0;color:#991b1b;font-size:13px;">${c.warning}</p></div>` : ""}
    <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;">
    <p style="margin:0;color:#94a3b8;font-size:12px;">🔐 Never share this code with anyone.</p>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px;">© ${new Date().getFullYear()} ZimHub</p>
</body>
</html>`.trim(),
    text: `${c.emoji} ${c.title}\n\n${c.intro}\n\n${c.message}\n\nYour Code: ${code}\n\nExpires in 10 minutes.\n\n${c.warning || ""}\n\n— ZimHub`.trim(),
  };
};

const sendOTPEmail = async (email, code, purpose, recipientName) => {
  const { subject, html, text } = buildOTPEmail(code, purpose, recipientName);

  try {
    await sendEmail({
      from:
        process.env.SMTP_FROM ||
        process.env.RESEND_FROM_EMAIL ||
        '"ZimHub" <onboarding@resend.dev>',
      to: email,
      subject,
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error("❌ Email failed:", err.message);
    throw err;
  }
};

const testEmailConfig = async (testEmail) => {
  if (!isConfigured) {
    return { success: false, message: "Email not configured" };
  }
  try {
    await sendOTPEmail(testEmail, "123456", "register", "Test User");
    return { success: true, message: "Test email sent" };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

module.exports = { sendOTPEmail, testEmailConfig, isConfigured };
