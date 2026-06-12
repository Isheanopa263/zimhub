import useTheme from "../../hooks/useTheme";

const ProfileSkeleton = () => {
  const { c } = useTheme();

  const shimmerStyle = {
    background: `linear-gradient(90deg, ${c.skeletonBase} 0%, ${c.skeletonShine} 50%, ${c.skeletonBase} 100%)`,
    backgroundSize: "200% 100%",
    animation: "pSkel 1.5s infinite",
  };

  return (
    <div>
      {/* Header skeleton */}
      <div
        style={{
          background: c.bgCard,
          borderRadius: "16px",
          border: `1px solid ${c.border}`,
          padding: "20px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            ...shimmerStyle,
            width: "88px",
            height: "88px",
            borderRadius: "50%",
            marginBottom: "14px",
          }}
        />
        <div
          style={{
            ...shimmerStyle,
            width: "60%",
            height: "22px",
            borderRadius: "6px",
            marginBottom: "8px",
          }}
        />
        <div
          style={{
            ...shimmerStyle,
            width: "30%",
            height: "14px",
            borderRadius: "4px",
            marginBottom: "12px",
          }}
        />
        <div
          style={{
            ...shimmerStyle,
            width: "100%",
            height: "40px",
            borderRadius: "8px",
          }}
        />
      </div>

      {/* Post skeletons */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
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
              ...shimmerStyle,
              width: "80%",
              height: "14px",
              borderRadius: "6px",
              marginBottom: "12px",
            }}
          />
          <div
            style={{
              ...shimmerStyle,
              width: "100%",
              height: "100px",
              borderRadius: "12px",
            }}
          />
        </div>
      ))}

      <style>{`
        @keyframes pSkel {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
};

export default ProfileSkeleton;
