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

  /* Focus reply input when shown */
  useEffect(() => {
    if (showReplyBox && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [showReplyBox]);

  const handleToggleReplies = async () => {
    const next = !showReplies;
    setShowReplies(next);
    if (next && !repliesLoaded) {
      await loadReplies();
    }
  };

  const handleSubmitReply = async (e) => {
    e?.preventDefault();
    const text = replyContent.trim();
    if (!text || submittingReply) return;

    setSubmittingReply(true);
    try {
      // onReply returns the new reply object
      const newReply = await onReply(comment.id, text);
      if (newReply) {
        // Make sure replies are loaded then append the new one
        if (!repliesLoaded) await loadReplies();
        addReply(newReply);
        setShowReplies(true);
      }
      setReplyContent("");
      setShowReplyBox(false);
    } catch {
      // toast already shown in hook
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (replyId) => {
    await onDelete(replyId, true, comment.id);
    removeReply(replyId);
  };

  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid #f8fafc" }}>
      {/* Main comment row */}
      <div style={{ display: "flex", gap: "10px" }}>
        {/* Avatar */}
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

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              background: "#f8fafc",
              borderRadius: "14px",
              padding: "10px 12px",
              position: "relative",
            }}
          >
            {/* Header */}
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
                  color: "#0F172A",
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
                      color: "#94a3b8",
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
                          background: "#ffffff",
                          borderRadius: "10px",
                          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                          border: "1px solid #f1f5f9",
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
                            color: "#ef4444",
                            fontSize: "12px",
                            fontWeight: 600,
                            fontFamily: "Inter, sans-serif",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#fef2f2")
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

            {/* Comment text */}
            <p
              style={{
                fontSize: "14px",
                color: "#0F172A",
                margin: 0,
                lineHeight: 1.5,
                fontFamily: "Inter, sans-serif",
                wordBreak: "break-word",
              }}
            >
              {comment.content}
            </p>
          </div>

          {/* Footer with actions */}
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
                color: "#94a3b8",
                fontFamily: "Inter, sans-serif",
              }}
            >
              @{comment.author.username}
            </span>
            <span style={{ fontSize: "11px", color: "#cbd5e1" }}>·</span>
            <span
              style={{
                fontSize: "11px",
                color: "#94a3b8",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {timeAgo(comment.createdAt)}
            </span>

            {/* Reply button */}
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
                color: "#3B82F6",
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "Inter, sans-serif",
              }}
            >
              <MessageSquareReply size={12} />
              Reply
            </button>

            {/* View / hide replies */}
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
                  color: "#3B82F6",
                  fontSize: "11px",
                  fontWeight: 700,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {showReplies ? (
                  <>
                    <ChevronUp size={12} />
                    Hide replies
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

      {/* Reply input box */}
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
              background: "#f8fafc",
              borderRadius: "20px",
              padding: "8px 12px",
              display: "flex",
              alignItems: "flex-end",
              gap: "8px",
              border: "1px solid #f1f5f9",
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
                color: "#0F172A",
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
                : "#e2e8f0",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: replyContent.trim() ? "pointer" : "not-allowed",
              color: replyContent.trim() ? "#ffffff" : "#94a3b8",
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

      {/* Replies thread */}
      {showReplies && (
        <div
          style={{
            marginLeft: "46px",
            marginTop: "8px",
            paddingLeft: "12px",
            borderLeft: "2px solid #f1f5f9",
          }}
        >
          {loadingReplies && replies.length === 0 ? (
            <div
              style={{
                padding: "12px",
                textAlign: "center",
                color: "#94a3b8",
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
                    color: "#3B82F6",
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
