import useTheme from "../../hooks/useTheme";

const FeedSkeleton = ({ count = 4, fullHeight = false }) => {
  const { c } = useTheme();

  if (fullHeight) {
    return (
      <div
        style={{
          height: "100%",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "4px solid rgba(255,255,255,0.1)",
            borderTop: `4px solid ${c.accent}`,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`
          @keyframes spin {
            from { transform: rotate(0); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Regular skeleton for other uses (profile page, etc.)
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            height: "400px",
            background: c.bgCard,
            borderRadius: "16px",
            marginBottom: "12px",
            border: `1px solid ${c.border}`,
          }}
        />
      ))}
    </div>
  );
};

export default FeedSkeleton;
