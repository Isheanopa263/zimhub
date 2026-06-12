import { useState, useRef } from "react";
import { Video, X } from "lucide-react";
import Button from "../ui/Button";
import useTheme from "../../hooks/useTheme";

const CreateVideoForm = ({ onSubmit, loading }) => {
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const fileRef = useRef();
  const { c } = useTheme();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (selected.size > 100 * 1024 * 1024) {
      alert("Video must be under 100MB");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("video", file);
    if (caption.trim()) formData.append("caption", caption.trim());
    onSubmit(formData);
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        hidden
        onChange={handleFileChange}
      />

      {preview ? (
        <div style={{ position: "relative", marginBottom: "14px" }}>
          <video
            src={preview}
            controls
            style={{ width: "100%", borderRadius: "14px", maxHeight: "300px" }}
          />
          <button
            onClick={clearFile}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              background: "rgba(0,0,0,0.6)",
              border: "none",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${c.borderStrong}`,
            borderRadius: "16px",
            padding: "40px",
            textAlign: "center",
            cursor: "pointer",
            marginBottom: "14px",
            background: c.bgSubtle,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = c.accent)}
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = c.borderStrong)
          }
        >
          <Video
            size={40}
            color={c.textMuted}
            style={{ margin: "0 auto 12px" }}
          />
          <p
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: c.textTer,
              margin: "0 0 4px",
            }}
          >
            Click to upload video
          </p>
          <p style={{ fontSize: "12px", color: c.textMuted, margin: 0 }}>
            MP4, WebM, MOV — max 100MB
          </p>
        </div>
      )}

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Add a caption (optional)"
        maxLength={500}
        rows={2}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "12px",
          border: `2px solid ${c.borderStrong}`,
          background: c.bgInput,
          color: c.text,
          resize: "none",
          fontSize: "14px",
          fontFamily: "Inter, sans-serif",
          outline: "none",
          marginBottom: "14px",
        }}
        onFocus={(e) => (e.target.style.borderColor = c.accent)}
        onBlur={(e) => (e.target.style.borderColor = c.borderStrong)}
      />

      <Button
        onClick={handleSubmit}
        fullWidth
        isLoading={loading}
        disabled={!file}
        size="lg"
      >
        Post Video
      </Button>
    </div>
  );
};

export default CreateVideoForm;
