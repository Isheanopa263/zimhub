import useTheme from "../../hooks/useTheme";

const SkeletonCard = ({ c }) => (
  <div
    style={{
      background: c.bgCard,
      borderRadius: "16px",
      border: `1px solid ${c.border}`,
      padding: "16px",
      marginBottom: "12px",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "14px",
      }}
    >
      <Shimmer
        c={c}
        style={{ width: "40px", height: "40px", borderRadius: "50%" }}
      />
      <div>
        <Shimmer
          c={c}
          style={{
            width: "120px",
            height: "14px",
            borderRadius: "6px",
            marginBottom: "6px",
          }}
        />
        <Shimmer
          c={c}
          style={{ width: "80px", height: "10px", borderRadius: "4px" }}
        />
      </div>
    </div>
    <Shimmer
      c={c}
      style={{ width: "100%", height: "200px", borderRadius: "14px" }}
    />
    <div
      style={{
        display: "flex",
        gap: "16px",
        marginTop: "14px",
        paddingTop: "10px",
        borderTop: `1px solid ${c.border}`,
      }}
    >
      {[60, 60, 40].map((w, i) => (
        <div
          key={i}
          style={{
            width: `${w}px`,
            height: "24px",
            borderRadius: "6px",
            background: c.bgSubtle,
          }}
        />
      ))}
    </div>
  </div>
);

const Shimmer = ({ style, c }) => (
  <div
    style={{
      ...style,
      background: `linear-gradient(90deg, ${c.skeletonBase} 0%, ${c.skeletonShine} 50%, ${c.skeletonBase} 100%)`,
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
    }}
  />
);

const FeedSkeleton = ({ count = 3 }) => {
  const { c } = useTheme();
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} c={c} />
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default FeedSkeleton;
