import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  AtSign,
  Lock,
  FileText,
  ArrowRight,
  ArrowLeft,
  Shield,
} from "lucide-react";

import useAuth from "../../hooks/useAuth";
import useAuthStore from "../../store/authStore";
import useTheme from "../../hooks/useTheme";

import Logo from "../../components/ui/Logo";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import ThemeToggleButton from "../../components/ui/ThemeToggleButton";

/* ─── Constants ──────────────────────────────────────────────────────────── */

const SECURITY_QUESTIONS = [
  "What is the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite movie?",
  "What is your favorite food?",
  "What was your childhood nickname?",
  "What is the name of your best friend?",
  "What is your favorite sport?",
  "What street did you grow up on?",
];

/* ─── Schema ─────────────────────────────────────────────────────────────── */

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name is too long")
      .regex(/^[a-zA-Z\s'\-.]+$/, "Only letters, spaces, hyphens, periods"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username is too long")
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Must contain uppercase, lowercase and number",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    securityQuestion: z.string().min(1, "Please select a security question"),
    securityAnswer: z
      .string()
      .min(2, "Answer must be at least 2 characters")
      .max(100, "Answer is too long"),
    bio: z.string().max(300, "Bio is too long").optional().or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/* ─── Password Strength ──────────────────────────────────────────────────── */

const PasswordStrength = ({ password, c }) => {
  if (!password) return null;

  const checks = [
    { met: password.length >= 8 },
    { met: /[A-Z]/.test(password) },
    { met: /[a-z]/.test(password) },
    { met: /\d/.test(password) },
  ];

  const strength = checks.filter((x) => x.met).length;
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

/* ─── Component ──────────────────────────────────────────────────────────── */

const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { register: registerUser, isLoading } = useAuth();
  const { c, isDark } = useTheme();

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
      password: "",
      confirmPassword: "",
      securityQuestion: "",
      securityAnswer: "",
      bio: "",
    },
  });

  const watchedPassword = watch("password");

  useEffect(() => {
    if (isAuthenticated) navigate("/feed", { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    const { confirmPassword, ...formData } = data;
    await registerUser(formData);
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: `2px solid ${c.borderStrong}`,
    background: c.bgInput,
    color: c.text,
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
    outline: "none",
    transition: "all 0.15s ease",
    boxSizing: "border-box",
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
          ? "linear-gradient(135deg,#050810 0%,#0A0F1C 50%,#050810 100%)"
          : "linear-gradient(135deg,#0F172A 0%,#1e293b 50%,#0F172A 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <ThemeToggleButton position="top-right" />

      {/* Background blobs */}
      <div
        style={{
          position: "absolute",
          top: "-150px",
          right: "-150px",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle,rgba(59,130,246,0.15) 0%,transparent 70%)",
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
            "radial-gradient(circle,rgba(59,130,246,0.08) 0%,transparent 70%)",
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
        <Link
          to="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "rgba(255,255,255,0.5)",
            fontSize: "14px",
            marginBottom: "16px",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} /> Back to login
        </Link>

        <div
          style={{
            background: c.bgCard,
            borderRadius: "24px",
            padding: "36px 32px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
            border: `1px solid ${c.border}`,
            maxHeight: "85vh",
            overflowY: "auto",
          }}
        >
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
                marginBottom: 0,
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
              {/* Full Name */}
              <Input
                label="Full Name"
                name="fullName"
                type="text"
                placeholder="Ghost Renyika"
                icon={User}
                error={errors.fullName?.message}
                helperText="Can be a display name — ghost accounts allowed"
                required
                {...register("fullName")}
              />

              {/* Username */}
              <Input
                label="Username"
                name="username"
                type="text"
                placeholder="e.g. ghostrenyika"
                icon={AtSign}
                error={errors.username?.message}
                helperText="Used to log in — can be a pseudonym"
                required
                {...register("username")}
              />

              {/* Password */}
              <div>
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="Min 8 chars, A-Z, a-z, 0-9"
                  icon={Lock}
                  error={errors.password?.message}
                  required
                  {...register("password")}
                />
                <PasswordStrength password={watchedPassword} c={c} />
              </div>

              {/* Confirm Password */}
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                icon={Lock}
                error={errors.confirmPassword?.message}
                required
                {...register("confirmPassword")}
              />

              {/* Security Question */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: c.text,
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Shield size={13} color={c.textTer} />
                    Security Question <span style={{ color: c.danger }}>*</span>
                  </span>
                </label>
                <select
                  {...register("securityQuestion")}
                  style={{
                    ...inputStyle,
                    appearance: "auto",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Select a question...</option>
                  {SECURITY_QUESTIONS.map((q, i) => (
                    <option key={i} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
                {errors.securityQuestion && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: c.danger,
                      marginTop: "6px",
                      marginBottom: 0,
                    }}
                  >
                    {errors.securityQuestion.message}
                  </p>
                )}
              </div>

              {/* Security Answer */}
              <Input
                label="Security Answer"
                name="securityAnswer"
                type="text"
                placeholder="Your answer (not case-sensitive)"
                icon={Shield}
                error={errors.securityAnswer?.message}
                helperText="Used to reset your password if forgotten"
                required
                {...register("securityAnswer")}
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
                    placeholder="Write a short bio..."
                    rows={3}
                    style={{
                      ...inputStyle,
                      paddingLeft: "42px",
                      resize: "none",
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
                      marginBottom: 0,
                    }}
                  >
                    {errors.bio.message}
                  </p>
                )}
              </div>
            </div>

            {/* Submit */}
            <div style={{ marginTop: "24px" }}>
              <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                Create Account
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
              <button
                type="button"
                onClick={() =>
                  window.open(
                    `${import.meta.env.BASE_URL || "/"}privacy`,
                    "_blank",
                  )
                }
                style={{
                  background: "none",
                  border: "none",
                  color: c.accent,
                  fontWeight: 700,
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                Privacy Policy
              </button>
              .
              <br />
              No email required. Ghost accounts allowed.
            </p>
          </form>

          <p
            style={{
              textAlign: "center",
              fontSize: "14px",
              color: c.textTer,
              marginTop: "24px",
              marginBottom: 0,
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
