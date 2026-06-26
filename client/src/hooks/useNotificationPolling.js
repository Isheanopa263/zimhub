import { useEffect, useRef } from "react";

import { notificationsApi } from "../api/endpoints/notifications.api";
import useAuthStore from "../store/authStore";
import useNotificationStore from "../store/notificationStore";
import {
  showNotificationToast,
  playNotificationSound,
} from "../utils/notificationToast.jsx";

const POLL_INTERVAL = 30 * 1000;

/**
 * Polls for new notifications every 30s.
 *
 * Toasts shown only when:
 *  - Notification is unread
 *  - It was created AFTER the polling started this session
 *  - It hasn't been shown as a toast in this session
 */
const useNotificationPolling = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { setUnreadCount, addRecentNotifications } = useNotificationStore();

  const intervalRef = useRef(null);
  const isPollingRef = useRef(false);
  const shownToastsRef = useRef(new Set()); // Track IDs shown in this session
  const sessionStartRef = useRef(null); // When polling started

  useEffect(() => {
    if (!isAuthenticated || !user) {
      clearInterval(intervalRef.current);
      return;
    }

    // ── First-load behavior ──
    // Mark session start. Initial load is NOT a "new notification" — just sync the count.
    if (!sessionStartRef.current) {
      sessionStartRef.current = new Date().toISOString();
    }

    const poll = async () => {
      if (isPollingRef.current) return;
      if (document.hidden) return;

      isPollingRef.current = true;

      try {
        const response = await notificationsApi.poll(sessionStartRef.current);
        const { newNotifications, unreadCount: serverCount } = response.data;

        // Always sync the count
        setUnreadCount(serverCount);

        // Only show toasts for notifications that:
        //   1. Are unread (backend filters this)
        //   2. Haven't been shown this session
        if (newNotifications?.length > 0) {
          const trulyNew = newNotifications.filter(
            (n) => !shownToastsRef.current.has(n.id),
          );

          if (trulyNew.length > 0) {
            addRecentNotifications(trulyNew);

            trulyNew.forEach((n) => {
              shownToastsRef.current.add(n.id);
              showNotificationToast(n);
            });

            playNotificationSound();

            // Prevent the Set from growing unbounded
            if (shownToastsRef.current.size > 100) {
              const arr = Array.from(shownToastsRef.current);
              shownToastsRef.current = new Set(arr.slice(-50));
            }
          }
        }
      } catch {
        // Silent — polling failures shouldn't bother the user
      } finally {
        isPollingRef.current = false;
      }
    };

    // ── Initial unread count sync (no toasts) ──
    notificationsApi
      .getUnreadCount()
      .then((r) => setUnreadCount(r.data?.count || 0))
      .catch(() => {});

    // First poll after 5 seconds (gives user time to see the page)
    const initialTimer = setTimeout(poll, 5000);

    // Then poll regularly
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    // Poll when tab becomes visible
    const handleVisibility = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isAuthenticated, user?.id]);
};

export default useNotificationPolling;
