import { useState } from "react";
import { getImageUrl } from "../../utils/media";
import useTheme from "../../hooks/useTheme";

const ImagePost = ({ imageUrl, caption }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const { c } = useTheme();

  const src = getImageUrl(imageUrl);
  if (!src) return null;

  if (error) {
    return (
      <div
        style={{
          background: c.bgSubtle,
          borderRadius: "14px",
          padding: "32px 20px",
          textAlign: "center",
          border: `1px dashed ${c.borderStrong}`,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ fontSize: "28px", marginBottom: "8px" }}>🖼️</div>
        <p style={{ color: c.textMuted, fontSize: "13px", margin: 0 }}>
          Image could not be loaded
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: "14px",
        overflow: "hidden",
        background: c.skeletonBase,
        position: "relative",
        minHeight: loaded ? "auto" : "240px",
      }}
    >
      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, ${c.skeletonBase} 0%, ${c.skeletonShine} 50%, ${c.skeletonBase} 100%)`,
            backgroundSize: "200% 100%",
            animation: "imgShimmer 1.5s infinite",
          }}
        />
      )}

      <img
        src={src}
        alt={caption || "Post image"}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          width: "100%",
          maxHeight: "500px",
          objectFit: "cover",
          display: "block",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      <style>{`
        @keyframes imgShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
};

export default ImagePost;
