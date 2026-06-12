import { useEffect, useRef } from "react";

import { notificationsApi } from "../api/endpoints/notifications.api";
import useAuthStore from "../store/authStore";
import useNotificationStore from "../store/notificationStore";
import {
  showNotificationToast,
  playNotificationSound,
} from "../utils/notificationToast.jsx";

const POLL_INTERVAL = 30 * 1000; // 30 seconds

/**
 * Polls the server every 30s for new notifications.
 * Shows toast alerts for new ones and updates the unread count globally.
 *
 * Should be mounted ONCE in AppLayout.
 */
const useNotificationPolling = () => {
  const { isAuthenticated, user } = useAuthStore();
  const {
    lastPolledAt,
    setLastPolledAt,
    setUnreadCount,
    addRecentNotifications,
  } = useNotificationStore();

  const intervalRef = useRef(null);
  const isPollingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      clearInterval(intervalRef.current);
      return;
    }

    const poll = async () => {
      if (isPollingRef.current) return;
      if (document.hidden) return;

      isPollingRef.current = true;

      try {
        const response = await notificationsApi.poll(lastPolledAt);
        const {
          newNotifications,
          unreadCount: serverCount,
          timestamp,
        } = response.data;

        // Update last polled timestamp
        setLastPolledAt(timestamp);

        // Sync unread count from server
        setUnreadCount(serverCount);

        // Show toasts for new notifications (but only after first poll)
        if (lastPolledAt && newNotifications?.length > 0) {
          addRecentNotifications(newNotifications);
          newNotifications.forEach((n) => showNotificationToast(n));
          playNotificationSound();
        }
      } catch (err) {
        // Silent fail — polling shouldn't bother the user
        console.debug("Polling error (silent):", err.message);
      } finally {
        isPollingRef.current = false;
      }
    };

    // Initial poll after 2 seconds
    const initialTimer = setTimeout(poll, 2000);

    // Then poll regularly
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    // Poll immediately when tab becomes visible
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
