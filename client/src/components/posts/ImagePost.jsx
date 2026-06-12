import { useState } from "react";
import { getImageUrl } from "../../utils/media";

const ImagePost = ({ imageUrl, caption }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const src = getImageUrl(imageUrl);

  // No URL → don't render anything
  if (!src) return null;

  if (error) {
    return (
      <div
        style={{
          background: "#f8fafc",
          borderRadius: "14px",
          padding: "32px 20px",
          textAlign: "center",
          border: "1px dashed #e2e8f0",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ fontSize: "28px", marginBottom: "8px" }}>🖼️</div>
        <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>
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
        background: "#f1f5f9",
        position: "relative",
        minHeight: loaded ? "auto" : "240px",
      }}
    >
      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%)",
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
