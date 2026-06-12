import CommentItem from "./CommentItem";

const CommentsList = ({
  comments,
  onDelete,
  onReply,
  loading,
  hasMore,
  onLoadMore,
}) => {
  if (loading && comments.length === 0) {
    return (
      <div style={{ padding: "20px" }}>
        {[1, 2, 3].map((i) => (
          <SkeletonComment key={i} />
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ fontSize: "36px", marginBottom: "10px" }}>💬</div>
        <p
          style={{
            fontSize: "14px",
            color: "#64748b",
            margin: "0 0 4px",
            fontWeight: 600,
          }}
        >
          No comments yet
        </p>
        <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
          Be the first to share your thoughts
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 16px" }}>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onDelete={onDelete}
          onReply={onReply}
        />
      ))}

      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={loading}
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            background: "transparent",
            border: "none",
            color: "#3B82F6",
            fontSize: "13px",
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
            fontFamily: "Inter, sans-serif",
            marginTop: "8px",
          }}
        >
          {loading ? "Loading..." : "Load more comments"}
        </button>
      )}
    </div>
  );
};

const SkeletonComment = () => (
  <div style={{ display: "flex", gap: "10px", padding: "12px 0" }}>
    <div
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background:
          "linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%)",
        backgroundSize: "200% 100%",
        animation: "commentShimmer 1.5s infinite",
        flexShrink: 0,
      }}
    />
    <div style={{ flex: 1 }}>
      <div
        style={{
          height: "60px",
          borderRadius: "14px",
          background:
            "linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%)",
          backgroundSize: "200% 100%",
          animation: "commentShimmer 1.5s infinite",
        }}
      />
    </div>
    <style>{`
      @keyframes commentShimmer {
        0%   { background-position: -200% 0; }
        100% { background-position:  200% 0; }
      }
    `}</style>
  </div>
);

export default CommentsList;
