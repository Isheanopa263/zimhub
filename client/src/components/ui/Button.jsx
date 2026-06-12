const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  className = "",
  disabled,
  type = "button",
  onClick,
  ...props
}) => {
  const baseStyles = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontWeight: "600",
    borderRadius: "12px",
    cursor: disabled || isLoading ? "not-allowed" : "pointer",
    transition: "all 0.15s ease",
    border: "none",
    outline: "none",
    opacity: disabled || isLoading ? 0.5 : 1,
    width: fullWidth ? "100%" : "auto",
    fontFamily: "Inter, system-ui, sans-serif",
  };

  const variantStyles = {
    primary: {
      background: "linear-gradient(135deg, #3B82F6 0%, #2563eb 100%)",
      color: "#ffffff",
      boxShadow: "0 4px 14px rgba(59, 130, 246, 0.35)",
    },
    secondary: {
      background: "#f1f5f9",
      color: "#0F172A",
      boxShadow: "none",
    },
    ghost: {
      background: "transparent",
      color: "#0F172A",
      boxShadow: "none",
    },
    danger: {
      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      color: "#ffffff",
      boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
    },
    outline: {
      background: "transparent",
      color: "#3B82F6",
      border: "2px solid #3B82F6",
      boxShadow: "none",
    },
  };

  const sizeStyles = {
    sm: { padding: "8px 16px", fontSize: "13px" },
    md: { padding: "10px 20px", fontSize: "14px" },
    lg: { padding: "14px 24px", fontSize: "15px" },
  };

  const combinedStyle = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      style={combinedStyle}
      className={className}
      onMouseEnter={(e) => {
        if (!disabled && !isLoading) {
          e.target.style.transform = "translateY(-1px)";
          e.target.style.opacity = "0.9";
        }
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = "translateY(0)";
        e.target.style.opacity = disabled || isLoading ? "0.5" : "1";
      }}
      onMouseDown={(e) => {
        if (!disabled && !isLoading) {
          e.target.style.transform = "scale(0.97)";
        }
      }}
      onMouseUp={(e) => {
        e.target.style.transform = "translateY(-1px)";
      }}
      {...props}
    >
      {isLoading && (
        <svg
          style={{
            width: "16px",
            height: "16px",
            animation: "spin 1s linear infinite",
          }}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="32"
            strokeDashoffset="12"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

// Add spinner animation via a style tag
if (typeof document !== "undefined") {
  const styleId = "zimhub-button-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

export default Button;
