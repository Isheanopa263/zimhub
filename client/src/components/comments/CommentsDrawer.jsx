import { useEffect } from "react";
import { X } from "lucide-react";
import useComments from "../../hooks/useComments";
import useTheme from "../../hooks/useTheme";
import CommentsList from "./CommentsList";
import CommentInput from "./CommentInput";

const CommentsDrawer = ({ isOpen, onClose, postId, onCommentChange }) => {
  const { c } = useTheme();
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
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (onCommentChange) {
      const total = comments.reduce(
        (sum, x) => sum + 1 + (x.replyCount || 0),
        0,
      );
      onCommentChange(total);
    }
  }, [comments, onCommentChange]);

  const handleSubmit = async (content) => await createComment(content, null);
  const handleReply = async (parentId, content) =>
    await createComment(content, parentId);
  const handleDelete = async (id, wasReply, parentId) =>
    await deleteComment(id, wasReply, parentId);

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--backdrop)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
          animation: "fadeIn 0.2s ease",
        }}
      />

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "85vh",
          maxHeight: "700px",
          background: c.bgCard,
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -10px 50px rgba(0,0,0,0.25)",
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.3s ease",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "4px",
            background: c.borderStrong,
            borderRadius: "4px",
            margin: "10px auto 0",
            flexShrink: 0,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: `1px solid ${c.border}`,
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: c.text,
              margin: 0,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Comments
          </h2>
          <button
            onClick={onClose}
            style={{
              background: c.bgHover,
              border: "none",
              borderRadius: "10px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: c.textTer,
            }}
          >
            <X size={16} />
          </button>
        </div>

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

        <CommentInput
          onSubmit={handleSubmit}
          submitting={submitting}
          autoFocus
        />
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default CommentsDrawer;
