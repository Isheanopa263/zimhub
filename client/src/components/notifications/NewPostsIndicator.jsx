import { ArrowUp } from "lucide-react";

const NewPostsIndicator = ({ count, onClick }) => {
  if (count <= 0) return null;

  return (
    <div
      style={{
        position: "sticky",
        top: "70px",
        zIndex: 30,
        display: "flex",
        justifyContent: "center",
        padding: "8px 0",
        pointerEvents: "none",
      }}
    >
      <button
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 18px",
          background: "linear-gradient(135deg, #3B82F6, #2563eb)",
          color: "#ffffff",
          border: "none",
          borderRadius: "24px",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 700,
          fontFamily: "Inter, sans-serif",
          boxShadow: "0 6px 20px rgba(59,130,246,0.45)",
          pointerEvents: "auto",
          animation: "bounceIn 0.4s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(59,130,246,0.55)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.45)";
        }}
      >
        <ArrowUp size={14} strokeWidth={3} />
        {count === 1 ? "1 new post" : `${count > 9 ? "9+" : count} new posts`}
      </button>

      <style>{`
        @keyframes bounceIn {
          0%   { transform: translateY(-20px); opacity: 0; }
          60%  { transform: translateY(4px);   opacity: 1; }
          100% { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default NewPostsIndicator;
