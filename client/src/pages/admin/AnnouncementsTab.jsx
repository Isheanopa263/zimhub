import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Send, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

import { adminApi } from "../../api/endpoints/admin.api";
import useTheme from "../../hooks/useTheme";
import AnnouncementModal from "../../components/admin/AnnouncementModal";

const AnnouncementsTab = () => {
  const { c } = useTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAnnouncements({ limit: 50 });
      setAnnouncements(response.data || []);
    } catch {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleNew = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const handleEdit = (a) => {
    setEditing(a);
    setModalOpen(true);
  };

  const handleSuccess = (a) => {
    if (editing) {
      setAnnouncements((prev) =>
        prev.map((x) => (x.id === a.id ? { ...x, ...a } : x)),
      );
    } else {
      setAnnouncements((prev) => [a, ...prev]);
    }
  };

  const handleToggle = async (a) => {
    try {
      const response = await adminApi.updateAnnouncement(a.id, {
        isActive: !a.isActive,
      });
      setAnnouncements((prev) =>
        prev.map((x) =>
          x.id === a.id ? { ...x, isActive: response.data.is_active } : x,
        ),
      );
      toast.success(response.data.is_active ? "Activated" : "Deactivated");
    } catch {
      toast.error("Failed to toggle");
    }
  };

  const handleDelete = async (a) => {
    if (!window.confirm(`Delete "${a.title}"?`)) return;
    try {
      await adminApi.deleteAnnouncement(a.id);
      setAnnouncements((prev) => prev.filter((x) => x.id !== a.id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleBroadcast = async (a) => {
    if (!window.confirm(`Send "${a.title}" as a notification to ALL users?`))
      return;
    try {
      const response = await adminApi.broadcastAnnouncement(a.id);
      toast.success(response.message);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to broadcast");
    }
  };

  return (
    <div>
      <button
        onClick={handleNew}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          marginBottom: "16px",
          background: "linear-gradient(135deg,#3B82F6,#2563eb)",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 700,
          fontFamily: "Inter, sans-serif",
          boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
        }}
      >
        <Plus size={16} strokeWidth={2.5} />
        New Announcement
      </button>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: c.textTer }}>
          Loading...
        </div>
      ) : announcements.length === 0 ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            background: c.bgCard,
            borderRadius: "14px",
            border: `1px solid ${c.border}`,
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>📢</div>
          <p style={{ color: c.textTer, fontFamily: "Inter, sans-serif" }}>
            No announcements yet
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {announcements.map((a) => (
            <div
              key={a.id}
              style={{
                background: c.bgCard,
                borderRadius: "14px",
                border: `1px solid ${a.isActive ? c.accent + "40" : c.border}`,
                padding: "14px",
                opacity: a.isActive ? 1 : 0.7,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "4px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: c.text,
                        margin: 0,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      📢 {a.title}
                    </h3>
                    {a.isActive ? (
                      <span
                        style={{
                          background: c.successLight,
                          color: c.success,
                          fontSize: "9px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "6px",
                        }}
                      >
                        ACTIVE
                      </span>
                    ) : (
                      <span
                        style={{
                          background: c.bgHover,
                          color: c.textMuted,
                          fontSize: "9px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "6px",
                        }}
                      >
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      color: c.textSec,
                      margin: 0,
                      lineHeight: 1.5,
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {a.content}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: c.textMuted,
                      margin: "8px 0 0",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Created {new Date(a.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <ActionBtn
                  icon={a.isActive ? EyeOff : Eye}
                  label={a.isActive ? "Deactivate" : "Activate"}
                  color={c.textTer}
                  onClick={() => handleToggle(a)}
                />
                <ActionBtn
                  icon={Edit2}
                  label="Edit"
                  color={c.accent}
                  onClick={() => handleEdit(a)}
                />
                {a.isActive && (
                  <ActionBtn
                    icon={Send}
                    label="Broadcast"
                    color={c.success}
                    onClick={() => handleBroadcast(a)}
                  />
                )}
                <ActionBtn
                  icon={Trash2}
                  label="Delete"
                  color={c.danger}
                  onClick={() => handleDelete(a)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <AnnouncementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

const ActionBtn = ({ icon: Icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "5px",
      padding: "6px 12px",
      background: `${color}15`,
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      color,
      fontSize: "12px",
      fontWeight: 600,
      fontFamily: "Inter, sans-serif",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = color;
      e.currentTarget.style.color = "#fff";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = `${color}15`;
      e.currentTarget.style.color = color;
    }}
  >
    <Icon size={12} />
    {label}
  </button>
);

export default AnnouncementsTab;
