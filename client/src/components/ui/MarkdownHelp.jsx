import useTheme from "../../hooks/useTheme";

const SHORTCUTS = [
  { syntax: "**text**", result: "bold", example: "bold" },
  { syntax: "*text*", result: "italic", example: "italic" },
  { syntax: "~~text~~", result: "strikethrough", example: "strikethrough" },
  { syntax: "`code`", result: "inline code", example: "code" },
  { syntax: "> quote", result: "blockquote", example: "quoted text" },
  { syntax: "- item", result: "bullet list", example: "• item" },
  { syntax: "1. item", result: "numbered list", example: "1. item" },
  { syntax: "[text](url)", result: "link", example: "link" },
  { syntax: "@username", result: "mention user", example: "@user" },
  { syntax: "#hashtag", result: "hashtag", example: "#tag" },
];

const MarkdownHelp = () => {
  const { c } = useTheme();

  return (
    <div
      style={{
        padding: "12px 14px",
        background: c.bgSubtle,
        borderRadius: "12px",
        border: `1px solid ${c.border}`,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <p
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: c.text,
          margin: "0 0 8px",
        }}
      >
        📝 Formatting shortcuts
      </p>

      <div style={{ display: "grid", gap: "4px" }}>
        {SHORTCUTS.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "11px",
            }}
          >
            <code
              style={{
                background: c.bgCard,
                color: c.accent,
                padding: "1px 5px",
                borderRadius: "4px",
                fontFamily: "Monaco, monospace",
                minWidth: "90px",
              }}
            >
              {s.syntax}
            </code>
            <span style={{ color: c.textTer }}>→ {s.result}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarkdownHelp;
