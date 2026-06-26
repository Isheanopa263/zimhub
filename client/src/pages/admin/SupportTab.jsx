import { useState, useEffect } from "react";
import {
  MessageCircle,
  Lightbulb,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  Search,
  ChevronRight,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  Archive,
  Inbox,
} from "lucide-react";
import toast from "react-hot-toast";

import { supportApi } from "../../api/endpoints/support.api";
import useTheme from "../../hooks/useTheme";
import QueryThreadView from "../../components/support/QueryThreadView";

const TABS = [
  { key: "queries", label: "Queries", icon: MessageCircle },
  { key: "suggestions", label: "Suggestions", icon: Lightbulb },
];

const SupportTab = () => {
  const { c } = useTheme();
  const [activeView, setActiveView] = useState("queries");
  const [activeQueryId, setActiveQueryId] = useState(null);

  if (activeQueryId) {
    return (
      <QueryThreadView
        queryId={activeQueryId}
        onBack={() => setActiveQueryId(null)}
        isAdmin={true}
      />
    );
  }

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Sub-tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "16px",
          background: c.bgCard,
          padding: "4px",
          borderRadius: "12px",
          border: `1px solid ${c.border}`,
        }}
      >
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = activeView === key;
          return (
            <button
              key={key}
              onClick={() => setActiveView(key)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "9px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: active ? 700 : 500,
                background: active
                  ? "linear-gradient(135deg, #3B82F6, #2563eb)"
                  : "transparent",
                color: active ? "#fff" : c.textTer,
                fontFamily: "Inter, sans-serif",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {activeView === "queries" ? (
        <QueriesView c={c} onOpenQuery={setActiveQueryId} />
      ) : (
        <SuggestionsView c={c} />
      )}
    </div>
  );
};

/* ─── Admin Queries View ─── */
const QueriesView = ({ c, onOpenQuery }) => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    search: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const response = await supportApi.adminGetQueries({
        ...filters,
        status: filters.status === "all" ? undefined : filters.status,
        priority: filters.priority === "all" ? undefined : filters.priority,
        search: filters.search || undefined,
        limit: 50,
      });
      setQueries(response.data || []);
    } catch {
      toast.error("Failed to load queries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters]);

  return (
    <div>
      {/* Filters */}
      <div style={{ marginBottom: "14px" }}>
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
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search queries..."
            style={{
              width: "100%",
              padding: "10px 14px 10px 40px",
              borderRadius: "12px",
              border: `1px solid ${c.borderStrong}`,
              background: c.bgInput,
              fontSize: "14px",
              color: c.text,
              outline: "none",
              fontFamily: "Inter, sans-serif",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["all", "open", "in_progress", "resolved", "closed"].map((s) => (
            <Pill
              key={s}
              c={c}
              active={filters.status === s}
              onClick={() => setFilters({ ...filters, status: s })}
            >
              {s === "all" ? "All Status" : s.replace("_", " ")}
            </Pill>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            marginTop: "6px",
          }}
        >
          {["all", "urgent", "high", "normal", "low"].map((p) => (
            <Pill
              key={p}
              c={c}
              active={filters.priority === p}
              onClick={() => setFilters({ ...filters, priority: p })}
            >
              {p === "all" ? "All Priority" : p}
            </Pill>
          ))}
        </div>
      </div>

      {loading ? (
        <Loading c={c} />
      ) : queries.length === 0 ? (
        <EmptyMessage
          c={c}
          icon="📭"
          message="No queries match these filters"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {queries.map((q) => (
            <AdminQueryCard
              key={q.id}
              query={q}
              c={c}
              onClick={() => onOpenQuery(q.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AdminQueryCard = ({ query, c, onClick }) => {
  const statusConfig = {
    open: {
      color: "#3B82F6",
      bg: "rgba(59,130,246,0.12)",
      icon: AlertCircle,
      label: "Open",
    },
    in_progress: {
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
      icon: Clock,
      label: "In Progress",
    },
    resolved: {
      color: "#10b981",
      bg: "rgba(16,185,129,0.12)",
      icon: CheckCircle2,
      label: "Resolved",
    },
    closed: {
      color: "#64748b",
      bg: "rgba(100,116,139,0.12)",
      icon: X,
      label: "Closed",
    },
  };

  const priorityColors = {
    low: "#64748b",
    normal: "#3B82F6",
    high: "#f59e0b",
    urgent: "#ef4444",
  };

  const config = statusConfig[query.status];
  const StatusIcon = config.icon;
  const priorityColor = priorityColors[query.priority];
  const hasUnread = query.unreadUserMessages > 0;

  return (
    <div
      onClick={onClick}
      style={{
        padding: "14px",
        background: hasUnread ? c.accentLight : c.bgCard,
        borderRadius: "12px",
        border: `1px solid ${hasUnread ? c.accent + "40" : c.border}`,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = c.shadowMd)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Status icon */}
      <div
        style={{
          width: "40px",
          height: "40px",
          background: config.bg,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <StatusIcon size={18} color={config.color} />
      </div>

      {/* User avatar */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #3B82F6, #8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {query.user.avatarUrl ? (
          <img
            src={query.user.avatarUrl}
            alt={query.user.fullName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "12px" }}>
            {query.user.fullName?.charAt(0)?.toUpperCase() || "?"}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "4px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              background: config.bg,
              color: config.color,
              fontSize: "9px",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: "6px",
              textTransform: "uppercase",
            }}
          >
            {config.label}
          </span>
          <span
            style={{
              background: `${priorityColor}15`,
              color: priorityColor,
              fontSize: "9px",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: "6px",
              textTransform: "uppercase",
            }}
          >
            {query.priority}
          </span>
          {hasUnread && (
            <span
              style={{
                background: "#ef4444",
                color: "#fff",
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "20px",
              }}
            >
              {query.unreadUserMessages} NEW
            </span>
          )}
        </div>

        <p
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: c.text,
            margin: "0 0 2px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {query.subject}
        </p>

        <p
          style={{
            fontSize: "11px",
            color: c.textMuted,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {query.user.fullName} · @{query.user.username} · {query.replyCount}{" "}
          messages
        </p>
      </div>

      <ChevronRight size={18} color={c.textMuted} />
    </div>
  );
};

/* ─── Admin Suggestions View ─── */
const SuggestionsView = ({ c }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "all",
    isRead: undefined,
    isArchived: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [sugRes, statsRes] = await Promise.all([
        supportApi.adminGetSuggestions({
          ...filters,
          category: filters.category === "all" ? undefined : filters.category,
          limit: 50,
        }),
        supportApi.adminGetSuggestionStats(),
      ]);
      setSuggestions(sugRes.data || []);
      setStats(statsRes.data);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters]);

  const handleMarkRead = async (id, isRead) => {
    try {
      await supportApi.adminMarkSuggestionRead(id, isRead);
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isRead } : s)),
      );
    } catch {}
  };

  const handleArchive = async (id) => {
    try {
      await supportApi.adminArchiveSuggestion(id, true);
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Archived");
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this suggestion?")) return;
    try {
      await supportApi.adminDeleteSuggestion(id);
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Deleted");
    } catch {}
  };

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "8px",
            marginBottom: "14px",
          }}
        >
          <MiniStat c={c} label="Total" value={stats.total} />
          <MiniStat
            c={c}
            label="Unread"
            value={stats.unread}
            color={c.accent}
          />
          <MiniStat
            c={c}
            label="This week"
            value={stats.this_week}
            color={c.success}
          />
          <MiniStat
            c={c}
            label="Archived"
            value={stats.archived}
            color={c.textMuted}
          />
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          flexWrap: "wrap",
          marginBottom: "14px",
        }}
      >
        {[
          { key: "all", label: "All" },
          { key: "feature_idea", label: "Features" },
          { key: "improvement", label: "Improvements" },
          { key: "feedback", label: "Feedback" },
          { key: "general", label: "General" },
        ].map((cat) => (
          <Pill
            key={cat.key}
            c={c}
            active={filters.category === cat.key}
            onClick={() => setFilters({ ...filters, category: cat.key })}
          >
            {cat.label}
          </Pill>
        ))}

        <div style={{ flex: 1 }} />

        <Pill
          c={c}
          active={filters.isArchived === true}
          onClick={() =>
            setFilters({ ...filters, isArchived: !filters.isArchived })
          }
        >
          {filters.isArchived ? "📦 Showing Archived" : "📦 Show Archived"}
        </Pill>
      </div>

      {loading ? (
        <Loading c={c} />
      ) : suggestions.length === 0 ? (
        <EmptyMessage c={c} icon="💡" message="No suggestions yet" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {suggestions.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              c={c}
              onMarkRead={(isRead) => handleMarkRead(s.id, isRead)}
              onArchive={() => handleArchive(s.id)}
              onDelete={() => handleDelete(s.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SuggestionCard = ({ suggestion, c, onMarkRead, onArchive, onDelete }) => {
  const categoryConfig = {
    feature_idea: { label: "Feature", color: "#8b5cf6" },
    improvement: { label: "Improvement", color: "#3B82F6" },
    feedback: { label: "Feedback", color: "#10b981" },
    general: { label: "General", color: "#f59e0b" },
  };
  const cat = categoryConfig[suggestion.category] || categoryConfig.general;

  return (
    <div
      style={{
        padding: "14px",
        background: suggestion.isRead ? c.bgCard : c.accentLight,
        borderRadius: "12px",
        border: `1px solid ${suggestion.isRead ? c.border : c.accent + "40"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "8px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            background: `${cat.color}15`,
            color: cat.color,
            fontSize: "10px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "6px",
            textTransform: "uppercase",
          }}
        >
          {cat.label}
        </span>
        {!suggestion.isRead && (
          <span
            style={{
              background: c.accent,
              color: "#fff",
              fontSize: "9px",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: "20px",
            }}
          >
            NEW
          </span>
        )}
        <span
          style={{ fontSize: "11px", color: c.textMuted, marginLeft: "auto" }}
        >
          {new Date(suggestion.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      <p
        style={{
          fontSize: "13px",
          color: c.text,
          margin: "0 0 12px",
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {suggestion.content}
      </p>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        <ActionBtn
          c={c}
          icon={suggestion.isRead ? EyeOff : Eye}
          label={suggestion.isRead ? "Mark Unread" : "Mark Read"}
          color={c.textTer}
          onClick={() => onMarkRead(!suggestion.isRead)}
        />
        <ActionBtn
          c={c}
          icon={Archive}
          label="Archive"
          color={c.warning}
          onClick={onArchive}
        />
        <ActionBtn
          c={c}
          icon={Trash2}
          label="Delete"
          color={c.danger}
          onClick={onDelete}
        />
      </div>
    </div>
  );
};

const ActionBtn = ({ icon: Icon, label, color, onClick, c }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "5px",
      padding: "5px 10px",
      background: `${color}15`,
      border: "none",
      borderRadius: "8px",
      color,
      fontSize: "11px",
      fontWeight: 600,
      cursor: "pointer",
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
    <Icon size={11} />
    {label}
  </button>
);

const MiniStat = ({ label, value, color, c }) => (
  <div
    style={{
      padding: "10px",
      background: c.bgCard,
      borderRadius: "10px",
      border: `1px solid ${c.border}`,
      textAlign: "center",
    }}
  >
    <p
      style={{
        fontSize: "18px",
        fontWeight: 800,
        color: color || c.text,
        margin: 0,
      }}
    >
      {value}
    </p>
    <p
      style={{
        fontSize: "10px",
        color: c.textMuted,
        margin: "2px 0 0",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        fontWeight: 600,
      }}
    >
      {label}
    </p>
  </div>
);

const Pill = ({ active, onClick, children, c }) => (
  <button
    onClick={onClick}
    style={{
      padding: "6px 12px",
      borderRadius: "20px",
      border: "none",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: active ? 700 : 500,
      background: active ? c.accent : c.bgHover,
      color: active ? "#fff" : c.textTer,
      fontFamily: "Inter, sans-serif",
      textTransform: "capitalize",
    }}
  >
    {children}
  </button>
);

const Loading = ({ c }) => (
  <div style={{ padding: "40px", textAlign: "center" }}>
    <Loader2
      size={28}
      color={c.accent}
      style={{ animation: "spin 1s linear infinite" }}
    />
    <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
  </div>
);

const EmptyMessage = ({ c, icon, message }) => (
  <div
    style={{
      padding: "50px 20px",
      textAlign: "center",
      background: c.bgCard,
      borderRadius: "12px",
      border: `1px solid ${c.border}`,
    }}
  >
    <div style={{ fontSize: "40px", marginBottom: "8px" }}>{icon}</div>
    <p
      style={{
        fontSize: "14px",
        color: c.textTer,
        margin: 0,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {message}
    </p>
  </div>
);

export default SupportTab;
