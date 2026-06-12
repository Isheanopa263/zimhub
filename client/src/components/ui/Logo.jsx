import useTheme from "../../hooks/useTheme";

const Logo = ({ size = "md", showText = true }) => {
  const { c } = useTheme();

  const iconSizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-2xl",
  };

  const iconSize = {
    sm: { w: 32, h: 32, font: 13 },
    md: { w: 40, h: 40, font: 15 },
    lg: { w: 56, h: 56, font: 22 },
    xl: { w: 80, h: 80, font: 32 },
  };

  const textSize = {
    sm: "18px",
    md: "20px",
    lg: "30px",
    xl: "36px",
  };

  const iconConfig = iconSize[size] || iconSize.md;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: `${iconConfig.w}px`,
          height: `${iconConfig.h}px`,
          borderRadius: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          color: "#ffffff",
          background:
            "linear-gradient(135deg, #3B82F6 0%, #2563eb 50%, #1d4ed8 100%)",
          boxShadow: "0 8px 32px rgba(59, 130, 246, 0.35)",
          fontFamily: "Inter, sans-serif",
          fontSize: `${iconConfig.font}px`,
        }}
      >
        Z
      </div>

      {showText && (
        <h1
          style={{
            fontSize: textSize[size] || textSize.md,
            fontWeight: 900,
            letterSpacing: "-0.5px",
            margin: 0,
            fontFamily: "Inter, sans-serif",
          }}
        >
          <span style={{ color: c.text }}>Zim</span>
          <span style={{ color: c.accentText }}>Hub</span>
        </h1>
      )}
    </div>
  );
};

export default Logo;
