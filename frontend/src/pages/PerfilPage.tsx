import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { StatCard } from "../components/StatCard";
import { SeletorTema } from "../components/SeletorTema";
import { SegurancaConta } from "../components/SegurancaConta";
import { EmptyState } from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { fetchApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Ideia } from "../types";
import { useDestaque } from "../utils/destaque";

interface UserStats {
  ideias_count: number;
  comentarios_count: number;
  visualizacoes_count: number;
}

export const PerfilPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState<UserStats>({
    ideias_count: 0,
    comentarios_count: 0,
    visualizacoes_count: 0,
  });
  const [minhasIdeias, setMinhasIdeias] = useState<Ideia[]>([]);
  const [ideiasOcultas, setIdeiasOcultas] = useState<Ideia[]>([]);

  // A opção escolhida fica na URL (?aba=ocultas): é assim que o sininho leva
  // o usuário direto para "Minhas ideias ocultadas".
  const [searchParams, setSearchParams] = useSearchParams();
  const visao = searchParams.get("aba") === "ocultas" ? "ocultas" : "publicadas";

  const trocarVisao = (nova: string) => {
    setSearchParams(nova === "ocultas" ? { aba: "ocultas" } : {}, {
      replace: true,
    });
  };
  const [loading, setLoading] = useState(true);

  // Vindo do sininho: a ideia ocultada pisca quando a lista carregar
  useDestaque(!loading && visao === "ocultas");

  // Estado do Modal de Edição de Perfil
  const [modalOpen, setModalOpen] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSenhaAtual, setEditSenhaAtual] = useState("");
  const [saving, setSaving] = useState(false);

  const carregarPerfil = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [statsData, ideiasData, ocultasData] = await Promise.all([
        fetchApi<UserStats>("/usuarios/me/stats").catch(() => ({
          ideias_count: 0,
          comentarios_count: 0,
          visualizacoes_count: 0,
        })),
        fetchApi<Ideia[]>(`/usuarios/${user.id}/ideias`).catch(() => []),
        fetchApi<Ideia[]>("/usuarios/me/ideias-ocultas").catch(() => []),
      ]);

      setStats(statsData);
      setMinhasIdeias(Array.isArray(ideiasData) ? ideiasData : []);
      setIdeiasOcultas(Array.isArray(ocultasData) ? ocultasData : []);
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
      showToast("Erro ao carregar perfil", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPerfil();
  }, [user]);

  const handleOpenEditModal = () => {
    if (user) {
      setEditNome(user.nome);
      setEditEmail(user.email);
      setEditSenhaAtual("");
      setModalOpen(true);
    }
  };

  // Trocar o e-mail exige a senha atual (segurança da conta).
  const emailMudou =
    Boolean(user) && editEmail.trim().toLowerCase() !== String(user?.email ?? "").trim().toLowerCase();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    try {
      const resposta = await fetchApi<{ emailPendente?: string | null }>(`/usuarios/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({
          nome: editNome,
          email: editEmail,
          senhaAtual: emailMudou ? editSenhaAtual : undefined,
        }),
      });
      await refreshUser();
      setModalOpen(false);
      if (resposta.emailPendente) {
        showToast(
          `Enviamos um link para ${resposta.emailPendente}. O e-mail só muda depois que você confirmar.`,
          "info",
        );
      } else {
        showToast("Perfil atualizado com sucesso!", "success");
      }
    } catch (err: any) {
      showToast(err.message || "Erro ao atualizar perfil", "error");
    } finally {
      setSaving(false);
    }
  };

  const formatData = (dateString?: string) => {
    if (!dateString) return "Publicado recentemente";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Publicado recentemente";
    return `Publicado em ${date.toLocaleDateString("pt-BR")}`;
  };

  const formatMemberDate = (dateString?: string) => {
    if (!dateString) return "Membro recente";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Membro recente";
    return `Membro desde ${date.toLocaleDateString("pt-BR")}`;
  };

  const userCreatedAt = (user as any)?.created_at || (user as any)?.CREATED_AT;

  return (
    <AppLayout>
      <section className="content">
        <h1>Meu perfil</h1>
        <p className="description">
          Gerencie suas informações e acompanhe suas ideias.
        </p>

        {/* Card do Cabeçalho do Perfil */}
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            border: "1px solid #e6eaf0",
            padding: "24px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                position: "relative",
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#e2e8f0",
                color: "#1e3a8a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
              }}
            >
              <i className="fa-solid fa-user"></i>
              <div
                onClick={handleOpenEditModal}
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#07327c",
                  color: "white",
                  fontSize: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <i className="fa-solid fa-pencil"></i>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: "18px", color: "#1e3a8a", margin: "0 0 4px 0" }}>
                {user?.nome || "Usuário"}
              </h2>
              <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 6px 0" }}>
                {user?.email}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "#94a3b8" }}>
                <i className="fa-regular fa-calendar"></i>
                <span>{formatMemberDate(userCreatedAt)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenEditModal}
            style={{
              background: "white",
              border: "1px solid #1e3a8a",
              color: "#1e3a8a",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "bold",
              width: "auto",
              height: "auto",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <i className="fa-solid fa-pen-to-square"></i>
            Editar perfil
          </button>
        </div>

        <SeletorTema />

        <SegurancaConta />

        {/* Seção Minhas Estatísticas */}
        <h3 style={{ fontSize: "14px", color: "#1e3a8a", marginBottom: "12px" }}>
          Minhas estatísticas
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "30px",
          }}
        >
          <StatCard
            icon="fa-regular fa-lightbulb"
            iconBg="#dbeafe"
            iconColor="#1e40af"
            title="Ideias publicadas"
            value={stats.ideias_count}
          />
          <StatCard
            icon="fa-regular fa-comment"
            iconBg="#f3e8ff"
            iconColor="#6b21a8"
            title="Comentários"
            value={stats.comentarios_count}
          />
          <StatCard
            icon="fa-regular fa-eye"
            iconBg="#fef9c3"
            iconColor="#854d0e"
            title="Visualizações"
            value={stats.visualizacoes_count.toLocaleString()}
          />
        </div>

        {/* Seção Minhas Ideias (publicadas / ocultadas) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", gap: "12px", flexWrap: "wrap" }}>
          <label htmlFor="visao-ideias" style={{ fontSize: "14px", color: "#1e3a8a", fontWeight: "bold" }}>
            Minhas ideias
          </label>

          <select
            id="visao-ideias"
            value={visao}
            onChange={(e) => trocarVisao(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "white",
              color: "#1e3a8a",
              fontWeight: "bold",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <option value="publicadas">
              Minhas ideias publicadas ({minhasIdeias.length})
            </option>
            <option value="ocultas">
              Minhas ideias ocultadas ({ideiasOcultas.length})
            </option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "1.5rem", color: "#07327c" }}></i>
          </div>
        ) : visao === "ocultas" ? (
          ideiasOcultas.length === 0 ? (
            <EmptyState
              icon="fa-regular fa-eye"
              title="Nenhuma ideia ocultada"
              description="Quando a moderação ocultar uma das suas ideias, ela aparece aqui para você reformular."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 4px" }}>
                Estas ideias não aparecem para outras pessoas. Reformule o
                conteúdo e reenvie para a revisão da moderação.
              </p>

              {ideiasOcultas.map((item) => {
                const emRevisao = item.VISIBILIDADE === "EmRevisao";

                return (
                  <div
                    key={item.ID}
                    data-destaque={`ideia-${item.ID}`}
                    style={{
                      background: "white",
                      border: `1px solid ${emRevisao ? "#bfdbfe" : "#fcd34d"}`,
                      borderRadius: "8px",
                      padding: "14px 18px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                      <h4 style={{ fontSize: "13px", color: "#1e3a8a", margin: 0 }}>
                        {item.TITULO}
                      </h4>
                      <span
                        style={{
                          background: emRevisao ? "#dbeafe" : "#fef3c7",
                          color: emRevisao ? "#1e40af" : "#92400e",
                          fontSize: "10px",
                          fontWeight: "bold",
                          padding: "2px 8px",
                          borderRadius: "10px",
                        }}
                      >
                        {emRevisao ? "Em revisão" : "Oculta pela moderação"}
                      </span>
                    </div>

                    {emRevisao ? (
                      <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 10px" }}>
                        Você reenviou esta ideia. Aguarde a decisão da
                        moderação; você será avisado pelo sininho.
                      </p>
                    ) : (
                      item.MOTIVO_MODERACAO && (
                        <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 10px", overflowWrap: "anywhere" }}>
                          <strong>Motivo da moderação:</strong> {item.MOTIVO_MODERACAO}
                        </p>
                      )
                    )}

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {!emRevisao && (
                        <button
                          type="button"
                          onClick={() => navigate(`/ideia/${item.ID}?reformular=1`)}
                          style={{
                            padding: "8px 14px",
                            border: "none",
                            borderRadius: "8px",
                            background: "#07327c",
                            color: "white",
                            fontSize: "12px",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          Reformular
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => navigate(`/ideia/${item.ID}`)}
                        style={{
                          padding: "8px 14px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          background: "white",
                          color: "#334155",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        Ver ideia
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : minhasIdeias.length === 0 ? (
          <EmptyState
            icon="fa-regular fa-lightbulb"
            title="Você ainda não publicou ideias"
            description="Compartilhe suas ideias esquecidas na aba Início para que a comunidade possa ajudar!"
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {minhasIdeias.map((item) => (
              <div
                key={item.ID}
                onClick={() => navigate(`/ideia/${item.ID}`)}
                style={{
                  background: "white",
                  border: "1px solid #e6eaf0",
                  borderRadius: "8px",
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <h4 style={{ fontSize: "13px", color: "#1e3a8a", margin: 0 }}>
                      {item.TITULO}
                    </h4>
                    <span
                      style={{
                        background: "#dbeafe",
                        color: "#1e40af",
                        fontSize: "9px",
                        fontWeight: "bold",
                        padding: "2px 6px",
                        borderRadius: "10px",
                      }}
                    >
                      {item.CATEGORIA || "Geral"}
                    </span>
                    <span
                      style={{
                        background: "#fef3c7",
                        color: "#92400e",
                        fontSize: "9px",
                        fontWeight: "bold",
                        padding: "2px 6px",
                        borderRadius: "10px",
                      }}
                    >
                      {item.STATUS || "Disponível"}
                    </span>
                  </div>

                  <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                    {formatData(item.CREATED_AT)}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: "11px", color: "#64748b" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <i className="fa-regular fa-comment"></i>
                    <span>{item.comentarios_count || 0}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <i className="fa-regular fa-eye"></i>
                    <span>{item.visualizacoes_count || 1}</span>
                  </div>
                  <i className="fa-solid fa-chevron-right" style={{ color: "#94a3b8", fontSize: "10px" }}></i>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal de Edição de Perfil */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          data-esc="global"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", color: "#1e3a8a", margin: 0 }}>Editar Perfil</h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#64748b", width: "auto", height: "auto", padding: "4px" }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <label style={{ fontSize: "12px", color: "#1e3a8a", fontWeight: "bold", display: "block", marginBottom: "6px" }}>
                Nome de usuário
              </label>
              <input
                type="text"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  fontSize: "13px",
                  marginBottom: "16px",
                  outline: "none",
                }}
              />

              <label style={{ fontSize: "12px", color: "#1e3a8a", fontWeight: "bold", display: "block", marginBottom: "6px" }}>
                E-mail
              </label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  fontSize: "13px",
                  marginBottom: "20px",
                  outline: "none",
                }}
              />

              {emailMudou && (
                <>
                  <label style={{ fontSize: "12px", color: "#1e3a8a", fontWeight: "bold", display: "block", marginBottom: "6px" }}>
                    Sua senha atual (para trocar o e-mail). Enviaremos um link de confirmação ao novo endereço.
                  </label>
                  <input
                    type="password"
                    value={editSenhaAtual}
                    onChange={(e) => setEditSenhaAtual(e.target.value)}
                    required
                    autoComplete="current-password"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      fontSize: "13px",
                      marginBottom: "20px",
                      outline: "none",
                    }}
                  />
                </>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    width: "auto",
                    height: "auto",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: "#07327c",
                    color: "white",
                    width: "auto",
                    height: "auto",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
