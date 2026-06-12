import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  Megaphone,
  Shield,
} from "lucide-react";

import useTheme from "../../hooks/useTheme";
import DashboardTab from "./DashboardTab";
import UsersTab from "./UsersTab";
import PostsTab from "./PostsTab";
import NoticesTab from "./NoticesTab";
import AnnouncementsTab from "./AnnouncementsTab";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "users", label: "Users", icon: Users },
  { key: "posts", label: "Posts", icon: FileText },
  { key: "notices", label: "Notices", icon: ClipboardList },
  { key: "announcements", label: "Announcements", icon: Megaphone },
];

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { c } = useTheme();

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab />;
      case "users":
        return <UsersTab />;
      case "posts":
        return <PostsTab />;
      case "notices":
        return <NoticesTab />;
      case "announcements":
        return <AnnouncementsTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        paddingBottom: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "16px 0 12px",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "12px",
            background: "linear-gradient(135deg,#3B82F6,#2563eb)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
          }}
        >
          <Shield size={20} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: c.text,
              margin: 0,
            }}
          >
            Admin Panel
          </h1>
          <p style={{ fontSize: "12px", color: c.textTer, margin: "2px 0 0" }}>
            Manage the ZimHub platform
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "20px",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          background: c.bgCard,
          padding: "4px",
          borderRadius: "14px",
          border: `1px solid ${c.border}`,
        }}
      >
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontSize: "13px",
                fontWeight: active ? 700 : 500,
                background: active
                  ? "linear-gradient(135deg,#3B82F6,#2563eb)"
                  : "transparent",
                color: active ? "#fff" : c.textTer,
                transition: "all 0.15s ease",
                fontFamily: "Inter, sans-serif",
                flexShrink: 0,
                boxShadow: active ? "0 2px 8px rgba(59,130,246,0.3)" : "none",
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {renderContent()}
    </div>
  );
};

export default AdminPage;
