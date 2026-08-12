import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";
import { getImageUrl } from "../../utils/media";
import useTheme from "../../hooks/useTheme";

const ImagePost = ({ images, imageUrl, caption }) => {
  const { c } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const imageList = (() => {
    if (Array.isArray(images) && images.length > 0) return images;
    if (imageUrl) return [{ url: imageUrl }];
    return [];
  })();

  if (imageList.length === 0) return null;

  const isCarousel = imageList.length > 1;
  const currentImage = imageList[currentIndex];

  const goToIndex = (index) => {
    const clamped = Math.max(0, Math.min(index, imageList.length - 1));
    setCurrentIndex(clamped);
  };

  const goPrev = (e) => {
    e?.stopPropagation();
    goToIndex(currentIndex - 1);
  };

  const goNext = (e) => {
    e?.stopPropagation();
    goToIndex(currentIndex + 1);
  };

  /* ─── Unified swipe/drag handler (touch + mouse) ─── */
  const startX = useRef(null);
  const startY = useRef(null);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);

  const getX = (e) => {
    if (e.touches?.[0]) return e.touches[0].clientX;
    if (e.changedTouches?.[0]) return e.changedTouches[0].clientX;
    return e.clientX;
  };

  const getY = (e) => {
    if (e.touches?.[0]) return e.touches[0].clientY;
    if (e.changedTouches?.[0]) return e.changedTouches[0].clientY;
    return e.clientY;
  };

  const onDragStart = (e) => {
    if (!isCarousel) return;
    startX.current = getX(e);
    startY.current = getY(e);
    isDragging.current = true;
    hasMoved.current = false;
  };

  const onDragMove = (e) => {
    if (!isDragging.current || startX.current === null) return;

    const currentX = getX(e);
    const currentY = getY(e);
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);

    // Only track if horizontal intent detected
    if (absX > 10 || hasMoved.current) {
      if (absX > absY) {
        hasMoved.current = true;
        // Prevent page scroll during horizontal swipe
        if (e.cancelable) e.preventDefault();
        // Live drag offset for visual feedback
        setDragOffset(diffX);
      }
    }
  };

  const onDragEnd = (e) => {
    if (!isDragging.current) {
      setDragOffset(0);
      return;
    }

    const endX = getX(e);
    const distance = startX.current - endX;
    const minSwipe = 50;

    if (hasMoved.current) {
      if (distance > minSwipe && currentIndex < imageList.length - 1) {
        goNext();
      } else if (distance < -minSwipe && currentIndex > 0) {
        goPrev();
      }

      // Stop click from firing after drag
      e.stopPropagation?.();
    }

    startX.current = null;
    startY.current = null;
    isDragging.current = false;
    hasMoved.current = false;
    setDragOffset(0);
  };

  const onDragCancel = () => {
    startX.current = null;
    startY.current = null;
    isDragging.current = false;
    hasMoved.current = false;
    setDragOffset(0);
  };

  /* ── Keyboard navigation ── */
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKey = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") setLightboxOpen(false);
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line
  }, [lightboxOpen, currentIndex]);

  return (
    <>
      <div
        style={{
          borderRadius: "14px",
          overflow: "hidden",
          background: c.skeletonBase,
          position: "relative",
          touchAction: isCarousel ? "pan-y" : "auto",
          userSelect: "none",
          WebkitUserSelect: "none",
          cursor: isCarousel ? "grab" : "default",
        }}
        // Touch events (mobile)
        onTouchStart={onDragStart}
        onTouchMove={onDragMove}
        onTouchEnd={onDragEnd}
        onTouchCancel={onDragCancel}
        // Mouse events (desktop)
        onMouseDown={onDragStart}
        onMouseMove={onDragMove}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragCancel}
      >
        {isCarousel && (
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              zIndex: 3,
              backdropFilter: "blur(8px)",
              pointerEvents: "none",
            }}
          >
            {currentIndex + 1} / {imageList.length}
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setLightboxOpen(true);
          }}
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 3,
            backdropFilter: "blur(8px)",
          }}
          title="View full screen"
        >
          <ZoomIn size={15} />
        </button>

        {isCarousel && currentIndex > 0 && (
          <button
            onClick={goPrev}
            style={{
              position: "absolute",
              left: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 3,
              backdropFilter: "blur(8px)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(0,0,0,0.8)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(0,0,0,0.5)")
            }
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {isCarousel && currentIndex < imageList.length - 1 && (
          <button
            onClick={goNext}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 3,
              backdropFilter: "blur(8px)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(0,0,0,0.8)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(0,0,0,0.5)")
            }
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Image with drag offset for visual feedback */}
        <div
          style={{
            transform: `translateX(${dragOffset * 0.3}px)`,
            transition: isDragging.current ? "none" : "transform 0.3s ease",
          }}
        >
          <CarouselImage
            src={getImageUrl(currentImage.url)}
            alt={caption || `Image ${currentIndex + 1}`}
            c={c}
          />
        </div>

        {isCarousel && (
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "6px",
              background: "rgba(0,0,0,0.5)",
              padding: "6px 10px",
              borderRadius: "20px",
              backdropFilter: "blur(8px)",
              zIndex: 3,
            }}
          >
            {imageList.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  goToIndex(idx);
                }}
                style={{
                  width: idx === currentIndex ? "20px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  border: "none",
                  background:
                    idx === currentIndex ? "#fff" : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  padding: 0,
                }}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <Lightbox
          images={imageList}
          currentIndex={currentIndex}
          onClose={() => setLightboxOpen(false)}
          onNext={goNext}
          onPrev={goPrev}
          onChange={goToIndex}
          c={c}
        />
      )}
    </>
  );
};

/* ─── Carousel Image ─── */
const CarouselImage = ({ src, alt, c }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  if (!src || error) {
    return (
      <div
        style={{
          background: c.bgSubtle,
          padding: "60px 20px",
          textAlign: "center",
          color: c.textMuted,
          fontSize: "13px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        🖼️ Image unavailable
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        minHeight: loaded ? "auto" : "300px",
      }}
    >
      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, ${c.skeletonBase} 0%, ${c.skeletonShine} 50%, ${c.skeletonBase} 100%)`,
            backgroundSize: "200% 100%",
            animation: "imgShimmer 1.5s infinite",
          }}
        />
      )}

      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable="false"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          width: "100%",
          maxHeight: "500px",
          objectFit: "cover",
          display: "block",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease",
          userSelect: "none",
          WebkitUserSelect: "none",
          pointerEvents: "none",
        }}
      />

      <style>{`
        @keyframes imgShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
};

/* ─── Lightbox ─── */
const Lightbox = ({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  onChange,
  c,
}) => {
  const current = images[currentIndex];
  const startX = useRef(null);
  const startY = useRef(null);
  const hasMoved = useRef(false);

  const getX = (e) => e.touches?.[0]?.clientX ?? e.clientX;
  const getY = (e) => e.touches?.[0]?.clientY ?? e.clientY;

  const onStart = (e) => {
    startX.current = getX(e);
    startY.current = getY(e);
    hasMoved.current = false;
  };

  const onMove = (e) => {
    if (startX.current === null) return;
    const diffX = Math.abs(getX(e) - startX.current);
    const diffY = Math.abs(getY(e) - startY.current);
    if (diffX > 10 && diffX > diffY) hasMoved.current = true;
  };

  const onEnd = (e) => {
    if (!hasMoved.current || startX.current === null) {
      startX.current = null;
      return;
    }
    const endX = e.changedTouches?.[0]?.clientX ?? e.clientX;
    const distance = startX.current - endX;
    if (distance > 50 && currentIndex < images.length - 1) onNext();
    if (distance < -50 && currentIndex > 0) onPrev();
    startX.current = null;
    hasMoved.current = false;
  };

  return (
    <div
      onClick={onClose}
      onTouchStart={onStart}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
      onMouseDown={onStart}
      onMouseMove={onMove}
      onMouseUp={onEnd}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.95)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.2s ease",
        userSelect: "none",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "rgba(255,255,255,0.1)",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: "44px",
          height: "44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 3,
          backdropFilter: "blur(8px)",
        }}
      >
        <X size={20} />
      </button>

      {images.length > 1 && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: 700,
            fontFamily: "Inter, sans-serif",
            backdropFilter: "blur(8px)",
          }}
        >
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {images.length > 1 && currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          style={{
            position: "absolute",
            left: "20px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {images.length > 1 && currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          style={{
            position: "absolute",
            right: "20px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
        >
          <ChevronRight size={24} />
        </button>
      )}

      <img
        src={getImageUrl(current.url)}
        alt={`Image ${currentIndex + 1}`}
        onClick={(e) => e.stopPropagation()}
        draggable="false"
        style={{
          maxWidth: "100%",
          maxHeight: "90vh",
          objectFit: "contain",
          borderRadius: "8px",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      />

      {images.length > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "6px",
            maxWidth: "90vw",
            overflowX: "auto",
            padding: "4px",
          }}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => onChange(idx)}
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "6px",
                border:
                  idx === currentIndex
                    ? `2px solid #fff`
                    : "2px solid transparent",
                overflow: "hidden",
                cursor: "pointer",
                padding: 0,
                flexShrink: 0,
                opacity: idx === currentIndex ? 1 : 0.5,
                transition: "all 0.15s ease",
              }}
            >
              <img
                src={getImageUrl(img.url)}
                alt={`Thumb ${idx + 1}`}
                draggable="false"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ImagePost;
