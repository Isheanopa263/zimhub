import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import useTheme from "../../hooks/useTheme";
import { useQuickView } from "../../contexts/QuickViewContext";

/**
 * Custom sanitize schema — explicit about what we allow
 */
const safeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "span", // Allow span for our custom mention/hashtag rendering
  ],
  attributes: {
    ...defaultSchema.attributes,
    span: ["className", "data*"],
    a: [...(defaultSchema.attributes?.a || []), "className", "data*"],
  },
};

const MarkdownText = ({
  children,
  variant = "default",
  textColor = null,
  className = "",
}) => {
  const { c } = useTheme();
  const { openProfile, openHashtag } = useQuickView();

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

  /**
   * Render text content with @mentions and #hashtags as interactive elements
   * This bypasses markdown link parsing entirely for safety
   */
  const renderTextWithMentions = (text) => {
    if (typeof text !== "string") return text;

    const parts = [];
    const regex = /(@[a-zA-Z0-9_]{3,30}|#[a-zA-Z0-9_]{2,30})/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const token = match[0];
      const isMention = token.startsWith("@");
      const value = token.substring(1); // Remove @ or #

      parts.push(
        <button
          key={`${match.index}-${token}`}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isMention) {
              openProfile(value);
            } else {
              openHashtag(value);
            }
          }}
          style={{
            background: `${linkColor}15`,
            color: linkColor,
            padding: "1px 6px",
            borderRadius: "6px",
            fontWeight: 700,
            fontSize: "inherit",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            display: "inline",
            textDecoration: "none",
            transition: "background 0.15s ease",
            verticalAlign: "baseline",
            lineHeight: "inherit",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${linkColor}30`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${linkColor}15`;
          }}
        >
          {token}
        </button>,
      );

      lastIndex = match.index + token.length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  /**
   * Process children to handle mentions/hashtags in any text node
   */
  const processChildren = (children) => {
    if (typeof children === "string") {
      return renderTextWithMentions(children);
    }
    if (Array.isArray(children)) {
      return children.map((child, idx) => {
        if (typeof child === "string") {
          return <span key={idx}>{renderTextWithMentions(child)}</span>;
        }
        return child;
      });
    }
    return children;
  };

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
        rehypePlugins={[[rehypeSanitize, safeSchema]]}
        components={{
          p: ({ children }) => (
            <p style={{ margin: "0 0 8px", lineHeight: 1.55 }}>
              {processChildren(children)}
            </p>
          ),

          strong: ({ children }) => (
            <strong style={{ fontWeight: 700, color: finalColor }}>
              {processChildren(children)}
            </strong>
          ),

          em: ({ children }) => (
            <em style={{ fontStyle: "italic" }}>{processChildren(children)}</em>
          ),

          del: ({ children }) => (
            <del style={{ opacity: 0.7 }}>{processChildren(children)}</del>
          ),

          a: ({ href, children }) => {
            // Normal external links (markdown [text](url) syntax)
            return (
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
            );
          },

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
            <li style={{ marginBottom: "2px" }}>{processChildren(children)}</li>
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
              {processChildren(children)}
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
              {processChildren(children)}
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
              {processChildren(children)}
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
              {processChildren(children)}
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
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownText;
