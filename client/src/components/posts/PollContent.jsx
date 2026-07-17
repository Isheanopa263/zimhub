import { useState, useEffect, useRef } from "react";
import { BarChart2, Check, Clock, Users, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { postsApi } from "../../api/endpoints/posts.api";
import useTheme from "../../hooks/useTheme";

const POLL_REFRESH_INTERVAL = 10000; // 10 seconds — fast enough for live feel

const timeLeft = (expiresAt) => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return `${Math.floor(diff / (1000 * 60))}m left`;
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
};

const PollContent = ({ post, onVoted }) => {
  const { c } = useTheme();
  const [selected, setSelected] = useState([]);
  const [voting, setVoting] = useState(false);
  const [localPoll, setLocalPoll] = useState(post.poll);
  const [lastUpdated, setLastUpdated] = useState(null);

  const pollIntervalRef = useRef(null);
  const isFetchingRef = useRef(false);

  if (!localPoll) return null;

  const {
    question,
    options,
    totalVotes,
    allowMultiple,
    expiresAt,
    isExpired,
    hasVoted,
    userVotes,
  } = localPoll;

  const showResults = hasVoted || isExpired;
  const remaining = timeLeft(expiresAt);

  /* ─── Auto-refresh poll data every 10 seconds ─── */
  useEffect(() => {
    // Only poll if the poll is active (not expired)
    const shouldPoll = !isExpired;

    const fetchLatest = async () => {
      if (isFetchingRef.current) return;
      if (document.hidden) return; // Don't poll when tab is hidden

      isFetchingRef.current = true;

      try {
        const response = await postsApi.getPost(post.id);
        const updatedPoll = response?.data?.poll;

        if (updatedPoll) {
          // Only update if vote count actually changed
          // This prevents unnecessary re-renders
          if (updatedPoll.totalVotes !== localPoll.totalVotes) {
            setLocalPoll(updatedPoll);
          }
          setLastUpdated(new Date());
        }
      } catch {
        // Silent fail — poll refresh is non-critical
      } finally {
        isFetchingRef.current = false;
      }
    };

    if (shouldPoll) {
      // Start polling
      pollIntervalRef.current = setInterval(fetchLatest, POLL_REFRESH_INTERVAL);

      // Also refresh when tab becomes visible
      const handleVisibility = () => {
        if (!document.hidden) fetchLatest();
      };
      document.addEventListener("visibilitychange", handleVisibility);

      return () => {
        clearInterval(pollIntervalRef.current);
        document.removeEventListener("visibilitychange", handleVisibility);
      };
    }

    return () => {
      clearInterval(pollIntervalRef.current);
    };
  }, [post.id, isExpired, localPoll.totalVotes]);

  /* ─── Update local poll when parent post updates ─── */
  useEffect(() => {
    if (post.poll) {
      setLocalPoll(post.poll);
    }
  }, [post.poll]);

  /* ─── Vote handlers ─── */
  const toggleOption = (optionId) => {
    if (showResults || voting) return;

    if (allowMultiple) {
      setSelected((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    } else {
      setSelected([optionId]);
    }
  };

  const handleVote = async () => {
    if (selected.length === 0) {
      toast.error("Select an option");
      return;
    }

    setVoting(true);

    // Optimistic update — show results immediately
    const optimisticOptions = localPoll.options.map((opt) => ({
      ...opt,
      voteCount: selected.includes(opt.id) ? opt.voteCount + 1 : opt.voteCount,
    }));

    const optimisticPoll = {
      ...localPoll,
      totalVotes: localPoll.totalVotes + 1,
      hasVoted: true,
      userVotes: selected,
      options: optimisticOptions,
    };

    setLocalPoll(optimisticPoll);

    try {
      const response = await postsApi.votePoll(post.id, selected);
      const serverPoll = response?.data?.poll;

      if (serverPoll) {
        setLocalPoll(serverPoll);
      }

      toast.success("Vote recorded! 🗳️");
      onVoted?.(response?.data);
    } catch (err) {
      // Revert optimistic update
      setLocalPoll(post.poll);
      setSelected([]);
      toast.error(err.response?.data?.message || "Failed to vote");
    } finally {
      setVoting(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #1e1b4b, #312e81, #4c1d95)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 60px 160px 20px",
      }}
    >
      <div style={{ maxWidth: "450px", width: "100%" }}>
        {/* Question */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <BarChart2
            size={32}
            color="rgba(255,255,255,0.8)"
            style={{ marginBottom: "12px" }}
          />
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "#ffffff",
              margin: 0,
              lineHeight: 1.3,
              fontFamily: "Inter, sans-serif",
              textShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            {question}
          </h2>
        </div>

        {/* Options */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          {options.map((option) => {
            const percentage =
              totalVotes > 0
                ? Math.round((option.voteCount / totalVotes) * 100)
                : 0;

            const isSelected = selected.includes(option.id);
            const isUserVote = userVotes?.includes(option.id);
            const isWinner =
              showResults &&
              option.voteCount ===
                Math.max(...options.map((o) => o.voteCount)) &&
              option.voteCount > 0;

            return (
              <button
                key={option.id}
                onClick={() => toggleOption(option.id)}
                disabled={showResults || voting}
                style={{
                  position: "relative",
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border: isSelected
                    ? "2px solid #ffffff"
                    : isUserVote
                      ? "2px solid rgba(139,92,246,0.8)"
                      : "2px solid rgba(255,255,255,0.2)",
                  background: showResults
                    ? "rgba(255,255,255,0.05)"
                    : isSelected
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(255,255,255,0.08)",
                  cursor: showResults ? "default" : "pointer",
                  textAlign: "left",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {/* Animated progress bar */}
                {showResults && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: `${percentage}%`,
                      background: isWinner
                        ? "rgba(139,92,246,0.3)"
                        : "rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                )}

                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {/* Check/radio indicator */}
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: allowMultiple ? "4px" : "50%",
                        border:
                          isSelected || isUserVote
                            ? "none"
                            : "2px solid rgba(255,255,255,0.4)",
                        background:
                          isSelected || isUserVote ? "#8b5cf6" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.2s ease",
                      }}
                    >
                      {(isSelected || isUserVote) && (
                        <Check size={13} color="#fff" strokeWidth={3} />
                      )}
                    </div>

                    <span
                      style={{
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: isWinner ? 700 : 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {option.text}
                    </span>
                  </div>

                  {/* Vote count + percentage */}
                  {showResults && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexShrink: 0,
                        marginLeft: "10px",
                      }}
                    >
                      <span
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          fontSize: "12px",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {option.voteCount}
                      </span>
                      <span
                        style={{
                          color: "rgba(255,255,255,0.8)",
                          fontSize: "14px",
                          fontWeight: 800,
                          fontFamily: "Inter, sans-serif",
                          minWidth: "36px",
                          textAlign: "right",
                        }}
                      >
                        {percentage}%
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Vote button */}
        {!showResults && (
          <button
            onClick={handleVote}
            disabled={selected.length === 0 || voting}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "12px",
              background:
                selected.length > 0
                  ? "linear-gradient(135deg, #8b5cf6, #6d28d9)"
                  : "rgba(255,255,255,0.1)",
              color: "#ffffff",
              border: "none",
              cursor: selected.length > 0 ? "pointer" : "not-allowed",
              fontSize: "15px",
              fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              opacity: selected.length > 0 ? 1 : 0.5,
              boxShadow:
                selected.length > 0
                  ? "0 4px 14px rgba(139,92,246,0.4)"
                  : "none",
              transition: "all 0.15s ease",
              marginBottom: "12px",
            }}
          >
            {voting
              ? "Voting..."
              : `Vote${allowMultiple ? " (select multiple)" : ""}`}
          </button>
        )}

        {/* Stats footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            flexWrap: "wrap",
            color: "rgba(255,255,255,0.5)",
            fontSize: "12px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {/* Total votes with live pulse */}
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Users size={13} />
            <span
              style={{
                transition: "all 0.3s ease",
              }}
            >
              {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
            </span>
          </span>

          {/* Time remaining */}
          {remaining && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: isExpired
                  ? "rgba(239,68,68,0.8)"
                  : "rgba(255,255,255,0.5)",
              }}
            >
              <Clock size={13} />
              {remaining}
            </span>
          )}

          {/* Multiple choice indicator */}
          {allowMultiple && <span>Multiple choice</span>}

          {/* Live indicator (when poll is active and results are showing) */}
          {showResults && !isExpired && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "#4ade80",
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#4ade80",
                  animation: "livePulse 2s infinite",
                }}
              />
              Live
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
};

export default PollContent;
