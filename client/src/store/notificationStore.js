import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Global notification state
 * - unreadCount: number of unread notifications
 * - lastPolledAt: timestamp of last poll (used for /poll endpoint)
 * - recentNotifications: cache of latest notifications for quick display
 */
const useNotificationStore = create(
  persist(
    (set, get) => ({
      unreadCount: 0,
      lastPolledAt: null,
      recentNotifications: [],

      setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),

      incrementUnread: (by = 1) =>
        set((state) => ({ unreadCount: state.unreadCount + by })),

      decrementUnread: (by = 1) =>
        set((state) => ({ unreadCount: Math.max(0, state.unreadCount - by) })),

      resetUnread: () => set({ unreadCount: 0 }),

      setLastPolledAt: (timestamp) => set({ lastPolledAt: timestamp }),

      addRecentNotifications: (newOnes) => {
        if (!newOnes?.length) return;
        set((state) => ({
          recentNotifications: [...newOnes, ...state.recentNotifications].slice(
            0,
            20,
          ), // keep last 20
        }));
      },

      clearRecent: () => set({ recentNotifications: [] }),
    }),
    {
      name: "zimhub-notifications",
      partialize: (state) => ({
        unreadCount: state.unreadCount,
        lastPolledAt: state.lastPolledAt,
      }),
    },
  ),
);

export default useNotificationStore;
