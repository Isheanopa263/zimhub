import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Megaphone,
  Trash2,
  CheckCheck,
  Bell,
} from "lucide-react";
import toast from "react-hot-toast";
import { notificationsApi } from "../api/endpoints/notifications.api";

const NOTIFICATION_ICONS = {
  post_liked: { icon: Heart, color: "#ef4444", bg: "#fef2f2" },
  new_comment: { icon: MessageCircle, color: "#3B82F6", bg: "#eff6ff" },
  admin_announcement: { icon: Megaphone, color: "#8b5cf6", bg: "#f5f3ff" },
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
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationsApi.getAll({ page: 1, limit: 50 });
      setNotifications(response.data || []);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    if (marking) return;
    setMarking(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setMarking(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n,
          ),
        );
      } catch {}
    }

    // Navigate based on reference
    if (notification.referenceType === "post" && notification.referenceId) {
      navigate("/feed");
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationsApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error("Failed to delete notification");
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 0",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "#0F172A",
              margin: 0,
            }}
          >
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p
              style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}
            >
              {unreadCount} unread
            </p>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={marking}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#f1f5f9",
              border: "none",
              padding: "8px 12px",
              borderRadius: "10px",
              cursor: marking ? "wait" : "pointer",
              color: "#3B82F6",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
            }}
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                padding: "16px",
                background: "#fff",
                borderRadius: "14px",
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
                  background: "#f1f5f9",
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    width: "60%",
                    height: "14px",
                    background: "#f1f5f9",
                    borderRadius: "6px",
                    marginBottom: "8px",
                  }}
                />
                <div
                  style={{
                    width: "90%",
                    height: "10px",
                    background: "#f8fafc",
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #f1f5f9",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "#f8fafc",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Bell size={28} color="#cbd5e1" />
          </div>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#64748b",
              margin: "0 0 4px",
            }}
          >
            No notifications yet
          </h3>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>
            When someone likes or comments, you'll see it here
          </p>
        </div>
      ) : (
        <div>
          {notifications.map((notification) => {
            const config = NOTIFICATION_ICONS[notification.type] || {
              icon: Bell,
              color: "#64748b",
              bg: "#f8fafc",
            };
            const Icon = config.icon;

            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  padding: "14px",
                  background: notification.isRead ? "#ffffff" : "#f0f9ff",
                  borderRadius: "14px",
                  border: notification.isRead
                    ? "1px solid #f1f5f9"
                    : "1px solid #bfdbfe",
                  marginBottom: "8px",
                  display: "flex",
                  gap: "12px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0,0,0,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Unread indicator */}
                {!notification.isRead && (
                  <div
                    style={{
                      position: "absolute",
                      left: "6px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "6px",
                      height: "6px",
                      background: "#3B82F6",
                      borderRadius: "50%",
                    }}
                  />
                )}

                {/* Icon */}
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    background: config.bg,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginLeft: !notification.isRead ? "8px" : 0,
                  }}
                >
                  <Icon size={18} color={config.color} fill={config.color} />
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
                          color: "#0F172A",
                          margin: "0 0 2px",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {notification.title}
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#64748b",
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
                          color: "#94a3b8",
                          margin: "6px 0 0",
                        }}
                      >
                        {timeAgo(notification.createdAt)}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, notification.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "6px",
                        color: "#cbd5e1",
                        display: "flex",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#ef4444")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#cbd5e1")
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
