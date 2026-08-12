import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import useUIStore from "../store/uiStore";

/**
 * Global back button handler
 *
 * Priority order:
 * 1. If any modal/drawer is open → close it
 * 2. If not on /feed → navigate to /feed
 * 3. If on /feed → show "Press back again to exit" toast
 * 4. On second back press within 2s → exit app (or go back in history)
 */
const useBackHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isCreatePostOpen,
    closeCreatePost,
    isMobileSidebarOpen,
    closeMobileSidebar,
    activeModal,
    closeModal,
  } = useUIStore();

  const backPressCountRef = useRef(0);
  const backTimerRef = useRef(null);

  useEffect(() => {
    // Push a dummy state so the first back press triggers popstate
    // instead of leaving the app
    window.history.pushState({ zimhub: true }, "");

    const handlePopState = (event) => {
      // Immediately push another state to "capture" the back press
      window.history.pushState({ zimhub: true }, "");

      /* ── Priority 1: Close any open modal / drawer ── */
      if (isCreatePostOpen) {
        closeCreatePost();
        return;
      }

      if (isMobileSidebarOpen) {
        closeMobileSidebar();
        return;
      }

      if (activeModal) {
        closeModal();
        return;
      }

      // Check for CSS-based modals in the DOM
      // (CommentsDrawer, DeleteAccountModal, ChangePasswordModal, etc.)
      const openModal = document.querySelector("[data-modal-open='true']");
      if (openModal) {
        // Trigger close via custom event
        openModal.dispatchEvent(
          new CustomEvent("modal-close-request", { bubbles: true }),
        );
        return;
      }

      /* ── Priority 2: Not on /feed → go to /feed ── */
      if (location.pathname !== "/feed") {
        navigate("/feed");
        return;
      }

      /* ── Priority 3: On /feed → double-back to exit ── */
      backPressCountRef.current += 1;

      if (backPressCountRef.current === 1) {
        toast("Press back again to exit", {
          icon: "👋",
          duration: 2000,
          id: "back-exit-toast",
        });

        clearTimeout(backTimerRef.current);
        backTimerRef.current = setTimeout(() => {
          backPressCountRef.current = 0;
        }, 2000);
      } else if (backPressCountRef.current >= 2) {
        // Second press — try to exit
        clearTimeout(backTimerRef.current);
        backPressCountRef.current = 0;

        // For PWA / mobile — close the window if possible
        // For browser — go back in history (leaves the app)
        try {
          window.close();
        } catch {
          // Fallback: navigate back through history
          window.history.go(-2);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      clearTimeout(backTimerRef.current);
    };
  }, [
    location.pathname,
    isCreatePostOpen,
    closeCreatePost,
    isMobileSidebarOpen,
    closeMobileSidebar,
    activeModal,
    closeModal,
    navigate,
  ]);
};

export default useBackHandler;
