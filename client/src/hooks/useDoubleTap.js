import { useRef, useState, useCallback } from "react";

/**
 * Hook for double-tap/double-click detection with heart burst animation
 *
 * Works on:
 * - Mobile (touch)
 * - Desktop (mouse clicks)
 *
 * @param {Function} onDoubleTap - Called when double tap detected
 * @param {Object} options
 * @param {number} options.delay - Max time between taps in ms (default 300)
 */
const useDoubleTap = (onDoubleTap, { delay = 300 } = {}) => {
  const lastTapTimeRef = useRef(0);
  const lastTapPositionRef = useRef({ x: 0, y: 0 });
  const [bursts, setBursts] = useState([]);

  /**
   * Get the position relative to the element
   */
  const getRelativePosition = (e, element) => {
    const rect = element.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches[0]) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  /**
   * Add a heart burst at position
   */
  const addBurst = (x, y) => {
    const burst = { id: Date.now() + Math.random(), x, y };
    setBursts((prev) => [...prev, burst]);

    // Auto-cleanup after animation
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== burst.id));
    }, 850);
  };

  /**
   * Handle tap (touch) events
   */
  const handleTouchEnd = useCallback(
    (e) => {
      const now = Date.now();
      const position = getRelativePosition(e, e.currentTarget);
      const timeDiff = now - lastTapTimeRef.current;

      // Check distance between taps too (prevent accidental double tap from scrolling)
      const distX = Math.abs(position.x - lastTapPositionRef.current.x);
      const distY = Math.abs(position.y - lastTapPositionRef.current.y);
      const tooFar = distX > 50 || distY > 50;

      if (timeDiff > 0 && timeDiff < delay && !tooFar) {
        // Double tap detected!
        e.preventDefault();
        addBurst(position.x, position.y);
        onDoubleTap?.(position);
        lastTapTimeRef.current = 0; // Reset
      } else {
        lastTapTimeRef.current = now;
        lastTapPositionRef.current = position;
      }
    },
    [onDoubleTap, delay],
  );

  /**
   * Handle mouse double-click (desktop)
   */
  const handleDoubleClick = useCallback(
    (e) => {
      const position = getRelativePosition(e, e.currentTarget);
      addBurst(position.x, position.y);
      onDoubleTap?.(position);
    },
    [onDoubleTap],
  );

  return {
    bursts, // Array of active heart bursts to render
    handlers: {
      onTouchEnd: handleTouchEnd,
      onDoubleClick: handleDoubleClick,
    },
  };
};

export default useDoubleTap;
