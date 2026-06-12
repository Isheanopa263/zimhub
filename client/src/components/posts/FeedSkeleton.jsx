const SkeletonCard = () => (
  <div
    style={{
      background: "#ffffff",
      borderRadius: "16px",
      border: "1px solid #f1f5f9",
      padding: "16px",
      marginBottom: "12px",
    }}
  >
    {/* Author skeleton */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "14px",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "#f1f5f9",
          animation: "shimmer 1.5s infinite",
          backgroundSize: "200% 100%",
          backgroundImage:
            "linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)",
        }}
      />
      <div>
        <div
          style={{
            width: "120px",
            height: "14px",
            borderRadius: "6px",
            background: "#f1f5f9",
            marginBottom: "6px",
            animation: "shimmer 1.5s infinite",
            backgroundSize: "200% 100%",
            backgroundImage:
              "linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)",
          }}
        />
        <div
          style={{
            width: "80px",
            height: "10px",
            borderRadius: "4px",
            background: "#f1f5f9",
            animation: "shimmer 1.5s infinite",
            backgroundSize: "200% 100%",
            backgroundImage:
              "linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)",
          }}
        />
      </div>
    </div>

    {/* Content skeleton */}
    <div
      style={{
        width: "100%",
        height: "200px",
        borderRadius: "14px",
        background: "#f1f5f9",
        animation: "shimmer 1.5s infinite",
        backgroundSize: "200% 100%",
        backgroundImage:
          "linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)",
      }}
    />

    {/* Actions skeleton */}
    <div
      style={{
        display: "flex",
        gap: "16px",
        marginTop: "14px",
        paddingTop: "10px",
        borderTop: "1px solid #f8fafc",
      }}
    >
      {[60, 60, 40].map((w, i) => (
        <div
          key={i}
          style={{
            width: `${w}px`,
            height: "24px",
            borderRadius: "6px",
            background: "#f8fafc",
          }}
        />
      ))}
    </div>

    <style>{`
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `}</style>
  </div>
);

const FeedSkeleton = ({ count = 3 }) => (
  <div>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export default FeedSkeleton;
