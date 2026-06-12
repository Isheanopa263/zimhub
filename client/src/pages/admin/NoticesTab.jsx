import { useEffect, useState } from "react";
import { Trash2, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";

import { adminApi } from "../../api/endpoints/admin.api";
import useTheme from "../../hooks/useTheme";

const NoticesTab = () => {
  const { c } = useTheme();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getNotices({ limit: 50 });
      setNotices(response.data || []);
    } catch {
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (notice) => {
    if (!window.confirm(`Delete notice: "${notice.title}"?`)) return;
    try {
      await adminApi.deleteNotice(notice.id);
      setNotices((prev) => prev.filter((n) => n.id !== notice.id));
      toast.success("Notice deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            border: `3px solid ${c.border}`,
            borderTop: `3px solid ${c.accent}`,
            borderRadius: "50%",
            margin: "0 auto",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { 0% { transform: rotate(0); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notices.length === 0) {
    return (
      <div
        style={{
          padding: "60px 20px",
          textAlign: "center",
          background: c.bgCard,
          borderRadius: "14px",
          border: `1px solid ${c.border}`,
        }}
      >
        <div style={{ fontSize: "36px", marginBottom: "8px" }}>📋</div>
        <p
          style={{
            color: c.textTer,
            fontSize: "14px",
            margin: 0,
            fontFamily: "Inter, sans-serif",
          }}
        >
          No notices to moderate
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: c.bgCard,
        borderRadius: "14px",
        border: `1px solid ${c.border}`,
        overflow: "hidden",
      }}
    >
      {notices.map((notice) => {
        const Icon = notice.status === "active" ? CheckCircle2 : XCircle;
        const color = notice.status === "active" ? c.success : c.textMuted;

        return (
          <div
            key={notice.id}
            style={{
              padding: "14px",
              borderBottom: `1px solid ${c.border}`,
              display: "flex",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: `${color}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={18} color={color} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: c.text,
                  margin: "0 0 4px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {notice.title}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: c.textTer,
                  margin: "0 0 6px",
                  fontFamily: "Inter, sans-serif",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {notice.description}
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: c.textMuted,
                  margin: 0,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                by @{notice.author.username} ·{" "}
                {new Date(notice.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>

            <button
              onClick={() => handleDelete(notice)}
              style={{
                background: c.dangerLight,
                border: "none",
                borderRadius: "8px",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: c.danger,
                flexShrink: 0,
                alignSelf: "flex-start",
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default NoticesTab;
