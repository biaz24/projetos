import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchApi } from "../services/api";

interface SidebarProps {
  desktopOpen: boolean;
  mobileOpen?: boolean;
  onCloseDesktop: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  desktopOpen,
  mobileOpen = false,
  onCloseDesktop,
  onCloseMobile,
}) => {
  const { logout, user } = useAuth();

  // Controla a abertura e o fechamento do modal
  const [confirmarSaida, setConfirmarSaida] = useState(false);

  // Mensagens de conversas ainda não lidas (número ao lado de "Conversas")
  const [conversasNaoLidas, setConversasNaoLidas] = useState(0);
  const logado = Boolean(user);

  const handleToggleSidebar = () => {
    if (mobileOpen) {
      onCloseMobile?.();
      return;
    }

    onCloseDesktop();
  };

  useEffect(() => {
    if (!logado) return undefined;

    let ativo = true;

    const buscar = async () => {
      try {
        const resposta = await fetchApi<{ total: number }>(
          "/contatos/nao-lidas",
        );
        if (ativo) setConversasNaoLidas(Number(resposta?.total) || 0);
      } catch {
        // recurso secundário: se falhar, mantém o número anterior
      }
    };

    buscar();
    const intervalo = setInterval(buscar, 30000);

    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [logado]);
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
        className={`sidebar ${desktopOpen ? "" : "desktop-hidden"} ${
          mobileOpen ? "mobile-active" : ""
        }`}
        style={{ zIndex: 100 }}
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
          {(desktopOpen || mobileOpen) && (
            <button
              type="button"
              onClick={handleToggleSidebar}
              className="sidebar-toggle"
              aria-label="Recolher menu lateral"
            >
              <i className="fa-solid fa-bars"></i>
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

          <NavLink
            to="/conversas"
            className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }
            onClick={onCloseMobile}
          >
            <i className="fa-solid fa-comments"></i>
            <span>Conversas</span>
            {conversasNaoLidas > 0 && (
              <span
                aria-label={`${conversasNaoLidas} mensagens não lidas`}
                style={{
                  marginLeft: "auto",
                  background: "#ef4444",
                  color: "white",
                  fontSize: "10px",
                  fontWeight: "bold",
                  borderRadius: "999px",
                  minWidth: "18px",
                  height: "18px",
                  padding: "0 5px",
                  boxSizing: "border-box",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {conversasNaoLidas > 9 ? "9+" : conversasNaoLidas}
              </span>
            )}
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
