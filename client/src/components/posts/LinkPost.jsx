import { ExternalLink } from "lucide-react";
import useTheme from "../../hooks/useTheme";

const LinkPost = ({ url, title, description, ogImage, caption }) => {
  const { c } = useTheme();

  const domain = (() => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  })();

  return (
    <div>
      {caption && (
        <p
          style={{
            fontSize: "15px",
            color: c.text,
            marginBottom: "10px",
            lineHeight: 1.5,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {caption}
        </p>
      )}

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none" }}
      >
        <div
          style={{
            border: `1px solid ${c.borderStrong}`,
            borderRadius: "16px",
            overflow: "hidden",
            transition: "all 0.15s ease",
            cursor: "pointer",
            background: c.bgCard,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = c.accent;
            e.currentTarget.style.boxShadow = c.shadowMd;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = c.borderStrong;
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {ogImage && (
            <div
              style={{
                background: c.bgSubtle,
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

          <div style={{ padding: "14px 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "6px",
              }}
            >
              <ExternalLink size={12} color={c.textMuted} />
              <span
                style={{
                  fontSize: "12px",
                  color: c.textMuted,
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
                  color: c.text,
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
                  color: c.textTer,
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
