import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Lightbulb,
  Plus,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

import useTheme from "../hooks/useTheme";
import { supportApi } from "../api/endpoints/support.api";

import CreateQueryModal from "../components/support/CreateQueryModal";
import SuggestionBoxModal from "../components/support/SuggestionBoxModal";
import QueryThreadView from "../components/support/QueryThreadView";

const SupportPage = () => {
  const navigate = useNavigate();
  const { c } = useTheme();

  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false);
  const [activeQueryId, setActiveQueryId] = useState(null);

  const loadQueries = async () => {
    setLoading(true);
    try {
      const response = await supportApi.getMyQueries({
        status: activeFilter === "all" ? undefined : activeFilter,
        limit: 30,
      });
      setQueries(response.data || []);
    } catch {
      toast.error("Failed to load queries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueries();

    // Poll every 30 seconds for status updates on queries
    const interval = setInterval(() => {
      if (!document.hidden && !activeQueryId) {
        loadQueries();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeFilter, activeQueryId]);

  const handleQueryCreated = () => {
    setQueryModalOpen(false);
    loadQueries();
  };

  /* Open thread view */
  if (activeQueryId) {
    return (
      <QueryThreadView
        queryId={activeQueryId}
        onBack={() => {
          setActiveQueryId(null);
          loadQueries();
        }}
        isAdmin={false}
      />
    );
  }

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
          padding: "16px 0 20px",
        }}
      >
        <button
          onClick={() => navigate("/settings")}
          style={{
            background: c.bgHover,
            border: "none",
            borderRadius: "10px",
            width: "34px",
            height: "34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: c.text,
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: c.text,
              margin: 0,
            }}
          >
            🆘 Support
          </h1>
          <p
            style={{
              fontSize: "12px",
              color: c.textTer,
              margin: "2px 0 0",
            }}
          >
            Get help or share your ideas
          </p>
        </div>
      </div>

      {/* Action Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: window.innerWidth >= 600 ? "1fr 1fr" : "1fr",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <ActionCard
          c={c}
          icon={MessageCircle}
          iconColor={c.accent}
          iconBg={c.accentLight}
          title="Send a Query"
          description="Get private support from admins. They'll reply directly to you."
          buttonText="New Query"
          onClick={() => setQueryModalOpen(true)}
        />

        <ActionCard
          c={c}
          icon={Lightbulb}
          iconColor={c.warning}
          iconBg={c.warningLight}
          title="Suggestion Box"
          description="Share an anonymous suggestion. Admins read but won't reply."
          buttonText="Submit Idea"
          onClick={() => setSuggestionModalOpen(true)}
          variant="warning"
        />
      </div>

      {/* My Queries Section */}
      <div style={{ marginBottom: "16px" }}>
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: c.text,
            margin: "0 0 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          My Queries
          {queries.length > 0 && (
            <span
              style={{
                background: c.bgHover,
                color: c.textTer,
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "20px",
                fontWeight: 600,
              }}
            >
              {queries.length}
            </span>
          )}
        </h2>

        {/* Filter pills */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            marginBottom: "12px",
          }}
        >
          {[
            { key: "all", label: "All" },
            { key: "open", label: "Open" },
            { key: "in_progress", label: "In Progress" },
            { key: "resolved", label: "Resolved" },
            { key: "closed", label: "Closed" },
          ].map(({ key, label }) => (
            <FilterPill
              key={key}
              c={c}
              active={activeFilter === key}
              onClick={() => setActiveFilter(key)}
            >
              {label}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Queries list */}
      {loading ? (
        <Loading c={c} />
      ) : queries.length === 0 ? (
        <EmptyState
          c={c}
          onCreate={() => setQueryModalOpen(true)}
          filter={activeFilter}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {queries.map((query) => (
            <QueryCard
              key={query.id}
              query={query}
              c={c}
              onClick={() => setActiveQueryId(query.id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateQueryModal
        isOpen={queryModalOpen}
        onClose={() => setQueryModalOpen(false)}
        onSuccess={handleQueryCreated}
      />

      <SuggestionBoxModal
        isOpen={suggestionModalOpen}
        onClose={() => setSuggestionModalOpen(false)}
      />
    </div>
  );
};

/* ─── Components ──────────────────────────────────────────────── */

const ActionCard = ({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  buttonText,
  onClick,
  c,
  variant,
}) => (
  <div
    style={{
      background: c.bgCard,
      borderRadius: "16px",
      border: `1px solid ${c.border}`,
      padding: "18px",
      boxShadow: c.shadowSm,
      transition: "all 0.15s ease",
    }}
  >
    <div
      style={{
        width: "44px",
        height: "44px",
        background: iconBg,
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "12px",
      }}
    >
      <Icon size={20} color={iconColor} strokeWidth={2.5} />
    </div>

    <h3
      style={{
        fontSize: "16px",
        fontWeight: 700,
        color: c.text,
        margin: "0 0 6px",
      }}
    >
      {title}
    </h3>

    <p
      style={{
        fontSize: "13px",
        color: c.textTer,
        margin: "0 0 14px",
        lineHeight: 1.5,
      }}
    >
      {description}
    </p>

    <button
      onClick={onClick}
      style={{
        background:
          variant === "warning"
            ? "linear-gradient(135deg, #f59e0b, #d97706)"
            : "linear-gradient(135deg, #3B82F6, #2563eb)",
        color: "#fff",
        border: "none",
        padding: "9px 14px",
        borderRadius: "10px",
        fontSize: "13px",
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontFamily: "Inter, sans-serif",
        boxShadow:
          variant === "warning"
            ? "0 4px 12px rgba(245, 158, 11, 0.3)"
            : "0 4px 12px rgba(59, 130, 246, 0.3)",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "0.9";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
    >
      <Plus size={14} />
      {buttonText}
    </button>
  </div>
);

const FilterPill = ({ active, onClick, children, c }) => (
  <button
    onClick={onClick}
    style={{
      padding: "6px 12px",
      borderRadius: "20px",
      border: "none",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: active ? 700 : 500,
      background: active
        ? "linear-gradient(135deg, #3B82F6, #2563eb)"
        : c.bgHover,
      color: active ? "#fff" : c.textTer,
      fontFamily: "Inter, sans-serif",
      transition: "all 0.15s ease",
    }}
  >
    {children}
  </button>
);

const QueryCard = ({ query, c, onClick }) => {
  const statusConfig = {
    open: {
      color: c.accent,
      bg: c.accentLight,
      icon: AlertCircle,
      label: "Open",
    },
    in_progress: {
      color: c.warning,
      bg: c.warningLight,
      icon: Clock,
      label: "In Progress",
    },
    resolved: {
      color: c.success,
      bg: c.successLight,
      icon: CheckCircle2,
      label: "Resolved",
    },
    closed: {
      color: c.textMuted,
      bg: c.bgHover,
      icon: CheckCircle2,
      label: "Closed",
    },
  };

  const config = statusConfig[query.status] || statusConfig.open;
  const StatusIcon = config.icon;
  const hasUnread = query.unreadAdminReplies > 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: hasUnread ? c.accentLight : c.bgCard,
        borderRadius: "14px",
        border: `1px solid ${hasUnread ? c.accent + "40" : c.border}`,
        padding: "14px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = c.shadowMd;
        e.currentTarget.style.transform = "translateX(2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
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

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "4px",
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
              letterSpacing: "0.5px",
            }}
          >
            {config.label}
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
              {query.unreadAdminReplies} NEW
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
            fontFamily: "Inter, sans-serif",
          }}
        >
          {query.subject}
        </p>

        <p
          style={{
            fontSize: "11px",
            color: c.textMuted,
            margin: 0,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {query.replyCount} {query.replyCount === 1 ? "message" : "messages"}
          {" · "}
          Updated{" "}
          {new Date(query.lastReplyAt || query.createdAt).toLocaleDateString(
            "en-GB",
            {
              day: "numeric",
              month: "short",
            },
          )}
        </p>
      </div>

      <ChevronRight size={18} color={c.textMuted} />
    </div>
  );
};

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

const EmptyState = ({ c, onCreate, filter }) => (
  <div
    style={{
      padding: "50px 20px",
      textAlign: "center",
      background: c.bgCard,
      borderRadius: "16px",
      border: `1px solid ${c.border}`,
    }}
  >
    <div style={{ fontSize: "48px", marginBottom: "12px" }}>
      {filter === "all" ? "💬" : "✓"}
    </div>
    <h3
      style={{
        fontSize: "16px",
        fontWeight: 700,
        color: c.textTer,
        margin: "0 0 6px",
      }}
    >
      {filter === "all" ? "No queries yet" : `No ${filter} queries`}
    </h3>
    <p
      style={{
        fontSize: "13px",
        color: c.textMuted,
        margin: "0 0 20px",
      }}
    >
      {filter === "all"
        ? "Get help or report issues to the admin team"
        : "Try changing the filter to see other queries"}
    </p>
    {filter === "all" && (
      <button
        onClick={onCreate}
        style={{
          background: "linear-gradient(135deg, #3B82F6, #2563eb)",
          color: "#fff",
          border: "none",
          padding: "11px 22px",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "Inter, sans-serif",
          boxShadow: "0 4px 14px rgba(59, 130, 246, 0.3)",
        }}
      >
        Create First Query
      </button>
    )}
  </div>
);

export default SupportPage;
