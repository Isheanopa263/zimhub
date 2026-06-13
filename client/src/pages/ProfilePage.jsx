import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileX, Settings } from "lucide-react";

import useAuthStore from "../store/authStore";
import useProfile from "../hooks/useProfile";
import useTheme from "../hooks/useTheme";

import ProfileHeader from "../components/profile/ProfileHeader";
import EditProfileModal from "../components/profile/EditProfileModal";
import ProfileSkeleton from "../components/profile/ProfileSkeleton";
import PostCard from "../components/posts/PostCard";

const ProfilePage = () => {
  const { username: paramUsername } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, setUser } = useAuthStore();
  const { c } = useTheme();

  const username = paramUsername || currentUser?.username;
  const [editOpen, setEditOpen] = useState(false);

  const {
    profile,
    posts,
    loading,
    error,
    hasMorePosts,
    loadingPosts,
    loadMorePosts,
    updateProfileInState,
    removePost,
  } = useProfile(username);

  const handleProfileSuccess = (updatedProfile) => {
    updateProfileInState(updatedProfile);

    if (currentUser && updatedProfile.id === currentUser.id) {
      setUser({
        ...currentUser,
        username: updatedProfile.username,
        profile: {
          full_name: updatedProfile.profile.fullName,
          bio: updatedProfile.profile.bio,
          avatar_url: updatedProfile.profile.avatarUrl,
        },
      });

      if (paramUsername && updatedProfile.username !== paramUsername) {
        navigate(`/profile/${updatedProfile.username}`, { replace: true });
      }
    }
  };

  if (loading) return <ProfileSkeleton />;

  if (error || !profile) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          background: c.bgCard,
          borderRadius: "16px",
          border: `1px solid ${c.border}`,
          marginTop: "16px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <FileX size={48} color={c.textFaint} style={{ marginBottom: "14px" }} />
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: c.textTer,
            margin: "0 0 6px",
          }}
        >
          {error === "User not found"
            ? "User not found"
            : "Profile unavailable"}
        </h3>
        <p style={{ fontSize: "13px", color: c.textMuted, margin: "0 0 20px" }}>
          {error || "This profile could not be loaded"}
        </p>
        <button
          onClick={() => navigate("/feed")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "linear-gradient(135deg,#3B82F6,#2563eb)",
            color: "#ffffff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <ArrowLeft size={14} />
          Back to Feed
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        paddingBottom: "20px",
      }}
    >
      <ProfileHeader profile={profile} onEditClick={() => setEditOpen(true)} />

      {/* Settings button — only on own profile */}
      {profile.isOwnProfile && (
        <button
          onClick={() => navigate("/settings")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            background: c.bgCard,
            borderRadius: "16px",
            border: `1px solid ${c.border}`,
            padding: "14px 18px",
            marginBottom: "16px",
            boxShadow: c.shadowSm,
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = c.bgHover;
            e.currentTarget.style.transform = "translateX(2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = c.bgCard;
            e.currentTarget.style.transform = "translateX(0)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: c.accentLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Settings size={18} color={c.accent} />
            </div>
            <div style={{ textAlign: "left" }}>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: c.text,
                  margin: 0,
                }}
              >
                Account Settings
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: c.textTer,
                  margin: "2px 0 0",
                }}
              >
                Privacy, security, and account management
              </p>
            </div>
          </div>
          <ArrowLeft
            size={16}
            color={c.textMuted}
            style={{ transform: "rotate(180deg)" }}
          />
        </button>
      )}

      {/* Posts heading */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 4px 12px",
        }}
      >
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: c.textTer,
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Posts ({profile.stats?.posts || 0})
        </h2>
      </div>

      {/* Posts list */}
      {posts.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            background: c.bgCard,
            borderRadius: "16px",
            border: `1px solid ${c.border}`,
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
          <p
            style={{
              fontSize: "14px",
              color: c.textTer,
              margin: 0,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {profile.isOwnProfile
              ? "You haven't posted anything yet"
              : `${profile.profile?.fullName || profile.username} hasn't posted anything yet`}
          </p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={() => removePost(post.id)}
            />
          ))}

          {hasMorePosts && (
            <button
              onClick={loadMorePosts}
              disabled={loadingPosts}
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
                cursor: loadingPosts ? "wait" : "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {loadingPosts ? "Loading..." : "Load more posts"}
            </button>
          )}
        </>
      )}

      {profile.isOwnProfile && (
        <EditProfileModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          profile={profile}
          onSuccess={handleProfileSuccess}
        />
      )}
    </div>
  );
};

export default ProfilePage;
