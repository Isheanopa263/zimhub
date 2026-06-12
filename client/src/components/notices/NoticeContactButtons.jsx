import { Phone, MessageCircle, Mail } from "lucide-react";
import useTheme from "../../hooks/useTheme";

const NoticeContactButtons = ({ contact, noticeTitle }) => {
  const { c } = useTheme();

  if (!contact) return null;

  const { phone, whatsapp, email } = contact;
  const hasAny = phone || whatsapp || email;

  if (!hasAny) {
    return (
      <div
        style={{
          padding: "10px 14px",
          background: c.bgSubtle,
          borderRadius: "10px",
          fontSize: "12px",
          color: c.textMuted,
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        No contact info provided
      </div>
    );
  }

  const cleanPhone = (num) => (num || "").replace(/[\s\-()]/g, "");

  const whatsappMessage = encodeURIComponent(
    `Hi! I saw your notice on ZimHub: "${noticeTitle}"`,
  );

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
      }}
    >
      {phone && (
        <ContactButton
          href={`tel:${cleanPhone(phone)}`}
          icon={Phone}
          label="Call"
          color={c.accent}
          bg={c.accentLight}
        />
      )}

      {whatsapp && (
        <ContactButton
          href={`https://wa.me/${cleanPhone(whatsapp).replace(/^\+/, "")}?text=${whatsappMessage}`}
          icon={MessageCircle}
          label="WhatsApp"
          color={c.success}
          bg={c.successLight}
          external
        />
      )}

      {email && (
        <ContactButton
          href={`mailto:${email}?subject=${encodeURIComponent("Re: " + noticeTitle)}`}
          icon={Mail}
          label="Email"
          color="#8b5cf6"
          bg="rgba(139,92,246,0.12)"
        />
      )}
    </div>
  );
};

const ContactButton = ({
  href,
  icon: Icon,
  label,
  color,
  bg,
  external = false,
}) => (
  <a
    href={href}
    target={external ? "_blank" : undefined}
    rel={external ? "noopener noreferrer" : undefined}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "8px 14px",
      background: bg,
      color: color,
      borderRadius: "10px",
      textDecoration: "none",
      fontSize: "13px",
      fontWeight: 700,
      fontFamily: "Inter, sans-serif",
      transition: "all 0.15s ease",
      flex: "1 1 auto",
      justifyContent: "center",
      border: `1px solid ${color}30`,
      minWidth: "90px",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = color;
      e.currentTarget.style.color = "#ffffff";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = bg;
      e.currentTarget.style.color = color;
    }}
  >
    <Icon size={14} />
    {label}
  </a>
);

export default NoticeContactButtons;
