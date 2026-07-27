import { useState, useEffect } from "react";
import { X, AlertTriangle, Shield } from "lucide-react";

import useAuth from "../../hooks/useAuth";
import useTheme from "../../hooks/useTheme";
import Button from "../ui/Button";
import Input from "../ui/Input";

const DeleteAccountModal = ({ isOpen, onClose }) => {
  const { c } = useTheme();
  const { deleteAccount } = useAuth();

  const [step, setStep] = useState("warning");
  const [typedConfirm, setTypedConfirm] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setStep("warning");
      setTypedConfirm("");
      setSecurityAnswer("");
      setError(null);
    }
  }, [isOpen]);

  const canProceed = typedConfirm.toUpperCase() === "DELETE";

  const handleConfirmDelete = async () => {
    if (!securityAnswer.trim()) {
      setError("Please enter your security answer");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await deleteAccount(securityAnswer.trim());

    if (!result.success) {
      setError(result.message || "Incorrect security answer");
    }

    setLoading(false);
  };

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
          maxHeight: "90vh",
          overflowY: "auto",
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
              <li>All your posts, images, and videos</li>
              <li>All your notices</li>
              <li>All your comments and likes</li>
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
                onClick={() => setStep("verify")}
                fullWidth
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
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  background: c.accentLight,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <Shield size={26} color={c.accent} />
              </div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: c.text,
                  margin: "0 0 6px",
                }}
              >
                Verify your identity
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: c.textTer,
                  margin: 0,
                }}
              >
                Answer your security question to confirm deletion
              </p>
            </div>

            {error && (
              <div
                style={{
                  background: c.dangerLight,
                  border: `1px solid ${c.danger}40`,
                  borderLeft: `4px solid ${c.danger}`,
                  borderRadius: "10px",
                  padding: "12px 14px",
                  marginBottom: "16px",
                }}
              >
                <p
                  style={{
                    fontSize: "13px",
                    color: c.danger,
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <Input
                label="Security Answer"
                type="text"
                placeholder="Your answer (case-insensitive)"
                icon={Shield}
                value={securityAnswer}
                onChange={(e) => {
                  setSecurityAnswer(e.target.value);
                  setError(null);
                }}
                error={null}
                required
              />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <Button
                variant="secondary"
                onClick={() => setStep("warning")}
                fullWidth
              >
                Back
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                fullWidth
                isLoading={loading}
                disabled={!securityAnswer.trim()}
              >
                Delete Forever
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default DeleteAccountModal;
