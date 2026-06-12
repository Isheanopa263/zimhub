import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MoreHorizontal,
  Trash2,
  Shield,
  ShieldOff,
  UserX,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";

import { adminApi } from "../../api/endpoints/admin.api";
import useAuthStore from "../../store/authStore";
import useTheme from "../../hooks/useTheme";

const UsersTab = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { c } = useTheme();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const debounceRef = useRef();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getUsers({
        search,
        role: roleFilter,
        status: statusFilter,
        limit: 50,
      });
      setUsers(response.data || []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, statusFilter]);

  const handleToggleSuspension = async (user) => {
    const action = user.isSuspended ? "unsuspend" : "suspend";
    if (!window.confirm(`Are you sure you want to ${action} ${user.fullName}?`))
      return;

    try {
      await adminApi.toggleSuspension(user.id);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isSuspended: !u.isSuspended } : u,
        ),
      );
      toast.success(`User ${action}ed`);
    } catch (err) {
      toast.error(err?.response?.data?.message || `Failed to ${action} user`);
    }
  };

  const handleChangeRole = async (user) => {
    const newRole = user.role === "admin" ? "student" : "admin";
    if (!window.confirm(`Make ${user.fullName} a ${newRole}?`)) return;

    try {
      await adminApi.changeRole(user.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
      );
      toast.success(`Role changed to ${newRole}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change role");
    }
  };

  const handleDelete = async (user) => {
    if (
      !window.confirm(
        `Delete ${user.fullName}? This will permanently delete:\n` +
          `• Their account\n• All their posts (${user.postCount})\n` +
          `• All their notices (${user.noticeCount})\n` +
          `• All comments, likes, and media\n\nThis cannot be undone.`,
      )
    )
      return;

    try {
      await adminApi.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success("User deleted");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ position: "relative", marginBottom: "10px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: c.textMuted,
            }}
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, username or email..."
            style={{
              width: "100%",
              padding: "10px 14px 10px 40px",
              borderRadius: "12px",
              border: `1px solid ${c.borderStrong}`,
              background: c.bgInput,
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
              color: c.text,
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = c.accent)}
            onBlur={(e) => (e.target.style.borderColor = c.borderStrong)}
          />
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <FilterPill
            c={c}
            label="All Roles"
            active={roleFilter === "all"}
            onClick={() => setRoleFilter("all")}
          />
          <FilterPill
            c={c}
            label="Students"
            active={roleFilter === "student"}
            onClick={() => setRoleFilter("student")}
          />
          <FilterPill
            c={c}
            label="Admins"
            active={roleFilter === "admin"}
            onClick={() => setRoleFilter("admin")}
          />
          <div
            style={{
              width: "1px",
              background: c.borderStrong,
              margin: "0 4px",
            }}
          />
          <FilterPill
            c={c}
            label="All"
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
          <FilterPill
            c={c}
            label="Active"
            active={statusFilter === "active"}
            onClick={() => setStatusFilter("active")}
            color={c.success}
          />
          <FilterPill
            c={c}
            label="Suspended"
            active={statusFilter === "suspended"}
            onClick={() => setStatusFilter("suspended")}
            color={c.danger}
          />
        </div>
      </div>

      {loading ? (
        <Loading c={c} />
      ) : users.length === 0 ? (
        <EmptyState c={c} />
      ) : (
        <div
          style={{
            background: c.bgCard,
            borderRadius: "14px",
            border: `1px solid ${c.border}`,
            overflow: "hidden",
          }}
        >
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              c={c}
              isCurrentUser={user.id === currentUser?.id}
              onViewProfile={() => navigate(`/profile/${user.username}`)}
              onToggleSuspension={() => handleToggleSuspension(user)}
              onChangeRole={() => handleChangeRole(user)}
              onDelete={() => handleDelete(user)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FilterPill = ({ label, active, onClick, color, c }) => {
  const fallback = color || c.accent;
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: "20px",
        border: "none",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: active ? 700 : 500,
        background: active ? fallback : c.bgHover,
        color: active ? "#fff" : c.textTer,
        fontFamily: "Inter, sans-serif",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </button>
  );
};

const UserRow = ({
  user,
  isCurrentUser,
  onViewProfile,
  onToggleSuspension,
  onChangeRole,
  onDelete,
  c,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = user.role === "admin";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px",
        borderBottom: `1px solid ${c.border}`,
        background: user.isSuspended ? c.dangerLight : c.bgCard,
        transition: "background 0.15s ease",
      }}
    >
      <div
        onClick={onViewProfile}
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "linear-gradient(135deg,#3B82F6,#8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
          cursor: "pointer",
          opacity: user.isSuspended ? 0.6 : 1,
        }}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.fullName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "15px" }}>
            {user.fullName?.charAt(0)?.toUpperCase() || "?"}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "2px",
          }}
        >
          <p
            onClick={onViewProfile}
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: c.text,
              margin: 0,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.fullName || user.username}
          </p>
          {isAdmin && (
            <span
              style={{
                background: c.accentLight,
                color: c.accent,
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "20px",
                flexShrink: 0,
              }}
            >
              ADMIN
            </span>
          )}
          {user.isSuspended && (
            <span
              style={{
                background: c.dangerLight,
                color: c.danger,
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "20px",
                flexShrink: 0,
              }}
            >
              SUSPENDED
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: "12px",
            color: c.textTer,
            margin: 0,
            fontFamily: "Inter, sans-serif",
          }}
        >
          @{user.username} · {user.email}
        </p>
        <p
          style={{
            fontSize: "11px",
            color: c.textMuted,
            margin: "3px 0 0",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {user.postCount} posts · {user.noticeCount} notices
        </p>
      </div>

      {!isCurrentUser && (
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: c.bgHover,
              border: "none",
              borderRadius: "8px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: c.textTer,
            }}
          >
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <>
              <div
                onClick={() => setMenuOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 40 }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: "4px",
                  background: c.bgCard,
                  borderRadius: "12px",
                  boxShadow: c.shadowLg,
                  border: `1px solid ${c.border}`,
                  padding: "4px",
                  minWidth: "180px",
                  zIndex: 50,
                }}
              >
                <MenuButton
                  icon={user.isSuspended ? UserCheck : UserX}
                  label={user.isSuspended ? "Unsuspend" : "Suspend"}
                  color={user.isSuspended ? c.success : c.warning}
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleSuspension();
                  }}
                />
                <MenuButton
                  icon={isAdmin ? ShieldOff : Shield}
                  label={isAdmin ? "Make Student" : "Make Admin"}
                  color={c.accent}
                  onClick={() => {
                    setMenuOpen(false);
                    onChangeRole();
                  }}
                />
                <div
                  style={{
                    height: "1px",
                    background: c.border,
                    margin: "4px 0",
                  }}
                />
                <MenuButton
                  icon={Trash2}
                  label="Delete User"
                  color={c.danger}
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const MenuButton = ({ icon: Icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      width: "100%",
      padding: "8px 10px",
      border: "none",
      background: "none",
      cursor: "pointer",
      borderRadius: "8px",
      color,
      fontSize: "12px",
      fontWeight: 600,
      fontFamily: "Inter, sans-serif",
      textAlign: "left",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = `${color}15`)}
    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
  >
    <Icon size={13} />
    {label}
  </button>
);

const Loading = ({ c }) => (
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

const EmptyState = ({ c }) => (
  <div
    style={{
      padding: "60px 20px",
      textAlign: "center",
      background: c.bgCard,
      borderRadius: "14px",
      border: `1px solid ${c.border}`,
    }}
  >
    <div style={{ fontSize: "36px", marginBottom: "8px" }}>👥</div>
    <p
      style={{
        color: c.textTer,
        fontSize: "14px",
        fontFamily: "Inter, sans-serif",
        margin: 0,
      }}
    >
      No users match these filters
    </p>
  </div>
);

export default UsersTab;
