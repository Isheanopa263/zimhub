import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import Header from "./Header";
import RightSidebar from "./RightSidebar";
import InstallPrompt from "../pwa/InstallPrompt";

import useTheme from "../../hooks/useTheme";
import useNotificationStore from "../../store/notificationStore";
import useNotificationPolling from "../../hooks/useNotificationPolling";

const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
};

const AppLayout = () => {
  const location = useLocation();
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isDesktop = width >= 1024;
  const showRightSidebar = width >= 1280;

  const { c } = useTheme();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  useNotificationPolling();

  // Special layout for feed page (full-screen immersive)
  const isFeed = location.pathname === "/feed";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: c.bg,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {!isMobile && <Sidebar unreadNotifications={unreadCount} />}

      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          // Feed gets more room since it's immersive
          maxWidth: isFeed
            ? isDesktop
              ? "540px"
              : "100%"
            : isDesktop
              ? "680px"
              : "100%",
          margin: isDesktop ? "0 auto" : "0",
          width: "100%",
        }}
      >
        {isMobile && <Header unreadNotifications={unreadCount} />}

        <div
          style={{
            flex: 1,
            padding: isFeed ? "0" : isMobile ? "0 16px 80px" : "20px 16px",
            width: "100%",
          }}
        >
          <Outlet />
        </div>
      </main>

      {/* Hide right sidebar on feed for more immersion */}
      {showRightSidebar && !isFeed && <RightSidebar />}
      {isMobile && <BottomNav unreadNotifications={unreadCount} />}

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
};

export default AppLayout;
