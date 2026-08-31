import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { fetchApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Ideia } from "../types";

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
  const [loading, setLoading] = useState(true);

  // Estado do Modal de Edição de Perfil
  const [modalOpen, setModalOpen] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const carregarPerfil = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [statsData, ideiasData] = await Promise.all([
        fetchApi<UserStats>("/usuarios/me/stats").catch(() => ({
          ideias_count: 0,
          comentarios_count: 0,
          visualizacoes_count: 0,
        })),
        fetchApi<Ideia[]>(`/usuarios/${user.id}/ideias`).catch(() => []),
      ]);

      setStats(statsData);
      setMinhasIdeias(Array.isArray(ideiasData) ? ideiasData : []);
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
      setModalOpen(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    try {
      await fetchApi(`/usuarios/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ nome: editNome, email: editEmail }),
      });
      await refreshUser();
      setModalOpen(false);
      showToast("Perfil atualizado com sucesso!", "success");
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

        {/* Seção Minhas Ideias Publicadas */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "14px", color: "#1e3a8a", margin: 0 }}>
            Minhas ideias publicadas
          </h3>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "1.5rem", color: "#07327c" }}></i>
          </div>
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
                style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#64748b" }}
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
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
