import {
  X,
  Github,
  Linkedin,
  Mail,
  Heart,
  Users,
  Sparkles,
  Code,
} from "lucide-react";

import useTheme from "../../hooks/useTheme";
import Logo from "../ui/Logo";

const AboutModal = ({ isOpen, onClose }) => {
  const { c, isDark } = useTheme();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--backdrop)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "500px",
          maxHeight: "90vh",
          background: c.bgCard,
          borderRadius: "20px",
          boxShadow: c.shadowLg,
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          <h2
            style={{
              fontSize: "17px",
              fontWeight: 800,
              color: c.text,
              margin: 0,
            }}
          >
            About ZimHub
          </h2>
          <button
            onClick={onClose}
            style={{
              background: c.bgHover,
              border: "none",
              borderRadius: "10px",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: c.textTer,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 20px" }}>
          {/* Hero */}
          <div
            style={{
              textAlign: "center",
              padding: "20px 0 28px",
              borderBottom: `1px solid ${c.border}`,
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "inline-block", marginBottom: "16px" }}>
              <Logo size="xl" showText={false} />
            </div>

            <h1
              style={{
                fontSize: "28px",
                fontWeight: 900,
                margin: "0 0 6px",
                letterSpacing: "-0.5px",
              }}
            >
              <span style={{ color: c.text }}>Zim</span>
              <span style={{ color: c.accent }}>Hub</span>
            </h1>

            <p
              style={{
                fontSize: "13px",
                color: c.textTer,
                margin: 0,
                fontWeight: 500,
              }}
            >
              Version 1.0.0 · MVP Release
            </p>
          </div>

          {/* ── What is ZimHub ── */}
          <Section c={c} icon={Sparkles} title="What is ZimHub?">
            <p>
              A private social platform built exclusively for Zimbabwean
              students at
              <strong style={{ color: c.text }}> Aditya Institutions</strong>,
              bringing together the best features from TikTok, Instagram and
              Threads into one focused community space.
            </p>
          </Section>

          {/* ── Features ── */}
          <Section c={c} icon={Heart} title="What you can do">
            <ul style={{ paddingLeft: "18px", margin: 0 }}>
              <li>Share videos, photos, text posts and links</li>
              <li>Connect with fellow students through likes and comments</li>
              <li>Post and browse community notices</li>
              <li>Receive real-time notifications</li>
              <li>Search across users, posts and notices</li>
            </ul>
          </Section>

          {/* ── Tech ── */}
          <Section c={c} icon={Code} title="Built with">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {[
                "React",
                "Vite",
                "Tailwind",
                "Node.js",
                "Express",
                "PostgreSQL",
                "JWT",
              ].map((tech) => (
                <span
                  key={tech}
                  style={{
                    padding: "4px 10px",
                    background: c.bgHover,
                    color: c.textSec,
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </Section>

          {/* ── Developer ── */}
          <Section c={c} icon={Users} title="Meet the developer">
            <div
              style={{
                background: isDark
                  ? "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))"
                  : "linear-gradient(135deg, rgba(59,130,246,0.05), rgba(139,92,246,0.03))",
                borderRadius: "14px",
                padding: "20px",
                border: `1px solid ${c.accent}25`,
                marginTop: "8px",
              }}
            >
              {/* Avatar + Name */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#3B82F6,#8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: "22px",
                    flexShrink: 0,
                  }}
                >
                  I
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: 800,
                      color: c.text,
                      margin: 0,
                    }}
                  >
                    Isheanopa Mangwende
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: c.textTer,
                      margin: "2px 0 0",
                      fontWeight: 500,
                    }}
                  >
                    Full-Stack Developer
                  </p>
                </div>
              </div>

              {/* Contact links */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <ContactLink
                  href="mailto:ishythrillar@gmail.com"
                  icon={Mail}
                  label="ishythrillar@gmail.com"
                  color={c.accent}
                  c={c}
                />
                <ContactLink
                  href="https://github.com/Isheanopa263"
                  icon={Github}
                  label="github.com/Isheanopa263"
                  color={c.text}
                  c={c}
                  external
                />
                <ContactLink
                  href="https://www.linkedin.com/in/isheanopa-mangwende/"
                  icon={Linkedin}
                  label="linkedin.com/in/isheanopa-mangwende"
                  color="#0077B5"
                  c={c}
                  external
                />
              </div>
            </div>
          </Section>

          {/* ── Footer ── */}
          <div
            style={{
              marginTop: "24px",
              paddingTop: "20px",
              borderTop: `1px solid ${c.border}`,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: c.textMuted,
                margin: "0 0 6px",
                lineHeight: 1.6,
              }}
            >
              Made with{" "}
              <Heart
                size={11}
                color={c.danger}
                fill={c.danger}
                style={{ display: "inline", verticalAlign: "middle" }}
              />{" "}
              for Aditya University students
            </p>
            <p
              style={{
                fontSize: "11px",
                color: c.textFaint,
                margin: 0,
              }}
            >
              © {new Date().getFullYear()} ZimHub. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

/* ─── Section ──────────────────────────────────────────────────── */
const Section = ({ icon: Icon, title, children, c }) => (
  <div style={{ marginBottom: "20px" }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "8px",
      }}
    >
      <Icon size={16} color={c.accent} />
      <h3
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: c.text,
          margin: 0,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {title}
      </h3>
    </div>
    <div
      style={{
        fontSize: "13px",
        color: c.textSec,
        lineHeight: 1.6,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {children}
    </div>
  </div>
);

/* ─── Contact Link ─────────────────────────────────────────────── */
const ContactLink = ({
  href,
  icon: Icon,
  label,
  color,
  c,
  external = false,
}) => (
  <a
    href={href}
    target={external ? "_blank" : undefined}
    rel={external ? "noopener noreferrer" : undefined}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "10px 12px",
      background: c.bgCard,
      borderRadius: "10px",
      textDecoration: "none",
      color: color,
      fontSize: "13px",
      fontWeight: 600,
      fontFamily: "Inter, sans-serif",
      border: `1px solid ${c.border}`,
      transition: "all 0.15s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = c.bgHover;
      e.currentTarget.style.transform = "translateX(2px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = c.bgCard;
      e.currentTarget.style.transform = "translateX(0)";
    }}
  >
    <Icon size={15} />
    <span
      style={{
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  </a>
);

export default AboutModal;
