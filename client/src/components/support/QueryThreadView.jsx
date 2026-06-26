import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Send,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";

import { supportApi } from "../../api/endpoints/support.api";
import useTheme from "../../hooks/useTheme";
import useAuthStore from "../../store/authStore";
import { getAvatarUrl } from "../../utils/media";
import MarkdownText from "../ui/MarkdownText";

const STATUS_CONFIG = {
  open: {
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
    label: "Open",
    icon: AlertCircle,
  },
  in_progress: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    label: "In Progress",
    icon: Clock,
  },
  resolved: {
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    label: "Resolved",
    icon: CheckCircle2,
  },
  closed: {
    color: "#64748b",
    bg: "rgba(100,116,139,0.12)",
    label: "Closed",
    icon: X,
  },
};

const PRIORITY_CONFIG = {
  low: { color: "#64748b", label: "Low" },
  normal: { color: "#3B82F6", label: "Normal" },
  high: { color: "#f59e0b", label: "High" },
  urgent: { color: "#ef4444", label: "Urgent" },
};

const POLL_INTERVAL = 5000; // 5 seconds — quick for active conversations

const QueryThreadView = ({ queryId, onBack, isAdmin = false }) => {
  const { c } = useTheme();
  const { user } = useAuthStore();
  const [query, setQuery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const isFetchingRef = useRef(false);
  const previousCountRef = useRef(0);
  const isAtBottomRef = useRef(true);
  const containerRef = useRef(null);
  const hasInteractedRef = useRef(false);

  /* ─── Load query — silent mode for polling, loud for initial ─── */
  const loadQuery = useCallback(
    async (silent = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (!silent) setLoading(true);

      try {
        const response = isAdmin
          ? await supportApi.adminGetQuery(queryId)
          : await supportApi.getMyQuery(queryId);

        const newQuery = response.data;
        const newCount = newQuery.replies.length;
        const oldCount = previousCountRef.current;

        setQuery(newQuery);

        // Auto-scroll only if user is at bottom OR just sent a message
        if (
          newCount > oldCount &&
          (isAtBottomRef.current || !hasInteractedRef.current)
        ) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({
              behavior: silent ? "smooth" : "auto",
            });
          }, 50);
        }

        previousCountRef.current = newCount;
      } catch (err) {
        if (!silent) {
          toast.error("Failed to load query");
          onBack();
        }
      } finally {
        isFetchingRef.current = false;
        if (!silent) setLoading(false);
      }
    },
    [queryId, isAdmin, onBack],
  );

  /* ─── Initial load + setup polling ─── */
  useEffect(() => {
    loadQuery(false);

    // Poll every 5 seconds for new messages
    pollIntervalRef.current = setInterval(() => {
      // Skip polling if tab is hidden (save bandwidth)
      if (document.hidden) return;
      loadQuery(true);
    }, POLL_INTERVAL);

    // Poll immediately when tab becomes visible
    const handleVisibility = () => {
      if (!document.hidden) loadQuery(true);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(pollIntervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadQuery]);

  /* ─── Detect if user scrolled away from bottom ─── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      isAtBottomRef.current = distanceFromBottom < 150;
      hasInteractedRef.current = true;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ─── Send reply ─── */
  const handleSendReply = async (e) => {
    e?.preventDefault();
    const message = reply.trim();
    if (!message || sending) return;

    setSending(true);

    // Optimistic UI — show message immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      message,
      senderType: isAdmin ? "admin" : "user",
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        username: user.username,
        fullName: user.profile?.full_name,
        avatarUrl: user.profile?.avatar_url
          ? `${import.meta.env.VITE_API_URL || ""}/uploads/avatars/${user.profile.avatar_url.replace(/^.*\//, "")}`
          : null,
      },
      _optimistic: true,
    };

    setQuery((prev) => ({
      ...prev,
      replies: [...prev.replies, optimisticMessage],
    }));

    setReply("");
    isAtBottomRef.current = true; // Force scroll to bottom

    // Scroll immediately
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    try {
      if (isAdmin) {
        await supportApi.adminReply(queryId, message);
      } else {
        await supportApi.reply(queryId, message);
      }

      // Refresh to get the real message + any new replies
      await loadQuery(true);
    } catch (err) {
      // Remove optimistic message on error
      setQuery((prev) => ({
        ...prev,
        replies: prev.replies.filter((r) => r.id !== tempId),
      }));
      setReply(message); // Restore the message
      toast.error(err.response?.data?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  /* ─── Status change ─── */
  const handleStatusChange = async (newStatus) => {
    if (!isAdmin) return;
    try {
      await supportApi.adminUpdateQuery(queryId, { status: newStatus });
      toast.success(`Status changed to ${newStatus.replace("_", " ")}`);
      setShowActions(false);
      await loadQuery(true);
    } catch {
      toast.error("Failed to update");
    }
  };

  const handlePriorityChange = async (newPriority) => {
    if (!isAdmin) return;
    try {
      await supportApi.adminUpdateQuery(queryId, { priority: newPriority });
      toast.success(`Priority set to ${newPriority}`);
      setShowActions(false);
      await loadQuery(true);
    } catch {
      toast.error("Failed to update");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <Loader2
          size={32}
          color={c.accent}
          style={{ animation: "spin 1s linear infinite" }}
        />
        <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!query) return null;

  const statusConfig = STATUS_CONFIG[query.status] || STATUS_CONFIG.open;
  const priorityConfig =
    PRIORITY_CONFIG[query.priority] || PRIORITY_CONFIG.normal;
  const StatusIcon = statusConfig.icon;
  const isClosed = query.status === "closed";

  return (
    <div
      ref={containerRef}
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        paddingBottom: "120px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "16px 0",
          position: "sticky",
          top: 0,
          background: c.bg,
          zIndex: 10,
        }}
      >
        <button
          onClick={onBack}
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
            color: c.text,
          }}
        >
          <ArrowLeft size={18} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: c.text,
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {query.subject}
          </h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "4px",
            }}
          >
            <span
              style={{
                background: statusConfig.bg,
                color: statusConfig.color,
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "20px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <StatusIcon size={9} />
              {statusConfig.label}
            </span>
            <span
              style={{
                background: `${priorityConfig.color}15`,
                color: priorityConfig.color,
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "20px",
              }}
            >
              {priorityConfig.label}
            </span>

            {/* Live indicator */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "10px",
                color: c.success,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  background: c.success,
                  borderRadius: "50%",
                  animation: "pulse 2s infinite",
                }}
              />
              Live
            </span>
          </div>
        </div>

        {/* Admin actions menu */}
        {isAdmin && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowActions(!showActions)}
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
                color: c.text,
              }}
            >
              <MoreHorizontal size={18} />
            </button>

            {showActions && (
              <>
                <div
                  onClick={() => setShowActions(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 40 }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "4px",
                    background: c.bgCard,
                    borderRadius: "12px",
                    border: `1px solid ${c.border}`,
                    boxShadow: c.shadowLg,
                    padding: "6px",
                    minWidth: "180px",
                    zIndex: 50,
                  }}
                >
                  <p
                    style={{
                      fontSize: "10px",
                      color: c.textMuted,
                      margin: "6px 10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Status
                  </p>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                        padding: "8px 10px",
                        border: "none",
                        background:
                          query.status === key ? cfg.bg : "transparent",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: cfg.color,
                        fontFamily: "Inter, sans-serif",
                        fontWeight: query.status === key ? 700 : 500,
                        textAlign: "left",
                      }}
                    >
                      <cfg.icon size={13} />
                      {cfg.label}
                    </button>
                  ))}

                  <div
                    style={{
                      height: "1px",
                      background: c.border,
                      margin: "6px 8px",
                    }}
                  />

                  <p
                    style={{
                      fontSize: "10px",
                      color: c.textMuted,
                      margin: "6px 10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Priority
                  </p>
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => handlePriorityChange(key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                        padding: "8px 10px",
                        border: "none",
                        background:
                          query.priority === key
                            ? `${cfg.color}15`
                            : "transparent",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: cfg.color,
                        fontFamily: "Inter, sans-serif",
                        fontWeight: query.priority === key ? 700 : 500,
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: cfg.color,
                        }}
                      />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* User info (admin view only) */}
      {isAdmin && query.user && (
        <div
          style={{
            padding: "12px 14px",
            background: c.bgCard,
            borderRadius: "12px",
            border: `1px solid ${c.border}`,
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3B82F6, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {query.user.avatarUrl ? (
              <img
                src={query.user.avatarUrl}
                alt={query.user.fullName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{ color: "#fff", fontWeight: 700, fontSize: "14px" }}
              >
                {query.user.fullName?.charAt(0)?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: c.text,
                margin: 0,
              }}
            >
              {query.user.fullName || query.user.username}
            </p>
            <p
              style={{ fontSize: "11px", color: c.textTer, margin: "2px 0 0" }}
            >
              @{query.user.username} · {query.user.email}
            </p>
          </div>
        </div>
      )}

      {/* Messages thread */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {query.replies.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            c={c}
            isOwn={msg.sender.id === user?.id}
            isFromAdmin={msg.senderType === "admin"}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply input */}
      {!isClosed ? (
        <div
          style={{
            position: "fixed",
            bottom: window.innerWidth < 768 ? "70px" : 0,
            left: 0,
            right: 0,
            padding: "12px 16px",
            background: c.bgCard,
            borderTop: `1px solid ${c.border}`,
            zIndex: 30,
          }}
        >
          <form
            onSubmit={handleSendReply}
            style={{
              maxWidth: "680px",
              margin: "0 auto",
              display: "flex",
              gap: "10px",
              alignItems: "flex-end",
            }}
          >
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
              placeholder={
                isAdmin ? "Reply as admin..." : "Type your message..."
              }
              maxLength={5000}
              rows={1}
              disabled={sending}
              style={{
                flex: 1,
                padding: "11px 14px",
                borderRadius: "20px",
                border: `2px solid ${c.borderStrong}`,
                background: c.bgInput,
                color: c.text,
                fontSize: "14px",
                fontFamily: "Inter, sans-serif",
                outline: "none",
                resize: "none",
                lineHeight: 1.4,
                minHeight: "42px",
                maxHeight: "120px",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = c.accent;
                e.target.style.boxShadow = `0 0 0 3px ${c.accent}20`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = c.borderStrong;
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              type="submit"
              disabled={!reply.trim() || sending}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: reply.trim()
                  ? "linear-gradient(135deg, #3B82F6, #2563eb)"
                  : c.borderStrong,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: reply.trim() ? "pointer" : "not-allowed",
                color: "#fff",
                flexShrink: 0,
                boxShadow: reply.trim()
                  ? "0 4px 12px rgba(59, 130, 246, 0.3)"
                  : "none",
                transition: "all 0.15s ease",
              }}
            >
              {sending ? (
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Send size={16} style={{ marginLeft: "2px" }} />
              )}
            </button>
          </form>
        </div>
      ) : (
        <div
          style={{
            marginTop: "16px",
            padding: "14px",
            background: c.bgSubtle,
            border: `1px dashed ${c.border}`,
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              color: c.textTer,
              margin: 0,
              fontFamily: "Inter, sans-serif",
            }}
          >
            🔒 This query is closed.{" "}
            {isAdmin
              ? "Change status to reopen."
              : "Create a new query if you need more help."}
          </p>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(1.2); }
        }
        @keyframes spin {
          from { transform: rotate(0); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

/* ─── Message Bubble ─── */
const MessageBubble = ({ message, c, isOwn, isFromAdmin }) => {
  const timeAgo = new Date(message.createdAt).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const letter = message.sender.fullName?.charAt(0)?.toUpperCase() || "?";
  const isOptimistic = message._optimistic;

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        flexDirection: isOwn ? "row-reverse" : "row",
        alignItems: "flex-start",
        opacity: isOptimistic ? 0.7 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: isFromAdmin
            ? "linear-gradient(135deg, #3B82F6, #2563eb)"
            : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
          position: "relative",
        }}
      >
        {message.sender.avatarUrl ? (
          <img
            src={message.sender.avatarUrl}
            alt={message.sender.fullName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "13px" }}>
            {letter}
          </span>
        )}
        {isFromAdmin && (
          <div
            style={{
              position: "absolute",
              bottom: "-2px",
              right: "-2px",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: c.bgCard,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${c.bgCard}`,
            }}
          >
            <Shield size={9} color={c.accent} fill={c.accent} />
          </div>
        )}
      </div>

      <div
        style={{
          maxWidth: "75%",
          display: "flex",
          flexDirection: "column",
          alignItems: isOwn ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "4px",
            flexDirection: isOwn ? "row-reverse" : "row",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: c.text,
            }}
          >
            {message.sender.fullName || message.sender.username}
          </span>
          {isFromAdmin && (
            <span
              style={{
                background: c.accentLight,
                color: c.accent,
                fontSize: "9px",
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: "4px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              ADMIN
            </span>
          )}
        </div>

        <div
          style={{
            background: isOwn
              ? "linear-gradient(135deg, #3B82F6, #2563eb)"
              : c.bgCard,
            color: isOwn ? "#fff" : c.text,
            padding: "10px 14px",
            borderRadius: isOwn ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
            border: isOwn ? "none" : `1px solid ${c.border}`,
            boxShadow: c.shadowSm,
          }}
        >
          <MarkdownText variant="compact" textColor={isOwn ? "#fff" : c.text}>
            {message.message}
          </MarkdownText>
        </div>

        <p
          style={{
            fontSize: "10px",
            color: c.textMuted,
            margin: "4px 0 0",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {isOptimistic ? "Sending..." : timeAgo}
        </p>
      </div>
    </div>
  );
};

export default QueryThreadView;
