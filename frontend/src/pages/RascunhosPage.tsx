import React, { useState, useEffect } from "react";
import { AppLayout } from "../components/AppLayout";
import { EmptyState } from "../components/EmptyState";
import { fetchApi } from "../services/api";

interface Rascunho {
  ID: number;
  TITULO: string;
  DESCRICAO: string;
  UPDATED_AT: string;
}

const CATEGORIES = [
  { icon: "fa-solid fa-seedling", bg: "#dcfce7", color: "#166534" },
  { icon: "fa-solid fa-bus", bg: "#f3e8ff", color: "#6b21a8" },
  { icon: "fa-solid fa-droplet", bg: "#dbeafe", color: "#1e40af" },
  { icon: "fa-solid fa-book", bg: "#ffe4e6", color: "#9f1239" },
  { icon: "fa-solid fa-paw", bg: "#ffedd5", color: "#9a3412" },
];

export const RascunhosPage: React.FC = () => {
  const [rascunhos, setRascunhos] = useState<Rascunho[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Modal de Rascunho
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  const carregarRascunhos = async () => {
    try {
      setLoading(true);
      const data = await fetchApi<Rascunho[]>("/rascunhos");
      setRascunhos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao buscar rascunhos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarRascunhos();
  }, []);

  const handleOpenCreateModal = () => {
    setEditId(null);
    setTitulo("");
    setDescricao("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (rascunho: Rascunho) => {
    setEditId(rascunho.ID);
    setTitulo(rascunho.TITULO);
    setDescricao(rascunho.DESCRICAO);
    setModalOpen(true);
  };

  const handleSaveRascunho = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editId) {
        await fetchApi(`/rascunhos/${editId}`, {
          method: "PUT",
          body: JSON.stringify({ titulo, descricao }),
        });
      } else {
        await fetchApi("/rascunhos", {
          method: "POST",
          body: JSON.stringify({ titulo, descricao }),
        });
      }
      setModalOpen(false);
      await carregarRascunhos();
    } catch (err) {
      console.error("Erro ao salvar rascunho:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRascunho = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este rascunho?")) return;

    try {
      await fetchApi(`/rascunhos/${id}`, { method: "DELETE" });
      setRascunhos((prev) => prev.filter((r) => r.ID !== id));
    } catch (err) {
      console.error("Erro ao deletar rascunho:", err);
    }
  };

  const formatData = (dateString?: string) => {
    if (!dateString) return "Salvo recentemente";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Salvo recentemente";
    return `Salvo em ${date.toLocaleDateString("pt-BR")} às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <AppLayout>
      <section className="content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h1>Rascunhos</h1>
            <p className="description">
              Suas ideias salvas que ainda não foram publicadas.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            style={{
              background: "#07327c",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "10px 18px",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <i className="fa-solid fa-plus"></i>
            Nova ideia
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "1.5rem", color: "#07327c" }}></i>
          </div>
        ) : rascunhos.length === 0 ? (
          <EmptyState
            icon="fa-regular fa-file-lines"
            title="Nenhum rascunho salvo"
            description="Comece a rascunhar um projeto novo para desenvolver no seu ritmo!"
            actionText="+ Nova ideia"
            onAction={handleOpenCreateModal}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {rascunhos.map((item, idx) => {
              const category = CATEGORIES[idx % CATEGORIES.length];
              return (
                <div
                  key={item.ID}
                  style={{
                    background: "white",
                    borderRadius: "12px",
                    border: "1px solid #e6eaf0",
                    padding: "18px 22px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: "220px" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "10px",
                        background: category.bg,
                        color: category.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        flexShrink: 0,
                      }}
                    >
                      <i className={category.icon}></i>
                    </div>

                    <div>
                      <h3 style={{ fontSize: "14px", color: "#1e3a8a", margin: "0 0 4px 0" }}>
                        {item.TITULO}
                      </h3>
                      <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 6px 0", lineHeight: "1.4" }}>
                        {item.DESCRICAO}
                      </p>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                        {formatData(item.UPDATED_AT)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {/* Badge Em Edição */}
                    <span
                      style={{
                        background: "#fef3c7",
                        color: "#92400e",
                        fontSize: "10px",
                        fontWeight: "bold",
                        padding: "4px 10px",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <i className="fa-regular fa-clock" style={{ fontSize: "9px" }}></i>
                      Em edição
                    </span>

                    {/* Botões de Ação */}
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        fontSize: "14px",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                      title="Editar rascunho"
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>

                    <button
                      onClick={() => handleDeleteRascunho(item.ID)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        fontSize: "14px",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                      title="Excluir rascunho"
                    >
                      <i className="fa-regular fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Criar / Editar Rascunho */}
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
              maxWidth: "450px",
              width: "100%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", color: "#1e3a8a", margin: 0 }}>
                {editId ? "Editar Rascunho" : "Novo Rascunho"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#64748b" }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveRascunho}>
              <label style={{ fontSize: "12px", color: "#1e3a8a", fontWeight: "bold", display: "block", marginBottom: "6px" }}>
                Título do rascunho
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Transporte público sob demanda"
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
                Descrição do rascunho
              </label>
              <textarea
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva suas anotações ou detalhes sobre o projeto..."
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  fontSize: "12px",
                  marginBottom: "20px",
                  outline: "none",
                  resize: "vertical",
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
                  {saving ? "Salving..." : "Salvar rascunho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
