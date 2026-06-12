import toast from "react-hot-toast";

const TYPE_CONFIG = {
  post_liked: { emoji: "❤️" },
  new_comment: { emoji: "💬" },
  admin_announcement: { emoji: "📢" },
};

/**
 * Show a toast notification for a new alert
 */
export const showNotificationToast = (notification) => {
  const config = TYPE_CONFIG[notification.type] || { emoji: "🔔" };

  toast(
    (t) => (
      <div
        onClick={() => {
          window.location.href = "/notifications";
          toast.dismiss(t.id);
        }}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          cursor: "pointer",
          minWidth: "240px",
          maxWidth: "320px",
        }}
      >
        <div
          style={{
            fontSize: "20px",
            flexShrink: 0,
            paddingTop: "2px",
          }}
        >
          {config.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 2px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {notification.title}
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.85)",
              margin: 0,
              lineHeight: 1.4,
              fontFamily: "Inter, sans-serif",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {notification.message}
          </p>
        </div>
      </div>
    ),
    {
      duration: 5000,
      position: "top-right",
      style: {
        background: "#0F172A",
        padding: "12px 14px",
        borderRadius: "12px",
        border: "1px solid rgba(59,130,246,0.3)",
      },
    },
  );
};

/**
 * Play a subtle notification sound
 */
export const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.frequency.value = 880;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);
  } catch {
    // silent fail
  }
};
