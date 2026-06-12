import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileX, LogOut, Shield } from "lucide-react";

import useAuthStore from "../store/authStore";
import useAuth from "../hooks/useAuth";
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
  const { logout } = useAuth();
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

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      logout();
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
        <p
          style={{
            fontSize: "13px",
            color: c.textMuted,
            margin: "0 0 20px",
          }}
        >
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

      {/* Settings Section (own profile only) */}
      {profile.isOwnProfile && (
        <SettingsSection user={currentUser} onLogout={handleLogout} c={c} />
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

const SettingsSection = ({ user, onLogout, c }) => {
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
};

const SettingsItem = ({
  icon: Icon,
  label,
  color,
  onClick,
  isDanger = false,
  c,
}) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      width: "100%",
      padding: "12px",
      background: "transparent",
      border: "none",
      borderRadius: "10px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: 600,
      color: color,
      fontFamily: "Inter, sans-serif",
      transition: "background 0.15s ease",
      textAlign: "left",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = isDanger
        ? c.dangerLight
        : c.accentLight;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "transparent";
    }}
  >
    <Icon size={18} />
    {label}
  </button>
);

export default ProfilePage;
