import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface TopbarProps {
  onToggleMobileSidebar?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="topbar" style={{ position: "relative" }}>
      {/* Botão Hambúrguer para telas Mobile */}
      <button
        onClick={onToggleMobileSidebar}
        className="mobile-toggle"
        style={{
          display: "none", // Exibido via CSS media query
          background: "none",
          border: "none",
          color: "#123b82",
          fontSize: "18px",
          cursor: "pointer",
          marginRight: "auto",
        }}
      >
        <i className="fa-solid fa-bars"></i>
      </button>

      <div className="topbar-right" style={{ marginLeft: "auto" }}>
        {/* Botão de notificações */}
        <button
          className="notification-button"
          type="button"
          style={{ position: "relative" }}
        >
          <i className="fa-regular fa-bell"></i>
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-4px",
              background: "#ef4444",
              color: "white",
              fontSize: "8px",
              fontWeight: "bold",
              borderRadius: "50%",
              width: "12px",
              height: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            3
          </span>
        </button>

        {/* Usuário e Dropdown */}
        <div style={{ position: "relative" }}>
          <div
            className="user-area"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ cursor: "pointer", userSelect: "none" }}
          >
            <div className="user-icon">
              <i className="fa-solid fa-user"></i>
            </div>
            <span>{user?.nome || "Usuário"}</span>
            <i className="fa-solid fa-chevron-down"></i>
          </div>

          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "120%",
                background: "white",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                border: "1px solid #e2e8f0",
                padding: "8px 0",
                minWidth: "150px",
                zIndex: 50,
              }}
            >
              <div
                style={{
                  padding: "8px 16px",
                  fontSize: "11px",
                  color: "#64748b",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {user?.email}
              </div>
              <button
                onClick={logout}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  padding: "8px 16px",
                  fontSize: "12px",
                  color: "#ef4444",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
