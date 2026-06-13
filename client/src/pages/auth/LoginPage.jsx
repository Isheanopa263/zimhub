import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AtSign, Lock, ArrowRight } from "lucide-react";

import useAuth from "../../hooks/useAuth";
import useAuthStore from "../../store/authStore";
import useTheme from "../../hooks/useTheme";

import Logo from "../../components/ui/Logo";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import ThemeToggleButton from "../../components/ui/ThemeToggleButton";

/* ─── Validation Schema ─────────────────────────────────────────────────────── */
const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

/* ─── Component ─────────────────────────────────────────────────────────────── */
const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { login, isLoading } = useAuth();
  const { c, isDark } = useTheme();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  /* Redirect if already logged in */
  useEffect(() => {
    if (isAuthenticated) navigate("/feed", { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    await login(data);
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
      {/* ── Theme Toggle ── */}
      <ThemeToggleButton position="top-right" />

      {/* ── Background blobs ── */}
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

      {/* ── Card ── */}
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            background: c.bgCard,
            borderRadius: "24px",
            padding: "40px 32px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3)",
            border: `1px solid ${c.border}`,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "32px",
            }}
          >
            <Logo size="lg" />
            <p
              style={{
                color: c.textTer,
                fontSize: "14px",
                marginTop: "12px",
                textAlign: "center",
              }}
            >
              Your private student community
            </p>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: "28px" }}>
            <h1
              style={{
                fontSize: "26px",
                fontWeight: 800,
                color: c.text,
                margin: 0,
              }}
            >
              Welcome back 👋
            </h1>
            <p
              style={{
                color: c.textTer,
                fontSize: "14px",
                marginTop: "6px",
              }}
            >
              Sign in to your ZimHub account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "18px" }}
            >
              <Input
                label="Email or Username"
                name="identifier"
                type="text"
                placeholder="you@uni.ac.zw or username"
                icon={AtSign}
                error={errors.identifier?.message}
                required
                autoComplete="username"
                {...register("identifier")}
              />

              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="Enter your password"
                icon={Lock}
                error={errors.password?.message}
                required
                autoComplete="current-password"
                {...register("password")}
              />
            </div>

            {/* Forgot password */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "10px",
              }}
            >
              <Link
                to="/forgot-password"
                style={{
                  color: c.accent,
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit button */}
            <div style={{ marginTop: "24px" }}>
              <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                Sign In
                {!isLoading && <ArrowRight size={16} />}
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              margin: "28px 0",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: c.border }} />
            <span
              style={{
                fontSize: "12px",
                color: c.textMuted,
                whiteSpace: "nowrap",
              }}
            >
              Don't have an account?
            </span>
            <div style={{ flex: 1, height: "1px", background: c.border }} />
          </div>

          {/* Register link */}
          <Link to="/register" style={{ textDecoration: "none" }}>
            <Button variant="outline" fullWidth size="lg">
              Create Account
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            color: "rgba(255, 255, 255, 0.3)",
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

export default LoginPage;
