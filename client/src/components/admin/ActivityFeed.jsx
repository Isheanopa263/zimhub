import { useNavigate } from "react-router-dom";
import {
  Image,
  Video,
  FileText,
  Link2,
  ClipboardList,
  UserPlus,
} from "lucide-react";
import useTheme from "../../hooks/useTheme";

const timeAgo = (dateString) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const ActivityFeed = ({ activities = [] }) => {
  const { c } = useTheme();
  const navigate = useNavigate();

  const TYPE_CONFIG = {
    post: {
      image: {
        icon: Image,
        label: "shared a photo",
        color: c.accent,
        bg: c.accentLight,
      },
      video: {
        icon: Video,
        label: "shared a video",
        color: c.danger,
        bg: c.dangerLight,
      },
      text: {
        icon: FileText,
        label: "posted",
        color: "#8b5cf6",
        bg: "rgba(139,92,246,0.12)",
      },
      link: {
        icon: Link2,
        label: "shared a link",
        color: c.success,
        bg: c.successLight,
      },
    },
    notice: {
      icon: ClipboardList,
      label: "posted a notice",
      color: c.warning,
      bg: c.warningLight,
    },
    user: {
      icon: UserPlus,
      label: "joined ZimHub",
      color: c.success,
      bg: c.successLight,
    },
  };

  if (activities.length === 0) {
    return (
      <div
        style={{
          padding: "32px 20px",
          textAlign: "center",
          color: c.textMuted,
          fontSize: "13px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        No recent activity
      </div>
    );
  }

  return (
    <div>
      {activities.map((activity, idx) => {
        let config;
        let label;

        if (activity.type === "post") {
          config = TYPE_CONFIG.post[activity.detail] || TYPE_CONFIG.post.text;
          label = config.label;
        } else if (activity.type === "notice") {
          config = TYPE_CONFIG.notice;
          label = `posted: "${activity.detail.substring(0, 35)}${activity.detail.length > 35 ? "..." : ""}"`;
        } else if (activity.type === "user") {
          config = TYPE_CONFIG.user;
          label = config.label;
        }

        const Icon = config.icon;

        return (
          <div
            key={`${activity.type}-${activity.id}-${idx}`}
            onClick={() => navigate(`/profile/${activity.username}`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              borderBottom: `1px solid ${c.border}`,
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = c.bgHover)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: config.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={15} color={config.color} strokeWidth={2.5} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: "13px",
                  color: c.text,
                  margin: 0,
                  fontFamily: "Inter, sans-serif",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <strong>{activity.fullName || activity.username}</strong>
                <span style={{ color: c.textTer }}> {label}</span>
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: c.textMuted,
                  margin: "2px 0 0",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {timeAgo(activity.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
