import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchApi } from "../services/api";
import type { Notificacao } from "../types";
import { NotificacoesPainel } from "./NotificacoesPainel";

interface TopbarProps {
  desktopSidebarOpen: boolean;
  mobileSidebarOpen: boolean;
  onOpenSidebar: () => void;
}
const INTERVALO_ATUALIZACAO_MS = 60000;

// Ícone e cor de cada tipo de notificação
function aparenciaDoTipo(tipo: string): { icone: string; cor: string } {
  switch (tipo) {
    case "advertencia":
      return { icone: "fa-triangle-exclamation", cor: "#d97706" };
    case "ideia_ocultada":
      return { icone: "fa-eye-slash", cor: "#b45309" };
    case "ideia_removida":
      return { icone: "fa-trash", cor: "#b91c1c" };
    case "ideia_aprovada":
      return { icone: "fa-circle-check", cor: "#166534" };
    case "ideia_rejeitada":
      return { icone: "fa-circle-xmark", cor: "#b91c1c" };
    case "contato_pedido":
      return { icone: "fa-handshake", cor: "#07327c" };
    case "contato_aceito":
      return { icone: "fa-comments", cor: "#166534" };
    case "contato_recusado":
    case "contato_encerrado":
      return { icone: "fa-comment-slash", cor: "#64748b" };
    default:
      return { icone: "fa-bell", cor: "#123b82" };
  }
}

function tempoRelativo(data?: string): string {
  if (!data) return "";

  const momento = new Date(data).getTime();
  if (Number.isNaN(momento)) return "";

  const minutos = Math.floor((Date.now() - momento) / 60000);

  if (minutos < 1) return "agora há pouco";
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias < 30) return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;

  return new Date(data).toLocaleDateString("pt-BR");
}
export const Topbar: React.FC<TopbarProps> = ({
  desktopSidebarOpen,
  mobileSidebarOpen,
  onOpenSidebar,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificacoesAberto, setNotificacoesAberto] = useState(false);

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [carregando, setCarregando] = useState(false);

  const logado = Boolean(user);

  const atualizarContador = useCallback(async () => {
    try {
      const resposta = await fetchApi<{ total: number }>(
        "/notificacoes/nao-lidas",
      );
      setNaoLidas(Number(resposta?.total) || 0);
    } catch {
      // O sininho é um recurso secundário: se falhar, só mantém o número anterior.
    }
  }, []);

  const carregarLista = useCallback(async () => {
    try {
      setCarregando(true);
      const lista = await fetchApi<Notificacao[]>("/notificacoes");
      setNotificacoes(Array.isArray(lista) ? lista : []);
    } catch {
      setNotificacoes([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Contador real: busca ao entrar e atualiza de tempos em tempos
  useEffect(() => {
    if (!logado) return undefined;

    atualizarContador();
    const intervalo = setInterval(atualizarContador, INTERVALO_ATUALIZACAO_MS);

    return () => clearInterval(intervalo);
  }, [logado, atualizarContador]);

  // Fecha a lista com a tecla Esc
  useEffect(() => {
    if (!notificacoesAberto) return undefined;

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setNotificacoesAberto(false);
    };

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [notificacoesAberto]);

  const alternarNotificacoes = () => {
    const abrir = !notificacoesAberto;
    setNotificacoesAberto(abrir);
    setDropdownOpen(false);

    if (abrir) {
      carregarLista();
      atualizarContador();
    }
  };

  const marcarComoLidaLocal = (id: number) => {
    setNotificacoes((atuais) =>
      atuais.map((n) => (n.ID === id ? { ...n, LIDA: 1 } : n)),
    );
  };

  const abrirNotificacao = async (notificacao: Notificacao) => {
    const jaLida = Boolean(notificacao.LIDA);

    if (!jaLida) {
      // Atualiza a tela na hora; se o servidor falhar, o contador real volta no próximo ciclo.
      marcarComoLidaLocal(notificacao.ID);
      setNaoLidas((total) => Math.max(0, total - 1));

      try {
        await fetchApi(`/notificacoes/${notificacao.ID}/lida`, {
          method: "PATCH",
        });
      } catch {
        atualizarContador();
      }
    }

    setNotificacoesAberto(false);

    // Cada notificação leva à página do assunto e faz o item correspondente piscar
    // (os nomes em "destaque" são os data-destaque das páginas; veja utils/destaque.ts).

    // Ideia ocultada/rejeitada: "Minhas ideias ocultadas" no perfil, piscando a ideia
    if (
      notificacao.TIPO === "ideia_ocultada" ||
      notificacao.TIPO === "ideia_rejeitada"
    ) {
      navigate("/perfil?aba=ocultas", {
        state: {
          destaque: notificacao.IDEIAS_ID
            ? [`ideia-${notificacao.IDEIAS_ID}`]
            : [],
        },
      });
      return;
    }

    // Pedido de contato / conversa: abre a conversa certa e pisca o que pede atenção
    if (notificacao.TIPO.startsWith("contato_")) {
      if (!notificacao.CONTATO_ID) {
        navigate("/conversas");
        return;
      }

      const conversa = `conversa-${notificacao.CONTATO_ID}`;
      const alvo =
        notificacao.TIPO === "contato_aceito" ? "composer" : "decisao";

      navigate(`/conversas?abrir=${notificacao.CONTATO_ID}`, {
        state: { destaque: [conversa, alvo] },
      });
      return;
    }

    // Ideia aprovada, advertência etc.: abre a ideia e pisca o cartão dela
    if (notificacao.IDEIAS_ID) {
      navigate(`/ideia/${notificacao.IDEIAS_ID}`, {
        state: { destaque: ["ideia"] },
      });
    }
  };

  const marcarTodasComoLidas = async () => {
    setNotificacoes((atuais) => atuais.map((n) => ({ ...n, LIDA: 1 })));
    setNaoLidas(0);

    try {
      await fetchApi("/notificacoes/lidas", { method: "PATCH" });
    } catch {
      atualizarContador();
    }
  };

  return (
    <header
      className="topbar"
      style={{ position: "sticky", top: 0, zIndex: 40 }}
    >
      {/* Botão para abrir a barra lateral */}
      <button
        type="button"
        onClick={onOpenSidebar}
        className={`mobile-toggle ${
          desktopSidebarOpen ? "desktop-sidebar-open" : ""
        } ${mobileSidebarOpen ? "mobile-sidebar-open" : ""}`}
        aria-label="Abrir menu"
        style={{
          display: desktopSidebarOpen ? "none" : "flex",
          width: "32px",
          minWidth: "32px",
          maxWidth: "32px",
          height: "32px",
          minHeight: "32px",
          flex: "0 0 32px",
          padding: 0,
          marginRight: "auto",
          background: "transparent",
          border: "none",
          boxShadow: "none",
          borderRadius: "6px",
          color: "#123b82",
          fontSize: "18px",
          cursor: "pointer",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <i className="fa-solid fa-bars"></i>
      </button>

      {/* Área direita: notificações e usuário */}
      <div className="topbar-right" style={{ marginLeft: "auto" }}>
        {/* Botão de notificações */}
        <button
          className="notification-button nt-sino"
          type="button"
          data-novas={naoLidas > 0}
          style={{ position: "relative" }}
          onClick={alternarNotificacoes}
          aria-label={
            naoLidas > 0
              ? `Notificações (${naoLidas} não lidas)`
              : "Notificações"
          }
        >
          <i className="fa-regular fa-bell"></i>

          {naoLidas > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-6px",
                right: "-8px",
                background: "#ef4444",
                color: "white",
                fontSize: "10px",
                fontWeight: "bold",
                borderRadius: "999px",
                minWidth: "16px",
                height: "16px",
                padding: "0 4px",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {naoLidas > 9 ? "9+" : naoLidas}
            </span>
          )}
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

      {/* Painel de notificações */}
      {notificacoesAberto && (
        <NotificacoesPainel
          notificacoes={notificacoes}
          carregando={carregando}
          naoLidas={naoLidas}
          aparencia={aparenciaDoTipo}
          tempo={tempoRelativo}
          aoAbrir={abrirNotificacao}
          aoMarcarTodas={marcarTodasComoLidas}
          aoFechar={() => setNotificacoesAberto(false)}
        />
      )}
    </header>
  );
};
