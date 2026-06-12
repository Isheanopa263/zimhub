import { useState } from "react";
import { Link2 } from "lucide-react";
import Button from "../ui/Button";
import useTheme from "../../hooks/useTheme";

const CreateLinkForm = ({ onSubmit, loading }) => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [caption, setCaption] = useState("");
  const { c } = useTheme();

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: `2px solid ${c.borderStrong}`,
    background: c.bgInput,
    color: c.text,
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
    outline: "none",
    marginBottom: "12px",
  };

  const handleSubmit = () => {
    if (!url.trim()) return;
    onSubmit({
      url: url.trim(),
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      caption: caption.trim() || undefined,
    });
  };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <Link2 size={40} color={c.textMuted} style={{ margin: "0 auto 8px" }} />
      </div>

      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste URL here *"
        type="url"
        style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = c.accent)}
        onBlur={(e) => (e.target.style.borderColor = c.borderStrong)}
      />

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Link title (optional)"
        style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = c.accent)}
        onBlur={(e) => (e.target.style.borderColor = c.borderStrong)}
      />

      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Link description (optional)"
        style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = c.accent)}
        onBlur={(e) => (e.target.style.borderColor = c.borderStrong)}
      />

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Your thoughts on this link (optional)"
        maxLength={500}
        rows={2}
        style={{ ...inputStyle, resize: "none" }}
        onFocus={(e) => (e.target.style.borderColor = c.accent)}
        onBlur={(e) => (e.target.style.borderColor = c.borderStrong)}
      />

      <Button
        onClick={handleSubmit}
        fullWidth
        isLoading={loading}
        disabled={!url.trim()}
        size="lg"
      >
        Post Link
      </Button>
    </div>
  );
};

export default CreateLinkForm;
