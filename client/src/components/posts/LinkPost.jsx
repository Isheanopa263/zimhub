import { ExternalLink } from "lucide-react";

const LinkPost = ({ url, title, description, ogImage, caption }) => {
  const domain = (() => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  })();

  return (
    <div>
      {/* Caption above */}
      {caption && (
        <p
          style={{
            fontSize: "15px",
            color: "#0F172A",
            marginBottom: "10px",
            lineHeight: 1.5,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {caption}
        </p>
      )}

      {/* Link card */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none" }}
      >
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            overflow: "hidden",
            transition: "all 0.15s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#3B82F6";
            e.currentTarget.style.boxShadow = "0 2px 12px rgba(59,130,246,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* OG Image */}
          {ogImage && (
            <div
              style={{
                background: "#f1f5f9",
                maxHeight: "200px",
                overflow: "hidden",
              }}
            >
              <img
                src={ogImage}
                alt={title}
                style={{ width: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          )}

          {/* Content */}
          <div style={{ padding: "14px 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "6px",
              }}
            >
              <ExternalLink size={12} color="#94a3b8" />
              <span
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {domain}
              </span>
            </div>

            {title && (
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#0F172A",
                  margin: "0 0 4px",
                  fontFamily: "Inter, sans-serif",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {title}
              </h4>
            )}

            {description && (
              <p
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  margin: 0,
                  fontFamily: "Inter, sans-serif",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      </a>
    </div>
  );
};

export default LinkPost;
