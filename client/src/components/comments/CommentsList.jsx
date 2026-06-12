import CommentItem from "./CommentItem";
import useTheme from "../../hooks/useTheme";

const CommentsList = ({
  comments,
  onDelete,
  onReply,
  loading,
  hasMore,
  onLoadMore,
}) => {
  const { c } = useTheme();

  if (loading && comments.length === 0) {
    return (
      <div style={{ padding: "20px" }}>
        {[1, 2, 3].map((i) => (
          <SkeletonComment key={i} c={c} />
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
            color: c.textTer,
            margin: "0 0 4px",
            fontWeight: 600,
          }}
        >
          No comments yet
        </p>
        <p style={{ fontSize: "12px", color: c.textMuted, margin: 0 }}>
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
            color: c.accent,
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

const SkeletonComment = ({ c }) => (
  <div style={{ display: "flex", gap: "10px", padding: "12px 0" }}>
    <div
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: `linear-gradient(90deg, ${c.skeletonBase}, ${c.skeletonShine}, ${c.skeletonBase})`,
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
          background: `linear-gradient(90deg, ${c.skeletonBase}, ${c.skeletonShine}, ${c.skeletonBase})`,
          backgroundSize: "200% 100%",
          animation: "commentShimmer 1.5s infinite",
        }}
      />
    </div>
    <style>{`
      @keyframes commentShimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `}</style>
  </div>
);

export default CommentsList;
