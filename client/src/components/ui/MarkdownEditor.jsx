import { useState, useRef } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  AtSign,
  Hash,
  Eye,
  EyeOff,
} from "lucide-react";
import useTheme from "../../hooks/useTheme";
import MarkdownText from "./MarkdownText";

const TOOLBAR = [
  { icon: Bold, label: "Bold", shortcut: "Ctrl+B", wrap: ["**", "**"] },
  { icon: Italic, label: "Italic", shortcut: "Ctrl+I", wrap: ["*", "*"] },
  {
    icon: Strikethrough,
    label: "Strikethrough",
    shortcut: "",
    wrap: ["~~", "~~"],
  },
  { icon: Code, label: "Code", shortcut: "", wrap: ["`", "`"] },
  { divider: true },
  { icon: LinkIcon, label: "Link", shortcut: "Ctrl+K", special: "link" },
  { icon: AtSign, label: "Mention", shortcut: "@", insert: "@" },
  { icon: Hash, label: "Hashtag", shortcut: "#", insert: "#" },
  { divider: true },
  { icon: List, label: "Bullet List", shortcut: "", prefix: "- " },
  { icon: ListOrdered, label: "Numbered List", shortcut: "", prefix: "1. " },
  { icon: Quote, label: "Quote", shortcut: "", prefix: "> " },
];

const MarkdownEditor = ({
  value,
  onChange,
  placeholder = "Write something...",
  maxLength = 2000,
  rows = 5,
  showToolbar = true,
  showPreviewToggle = true,
  autoFocus = false,
}) => {
  const { c } = useTheme();
  const textareaRef = useRef();
  const [showPreview, setShowPreview] = useState(false);
  const [focused, setFocused] = useState(false);

  /* Insert text at cursor / wrap selection */
  const insertAtCursor = (before, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    const newValue = beforeText + before + selectedText + after + afterText;
    onChange(newValue);

    // Restore selection
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        // Re-select wrapped text
        textarea.setSelectionRange(start + before.length, end + before.length);
      } else {
        // Place cursor between markers
        textarea.setSelectionRange(
          start + before.length,
          start + before.length,
        );
      }
    }, 0);
  };

  /* Insert prefix at start of current line */
  const prefixLine = (prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const newValue =
      value.substring(0, lineStart) + prefix + value.substring(lineStart);

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  /* Insert link with prompt */
  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || "link text";

    const url = window.prompt("Enter URL:", "https://");
    if (!url) return;

    insertAtCursor(`[${selectedText}](${url})`, "");
  };

  /* Handle toolbar action */
  const handleToolbarAction = (item) => {
    if (item.wrap) {
      insertAtCursor(item.wrap[0], item.wrap[1]);
    } else if (item.prefix) {
      prefixLine(item.prefix);
    } else if (item.insert) {
      insertAtCursor(item.insert);
    } else if (item.special === "link") {
      insertLink();
    }
  };

  /* Keyboard shortcuts */
  const handleKeyDown = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;

    const key = e.key.toLowerCase();
    if (key === "b") {
      e.preventDefault();
      insertAtCursor("**", "**");
    } else if (key === "i") {
      e.preventDefault();
      insertAtCursor("*", "*");
    } else if (key === "k") {
      e.preventDefault();
      insertLink();
    }
  };

  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.9;
  const isOverLimit = charCount > maxLength;

  return (
    <div
      style={{
        border: `2px solid ${focused ? c.accent : c.borderStrong}`,
        borderRadius: "12px",
        background: c.bgInput,
        overflow: "hidden",
        transition: "all 0.15s ease",
        boxShadow: focused ? `0 0 0 3px ${c.accent}20` : "none",
      }}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            padding: "6px 8px",
            background: c.bgSubtle,
            borderBottom: `1px solid ${c.border}`,
            flexWrap: "wrap",
          }}
        >
          {TOOLBAR.map((item, idx) => {
            if (item.divider) {
              return (
                <div
                  key={`div-${idx}`}
                  style={{
                    width: "1px",
                    height: "20px",
                    background: c.borderStrong,
                    margin: "0 4px",
                  }}
                />
              );
            }

            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                title={
                  item.shortcut
                    ? `${item.label} (${item.shortcut})`
                    : item.label
                }
                onClick={() => handleToolbarAction(item)}
                style={{
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: c.textTer,
                  transition: "all 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = c.bgHover;
                  e.currentTarget.style.color = c.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = c.textTer;
                }}
              >
                <Icon size={14} />
              </button>
            );
          })}

          {/* Preview toggle pushed to right */}
          {showPreviewToggle && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              title={showPreview ? "Edit" : "Preview"}
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                background: showPreview ? c.accentLight : "transparent",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                color: showPreview ? c.accent : c.textTer,
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "Inter, sans-serif",
                transition: "all 0.1s ease",
              }}
            >
              {showPreview ? <EyeOff size={11} /> : <Eye size={11} />}
              {showPreview ? "Edit" : "Preview"}
            </button>
          )}
        </div>
      )}

      {/* Editor or Preview */}
      {showPreview ? (
        <div
          style={{
            padding: "14px",
            minHeight: `${rows * 22}px`,
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {value ? (
            <MarkdownText>{value}</MarkdownText>
          ) : (
            <p style={{ color: c.textMuted, fontSize: "14px", margin: 0 }}>
              Nothing to preview yet
            </p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          autoFocus={autoFocus}
          style={{
            width: "100%",
            padding: "14px",
            border: "none",
            outline: "none",
            resize: "vertical",
            background: "transparent",
            color: c.text,
            fontSize: "14px",
            fontFamily: "Inter, system-ui, sans-serif",
            lineHeight: 1.55,
            minHeight: `${rows * 22}px`,
            maxHeight: "400px",
          }}
        />
      )}

      {/* Footer */}
      {(maxLength || charCount > 0) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 12px",
            background: c.bgSubtle,
            borderTop: `1px solid ${c.border}`,
            fontSize: "11px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <span style={{ color: c.textMuted }}>
            <strong style={{ fontWeight: 700 }}>**bold**</strong> ·{" "}
            <em>*italic*</em> · `code` · [link](url) · @user · #tag
          </span>
          {maxLength && (
            <span
              style={{
                color: isOverLimit
                  ? c.danger
                  : isNearLimit
                    ? c.warning
                    : c.textMuted,
                fontWeight: isNearLimit ? 700 : 500,
              }}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;
