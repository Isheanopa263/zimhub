import { useState, useEffect } from "react";
import { X, Type, FileText, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { adminApi } from "../../api/endpoints/admin.api";
import useTheme from "../../hooks/useTheme";

const AnnouncementModal = ({ isOpen, onClose, editing = null, onSuccess }) => {
  const { c } = useTheme();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const isEdit = !!editing;

  useEffect(() => {
    if (editing) {
      setTitle(editing.title || "");
      setContent(editing.content || "");
    } else {
      setTitle("");
      setContent("");
    }
  }, [editing, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      return toast.error("Title and content are required");
    }
    setLoading(true);
    try {
      let response;
      if (isEdit) {
        response = await adminApi.updateAnnouncement(editing.id, {
          title,
          content,
        });
        toast.success("Announcement updated");
      } else {
        response = await adminApi.createAnnouncement({ title, content });
        toast.success("Announcement created");
      }
      onSuccess?.(response.data);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: `2px solid ${c.borderStrong}`,
    background: c.bgInput,
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
    color: c.text,
    outline: "none",
  };

  return (
    <>
      <div
        onClick={() => !loading && onClose()}
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--backdrop)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "480px",
          background: c.bgCard,
          borderRadius: "20px",
          boxShadow: c.shadowLg,
          zIndex: 101,
          padding: "20px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              fontSize: "17px",
              fontWeight: 800,
              color: c.text,
              margin: 0,
            }}
          >
            {isEdit ? "Edit Announcement" : "New Announcement"}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: c.bgHover,
              border: "none",
              borderRadius: "10px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: loading ? "not-allowed" : "pointer",
              color: c.textTer,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <Field label="Title" icon={Type} c={c}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Important announcement title"
              maxLength={255}
              required
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = c.accent;
                e.target.style.boxShadow = `0 0 0 3px ${c.accent}20`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = c.borderStrong;
                e.target.style.boxShadow = "none";
              }}
            />
          </Field>

          <Field label="Content" icon={FileText} c={c}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the announcement content..."
              maxLength={2000}
              rows={6}
              required
              style={{ ...inputStyle, resize: "vertical", minHeight: "120px" }}
              onFocus={(e) => {
                e.target.style.borderColor = c.accent;
                e.target.style.boxShadow = `0 0 0 3px ${c.accent}20`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = c.borderStrong;
                e.target.style.boxShadow = "none";
              }}
            />
            <p
              style={{
                fontSize: "11px",
                textAlign: "right",
                color: content.length > 1800 ? c.danger : c.textMuted,
                margin: "4px 0 0",
              }}
            >
              {content.length}/2000
            </p>
          </Field>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "8px",
              padding: "13px",
              background: "linear-gradient(135deg,#3B82F6,#2563eb)",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: loading ? 0.7 : 1,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {loading && (
              <Loader2
                size={14}
                style={{ animation: "spin 1s linear infinite" }}
              />
            )}
            {isEdit ? "Update" : "Create"}
          </button>
        </form>

        <style>{`@keyframes spin { 0% { transform: rotate(0); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
};

const Field = ({ label, icon: Icon, children, c }) => (
  <div style={{ marginBottom: "14px" }}>
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "13px",
        fontWeight: 600,
        color: c.text,
        marginBottom: "6px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {Icon && <Icon size={13} color={c.textTer} />}
      {label}
    </label>
    {children}
  </div>
);

export default AnnouncementModal;
