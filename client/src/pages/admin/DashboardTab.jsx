import { useEffect, useState } from "react";
import {
  Users,
  FileText,
  ClipboardList,
  MessageCircle,
  Heart,
  TrendingUp,
  UserPlus,
  UserX,
  Image,
  Video,
  Type,
  Link2,
} from "lucide-react";

import { adminApi } from "../../api/endpoints/admin.api";
import useTheme from "../../hooks/useTheme";
import StatCard from "../../components/admin/StatCard";
import ActivityFeed from "../../components/admin/ActivityFeed";
import GrowthChart from "../../components/admin/GrowthChart";

const DashboardTab = () => {
  const { c } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await adminApi.getDashboard();
        setStats(response.data);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            border: `3px solid ${c.border}`,
            borderTop: `3px solid ${c.accent}`,
            borderRadius: "50%",
            margin: "0 auto",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`
          @keyframes spin {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Main Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.users.total}
          sublabel={`+${stats.users.new_this_week} this week`}
          color={c.accent}
          bg={c.accentLight}
        />
        <StatCard
          icon={FileText}
          label="Total Posts"
          value={stats.posts.active}
          sublabel={`+${stats.posts.today} today`}
          color="#8b5cf6"
          bg="rgba(139,92,246,0.12)"
        />
        <StatCard
          icon={ClipboardList}
          label="Notices"
          value={stats.notices.total}
          sublabel={`${stats.notices.active} active`}
          color={c.warning}
          bg={c.warningLight}
        />
        <StatCard
          icon={MessageCircle}
          label="Comments"
          value={stats.comments.active}
          sublabel={`+${stats.comments.today} today`}
          color={c.success}
          bg={c.successLight}
        />
        <StatCard
          icon={Heart}
          label="Total Likes"
          value={stats.likes.total}
          color={c.danger}
          bg={c.dangerLight}
        />
        <StatCard
          icon={UserPlus}
          label="New This Month"
          value={stats.users.new_this_month}
          color={c.success}
          bg={c.successLight}
        />
        <StatCard
          icon={UserX}
          label="Suspended"
          value={stats.users.suspended}
          color={c.danger}
          bg={c.dangerLight}
        />
        <StatCard
          icon={TrendingUp}
          label="Posts This Week"
          value={stats.posts.this_week}
          color="#0ea5e9"
          bg="rgba(14,165,233,0.12)"
        />
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: window.innerWidth >= 900 ? "1fr 1fr" : "1fr",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <GrowthChart data={stats.growth} />

        <div
          style={{
            background: c.bgCard,
            borderRadius: "14px",
            border: `1px solid ${c.border}`,
            padding: "16px",
            boxShadow: c.shadowSm,
          }}
        >
          <h3
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: c.text,
              margin: "0 0 4px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            📊 Posts by Type
          </h3>
          <p
            style={{
              fontSize: "11px",
              color: c.textMuted,
              margin: "0 0 16px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Content distribution
          </p>

          <PostTypeBar
            c={c}
            icon={Image}
            label="Photos"
            count={stats.posts.byType.image}
            total={stats.posts.active}
            color={c.accent}
          />
          <PostTypeBar
            c={c}
            icon={Type}
            label="Text"
            count={stats.posts.byType.text}
            total={stats.posts.active}
            color="#8b5cf6"
          />
          <PostTypeBar
            c={c}
            icon={Video}
            label="Videos"
            count={stats.posts.byType.video}
            total={stats.posts.active}
            color={c.danger}
          />
          <PostTypeBar
            c={c}
            icon={Link2}
            label="Links"
            count={stats.posts.byType.link}
            total={stats.posts.active}
            color={c.success}
          />
        </div>
      </div>

      {/* Activity & Recent Users */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: window.innerWidth >= 900 ? "1fr 1fr" : "1fr",
          gap: "16px",
        }}
      >
        <div
          style={{
            background: c.bgCard,
            borderRadius: "14px",
            border: `1px solid ${c.border}`,
            overflow: "hidden",
            boxShadow: c.shadowSm,
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              borderBottom: `1px solid ${c.border}`,
            }}
          >
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: c.text,
                margin: 0,
                fontFamily: "Inter, sans-serif",
              }}
            >
              ⚡ Recent Activity
            </h3>
          </div>
          <ActivityFeed activities={stats.recentActivity} />
        </div>

        <div
          style={{
            background: c.bgCard,
            borderRadius: "14px",
            border: `1px solid ${c.border}`,
            overflow: "hidden",
            boxShadow: c.shadowSm,
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              borderBottom: `1px solid ${c.border}`,
            }}
          >
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: c.text,
                margin: 0,
                fontFamily: "Inter, sans-serif",
              }}
            >
              👥 New Users
            </h3>
          </div>
          <RecentUsersList users={stats.recentUsers} c={c} />
        </div>
      </div>
    </div>
  );
};

const PostTypeBar = ({ icon: Icon, label, count, total, color, c }) => {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div style={{ marginBottom: "10px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "4px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Icon size={13} color={color} />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: c.text,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {label}
          </span>
        </div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: c.textTer,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {count} ({percent}%)
        </span>
      </div>
      <div
        style={{
          height: "6px",
          background: c.bgSubtle,
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background: color,
            borderRadius: "4px",
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
};

const RecentUsersList = ({ users, c }) => {
  if (!users?.length) {
    return (
      <div
        style={{
          padding: "32px 20px",
          textAlign: "center",
          color: c.textMuted,
          fontSize: "13px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        No recent users
      </div>
    );
  }

  return (
    <div>
      {users.map((user) => (
        <div
          key={user.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px",
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg,#3B82F6,#8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                {user.fullName?.charAt(0)?.toUpperCase() || "?"}
              </span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: c.text,
                margin: 0,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {user.fullName || user.username}
            </p>
            <p
              style={{
                fontSize: "11px",
                color: c.textMuted,
                margin: "2px 0 0",
                fontFamily: "Inter, sans-serif",
              }}
            >
              @{user.username}
            </p>
          </div>

          {user.role === "admin" && (
            <span
              style={{
                background: c.accentLight,
                color: c.accent,
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "20px",
                fontFamily: "Inter, sans-serif",
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
                fontFamily: "Inter, sans-serif",
              }}
            >
              SUSPENDED
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default DashboardTab;
