import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface TopbarProps {
  onToggleMobileSidebar?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileSidebar }) => {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificacoesAberto, setNotificacoesAberto] = useState(false);

  return (
    <header className="topbar" style={{ position: "relative", zIndex: 10000 }}>
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
          onClick={() => setNotificacoesAberto(true)}
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
                width: "max-content",
                minWidth: "max-content",
                maxWidth: "none",
                zIndex: 50,
              }}
            >
              {/* E-mail do usuário */}
              <div
                style={{
                  padding: "10px 16px",
                  fontSize: "12px",
                  color: "#64748b",
                  whiteSpace: "nowrap",
                  width: "max-content",
                  minWidth: "100%",
                  boxSizing: "border-box",
                }}
              >
                {user?.email}
              </div>
            </div>
          )}
        </div>
      </div>
      {notificacoesAberto && (
        <div
          style={{
            position: "fixed",
            top: "70px",
            right: "20px",
            width: "360px",
            maxHeight: "450px",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
            border: "1px solid #e2e8f0",
            zIndex: 9999,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding: "16px 18px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <strong
              style={{
                color: "#123b82",
                fontSize: "16px",
              }}
            >
              Notificações
            </strong>

            <button
              type="button"
              onClick={() => setNotificacoesAberto(false)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: "18px",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          <div style={{ padding: "8px 0" }}>
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <strong style={{ color: "#123b82" }}>
                ⚠️ Você recebeu uma advertência
              </strong>

              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "13px",
                  color: "#64748b",
                }}
              >
                Uma denúncia relacionada a uma de suas ideias foi analisada.
              </p>
            </div>

            <div
              style={{
                padding: "14px 18px",
              }}
            >
              <strong style={{ color: "#123b82" }}>
                👋 Bem-vindo ao IdeiaFutura!
              </strong>

              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "13px",
                  color: "#64748b",
                }}
              >
                Explore ideias e participe da comunidade.
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
