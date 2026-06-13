import { useRef, useEffect } from "react";
import useTheme from "../../hooks/useTheme";

const OTPInput = ({ value, onChange, length = 6, autoFocus = true, error }) => {
  const { c } = useTheme();
  const inputs = useRef([]);

  useEffect(() => {
    if (autoFocus && inputs.current[0]) {
      inputs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (idx, val) => {
    // Only allow digits
    if (val && !/^\d$/.test(val)) return;

    const newValue = value.split("");
    newValue[idx] = val;
    const joined = newValue.join("").slice(0, length);
    onChange(joined);

    // Auto-advance
    if (val && idx < length - 1) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowRight" && idx < length - 1) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (pasted) {
      onChange(pasted);
      // Focus the next empty input or last one
      const nextIdx = Math.min(pasted.length, length - 1);
      inputs.current[nextIdx]?.focus();
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "center",
        }}
      >
        {Array.from({ length }).map((_, idx) => (
          <input
            key={idx}
            ref={(el) => (inputs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[idx] || ""}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            style={{
              width: "46px",
              height: "56px",
              borderRadius: "12px",
              border: `2px solid ${error ? c.danger : c.borderStrong}`,
              background: error ? c.dangerLight : c.bgInput,
              color: c.text,
              fontSize: "24px",
              fontWeight: 700,
              textAlign: "center",
              outline: "none",
              fontFamily: "monospace",
              transition: "all 0.15s ease",
            }}
            onFocus={(e) => {
              if (!error) {
                e.target.style.borderColor = c.accent;
                e.target.style.boxShadow = `0 0 0 3px ${c.accent}20`;
              }
            }}
            onBlur={(e) => {
              if (!error) {
                e.target.style.borderColor = c.borderStrong;
                e.target.style.boxShadow = "none";
              }
            }}
          />
        ))}
      </div>

      {error && (
        <p
          style={{
            textAlign: "center",
            color: c.danger,
            fontSize: "13px",
            marginTop: "10px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default OTPInput;
