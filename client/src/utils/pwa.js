/**
 * Register the service worker on app start
 * Returns the registration or null
 */
export const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) {
    console.debug("Service workers not supported");
    return null;
  }

  // Only register in production OR if explicitly enabled
  if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_SW) {
    console.debug("SW disabled in dev");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    // Auto-update check every hour
    setInterval(
      () => {
        registration.update();
      },
      60 * 60 * 1000,
    );

    // Listen for updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
        }
      });
    });

    return registration;
  } catch (err) {
    console.error("[PWA] Registration failed:", err);
    return null;
  }
};

/**
 * Request browser notification permission
 */
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return "unsupported";

  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return "denied";
  }
};

/**
 * Check if app is running in standalone mode (installed as PWA)
 */
export const isStandalone = () => {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
};

/**
 * Detect online/offline status
 */
export const watchConnectivity = (onChange) => {
  const update = () => onChange?.(navigator.onLine);

  window.addEventListener("online", update);
  window.addEventListener("offline", update);

  return () => {
    window.removeEventListener("online", update);
    window.removeEventListener("offline", update);
  };
};
