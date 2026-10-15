import React, { useState } from "react";
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
  const { logout, user } = useAuth();

  // Controla a abertura e o fechamento do modal
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  // Executa o logout após a confirmação
  const handleLogout = () => {
    setConfirmarSaida(false);
    logout();
  };

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

      {/* Barra lateral */}
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
        {/* Logo */}
        <div
          className="logo"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <i className="fa-regular fa-lightbulb"></i>
            <span>IdeiaFutura</span>
          </div>

          {/* Botão para fechar o menu no celular */}
          {mobileOpen && (
            <button
              type="button"
              onClick={onCloseMobile}
              style={{
                background: "none",
                border: "none",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
              }}
              aria-label="Fechar menu"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        {/* Menu de navegação */}
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
            to="/meus-rascunhos"
            className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }
            onClick={onCloseMobile}
          >
            <i className="fa-solid fa-file-lines"></i>
            <span>Rascunhos</span>
          </NavLink>

          {/* Denúncias: disponível somente para administradores */}
          {user?.tipo === "admin" && (
            <NavLink
              to="/admin/denuncias"
              className={({ isActive }) =>
                `menu-item ${isActive ? "active" : ""}`
              }
              onClick={onCloseMobile}
            >
              <i className="fa-solid fa-shield-halved"></i>
              <span>Denúncias</span>
            </NavLink>
          )}
        </nav>

        {/* Botão Sair: abre a confirmação */}
        <button
          type="button"
          onClick={() => setConfirmarSaida(true)}
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

      {/* Modal de confirmação de saída */}
      {confirmarSaida && (
        <div
          className="logout-modal-overlay"
          onClick={() => setConfirmarSaida(false)}
        >
          <div
            className="logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            aria-describedby="logout-modal-description"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão para fechar o modal */}
            <button
              type="button"
              className="logout-modal-close"
              onClick={() => setConfirmarSaida(false)}
              aria-label="Fechar confirmação"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            {/* Ícone */}
            <div className="logout-modal-icon">
              <i className="fa-solid fa-right-from-bracket"></i>
            </div>

            {/* Título */}
            <h2 id="logout-modal-title">Deseja sair da sua conta?</h2>

            {/* Mensagem */}
            <p id="logout-modal-description">
              Tem certeza de que deseja sair do IdeiaFutura? Você precisará
              fazer login novamente para acessar sua conta.
            </p>

            {/* Botões de ação */}
            <div className="logout-modal-actions">
              <button
                type="button"
                className="logout-modal-cancel"
                onClick={() => setConfirmarSaida(false)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="logout-modal-confirm"
                onClick={handleLogout}
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                Sim, quero sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
