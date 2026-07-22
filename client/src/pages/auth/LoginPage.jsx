import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AtSign, Lock, ArrowRight, X } from "lucide-react";

import useAuthStore from "../../store/authStore";
import useTheme from "../../hooks/useTheme";
import { authApi } from "../../api/endpoints/auth.api";

import Logo from "../../components/ui/Logo";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import ThemeToggleButton from "../../components/ui/ThemeToggleButton";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuthStore();
  const { c, isDark } = useTheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const watchedIdentifier = watch("identifier");
  const watchedPassword = watch("password");

  useEffect(() => {
    if (error) {
      setError(null);
      setErrorType(null);
    }
    // eslint-disable-next-line
  }, [watchedIdentifier, watchedPassword]);

  useEffect(() => {
    if (isAuthenticated) navigate("/feed", { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setErrorType(null);

    try {
      const response = await authApi.login(data);

      const accessToken = response?.data?.accessToken;
      const refreshToken = response?.data?.refreshToken;
      const user = response?.data?.user;

      if (!accessToken || !user) {
        setError("Server returned an unexpected response. Please try again.");
        setErrorType("unknown");
        return;
      }

      login(user, accessToken, refreshToken);
      navigate("/feed");
    } catch (err) {
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message;

      if (status === 429) {
        setError(
          serverMessage ||
            "Too many login attempts. Please wait 15 minutes before trying again.",
        );
        setErrorType("rate_limit");
      } else if (status === 401) {
        setError(
          "Incorrect email/username or password. Please check your credentials and try again.",
        );
        setErrorType("credentials");
      } else if (status === 403) {
        setError(
          serverMessage ||
            "Your account has been suspended. Please contact admin.",
        );
        setErrorType("suspended");
      } else if (status === 400) {
        setError(serverMessage || "Invalid login request.");
        setErrorType("credentials");
      } else if (status >= 500) {
        setError("Server error. Please try again in a moment.");
        setErrorType("unknown");
      } else if (!err.response) {
        setError(
          "Cannot connect to server. Please check your internet connection.",
        );
        setErrorType("network");
      } else {
        setError(serverMessage || "Login failed. Please try again.");
        setErrorType("unknown");
      }
    } finally {
      setLoading(false);
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
          <div style={{ marginBottom: "24px" }}>
            <h1
              style={{
                fontSize: "26px",
                fontWeight: 800,
                color: c.text,
                margin: 0,
              }}
            >
              Welcome👋
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

          {/* Error Banner */}
          {error && (
            <ErrorBanner
              error={error}
              type={errorType}
              onDismiss={() => {
                setError(null);
                setErrorType(null);
              }}
              c={c}
            />
          )}

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
                hasServerError={errorType === "credentials"}
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
                hasServerError={errorType === "credentials"}
                {...register("password")}
              />
            </div>

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

            <div style={{ marginTop: "24px" }}>
              <Button
                type="submit"
                fullWidth
                isLoading={loading}
                size="lg"
                disabled={loading || errorType === "rate_limit"}
              >
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <ArrowRight size={16} />}
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

          <Link to="/register" style={{ textDecoration: "none" }}>
            <Button variant="outline" fullWidth size="lg">
              Create Account
            </Button>
          </Link>
        </div>

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

/* ─── Error Banner ─── */
const ErrorBanner = ({ error, type, onDismiss, c }) => {
  const config = {
    credentials: {
      bg: c.dangerLight,
      border: c.danger,
      icon: "🔒",
      title: "Login failed",
    },
    suspended: {
      bg: c.dangerLight,
      border: c.danger,
      icon: "🚫",
      title: "Account suspended",
    },
    rate_limit: {
      bg: c.warningLight,
      border: c.warning,
      icon: "⏰",
      title: "Too many attempts",
    },
    network: {
      bg: c.warningLight,
      border: c.warning,
      icon: "🌐",
      title: "Connection error",
    },
    unknown: {
      bg: c.dangerLight,
      border: c.danger,
      icon: "⚠️",
      title: "Something went wrong",
    },
  };

  const style = config[type] || config.unknown;

  return (
    <div
      role="alert"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}40`,
        borderLeft: `4px solid ${style.border}`,
        borderRadius: "12px",
        padding: "14px 14px 14px 12px",
        marginBottom: "20px",
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        animation: "shake 0.4s ease",
      }}
    >
      <div
        style={{
          fontSize: "20px",
          flexShrink: 0,
          lineHeight: 1,
          marginTop: "2px",
        }}
      >
        {style.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "13px",
            fontWeight: 800,
            color: style.border,
            margin: "0 0 4px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {style.title}
        </p>
        <p
          style={{
            fontSize: "13px",
            color: c.text,
            margin: 0,
            lineHeight: 1.5,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {error}
        </p>

        {type === "credentials" && (
          <div
            style={{
              marginTop: "8px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/forgot-password"
              style={{
                fontSize: "12px",
                color: style.border,
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: "2px",
              }}
            >
              Forgot password?
            </Link>
            <Link
              to="/register"
              style={{
                fontSize: "12px",
                color: style.border,
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: "2px",
              }}
            >
              Create account
            </Link>
          </div>
        )}
      </div>

      <button
        onClick={onDismiss}
        aria-label="Dismiss error"
        style={{
          background: "transparent",
          border: "none",
          padding: "4px",
          cursor: "pointer",
          color: style.border,
          opacity: 0.6,
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "opacity 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
      >
        <X size={14} />
      </button>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%      { transform: translateX(-4px); }
          40%      { transform: translateX(4px); }
          60%      { transform: translateX(-2px); }
          80%      { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
