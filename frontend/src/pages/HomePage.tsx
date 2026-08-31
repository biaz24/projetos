import React, { useState, useEffect } from "react";
import { AppLayout } from "../components/AppLayout";
import { IdeaCard } from "../components/IdeaCard";
import { EmptyState } from "../components/EmptyState";
import { fetchApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Ideia, PaginatedIdeias } from "../types";

const CATEGORIES_OPTIONS = [
  "Todas",
  "Tecnologia",
  "Games",
  "Sustentabilidade",
  "Educação",
  "Utilitários",
  "Geral",
];

const STATUS_OPTIONS = ["Todos", "Disponível", "Em desenvolvimento", "Concluída"];

export const HomePage: React.FC = () => {
  const { showToast } = useToast();
  const [ideias, setIdeias] = useState<Ideia[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Filtros e Busca
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Todos");

  // Estados de Paginação
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Estados do Modal de Criar Nova Ideia
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Geral");
  const [status, setStatus] = useState("Disponível");
  const [anonimo, setAnonimo] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Debounce na busca por texto
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const carregarIdeias = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "10");
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());
      if (categoriaFilter !== "Todas") params.append("categoria", categoriaFilter);
      if (statusFilter !== "Todos") params.append("status", statusFilter);

      const res = await fetchApi<PaginatedIdeias | Ideia[]>(`/ideias?${params.toString()}`);

      if (res && "ideias" in res) {
        setIdeias(res.ideias);
        setTotalPages(res.totalPages);
        setTotalCount(res.total);
      } else if (Array.isArray(res)) {
        setIdeias(res);
        setTotalPages(1);
        setTotalCount(res.length);
      }
    } catch (err) {
      console.error("Erro ao carregar feed:", err);
      showToast("Erro ao carregar feed de ideias", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarIdeias();
  }, [page, debouncedSearch, categoriaFilter, statusFilter]);

  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategoriaFilter("Todas");
    setStatusFilter("Todos");
    setPage(1);
  };

  const handleOpenModal = () => {
    setTitulo("");
    setDescricao("");
    setCategoria("Geral");
    setStatus("Disponível");
    setAnonimo(false);
    setIsModalOpen(true);
  };

  const handlePublicarIdeia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      showToast("Por favor, digite a descrição da sua ideia.", "error");
      return;
    }

    setSubmitting(true);

    try {
      await fetchApi("/ideias", {
        method: "POST",
        body: JSON.stringify({
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          categoria,
          status,
          anonimo: anonimo ? 1 : 0,
        }),
      });

      showToast("Ideia publicada com sucesso!", "success");
      setIsModalOpen(false);
      await carregarIdeias();
    } catch (err: any) {
      showToast(err.message || "Erro ao publicar a ideia.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <section className="content">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1>Início</h1>
            <p className="description" style={{ margin: 0 }}>
              Explore ideias abandonadas e compartilhe novos projetos com a comunidade.
            </p>
          </div>

          <button
            onClick={handleOpenModal}
            style={{
              background: "#07327c",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "10px 18px",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 6px rgba(7, 50, 124, 0.2)",
            }}
          >
            <i className="fa-solid fa-plus"></i>
            Publicar Nova Ideia
          </button>
        </div>

        {/* Barra de Pesquisa e Filtros Combinados */}
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            border: "1px solid #e6eaf0",
            padding: "16px",
            marginBottom: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {/* Campo de Pesquisa */}
            <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
              <i
                className="fa-solid fa-magnifying-glass"
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  fontSize: "12px",
                }}
              ></i>
              <input
                type="text"
                placeholder="Pesquisar por título ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 34px",
                  fontSize: "12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  outline: "none",
                }}
              />
            </div>

            {/* Filtro por Categoria */}
            <select
              value={categoriaFilter}
              onChange={(e) => {
                setCategoriaFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "9px 12px",
                fontSize: "12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                outline: "none",
                background: "white",
                color: "#1e3a8a",
                fontWeight: "bold",
              }}
            >
              {CATEGORIES_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  Categoria: {cat}
                </option>
              ))}
            </select>

            {/* Filtro por Status */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "9px 12px",
                fontSize: "12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                outline: "none",
                background: "white",
                color: "#1e3a8a",
                fontWeight: "bold",
              }}
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  Status: {st}
                </option>
              ))}
            </select>

            {/* Botão Limpar Filtros */}
            {(debouncedSearch || categoriaFilter !== "Todas" || statusFilter !== "Todos") && (
              <button
                type="button"
                onClick={handleClearFilters}
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px 14px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Feed de Ideias */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h2 style={{ fontSize: "15px", color: "#1e3a8a", margin: 0 }}>
            Feed de Ideias {totalCount > 0 && `(${totalCount})`}
          </h2>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "1.8rem", color: "#07327c" }}></i>
          </div>
        ) : ideias.length === 0 ? (
          <EmptyState
            icon="fa-regular fa-lightbulb"
            title="Nenhuma ideia encontrada"
            description="Tente ajustar os termos da busca ou os filtros de categoria e status."
          />
        ) : (
          <div>
            {ideias.map((ideia) => (
              <IdeaCard key={ideia.ID} ideia={ideia} />
            ))}

            {/* Controles de Paginação */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "24px",
                }}
              >
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    background: page === 1 ? "#f1f5f9" : "#07327c",
                    color: page === 1 ? "#94a3b8" : "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  <i className="fa-solid fa-chevron-left" style={{ marginRight: "4px" }}></i>
                  Anterior
                </button>

                <span style={{ fontSize: "12px", color: "#475569", fontWeight: "bold" }}>
                  Página {page} de {totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    background: page === totalPages ? "#f1f5f9" : "#07327c",
                    color: page === totalPages ? "#94a3b8" : "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Próxima
                  <i className="fa-solid fa-chevron-right" style={{ marginLeft: "4px" }}></i>
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Modal de Publicação de Nova Ideia */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
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
              borderRadius: "14px",
              padding: "24px",
              maxWidth: "540px",
              width: "100%",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ fontSize: "16px", color: "#1e3a8a", margin: 0 }}>
                Publicar Nova Ideia
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handlePublicarIdeia}>
              <label style={{ fontSize: "12px", color: "#1e3a8a", fontWeight: "bold", display: "block", marginBottom: "6px" }}>
                Título da ideia (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Plataforma de Reciclagem de Eletrônicos"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  marginBottom: "16px",
                  outline: "none",
                }}
              />

              {/* Seletor de Categoria */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", color: "#1e3a8a", fontWeight: "bold", display: "block", marginBottom: "6px" }}>
                    Categoria
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      outline: "none",
                    }}
                  >
                    {CATEGORIES_OPTIONS.filter((c) => c !== "Todas").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seletor de Status */}
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", color: "#1e3a8a", fontWeight: "bold", display: "block", marginBottom: "6px" }}>
                    Status Inicial
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      outline: "none",
                    }}
                  >
                    {STATUS_OPTIONS.filter((s) => s !== "Todos").map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "12px", color: "#1e3a8a", fontWeight: "bold" }}>
                  Descrição da ideia *
                </label>
                <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                  {descricao.length}/5000
                </span>
              </div>

              <textarea
                placeholder="Digite os detalhes da sua ideia abandonada..."
                value={descricao}
                maxLength={5000}
                onChange={(e) => setDescricao(e.target.value)}
                required
                style={{
                  width: "100%",
                  height: "120px",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  resize: "vertical",
                  marginBottom: "16px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />

              {/* Opções de Visibilidade */}
              <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px" }}>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "#475569", display: "block", marginBottom: "8px" }}>
                  Visibilidade do Autor:
                </span>

                <div style={{ display: "flex", gap: "20px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#1e3a8a", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="anonimoModal"
                      checked={!anonimo}
                      onChange={() => setAnonimo(false)}
                    />
                    Público (com seu nome)
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#1e3a8a", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="anonimoModal"
                      checked={anonimo}
                      onChange={() => setAnonimo(true)}
                    />
                    Anônimo
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: "#07327c",
                    color: "white",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <i className="fa-solid fa-paper-plane"></i>
                  {submitting ? "Publicando..." : "Publicar Ideia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
