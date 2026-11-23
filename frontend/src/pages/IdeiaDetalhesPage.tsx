import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { EmptyState } from "../components/EmptyState";
import { fetchApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Ideia, Comentario, Contato } from "../types";
import { useRef } from "react";
import { useDestaque } from "../utils/destaque";
import { DenunciarIdeiaModal } from "../components/DenunciarIdeiaModal";

const CATEGORIES_OPTIONS = [
  "Tecnologia",
  "Games",
  "Sustentabilidade",
  "Educação",
  "Utilitários",
  "Geral",
];

const STATUS_OPTIONS = ["Disponível", "Em desenvolvimento", "Concluída"];

const CATEGORY_MAP: Record<
  string,
  { icon: string; bg: string; color: string }
> = {
  Tecnologia: { icon: "fa-solid fa-code", bg: "#dbeafe", color: "#1e40af" },
  Games: { icon: "fa-solid fa-gamepad", bg: "#f3e8ff", color: "#6b21a8" },
  Sustentabilidade: {
    icon: "fa-solid fa-seedling",
    bg: "#dcfce7",
    color: "#166534",
  },
  Educação: { icon: "fa-solid fa-book-open", bg: "#fef9c3", color: "#854d0e" },
  Utilitários: { icon: "fa-solid fa-wrench", bg: "#ffedd5", color: "#9a3412" },
  Geral: { icon: "fa-solid fa-lightbulb", bg: "#f1f5f9", color: "#475569" },
};

const STATUS_MAP: Record<string, { bg: string; color: string; icon: string }> =
  {
    Disponível: {
      bg: "#dcfce7",
      color: "#166534",
      icon: "fa-solid fa-circle-check",
    },
    "Em desenvolvimento": {
      bg: "#fef3c7",
      color: "#92400e",
      icon: "fa-solid fa-spinner fa-spin",
    },
    Concluída: {
      bg: "#dbeafe",
      color: "#1e40af",
      icon: "fa-solid fa-flag-checkered",
    },
  };

export const IdeiaDetalhesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const visualizacaoRegistrada = useRef<string | null>(null);

  const [ideia, setIdeia] = useState<Ideia | null>(null);
  const [reenviando, setReenviando] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Vindo do sininho: o cartão da ideia pisca quando ela carregar
  useDestaque(!loading && Boolean(ideia));
  const [error, setError] = useState<string | null>(null);

  const [curtido, setCurtido] = useState(false);
  const [totalCurtidas, setTotalCurtidas] = useState(0);
  const [carregandoCurtida, setCarregandoCurtida] = useState(false);

  const [anexos, setAnexos] = useState<any[]>([]);

  // Estados dos Modais
  const [isEditIdeaModalOpen, setIsEditIdeaModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Pedido de contato do usuário logado para esta ideia (null = ainda não pediu)
  const [meuContato, setMeuContato] = useState<Contato | null>(null);
  const [mensagemContato, setMensagemContato] = useState("");
  const [enviandoContato, setEnviandoContato] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);

  // Formulário Edição de Ideia
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editCategoria, setEditCategoria] = useState("Geral");
  const [editStatus, setEditStatus] = useState("Disponível");
  const [editAnonimo, setEditAnonimo] = useState(false);
  const [savingIdea, setSavingIdea] = useState(false);
  const [deletingIdea, setDeletingIdea] = useState(false);

  // Estados de Comentários e Respostas Aninhadas
  const [novoComentario, setNovoComentario] = useState("");
  const [replyParentId, setReplyParentId] = useState<number | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [submittingEditComment, setSubmittingEditComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(
    null,
  );

  const carregarIdeiaEComentarios = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      const [ideiaData, comentariosData, anexosData] = await Promise.all([
        fetchApi<Ideia>(`/ideias/${id}`).catch(() => null),
        fetchApi<Comentario[]>(`/ideias/${id}/comentarios`).catch(() => []),
        fetchApi<any[]>(`/ideias/${id}/anexos`).catch(() => []),
      ]);

      if (!ideiaData) {
        setError("Ideia não encontrada ou removida.");
        setLoading(false);
        return;
      }

      setIdeia(ideiaData);
      setComentarios(Array.isArray(comentariosData) ? comentariosData : []);
      setAnexos(Array.isArray(anexosData) ? anexosData : []);
    } catch (err: any) {
      console.error("Erro ao carregar ideia:", err);
      setError("Erro ao carregar as informações da ideia.");
    } finally {
      setLoading(false);
    }
  };
  //curtida
  const carregarCurtida = async () => {
    if (!id) return;

    try {
      const [curtidaData, totalData] = await Promise.all([
        fetchApi<{ curtido: boolean }>(`/curtidas/${id}/verificar`),
        fetchApi<{ total: number }>(`/curtidas/${id}`),
      ]);

      setCurtido(curtidaData.curtido);
      setTotalCurtidas(totalData.total);
    } catch (erro) {
      console.error("Erro ao carregar curtidas:", erro);
    }
  };

  const handleToggleCurtida = async () => {
    if (!ideia || carregandoCurtida) return;

    try {
      setCarregandoCurtida(true);
      //se ja foi curtido, apertando no botão vai descurtir
      if (curtido) {
        // Remover curtida
        const resposta = await fetchApi<{ total: number }>(
          `/curtidas/${ideia.ID}`,
          {
            method: "DELETE",
          },
        );

        setCurtido(false);
        setTotalCurtidas(resposta.total);
      } else {
        // Adicionar curtida
        const resposta = await fetchApi<{ total: number }>(`/curtidas`, {
          method: "POST",
          body: JSON.stringify({
            ideiaId: ideia.ID,
          }),
        });

        setCurtido(true);
        setTotalCurtidas(resposta.total);
      }
    } catch (erro) {
      console.error("Erro ao alterar curtida:", erro);
    } finally {
      setCarregandoCurtida(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    if (visualizacaoRegistrada.current === id) {
      return;
    }

    visualizacaoRegistrada.current = id;

    carregarIdeiaEComentarios();
    carregarCurtida();
  }, [id]);

  // Verifica se já existe um pedido de contato meu para esta ideia
  const ideiaCarregadaId = ideia?.ID;
  const ideiaCarregadaDoUsuario = ideia?.USUARIOS_ID;
  const usuarioLogadoId = user?.id;

  useEffect(() => {
    if (!ideiaCarregadaId || usuarioLogadoId === undefined) return undefined;

    // O autor não pede contato para a própria ideia
    if (Number(ideiaCarregadaDoUsuario) === Number(usuarioLogadoId)) {
      setMeuContato(null);
      return undefined;
    }

    let ativo = true;

    fetchApi<{ contato: Contato | null }>(`/ideias/${ideiaCarregadaId}/meu-contato`)
      .then((resposta) => {
        if (ativo) setMeuContato(resposta.contato);
      })
      .catch(() => {
        if (ativo) setMeuContato(null);
      });

    return () => {
      ativo = false;
    };
  }, [ideiaCarregadaId, ideiaCarregadaDoUsuario, usuarioLogadoId]);

  const handleEnviarPedidoContato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideia || enviandoContato) return;

    const texto = mensagemContato.trim();

    if (texto.length < 5) {
      showToast("Escreva uma mensagem para o autor (mínimo 5 caracteres).", "error");
      return;
    }

    try {
      setEnviandoContato(true);
      const resposta = await fetchApi<{ mensagem: string }>("/contatos", {
        method: "POST",
        body: JSON.stringify({ ideiaId: ideia.ID, mensagem: texto }),
      });
      showToast(resposta.mensagem, "success");
      setMensagemContato("");

      const atual = await fetchApi<{ contato: Contato | null }>(
        `/ideias/${ideia.ID}/meu-contato`,
      );
      setMeuContato(atual.contato);
    } catch (err: any) {
      showToast(err.message || "Erro ao enviar o pedido", "error");
    } finally {
      setEnviandoContato(false);
    }
  };

  // Edição da Ideia
  const handleOpenEditIdeaModal = () => {
    if (!ideia) return;
    setEditTitulo(ideia.TITULO);
    setEditDescricao(ideia.DESCRICAO);
    setEditCategoria(ideia.CATEGORIA || "Geral");
    setEditStatus(ideia.STATUS || "Disponível");
    setEditAnonimo(Boolean(ideia.ANONIMO));
    setIsEditIdeaModalOpen(true);
  };

  // Vindo de "Meu perfil > Reformular": abre direto a edição da ideia oculta
  useEffect(() => {
    if (searchParams.get("reformular") !== "1") return;
    if (!ideia || !user) return;

    const ehAutor = Number(ideia.USUARIOS_ID) === Number(user.id);

    if (ehAutor && ideia.VISIBILIDADE === "Oculta") {
      setEditTitulo(ideia.TITULO);
      setEditDescricao(ideia.DESCRICAO);
      setEditCategoria(ideia.CATEGORIA || "Geral");
      setEditStatus(ideia.STATUS || "Disponível");
      setEditAnonimo(Boolean(ideia.ANONIMO));
      setIsEditIdeaModalOpen(true);
    }

    // Limpa o parâmetro para o modal não reabrir ao recarregar
    setSearchParams({}, { replace: true });
  }, [ideia, user, searchParams, setSearchParams]);

  const handleReenviarIdeia = async () => {
    if (!ideia) return;

    try {
      setReenviando(true);
      await fetchApi(`/ideias/${ideia.ID}/reenviar`, { method: "POST" });
      setIdeia((anterior) =>
        anterior ? { ...anterior, VISIBILIDADE: "EmRevisao" } : anterior,
      );
      showToast("Ideia reenviada! Aguarde a decisão da moderação.", "success");
    } catch (err: any) {
      showToast(err.message || "Erro ao reenviar a ideia", "error");
    } finally {
      setReenviando(false);
    }
  };

  const handleSaveEditIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideia || !editDescricao.trim()) return;

    setSavingIdea(true);
    try {
      await fetchApi(`/ideias/${ideia.ID}`, {
        method: "PUT",
        body: JSON.stringify({
          titulo: editTitulo.trim(),
          descricao: editDescricao.trim(),
          categoria: editCategoria,
          status: editStatus,
          anonimo: editAnonimo ? 1 : 0,
        }),
      });

      setIdeia((prev) =>
        prev
          ? {
              ...prev,
              TITULO: editTitulo.trim(),
              DESCRICAO: editDescricao.trim(),
              CATEGORIA: editCategoria,
              STATUS: editStatus,
              ANONIMO: editAnonimo,
            }
          : null,
      );

      setIsEditIdeaModalOpen(false);
      showToast("Ideia atualizada com sucesso!", "success");
    } catch (err: any) {
      showToast(err.message || "Erro ao atualizar ideia", "error");
    } finally {
      setSavingIdea(false);
    }
  };

  // Exclusão de Ideia pelo Autor
  const handleDeleteIdea = async () => {
    if (!ideia || deletingIdea) return;

    setDeletingIdea(true);
    try {
      await fetchApi(`/ideias/${ideia.ID}`, { method: "DELETE" });
      showToast("Ideia excluída com sucesso!", "success");
      navigate("/home");
    } catch (err: any) {
      showToast(err.message || "Erro ao excluir ideia", "error");
      setDeletingIdea(false);
    }
  };

  const handleEnviarDenuncia = async (motivo: string, descricao: string) => {
    if (!ideia || !motivo || sendingReport) return;

    setSendingReport(true);

    try {
      await fetchApi("/denuncias", {
        method: "POST",
        body: JSON.stringify({
          ideiaId: ideia.ID,
          motivo,
          descricao: descricao.trim() || null,
        }),
      });

      setIsReportModalOpen(false);

      showToast("Denúncia enviada com sucesso!", "success");
    } catch (err: any) {
      showToast(err.message || "Erro ao enviar denúncia", "error");
    } finally {
      setSendingReport(false);
    }
  };

  // Comentários e Respostas
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideia || !novoComentario.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      await fetchApi("/comentarios", {
        method: "POST",
        body: JSON.stringify({
          ideiasId: ideia.ID,
          comentarios: novoComentario.trim(),
          parentId: replyParentId,
        }),
      });

      setNovoComentario("");
      setReplyParentId(null);
      showToast("Comentário publicado!", "success");

      const data = await fetchApi<Comentario[]>(
        `/ideias/${ideia.ID}/comentarios`,
      );
      setComentarios(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err.message || "Erro ao enviar comentário", "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStartEditComment = (c: Comentario) => {
    setEditingCommentId(c.ID);
    setEditingText(c.COMENTARIOS);
  };

  const handleSaveEditComment = async (commentId: number) => {
    if (!editingText.trim() || submittingEditComment) return;

    setSubmittingEditComment(true);
    try {
      await fetchApi(`/comentarios/${commentId}`, {
        method: "PUT",
        body: JSON.stringify({ comentarios: editingText.trim() }),
      });

      setComentarios((prev) =>
        prev.map((item) =>
          item.ID === commentId
            ? { ...item, COMENTARIOS: editingText.trim() }
            : item,
        ),
      );
      setEditingCommentId(null);
      setEditingText("");
      showToast("Comentário atualizado!", "success");
    } catch (err: any) {
      showToast(err.message || "Erro ao editar comentário", "error");
    } finally {
      setSubmittingEditComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("Deseja realmente excluir este comentário?")) return;

    setDeletingCommentId(commentId);
    try {
      await fetchApi(`/comentarios/${commentId}`, { method: "DELETE" });
      setComentarios((prev) => prev.filter((item) => item.ID !== commentId));
      showToast("Comentário excluído!", "success");
    } catch (err: any) {
      showToast(err.message || "Erro ao excluir comentário", "error");
    } finally {
      setDeletingCommentId(null);
    }
  };

  const formatData = (dateString?: string) => {
    if (!dateString) return "Publicado recentemente";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Publicado recentemente";
    return `Publicado em ${date.toLocaleDateString("pt-BR")} às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const categoryConfig = ideia
    ? CATEGORY_MAP[ideia.CATEGORIA || "Geral"] || CATEGORY_MAP.Geral
    : CATEGORY_MAP.Geral;

  const statusConfig = ideia
    ? STATUS_MAP[ideia.STATUS || "Disponível"] || STATUS_MAP.Disponível
    : STATUS_MAP.Disponível;

  const isIdeaOwner =
    user && ideia && Number(ideia.USUARIOS_ID) === Number(user.id);
  const rootComments = comentarios.filter((c) => !c.PARENT_ID);
  const getReplies = (parentId: number) =>
    comentarios.filter((c) => c.PARENT_ID === parentId);

  return (
    <AppLayout>
      <section className="content">
        {/* Botão de Voltar */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "#1e3a8a",
            fontSize: "12px",
            fontWeight: "bold",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "16px",
            padding: "4px 0",
          }}
        >
          <i className="fa-solid fa-arrow-left"></i>
          Voltar
        </button>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <i
              className="fa-solid fa-spinner fa-spin"
              style={{ fontSize: "2rem", color: "#07327c" }}
            ></i>
          </div>
        ) : error || !ideia ? (
          <EmptyState
            icon="fa-solid fa-circle-exclamation"
            title="Ideia não encontrada"
            description={error || "A ideia solicitada não foi localizada."}
          />
        ) : (
          <div>
            {/* Aviso de moderação: só o autor vê (e o admin ao abrir a ideia) */}
            {isIdeaOwner &&
              (ideia.VISIBILIDADE === "Oculta" ||
                ideia.VISIBILIDADE === "EmRevisao") && (
                <div
                  style={{
                    background:
                      ideia.VISIBILIDADE === "EmRevisao" ? "#eff6ff" : "#fffbeb",
                    border: `1px solid ${
                      ideia.VISIBILIDADE === "EmRevisao" ? "#bfdbfe" : "#fcd34d"
                    }`,
                    borderRadius: "12px",
                    padding: "16px 18px",
                    marginBottom: "16px",
                    fontSize: "13px",
                    color: "#334155",
                  }}
                >
                  {ideia.VISIBILIDADE === "EmRevisao" ? (
                    <strong>
                      Esta ideia foi reenviada e está aguardando a aprovação da
                      moderação.
                    </strong>
                  ) : (
                    <>
                      <strong>
                        Esta ideia está oculta e não aparece para outras
                        pessoas.
                      </strong>

                      {ideia.MOTIVO_MODERACAO && (
                        <p style={{ margin: "8px 0 0", overflowWrap: "anywhere" }}>
                          Motivo da moderação: {ideia.MOTIVO_MODERACAO}
                        </p>
                      )}

                      <p style={{ margin: "8px 0 12px" }}>
                        Ajuste o conteúdo para adequá-lo às regras da plataforma
                        e reenvie para revisão.
                      </p>

                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={handleOpenEditIdeaModal}
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
                          Reformular ideia
                        </button>

                        <button
                          type="button"
                          onClick={handleReenviarIdeia}
                          disabled={reenviando}
                          style={{
                            padding: "8px 14px",
                            border: "1px solid #166534",
                            borderRadius: "8px",
                            background: "white",
                            color: "#166534",
                            fontSize: "12px",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          {reenviando ? "Reenviando..." : "Reenviar para revisão"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

            {/* Card Principal da Ideia */}
            <div
              data-destaque="ideia"
              style={{
                background: "white",
                borderRadius: "14px",
                border: "1px solid #e6eaf0",
                padding: "24px",
                marginBottom: "24px",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                  marginBottom: "20px",
                }}
              >
                {/* Ícone da Categoria Real */}
                <div
                  style={{
                    width: "54px",
                    height: "54px",
                    borderRadius: "12px",
                    background: categoryConfig.bg,
                    color: categoryConfig.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    flexShrink: 0,
                  }}
                >
                  <i className={categoryConfig.icon}></i>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: "1 1 240px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          flexWrap: "wrap",
                          marginBottom: "6px",
                        }}
                      >
                        <h1
                          style={{
                            fontSize: "20px",
                            fontWeight: "bold",
                            color: "#1e3a8a",
                            margin: 0,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {ideia.TITULO}
                        </h1>

                        <span
                          style={{
                            background: categoryConfig.bg,
                            color: categoryConfig.color,
                            fontSize: "11px",
                            fontWeight: "bold",
                            padding: "3px 10px",
                            borderRadius: "12px",
                          }}
                        >
                          {ideia.CATEGORIA || "Geral"}
                        </span>

                        <span
                          style={{
                            background: statusConfig.bg,
                            color: statusConfig.color,
                            fontSize: "11px",
                            fontWeight: "bold",
                            padding: "3px 10px",
                            borderRadius: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <i
                            className={statusConfig.icon}
                            style={{ fontSize: "10px" }}
                          ></i>
                          {ideia.STATUS || "Disponível"}
                        </span>
                      </div>
                    </div>

                    {/* Ações de Edição e Exclusão para o Autor da Ideia */}
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {!isIdeaOwner && (
                        <>
                          <button
                            onClick={() => setIsContactModalOpen(true)}
                            style={{
                              width: "auto",
                              height: "auto",
                              background: "#07327c",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              padding: "8px 16px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <i className="fa-solid fa-handshake"></i>
                            Adotar / Contatar Autor
                          </button>

                          <button
                            onClick={() => setIsReportModalOpen(true)}
                            style={{
                              width: "auto",
                              height: "auto",
                              background: "#fef2f2",
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                              borderRadius: "8px",
                              padding: "8px 14px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <i className="fa-solid fa-flag"></i>
                            Denunciar
                          </button>
                        </>
                      )}

                      {isIdeaOwner && (
                        <>
                          <button
                            onClick={handleOpenEditIdeaModal}
                            disabled={ideia.VISIBILIDADE === "EmRevisao"}
                            title={
                              ideia.VISIBILIDADE === "EmRevisao"
                                ? "Não é possível editar enquanto a ideia está em revisão"
                                : undefined
                            }
                            style={{
                              width: "auto",
                              height: "auto",
                              background: "#f1f5f9",
                              color: "#1e3a8a",
                              border: "1px solid #cbd5e1",
                              borderRadius: "8px",
                              padding: "8px 14px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                            Editar ideia
                          </button>

                          <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            style={{
                              width: "auto",
                              height: "auto",
                              background: "#fef2f2",
                              color: "#ef4444",
                              border: "1px solid #fecaca",
                              borderRadius: "8px",
                              padding: "8px 14px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <i className="fa-solid fa-trash"></i>
                            Excluir ideia
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Autor e Data */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginTop: "10px",
                      fontSize: "11px",
                      color: "#64748b",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          background: "#1e3a8a",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                        }}
                      >
                        <i className="fa-solid fa-user"></i>
                      </div>
                      <span style={{ fontWeight: "bold" }}>
                        {ideia.ANONIMO
                          ? "Anônimo"
                          : ideia.NOME_AUTOR || "Usuário"}
                      </span>
                    </div>

                    <span>•</span>
                    <span>{formatData(ideia.CREATED_AT)}</span>
                  </div>
                </div>
              </div>

              {/* Descrição Detalhada */}
              <div
                style={{
                  fontSize: "13px",
                  color: "#334155",
                  lineHeight: "1.7",
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #f1f5f9",
                  marginBottom: "20px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {ideia.DESCRICAO}
              </div>
              {/* Anexos da Ideia */}
              {anexos.length > 0 && (
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "16px",
                    background: "#f8fafc",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "13px",
                      fontWeight: "bold",
                      color: "#1e3a8a",
                      margin: "0 0 12px 0",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <i className="fa-solid fa-paperclip"></i>
                    Anexos
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {anexos.map((anexo) => (
                      <a
                        key={anexo.ID}
                        href={`/${anexo.CAMINHO}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 12px",
                          background: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          textDecoration: "none",
                          color: "#334155",
                          fontSize: "12px",
                        }}
                      >
                        <i
                          className={
                            anexo.TIPO === "application/pdf" ||
                            anexo.NOME_ARQUIVO.toLowerCase().endsWith(".pdf")
                              ? "fa-solid fa-file-pdf"
                              : "fa-solid fa-file-image"
                          }
                          style={{
                            fontSize: "18px",
                            color:
                              anexo.TIPO === "application/pdf" ||
                              anexo.NOME_ARQUIVO.toLowerCase().endsWith(".pdf")
                                ? "#ef4444"
                                : "#2563eb",
                          }}
                        ></i>

                        <span style={{ flex: 1 }}>{anexo.NOME_ARQUIVO}</span>

                        <i
                          className="fa-solid fa-arrow-up-right-from-square"
                          style={{ fontSize: "11px", color: "#64748b" }}
                        ></i>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Barra de Métricas */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid #e6eaf0",
                  paddingTop: "16px",
                }}
              >
                <div
                  style={{ display: "flex", gap: "12px 20px", alignItems: "center", flexWrap: "wrap" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      color: "#475569",
                    }}
                  >
                    <i
                      className="fa-regular fa-comment"
                      style={{ fontSize: "14px" }}
                    ></i>
                    <span style={{ fontWeight: "bold" }}>
                      {comentarios.length}
                    </span>
                    <small style={{ color: "#64748b", fontSize: "10px" }}>
                      Comentários
                    </small>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      color: "#475569",
                    }}
                  >
                    <i
                      className="fa-regular fa-eye"
                      style={{ fontSize: "14px" }}
                    ></i>
                    <span style={{ fontWeight: "bold" }}>
                      {(ideia as any).visualizacoes_count || 1}
                    </span>
                    <small style={{ color: "#64748b", fontSize: "10px" }}>
                      Visualizações Reais
                    </small>
                  </div>
                  <button
                    // curtida
                    onClick={handleToggleCurtida}
                    disabled={carregandoCurtida}
                    style={{
                  width: "auto",
                  height: "auto",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      border: "none",
                      background: "transparent",
                      cursor: carregandoCurtida ? "default" : "pointer",
                      padding: "4px",
                    }}
                  >
                    <i
                      className={
                        curtido ? "fa-solid fa-heart" : "fa-regular fa-heart"
                      }
                      style={{
                        color: curtido ? "#e74c3c" : "#6b7280",
                        fontSize: "20px",
                      }}
                    ></i>

                    <span
                      style={{
                        fontWeight: "bold",
                        color: "#374151",
                      }}
                    >
                      {totalCurtidas}
                    </span>

                    <small
                      style={{
                        color: "#6b7280",
                      }}
                    >
                      Curtidas
                    </small>
                  </button>
                </div>
              </div>
            </div>

            {/* Seção de Comentários e Respostas Aninhadas */}
            <div
              style={{
                background: "white",
                borderRadius: "14px",
                border: "1px solid #e6eaf0",
                padding: "24px",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: "bold",
                  color: "#1e3a8a",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <i className="fa-regular fa-comments"></i>
                Comentários ({comentarios.length})
              </h3>

              {comentarios.length === 0 ? (
                <div style={{ padding: "20px 0" }}>
                  <EmptyState
                    icon="fa-regular fa-comment"
                    title="Nenhum comentário ainda"
                    description="Seja o primeiro a comentar nesta ideia!"
                  />
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    marginBottom: "24px",
                  }}
                >
                  {rootComments.map((c) => {
                    const isCommentOwner =
                      user && Number(c.USUARIOS_ID) === Number(user.id);
                    const canEditComment = isCommentOwner;
                    const canDeleteComment = isCommentOwner || isIdeaOwner;
                    const isEditingThis = editingCommentId === c.ID;
                    const isDeletingThis = deletingCommentId === c.ID;
                    const replies = getReplies(c.ID);

                    return (
                      <div key={c.ID}>
                        <div
                          style={{
                            background: "#f8fafc",
                            borderRadius: "10px",
                            padding: "14px 16px",
                            border: "1px solid #f1f5f9",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "6px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "#1e3a8a",
                              }}
                            >
                              {c.NOME_AUTOR || "Usuário"}
                            </span>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                marginLeft: "auto",
                                flexShrink: 0,
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setReplyParentId(
                                    replyParentId === c.ID ? null : c.ID,
                                  )
                                }
                                style={{
                  width: "auto",
                  height: "auto",
                                  padding: "4px",
                                  margin: 0,
                                  background: "none",
                                  border: "none",
                                  color: "#07327c",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                }}
                              >
                                Responder
                              </button>

                              {canEditComment && !isEditingThis && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditComment(c)}
                                  style={{
                  width: "auto",
                  height: "auto",
                                    padding: "4px",
                                    margin: 0,
                                    background: "none",
                                    border: "none",
                                    color: "#2563eb",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                  }}
                                >
                                  <i className="fa-solid fa-pencil"></i>
                                </button>
                              )}

                              {canDeleteComment && !isEditingThis && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(c.ID)}
                                  disabled={isDeletingThis}
                                  style={{
                  width: "auto",
                  height: "auto",
                                    padding: "4px",
                                    margin: 0,
                                    background: "none",
                                    border: "none",
                                    color: "#ef4444",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    opacity: isDeletingThis ? 0.5 : 1,
                                  }}
                                >
                                  <i
                                    className={
                                      isDeletingThis
                                        ? "fa-solid fa-spinner fa-spin"
                                        : "fa-solid fa-trash"
                                    }
                                  ></i>
                                </button>
                              )}
                            </div>
                          </div>

                          {isEditingThis ? (
                            <div style={{ marginTop: "8px" }}>
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "8px",
                                  fontSize: "12px",
                                  borderRadius: "6px",
                                  border: "1px solid #cbd5e1",
                                }}
                              />
                              <div
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                  justifyContent: "flex-end",
                                  marginTop: "6px",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => setEditingCommentId(null)}
                                  style={{ fontSize: "11px" }}
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditComment(c.ID)}
                                  style={{
                  width: "auto",
                  height: "auto",
                                    background: "#07327c",
                                    color: "white",
                                    borderRadius: "4px",
                                    padding: "4px 10px",
                                    fontSize: "11px",
                                  }}
                                >
                                  Salvar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#334155",
                                margin: 0,
                                lineHeight: "1.5",
                              }}
                            >
                              {c.COMENTARIOS}
                            </p>
                          )}
                        </div>

                        {/* Respostas Aninhadas */}
                        {replies.length > 0 && (
                          <div
                            style={{
                              marginLeft: "24px",
                              marginTop: "8px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            {replies.map((reply) => {
                              const canDeleteReply =
                                (user &&
                                  Number(reply.USUARIOS_ID) ===
                                    Number(user.id)) ||
                                isIdeaOwner;
                              const isDeletingReply =
                                deletingCommentId === reply.ID;

                              return (
                                <div
                                  key={reply.ID}
                                  style={{
                                    background: "#ffffff",
                                    borderRadius: "8px",
                                    padding: "10px 14px",
                                    borderLeft: "4px solid #07327c",
                                    borderTop: "1px solid #f1f5f9",
                                    borderRight: "1px solid #f1f5f9",
                                    borderBottom: "1px solid #f1f5f9",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        fontWeight: "bold",
                                        color: "#07327c",
                                      }}
                                    >
                                      {reply.NOME_AUTOR || "Usuário"} (resposta)
                                    </span>
                                    {canDeleteReply && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteComment(reply.ID)
                                        }
                                        disabled={isDeletingReply}
                                        style={{
                                          width: "auto",
                                          height: "auto",
                                          padding: "4px",
                                          margin: 0,
                                          background: "none",
                                          border: "none",
                                          color: "#ef4444",
                                          cursor: "pointer",
                                          fontSize: "11px",
                                          opacity: isDeletingReply ? 0.5 : 1,
                                        }}
                                      >
                                        <i
                                          className={
                                            isDeletingReply
                                              ? "fa-solid fa-spinner fa-spin"
                                              : "fa-solid fa-trash"
                                          }
                                        ></i>
                                      </button>
                                    )}
                                  </div>
                                  <p
                                    style={{
                                      fontSize: "11px",
                                      color: "#475569",
                                      margin: 0,
                                    }}
                                  >
                                    {reply.COMENTARIOS}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Formulário de Enviar Comentário / Resposta */}
              <form
                onSubmit={handleAddComment}
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                {replyParentId && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      color: "#07327c",
                      fontWeight: "bold",
                    }}
                  >
                    <span>Respondendo ao comentário #{replyParentId}</span>
                    <button
                      type="button"
                      onClick={() => setReplyParentId(null)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                      }}
                    >
                      Cancelar resposta
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <textarea
                    placeholder={
                      replyParentId
                        ? "Escreva sua resposta..."
                        : "Escreva seu comentário..."
                    }
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    required
                    style={{
                      flex: 1,
                      minWidth: "240px",
                      height: "70px",
                      padding: "10px",
                      fontSize: "12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={submittingComment}
                    style={{
                      background: "#07327c",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0 20px",
                      height: "70px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    {submittingComment
                      ? "Enviando..."
                      : replyParentId
                        ? "Responder"
                        : "Comentar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* Modal de Editar Ideia */}
      {isEditIdeaModalOpen && (
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
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                color: "#1e3a8a",
                marginBottom: "16px",
              }}
            >
              Editar Ideia
            </h3>
            <form onSubmit={handleSaveEditIdea}>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Título
              </label>
              <input
                type="text"
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  marginBottom: "14px",
                }}
              />

              <div
                style={{ display: "flex", gap: "12px", marginBottom: "14px" }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Categoria
                  </label>
                  <select
                    value={editCategoria}
                    onChange={(e) => setEditCategoria(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    {CATEGORIES_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Descrição *
              </label>
              <textarea
                value={editDescricao}
                onChange={(e) => setEditDescricao(e.target.value)}
                required
                rows={5}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  marginBottom: "16px",
                  fontFamily: "inherit",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsEditIdeaModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#f1f5f9",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingIdea}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#07327c",
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  {savingIdea ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Ideia */}
      {isDeleteModalOpen && (
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
              maxWidth: "420px",
              width: "100%",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                color: "#ef4444",
                margin: "0 0 12px 0",
              }}
            >
              Excluir Ideia
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#475569",
                marginBottom: "20px",
                lineHeight: "1.5",
              }}
            >
              Tem certeza que deseja excluir esta ideia? Esta ação não poderá
              ser desfeita e removerá todos os comentários e salvos associados.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#f1f5f9",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteIdea}
                disabled={deletingIdea}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#ef4444",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {deletingIdea ? "Excluindo..." : "Sim, Excluir Ideia"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Contato / Adotar Ideia: pedido ao autor + chat privado */}
      {isContactModalOpen && ideia && (
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
              maxWidth: "480px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ fontSize: "16px", color: "#1e3a8a", margin: 0 }}>
                Adotar ideia / Contatar autor
              </h3>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                aria-label="Fechar"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {meuContato ? (
              <div>
                <p style={{ fontSize: "13px", color: "#334155", lineHeight: 1.5 }}>
                  {meuContato.STATUS === "Pendente" &&
                    "Seu pedido foi enviado. Você será avisado pelo sininho quando o autor responder."}
                  {meuContato.STATUS === "Aceito" &&
                    "O autor aceitou! A conversa privada já está aberta."}
                  {meuContato.STATUS === "Recusado" &&
                    "O autor não pode conversar sobre esta ideia agora."}
                  {meuContato.STATUS === "Encerrado" &&
                    "A conversa sobre esta ideia foi encerrada."}
                </p>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/conversas?abrir=${meuContato.ID}`)}
                    style={{
                      background: "#07327c",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 16px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    Abrir conversa
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEnviarPedidoContato}>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#334155",
                    marginTop: 0,
                    lineHeight: 1.5,
                  }}
                >
                  Conte ao autor por que você quer desenvolver ou colaborar com
                  esta ideia. Se ele aceitar, vocês conversam por um chat
                  privado aqui no site.
                  {ideia.ANONIMO ? (
                    <>
                      {" "}
                      Esta ideia foi publicada de forma <strong>anônima</strong>
                      : o autor continuará anônimo para você.
                    </>
                  ) : null}
                </p>

                <label
                  htmlFor="mensagem-contato"
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#1e3a8a",
                    marginBottom: "6px",
                  }}
                >
                  Sua mensagem
                </label>
                <textarea
                  id="mensagem-contato"
                  value={mensagemContato}
                  onChange={(e) => setMensagemContato(e.target.value)}
                  maxLength={1000}
                  rows={5}
                  placeholder="Ex.: Tenho experiência com isso e gostaria de transformar a ideia em projeto."
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
                <div
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                    textAlign: "right",
                    marginBottom: "10px",
                  }}
                >
                  {mensagemContato.length}/1000
                </div>

                <p
                  style={{
                    fontSize: "11px",
                    color: "#92400e",
                    background: "#fffbeb",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    margin: "0 0 14px",
                  }}
                >
                  Nunca envie senhas, códigos ou dinheiro. A moderação só lê a
                  conversa se alguém a denunciar.
                </p>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="submit"
                    disabled={enviandoContato}
                    style={{
                      background: "#07327c",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 16px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    {enviandoContato ? "Enviando..." : "Enviar pedido"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Denúncia */}
      {isReportModalOpen && ideia && (
        <DenunciarIdeiaModal
          tituloIdeia={ideia.TITULO}
          enviando={sendingReport}
          aoFechar={() => setIsReportModalOpen(false)}
          aoEnviar={handleEnviarDenuncia}
        />
      )}
    </AppLayout>
  );
};
