import { useState, useEffect } from "react";
import { X, Download, Smartphone, Wifi, Bell, Zap } from "lucide-react";
import useTheme from "../../hooks/useTheme";

const DISMISSED_KEY = "zimhub-install-dismissed";
const DISMISS_DAYS = 7; // Show again after 7 days if dismissed

const InstallPrompt = () => {
  const { c, isDark } = useTheme();
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isStandalone) return; // Already installed — don't show

    // Check if recently dismissed
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      const dismissedDate = new Date(parseInt(dismissed));
      const daysSince =
        (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DAYS) return; // Recently dismissed
    }

    // Detect iOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Listen for the browser's install prompt (Chrome/Edge/Android)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show our custom prompt after a short delay
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // For iOS — show after delay (no beforeinstallprompt event)
    if (isIOSDevice) {
      setTimeout(() => setShow(true), 5000);
    }

    // For browsers that don't fire beforeinstallprompt but support PWA
    // Show after longer delay
    if (!isIOSDevice) {
      setTimeout(() => {
        if (!deferredPrompt) {
          // Browser might support install but didn't fire event
          // Check if service worker is registered
          if ("serviceWorker" in navigator) {
            setShow(true);
          }
        }
      }, 10000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  // Handle native install (Chrome/Edge/Android)
  const handleInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          setShow(false);
          localStorage.removeItem(DISMISSED_KEY);
        }
      } catch {}
      setInstalling(false);
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Fallback — show manual instructions
      setShowIOSGuide(true);
    }
  };

  // Dismiss
  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleDismiss}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 9998,
          animation: "fadeIn 0.3s ease",
        }}
      />

      {/* Prompt Card */}
      <div
        style={{
          position: "fixed",
          bottom: "0",
          left: "0",
          right: "0",
          zIndex: 9999,
          animation: "slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            margin: "0 auto",
            background: c.bgCard,
            borderRadius: "24px 24px 0 0",
            padding: "0",
            boxShadow: "0 -10px 50px rgba(0,0,0,0.25)",
            overflow: "hidden",
          }}
        >
          {/* Header with gradient */}
          <div
            style={{
              background:
                "linear-gradient(135deg, #3B82F6 0%, #2563eb 50%, #8b5cf6 100%)",
              padding: "24px 20px 20px",
              position: "relative",
            }}
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#ffffff",
                backdropFilter: "blur(8px)",
              }}
            >
              <X size={16} />
            </button>

            {/* App icon + name */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid rgba(255,255,255,0.3)",
                }}
              >
                <span
                  style={{
                    color: "#ffffff",
                    fontWeight: 900,
                    fontSize: "24px",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Z
                </span>
              </div>

              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#ffffff",
                    fontSize: "20px",
                    fontWeight: 900,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Install ZimHub
                </h2>
                <p
                  style={{
                    margin: "4px 0 0",
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "13px",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Get the full app experience
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "20px" }}>
            {showIOSGuide ? (
              /* iOS/Manual Install Guide */
              <IOSInstallGuide
                c={c}
                isIOS={isIOS}
                onBack={() => setShowIOSGuide(false)}
              />
            ) : (
              <>
                {/* Benefits */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "10px",
                    marginBottom: "20px",
                  }}
                >
                  <Benefit
                    c={c}
                    icon={Smartphone}
                    title="Home Screen"
                    description="Quick access like a native app"
                    color="#3B82F6"
                  />
                  <Benefit
                    c={c}
                    icon={Zap}
                    title="Faster"
                    description="Loads instantly, works offline"
                    color="#f59e0b"
                  />
                  <Benefit
                    c={c}
                    icon={Bell}
                    title="Notifications"
                    description="Never miss an update"
                    color="#ef4444"
                  />
                  <Benefit
                    c={c}
                    icon={Wifi}
                    title="Fullscreen"
                    description="No browser bars"
                    color="#10b981"
                  />
                </div>

                {/* Install button */}
                <button
                  onClick={handleInstall}
                  disabled={installing}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: "linear-gradient(135deg, #3B82F6, #2563eb)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "14px",
                    fontSize: "16px",
                    fontWeight: 800,
                    cursor: installing ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontFamily: "Inter, sans-serif",
                    boxShadow: "0 4px 14px rgba(59,130,246,0.4)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.opacity = "0.95";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  <Download size={18} />
                  {installing ? "Installing..." : "Install App"}
                </button>

                {/* Dismiss text */}
                <button
                  onClick={handleDismiss}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "none",
                    border: "none",
                    color: c.textMuted,
                    fontSize: "13px",
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    marginTop: "4px",
                  }}
                >
                  Not now — remind me later
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

/* ─── Benefit Card ─── */
const Benefit = ({ c, icon: Icon, title, description, color }) => (
  <div
    style={{
      padding: "12px",
      background: c.bgSubtle,
      borderRadius: "12px",
      border: `1px solid ${c.border}`,
    }}
  >
    <div
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        background: `${color}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "8px",
      }}
    >
      <Icon size={16} color={color} />
    </div>
    <p
      style={{
        fontSize: "13px",
        fontWeight: 700,
        color: c.text,
        margin: "0 0 2px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {title}
    </p>
    <p
      style={{
        fontSize: "11px",
        color: c.textMuted,
        margin: 0,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {description}
    </p>
  </div>
);

/* ─── iOS Install Guide ─── */
const IOSInstallGuide = ({ c, isIOS, onBack }) => {
  const steps = isIOS
    ? [
        {
          num: 1,
          text: "Tap the Share button",
          icon: "📤",
          detail: "Bottom center of Safari",
        },
        {
          num: 2,
          text: 'Scroll down and tap "Add to Home Screen"',
          icon: "📱",
          detail: "In the share menu",
        },
        { num: 3, text: 'Tap "Add"', icon: "✅", detail: "Top right corner" },
      ]
    : [
        {
          num: 1,
          text: "Tap the browser menu",
          icon: "⋮",
          detail: "Three dots (top right)",
        },
        {
          num: 2,
          text: 'Tap "Install app" or "Add to Home screen"',
          icon: "📱",
          detail: "In the menu",
        },
        {
          num: 3,
          text: 'Tap "Install"',
          icon: "✅",
          detail: "Confirm the prompt",
        },
      ];

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: c.accent,
          fontSize: "13px",
          fontWeight: 700,
          cursor: "pointer",
          padding: "0 0 12px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        ← Back
      </button>

      <h3
        style={{
          fontSize: "16px",
          fontWeight: 800,
          color: c.text,
          margin: "0 0 4px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {isIOS ? "Install on iPhone/iPad" : "Install on your device"}
      </h3>
      <p
        style={{
          fontSize: "13px",
          color: c.textTer,
          margin: "0 0 16px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        Follow these quick steps:
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {steps.map((step) => (
          <div
            key={step.num}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 14px",
              background: c.bgSubtle,
              borderRadius: "12px",
              border: `1px solid ${c.border}`,
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: c.accentLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: "16px",
              }}
            >
              {step.icon}
            </div>
            <div>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: c.text,
                  margin: "0 0 2px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {step.text}
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: c.textMuted,
                  margin: 0,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {step.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p
        style={{
          fontSize: "12px",
          color: c.textMuted,
          textAlign: "center",
          margin: "16px 0 0",
          fontFamily: "Inter, sans-serif",
        }}
      >
        After installing, ZimHub will appear on your home screen!
      </p>
    </div>
  );
};

export default InstallPrompt;
