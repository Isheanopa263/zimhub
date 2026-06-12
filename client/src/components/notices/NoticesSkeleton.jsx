import useTheme from "../../hooks/useTheme";

const NoticesSkeleton = ({ count = 3 }) => {
  const { c } = useTheme();

  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonNotice key={i} c={c} />
      ))}
    </div>
  );
};

const SkeletonNotice = ({ c }) => (
  <div
    style={{
      background: c.bgCard,
      borderRadius: "16px",
      border: `1px solid ${c.border}`,
      padding: "16px",
      marginBottom: "12px",
    }}
  >
    <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
      <Shimmer
        c={c}
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "50%",
        }}
      />
      <div style={{ flex: 1 }}>
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
          style={{
            width: "80px",
            height: "10px",
            borderRadius: "4px",
          }}
        />
      </div>
    </div>

    <Shimmer
      c={c}
      style={{
        width: "70%",
        height: "16px",
        borderRadius: "6px",
        marginBottom: "10px",
      }}
    />

    <Shimmer
      c={c}
      style={{
        width: "100%",
        height: "60px",
        borderRadius: "8px",
        marginBottom: "12px",
      }}
    />

    <div style={{ display: "flex", gap: "8px" }}>
      {[1, 2].map((i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: "34px",
            borderRadius: "10px",
            background: c.bgSubtle,
          }}
        />
      ))}
    </div>

    <style>{`
      @keyframes noticeShimmer {
        0%   { background-position: -200% 0; }
        100% { background-position:  200% 0; }
      }
    `}</style>
  </div>
);

const Shimmer = ({ style, c }) => (
  <div
    style={{
      ...style,
      background: `linear-gradient(90deg, ${c.skeletonBase} 0%, ${c.skeletonShine} 50%, ${c.skeletonBase} 100%)`,
      backgroundSize: "200% 100%",
      animation: "noticeShimmer 1.5s infinite",
    }}
  />
);

export default NoticesSkeleton;
