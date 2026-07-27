import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Shield,
  CheckCircle2,
} from "lucide-react";

import useAuth from "../../hooks/useAuth";
import useAuthStore from "../../store/authStore";
import useTheme from "../../hooks/useTheme";

import Logo from "../../components/ui/Logo";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import ThemeToggleButton from "../../components/ui/ThemeToggleButton";

import toast from "react-hot-toast";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { getSecurityQuestion, resetPassword } = useAuth();
  const { c, isDark } = useTheme();

  const [step, setStep] = useState("email"); // 'email' | 'answer' | 'success'
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) navigate("/feed", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleGetQuestion = async (e) => {
    e?.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await getSecurityQuestion(email);

    if (result.success) {
      setQuestion(result.question);
      setStep("answer");
    } else {
      setError(result.message || "Could not find account");
    }

    setLoading(false);
  };

  const handleReset = async (e) => {
    e?.preventDefault();
    setError(null);

    if (!answer.trim()) {
      setError("Please enter your answer");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setError("Password needs uppercase, lowercase and a number");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const result = await resetPassword({
      email,
      securityAnswer: answer,
      newPassword,
    });

    if (result.success) {
      setStep("success");
    } else {
      setError(result.message || "Reset failed. Check your answer.");
    }

    setLoading(false);
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
      <ThemeToggleButton position="top-right" />

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
          <ArrowLeft size={16} /> Back
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
                  Enter your email to get your security question
                </p>
              </div>

              {error && <ErrorBox c={c} message={error} />}

              <form onSubmit={handleGetQuestion}>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="user@gmail.com"
                  icon={Mail}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  required
                />

                <div style={{ marginTop: "20px" }}>
                  <Button type="submit" fullWidth isLoading={loading} size="lg">
                    Get Security Question
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

          {step === "answer" && (
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
                  <Shield size={28} color={c.accent} />
                </div>
                <h1
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: c.text,
                    margin: "0 0 8px",
                  }}
                >
                  Security Question
                </h1>
                <p style={{ fontSize: "14px", color: c.textTer, margin: 0 }}>
                  Answer your security question to reset password
                </p>
              </div>

              {/* Display the question */}
              <div
                style={{
                  padding: "14px 16px",
                  background: c.accentLight,
                  border: `1px solid ${c.accent}30`,
                  borderRadius: "12px",
                  marginBottom: "20px",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    color: c.accent,
                    margin: "0 0 4px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Your Security Question
                </p>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: c.text,
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {question}
                </p>
              </div>

              {error && <ErrorBox c={c} message={error} />}

              <form onSubmit={handleReset}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <Input
                    label="Your Answer"
                    type="text"
                    placeholder="Answer (case-insensitive)"
                    icon={Shield}
                    value={answer}
                    onChange={(e) => {
                      setAnswer(e.target.value);
                      setError(null);
                    }}
                    required
                  />

                  <Input
                    label="New Password"
                    type="password"
                    placeholder="Min 8 chars, A-Z, a-z, 0-9"
                    icon={Lock}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError(null);
                    }}
                    helperText="At least 8 characters with uppercase, lowercase and number"
                    required
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Re-enter password"
                    icon={Lock}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                    }}
                    required
                  />
                </div>

                <div style={{ marginTop: "20px" }}>
                  <Button type="submit" fullWidth isLoading={loading} size="lg">
                    Reset Password
                  </Button>
                </div>
              </form>
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
                Password Reset!
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: c.textTer,
                  margin: "0 0 24px",
                  lineHeight: 1.5,
                }}
              >
                Your password has been reset successfully.
              </p>
              <Button onClick={() => navigate("/login")} fullWidth size="lg">
                Go to Login <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ErrorBox = ({ c, message }) => (
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
        lineHeight: 1.5,
      }}
    >
      {message}
    </p>
  </div>
);

export default ForgotPasswordPage;
