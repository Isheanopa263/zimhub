import { useState } from "react";
import {
  X,
  MessageCircle,
  Bug,
  AlertTriangle,
  Sparkles,
  UserX,
  FileWarning,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import { supportApi } from "../../api/endpoints/support.api";
import useTheme from "../../hooks/useTheme";
import Button from "../ui/Button";

const CATEGORIES = [
  {
    key: "bug_report",
    label: "Bug Report",
    icon: Bug,
    color: "#ef4444",
    description: "Something broken or not working",
  },
  {
    key: "complaint",
    label: "Complaint",
    icon: AlertTriangle,
    color: "#f59e0b",
    description: "Report inappropriate behavior or content",
  },
  {
    key: "feature_request",
    label: "Feature Request",
    icon: Sparkles,
    color: "#8b5cf6",
    description: "Request a new feature or improvement",
  },
  {
    key: "account_issue",
    label: "Account Issue",
    icon: UserX,
    color: "#3B82F6",
    description: "Problem with your account",
  },
  {
    key: "content_issue",
    label: "Content Issue",
    icon: FileWarning,
    color: "#ec4899",
    description: "Report a post, comment, or notice",
  },
  {
    key: "other",
    label: "Other",
    icon: MoreHorizontal,
    color: "#64748b",
    description: "Something else",
  },
];

const PRIORITIES = [
  { key: "low", label: "Low", color: "#64748b" },
  { key: "normal", label: "Normal", color: "#3B82F6" },
  { key: "high", label: "High", color: "#f59e0b" },
  { key: "urgent", label: "Urgent", color: "#ef4444" },
];

const CreateQueryModal = ({ isOpen, onClose, onSuccess }) => {
  const { c } = useTheme();
  const [step, setStep] = useState(1); // 1: category, 2: details
  const [category, setCategory] = useState(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setStep(1);
    setCategory(null);
    setSubject("");
    setMessage("");
    setPriority("normal");
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  const handleSelectCategory = (cat) => {
    setCategory(cat);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading) return;

    if (!subject.trim() || subject.trim().length < 3) {
      return toast.error("Subject must be at least 3 characters");
    }
    if (!message.trim() || message.trim().length < 10) {
      return toast.error("Message must be at least 10 characters");
    }

    setLoading(true);
    try {
      await supportApi.createQuery({
        category: category.key,
        subject: subject.trim(),
        message: message.trim(),
        priority,
      });

      toast.success("Query submitted! Admin will reply soon.");
      resetForm();
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit query");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: `2px solid ${c.borderStrong}`,
    background: c.bgInput,
    color: c.text,
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
    outline: "none",
    transition: "all 0.15s ease",
  };

  return (
    <>
      <div
        onClick={handleClose}
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
          maxWidth: "520px",
          maxHeight: "90vh",
          background: c.bgCard,
          borderRadius: "20px",
          boxShadow: c.shadowLg,
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #3B82F6, #2563eb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
              }}
            >
              <MessageCircle size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "17px",
                  fontWeight: 800,
                  color: c.text,
                  margin: 0,
                }}
              >
                {step === 1 ? "Send a Query" : category.label}
              </h2>
              <p
                style={{
                  fontSize: "11px",
                  color: c.textTer,
                  margin: "2px 0 0",
                }}
              >
                {step === 1 ? "Choose a category" : "Step 2 of 2"}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              background: c.bgHover,
              border: "none",
              borderRadius: "10px",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: loading ? "not-allowed" : "pointer",
              color: c.textTer,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
          {step === 1 ? (
            /* Step 1: Category Selection */
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.key}
                    onClick={() => handleSelectCategory(cat)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      width: "100%",
                      background: c.bgCard,
                      border: `2px solid ${c.border}`,
                      borderRadius: "14px",
                      padding: "14px",
                      cursor: "pointer",
                      fontFamily: "Inter, sans-serif",
                      transition: "all 0.15s ease",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = cat.color;
                      e.currentTarget.style.background = `${cat.color}08`;
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = c.border;
                      e.currentTarget.style.background = c.bgCard;
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: `${cat.color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} color={cat.color} strokeWidth={2.5} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: c.text,
                          margin: "0 0 2px",
                        }}
                      >
                        {cat.label}
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          color: c.textTer,
                          margin: 0,
                        }}
                      >
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Step 2: Details Form */
            <form onSubmit={handleSubmit}>
              {/* Category badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  background: `${category.color}15`,
                  borderRadius: "20px",
                  marginBottom: "20px",
                }}
              >
                <category.icon size={13} color={category.color} />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: category.color,
                  }}
                >
                  {category.label}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setCategory(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: category.color,
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: 600,
                    marginLeft: "4px",
                    fontFamily: "inherit",
                  }}
                >
                  Change
                </button>
              </div>

              {/* Subject */}
              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: c.text,
                    marginBottom: "6px",
                  }}
                >
                  Subject <span style={{ color: c.danger }}>*</span>
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
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
                <p
                  style={{
                    fontSize: "11px",
                    color: c.textMuted,
                    margin: "4px 0 0",
                    textAlign: "right",
                  }}
                >
                  {subject.length}/255
                </p>
              </div>

              {/* Priority */}
              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: c.text,
                    marginBottom: "6px",
                  }}
                >
                  Priority
                </label>
                <div style={{ display: "flex", gap: "6px" }}>
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPriority(p.key)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "10px",
                        border: `2px solid ${priority === p.key ? p.color : c.borderStrong}`,
                        background:
                          priority === p.key ? `${p.color}15` : c.bgCard,
                        color: priority === p.key ? p.color : c.textTer,
                        fontSize: "12px",
                        fontWeight: priority === p.key ? 700 : 500,
                        cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: c.text,
                    marginBottom: "6px",
                  }}
                >
                  Describe your issue <span style={{ color: c.danger }}>*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please provide details about your issue. Include any steps to reproduce, error messages, or relevant context..."
                  maxLength={5000}
                  rows={6}
                  required
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "120px",
                    fontFamily: "Inter, sans-serif",
                  }}
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
                    color: message.length > 4500 ? c.danger : c.textMuted,
                    margin: "4px 0 0",
                    textAlign: "right",
                  }}
                >
                  {message.length}/5000
                </p>
              </div>

              {/* Info note */}
              <div
                style={{
                  padding: "12px 14px",
                  background: c.accentLight,
                  border: `1px solid ${c.accent}30`,
                  borderRadius: "10px",
                  marginBottom: "16px",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    color: c.accentText,
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  💬 An admin will reply to your query privately. You'll get a
                  notification when they respond.
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setStep(1);
                    setCategory(null);
                  }}
                  disabled={loading}
                  fullWidth
                >
                  Back
                </Button>
                <Button type="submit" isLoading={loading} fullWidth>
                  {loading ? "Sending..." : "Submit Query"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default CreateQueryModal;
