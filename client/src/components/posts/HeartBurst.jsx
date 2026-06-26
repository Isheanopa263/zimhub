import { Heart } from "lucide-react";

/**
 * The flying heart animation that bursts from the tap location
 */
const HeartBurst = ({ x, y, id }) => (
  <div
    key={id}
    style={{
      position: "absolute",
      left: `${x}px`,
      top: `${y}px`,
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
      zIndex: 10,
      animation: "heartBurst 800ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
    }}
  >
    <Heart
      size={90}
      fill="#ef4444"
      color="#ef4444"
      strokeWidth={0}
      style={{
        filter: "drop-shadow(0 4px 16px rgba(239, 68, 68, 0.6))",
      }}
    />

    <style>{`
      @keyframes heartBurst {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.3) rotate(-15deg);
        }
        15% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.2) rotate(-5deg);
        }
        30% {
          transform: translate(-50%, -50%) scale(1) rotate(0deg);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -120%) scale(0.8) rotate(8deg);
        }
      }
    `}</style>
  </div>
);

export default HeartBurst;
