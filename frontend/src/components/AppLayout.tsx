import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import "../../css/home.css";
import "../../css/transicao.css";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const abrirSidebar = () => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      setMobileSidebarOpen(true);
    } else {
      setSidebarOpen(true);
    }
  };

  return (
    <div className="home-container">
      <Sidebar
        desktopOpen={sidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onCloseDesktop={() => setSidebarOpen(false)}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <main className="main-content" style={{ overflowY: "auto" }}>
        <Topbar
          desktopSidebarOpen={sidebarOpen}
          mobileSidebarOpen={mobileSidebarOpen}
          onOpenSidebar={abrirSidebar}
        />
        {children}
      </main>
    </div>
  );
};
