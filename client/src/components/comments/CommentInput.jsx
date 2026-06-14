import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import useAuthStore from "../../store/authStore";
import useTheme from "../../hooks/useTheme";
import { getAvatarUrl } from "../../utils/media";

const CommentInput = ({ onSubmit, submitting, autoFocus = false }) => {
  const [content, setContent] = useState("");
  const { user } = useAuthStore();
  const { c } = useTheme();
  const textareaRef = useRef();

  const letter = user?.profile?.full_name?.charAt(0)?.toUpperCase() || "U";
  const avatarSrc = getAvatarUrl(user?.profile?.avatar_url);

  useEffect(() => {
    if (autoFocus && textareaRef.current) textareaRef.current.focus();
  }, [autoFocus]);

  const handleChange = (e) => {
    setContent(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 100)}px`;
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const text = content.trim();
    if (!text || submitting) return;
    try {
      await onSubmit(text);
      setContent("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch {}
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const charCount = content.length;
  const isNearLimit = charCount > 400;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "10px",
        padding: "12px 16px",
        background: c.bgCard,
        borderTop: `1px solid ${c.border}`,
        position: "sticky",
        bottom: 0,
      }}
    >
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          background: "linear-gradient(135deg,#3B82F6,#8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt="You"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {letter}
          </span>
        )}
      </div>

      <div
        style={{
          flex: 1,
          background: c.bgSubtle,
          borderRadius: "20px",
          padding: "8px 12px",
          display: "flex",
          alignItems: "flex-end",
          gap: "8px",
          border: `1px solid ${c.border}`,
        }}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Write a comment..."
          maxLength={500}
          rows={1}
          disabled={submitting}
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            resize: "none",
            outline: "none",
            fontSize: "14px",
            fontFamily: "Inter, sans-serif",
            color: c.text,
            minHeight: "20px",
            maxHeight: "100px",
            lineHeight: 1.5,
            padding: "2px 0",
          }}
        />

        {isNearLimit && (
          <span
            style={{
              fontSize: "10px",
              color: charCount >= 500 ? c.danger : c.warning,
              fontFamily: "Inter, sans-serif",
              alignSelf: "flex-end",
              paddingBottom: "4px",
            }}
          >
            {500 - charCount}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={!content.trim() || submitting}
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          background: content.trim()
            ? "linear-gradient(135deg,#3B82F6,#2563eb)"
            : c.borderStrong,
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: content.trim() ? "pointer" : "not-allowed",
          color: content.trim() ? "#ffffff" : c.textMuted,
          flexShrink: 0,
          transition: "all 0.15s ease",
          boxShadow: content.trim() ? "0 2px 8px rgba(59,130,246,0.3)" : "none",
        }}
      >
        <Send size={15} style={{ marginLeft: "2px" }} />
      </button>

      {/* Markdown hint */}
      {content.length > 0 && (
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "flex-end",
            paddingRight: "50px",
            marginTop: "4px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              color: c.textMuted,
              fontFamily: "Inter, sans-serif",
            }}
          >
            **bold** *italic* @mention #tag
          </span>
        </div>
      )}
    </form>
  );
};

export default CommentInput;
