import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import useComments from "../../hooks/useComments";
import useTheme from "../../hooks/useTheme";
import CommentsList from "./CommentsList";
import CommentInput from "./CommentInput";

const CommentsDrawer = ({ isOpen, onClose, postId, onCommentChange }) => {
  const { c } = useTheme();
  const drawerRef = useRef(null);
  const {
    comments,
    loading,
    submitting,
    hasMore,
    totalCount,
    loadMore,
    createComment,
    deleteComment,
  } = useComments(postId, isOpen);

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* Sync count back to PostCard */
  useEffect(() => {
    if (onCommentChange && totalCount >= 0) {
      onCommentChange(totalCount);
    }
  }, [totalCount, onCommentChange]);

  /* Listen for back-button close request from useBackHandler */
  useEffect(() => {
    if (!isOpen) return;
    const el = drawerRef.current;
    if (!el) return;

    const handleCloseRequest = () => onClose();
    el.addEventListener("modal-close-request", handleCloseRequest);

    return () => {
      el.removeEventListener("modal-close-request", handleCloseRequest);
    };
  }, [isOpen, onClose]);

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
        ref={drawerRef}
        data-modal-open="true"
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
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Comments
            {totalCount > 0 && (
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: c.textTer,
                }}
              >
                ({totalCount})
              </span>
            )}
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
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
