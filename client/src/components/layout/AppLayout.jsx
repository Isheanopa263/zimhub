import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import Header from "./Header";
import RightSidebar from "./RightSidebar";
import useUIStore from "../../store/uiStore";
import api from "../../api/axios";

/* ─── Custom hook — window width ───────────────────────────────────────────── */
const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
};

/* ─── App Layout ────────────────────────────────────────────────────────────── */
const AppLayout = () => {
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const showRightSidebar = width >= 1280;

  const [unreadNotifications, setUnreadNotifications] = useState(0);

  /* Fetch unread notification count */
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get("/notifications/unread-count");
        setUnreadNotifications(res.data?.data?.count || 0);
      } catch {
        // Non-critical
      }
    };

    fetchUnread();

    // Poll every 60 seconds
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F8FAFC",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* ── Desktop Left Sidebar ── */}
      {!isMobile && <Sidebar unreadNotifications={unreadNotifications} />}

      {/* ── Main Content Area ── */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          maxWidth: isDesktop ? "680px" : "100%",
          margin: isDesktop ? "0 auto" : "0",
          width: "100%",
        }}
      >
        {/* Mobile header */}
        {isMobile && <Header unreadNotifications={unreadNotifications} />}

        {/* Page content */}
        <div
          style={{
            flex: 1,
            padding: isMobile ? "0 0 80px" : "20px 16px",
            width: "100%",
          }}
        >
          <Outlet />
        </div>
      </main>

      {/* ── Desktop Right Sidebar ── */}
      {showRightSidebar && <RightSidebar />}

      {/* ── Mobile Bottom Nav ── */}
      {isMobile && <BottomNav unreadNotifications={unreadNotifications} />}
    </div>
  );
};

export default AppLayout;
