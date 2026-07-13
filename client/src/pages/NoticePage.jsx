import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  Inbox,
  User,
} from "lucide-react";

import useNotices from "../hooks/useNotices";
import useTheme from "../hooks/useTheme";

import NoticeCard from "../components/notices/NoticeCard";
import NoticeFormModal from "../components/notices/NoticeFormModal";
import NoticesSkeleton from "../components/notices/NoticesSkeleton";

const TABS = [
  { key: "all", label: "All", icon: Inbox },
  { key: "active", label: "Active", icon: CheckCircle2 },
  { key: "closed", label: "Closed", icon: XCircle },
  { key: "mine", label: "My Notices", icon: User },
];

const NoticePage = () => {
  const { c } = useTheme();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);

  const {
    notices,
    loading,
    loadingMore,
    hasMore,
    loadNotices,
    loadMore,
    addNotice,
    updateNotice,
    toggleNoticeStatus,
    removeNotice,
  } = useNotices();

  const observerRef = useRef();
  const searchTimerRef = useRef();

  const buildFilters = () => {
    const filters = { search: searchQuery };
    if (activeTab === "mine") {
      filters.mine = true;
    } else if (activeTab !== "all") {
      filters.status = activeTab;
    }
    return filters;
  };

  useEffect(() => {
    loadNotices(buildFilters());
  }, [activeTab, searchQuery]);

  useEffect(() => {
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 400);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchInput]);

  const lastNoticeRef = useCallback(
    (node) => {
      if (loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore(buildFilters());
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loadingMore, hasMore, activeTab, searchQuery],
  );

  const handleNewNotice = () => {
    setEditingNotice(null);
    setModalOpen(true);
  };

  const handleEditNotice = (notice) => {
    setEditingNotice(notice);
    setModalOpen(true);
  };

  const handleNoticeSuccess = (notice) => {
    if (editingNotice) {
      updateNotice(notice);
    } else {
      addNotice(notice);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this notice? This cannot be undone.")) return;
    await removeNotice(id);
  };

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        paddingBottom: "20px",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 0 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: c.text,
                margin: 0,
              }}
            >
              📋 Notice Board
            </h1>
            <p
              style={{
                fontSize: "12px",
                color: c.textTer,
                margin: "2px 0 0",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Community notices & opportunities
            </p>
          </div>

          <button
            onClick={handleNewNotice}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 14px",
              background: "linear-gradient(135deg,#3B82F6,#2563eb)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Post Notice
          </button>
        </div>

        {/* Search */}
        <div
          style={{
            position: "relative",
            marginBottom: "12px",
          }}
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: c.textMuted,
              pointerEvents: "none",
            }}
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search notices..."
            style={{
              width: "100%",
              padding: "11px 14px 11px 40px",
              paddingRight: searchInput ? "40px" : "14px",
              borderRadius: "12px",
              border: `1px solid ${c.borderStrong}`,
              background: c.bgInput,
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
              color: c.text,
              outline: "none",
              transition: "border-color 0.15s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = c.accent)}
            onBlur={(e) => (e.target.style.borderColor = c.borderStrong)}
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: c.bgHover,
                border: "none",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: c.textTer,
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
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
                  gap: "5px",
                  padding: "8px 14px",
                  borderRadius: "20px",
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontSize: "13px",
                  fontWeight: active ? 700 : 500,
                  fontFamily: "Inter, sans-serif",
                  background: active
                    ? "linear-gradient(135deg,#3B82F6,#2563eb)"
                    : c.bgHover,
                  color: active ? "#ffffff" : c.textTer,
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                  boxShadow: active ? "0 2px 8px rgba(59,130,246,0.3)" : "none",
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <NoticesSkeleton count={3} />
      ) : notices.length === 0 ? (
        <EmptyState
          searchQuery={searchQuery}
          activeTab={activeTab}
          onCreateClick={handleNewNotice}
          c={c}
        />
      ) : (
        <>
          {notices.map((notice, index) => {
            const isLast = index === notices.length - 1;
            return (
              <div key={notice.id} ref={isLast ? lastNoticeRef : undefined}>
                <NoticeCard
                  notice={notice}
                  onEdit={() => handleEditNotice(notice)}
                  onDelete={() => handleDelete(notice.id)}
                  onToggleStatus={() => toggleNoticeStatus(notice.id)}
                />
              </div>
            );
          })}

          {loadingMore && (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div
                style={{
                  width: "24px",
                  height: "24px",
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
          )}

          {!hasMore && notices.length > 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "24px 20px",
                color: c.textFaint,
                fontSize: "13px",
              }}
            >
              ✓ End of notices
            </div>
          )}
        </>
      )}

      <NoticeFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleNoticeSuccess}
        editingNotice={editingNotice}
      />
    </div>
  );
  /* Listen for nav-tap-refresh */
  useEffect(() => {
    const handleRefresh = (e) => {
      if (e.detail?.page === "/notices") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        loadNotices(buildFilters());
      }
    };

    window.addEventListener("nav-tap-refresh", handleRefresh);
    return () => window.removeEventListener("nav-tap-refresh", handleRefresh);
  }, [activeTab, searchQuery]);
};

const EmptyState = ({ searchQuery, activeTab, onCreateClick, c }) => {
  if (searchQuery) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          background: c.bgCard,
          borderRadius: "16px",
          border: `1px solid ${c.border}`,
        }}
      >
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: c.textTer,
            margin: "0 0 4px",
          }}
        >
          No results for "{searchQuery}"
        </h3>
        <p
          style={{
            fontSize: "13px",
            color: c.textMuted,
            margin: 0,
          }}
        >
          Try different keywords
        </p>
      </div>
    );
  }

  const emptyByTab = {
    all: {
      icon: "📋",
      title: "No notices yet",
      sub: "Be the first to post a notice!",
    },
    active: {
      icon: "✅",
      title: "No active notices",
      sub: "All current notices are closed",
    },
    closed: {
      icon: "🔒",
      title: "No closed notices",
      sub: "No notices have been closed",
    },
    mine: {
      icon: "👤",
      title: "You haven't posted any notices",
      sub: "Share something with the community",
    },
  };

  const config = emptyByTab[activeTab] || emptyByTab.all;

  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 20px",
        background: c.bgCard,
        borderRadius: "16px",
        border: `1px solid ${c.border}`,
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "14px" }}>
        {config.icon}
      </div>
      <h3
        style={{
          fontSize: "17px",
          fontWeight: 700,
          color: c.textTer,
          margin: "0 0 6px",
        }}
      >
        {config.title}
      </h3>
      <p
        style={{
          fontSize: "13px",
          color: c.textMuted,
          margin: "0 0 20px",
        }}
      >
        {config.sub}
      </p>
      {(activeTab === "all" || activeTab === "mine") && (
        <button
          onClick={onCreateClick}
          style={{
            background: "linear-gradient(135deg,#3B82F6,#2563eb)",
            color: "#ffffff",
            border: "none",
            padding: "12px 24px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
          }}
        >
          Post Your First Notice
        </button>
      )}
    </div>
  );
};

export default NoticePage;
