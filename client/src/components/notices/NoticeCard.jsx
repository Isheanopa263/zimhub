import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreHorizontal,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

import useAuthStore from "../../store/authStore";
import useTheme from "../../hooks/useTheme";
import { getAvatarUrl, getNoticeUrl } from "../../utils/media";
import MarkdownText from "../ui/MarkdownText";

import NoticeContactButtons from "./NoticeContactButtons";

const timeAgo = (dateString) => {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const NoticeCard = ({ notice, onEdit, onDelete, onToggleStatus }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { c } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [posterError, setPosterError] = useState(false);

  if (!notice) return null;

  const isOwner = user?.id === notice.author?.id;
  const isAdmin = user?.role === "admin";
  const canEdit = isOwner;
  const canDelete = isOwner || isAdmin;
  const isActive = notice.status === "active";

  const letter = notice.author?.fullName?.charAt(0)?.toUpperCase() || "?";
  const avatarSrc = getAvatarUrl(notice.author?.avatarUrl);
  const posterSrc = getNoticeUrl(notice.posterUrl);

  const isLongDescription = notice.description?.length > 250;
  const displayDescription =
    expanded || !isLongDescription
      ? notice.description
      : notice.description.substring(0, 250).trim() + "...";

  return (
    <article
      style={{
        background: c.bgCard,
        borderRadius: "16px",
        border: `1px solid ${isActive ? c.border : c.danger + "40"}`,
        marginBottom: "12px",
        boxShadow: c.shadowSm,
        overflow: "hidden",
        opacity: isActive ? 1 : 0.85,
      }}
    >
      {/* Status banner */}
      {!isActive && (
        <div
          style={{
            background: c.dangerLight,
            padding: "6px 14px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            borderBottom: `1px solid ${c.danger}30`,
          }}
        >
          <XCircle size={13} color={c.danger} />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: c.danger,
              fontFamily: "Inter, sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Closed
          </span>
        </div>
      )}

      <div style={{ padding: "14px 16px 16px" }}>
        {/* Author + menu */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <div
            onClick={() => navigate(`/profile/${notice.author?.username}`)}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "linear-gradient(135deg,#3B82F6,#8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              overflow: "hidden",
              border: `2px solid ${c.border}`,
            }}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={notice.author?.fullName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <span
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {letter}
              </span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              onClick={() => navigate(`/profile/${notice.author?.username}`)}
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: c.text,
                margin: 0,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {notice.author?.fullName || "Unknown"}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Clock size={11} color={c.textMuted} />
              <span
                style={{
                  fontSize: "11px",
                  color: c.textMuted,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {timeAgo(notice.createdAt)}
              </span>
            </div>
          </div>

          {/* Menu */}
          {(canEdit || canDelete) && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px",
                  borderRadius: "8px",
                  color: c.textMuted,
                  display: "flex",
                }}
              >
                <MoreHorizontal size={18} />
              </button>

              {menuOpen && (
                <>
                  <div
                    onClick={() => setMenuOpen(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 40 }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "100%",
                      marginTop: "4px",
                      background: c.bgCard,
                      borderRadius: "12px",
                      boxShadow: c.shadowLg,
                      border: `1px solid ${c.border}`,
                      padding: "4px",
                      minWidth: "170px",
                      zIndex: 50,
                    }}
                  >
                    {canEdit && (
                      <>
                        <MenuItem
                          icon={Edit2}
                          label="Edit"
                          color={c.accent}
                          c={c}
                          onClick={() => {
                            setMenuOpen(false);
                            onEdit?.();
                          }}
                        />
                        <MenuItem
                          icon={isActive ? XCircle : CheckCircle2}
                          label={isActive ? "Mark as Closed" : "Mark as Active"}
                          color={isActive ? c.warning : c.success}
                          c={c}
                          onClick={() => {
                            setMenuOpen(false);
                            onToggleStatus?.();
                          }}
                        />
                      </>
                    )}
                    {canDelete && (
                      <MenuItem
                        icon={Trash2}
                        label="Delete"
                        color={c.danger}
                        c={c}
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete?.();
                        }}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 800,
            color: c.text,
            margin: "0 0 8px",
            fontFamily: "Inter, sans-serif",
            lineHeight: 1.4,
            wordBreak: "break-word",
          }}
        >
          {notice.title}
        </h3>

        {/* Description */}
        <div style={{ marginBottom: "12px" }}>
          <MarkdownText variant="default">{displayDescription}</MarkdownText>
          {isLongDescription && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: "none",
                border: "none",
                color: c.accent,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "13px",
                padding: "4px 0 0",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Poster image */}
        {posterSrc && !posterError && (
          <div
            style={{
              borderRadius: "12px",
              overflow: "hidden",
              marginBottom: "14px",
              background: c.skeletonBase,
            }}
          >
            <img
              src={posterSrc}
              alt={notice.title}
              loading="lazy"
              onError={() => setPosterError(true)}
              style={{
                width: "100%",
                maxHeight: "400px",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        )}

        {/* Contact buttons */}
        <NoticeContactButtons
          contact={notice.contact}
          noticeTitle={notice.title}
        />
      </div>
    </article>
  );
};

const MenuItem = ({ icon: Icon, label, color, onClick, c }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      width: "100%",
      padding: "10px 12px",
      border: "none",
      background: "none",
      cursor: "pointer",
      borderRadius: "8px",
      color: color,
      fontSize: "13px",
      fontWeight: 600,
      fontFamily: "Inter, sans-serif",
      transition: "background 0.15s ease",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = `${color}15`)}
    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
  >
    <Icon size={15} />
    {label}
  </button>
);

export default NoticeCard;
