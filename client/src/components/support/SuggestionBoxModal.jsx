import { useState } from "react";
import {
  X,
  Lightbulb,
  Sparkles,
  MessageCircle,
  TrendingUp,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

import { supportApi } from "../../api/endpoints/support.api";
import useTheme from "../../hooks/useTheme";
import Button from "../ui/Button";

const CATEGORIES = [
  {
    key: "feature_idea",
    label: "Feature Idea",
    icon: Sparkles,
    color: "#8b5cf6",
  },
  {
    key: "improvement",
    label: "Improvement",
    icon: TrendingUp,
    color: "#3B82F6",
  },
  {
    key: "feedback",
    label: "General Feedback",
    icon: MessageCircle,
    color: "#10b981",
  },
  {
    key: "general",
    label: "Something Else",
    icon: Lightbulb,
    color: "#f59e0b",
  },
];

const SuggestionBoxModal = ({ isOpen, onClose }) => {
  const { c } = useTheme();
  const [category, setCategory] = useState("feature_idea");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleClose = () => {
    if (loading) return;
    setContent("");
    setCategory("feature_idea");
    setSubmitted(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading) return;

    if (!content.trim() || content.trim().length < 10) {
      return toast.error("Suggestion must be at least 10 characters");
    }

    setLoading(true);
    try {
      await supportApi.submitSuggestion({
        category,
        content: content.trim(),
      });

      setSubmitted(true);
      setContent("");

      // Auto-close after 2.5 seconds
      setTimeout(() => {
        handleClose();
      }, 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
          maxWidth: "480px",
          background: c.bgCard,
          borderRadius: "20px",
          boxShadow: c.shadowLg,
          zIndex: 101,
          overflow: "hidden",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {submitted ? (
          /* Success state */
          <div
            style={{
              padding: "40px 24px",
              textAlign: "center",
              animation: "fadeIn 0.3s ease",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: c.successLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                animation: "pop 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <CheckCircle2 size={40} color={c.success} strokeWidth={2.5} />
            </div>

            <h2
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: c.text,
                margin: "0 0 8px",
              }}
            >
              Thank you! 🎉
            </h2>

            <p
              style={{
                fontSize: "14px",
                color: c.textTer,
                margin: "0 0 6px",
                lineHeight: 1.5,
              }}
            >
              Your anonymous suggestion has been received.
            </p>

            <p
              style={{
                fontSize: "13px",
                color: c.textMuted,
                margin: 0,
              }}
            >
              Admin will review it. You won't be identified.
            </p>

            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to   { opacity: 1; transform: scale(1); }
              }
              @keyframes pop {
                0%   { transform: scale(0); }
                70%  { transform: scale(1.15); }
                100% { transform: scale(1); }
              }
            `}</style>
          </div>
        ) : (
          /* Form */
          <>
            {/* Header — yellow theme */}
            <div
              style={{
                padding: "20px",
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                position: "relative",
              }}
            >
              <button
                onClick={handleClose}
                disabled={loading}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  background: "rgba(255,255,255,0.25)",
                  backdropFilter: "blur(8px)",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: loading ? "not-allowed" : "pointer",
                  color: "#fff",
                }}
              >
                <X size={16} />
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.25)",
                    backdropFilter: "blur(8px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Lightbulb size={24} color="#fff" strokeWidth={2.5} />
                </div>

                <div>
                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "#fff",
                      margin: "0 0 2px",
                    }}
                  >
                    Suggestion Box
                  </h2>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.9)",
                      margin: 0,
                      fontWeight: 500,
                    }}
                  >
                    100% anonymous — no replies
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
              {/* Anonymous notice */}
              <div
                style={{
                  padding: "12px 14px",
                  background: c.bgSubtle,
                  border: `1px solid ${c.border}`,
                  borderRadius: "10px",
                  marginBottom: "20px",
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: "18px", flexShrink: 0 }}>🔒</span>
                <p
                  style={{
                    fontSize: "12px",
                    color: c.textSec,
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  Your name, email, and account info are <strong>NOT</strong>{" "}
                  attached. Admins will read but cannot reply or identify you.
                </p>
              </div>

              {/* Category */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: c.text,
                    marginBottom: "8px",
                  }}
                >
                  What kind of suggestion?
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "8px",
                  }}
                >
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = category === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setCategory(cat.key)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "10px",
                          border: `2px solid ${isActive ? cat.color : c.borderStrong}`,
                          background: isActive ? `${cat.color}15` : c.bgCard,
                          color: isActive ? cat.color : c.textTer,
                          fontSize: "12px",
                          fontWeight: isActive ? 700 : 500,
                          cursor: "pointer",
                          fontFamily: "Inter, sans-serif",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Icon size={14} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
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
                  Your suggestion
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your idea, feedback, or suggestion..."
                  maxLength={2000}
                  rows={6}
                  required
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: `2px solid ${c.borderStrong}`,
                    background: c.bgInput,
                    color: c.text,
                    fontSize: "14px",
                    fontFamily: "Inter, sans-serif",
                    outline: "none",
                    resize: "vertical",
                    minHeight: "120px",
                    lineHeight: 1.5,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#f59e0b";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(245, 158, 11, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = c.borderStrong;
                    e.target.style.boxShadow = "none";
                  }}
                />
                <p
                  style={{
                    fontSize: "11px",
                    color: content.length > 1800 ? c.danger : c.textMuted,
                    margin: "4px 0 0",
                    textAlign: "right",
                  }}
                >
                  {content.length}/2000
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || content.trim().length < 10}
                style={{
                  width: "100%",
                  padding: "13px",
                  background:
                    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: loading ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontFamily: "Inter, sans-serif",
                  boxShadow: "0 4px 14px rgba(245, 158, 11, 0.3)",
                  transition: "all 0.15s ease",
                  opacity: loading || content.trim().length < 10 ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading && content.trim().length >= 10) {
                    e.currentTarget.style.opacity = "0.9";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && content.trim().length >= 10) {
                    e.currentTarget.style.opacity = "1";
                  }
                }}
              >
                {loading && (
                  <Loader2
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                )}
                {loading ? "Submitting..." : "Send Anonymous Suggestion"}
              </button>

              <style>{`
                @keyframes spin {
                  from { transform: rotate(0); }
                  to   { transform: rotate(360deg); }
                }
              `}</style>
            </form>
          </>
        )}
      </div>
    </>
  );
};

export default SuggestionBoxModal;
