import { useState } from "react";
import { BACKGROUND_STYLES } from "./TextPost";
import Button from "../ui/Button";
import MarkdownEditor from "../ui/MarkdownEditor";
import useTheme from "../../hooks/useTheme";

const CreateTextForm = ({ onSubmit, loading }) => {
  const [content, setContent] = useState("");
  const [backgroundStyle, setBackgroundStyle] = useState("default");
  const { c } = useTheme();

  const styles = Object.keys(BACKGROUND_STYLES);

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit({ content: content.trim(), backgroundStyle });
  };

  return (
    <div>
      {/* Markdown editor */}
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder="What's on your mind?"
        maxLength={2000}
        rows={5}
        autoFocus
      />

      {/* Background picker — only show if 'default' is selected */}
      <div style={{ marginTop: "16px" }}>
        <p
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: c.textTer,
            marginBottom: "8px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Background style{" "}
          {backgroundStyle !== "default" && "(rich formatting limited)"}
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {styles.map((key) => (
            <button
              key={key}
              onClick={() => setBackgroundStyle(key)}
              title={key === "default" ? "Plain (with formatting)" : key}
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

      <div style={{ marginTop: "20px" }}>
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
    </div>
  );
};

export default CreateTextForm;
