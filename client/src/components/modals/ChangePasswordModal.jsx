import { useState } from "react";
import { X, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { authApi } from "../../api/endpoints/auth.api";
import useAuth from "../../hooks/useAuth";
import useTheme from "../../hooks/useTheme";
import Button from "../ui/Button";
import Input from "../ui/Input";

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { c } = useTheme();
  const { logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading) return;

    if (!currentPassword) return toast.error("Enter your current password");
    if (newPassword.length < 8)
      return toast.error("Password must be at least 8 characters");
    if (newPassword !== confirmPassword)
      return toast.error("Passwords do not match");
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return toast.error("Password needs uppercase, lowercase and a number");
    }
    if (currentPassword === newPassword) {
      return toast.error("New password must be different from current");
    }

    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success("Password changed! Please login again.");
      handleClose();
      setTimeout(() => logout(), 500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
          maxWidth: "440px",
          background: c.bgCard,
          borderRadius: "20px",
          boxShadow: c.shadowLg,
          zIndex: 101,
          padding: "24px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
              <Lock size={18} color={c.accent} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "17px",
                  fontWeight: 800,
                  color: c.text,
                  margin: 0,
                }}
              >
                Change Password
              </h2>
              <p
                style={{
                  fontSize: "12px",
                  color: c.textTer,
                  margin: "2px 0 0",
                }}
              >
                You'll be logged out after changing
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              background: c.bgHover,
              border: "none",
              borderRadius: "10px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: loading ? "not-allowed" : "pointer",
              color: c.textTer,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter your current password"
              icon={Lock}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Create a strong password"
              icon={Lock}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="At least 8 chars with uppercase, lowercase and a number"
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Repeat the new password"
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
            <Button variant="secondary" onClick={handleClose} fullWidth>
              Cancel
            </Button>
            <Button type="submit" fullWidth isLoading={loading}>
              {loading ? "Saving..." : "Change Password"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ChangePasswordModal;
