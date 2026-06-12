import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Megaphone,
  Trash2,
  CheckCheck,
  Bell,
  Trash,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

import { notificationsApi } from "../api/endpoints/notifications.api";
import useNotificationStore from "../store/notificationStore";
import useTheme from "../hooks/useTheme";

const NOTIFICATION_ICONS_CONFIG = {
  post_liked: { icon: Heart, baseColor: "#ef4444" },
  new_comment: { icon: MessageCircle, baseColor: "#3B82F6" },
  admin_announcement: { icon: Megaphone, baseColor: "#8b5cf6" },
};

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
  });
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { c } = useTheme();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const { resetUnread, decrementUnread } = useNotificationStore();

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationsApi.getAll({
        page: 1,
        limit: 50,
        unreadOnly: showUnreadOnly,
      });
      setNotifications(response.data || []);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [showUnreadOnly]);

  const handleMarkAllAsRead = async () => {
    if (marking) return;
    setMarking(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      resetUnread();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setMarking(false);
    }
  };

  const handleClearRead = async () => {
    if (!window.confirm("Delete all read notifications?")) return;
    try {
      await notificationsApi.clearRead();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      toast.success("Read notifications cleared");
    } catch {
      toast.error("Failed to clear");
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n,
          ),
        );
        decrementUnread(1);
      } catch {}
    }

    if (notification.referenceType === "post" && notification.referenceId) {
      navigate("/feed");
    }
  };

  const handleDelete = async (e, id, wasUnread) => {
    e.stopPropagation();
    try {
      await notificationsApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) decrementUnread(1);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        paddingBottom: "20px",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 0 12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: c.text,
                margin: 0,
              }}
            >
              🔔 Notifications
            </h1>
            <p
              style={{
                fontSize: "12px",
                color: c.textTer,
                margin: "2px 0 0",
              }}
            >
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "8px 14px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              background: showUnreadOnly
                ? "linear-gradient(135deg,#3B82F6,#2563eb)"
                : c.bgHover,
              color: showUnreadOnly ? "#fff" : c.textTer,
            }}
          >
            <Filter size={12} />
            {showUnreadOnly ? "Unread Only" : "All"}
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={marking}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: c.bgHover,
                border: "none",
                padding: "8px 14px",
                borderRadius: "10px",
                cursor: marking ? "wait" : "pointer",
                color: c.accent,
                fontSize: "12px",
                fontWeight: 700,
                fontFamily: "Inter, sans-serif",
              }}
            >
              <CheckCheck size={12} />
              Mark all read
            </button>
          )}

          {notifications.some((n) => n.isRead) && (
            <button
              onClick={handleClearRead}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: c.bgHover,
                border: "none",
                padding: "8px 14px",
                borderRadius: "10px",
                cursor: "pointer",
                color: c.textMuted,
                fontSize: "12px",
                fontWeight: 700,
                fontFamily: "Inter, sans-serif",
              }}
            >
              <Trash size={12} />
              Clear read
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonItem key={i} c={c} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState showUnreadOnly={showUnreadOnly} c={c} />
      ) : (
        <div>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              c={c}
              onClick={() => handleNotificationClick(notification)}
              onDelete={(e) =>
                handleDelete(e, notification.id, !notification.isRead)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Notification Item ────────────────────────────────────────────────────── */
const NotificationItem = ({ notification, c, onClick, onDelete }) => {
  const config = NOTIFICATION_ICONS_CONFIG[notification.type] || {
    icon: Bell,
    baseColor: c.textTer,
  };
  const Icon = config.icon;
  const color = config.baseColor;
  const bg = `${color}15`;

  // Background varies based on read status
  const cardBg = notification.isRead ? c.bgCard : c.accentLight;

  const cardBorder = notification.isRead ? c.border : `${c.accent}40`;

  return (
    <div
      onClick={onClick}
      style={{
        padding: "14px",
        background: cardBg,
        borderRadius: "14px",
        border: `1px solid ${cardBorder}`,
        marginBottom: "8px",
        display: "flex",
        gap: "12px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = c.shadowMd)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Unread dot */}
      {!notification.isRead && (
        <div
          style={{
            position: "absolute",
            left: "6px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "6px",
            height: "6px",
            background: c.accent,
            borderRadius: "50%",
          }}
        />
      )}

      {/* Icon */}
      <div
        style={{
          width: "40px",
          height: "40px",
          background: bg,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginLeft: !notification.isRead ? "8px" : 0,
        }}
      >
        <Icon size={18} color={color} fill={color} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "8px",
          }}
        >
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: notification.isRead ? 500 : 700,
                color: c.text,
                margin: "0 0 2px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {notification.title}
            </p>
            <p
              style={{
                fontSize: "13px",
                color: c.textTer,
                margin: 0,
                lineHeight: 1.4,
                fontFamily: "Inter, sans-serif",
                wordBreak: "break-word",
              }}
            >
              {notification.message}
            </p>
            <p
              style={{
                fontSize: "11px",
                color: c.textMuted,
                margin: "6px 0 0",
              }}
            >
              {timeAgo(notification.createdAt)}
            </p>
          </div>

          <button
            onClick={onDelete}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
              color: c.textFaint,
              display: "flex",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = c.danger)}
            onMouseLeave={(e) => (e.currentTarget.style.color = c.textFaint)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Empty State ──────────────────────────────────────────────────────────── */
const EmptyState = ({ showUnreadOnly, c }) => (
  <div
    style={{
      textAlign: "center",
      padding: "60px 20px",
      background: c.bgCard,
      borderRadius: "16px",
      border: `1px solid ${c.border}`,
    }}
  >
    <div
      style={{
        width: "64px",
        height: "64px",
        background: c.bgSubtle,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 16px",
      }}
    >
      <Bell size={28} color={c.textFaint} />
    </div>
    <h3
      style={{
        fontSize: "16px",
        fontWeight: 700,
        color: c.textTer,
        margin: "0 0 4px",
      }}
    >
      {showUnreadOnly ? "No unread notifications" : "No notifications yet"}
    </h3>
    <p style={{ fontSize: "13px", color: c.textMuted, margin: 0 }}>
      {showUnreadOnly
        ? "You're all caught up! 🎉"
        : "When someone likes or comments, you'll see it here"}
    </p>
  </div>
);

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */
const SkeletonItem = ({ c }) => (
  <div
    style={{
      padding: "14px",
      background: c.bgCard,
      borderRadius: "14px",
      border: `1px solid ${c.border}`,
      marginBottom: "8px",
      display: "flex",
      gap: "12px",
    }}
  >
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: `linear-gradient(90deg, ${c.skeletonBase} 0%, ${c.skeletonShine} 50%, ${c.skeletonBase} 100%)`,
        backgroundSize: "200% 100%",
        animation: "nSkel 1.5s infinite",
      }}
    />
    <div style={{ flex: 1 }}>
      <div
        style={{
          width: "60%",
          height: "12px",
          borderRadius: "6px",
          background: c.bgSubtle,
          marginBottom: "6px",
        }}
      />
      <div
        style={{
          width: "90%",
          height: "10px",
          borderRadius: "4px",
          background: c.bgSubtle,
        }}
      />
    </div>
    <style>{`
      @keyframes nSkel {
        0%   { background-position: -200% 0; }
        100% { background-position:  200% 0; }
      }
    `}</style>
  </div>
);

export default NotificationsPage;
