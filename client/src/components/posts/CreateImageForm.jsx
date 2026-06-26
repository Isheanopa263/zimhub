import { useState, useRef } from "react";
import { ImagePlus, X, GripVertical, MoveLeft, MoveRight } from "lucide-react";
import Button from "../ui/Button";
import MarkdownEditor from "../ui/MarkdownEditor";
import useTheme from "../../hooks/useTheme";
import toast from "react-hot-toast";

const MAX_IMAGES = 10;
const MAX_SIZE_MB = 5;

const CreateImageForm = ({ onSubmit, loading }) => {
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState([]); // [{ file, preview, id }, ...]
  const fileRef = useRef();
  const { c } = useTheme();

  /* ── Handle file selection ── */
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (!newFiles.length) return;

    addFiles(newFiles);
    e.target.value = ""; // Allow selecting the same files again
  };

  const addFiles = (newFiles) => {
    // Check total count
    if (files.length + newFiles.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images per post`);
      return;
    }

    // Validate each file
    const validFiles = [];
    for (const file of newFiles) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" is larger than ${MAX_SIZE_MB}MB`);
        continue;
      }
      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
        id: `${file.name}-${Date.now()}-${Math.random()}`,
      });
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  /* ── Remove a file ── */
  const removeFile = (id) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  /* ── Reorder files ── */
  const moveFile = (id, direction) => {
    setFiles((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      if (index === -1) return prev;

      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  /* ── Submit ── */
  const handleSubmit = () => {
    if (files.length === 0) {
      toast.error("Please add at least one image");
      return;
    }

    const formData = new FormData();
    files.forEach(({ file }) => formData.append("images", file)); // Note: 'images' plural
    if (caption.trim()) formData.append("caption", caption.trim());
    onSubmit(formData);
  };

  /* ── Drag & drop ── */
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (droppedFiles.length) addFiles(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  /* ── Render ── */
  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple /* ← Allow multiple selection */
        hidden
        onChange={handleFileChange}
      />

      {/* Image Previews Grid */}
      {files.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              files.length === 1
                ? "1fr"
                : "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "8px",
            marginBottom: "14px",
          }}
        >
          {files.map((item, idx) => (
            <ImagePreview
              key={item.id}
              preview={item.preview}
              index={idx}
              total={files.length}
              onRemove={() => removeFile(item.id)}
              onMoveUp={() => moveFile(item.id, "up")}
              onMoveDown={() => moveFile(item.id, "down")}
              isSingle={files.length === 1}
              c={c}
            />
          ))}

          {/* Add more button (if under max) */}
          {files.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                aspectRatio: "1",
                border: `2px dashed ${c.borderStrong}`,
                borderRadius: "12px",
                background: c.bgSubtle,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                color: c.textMuted,
                fontSize: "12px",
                fontFamily: "Inter, sans-serif",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = c.accent;
                e.currentTarget.style.color = c.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = c.borderStrong;
                e.currentTarget.style.color = c.textMuted;
              }}
            >
              <ImagePlus size={24} />
              Add more
            </button>
          )}
        </div>
      )}

      {/* Upload area (when no files) */}
      {files.length === 0 && (
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: `2px dashed ${dragOver ? c.accent : c.borderStrong}`,
            borderRadius: "16px",
            padding: "40px 20px",
            textAlign: "center",
            cursor: "pointer",
            marginBottom: "14px",
            transition: "all 0.15s ease",
            background: dragOver ? c.accentLight : c.bgSubtle,
          }}
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
            {dragOver ? "Drop images here" : "Click to upload images"}
          </p>
          <p style={{ fontSize: "12px", color: c.textMuted, margin: 0 }}>
            Up to {MAX_IMAGES} images · Max {MAX_SIZE_MB}MB each
          </p>
        </div>
      )}

      {/* Status row */}
      {files.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
            padding: "8px 12px",
            background: c.bgSubtle,
            borderRadius: "8px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              color: c.textTer,
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {files.length} of {MAX_IMAGES} images selected
          </span>
          <button
            type="button"
            onClick={() => {
              files.forEach((f) => URL.revokeObjectURL(f.preview));
              setFiles([]);
            }}
            style={{
              background: "none",
              border: "none",
              color: c.danger,
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Caption */}
      <MarkdownEditor
        value={caption}
        onChange={setCaption}
        placeholder="Add a caption (optional) "
        maxLength={500}
        rows={2}
        showPreviewToggle
      />

      {/* Submit */}
      <div style={{ marginTop: "14px" }}>
        <Button
          onClick={handleSubmit}
          fullWidth
          isLoading={loading}
          disabled={files.length === 0}
          size="lg"
        >
          {files.length > 1
            ? `Post ${files.length} Images`
            : files.length === 1
              ? "Post Image"
              : "Add Images First"}
        </Button>
      </div>
    </div>
  );
};

/* ─── Single Image Preview Card ─── */
const ImagePreview = ({
  preview,
  index,
  total,
  onRemove,
  onMoveUp,
  onMoveDown,
  isSingle,
  c,
}) => (
  <div
    style={{
      position: "relative",
      aspectRatio: isSingle ? "auto" : "1",
      borderRadius: "12px",
      overflow: "hidden",
      background: c.skeletonBase,
      border: `1px solid ${c.border}`,
    }}
  >
    <img
      src={preview}
      alt={`Preview ${index + 1}`}
      style={{
        width: "100%",
        height: isSingle ? "auto" : "100%",
        maxHeight: isSingle ? "300px" : "100%",
        objectFit: "cover",
        display: "block",
      }}
    />

    {/* Position badge */}
    {total > 1 && (
      <div
        style={{
          position: "absolute",
          top: "6px",
          left: "6px",
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          padding: "2px 8px",
          borderRadius: "12px",
          fontSize: "10px",
          fontWeight: 700,
          fontFamily: "Inter, sans-serif",
          backdropFilter: "blur(4px)",
        }}
      >
        {index + 1} / {total}
      </div>
    )}

    {/* Action buttons */}
    <div
      style={{
        position: "absolute",
        top: "6px",
        right: "6px",
        display: "flex",
        gap: "4px",
      }}
    >
      {/* Move buttons (only if multiple) */}
      {total > 1 && (
        <>
          {index > 0 && (
            <button
              type="button"
              onClick={onMoveUp}
              title="Move left"
              style={{
                background: "rgba(0,0,0,0.7)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                backdropFilter: "blur(4px)",
              }}
            >
              <MoveLeft size={11} />
            </button>
          )}
          {index < total - 1 && (
            <button
              type="button"
              onClick={onMoveDown}
              title="Move right"
              style={{
                background: "rgba(0,0,0,0.7)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                backdropFilter: "blur(4px)",
              }}
            >
              <MoveRight size={11} />
            </button>
          )}
        </>
      )}

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        title="Remove"
        style={{
          background: "rgba(239, 68, 68, 0.9)",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: "24px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          backdropFilter: "blur(4px)",
        }}
      >
        <X size={12} />
      </button>
    </div>
  </div>
);

export default CreateImageForm;
