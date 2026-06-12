import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, ArrowRight } from "lucide-react";

import useAuth from "../../hooks/useAuth";
import useAuthStore from "../../store/authStore";
import Logo from "../../components/ui/Logo";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { login, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

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
        background:
          "linear-gradient(135deg, #0F172A 0%, #1e293b 50%, #0F172A 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
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

      {/* Login Card */}
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
            background: "#ffffff",
            borderRadius: "24px",
            padding: "40px 32px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Logo section */}
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
                color: "#94a3b8",
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
                fontWeight: "800",
                color: "#0F172A",
                margin: 0,
              }}
            >
              Welcome back 👋
            </h1>
            <p
              style={{
                color: "#64748b",
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
                label="Email Address"
                name="email"
                type="email"
                placeholder="you@university.ac.zw"
                icon={Mail}
                error={errors.email?.message}
                required
                autoComplete="email"
                {...register("email")}
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
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: "#3B82F6",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                Forgot password?
              </button>
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
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            <span
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                whiteSpace: "nowrap",
              }}
            >
              Don't have an account?
            </span>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
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
