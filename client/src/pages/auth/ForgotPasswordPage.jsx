import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

import useAuth from "../../hooks/useAuth";
import useAuthStore from "../../store/authStore";
import useTheme from "../../hooks/useTheme";
import { authApi } from "../../api/endpoints/auth.api";

import Logo from "../../components/ui/Logo";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import OTPInput from "../../components/auth/OTPInput";
import toast from "react-hot-toast";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { requestPasswordReset, resetPassword } = useAuth();
  const { c, isDark } = useTheme();

  const [step, setStep] = useState("email"); // 'email' | 'verify' | 'success'
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (isAuthenticated) navigate("/feed", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleRequestOTP = async (e) => {
    e?.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    const result = await requestPasswordReset(email);
    setLoading(false);
    if (result.success) {
      setStep("verify");
      setResendCooldown(60);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await authApi.requestPasswordReset(email);
      toast.success("New code sent! 📧");
      setOtp("");
      setResendCooldown(60);
    } catch {
      toast.error("Failed to resend");
    }
  };

  const handleReset = async (e) => {
    e?.preventDefault();

    if (otp.length !== 6) return toast.error("Enter the 6-digit code");
    if (newPassword.length < 8)
      return toast.error("Password must be at least 8 characters");
    if (newPassword !== confirmPassword)
      return toast.error("Passwords do not match");
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return toast.error("Password needs uppercase, lowercase and a number");
    }

    setLoading(true);
    const result = await resetPassword({ email, otp, newPassword });
    setLoading(false);
    if (result.success) setStep("success");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: isDark
          ? "linear-gradient(135deg, #050810 0%, #0A0F1C 50%, #050810 100%)"
          : "linear-gradient(135deg, #0F172A 0%, #1e293b 50%, #0F172A 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Blobs */}
      <div
        style={{
          position: "absolute",
          top: "-150px",
          right: "-150px",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <button
          onClick={() =>
            step === "email" ? navigate("/login") : setStep("email")
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "rgba(255,255,255,0.5)",
            fontSize: "14px",
            marginBottom: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div
          style={{
            background: c.bgCard,
            borderRadius: "24px",
            padding: "40px 32px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3)",
            border: `1px solid ${c.border}`,
          }}
        >
          {step === "email" && (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <Logo size="md" />
              </div>

              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    background: c.accentLight,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Lock size={28} color={c.accent} />
                </div>
                <h1
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: c.text,
                    margin: "0 0 8px",
                  }}
                >
                  Forgot your password?
                </h1>
                <p style={{ fontSize: "14px", color: c.textTer, margin: 0 }}>
                  Enter your email and we'll send a verification code
                </p>
              </div>

              <form onSubmit={handleRequestOTP}>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@university.ac.zw"
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div style={{ marginTop: "20px" }}>
                  <Button type="submit" fullWidth isLoading={loading} size="lg">
                    Send Reset Code
                    {!loading && <ArrowRight size={16} />}
                  </Button>
                </div>
              </form>

              <p
                style={{
                  textAlign: "center",
                  fontSize: "13px",
                  color: c.textTer,
                  marginTop: "20px",
                }}
              >
                Remembered your password?{" "}
                <Link
                  to="/login"
                  style={{
                    color: c.accent,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Sign in
                </Link>
              </p>
            </>
          )}

          {step === "verify" && (
            <>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    background: c.accentLight,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Mail size={28} color={c.accent} />
                </div>
                <h1
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: c.text,
                    margin: "0 0 8px",
                  }}
                >
                  Check your email 📬
                </h1>
                <p style={{ fontSize: "14px", color: c.textTer, margin: 0 }}>
                  Enter the 6-digit code sent to
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    color: c.text,
                    margin: "4px 0 0",
                    fontWeight: 700,
                  }}
                >
                  {email}
                </p>
              </div>

              <form onSubmit={handleReset}>
                <div style={{ marginBottom: "20px" }}>
                  <OTPInput
                    value={otp}
                    onChange={setOtp}
                    length={6}
                    autoFocus
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="Create a strong password"
                    icon={Lock}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    helperText="At least 8 characters with uppercase, lowercase, and a number"
                    required
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Repeat the password"
                    icon={Lock}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginTop: "20px" }}>
                  <Button type="submit" fullWidth isLoading={loading} size="lg">
                    Reset Password
                  </Button>
                </div>
              </form>

              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <p
                  style={{
                    fontSize: "13px",
                    color: c.textTer,
                    margin: "0 0 8px",
                  }}
                >
                  Didn't receive the code?
                </p>
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
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

          {step === "success" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  background: c.successLight,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <CheckCircle2 size={36} color={c.success} />
              </div>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: c.text,
                  margin: "0 0 8px",
                }}
              >
                Password Reset! 🎉
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: c.textTer,
                  margin: "0 0 24px",
                  lineHeight: 1.5,
                }}
              >
                Your password has been successfully reset.
                <br />
                You can now sign in with your new password.
              </p>
              <Button onClick={() => navigate("/login")} fullWidth size="lg">
                Go to Login
                <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
