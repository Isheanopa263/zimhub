import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import useTheme from "../../hooks/useTheme";

/**
 * Safely render markdown text
 *
 * Supports:
 *   **bold**, *italic*, ~strikethrough~
 *   # heading, ## heading
 *   `inline code`, ```code blocks```
 *   > blockquote
 *   - lists, 1. ordered lists
 *   [link](url)
 *   @username mentions (custom)
 *   #hashtag (custom)
 *
 * Variants:
 *   default — normal paragraph text
 *   compact — smaller, denser (for comments)
 *   centered — for text-only posts on colored backgrounds
 */
const MarkdownText = ({
  children,
  variant = "default",
  textColor = null,
  className = "",
}) => {
  const { c } = useTheme();

  if (!children) return null;

  const finalColor = textColor || c.text;
  const linkColor =
    textColor === "#ffffff" || textColor === "#fff"
      ? "rgba(255,255,255,0.9)"
      : c.accent;

  const sizes = {
    default: { base: "15px", heading: "17px", code: "13px" },
    compact: { base: "14px", heading: "15px", code: "12px" },
    centered: { base: "18px", heading: "22px", code: "15px" },
  };

  const size = sizes[variant] || sizes.default;

  // Pre-process text to add mentions and hashtags
  const processed = processCustomSyntax(children);

  return (
    <div
      className={`markdown-text ${className}`}
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        color: finalColor,
        fontSize: size.base,
        lineHeight: 1.55,
        wordBreak: "break-word",
        textAlign: variant === "centered" ? "center" : "left",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          p: ({ children }) => (
            <p style={{ margin: "0 0 8px", lineHeight: 1.55 }}>{children}</p>
          ),

          strong: ({ children }) => (
            <strong style={{ fontWeight: 700, color: finalColor }}>
              {children}
            </strong>
          ),

          em: ({ children }) => (
            <em style={{ fontStyle: "italic" }}>{children}</em>
          ),

          del: ({ children }) => <del style={{ opacity: 0.7 }}>{children}</del>,

          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: linkColor,
                textDecoration: "underline",
                textUnderlineOffset: "2px",
                fontWeight: 600,
              }}
            >
              {children}
            </a>
          ),

          ul: ({ children }) => (
            <ul
              style={{
                margin: "4px 0 8px",
                paddingLeft: "20px",
                lineHeight: 1.6,
              }}
            >
              {children}
            </ul>
          ),

          ol: ({ children }) => (
            <ol
              style={{
                margin: "4px 0 8px",
                paddingLeft: "20px",
                lineHeight: 1.6,
              }}
            >
              {children}
            </ol>
          ),

          li: ({ children }) => (
            <li style={{ marginBottom: "2px" }}>{children}</li>
          ),

          h1: ({ children }) => (
            <h3
              style={{
                fontSize: size.heading,
                fontWeight: 800,
                margin: "12px 0 6px",
                color: finalColor,
              }}
            >
              {children}
            </h3>
          ),

          h2: ({ children }) => (
            <h4
              style={{
                fontSize: size.heading,
                fontWeight: 700,
                margin: "10px 0 6px",
                color: finalColor,
              }}
            >
              {children}
            </h4>
          ),

          h3: ({ children }) => (
            <h5
              style={{
                fontSize: size.heading,
                fontWeight: 700,
                margin: "8px 0 4px",
                color: finalColor,
              }}
            >
              {children}
            </h5>
          ),

          blockquote: ({ children }) => (
            <blockquote
              style={{
                borderLeft: `3px solid ${c.accent}`,
                paddingLeft: "12px",
                margin: "8px 0",
                fontStyle: "italic",
                color: c.textSec,
              }}
            >
              {children}
            </blockquote>
          ),

          code: ({ inline, children }) => {
            if (inline) {
              return (
                <code
                  style={{
                    background: c.bgHover,
                    color: c.accent,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: size.code,
                    fontFamily: "Monaco, Consolas, monospace",
                  }}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre
                style={{
                  background: c.bgSubtle,
                  border: `1px solid ${c.border}`,
                  borderRadius: "8px",
                  padding: "12px",
                  margin: "8px 0",
                  overflow: "auto",
                  fontSize: size.code,
                  fontFamily: "Monaco, Consolas, monospace",
                  lineHeight: 1.4,
                  color: c.text,
                }}
              >
                <code>{children}</code>
              </pre>
            );
          },

          hr: () => (
            <hr
              style={{
                border: "none",
                borderTop: `1px solid ${c.border}`,
                margin: "12px 0",
              }}
            />
          ),
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
};

/**
 * Pre-process custom syntax:
 *   @username  →  [@username](/profile/username)
 *   #hashtag   →  [#hashtag](/search?q=hashtag&tab=posts)
 */
const processCustomSyntax = (text) => {
  if (typeof text !== "string") return text;

  return (
    text
      // @mentions
      .replace(/(^|\s)@([a-zA-Z0-9_]{3,30})/g, "$1[@$2](/profile/$2)")
      // #hashtags
      .replace(
        /(^|\s)#([a-zA-Z0-9_]{2,30})/g,
        "$1[#$2](/search?q=$2&tab=posts)",
      )
  );
};

export default MarkdownText;
