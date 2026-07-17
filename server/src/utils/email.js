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

  // ── Gmail API (HTTP — works on Render) ──
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
        const toEmail = opts.to;
        const boundary = "zimhub_" + Date.now() + "_boundary";

        // Proper UTF-8 encoding for subject (fixes emoji garbling)
        const encodedSubject = `=?UTF-8?B?${Buffer.from(opts.subject, "utf-8").toString("base64")}?=`;
        const encodedFromName = `=?UTF-8?B?${Buffer.from("ZimHub", "utf-8").toString("base64")}?=`;

        const messageParts = [
          `MIME-Version: 1.0`,
          `From: ${encodedFromName} <${gmailUser}>`,
          `To: ${toEmail}`,
          `Subject: ${encodedSubject}`,
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
          `X-Mailer: ZimHub App`,
          `X-Priority: 1`,
          `Reply-To: noreply@zimhub.app`,
          "",
          `--${boundary}`,
          `Content-Type: text/plain; charset=UTF-8`,
          `Content-Transfer-Encoding: base64`,
          "",
          Buffer.from(opts.text || "", "utf-8").toString("base64"),
          "",
          `--${boundary}`,
          `Content-Type: text/html; charset=UTF-8`,
          `Content-Transfer-Encoding: base64`,
          "",
          Buffer.from(opts.html || "", "utf-8").toString("base64"),
          "",
          `--${boundary}--`,
        ];

        const rawMessage = messageParts.join("\r\n");

        const encodedMessage = Buffer.from(rawMessage)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        const result = await gmail.users.messages.send({
          userId: "me",
          requestBody: { raw: encodedMessage },
        });

        return { messageId: result.data.id };
      };

      // Verify connection
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

  // ── Resend HTTP API ──
  if (resendKey) {
    try {
      const { Resend } = require("resend");
      const resend = new Resend(resendKey);

      sendEmail = async (opts) => {
        const fromEmail =
          process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

        const { data, error } = await resend.emails.send({
          from: `ZimHub <${fromEmail}>`,
          to: [opts.to],
          subject: opts.subject,
          html: opts.html,
          text: opts.text,
        });

        if (error) throw new Error(error.message);
        return { messageId: data?.id };
      };

      console.log("✅ Email service ready (Resend)");
      isConfigured = true;
      return;
    } catch (err) {
      console.error("❌ Resend failed:", err.message);
    }
  }

  // ── SMTP (local dev) ──
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nodemailer = require("nodemailer");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
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

  // ── Console fallback ──
  console.log("ℹ️  Email: console mode");
  setupConsoleTransporter();
};

const setupConsoleTransporter = () => {
  isConfigured = false;
  sendEmail = async (opts) => {
    const match = (opts.text || "").match(/Your Code:\s*(\d{6})/);
    console.log(`\n📧 OTP for ${opts.to} → ${match ? match[1] : "???"}\n`);
    return { messageId: "dev-" + Date.now() };
  };
};

initTransporter();

// ── Email templates — clean, no emojis in subject ──

const buildOTPEmail = (code, purpose, recipientName = "there") => {
  const config = {
    register: {
      subject: "Verify your ZimHub account",
      title: "Welcome to ZimHub!",
      message: "Use the code below to complete your registration:",
      action: "verify your email",
      warning: "",
    },
    password_reset: {
      subject: "Reset your ZimHub password",
      title: "Password Reset Request",
      message: "Use the code below to reset your password:",
      action: "reset your password",
      warning: "If you did not request this, ignore this email.",
    },
    account_deletion: {
      subject: "Confirm account deletion - ZimHub",
      title: "Account Deletion Request",
      message: "Use the code below to confirm account deletion:",
      action: "confirm deletion",
      warning: "This is permanent and cannot be undone.",
    },
  };

  const c = config[purpose] || config.register;

  return {
    subject: c.subject,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;">

<tr><td style="background:linear-gradient(135deg,#3B82F6,#2563eb);padding:32px;text-align:center;">
<div style="display:inline-block;width:56px;height:56px;line-height:56px;background:rgba(255,255,255,0.2);border-radius:14px;color:#fff;font-weight:900;font-size:24px;">Z</div>
<h1 style="margin:12px 0 0;color:#ffffff;font-size:22px;font-weight:800;">ZimHub</h1>
</td></tr>

<tr><td style="padding:32px;">
<h2 style="margin:0 0 16px;color:#0F172A;font-size:20px;font-weight:800;">${c.title}</h2>
<p style="margin:0 0 8px;color:#0F172A;font-size:15px;">Hi ${recipientName},</p>
<p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">${c.message}</p>

<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:12px;padding:24px;text-align:center;">
<p style="margin:0 0 8px;color:#3B82F6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Verification Code</p>
<p style="margin:0;font-family:'Courier New',monospace;font-size:40px;font-weight:900;color:#0F172A;letter-spacing:10px;">${code}</p>
<p style="margin:12px 0 0;color:#64748b;font-size:12px;">Valid for 10 minutes</p>
</td></tr>
</table>

<p style="margin:24px 0 0;color:#64748b;font-size:13px;">Enter this code in the ZimHub app to ${c.action}.</p>

${
  c.warning
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
<tr><td style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:12px 16px;">
<p style="margin:0;color:#991b1b;font-size:13px;">${c.warning}</p>
</td></tr></table>`
    : ""
}

<hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;">
<p style="margin:0;color:#94a3b8;font-size:12px;">Do not share this code with anyone. ZimHub will never ask for your code.</p>
</td></tr>

<tr><td style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #f1f5f9;">
<p style="margin:0;color:#94a3b8;font-size:11px;">ZimHub - Private Student Platform</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`.trim(),
    text: [
      c.title,
      "",
      `Hi ${recipientName},`,
      "",
      c.message,
      "",
      `Your verification code: ${code}`,
      "",
      "This code expires in 10 minutes.",
      "",
      c.warning || "",
      "",
      "Do not share this code with anyone.",
      "",
      "- ZimHub",
    ]
      .join("\n")
      .trim(),
  };
};

const sendOTPEmail = async (email, code, purpose, recipientName) => {
  const { subject, html, text } = buildOTPEmail(code, purpose, recipientName);
  try {
    await sendEmail({ to: email, subject, text, html });
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
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

module.exports = { sendOTPEmail, testEmailConfig, isConfigured };
