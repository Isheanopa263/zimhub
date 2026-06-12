import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  MoreHorizontal,
  MessageSquareReply,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import useReplies from "../../hooks/useReplies";
import useTheme from "../../hooks/useTheme";
import { getAvatarUrl } from "../../utils/media";
import ReplyItem from "./ReplyItem";

const timeAgo = (dateString) => {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
};

const CommentItem = ({ comment, onDelete, onReply }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { c } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const replyInputRef = useRef();

  const {
    replies,
    loading: loadingReplies,
    loaded: repliesLoaded,
    hasMore: hasMoreReplies,
    loadReplies,
    loadMore: loadMoreReplies,
    addReply,
    removeReply,
  } = useReplies(comment?.id);

  if (!comment?.author) return null;

  const isOwner = user?.id === comment.author.id;
  const isAdmin = user?.role === "admin";
  const canDelete = isOwner || isAdmin;
  const letter = comment.author.fullName?.charAt(0)?.toUpperCase() || "?";
  const avatarSrc = getAvatarUrl(comment.author.avatarUrl);
  const hasReplies = comment.replyCount > 0;

  useEffect(() => {
    if (showReplyBox && replyInputRef.current) replyInputRef.current.focus();
  }, [showReplyBox]);

  const handleToggleReplies = async () => {
    const next = !showReplies;
    setShowReplies(next);
    if (next && !repliesLoaded) await loadReplies();
  };

  const handleSubmitReply = async (e) => {
    e?.preventDefault();
    const text = replyContent.trim();
    if (!text || submittingReply) return;
    setSubmittingReply(true);
    try {
      const newReply = await onReply(comment.id, text);
      if (newReply) {
        if (!repliesLoaded) await loadReplies();
        addReply(newReply);
        setShowReplies(true);
      }
      setReplyContent("");
      setShowReplyBox(false);
    } catch {
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (replyId) => {
    await onDelete(replyId, true, comment.id);
    removeReply(replyId);
  };

  return (
    <div style={{ padding: "12px 0", borderBottom: `1px solid ${c.border}` }}>
      <div style={{ display: "flex", gap: "10px" }}>
        <div
          onClick={() => navigate(`/profile/${comment.author.username}`)}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#3B82F6,#8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={comment.author.fullName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span
              style={{
                color: "#fff",
                fontWeight: 700,
                fontSize: "13px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {letter}
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              background: c.bgSubtle,
              borderRadius: "14px",
              padding: "10px 12px",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "3px",
              }}
            >
              <span
                onClick={() => navigate(`/profile/${comment.author.username}`)}
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: c.text,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {comment.author.fullName || comment.author.username}
              </span>

              {canDelete && (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px",
                      borderRadius: "6px",
                      color: c.textMuted,
                      display: "flex",
                    }}
                  >
                    <MoreHorizontal size={14} />
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
                          borderRadius: "10px",
                          boxShadow: c.shadowLg,
                          border: `1px solid ${c.border}`,
                          padding: "4px",
                          zIndex: 50,
                          minWidth: "120px",
                        }}
                      >
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            onDelete?.(comment.id, false, null);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            width: "100%",
                            padding: "8px 10px",
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            borderRadius: "6px",
                            color: c.danger,
                            fontSize: "12px",
                            fontWeight: 600,
                            fontFamily: "Inter, sans-serif",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = c.dangerLight)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "none")
                          }
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <p
              style={{
                fontSize: "14px",
                color: c.text,
                margin: 0,
                lineHeight: 1.5,
                fontFamily: "Inter, sans-serif",
                wordBreak: "break-word",
              }}
            >
              {comment.content}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "4px",
              paddingLeft: "12px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: c.textMuted,
                fontFamily: "Inter, sans-serif",
              }}
            >
              @{comment.author.username}
            </span>
            <span style={{ fontSize: "11px", color: c.textFaint }}>·</span>
            <span
              style={{
                fontSize: "11px",
                color: c.textMuted,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {timeAgo(comment.createdAt)}
            </span>

            <button
              onClick={() => setShowReplyBox(!showReplyBox)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 4px",
                color: c.accent,
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "Inter, sans-serif",
              }}
            >
              <MessageSquareReply size={12} />
              Reply
            </button>

            {hasReplies && (
              <button
                onClick={handleToggleReplies}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 4px",
                  color: c.accent,
                  fontSize: "11px",
                  fontWeight: 700,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {showReplies ? (
                  <>
                    <ChevronUp size={12} /> Hide replies
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} />
                    {comment.replyCount === 1
                      ? "View 1 reply"
                      : `View ${comment.replyCount} replies`}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {showReplyBox && (
        <form
          onSubmit={handleSubmitReply}
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "10px",
            marginLeft: "46px",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              flex: 1,
              background: c.bgSubtle,
              borderRadius: "20px",
              padding: "8px 12px",
              display: "flex",
              alignItems: "flex-end",
              gap: "8px",
              border: `1px solid ${c.border}`,
            }}
          >
            <textarea
              ref={replyInputRef}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitReply();
                }
                if (e.key === "Escape") {
                  setShowReplyBox(false);
                  setReplyContent("");
                }
              }}
              placeholder={`Reply to ${comment.author.fullName}...`}
              maxLength={500}
              rows={1}
              disabled={submittingReply}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                resize: "none",
                outline: "none",
                fontSize: "13px",
                fontFamily: "Inter, sans-serif",
                color: c.text,
                minHeight: "18px",
                maxHeight: "80px",
                lineHeight: 1.5,
                padding: "2px 0",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!replyContent.trim() || submittingReply}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: replyContent.trim()
                ? "linear-gradient(135deg,#3B82F6,#2563eb)"
                : c.borderStrong,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: replyContent.trim() ? "pointer" : "not-allowed",
              color: replyContent.trim() ? "#ffffff" : c.textMuted,
              flexShrink: 0,
              boxShadow: replyContent.trim()
                ? "0 2px 8px rgba(59,130,246,0.3)"
                : "none",
            }}
          >
            <Send size={13} style={{ marginLeft: "2px" }} />
          </button>
        </form>
      )}

      {showReplies && (
        <div
          style={{
            marginLeft: "46px",
            marginTop: "8px",
            paddingLeft: "12px",
            borderLeft: `2px solid ${c.border}`,
          }}
        >
          {loadingReplies && replies.length === 0 ? (
            <div
              style={{
                padding: "12px",
                textAlign: "center",
                color: c.textMuted,
                fontSize: "12px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Loading replies...
            </div>
          ) : (
            <>
              {replies.map((reply) => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  onDelete={handleDeleteReply}
                />
              ))}

              {hasMoreReplies && (
                <button
                  onClick={loadMoreReplies}
                  disabled={loadingReplies}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px",
                    background: "none",
                    border: "none",
                    color: c.accent,
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: loadingReplies ? "wait" : "pointer",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {loadingReplies ? "Loading..." : "Load more replies"}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
