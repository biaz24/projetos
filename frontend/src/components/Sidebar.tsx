import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { logout } = useAuth();

  return (
    <>
      {/* Overlay para Mobile */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 99,
          }}
        />
      )}

      <aside
        className={`sidebar ${mobileOpen ? "mobile-active" : ""}`}
        style={{
          zIndex: 100,
          position: mobileOpen ? "fixed" : undefined,
          left: mobileOpen ? 0 : undefined,
          top: mobileOpen ? 0 : undefined,
          height: "100vh",
          transition: "transform 0.3s ease",
        }}
      >
        <div className="logo" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <i className="fa-regular fa-lightbulb"></i>
            <span>IdeiaFutura</span>
          </div>
          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              style={{
                background: "none",
                border: "none",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        <nav className="menu">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }
            onClick={onCloseMobile}
          >
            <i className="fa-solid fa-house"></i>
            <span>Início</span>
          </NavLink>

          <NavLink
            to="/salvos"
            className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }
            onClick={onCloseMobile}
          >
            <i className="fa-solid fa-bookmark"></i>
            <span>Salvos</span>
          </NavLink>

          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }
            onClick={onCloseMobile}
          >
            <i className="fa-solid fa-user"></i>
            <span>Meu perfil</span>
          </NavLink>

          <NavLink
            to="/rascunhos"
            className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }
            onClick={onCloseMobile}
          >
            <i className="fa-solid fa-file-lines"></i>
            <span>Rascunhos</span>
          </NavLink>
        </nav>

        <button
          onClick={logout}
          className="logout"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
          }}
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          <span>Sair</span>
        </button>
      </aside>
    </>
  );
};
