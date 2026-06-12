import { useEffect } from "react";
import { X } from "lucide-react";
import useComments from "../../hooks/useComments";
import CommentsList from "./CommentsList";
import CommentInput from "./CommentInput";

const CommentsDrawer = ({ isOpen, onClose, postId, onCommentChange }) => {
  const {
    comments,
    loading,
    submitting,
    hasMore,
    loadMore,
    createComment,
    deleteComment,
  } = useComments(postId, isOpen);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Sync count back to PostCard
  useEffect(() => {
    if (onCommentChange) {
      const totalComments = comments.reduce(
        (sum, c) => sum + 1 + (c.replyCount || 0),
        0,
      );
      onCommentChange(totalComments);
    }
  }, [comments, onCommentChange]);

  /* Top-level comment */
  const handleSubmit = async (content) => {
    await createComment(content, null);
  };

  /* Reply to a comment */
  const handleReply = async (parentCommentId, content) => {
    return await createComment(content, parentCommentId);
  };

  /* Delete top-level or reply */
  const handleDelete = async (commentId, wasReply = false, parentId = null) => {
    await deleteComment(commentId, wasReply, parentId);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "85vh",
          maxHeight: "700px",
          background: "#ffffff",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -10px 50px rgba(0,0,0,0.25)",
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.3s ease",
        }}
      >
        {/* Handle */}
        <div
          style={{
            width: "40px",
            height: "4px",
            background: "#cbd5e1",
            borderRadius: "4px",
            margin: "10px auto 0",
            flexShrink: 0,
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid #f1f5f9",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "#0F172A",
              margin: 0,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Comments
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "10px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#64748b",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <CommentsList
            comments={comments}
            onDelete={handleDelete}
            onReply={handleReply}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
          />
        </div>

        {/* Input */}
        <CommentInput
          onSubmit={handleSubmit}
          submitting={submitting}
          autoFocus={true}
        />
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default CommentsDrawer;
