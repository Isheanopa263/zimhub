import { useEffect } from "react";
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
} from "lucide-react";

import useAuth from "../../hooks/useAuth";
import useAuthStore from "../../store/authStore";
import Logo from "../../components/ui/Logo";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name is too long")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "Full name can only contain letters and spaces",
      ),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username cannot exceed 30 characters")
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

/* ─── Password Strength ──────────────────────────────────────────── */
const PasswordStrength = ({ password }) => {
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
              background: i < strength ? colors[strength - 1] : "#e2e8f0",
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

/* ─── Register Page ────────────────────────────────────────────── */
const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { register: registerUser, isLoading } = useAuth();

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

  const onSubmit = async (data) => {
    const { confirmPassword, ...formData } = data;
    await registerUser(formData);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background:
          "linear-gradient(135deg, #0F172A 0%, #1e293b 50%, #0F172A 100%)",
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

      {/* Content */}
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Back link */}
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
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.target.style.color = "#ffffff")}
          onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,0.5)")}
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>

        {/* Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            padding: "36px 32px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div style={{ marginBottom: "24px" }}>
            <Logo size="sm" />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <h1
              style={{
                fontSize: "26px",
                fontWeight: "800",
                color: "#0F172A",
                margin: 0,
              }}
            >
              Join ZimHub 🎓
            </h1>
            <p style={{ color: "#64748b", fontSize: "14px", marginTop: "6px" }}>
              Create your student account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <Input
                label="Full Name"
                name="fullName"
                type="text"
                placeholder="Tendai Mukamuri"
                icon={User}
                error={errors.fullName?.message}
                required
                {...register("fullName")}
              />

              <Input
                label="Username"
                name="username"
                type="text"
                placeholder="tendai_m"
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
                placeholder="you@university.ac.zw"
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
                <PasswordStrength password={watchedPassword} />
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

              {/* Bio textarea */}
              <div>
                <label
                  htmlFor="bio"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#0F172A",
                    marginBottom: "6px",
                  }}
                >
                  Bio{" "}
                  <span style={{ color: "#94a3b8", fontWeight: 400 }}>
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
                      color: "#94a3b8",
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
                      border: `2px solid ${errors.bio ? "#fca5a5" : "#e2e8f0"}`,
                      background: errors.bio ? "#fef2f2" : "#ffffff",
                      color: "#0F172A",
                      fontSize: "14px",
                      fontFamily: "Inter, system-ui, sans-serif",
                      resize: "none",
                      outline: "none",
                      transition: "all 0.15s ease",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3B82F6";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.boxShadow = "none";
                    }}
                    {...register("bio")}
                  />
                </div>
                {errors.bio && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#ef4444",
                      marginTop: "6px",
                    }}
                  >
                    {errors.bio.message}
                  </p>
                )}
              </div>
            </div>

            <div style={{ marginTop: "24px" }}>
              <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                Create Account
                {!isLoading && <ArrowRight size={16} />}
              </Button>
            </div>

            <p
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                textAlign: "center",
                marginTop: "16px",
              }}
            >
              By creating an account, you agree to our{" "}
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: "#3B82F6",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontFamily: "inherit",
                }}
              >
                Terms of Service
              </button>
            </p>
          </form>

          {/* Login link */}
          <p
            style={{
              textAlign: "center",
              fontSize: "14px",
              color: "#64748b",
              marginTop: "24px",
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "#3B82F6",
                fontWeight: "600",
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
