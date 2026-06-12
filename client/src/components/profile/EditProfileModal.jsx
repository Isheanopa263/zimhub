import { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  Trash2,
  User,
  AtSign,
  FileText,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import { usersApi } from "../../api/endpoints/users.api";
import { getAvatarUrl } from "../../utils/media";
import useTheme from "../../hooks/useTheme";

const EditProfileModal = ({ isOpen, onClose, profile, onSuccess }) => {
  const { c } = useTheme();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [removeAvatarFlag, setRemoveAvatarFlag] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileRef = useRef();

  useEffect(() => {
    if (profile && isOpen) {
      setFullName(profile.profile?.fullName || "");
      setUsername(profile.username || "");
      setBio(profile.profile?.bio || "");
      setAvatarFile(null);
      setAvatarPreview(getAvatarUrl(profile.profile?.avatarUrl));
      setRemoveAvatarFlag(false);
    }
  }, [profile, isOpen]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar must be under 2MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setRemoveAvatarFlag(false);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatarFlag(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading) return;

    if (!fullName.trim() || fullName.trim().length < 2) {
      return toast.error("Full name must be at least 2 characters");
    }
    if (!username.trim() || username.trim().length < 3) {
      return toast.error("Username must be at least 3 characters");
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return toast.error(
        "Username can only contain letters, numbers and underscores",
      );
    }

    setLoading(true);

    try {
      if (removeAvatarFlag && !avatarFile) {
        try {
          await usersApi.removeAvatar();
        } catch {}
      }

      const formData = new FormData();
      formData.append("fullName", fullName.trim());
      formData.append("username", username.trim().toLowerCase());
      formData.append("bio", bio.trim());
      if (avatarFile) formData.append("avatar", avatarFile);

      const response = await usersApi.updateProfile(formData);
      toast.success("Profile updated! ✨");
      onSuccess?.(response.data);
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const avatarLetter = fullName?.charAt(0)?.toUpperCase() || "?";

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: `2px solid ${c.borderStrong}`,
    background: c.bgInput,
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
    color: c.text,
    outline: "none",
    transition: "all 0.15s ease",
  };

  const focusStyle = (e) => {
    e.target.style.borderColor = c.accent;
    e.target.style.boxShadow = `0 0 0 3px ${c.accent}20`;
  };

  const blurStyle = (e) => {
    e.target.style.borderColor = c.borderStrong;
    e.target.style.boxShadow = "none";
  };

  return (
    <>
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--backdrop)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "480px",
          maxHeight: "90vh",
          background: c.bgCard,
          borderRadius: "20px",
          boxShadow: c.shadowLg,
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          <h2
            style={{
              fontSize: "17px",
              fontWeight: 800,
              color: c.text,
              margin: 0,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Edit Profile
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              background: c.bgHover,
              border: "none",
              borderRadius: "10px",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: loading ? "not-allowed" : "pointer",
              color: c.textTer,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflow: "auto",
            padding: "20px",
          }}
        >
          {/* Avatar upload */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />

            <div style={{ position: "relative", marginBottom: "12px" }}>
              <div
                style={{
                  width: "110px",
                  height: "110px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#3B82F6,#8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  border: `4px solid ${c.bgCard}`,
                  boxShadow: c.shadowMd,
                }}
              >
                {avatarPreview && !removeAvatarFlag ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: "42px",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {avatarLetter}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  position: "absolute",
                  bottom: "0",
                  right: "0",
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#3B82F6,#2563eb)",
                  border: `3px solid ${c.bgCard}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#ffffff",
                  boxShadow: "0 2px 8px rgba(59,130,246,0.4)",
                }}
                title="Change avatar"
              >
                <Camera size={14} />
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  padding: "6px 12px",
                  background: c.bgHover,
                  border: "none",
                  borderRadius: "8px",
                  color: c.accent,
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Change Photo
              </button>

              {avatarPreview && !removeAvatarFlag && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  style={{
                    padding: "6px 12px",
                    background: c.dangerLight,
                    border: "none",
                    borderRadius: "8px",
                    color: c.danger,
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Trash2 size={11} />
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Full Name */}
          <FormField label="Full Name" icon={User} required c={c}>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              maxLength={100}
              required
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </FormField>

          {/* Username */}
          <FormField label="Username" icon={AtSign} required c={c}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="username"
              maxLength={30}
              required
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
            <p
              style={{
                fontSize: "11px",
                color: c.textMuted,
                marginTop: "4px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Letters, numbers and underscores only
            </p>
          </FormField>

          {/* Bio */}
          <FormField label="Bio" icon={FileText} c={c}>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={300}
              rows={4}
              style={{ ...inputStyle, resize: "vertical", minHeight: "90px" }}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
            <div
              style={{
                textAlign: "right",
                fontSize: "11px",
                color: bio.length > 270 ? c.danger : c.textMuted,
                marginTop: "4px",
              }}
            >
              {bio.length}/300
            </div>
          </FormField>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "20px",
              padding: "14px",
              background: "linear-gradient(135deg,#3B82F6,#2563eb)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
              fontFamily: "Inter, sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading && (
              <Loader2
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
            )}
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>

        <style>{`
          @keyframes spin {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  );
};

const FormField = ({ label, icon: Icon, required, children, c }) => (
  <div style={{ marginBottom: "14px" }}>
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "13px",
        fontWeight: 600,
        color: c.text,
        marginBottom: "6px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {Icon && <Icon size={13} color={c.textTer} />}
      {label}
      {required && <span style={{ color: c.danger }}>*</span>}
    </label>
    {children}
  </div>
);

export default EditProfileModal;
