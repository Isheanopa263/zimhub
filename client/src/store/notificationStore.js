import { create } from "zustand";
import { persist } from "zustand/middleware";

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
          ),
        }));
      },

      clearRecent: () => set({ recentNotifications: [] }),
    }),
    {
      name: "zimhub-notifications",
      partialize: (state) => ({
        // Only persist unread count — NOT lastPolledAt
        // This way each session starts fresh
        unreadCount: state.unreadCount,
      }),
    },
  ),
);

export default useNotificationStore;
