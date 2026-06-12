import { useState, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import Button from "../ui/Button";

const CreateImageForm = ({ onSubmit, loading }) => {
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const fileRef = useRef();

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
      {/* File input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />

      {/* Preview or Upload area */}
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
            border: "2px dashed #e2e8f0",
            borderRadius: "16px",
            padding: "40px",
            textAlign: "center",
            cursor: "pointer",
            marginBottom: "14px",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
        >
          <ImagePlus
            size={40}
            color="#94a3b8"
            style={{ margin: "0 auto 12px" }}
          />
          <p
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#64748b",
              margin: "0 0 4px",
            }}
          >
            Click to upload image
          </p>
          <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
            JPEG, PNG, GIF, WebP — max 5MB
          </p>
        </div>
      )}

      {/* Caption */}
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
          border: "2px solid #e2e8f0",
          background: "#fff",
          resize: "none",
          fontSize: "14px",
          fontFamily: "Inter, sans-serif",
          outline: "none",
          marginBottom: "14px",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
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
