import { useState, useRef } from "react";
import { ImagePlus, X, MoveLeft, MoveRight } from "lucide-react";
import Button from "../ui/Button";
import useTheme from "../../hooks/useTheme";
import toast from "react-hot-toast";

const MAX_IMAGES = 10;
const MAX_SIZE_MB = 5;

const CreateImageForm = ({ onSubmit, loading }) => {
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState([]);
  const fileRef = useRef();
  const { c } = useTheme();
  const [dragOver, setDragOver] = useState(false);

  /* ── File Selection ── */
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length) addFiles(newFiles);
    e.target.value = "";
  };

  const addFiles = (newFiles) => {
    if (files.length + newFiles.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images per post`);
      return;
    }

    const validFiles = [];
    for (const file of newFiles) {
      // Check file type
      const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!allowed.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported image format`);
        continue;
      }

      // Check file size
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

  /* ── Remove ── */
  const removeFile = (id) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  /* ── Reorder ── */
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

  /* ── Clear All ── */
  const clearAll = () => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  /* ── Submit ── */
  const handleSubmit = () => {
    if (files.length === 0) {
      toast.error("Please add at least one image");
      return;
    }

    const formData = new FormData();

    // Field name MUST match backend: uploadMultipleImages.array('images', 10)
    files.forEach(({ file }) => {
      formData.append("images", file);
    });

    if (caption.trim()) {
      formData.append("caption", caption.trim());
    }

    onSubmit(formData);
  };

  /* ── Drag & Drop ── */
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (dropped.length) addFiles(dropped);
  };

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
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

          {/* Add more button */}
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
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
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
              fontFamily: "Inter, sans-serif",
            }}
          >
            {dragOver ? "Drop images here" : "Tap to upload images"}
          </p>
          <p
            style={{
              fontSize: "12px",
              color: c.textMuted,
              margin: 0,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Up to {MAX_IMAGES} images · Max {MAX_SIZE_MB}MB each · JPEG, PNG,
            GIF, WebP
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
            onClick={clearAll}
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
  );
};

/* ─── Image Preview Card ─── */
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

    {/* Actions */}
    <div
      style={{
        position: "absolute",
        top: "6px",
        right: "6px",
        display: "flex",
        gap: "4px",
      }}
    >
      {total > 1 && (
        <>
          {index > 0 && (
            <SmallBtn onClick={onMoveUp} title="Move left">
              <MoveLeft size={11} />
            </SmallBtn>
          )}
          {index < total - 1 && (
            <SmallBtn onClick={onMoveDown} title="Move right">
              <MoveRight size={11} />
            </SmallBtn>
          )}
        </>
      )}
      <SmallBtn onClick={onRemove} title="Remove" danger>
        <X size={12} />
      </SmallBtn>
    </div>
  </div>
);

const SmallBtn = ({ onClick, title, children, danger = false }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    style={{
      background: danger ? "rgba(239,68,68,0.9)" : "rgba(0,0,0,0.7)",
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
    {children}
  </button>
);

export default CreateImageForm;
