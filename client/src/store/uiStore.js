import { create } from "zustand";

/**
 * UI state store
 * Handles sidebar, modals, and global UI state
 */
const useUIStore = create((set) => ({
  // Mobile sidebar open state
  isMobileSidebarOpen: false,

  // Create post modal
  isCreatePostOpen: false,

  // Active modal
  activeModal: null,

  // Actions
  openMobileSidebar: () => set({ isMobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
  toggleMobileSidebar: () =>
    set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),

  openCreatePost: () => set({ isCreatePostOpen: true }),
  closeCreatePost: () => set({ isCreatePostOpen: false }),

  setActiveModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
}));

export default useUIStore;
