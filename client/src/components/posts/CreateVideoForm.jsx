import { useState, useRef } from "react";
import { Video, X } from "lucide-react";
import Button from "../ui/Button";
import useTheme from "../../hooks/useTheme";
import toast from "react-hot-toast";

const MAX_SIZE_MB = 100;

const CreateVideoForm = ({ onSubmit, loading }) => {
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const fileRef = useRef();
  const { c } = useTheme();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    // Validate type
    const allowed = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
    ];
    if (!allowed.includes(selected.type)) {
      toast.error("Only MP4, WebM, MOV and AVI videos are supported");
      e.target.value = "";
      return;
    }

    // Validate size
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Video must be under ${MAX_SIZE_MB}MB`);
      e.target.value = "";
      return;
    }

    setFile(selected);
    setFileName(selected.name);
    setFileSize(selected.size);
    setPreview(URL.createObjectURL(selected));
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setFileName("");
    setFileSize(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!file) {
      toast.error("Please select a video");
      return;
    }

    const formData = new FormData();

    // Field name MUST match backend: uploadVideo.single('video')
    formData.append("video", file);

    if (caption.trim()) {
      formData.append("caption", caption.trim());
    }

    onSubmit(formData);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
        hidden
        onChange={handleFileChange}
      />

      {/* Preview */}
      {preview ? (
        <div
          style={{
            position: "relative",
            marginBottom: "14px",
            borderRadius: "14px",
            overflow: "hidden",
            background: "#000",
          }}
        >
          <video
            src={preview}
            controls
            playsInline
            style={{
              width: "100%",
              maxHeight: "300px",
              display: "block",
            }}
          />

          {/* Remove button */}
          <button
            type="button"
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
              backdropFilter: "blur(4px)",
            }}
          >
            <X size={16} />
          </button>

          {/* File info */}
          <div
            style={{
              padding: "10px 14px",
              background: c.bgSubtle,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: c.textTer,
                fontFamily: "Inter, sans-serif",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "200px",
              }}
            >
              📹 {fileName}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: c.textMuted,
                fontFamily: "Inter, sans-serif",
                flexShrink: 0,
              }}
            >
              {formatSize(fileSize)}
            </span>
          </div>
        </div>
      ) : (
        /* Upload area */
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${c.borderStrong}`,
            borderRadius: "16px",
            padding: "40px 20px",
            textAlign: "center",
            cursor: "pointer",
            marginBottom: "14px",
            background: c.bgSubtle,
            transition: "all 0.15s ease",
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
              fontFamily: "Inter, sans-serif",
            }}
          >
            Tap to upload video
          </p>
          <p
            style={{
              fontSize: "12px",
              color: c.textMuted,
              margin: 0,
              fontFamily: "Inter, sans-serif",
            }}
          >
            MP4, WebM, MOV, AVI · Max {MAX_SIZE_MB}MB
          </p>
        </div>
      )}

      {/* Caption */}
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Add a caption (optional)"
        maxLength={500}
        rows={3}
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

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        fullWidth
        isLoading={loading}
        disabled={!file}
        size="lg"
      >
        {file ? "Post Video" : "Select Video First"}
      </Button>
    </div>
  );
};

export default CreateVideoForm;
