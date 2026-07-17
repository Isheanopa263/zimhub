const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

let sendEmail = null;
let isConfigured = false;

const initTransporter = async () => {
  const gmailClientId = process.env.GMAIL_CLIENT_ID;
  const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET;
  const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const gmailUser = process.env.GMAIL_USER;
  const resendKey = process.env.RESEND_API_KEY;

  // ── Option 1: Gmail API (HTTP — works on Render) ──
  if (gmailClientId && gmailClientSecret && gmailRefreshToken && gmailUser) {
    try {
      const { google } = require("googleapis");

      const oauth2Client = new google.auth.OAuth2(
        gmailClientId,
        gmailClientSecret,
        "https://developers.google.com/oauthplayground",
      );

      oauth2Client.setCredentials({
        refresh_token: gmailRefreshToken,
      });

      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      sendEmail = async (opts) => {
        // Build the email in RFC 2822 format
        const emailLines = [
          `From: ${opts.from || gmailUser}`,
          `To: ${opts.to}`,
          `Subject: ${opts.subject}`,
          "MIME-Version: 1.0",
          'Content-Type: multipart/alternative; boundary="boundary"',
          "",
          "--boundary",
          'Content-Type: text/plain; charset="UTF-8"',
          "",
          opts.text || "",
          "",
          "--boundary",
          'Content-Type: text/html; charset="UTF-8"',
          "",
          opts.html || opts.text || "",
          "",
          "--boundary--",
        ];

        const rawMessage = emailLines.join("\r\n");

        // Base64url encode
        const encodedMessage = Buffer.from(rawMessage)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        const result = await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodedMessage,
          },
        });

        return { messageId: result.data.id };
      };

      // Test the connection
      try {
        await oauth2Client.getAccessToken();
        console.log("✅ Email service ready (Gmail API)");
        isConfigured = true;
      } catch (err) {
        console.error("❌ Gmail API auth failed:", err.message);
        setupConsoleTransporter();
      }

      return;
    } catch (err) {
      console.error("❌ Gmail API setup failed:", err.message);
    }
  }

  // ── Option 2: Resend HTTP API ──
  if (resendKey) {
    try {
      const { Resend } = require("resend");
      const resend = new Resend(resendKey);

      sendEmail = async (opts) => {
        const fromEmail =
          process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
        const fromName = process.env.RESEND_FROM_NAME || "ZimHub";

        const { data, error } = await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: [opts.to],
          subject: opts.subject,
          html: opts.html,
          text: opts.text,
        });

        if (error) throw new Error(error.message);
        return { messageId: data?.id };
      };

      console.log("✅ Email service ready (Resend API)");
      isConfigured = true;
      return;
    } catch (err) {
      console.error("❌ Resend setup failed:", err.message);
    }
  }

  // ── Option 3: SMTP (for local dev) ──
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nodemailer = require("nodemailer");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      family: 4,
      tls: { rejectUnauthorized: false },
    });

    transporter.verify((error) => {
      if (error) {
        console.error("❌ SMTP failed:", error.message);
        setupConsoleTransporter();
      } else {
        console.log("✅ Email service ready (SMTP)");
        isConfigured = true;
      }
    });

    sendEmail = async (opts) => transporter.sendMail(opts);
    return;
  }

  // ── Option 4: Console (dev fallback) ──
  console.log("ℹ️  Email: console mode (no provider configured)");
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

// Initialize
initTransporter();

const buildOTPEmail = (code, purpose, recipientName = "there") => {
  const config = {
    register: {
      emoji: "🎓",
      subject: "Verify your ZimHub account",
      title: "Welcome to ZimHub!",
      intro: `Hi ${recipientName},`,
      message: "Use the code below to complete registration:",
      action: "verify your email",
      warning: "",
    },
    password_reset: {
      emoji: "🔑",
      subject: "Reset your ZimHub password",
      title: "Password Reset",
      intro: `Hi ${recipientName},`,
      message: "Use the code below to reset your password:",
      action: "reset your password",
      warning: "If you did not request this, ignore this email.",
    },
    account_deletion: {
      emoji: "⚠️",
      subject: "Confirm account deletion",
      title: "Account Deletion",
      intro: `Hi ${recipientName},`,
      message: "Use the code below to confirm account deletion:",
      action: "confirm deletion",
      warning: "WARNING: This is permanent and cannot be undone.",
    },
  };

  const c = config[purpose] || config.register;

  return {
    subject: `${c.emoji} ${c.subject}`,
    html: `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:40px auto;padding:24px;background:#f1f5f9;">
<div style="background:white;border-radius:16px;padding:32px;">
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;width:60px;height:60px;line-height:60px;background:linear-gradient(135deg,#3B82F6,#2563eb);color:white;font-weight:900;font-size:28px;border-radius:14px;">Z</div>
<h1 style="margin:12px 0 0;font-size:22px;color:#0F172A;">ZimHub</h1>
</div>
<h2 style="font-size:18px;color:#0F172A;">${c.emoji} ${c.title}</h2>
<p style="color:#0F172A;">${c.intro}</p>
<p style="color:#475569;">${c.message}</p>
<div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:14px;padding:28px;text-align:center;">
<p style="color:#3B82F6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Your Code</p>
<div style="font-family:monospace;font-size:42px;font-weight:900;color:#0F172A;letter-spacing:12px;">${code}</div>
<p style="color:#64748b;font-size:12px;">Expires in 10 minutes</p>
</div>
${c.warning ? `<div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:14px;margin-top:24px;"><p style="color:#991b1b;font-size:13px;">${c.warning}</p></div>` : ""}
<p style="color:#94a3b8;font-size:12px;margin-top:24px;">🔐 Never share this code.</p>
</div>
<p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px;">© ${new Date().getFullYear()} ZimHub</p>
</body></html>`.trim(),
    text: `${c.title}\n\n${c.intro}\n${c.message}\n\nYour Code: ${code}\n\nExpires in 10 minutes.\n\n${c.warning || ""}\n— ZimHub`.trim(),
  };
};

const sendOTPEmail = async (email, code, purpose, recipientName) => {
  const { subject, html, text } = buildOTPEmail(code, purpose, recipientName);
  try {
    await sendEmail({
      from:
        process.env.SMTP_FROM || process.env.GMAIL_USER || "noreply@zimhub.app",
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
  if (!isConfigured) return { success: false, message: "Not configured" };
  try {
    await sendOTPEmail(testEmail, "123456", "register", "Test");
    return { success: true, message: "Sent" };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

module.exports = { sendOTPEmail, testEmailConfig, isConfigured };
