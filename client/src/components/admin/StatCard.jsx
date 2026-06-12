import useTheme from "../../hooks/useTheme";

const StatCard = ({ icon: Icon, label, value, sublabel, color, bg }) => {
  const { c } = useTheme();

  // Fall back to theme colors if not specified
  const finalColor = color || c.accent;
  const finalBg = bg || c.accentLight;

  return (
    <div
      style={{
        background: c.bgCard,
        borderRadius: "14px",
        border: `1px solid ${c.border}`,
        padding: "16px",
        boxShadow: c.shadowSm,
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = c.shadowMd;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = c.shadowSm;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: c.textMuted,
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {label}
        </p>

        {Icon && (
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: finalBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={16} color={finalColor} strokeWidth={2.5} />
          </div>
        )}
      </div>

      <p
        style={{
          fontSize: "26px",
          fontWeight: 800,
          color: c.text,
          margin: 0,
          lineHeight: 1.1,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {value?.toLocaleString() || "0"}
      </p>

      {sublabel && (
        <p
          style={{
            fontSize: "11px",
            color: c.textTer,
            margin: "6px 0 0",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {sublabel}
        </p>
      )}
    </div>
  );
};

export default StatCard;
