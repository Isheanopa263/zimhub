import { useState, useRef } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import { getVideoUrl } from "../../utils/media";
import useTheme from "../../hooks/useTheme";

const VideoPost = ({ videoUrl, thumbnailUrl }) => {
  const videoRef = useRef(null);
  const [isPlaying, setPlaying] = useState(false);
  const [isMuted, setMuted] = useState(true);
  const [error, setError] = useState(false);
  const { c } = useTheme();

  const src = getVideoUrl(videoUrl);
  const thumb = getVideoUrl(thumbnailUrl);

  if (!src) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play().catch(() => {});
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setMuted((m) => !m);
  };

  if (error) {
    return (
      <div
        style={{
          background: c.bgSubtle,
          borderRadius: "14px",
          padding: "32px 20px",
          textAlign: "center",
          border: `1px dashed ${c.borderStrong}`,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ fontSize: "28px", marginBottom: "8px" }}>🎬</div>
        <p style={{ color: c.textMuted, fontSize: "13px", margin: 0 }}>
          Video could not be loaded
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: "14px",
        overflow: "hidden",
        background: "#000",
        position: "relative",
        cursor: "pointer",
      }}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        poster={thumb || undefined}
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setError(true)}
        style={{
          width: "100%",
          maxHeight: "480px",
          objectFit: "contain",
          display: "block",
        }}
      />

      {!isPlaying && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <Play
              size={22}
              color="#0F172A"
              fill="#0F172A"
              style={{ marginLeft: "3px" }}
            />
          </div>
        </div>
      )}

      <button
        onClick={toggleMute}
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          background: "rgba(0,0,0,0.55)",
          border: "none",
          borderRadius: "50%",
          width: "34px",
          height: "34px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
          zIndex: 2,
        }}
      >
        {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>
    </div>
  );
};

export default VideoPost;
