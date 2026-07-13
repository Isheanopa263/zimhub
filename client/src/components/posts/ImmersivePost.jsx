import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Play,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

import useAuthStore from "../../store/authStore";
import useTheme from "../../hooks/useTheme";
import useLike from "../../hooks/useLike";
import useDoubleTap from "../../hooks/useDoubleTap";
import { getImageUrl, getVideoUrl, getAvatarUrl } from "../../utils/media";

import HeartBurst from "./HeartBurst";
import CommentsDrawer from "../comments/CommentsDrawer";
import MarkdownText from "../ui/MarkdownText";
import { BACKGROUND_STYLES } from "./TextPost";

const timeAgo = (dateString) => {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
};

const ImmersivePost = ({ post, isActive, onDelete, index, totalPosts }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { c } = useTheme();

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.stats?.comments || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  const {
    isLiked,
    likeCount,
    loading: likeLoading,
    toggleLike,
  } = useLike(post.isLiked || false, post.stats?.likes || 0);

  const handleLike = () => toggleLike(post.id);
  const handleDoubleTap = () => {
    if (!isLiked && !likeLoading) toggleLike(post.id);
  };

  const { bursts, handlers } = useDoubleTap(handleDoubleTap);

  const isOwner = user?.id === post.author?.id;
  const isAdmin = user?.role === "admin";
  const canDelete = isOwner || isAdmin;

  const avatarSrc = getAvatarUrl(post.author?.avatarUrl);
  const letter = post.author?.fullName?.charAt(0)?.toUpperCase() || "?";

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    const text = post.caption || "Check this out on ZimHub";
    if (navigator.share) {
      try {
        await navigator.share({ title: "ZimHub", text, url });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch {}
    }
  };

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        position: "relative",
        background: "#000",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Main Content Area (Double-tap zone) ── */}
      <div
        {...handlers}
        style={{
          flex: 1,
          position: "relative",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <PostContent post={post} isActive={isActive} />

        {/* Heart bursts on double-tap */}
        {bursts.map((burst) => (
          <HeartBurst key={burst.id} id={burst.id} x={burst.x} y={burst.y} />
        ))}
      </div>

      {/* ── Bottom Info (Name + Username only) ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: "80px",
          padding: "80px 16px 24px",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          {/* Author Name + Username */}
          <div
            onClick={() => navigate(`/profile/${post.author?.username}`)}
            style={{
              cursor: "pointer",
              marginBottom: "6px",
            }}
          >
            <p
              style={{
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 800,
                margin: "0 0 2px",
                textShadow: "0 2px 6px rgba(0,0,0,0.6)",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {post.author?.fullName || post.author?.username}
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "12px",
                fontWeight: 500,
                margin: 0,
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                fontFamily: "Inter, sans-serif",
              }}
            >
              @{post.author?.username} · {timeAgo(post.createdAt)}
            </p>
          </div>

          {/* Caption (if exists) */}
          {(post.caption || post.text?.content) && (
            <div
              onClick={() => setCaptionExpanded(!captionExpanded)}
              style={{
                cursor: "pointer",
              }}
            >
              <p
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                  fontFamily: "Inter, sans-serif",
                  margin: 0,
                  display: captionExpanded ? "block" : "-webkit-box",
                  WebkitLineClamp: captionExpanded ? "none" : 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  wordBreak: "break-word",
                }}
              >
                {post.caption || (post.type === "text" ? null : "")}
              </p>
              {!captionExpanded &&
                (post.caption?.length > 80 ||
                  post.text?.content?.length > 80) && (
                  <span
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "12px",
                      fontWeight: 600,
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    ... more
                  </span>
                )}
            </div>
          )}
        </div>
      </div>

      {/* ── Right-Side Action Bar (Avatar on top) ── */}
      <div
        style={{
          position: "absolute",
          right: "12px",
          bottom: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        {/* Author Avatar (on top of all action buttons) */}
        <button
          onClick={() => navigate(`/profile/${post.author?.username}`)}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3B82F6, #8b5cf6)",
            border: "3px solid #ffffff",
            cursor: "pointer",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            marginBottom: "6px",
            flexShrink: 0,
          }}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={post.author?.fullName}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "center",
                display: "block",
                background: "linear-gradient(135deg, #3B82F6, #8b5cf6)",
              }}
            />
          ) : (
            <span
              style={{
                color: "#fff",
                fontWeight: 800,
                fontSize: "18px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {letter}
            </span>
          )}
        </button>

        {/* Like */}
        <ActionButton
          icon={
            <Heart
              size={30}
              fill={isLiked ? "#ef4444" : "none"}
              color={isLiked ? "#ef4444" : "#ffffff"}
              strokeWidth={2}
            />
          }
          label={likeCount}
          onClick={handleLike}
          disabled={likeLoading}
        />

        {/* Comment */}
        <ActionButton
          icon={<MessageCircle size={30} color="#ffffff" strokeWidth={2} />}
          label={commentCount}
          onClick={() => setCommentsOpen(true)}
        />

        {/* Share */}
        <ActionButton
          icon={<Share2 size={28} color="#ffffff" strokeWidth={2} />}
          label="Share"
          onClick={handleShare}
        />

        {/* Menu (if owner/admin) */}
        {canDelete && (
          <div style={{ position: "relative" }}>
            <ActionButton
              icon={
                <MoreHorizontal size={28} color="#ffffff" strokeWidth={2} />
              }
              onClick={() => setShowMenu(!showMenu)}
            />

            {showMenu && (
              <>
                <div
                  onClick={() => setShowMenu(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 40 }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: "60px",
                    bottom: 0,
                    background: "rgba(0,0,0,0.9)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "12px",
                    padding: "4px",
                    minWidth: "140px",
                    zIndex: 50,
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (window.confirm("Delete this post?")) onDelete?.();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "10px 12px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ef4444",
                      fontSize: "13px",
                      fontWeight: 600,
                      fontFamily: "Inter, sans-serif",
                      borderRadius: "8px",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(239,68,68,0.15)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "none")
                    }
                  >
                    <Trash2 size={14} />
                    Delete Post
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <CommentsDrawer
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        postId={post.id}
        onCommentChange={setCommentCount}
      />
    </div>
  );
};

/* ─── Action Button (right-side icons) ─── */
const ActionButton = ({ icon, label, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "4px",
      background: "none",
      border: "none",
      cursor: disabled ? "wait" : "pointer",
      padding: 0,
      filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
    }}
  >
    {icon}
    {label !== undefined && (
      <span
        style={{
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: 700,
          fontFamily: "Inter, sans-serif",
          textShadow: "0 2px 4px rgba(0,0,0,0.5)",
        }}
      >
        {label}
      </span>
    )}
  </button>
);

/* ─── Content Renderer ─── */
const PostContent = ({ post, isActive }) => {
  switch (post.type) {
    case "text":
      return <TextContent post={post} />;
    case "image":
      return <ImageContent post={post} />;
    case "video":
      return <VideoContent post={post} isActive={isActive} />;
    case "link":
      return <LinkContent post={post} />;
    default:
      return null;
  }
};

/* ─── Text Post ─── */
const TextContent = ({ post }) => {
  const style =
    BACKGROUND_STYLES[post.text?.backgroundStyle] || BACKGROUND_STYLES.default;
  const isDefault = post.text?.backgroundStyle === "default";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 40px 200px",
        background: isDefault ? "#0F172A" : style.background,
      }}
    >
      <div style={{ maxWidth: "600px", textAlign: "center" }}>
        <MarkdownText
          variant="centered"
          textColor={isDefault ? "#ffffff" : style.color || "#ffffff"}
        >
          {post.text?.content}
        </MarkdownText>
      </div>
    </div>
  );
};

/* ─── Image Post ─── */
const ImageContent = ({ post }) => {
  const [current, setCurrent] = useState(0);
  const images = post.images || (post.image ? [post.image] : []);

  if (images.length === 0) return null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <img
        src={getImageUrl(images[current].url)}
        alt="Post"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
        }}
      />

      {images.length > 1 && (
        <>
          {current > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrent(current - 1);
              }}
              style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.5)",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(8px)",
                zIndex: 5,
              }}
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {current < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrent(current + 1);
              }}
              style={{
                position: "absolute",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.5)",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(8px)",
                zIndex: 5,
              }}
            >
              <ChevronRight size={20} />
            </button>
          )}

          <div
            style={{
              position: "absolute",
              top: "110px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "6px",
              padding: "6px 12px",
              background: "rgba(0,0,0,0.5)",
              borderRadius: "20px",
              backdropFilter: "blur(8px)",
              zIndex: 5,
            }}
          >
            {images.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === current ? "20px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  background: i === current ? "#fff" : "rgba(255,255,255,0.5)",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ─── Video Post ─── */
const VideoContent = ({ post, isActive }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const videoUrl = getVideoUrl(post.video?.url);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  useEffect(() => {
    const handleKey = (e) => {
      if (
        !isActive ||
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA"
      )
        return;
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "m") {
        toggleMute();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isActive]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  if (!videoUrl) return null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        cursor: "pointer",
      }}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={
          post.video?.thumbnailUrl
            ? getVideoUrl(post.video.thumbnailUrl)
            : undefined
        }
        loop
        playsInline
        muted={isMuted}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
        }}
      />

      {!isPlaying && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Play
            size={30}
            color="#fff"
            fill="#fff"
            style={{ marginLeft: "4px" }}
          />
        </div>
      )}

      <button
        onClick={toggleMute}
        style={{
          position: "absolute",
          bottom: "100px",
          left: "16px",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
          border: "none",
          borderRadius: "50%",
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
          zIndex: 5,
        }}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
};

/* ─── Link Post ─── */
const LinkContent = ({ post }) => {
  const domain = (() => {
    try {
      return new URL(post.link?.url).hostname.replace("www.", "");
    } catch {
      return post.link?.url;
    }
  })();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #0F172A, #1e293b)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px 200px",
      }}
    >
      <div
        style={{
          maxWidth: "450px",
          width: "100%",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px",
          overflow: "hidden",
          backdropFilter: "blur(10px)",
        }}
      >
        {post.link?.ogImage && (
          <div
            style={{
              width: "100%",
              aspectRatio: "16/9",
              background: `url(${post.link.ogImage}) center/cover`,
            }}
          />
        )}

        <div style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <ExternalLink size={13} color="rgba(255,255,255,0.6)" />
            <span
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.6)",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {domain}
            </span>
          </div>

          {post.link?.title && (
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: "#ffffff",
                margin: "0 0 8px",
                lineHeight: 1.3,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {post.link.title}
            </h3>
          )}

          {post.link?.description && (
            <p
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.7)",
                margin: "0 0 16px",
                lineHeight: 1.5,
                fontFamily: "Inter, sans-serif",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {post.link.description}
            </p>
          )}

          <a
            href={post.link?.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "12px",
              background: "linear-gradient(135deg, #3B82F6, #2563eb)",
              color: "#ffffff",
              borderRadius: "12px",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Visit Link
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ImmersivePost;
