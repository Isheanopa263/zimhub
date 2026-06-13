import { useState, useEffect } from "react";
import { X, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import useAuth from "../../hooks/useAuth";
import useTheme from "../../hooks/useTheme";
import OTPInput from "../auth/OTPInput";
import Button from "../ui/Button";

const DeleteAccountModal = ({ isOpen, onClose, userEmail }) => {
  const { c } = useTheme();
  const { requestAccountDeletion, confirmAccountDeletion } = useAuth();

  const [step, setStep] = useState("warning"); // 'warning' | 'verify'
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [typedConfirm, setTypedConfirm] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setStep("warning");
      setOtp("");
      setTypedConfirm("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleRequestOTP = async () => {
    setLoading(true);
    const result = await requestAccountDeletion();
    setLoading(false);
    if (result.success) {
      setStep("verify");
      setResendCooldown(60);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    const result = await requestAccountDeletion();
    setLoading(false);
    if (result.success) {
      toast.success("New code sent! 📧");
      setOtp("");
      setResendCooldown(60);
    }
  };

  const handleConfirmDelete = async () => {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    await confirmAccountDeletion(otp);
    setLoading(false);
  };

  const canProceed = typedConfirm.toUpperCase() === "DELETE";

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
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
          maxWidth: "460px",
          background: c.bgCard,
          borderRadius: "20px",
          boxShadow: c.shadowLg,
          zIndex: 101,
          padding: "24px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: c.dangerLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={18} color={c.danger} />
            </div>
            <h2
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color: c.text,
                margin: 0,
              }}
            >
              Delete Account
            </h2>
          </div>
          <button
            onClick={onClose}
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

        {step === "warning" && (
          <>
            <div
              style={{
                background: c.dangerLight,
                border: `1px solid ${c.danger}30`,
                borderRadius: "12px",
                padding: "14px",
                marginBottom: "16px",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  color: c.danger,
                  margin: 0,
                  fontWeight: 700,
                  lineHeight: 1.5,
                }}
              >
                ⚠️ This action is permanent and cannot be undone.
              </p>
            </div>

            <p
              style={{
                fontSize: "14px",
                color: c.textSec,
                margin: "0 0 14px",
                lineHeight: 1.6,
              }}
            >
              Deleting your account will permanently remove:
            </p>

            <ul
              style={{
                fontSize: "13px",
                color: c.textSec,
                paddingLeft: "18px",
                margin: "0 0 20px",
                lineHeight: 1.8,
              }}
            >
              <li>Your profile and personal information</li>
              <li>All your posts (videos, images, text, links)</li>
              <li>All your notices</li>
              <li>All your comments and likes</li>
              <li>All uploaded media files</li>
            </ul>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: c.text,
                  marginBottom: "6px",
                }}
              >
                Type{" "}
                <span style={{ color: c.danger, fontWeight: 800 }}>DELETE</span>{" "}
                to confirm
              </label>
              <input
                type="text"
                value={typedConfirm}
                onChange={(e) => setTypedConfirm(e.target.value)}
                placeholder="DELETE"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  border: `2px solid ${canProceed ? c.danger : c.borderStrong}`,
                  background: c.bgInput,
                  color: c.text,
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  outline: "none",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <Button variant="secondary" onClick={onClose} fullWidth>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleRequestOTP}
                fullWidth
                isLoading={loading}
                disabled={!canProceed}
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {step === "verify" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <p
                style={{
                  fontSize: "14px",
                  color: c.textTer,
                  margin: "0 0 6px",
                }}
              >
                We've sent a confirmation code to
              </p>
              <p
                style={{
                  fontSize: "14px",
                  color: c.text,
                  margin: 0,
                  fontWeight: 700,
                }}
              >
                {userEmail}
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <OTPInput value={otp} onChange={setOtp} length={6} autoFocus />
            </div>

            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              fullWidth
              isLoading={loading}
              disabled={otp.length !== 6}
            >
              Permanently Delete Account
            </Button>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "none",
                  border: "none",
                  color: resendCooldown > 0 ? c.textMuted : c.accent,
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <RefreshCw size={13} />
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend code"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default DeleteAccountModal;
