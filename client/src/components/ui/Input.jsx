import { forwardRef, useState } from "react";
import useTheme from "../../hooks/useTheme";

const Input = forwardRef(
  (
    {
      label,
      name,
      type = "text",
      placeholder,
      error,
      helperText,
      icon: Icon,
      required,
      hasServerError = false,
      ...props
    },
    ref,
  ) => {
    const { c } = useTheme();
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    const hasError = !!error || hasServerError;

    return (
      <div style={{ marginBottom: "0px", width: "100%" }}>
        {label && (
          <label
            htmlFor={name}
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: c.text,
              marginBottom: "6px",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {label}
            {required && (
              <span style={{ color: c.danger, marginLeft: "3px" }}>*</span>
            )}
          </label>
        )}

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          {Icon && (
            <div
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: hasError ? c.danger : isFocused ? c.accent : c.textMuted,
                transition: "color 0.15s ease",
                pointerEvents: "none",
              }}
            >
              <Icon size={16} />
            </div>
          )}

          <input
            id={name}
            name={name}
            ref={ref}
            type={inputType}
            placeholder={placeholder}
            style={{
              width: "100%",
              padding: "12px 16px",
              paddingLeft: Icon ? "42px" : "16px",
              paddingRight: isPassword ? "42px" : "16px",
              borderRadius: "12px",
              border: `2px solid ${
                hasError ? c.danger : isFocused ? c.accent : c.borderStrong
              }`,
              background: hasError ? c.dangerLight : c.bgInput,
              color: c.text,
              fontSize: "14px",
              fontFamily: "Inter, system-ui, sans-serif",
              outline: "none",
              transition: "all 0.15s ease",
              boxShadow: isFocused
                ? `0 0 0 3px ${hasError ? c.danger : c.accent}20`
                : "none",
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{
                position: "absolute",
                right: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: c.textMuted,
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "6px",
              fontSize: "12px",
              color: c.danger,
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {helperText && !error && (
          <p
            style={{
              marginTop: "6px",
              fontSize: "12px",
              color: c.textMuted,
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
