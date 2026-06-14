import { useState, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import Button from "../ui/Button";
import useTheme from "../../hooks/useTheme";
import MarkdownEditor from "../ui/MarkdownEditor";

const CreateImageForm = ({ onSubmit, loading }) => {
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const fileRef = useRef();
  const { c } = useTheme();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
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
    formData.append("image", file);
    if (caption.trim()) formData.append("caption", caption.trim());
    onSubmit(formData);
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />

      {preview ? (
        <div style={{ position: "relative", marginBottom: "14px" }}>
          <img
            src={preview}
            alt="Preview"
            style={{
              width: "100%",
              borderRadius: "14px",
              maxHeight: "300px",
              objectFit: "cover",
            }}
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
            transition: "all 0.15s ease",
            background: c.bgSubtle,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = c.accent)}
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = c.borderStrong)
          }
        >
          <ImagePlus
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
            Click to upload image
          </p>
          <p style={{ fontSize: "12px", color: c.textMuted, margin: 0 }}>
            JPEG, PNG, GIF, WebP — max 5MB
          </p>
        </div>
      )}

      <MarkdownEditor
        value={caption}
        onChange={setCaption}
        placeholder="Add a caption (optional)"
        maxLength={500}
        rows={3}
        showPreviewToggle={true}
      />

      <Button
        onClick={handleSubmit}
        fullWidth
        isLoading={loading}
        disabled={!file}
        size="lg"
      >
        Post Image
      </Button>
    </div>
  );
};

export default CreateImageForm;
