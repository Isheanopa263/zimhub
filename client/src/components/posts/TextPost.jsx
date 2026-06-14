import MarkdownText from "../ui/MarkdownText";

const BACKGROUND_STYLES = {
  default: { background: "#ffffff", color: "#0F172A" },
  "gradient-blue": {
    background: "linear-gradient(135deg, #3B82F6, #1d4ed8)",
    color: "#ffffff",
  },
  "gradient-purple": {
    background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    color: "#ffffff",
  },
  "gradient-green": {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#ffffff",
  },
  "gradient-orange": {
    background: "linear-gradient(135deg, #f97316, #ea580c)",
    color: "#ffffff",
  },
  "gradient-pink": {
    background: "linear-gradient(135deg, #ec4899, #db2777)",
    color: "#ffffff",
  },
  "gradient-dark": {
    background: "linear-gradient(135deg, #1e293b, #0f172a)",
    color: "#ffffff",
  },
  "solid-blue": { background: "#3B82F6", color: "#ffffff" },
  "solid-purple": { background: "#8b5cf6", color: "#ffffff" },
  "solid-green": { background: "#10b981", color: "#ffffff" },
  "solid-dark": { background: "#1e293b", color: "#ffffff" },
};

const TextPost = ({ content, backgroundStyle = "default" }) => {
  const style = BACKGROUND_STYLES[backgroundStyle] || BACKGROUND_STYLES.default;
  const isDefault = backgroundStyle === "default";

  // Default style → full markdown
  if (isDefault) {
    return (
      <div style={{ padding: 0 }}>
        <MarkdownText variant="default">{content}</MarkdownText>
      </div>
    );
  }

  // Styled background → centered, no markdown (simpler)
  return (
    <div
      style={{
        ...style,
        borderRadius: "16px",
        padding: "28px 20px",
        minHeight: "140px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      <MarkdownText variant="centered" textColor={style.color}>
        {content}
      </MarkdownText>
    </div>
  );
};

export { BACKGROUND_STYLES };
export default TextPost;
