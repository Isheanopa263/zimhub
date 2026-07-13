import { useState } from "react";
import { Plus, X, Clock, BarChart2 } from "lucide-react";
import Button from "../ui/Button";
import useTheme from "../../hooks/useTheme";
import toast from "react-hot-toast";

const EXPIRE_OPTIONS = [
  { value: "", label: "No expiry" },
  { value: "1", label: "1 hour" },
  { value: "6", label: "6 hours" },
  { value: "24", label: "1 day" },
  { value: "72", label: "3 days" },
  { value: "168", label: "7 days" },
];

const CreatePollForm = ({ onSubmit, loading }) => {
  const { c } = useTheme();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [caption, setCaption] = useState("");
  const [expiresIn, setExpiresIn] = useState("24");
  const [allowMultiple, setAllowMultiple] = useState(false);

  const addOption = () => {
    if (options.length >= 6) {
      toast.error("Maximum 6 options");
      return;
    }
    setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    if (options.length <= 2) {
      toast.error("Minimum 2 options required");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = () => {
    if (!question.trim()) {
      return toast.error("Please enter a question");
    }

    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      return toast.error("At least 2 options are required");
    }

    const uniqueCheck = new Set(
      validOptions.map((o) => o.trim().toLowerCase()),
    );
    if (uniqueCheck.size !== validOptions.length) {
      return toast.error("Options must be unique");
    }

    onSubmit({
      question: question.trim(),
      options: validOptions.map((o) => o.trim()),
      caption: caption.trim() || undefined,
      expiresIn: expiresIn || undefined,
      allowMultiple,
    });
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: `2px solid ${c.borderStrong}`,
    background: c.bgInput,
    color: c.text,
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
    outline: "none",
    transition: "all 0.15s ease",
  };

  return (
    <div>
      {/* Poll icon */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(139, 92, 246, 0.3)",
          }}
        >
          <BarChart2 size={28} color="#fff" strokeWidth={2.5} />
        </div>
      </div>

      {/* Question */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: 600,
            color: c.text,
            marginBottom: "6px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Question <span style={{ color: c.danger }}>*</span>
        </label>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask something..."
          maxLength={300}
          style={inputStyle}
          onFocus={(e) => {
            e.target.style.borderColor = "#8b5cf6";
            e.target.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.15)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = c.borderStrong;
            e.target.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Options */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: 600,
            color: c.text,
            marginBottom: "8px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Options <span style={{ color: c.danger }}>*</span>
          <span
            style={{
              color: c.textMuted,
              fontWeight: 400,
              marginLeft: "6px",
            }}
          >
            ({options.length}/6)
          </span>
        </label>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {options.map((opt, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              {/* Option number */}
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: `rgba(139, 92, 246, ${0.1 + idx * 0.05})`,
                  color: "#8b5cf6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 800,
                  flexShrink: 0,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {idx + 1}
              </div>

              {/* Option input */}
              <input
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                maxLength={200}
                style={{
                  ...inputStyle,
                  padding: "10px 12px",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#8b5cf6";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = c.borderStrong;
                }}
              />

              {/* Remove button */}
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: c.dangerLight,
                    color: c.danger,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}

          {/* Add option button */}
          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "10px",
                borderRadius: "10px",
                border: `2px dashed ${c.borderStrong}`,
                background: "transparent",
                color: c.textTer,
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "Inter, sans-serif",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#8b5cf6";
                e.currentTarget.style.color = "#8b5cf6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = c.borderStrong;
                e.currentTarget.style.color = c.textTer;
              }}
            >
              <Plus size={14} />
              Add Option
            </button>
          )}
        </div>
      </div>

      {/* Settings row */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        {/* Duration */}
        <div style={{ flex: 1, minWidth: "140px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "12px",
              fontWeight: 600,
              color: c.textTer,
              marginBottom: "6px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <Clock size={12} />
            Duration
          </label>
          <select
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
            style={{
              ...inputStyle,
              padding: "9px 12px",
              cursor: "pointer",
              appearance: "auto",
            }}
          >
            {EXPIRE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Allow multiple */}
        <div style={{ flex: 1, minWidth: "140px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              color: c.textTer,
              marginBottom: "6px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Multiple votes
          </label>
          <button
            type="button"
            onClick={() => setAllowMultiple(!allowMultiple)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 12px",
              borderRadius: "10px",
              border: `2px solid ${allowMultiple ? "#8b5cf6" : c.borderStrong}`,
              background: allowMultiple ? "rgba(139,92,246,0.1)" : c.bgInput,
              color: allowMultiple ? "#8b5cf6" : c.textTer,
              cursor: "pointer",
              width: "100%",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              transition: "all 0.15s ease",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "18px",
                borderRadius: "20px",
                background: allowMultiple ? "#8b5cf6" : "#cbd5e1",
                position: "relative",
                transition: "background 0.2s ease",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "2px",
                  left: allowMultiple ? "16px" : "2px",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s ease",
                }}
              />
            </div>
            {allowMultiple ? "Yes" : "No"}
          </button>
        </div>
      </div>

      {/* Caption */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 600,
            color: c.textTer,
            marginBottom: "6px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Caption (optional)
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add context to your poll..."
          maxLength={500}
          rows={2}
          style={{
            ...inputStyle,
            resize: "none",
            padding: "10px 14px",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#8b5cf6")}
          onBlur={(e) => (e.target.style.borderColor = c.borderStrong)}
        />
      </div>

      <Button
        onClick={handleSubmit}
        fullWidth
        isLoading={loading}
        disabled={
          !question.trim() || options.filter((o) => o.trim()).length < 2
        }
        size="lg"
      >
        Create Poll
      </Button>
    </div>
  );
};

export default CreatePollForm;
