import { useState } from "react";
import { BACKGROUND_STYLES } from "./TextPost";
import Button from "../ui/Button";
import useTheme from "../../hooks/useTheme";

const CreateTextForm = ({ onSubmit, loading }) => {
  const [content, setContent] = useState("");
  const [backgroundStyle, setBackgroundStyle] = useState("gradient-blue");
  const { c } = useTheme();

  const styles = Object.keys(BACKGROUND_STYLES).filter((s) => s !== "default");

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit({ content: content.trim(), backgroundStyle });
  };

  const selectedStyle = BACKGROUND_STYLES[backgroundStyle] || {};

  return (
    <div>
      <div
        style={{
          ...selectedStyle,
          borderRadius: "16px",
          padding: "24px 20px",
          minHeight: "160px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
          position: "relative",
        }}
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          maxLength={2000}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            color: selectedStyle.color || "#fff",
            fontSize: content.length > 100 ? "16px" : "20px",
            fontWeight: 600,
            textAlign: "center",
            fontFamily: "Inter, system-ui, sans-serif",
            lineHeight: 1.5,
            minHeight: "80px",
          }}
        />
      </div>

      <div style={{ textAlign: "right", marginBottom: "12px" }}>
        <span
          style={{
            fontSize: "12px",
            color: content.length > 1800 ? c.danger : c.textMuted,
          }}
        >
          {content.length}/2000
        </span>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <p
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: c.textTer,
            marginBottom: "8px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Background
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {styles.map((key) => (
            <button
              key={key}
              onClick={() => setBackgroundStyle(key)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                border:
                  backgroundStyle === key
                    ? `3px solid ${c.text}`
                    : `2px solid ${c.borderStrong}`,
                cursor: "pointer",
                ...BACKGROUND_STYLES[key],
                padding: 0,
                transition: "all 0.15s ease",
                transform: backgroundStyle === key ? "scale(1.1)" : "scale(1)",
              }}
            />
          ))}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        fullWidth
        isLoading={loading}
        disabled={!content.trim()}
        size="lg"
      >
        Post
      </Button>
    </div>
  );
};

export default CreateTextForm;
