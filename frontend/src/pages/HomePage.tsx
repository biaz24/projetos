import React, { useState, useEffect, useRef } from "react";
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

const STATUS_OPTIONS = [
  "Todos",
  "Disponível",
  "Em desenvolvimento",
  "Concluída",
];

const CATEGORIAS_ICONES = [
  "fa-layer-group",
  "fa-microchip",
  "fa-gamepad",
  "fa-leaf",
  "fa-graduation-cap",
  "fa-screwdriver-wrench",
  "fa-lightbulb",
];

const STATUS_ICONES = ["fa-list", "fa-circle-check", "fa-spinner", "fa-flag-checkered"];
const STATUS_CORES = ["#2563eb", "#16a34a", "#d97706", "#2563eb"];

interface SeletorFiltroProps {
  rotulo: string;
  aberto: boolean;
  aoAlternar: (abrir: boolean) => void;
  opcoes: string[];
  icones: string[];
  coresIcones?: string[];
  valor: string;
  iconeBotao: string;
  corIconeBotao: string;
  aoEscolher: (valor: string) => void;
}

/**
 * Select personalizado acessível: funciona com mouse e teclado.
 * Enter/Espaço/↓ abre; ↑ ↓ Home End navegam; Enter escolhe; Esc fecha e
 * devolve o foco ao botão; clicar fora fecha.
 */
const SeletorFiltro: React.FC<SeletorFiltroProps> = ({
  rotulo,
  aberto,
  aoAlternar,
  opcoes,
  icones,
  coresIcones,
  valor,
  iconeBotao,
  corIconeBotao,
  aoEscolher,
}) => {
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const itens = useRef<Array<HTMLButtonElement | null>>([]);

  // ao abrir, o foco vai para a opção escolhida
  useEffect(() => {
    if (!aberto) return undefined;
    const indice = Math.max(0, opcoes.indexOf(valor));
    itens.current[indice]?.focus();
    return undefined;
  }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps

  // clicar fora fecha
  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) aoAlternar(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps

  const mover = (de: number, passo: number) => {
    const total = opcoes.length;
    itens.current[(de + passo + total) % total]?.focus();
  };

  const aoTeclarNaLista = (e: React.KeyboardEvent, indice: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      mover(indice, 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      mover(indice, -1);
    } else if (e.key === "Home") {
      e.preventDefault();
      itens.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      itens.current[opcoes.length - 1]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      aoAlternar(false);
      botao.current?.focus();
    } else if (e.key === "Tab") {
      aoAlternar(false);
    }
  };

  return (
    <div ref={raiz} style={{ position: "relative", width: "220px", maxWidth: "100%", flexShrink: 0 }}>
      <button
        ref={botao}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={`${rotulo}: ${valor}`}
        onClick={() => aoAlternar(!aberto)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !aberto) {
            e.preventDefault();
            aoAlternar(true);
          }
        }}
        style={{
          width: "100%",
          height: "48px",
          padding: "0 14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          borderRadius: "12px",
          border: "1px solid #d7e3f4",
          background: aberto ? "#eff6ff" : "#ffffff",
          color: "#123b82",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 3px 10px rgba(7,50,124,0.06)",
          boxSizing: "border-box",
        }}
      >
        <i className={`fa-solid ${iconeBotao}`} style={{ color: corIconeBotao }} aria-hidden="true" />
        <span style={{ flex: 1, textAlign: "left" }}>{valor}</span>
        <i className={`fa-solid fa-chevron-${aberto ? "up" : "down"}`} aria-hidden="true" />
      </button>

      {aberto && (
        <div
          role="listbox"
          aria-label={rotulo}
          style={{
            position: "absolute",
            top: "54px",
            left: 0,
            width: "100%",
            padding: "6px",
            background: "#ffffff",
            border: "1px solid #dbeafe",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(7,50,124,0.14)",
            zIndex: 100,
            boxSizing: "border-box",
          }}
        >
          {opcoes.map((opcao, indice) => {
            const escolhida = valor === opcao;
            return (
              <button
                key={opcao}
                ref={(el) => {
                  itens.current[indice] = el;
                }}
                type="button"
                role="option"
                aria-selected={escolhida}
                onKeyDown={(e) => aoTeclarNaLista(e, indice)}
                onClick={() => {
                  aoEscolher(opcao);
                  aoAlternar(false);
                  botao.current?.focus();
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px",
                  border: "none",
                  borderRadius: "8px",
                  background: escolhida ? "#dbeafe" : "transparent",
                  color: escolhida ? "#1d4ed8" : "#334155",
                  fontSize: "13px",
                  fontWeight: escolhida ? 600 : 400,
                  textAlign: "left",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
                onMouseEnter={(e) => {
                  if (!escolhida) e.currentTarget.style.background = "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  if (!escolhida) e.currentTarget.style.background = "transparent";
                }}
              >
                <i
                  className={`fa-solid ${icones[indice] || "fa-lightbulb"}`}
                  style={{ width: "16px", color: coresIcones ? coresIcones[indice] : "#2563eb" }}
                  aria-hidden="true"
                />
                <span style={{ flex: 1 }}>{opcao}</span>
                {escolhida && <i className="fa-solid fa-check" style={{ color: "#2563eb" }} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const HomePage: React.FC = () => {
  const { showToast } = useToast();
  const [ideias, setIdeias] = useState<Ideia[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Filtros e Busca
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [dropdownAberto, setDropdownAberto] = useState<
    "categoria" | "status" | null
  >(null);

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

  const [arquivo, setArquivo] = useState<File | null>(null);

  // Para utilização do useRef no campo do título da ideia:
  const pesquisaRef = useRef<HTMLInputElement>(null);

  // Para utilização do useRef no campo de buscar ideias (Referência para o campo de título)
  const tituloRef = useRef<HTMLInputElement>(null);

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
      if (debouncedSearch.trim())
        params.append("search", debouncedSearch.trim());
      if (categoriaFilter !== "Todas")
        params.append("categoria", categoriaFilter);
      if (statusFilter !== "Todos") params.append("status", statusFilter);

      const res = await fetchApi<PaginatedIdeias | Ideia[]>(
        `/ideias?${params.toString()}`,
      );

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
    setArquivo(null);
    setIsModalOpen(true);

    setTimeout(() => {
      tituloRef.current?.focus();
    }, 0);
  };

  const handlePublicarIdeia = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!descricao.trim()) {
      showToast("Por favor, digite a descrição da sua ideia.", "error");
      return;
    }

    setSubmitting(true);

    try {
      const resultado = await fetchApi<{ ideiaId: number }>("/ideias", {
        method: "POST",
        body: JSON.stringify({
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          categoria,
          status,
          anonimo: anonimo ? 1 : 0,
        }),
      });

      // Se o usuário escolheu um arquivo, envia o arquivo
      if (arquivo) {
        const formData = new FormData();
        formData.append("arquivo", arquivo);

        await fetchApi(`/ideias/${resultado.ideiaId}/anexos`, {
          method: "POST",
          body: formData,
        });
      }

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
      {/* Camada de carregamento com símbolo giratório */}
      <div className="loading-overlay" aria-label="Carregando">
        <div className="loading-spinner"></div>
      </div>

      <section className="content home-entrada">
        {/* cabeçalho da página */}
        <div
          className="home-cabecalho"
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
              Explore ideias abandonadas e compartilhe novos projetos com a
              comunidade.
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

        {/* Explicação do que dá para fazer aqui (rola junto com a página, não fica fixa) */}
        <div
          role="note"
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "12px",
            padding: "14px 16px",
            marginBottom: "16px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
            color: "#1e3a8a",
            fontSize: "13px",
            lineHeight: 1.5,
          }}
        >
          <i
            className="fa-regular fa-lightbulb"
            style={{ fontSize: "18px", marginTop: "2px" }}
          ></i>
          <div>
            <strong>Aqui, ideias abandonadas ganham uma segunda chance.</strong>
            <br />
            Gostou de uma ideia? Abra a publicação e clique em{" "}
            <strong>Adotar / Contatar autor</strong> para desenvolvê-la ou
            colaborar. Você também pode comentar, curtir e salvar as que quiser
            acompanhar, ou publicar as suas para outra pessoa continuar.
          </div>
        </div>

        {/* Barra de Pesquisa e Filtros Combinados */}
        <div
          className="home-filtros"
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
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            {/* Campo de Pesquisa */}
            <div
              style={{
                flex: 1,
                minWidth: "220px",
                position: "relative",
              }}
            >
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
                ref={pesquisaRef}
                type="text"
                placeholder="Pesquisar por título ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  height: "48px",
                  boxSizing: "border-box",
                  padding: "0 12px 0 34px",
                  fontSize: "13px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  outline: "none",
                }}
              />
            </div>

            {/* Filtro personalizado de Categoria */}
            <SeletorFiltro
              rotulo="Categoria"
              aberto={dropdownAberto === "categoria"}
              aoAlternar={(abrir) => setDropdownAberto(abrir ? "categoria" : null)}
              opcoes={CATEGORIES_OPTIONS}
              icones={CATEGORIAS_ICONES}
              valor={categoriaFilter}
              iconeBotao="fa-tag"
              corIconeBotao="#2563eb"
              aoEscolher={(v) => {
                setCategoriaFilter(v);
                setPage(1);
              }}
            />

            {/* Filtro personalizado de Status */}
            <SeletorFiltro
              rotulo="Status"
              aberto={dropdownAberto === "status"}
              aoAlternar={(abrir) => setDropdownAberto(abrir ? "status" : null)}
              opcoes={STATUS_OPTIONS}
              icones={STATUS_ICONES}
              coresIcones={STATUS_CORES}
              valor={statusFilter}
              iconeBotao="fa-circle-check"
              corIconeBotao="#16a34a"
              aoEscolher={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            />

            {/* Botão Limpar Filtros */}
            {(debouncedSearch ||
              categoriaFilter !== "Todas" ||
              statusFilter !== "Todos") && (
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
                  alignSelf: "center",
                }}
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Feed de Ideias */}
        <div
          className="home-feed-titulo"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
          }}
        >
          <h2 style={{ fontSize: "15px", color: "#1e3a8a", margin: 0 }}>
            Feed de Ideias {totalCount > 0 && `(${totalCount})`}
          </h2>
        </div>

        {/* Conteúdo do feed */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <i
              className="fa-solid fa-spinner fa-spin"
              style={{ fontSize: "1.8rem", color: "#07327c" }}
            ></i>
          </div>
        ) : ideias.length === 0 ? (
          <EmptyState
            icon="fa-regular fa-lightbulb"
            title="Nenhuma ideia encontrada"
            description="Tente ajustar os termos da busca ou os filtros de categoria e status."
          />
        ) : (
          <div className="home-lista-ideias">
            {ideias.map((ideia, index) => (
              <div
                key={ideia.ID}
                className="home-card-entrada"
                style={{
                  animationDelay: `${0.1 + index * 0.08}s`,
                }}
              >
                <IdeaCard key={ideia.ID} ideia={ideia} />
              </div>
            ))}

            {/* Controles de Paginação */}
            {totalPages > 1 && (
              <div
                className="home-paginacao"
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
                  <i
                    className="fa-solid fa-chevron-left"
                    style={{ marginRight: "4px" }}
                  ></i>
                  Anterior
                </button>

                <span
                  style={{
                    fontSize: "12px",
                    color: "#475569",
                    fontWeight: "bold",
                  }}
                >
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
                  <i
                    className="fa-solid fa-chevron-right"
                    style={{ marginLeft: "4px" }}
                  ></i>
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Modal de Publicação de Nova Ideia */}
      {isModalOpen && (
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
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
              }}
            >
              <h3 style={{ fontSize: "16px", color: "#1e3a8a", margin: 0 }}>
                Publicar Nova Ideia
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar modal"
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "none",
                  border: "none",
                  fontSize: "22px",
                  cursor: "pointer",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handlePublicarIdeia}>
              <label
                style={{
                  fontSize: "12px",
                  color: "#1e3a8a",
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Título da ideia (opcional)
              </label>
              <input
                ref={tituloRef}
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
              <div
                style={{ display: "flex", gap: "12px", marginBottom: "16px" }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "#1e3a8a",
                      fontWeight: "bold",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
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
                    {CATEGORIES_OPTIONS.filter((c) => c !== "Todas").map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {/* Seletor de Status */}
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "#1e3a8a",
                      fontWeight: "bold",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
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

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    color: "#1e3a8a",
                    fontWeight: "bold",
                  }}
                >
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

              {/* Anexo */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    fontSize: "12px",
                    color: "#1e3a8a",
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Anexo (opcional)
                </label>

                <label
                  htmlFor="arquivo"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#f1f5f9",
                    color: "#1e3a8a",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  <i className="fa-solid fa-paperclip"></i>
                  Adicionar arquivo
                </label>

                <input
                  id="arquivo"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => {
                    const arquivoSelecionado = e.target.files?.[0] || null;
                    setArquivo(arquivoSelecionado);
                  }}
                  style={{ display: "none" }}
                />

                <span
                  style={{
                    display: "block",
                    marginTop: "6px",
                    fontSize: "10px",
                    color: "#94a3b8",
                  }}
                >
                  JPG, PNG ou PDF • máximo 10 MB
                </span>

                {arquivo && (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "11px",
                      color: "#475569",
                    }}
                  >
                    <i
                      className="fa-solid fa-file"
                      style={{ marginRight: "6px" }}
                    ></i>

                    {arquivo.name}
                  </div>
                )}
              </div>

              {/* Opções de Visibilidade */}
              <div
                style={{
                  background: "#f8fafc",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "bold",
                    color: "#475569",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Visibilidade do Autor:
                </span>

                <div style={{ display: "flex", gap: "20px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      color: "#1e3a8a",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="anonimoModal"
                      checked={!anonimo}
                      onChange={() => setAnonimo(false)}
                    />
                    Público (com seu nome)
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      color: "#1e3a8a",
                      cursor: "pointer",
                    }}
                  >
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

              {/* Botões do modal */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
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
                    justifyContent: "center",
                    gap: "6px",
                    width: "100%",
                  }}
                >
                  <i className="fa-solid fa-paper-plane"></i>
                  {submitting ? "Publicando..." : "Publicar ideia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
