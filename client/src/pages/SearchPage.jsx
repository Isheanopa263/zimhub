import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, Users, FileText, ClipboardList } from "lucide-react";

import useSearch from "../hooks/useSearch";
import useTheme from "../hooks/useTheme";
import { searchApi } from "../api/endpoints/search.api";

import SearchUserCard from "../components/search/SearchUserCard";
import SearchEmpty from "../components/search/SearchEmpty";
import PostCard from "../components/posts/PostCard";
import NoticeCard from "../components/notices/NoticeCard";

const TABS = [
  { key: "all", label: "All", icon: Search },
  { key: "users", label: "Users", icon: Users },
  { key: "posts", label: "Posts", icon: FileText },
  { key: "notices", label: "Notices", icon: ClipboardList },
];

const SearchPage = () => {
  const { c } = useTheme();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialTab = searchParams.get("tab") || "all";

  const [activeTab, setActiveTab] = useState(initialTab);
  const { query, setQuery, debouncedQuery, results, loading, error } =
    useSearch(initialQuery);

  const [tabResults, setTabResults] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabMeta, setTabMeta] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const params = {};
    if (query) params.q = query;
    if (activeTab !== "all") params.tab = activeTab;
    setSearchParams(params, { replace: true });
  }, [query, activeTab, setSearchParams]);

  useEffect(() => {
    const loadTabResults = async () => {
      const q = debouncedQuery.trim();

      if (q.length < 2 || activeTab === "all") {
        setTabResults([]);
        return;
      }

      setTabLoading(true);
      try {
        let response;
        if (activeTab === "users")
          response = await searchApi.users(q, { page: 1, limit: 20 });
        if (activeTab === "posts")
          response = await searchApi.posts(q, { page: 1, limit: 20 });
        if (activeTab === "notices")
          response = await searchApi.notices(q, { page: 1, limit: 20 });

        setTabResults(response?.data || []);
        setTabMeta(response?.meta);
        setHasMore(response?.meta?.hasNextPage || false);
      } catch {
        setTabResults([]);
      } finally {
        setTabLoading(false);
      }
    };

    loadTabResults();
  }, [debouncedQuery, activeTab]);

  const handleLoadMore = async () => {
    if (!tabMeta?.hasNextPage || tabLoading) return;

    setTabLoading(true);
    try {
      const q = debouncedQuery.trim();
      const nextPage = tabMeta.page + 1;

      let response;
      if (activeTab === "users")
        response = await searchApi.users(q, { page: nextPage, limit: 20 });
      if (activeTab === "posts")
        response = await searchApi.posts(q, { page: nextPage, limit: 20 });
      if (activeTab === "notices")
        response = await searchApi.notices(q, { page: nextPage, limit: 20 });

      setTabResults((prev) => [...prev, ...(response?.data || [])]);
      setTabMeta(response?.meta);
      setHasMore(response?.meta?.hasNextPage || false);
    } catch {
      // silent
    } finally {
      setTabLoading(false);
    }
  };

  const trimmedQuery = debouncedQuery.trim();
  const hasResults =
    results &&
    (results.users.length > 0 ||
      results.posts.length > 0 ||
      results.notices.length > 0);

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        paddingBottom: "20px",
      }}
    >
      {/* Header + Search bar */}
      <div style={{ padding: "16px 0 12px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: c.text,
            margin: "0 0 12px",
          }}
        >
          🔍 Search
        </h1>

        <div style={{ position: "relative", marginBottom: "12px" }}>
          <Search
            size={18}
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users, posts, notices..."
            autoFocus
            style={{
              width: "100%",
              padding: "12px 16px 12px 44px",
              paddingRight: query ? "44px" : "16px",
              borderRadius: "14px",
              border: `2px solid ${c.borderStrong}`,
              background: c.bgInput,
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
              color: c.text,
              outline: "none",
              transition: "all 0.15s ease",
              boxShadow: c.shadowSm,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = c.accent;
              e.target.style.boxShadow = `0 0 0 3px ${c.accent}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = c.borderStrong;
              e.target.style.boxShadow = c.shadowSm;
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: c.bgHover,
                border: "none",
                borderRadius: "50%",
                width: "26px",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: c.textTer,
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Tabs */}
        {trimmedQuery.length >= 2 && (
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
              const count = results?.counts
                ? key === "all"
                  ? results.counts.users +
                    results.counts.posts +
                    results.counts.notices
                  : results.counts[key]
                : null;

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
                    boxShadow: active
                      ? "0 2px 8px rgba(59,130,246,0.3)"
                      : "none",
                  }}
                >
                  <Icon size={13} />
                  {label}
                  {count !== null && count > 0 && (
                    <span
                      style={{
                        background: active
                          ? "rgba(255,255,255,0.25)"
                          : c.borderStrong,
                        color: active ? "#fff" : c.textTer,
                        padding: "1px 6px",
                        borderRadius: "20px",
                        fontSize: "10px",
                        fontWeight: 700,
                        minWidth: "18px",
                        textAlign: "center",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      {trimmedQuery.length === 0 ? (
        <SearchEmpty type="all" />
      ) : trimmedQuery.length < 2 ? (
        <SearchEmpty type="typing" query={trimmedQuery} />
      ) : loading && !results ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
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
            @keyframes spin { 0% {transform:rotate(0)} 100% {transform:rotate(360deg)} }
          `}</style>
        </div>
      ) : error ? (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: c.danger,
            fontSize: "14px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          ⚠️ {error}
        </div>
      ) : activeTab === "all" ? (
        !hasResults ? (
          <SearchEmpty type="nothing" query={trimmedQuery} />
        ) : (
          <>
            {results.users.length > 0 && (
              <Section
                title="Users"
                count={results.counts.users}
                showMore={results.counts.users > 5}
                onShowMore={() => setActiveTab("users")}
                c={c}
              >
                {results.users.map((user) => (
                  <SearchUserCard key={user.id} user={user} />
                ))}
              </Section>
            )}

            {results.posts.length > 0 && (
              <Section
                title="Posts"
                count={results.counts.posts}
                showMore={results.counts.posts > 5}
                onShowMore={() => setActiveTab("posts")}
                c={c}
              >
                {results.posts.map((post) => (
                  <PostCard key={post.id} post={post} onDelete={() => {}} />
                ))}
              </Section>
            )}

            {results.notices.length > 0 && (
              <Section
                title="Notices"
                count={results.counts.notices}
                showMore={results.counts.notices > 5}
                onShowMore={() => setActiveTab("notices")}
                c={c}
              >
                {results.notices.map((notice) => (
                  <NoticeCard key={notice.id} notice={notice} />
                ))}
              </Section>
            )}
          </>
        )
      ) : (
        <>
          {tabLoading && tabResults.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
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
            </div>
          ) : tabResults.length === 0 ? (
            <SearchEmpty type={activeTab} query={trimmedQuery} />
          ) : (
            <>
              {activeTab === "users" &&
                tabResults.map((user) => (
                  <SearchUserCard key={user.id} user={user} />
                ))}
              {activeTab === "posts" &&
                tabResults.map((post) => (
                  <PostCard key={post.id} post={post} onDelete={() => {}} />
                ))}
              {activeTab === "notices" &&
                tabResults.map((notice) => (
                  <NoticeCard key={notice.id} notice={notice} />
                ))}

              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  disabled={tabLoading}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px",
                    marginTop: "8px",
                    background: c.bgCard,
                    border: `1px solid ${c.borderStrong}`,
                    borderRadius: "12px",
                    color: c.accent,
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: tabLoading ? "wait" : "pointer",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {tabLoading ? "Loading..." : "Load more"}
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
  /* Listen for nav-tap-refresh */
  useEffect(() => {
    const handleRefresh = (e) => {
      if (e.detail?.page === "/search") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    window.addEventListener("nav-tap-refresh", handleRefresh);
    return () => window.removeEventListener("nav-tap-refresh", handleRefresh);
  }, []);
};

const Section = ({ title, count, children, showMore, onShowMore, c }) => (
  <section style={{ marginBottom: "24px" }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "10px",
      }}
    >
      <h3
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: c.textTer,
          margin: 0,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {title} <span style={{ color: c.textFaint }}>· {count}</span>
      </h3>
      {showMore && (
        <button
          onClick={onShowMore}
          style={{
            background: "none",
            border: "none",
            color: c.accent,
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            padding: "4px 8px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          See all →
        </button>
      )}
    </div>
    {children}
  </section>
);

export default SearchPage;
