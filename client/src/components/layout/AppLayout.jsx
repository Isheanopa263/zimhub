import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import Header from "./Header";
import RightSidebar from "./RightSidebar";

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
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isDesktop = width >= 1024;
  const showRightSidebar = width >= 1280;

  const { c } = useTheme();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  useNotificationPolling();

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
          maxWidth: isDesktop ? "680px" : "100%",
          margin: isDesktop ? "0 auto" : "0",
          width: "100%",
        }}
      >
        {isMobile && <Header unreadNotifications={unreadCount} />}

        <div
          style={{
            flex: 1,
            padding: isMobile ? "0 16px 80px" : "20px 16px",
            width: "100%",
          }}
        >
          <Outlet />
        </div>
      </main>

      {showRightSidebar && <RightSidebar />}
      {isMobile && <BottomNav unreadNotifications={unreadCount} />}
    </div>
  );
};

export default AppLayout;
