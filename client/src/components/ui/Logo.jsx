import useTheme from "../../hooks/useTheme";

const Logo = ({ size = "md", showText = true }) => {
  const { c } = useTheme();

  const iconSize = {
    sm: { w: 32, h: 32, font: 18 },
    md: { w: 40, h: 40, font: 20 },
    lg: { w: 56, h: 56, font: 30 },
    xl: { w: 80, h: 80, font: 36 },
  };

  const textSize = {
    sm: "18px",
    md: "20px",
    lg: "30px",
    xl: "36px",
  };

  const config = iconSize[size] || iconSize.md;
  const basePath = import.meta.env.BASE_URL || "/";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size === "xl" ? "0" : "12px",
        flexDirection: size === "xl" ? "column" : "row",
      }}
    >
      <img
        src={`${basePath}logo-192.png`}
        alt="ZimHub"
        style={{
          width: `${config.w}px`,
          height: `${config.h}px`,
          borderRadius: `${Math.floor(config.w * 0.22)}px`,
          objectFit: "cover",
          display: "block",
          boxShadow: "0 4px 14px rgba(59, 130, 246, 0.3)",
        }}
        onError={(e) => {
          // Fallback to text Z if image fails
          e.target.style.display = "none";
          e.target.nextSibling.style.display = "flex";
        }}
      />

      {/* Fallback Z icon (hidden by default) */}
      <div
        style={{
          width: `${config.w}px`,
          height: `${config.h}px`,
          borderRadius: `${Math.floor(config.w * 0.22)}px`,
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          color: "#ffffff",
          background:
            "linear-gradient(135deg, #3B82F6 0%, #2563eb 50%, #1d4ed8 100%)",
          boxShadow: "0 4px 14px rgba(59, 130, 246, 0.3)",
          fontFamily: "Inter, sans-serif",
          fontSize: `${config.font}px`,
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
            margin: size === "xl" ? "12px 0 0" : 0,
            fontFamily: "Inter, sans-serif",
          }}
        >
          <span style={{ color: c.text }}>Zim</span>
          <span style={{ color: c.accent }}>Hub</span>
        </h1>
      )}
    </div>
  );
};

export default Logo;
