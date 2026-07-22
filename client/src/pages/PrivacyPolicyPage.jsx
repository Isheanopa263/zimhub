import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  Eye,
  Lock,
  Trash2,
  Mail,
  User,
  Database,
  Bell,
  Globe,
} from "lucide-react";
import useTheme from "../hooks/useTheme";

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();
  const { c } = useTheme();

  const lastUpdated = "July 2026";

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        paddingBottom: "40px",
        maxWidth: "700px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "16px 0 20px",
        }}
      >
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              window.close();
              setTimeout(() => navigate("/login"), 100);
            }
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: c.text,
              margin: 0,
            }}
          >
            🔒 Privacy Policy
          </h1>
          <p
            style={{
              fontSize: "12px",
              color: c.textTer,
              margin: "2px 0 0",
            }}
          >
            Last updated: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Introduction */}
      <PolicyCard c={c}>
        <p style={{ ...textStyle(c), marginBottom: "12px" }}>
          Welcome to <strong style={{ color: c.text }}>ZimHub</strong> — a
          private social platform built exclusively for Zimbabwean students at
          Aditya Institutions. Your privacy matters to us. This policy explains
          what data we collect, how we use it, and your rights.
        </p>
        <div
          style={{
            padding: "12px 14px",
            background: c.accentLight,
            border: `1px solid ${c.accent}30`,
            borderRadius: "10px",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              color: c.accent,
              margin: 0,
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            📌 Key point: ZimHub is a closed community. Only registered students
            can access the platform. Your data is never sold to third parties.
          </p>
        </div>
      </PolicyCard>

      {/* Data We Collect */}
      <PolicySection c={c} icon={Database} title="Information We Collect">
        <SubSection c={c} title="Account Information">
          <BulletList
            c={c}
            items={[
              "Full name (can be a display name — ghost accounts are allowed)",
              "Username (can be a pseudonym)",
              "Email address (must be valid for account verification)",
              "Password (encrypted with bcrypt — we never see your actual password)",
              "Profile picture (optional)",
              "Bio (optional)",
            ]}
          />
        </SubSection>

        <SubSection c={c} title="Content You Create">
          <BulletList
            c={c}
            items={[
              "Posts (text, images, videos, links, polls)",
              "Comments and replies",
              "Notices on the community board",
              "Support queries and messages",
              "Poll votes",
              "Likes",
            ]}
          />
        </SubSection>

        <HighlightBox c={c} type="info">
          We do NOT collect: location data, contacts, browsing history,
          financial information, or any data from other apps on your device.
        </HighlightBox>
      </PolicySection>

      {/* Email Privacy */}
      <PolicySection c={c} icon={Mail} title="Email Address Privacy">
        <p style={textStyle(c)}>
          Your email address is treated as{" "}
          <strong style={{ color: c.text }}>confidential</strong>:
        </p>
        <BulletList
          c={c}
          items={[
            "Only platform administrators can see your email address",
            "Other students CANNOT see your email — it is hidden from your public profile",
            "Your email is used only for: account verification (OTP), password reset, and account deletion confirmation",
            "We will never share your email with other students or third parties",
            "Admins will only use your email for platform-related communication",
          ]}
        />

        <HighlightBox c={c} type="warning">
          ⚠️ Important: While you may use any display name or username (ghost
          accounts are allowed), you MUST use a valid email address. This is
          required for account security (password reset, account verification).
        </HighlightBox>
      </PolicySection>

      {/* Ghost Accounts */}
      <PolicySection c={c} icon={User} title="Anonymous & Ghost Accounts">
        <p style={textStyle(c)}>
          We respect your right to privacy on the platform:
        </p>
        <BulletList
          c={c}
          items={[
            "You may use any display name — it does not have to be your real name",
            "Your username can be a pseudonym or nickname",
            "Profile photos are optional",
            "Bio is optional",
            "You can participate fully without revealing your real identity to other students",
            "Only admins can link your account to your email if needed for support",
          ]}
        />

        <HighlightBox c={c} type="success">
          ✅ Ghost account policy: You are allowed to use ZimHub without
          revealing your real identity to other students. However, your email
          must be real and valid.
        </HighlightBox>
      </PolicySection>

      {/* Suggestion Box */}
      <PolicySection c={c} icon={Eye} title="Anonymous Suggestion Box">
        <p style={textStyle(c)}>The suggestion box is completely anonymous:</p>
        <BulletList
          c={c}
          items={[
            "Your user ID is NOT attached to suggestions",
            "Your username is NOT attached to suggestions",
            "Your email is NOT attached to suggestions",
            "Admins can read suggestions but CANNOT identify who sent them",
            "A hashed version of your IP is stored only to prevent spam (rate limiting) — this hash cannot be reversed to identify you",
            "Admins cannot and will not reply to suggestions",
          ]}
        />
      </PolicySection>

      {/* How We Use Data */}
      <PolicySection c={c} icon={Shield} title="How We Use Your Data">
        <BulletList
          c={c}
          items={[
            "Display your profile to other students (name, username, bio, avatar — NOT email)",
            "Show your posts, comments, and notices in the community feed",
            "Send you notifications about likes, comments, and admin announcements",
            "Send verification codes (OTP) to your email for account security",
            "Moderate content to maintain a safe community",
            "Generate anonymous platform statistics (total users, posts, etc.)",
            "Automatically delete posts after 7 days to manage storage",
          ]}
        />

        <HighlightBox c={c} type="info">
          We NEVER use your data for: advertising, profiling, selling to third
          parties, tracking across other websites, or any commercial purpose.
        </HighlightBox>
      </PolicySection>

      {/* Content Policy */}
      <PolicySection c={c} icon={Globe} title="Content Policy">
        <p style={textStyle(c)}>
          To maintain a safe community, the following content is not allowed:
        </p>
        <BulletList
          c={c}
          items={[
            "Hate speech, discrimination, or harassment",
            "Explicit or pornographic content",
            "Personal information of others without consent",
            "Spam, scams, or misleading content",
            "Threats or incitement of violence",
            "Impersonation of others",
            "Copyright-infringing material",
          ]}
        />
        <p style={textStyle(c)}>
          Violations may result in content removal, account suspension, or
          permanent ban at the discretion of platform administrators.
        </p>
      </PolicySection>

      {/* Your Rights */}
      <PolicySection c={c} icon={Trash2} title="Your Rights">
        <p style={textStyle(c)}>
          You have full control over your account and data:
        </p>
        <BulletList
          c={c}
          items={[
            "View your profile — see all information associated with your account",
            "Edit your profile — change your name, username, bio, and avatar at any time",
            "Delete your posts — remove any content you have posted",
            "Delete your account — permanently remove your account and ALL associated data (posts, comments, likes, notices, media files)",
            "Account deletion requires email verification (OTP) for security",
            "Account deletion is immediate and irreversible",
            "After deletion, your username and email become available for new registrations",
          ]}
        />

        <HighlightBox c={c} type="warning">
          ⚠️ Account deletion is permanent. All your posts, comments, likes,
          notices, and uploaded media will be permanently deleted and cannot be
          recovered.
        </HighlightBox>
      </PolicySection>

      {/* Admin Access */}
      <PolicySection c={c} icon={Shield} title="Administrator Access">
        <p style={textStyle(c)}>
          Platform administrators have the following capabilities:
        </p>
        <BulletList
          c={c}
          items={[
            "View all user profiles including email addresses (for support purposes only)",
            "Remove inappropriate content (posts, comments, notices)",
            "Suspend or ban accounts that violate community guidelines",
            "Create platform-wide announcements",
            "Respond to support queries privately",
            "View anonymous suggestions (without knowing who submitted them)",
            "View platform statistics (total users, posts, activity)",
          ]}
        />
        <p style={textStyle(c)}>
          All admin actions are logged in an audit trail. Admins are accountable
          for their actions on the platform.
        </p>
      </PolicySection>

      {/* Changes */}
      <PolicySection c={c} icon={Globe} title="Changes to This Policy">
        <p style={textStyle(c)}>
          We may update this privacy policy from time to time. When we make
          changes:
        </p>
        <BulletList
          c={c}
          items={[
            'The "Last updated" date at the top will be changed',
            "Significant changes will be announced via an in-app announcement",
            "Continued use of ZimHub after changes constitutes acceptance",
          ]}
        />
      </PolicySection>

      {/* Contact */}
      <PolicyCard c={c}>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 800,
            color: c.text,
            margin: "0 0 10px",
          }}
        >
          📩 Questions or Concerns?
        </h3>
        <p style={{ ...textStyle(c), marginBottom: "12px" }}>
          If you have any questions about this privacy policy or how your data
          is handled:
        </p>
        <a
          href="mailto:ishythrillar@gmail.com"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 14px",
            background: c.accentLight,
            borderRadius: "10px",
            textDecoration: "none",
            border: `1px solid ${c.accent}30`,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <Mail size={18} color={c.accent} />
          <div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: c.text,
                margin: 0,
              }}
            >
              Contact us
            </p>
            <p
              style={{
                fontSize: "13px",
                color: c.accent,
                margin: "2px 0 0",
              }}
            >
              ishythrillar@gmail.com
            </p>
          </div>
        </a>

        <p
          style={{
            fontSize: "12px",
            color: c.textMuted,
            margin: "16px 0 0",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          You can also use the in-app Help & Support feature to contact admins
          directly.
        </p>
      </PolicyCard>
      {/* Close / Go Back Button */}
      <div
        style={{
          textAlign: "center",
          padding: "20px 0",
        }}
      >
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              window.close();
              setTimeout(() => navigate("/login"), 100);
            }
          }}
          style={{
            padding: "14px 32px",
            background: "linear-gradient(135deg, #3B82F6, #2563eb)",
            color: "#ffffff",
            border: "none",
            borderRadius: "14px",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
};

/* ─── Helper Components ─── */

const PolicyCard = ({ c, children }) => (
  <div
    style={{
      background: c.bgCard,
      borderRadius: "16px",
      border: `1px solid ${c.border}`,
      padding: "20px",
      marginBottom: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}
  >
    {children}
  </div>
);

const PolicySection = ({ c, icon: Icon, title, children }) => (
  <div
    style={{
      background: c.bgCard,
      borderRadius: "16px",
      border: `1px solid ${c.border}`,
      padding: "20px",
      marginBottom: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "14px",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: c.accentLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={c.accent} />
      </div>
      <h2
        style={{
          fontSize: "16px",
          fontWeight: 800,
          color: c.text,
          margin: 0,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {title}
      </h2>
    </div>
    {children}
  </div>
);

const SubSection = ({ c, title, children }) => (
  <div style={{ marginBottom: "14px" }}>
    <h3
      style={{
        fontSize: "14px",
        fontWeight: 700,
        color: c.text,
        margin: "0 0 8px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {title}
    </h3>
    {children}
  </div>
);

const BulletList = ({ c, items }) => (
  <ul
    style={{
      margin: "0 0 12px",
      paddingLeft: "20px",
      listStyle: "none",
    }}
  >
    {items.map((item, i) => (
      <li
        key={i}
        style={{
          fontSize: "13px",
          color: c.textSec,
          lineHeight: 1.6,
          marginBottom: "6px",
          paddingLeft: "4px",
          position: "relative",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: "-16px",
            color: c.accent,
            fontWeight: 700,
          }}
        >
          •
        </span>
        {item}
      </li>
    ))}
  </ul>
);

const HighlightBox = ({ c, type, children }) => {
  const configs = {
    info: { bg: c.accentLight, border: c.accent, color: c.accent },
    warning: { bg: c.warningLight, border: c.warning, color: c.warning },
    success: { bg: c.successLight, border: c.success, color: c.success },
    danger: { bg: c.dangerLight, border: c.danger, color: c.danger },
  };

  const cfg = configs[type] || configs.info;

  return (
    <div
      style={{
        padding: "12px 14px",
        background: cfg.bg,
        border: `1px solid ${cfg.border}30`,
        borderLeft: `4px solid ${cfg.border}`,
        borderRadius: "10px",
        marginTop: "12px",
        marginBottom: "12px",
      }}
    >
      <p
        style={{
          fontSize: "13px",
          color: cfg.color,
          margin: 0,
          fontWeight: 600,
          lineHeight: 1.5,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {children}
      </p>
    </div>
  );
};

const textStyle = (c) => ({
  fontSize: "13px",
  color: c.textSec,
  lineHeight: 1.6,
  margin: "0 0 8px",
  fontFamily: "Inter, sans-serif",
});

export default PrivacyPolicyPage;
