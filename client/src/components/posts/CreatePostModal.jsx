import { useState } from "react";
import { X, Type, ImagePlus, Video, Link2 } from "lucide-react";
import toast from "react-hot-toast";

import useUIStore from "../../store/uiStore";
import useTheme from "../../hooks/useTheme";
import { postsApi } from "../../api/endpoints/posts.api";

import CreateTextForm from "./CreateTextForm";
import CreateImageForm from "./CreateImageForm";
import CreateVideoForm from "./CreateVideoForm";
import CreateLinkForm from "./CreateLinkForm";

const POST_TYPES = [
  { key: "text", icon: Type, label: "Text", color: "#8b5cf6" },
  { key: "image", icon: ImagePlus, label: "Image", color: "#3B82F6" },
  { key: "video", icon: Video, label: "Video", color: "#ef4444" },
  { key: "link", icon: Link2, label: "Link", color: "#10b981" },
];

const CreatePostModal = ({ onPostCreated }) => {
  const { isCreatePostOpen, closeCreatePost } = useUIStore();
  const { c } = useTheme();
  const [activeType, setActiveType] = useState("text");
  const [loading, setLoading] = useState(false);

  if (!isCreatePostOpen) return null;

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      let response;
      switch (activeType) {
        case "text":
          response = await postsApi.createTextPost(data);
          break;
        case "image":
          response = await postsApi.createImagePost(data);
          break;
        case "video":
          response = await postsApi.createVideoPost(data);
          break;
        case "link":
          response = await postsApi.createLinkPost(data);
          break;
      }
      toast.success("Post created! 🎉");
      onPostCreated?.(response.data);
      closeCreatePost();
      setActiveType("text");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    closeCreatePost();
    setActiveType("text");
  };

  return (
    <>
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--backdrop)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "480px",
          maxHeight: "85vh",
          background: c.bgCard,
          borderRadius: "20px",
          boxShadow: c.shadowLg,
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          <h2
            style={{
              fontSize: "17px",
              fontWeight: 800,
              color: c.text,
              margin: 0,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Create Post
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: c.bgHover,
              border: "none",
              borderRadius: "10px",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: c.textTer,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "6px",
            padding: "12px 20px",
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          {POST_TYPES.map(({ key, icon: Icon, label, color }) => (
            <button
              key={key}
              onClick={() => !loading && setActiveType(key)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                padding: "10px 8px",
                borderRadius: "12px",
                border:
                  activeType === key
                    ? `2px solid ${color}`
                    : "2px solid transparent",
                background: activeType === key ? `${color}15` : c.bgSubtle,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Icon
                size={18}
                color={activeType === key ? color : c.textMuted}
              />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: activeType === key ? 700 : 500,
                  color: activeType === key ? color : c.textMuted,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {label}
              </span>
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
          {activeType === "text" && (
            <CreateTextForm onSubmit={handleSubmit} loading={loading} />
          )}
          {activeType === "image" && (
            <CreateImageForm onSubmit={handleSubmit} loading={loading} />
          )}
          {activeType === "video" && (
            <CreateVideoForm onSubmit={handleSubmit} loading={loading} />
          )}
          {activeType === "link" && (
            <CreateLinkForm onSubmit={handleSubmit} loading={loading} />
          )}
        </div>
      </div>
    </>
  );
};

export default CreatePostModal;
