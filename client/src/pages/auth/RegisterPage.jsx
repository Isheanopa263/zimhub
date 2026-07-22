import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  AtSign,
  Mail,
  Lock,
  FileText,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
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

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100)
      .regex(
        /^[a-zA-Z\s'\-.]+$/,
        "Full name can only contain letters, spaces, hyphens, apostrophes and periods",
      ),
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Must contain uppercase, lowercase and number",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    bio: z
      .string()
      .max(300, "Bio cannot exceed 300 characters")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const PasswordStrength = ({ password, c }) => {
  if (!password) return null;
  const checks = [
    { met: password.length >= 8 },
    { met: /[A-Z]/.test(password) },
    { met: /[a-z]/.test(password) },
    { met: /\d/.test(password) },
  ];
  const strength = checks.filter((c) => c.met).length;
  const colors = ["#f87171", "#fb923c", "#facc15", "#4ade80"];
  const labels = ["Weak", "Fair", "Good", "Strong"];

  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ display: "flex", gap: "4px" }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: "4px",
              flex: 1,
              borderRadius: "4px",
              background: i < strength ? colors[strength - 1] : c.borderStrong,
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
      {strength > 0 && (
        <p
          style={{
            fontSize: "11px",
            marginTop: "4px",
            color: colors[strength - 1],
            fontWeight: 600,
          }}
        >
          {labels[strength - 1]}
        </p>
      )}
    </div>
  );
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { requestRegistrationOTP, verifyAndRegister, isLoading } = useAuth();
  const { c, isDark } = useTheme();

  /* 2-step flow */
  const [step, setStep] = useState("form"); // 'form' | 'verify'
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [formData, setFormData] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      bio: "",
    },
  });

  const watchedPassword = watch("password");

  useEffect(() => {
    if (isAuthenticated) navigate("/feed", { replace: true });
  }, [isAuthenticated, navigate]);

  /* Resend cooldown timer */
  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const onSubmit = async (data) => {
    const { confirmPassword, ...payload } = data;
    const result = await requestRegistrationOTP(payload);
    if (result.success) {
      setFormData(payload);
      setStep("verify");
      setResendCooldown(60);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    await verifyAndRegister({ ...formData, otp });
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      await authApi.requestRegistrationOTP(formData);
      toast.success("New code sent! 📧");
      setOtp("");
      setResendCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend");
    } finally {
      setResending(false);
    }
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
          position: "absolute",
          bottom: "-150px",
          left: "-150px",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
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
        {/* Back link */}
        <button
          onClick={() =>
            step === "verify" ? setStep("form") : navigate("/login")
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
          onMouseEnter={(e) => (e.target.style.color = "#ffffff")}
          onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,0.5)")}
        >
          <ArrowLeft size={16} />
          {step === "verify" ? "Back to form" : "Back to login"}
        </button>

        <div
          style={{
            background: c.bgCard,
            borderRadius: "24px",
            padding: "36px 32px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3)",
            border: `1px solid ${c.border}`,
          }}
        >
          {step === "form" ? (
            <>
              <div style={{ marginBottom: "24px" }}>
                <Logo size="sm" />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h1
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    color: c.text,
                    margin: 0,
                  }}
                >
                  Join ZimHub 🎓
                </h1>
                <p
                  style={{
                    color: c.textTer,
                    fontSize: "14px",
                    marginTop: "6px",
                  }}
                >
                  Create your student account
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <Input
                    label="Full Name"
                    name="fullName"
                    type="text"
                    placeholder="User Name"
                    icon={User}
                    error={errors.fullName?.message}
                    required
                    {...register("fullName")}
                  />
                  <Input
                    label="Username"
                    name="username"
                    type="text"
                    placeholder="username123"
                    icon={AtSign}
                    error={errors.username?.message}
                    helperText="Letters, numbers and underscores only"
                    required
                    {...register("username")}
                  />
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="user@gmail.com"
                    icon={Mail}
                    error={errors.email?.message}
                    required
                    {...register("email")}
                  />

                  <div>
                    <Input
                      label="Password"
                      name="password"
                      type="password"
                      placeholder="Create a strong password"
                      icon={Lock}
                      error={errors.password?.message}
                      required
                      {...register("password")}
                    />
                    <PasswordStrength password={watchedPassword} c={c} />
                  </div>

                  <Input
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Repeat your password"
                    icon={Lock}
                    error={errors.confirmPassword?.message}
                    required
                    {...register("confirmPassword")}
                  />

                  {/* Bio */}
                  <div>
                    <label
                      htmlFor="bio"
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: c.text,
                        marginBottom: "6px",
                      }}
                    >
                      Bio{" "}
                      <span style={{ color: c.textMuted, fontWeight: 400 }}>
                        (optional)
                      </span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <FileText
                        size={16}
                        style={{
                          position: "absolute",
                          left: "14px",
                          top: "14px",
                          color: c.textMuted,
                          pointerEvents: "none",
                        }}
                      />
                      <textarea
                        id="bio"
                        placeholder="Tell the community about yourself..."
                        rows={3}
                        style={{
                          width: "100%",
                          paddingLeft: "42px",
                          paddingRight: "16px",
                          paddingTop: "12px",
                          paddingBottom: "12px",
                          borderRadius: "12px",
                          border: `2px solid ${errors.bio ? c.danger : c.borderStrong}`,
                          background: errors.bio ? c.dangerLight : c.bgInput,
                          color: c.text,
                          fontSize: "14px",
                          fontFamily: "Inter, system-ui, sans-serif",
                          resize: "none",
                          outline: "none",
                          transition: "all 0.15s ease",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = c.accent;
                          e.target.style.boxShadow = `0 0 0 3px ${c.accent}20`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = c.borderStrong;
                          e.target.style.boxShadow = "none";
                        }}
                        {...register("bio")}
                      />
                    </div>
                    {errors.bio && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: c.danger,
                          marginTop: "6px",
                        }}
                      >
                        {errors.bio.message}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: "24px" }}>
                  <Button
                    type="submit"
                    fullWidth
                    isLoading={isLoading}
                    size="lg"
                  >
                    Continue
                    {!isLoading && <ArrowRight size={16} />}
                  </Button>
                </div>

                <p
                  style={{
                    fontSize: "12px",
                    color: c.textMuted,
                    textAlign: "center",
                    marginTop: "12px",
                    lineHeight: 1.5,
                  }}
                >
                  By creating an account, you agree to our{" "}
                  <a
                    href="/zimhub/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: c.accent,
                      fontWeight: 700,
                      textDecoration: "underline",
                      textUnderlineOffset: "2px",
                    }}
                  >
                    Privacy Policy
                  </a>
                  . Ghost accounts are allowed but a valid email is required.
                  Only admins can see your email.
                </p>
              </form>

              <p
                style={{
                  textAlign: "center",
                  fontSize: "14px",
                  color: c.textTer,
                  marginTop: "24px",
                }}
              >
                Already have an account?{" "}
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
          ) : (
            /* ── OTP VERIFICATION STEP ── */
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
                  We've sent a 6-digit code to
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    color: c.text,
                    margin: "4px 0 0",
                    fontWeight: 700,
                  }}
                >
                  {formData?.email}
                </p>
                <br />
                <p style={{ fontSize: "14px", color: c.textTer, margin: 0 }}>
                  If you cannot see the email, check your spam folder
                </p>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <OTPInput value={otp} onChange={setOtp} length={6} autoFocus />
              </div>

              <Button
                onClick={handleVerify}
                fullWidth
                size="lg"
                isLoading={isLoading}
                disabled={otp.length !== 6}
              >
                Verify & Create Account
              </Button>

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
                  disabled={resendCooldown > 0 || resending}
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
                  <RefreshCw
                    size={13}
                    style={{
                      animation: resending
                        ? "spin 0.8s linear infinite"
                        : "none",
                    }}
                  />
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend code"}
                </button>
                <style>{`
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            </>
          )}
        </div>

        <p
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.3)",
            fontSize: "12px",
            marginTop: "24px",
          }}
        >
          ZimHub — Exclusive to university students
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
