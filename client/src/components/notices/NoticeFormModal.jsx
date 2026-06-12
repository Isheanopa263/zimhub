import { useState, useRef, useEffect } from "react";
import {
  X,
  Phone,
  MessageCircle,
  Mail,
  ImagePlus,
  FileText,
  Type,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import { noticesApi } from "../../api/endpoints/notices.api";
import { getNoticeUrl } from "../../utils/media";
import useTheme from "../../hooks/useTheme";

const NoticeFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  editingNotice = null,
}) => {
  const { c } = useTheme();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const isEditMode = !!editingNotice;

  useEffect(() => {
    if (editingNotice) {
      setTitle(editingNotice.title || "");
      setDescription(editingNotice.description || "");
      setPhone(editingNotice.contact?.phone || "");
      setWhatsapp(editingNotice.contact?.whatsapp || "");
      setEmail(editingNotice.contact?.email || "");
      setPosterPreview(getNoticeUrl(editingNotice.posterUrl) || null);
      setPosterFile(null);
    } else {
      resetForm();
    }
  }, [editingNotice, isOpen]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPhone("");
    setWhatsapp("");
    setEmail("");
    setPosterFile(null);
    setPosterPreview(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const clearPoster = () => {
    setPosterFile(null);
    setPosterPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading) return;

    if (!title.trim() || title.trim().length < 3) {
      return toast.error("Title must be at least 3 characters");
    }
    if (!description.trim() || description.trim().length < 10) {
      return toast.error("Description must be at least 10 characters");
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      if (phone.trim()) formData.append("phoneNumber", phone.trim());
      if (whatsapp.trim()) formData.append("whatsappNumber", whatsapp.trim());
      if (email.trim()) formData.append("emailAddress", email.trim());
      if (posterFile) formData.append("poster", posterFile);

      let response;
      if (isEditMode) {
        response = await noticesApi.update(editingNotice.id, formData);
        toast.success("Notice updated!");
      } else {
        response = await noticesApi.create(formData);
        toast.success("Notice posted! 📢");
      }

      onSuccess?.(response.data);
      resetForm();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save notice");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: `2px solid ${c.borderStrong}`,
    background: c.bgInput,
    color: c.text,
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
    outline: "none",
    transition: "all 0.15s ease",
  };

  const focusStyle = (e) => {
    e.target.style.borderColor = c.accent;
    e.target.style.boxShadow = `0 0 0 3px ${c.accent}20`;
  };

  const blurStyle = (e) => {
    e.target.style.borderColor = c.borderStrong;
    e.target.style.boxShadow = "none";
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
          maxWidth: "520px",
          maxHeight: "90vh",
          background: c.bgCard,
          borderRadius: "20px",
          boxShadow: c.shadowLg,
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
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
            {isEditMode ? "Edit Notice" : "Post a Notice"}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              background: c.bgHover,
              border: "none",
              borderRadius: "10px",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: loading ? "not-allowed" : "pointer",
              color: c.textTer,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflow: "auto",
            padding: "16px 20px",
          }}
        >
          {/* Title */}
          <FormField label="Title" icon={Type} required c={c}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Looking for accommodation"
              maxLength={255}
              required
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </FormField>

          {/* Description */}
          <FormField label="Description" icon={FileText} required c={c}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about your notice..."
              maxLength={2000}
              rows={5}
              required
              style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
            <div
              style={{
                textAlign: "right",
                fontSize: "11px",
                color: description.length > 1800 ? c.danger : c.textMuted,
                marginTop: "4px",
              }}
            >
              {description.length}/2000
            </div>
          </FormField>

          {/* Poster image */}
          <FormField label="Poster Image (Optional)" icon={ImagePlus} c={c}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />

            {posterPreview ? (
              <div style={{ position: "relative" }}>
                <img
                  src={posterPreview}
                  alt="Preview"
                  style={{
                    width: "100%",
                    maxHeight: "200px",
                    borderRadius: "12px",
                    objectFit: "cover",
                  }}
                />
                <button
                  type="button"
                  onClick={clearPoster}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    background: "rgba(0,0,0,0.6)",
                    border: "none",
                    borderRadius: "50%",
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#fff",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${c.borderStrong}`,
                  borderRadius: "12px",
                  padding: "20px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  background: c.bgSubtle,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = c.accent)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = c.borderStrong)
                }
              >
                <ImagePlus
                  size={28}
                  color={c.textMuted}
                  style={{ margin: "0 auto 6px" }}
                />
                <p
                  style={{
                    fontSize: "13px",
                    color: c.textTer,
                    margin: "0 0 2px",
                    fontWeight: 600,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Click to upload image
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: c.textMuted,
                    margin: 0,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Max 5MB
                </p>
              </div>
            )}
          </FormField>

          {/* Contact section */}
          <div
            style={{
              background: c.bgSubtle,
              borderRadius: "12px",
              padding: "14px",
              marginTop: "8px",
              border: `1px solid ${c.border}`,
            }}
          >
            <p
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: c.textTer,
                margin: "0 0 12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Contact Info (Optional)
            </p>

            <FormField label="Phone" icon={Phone} compact c={c}>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+263 77 123 4567"
                type="tel"
                style={inputStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </FormField>

            <FormField label="WhatsApp" icon={MessageCircle} compact c={c}>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+263 77 123 4567"
                type="tel"
                style={inputStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </FormField>

            <FormField label="Email" icon={Mail} compact noMargin c={c}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                type="email"
                style={inputStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </FormField>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "20px",
              padding: "14px",
              background: "linear-gradient(135deg,#3B82F6,#2563eb)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
              fontFamily: "Inter, sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading && (
              <Loader2
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
            )}
            {loading
              ? isEditMode
                ? "Updating..."
                : "Posting..."
              : isEditMode
                ? "Update Notice"
                : "Post Notice"}
          </button>
        </form>

        <style>{`
          @keyframes spin {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  );
};

const FormField = ({
  label,
  icon: Icon,
  required,
  children,
  compact = false,
  noMargin = false,
  c,
}) => (
  <div style={{ marginBottom: noMargin ? 0 : compact ? "10px" : "14px" }}>
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "13px",
        fontWeight: 600,
        color: c.text,
        marginBottom: "6px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {Icon && <Icon size={13} color={c.textTer} />}
      {label}
      {required && <span style={{ color: c.danger }}>*</span>}
    </label>
    {children}
  </div>
);

export default NoticeFormModal;
