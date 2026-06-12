import { useState } from "react";
import { Link2 } from "lucide-react";
import Button from "../ui/Button";

const CreateLinkForm = ({ onSubmit, loading }) => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [caption, setCaption] = useState("");

  const handleSubmit = () => {
    if (!url.trim()) return;
    onSubmit({
      url: url.trim(),
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      caption: caption.trim() || undefined,
    });
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
    outline: "none",
    marginBottom: "12px",
    background: "#fff",
  };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <Link2 size={40} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
      </div>

      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste URL here *"
        type="url"
        style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
      />

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Link title (optional)"
        style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
      />

      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Link description (optional)"
        style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
      />

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Your thoughts on this link (optional)"
        maxLength={500}
        rows={2}
        style={{ ...inputStyle, resize: "none" }}
        onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
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
