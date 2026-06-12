const Logo = ({ size = "md", showText = true }) => {
  const iconSizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-2xl",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${iconSizes[size]} rounded-2xl flex items-center justify-center font-black text-white`}
        style={{
          background:
            "linear-gradient(135deg, #3B82F6 0%, #2563eb 50%, #1d4ed8 100%)",
          boxShadow: "0 8px 32px rgba(59, 130, 246, 0.35)",
        }}
      ></div>
      {showText && (
        <h1 className={`${textSizes[size]} font-black tracking-tight`}>
          <span style={{ color: "#0F172A" }}>Zim</span>
          <span style={{ color: "#3B82F6" }}>Hub</span>
        </h1>
      )}
    </div>
  );
};

export default Logo;
