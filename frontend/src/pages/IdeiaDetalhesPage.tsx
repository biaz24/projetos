import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { EmptyState } from "../components/EmptyState";
import { fetchApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Ideia, Comentario } from "../types";

const CATEGORIES_OPTIONS = [
  "Tecnologia",
  "Games",
  "Sustentabilidade",
  "Educação",
  "Utilitários",
  "Geral",
];

const STATUS_OPTIONS = ["Disponível", "Em desenvolvimento", "Concluída"];

const CATEGORY_MAP: Record<string, { icon: string; bg: string; color: string }> = {
  Tecnologia: { icon: "fa-solid fa-code", bg: "#dbeafe", color: "#1e40af" },
  Games: { icon: "fa-solid fa-gamepad", bg: "#f3e8ff", color: "#6b21a8" },
  Sustentabilidade: { icon: "fa-solid fa-seedling", bg: "#dcfce7", color: "#166534" },
  Educação: { icon: "fa-solid fa-book-open", bg: "#fef9c3", color: "#854d0e" },
  Utilitários: { icon: "fa-solid fa-wrench", bg: "#ffedd5", color: "#9a3412" },
  Geral: { icon: "fa-solid fa-lightbulb", bg: "#f1f5f9", color: "#475569" },
};

const STATUS_MAP: Record<string, { bg: string; color: string; icon: string }> = {
  Disponível: { bg: "#dcfce7", color: "#166534", icon: "fa-solid fa-circle-check" },
  "Em desenvolvimento": { bg: "#fef3c7", color: "#92400e", icon: "fa-solid fa-spinner fa-spin" },
  Concluída: { bg: "#dbeafe", color: "#1e40af", icon: "fa-solid fa-flag-checkered" },
};

export const IdeiaDetalhesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [ideia, setIdeia] = useState<Ideia | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados dos Modais
  const [isEditIdeaModalOpen, setIsEditIdeaModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

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
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  const carregarIdeiaEComentarios = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      const [ideiaData, comentariosData] = await Promise.all([
        fetchApi<Ideia>(`/ideias/${id}`).catch(() => null),
        fetchApi<Comentario[]>(`/ideias/${id}/comentarios`).catch(() => []),
      ]);

      if (!ideiaData) {
        setError("Ideia não encontrada ou removida.");
        setLoading(false);
        return;
      }

      setIdeia(ideiaData);
      setComentarios(Array.isArray(comentariosData) ? comentariosData : []);
    } catch (err: any) {
      console.error("Erro ao carregar ideia:", err);
      setError("Erro ao carregar as informações da ideia.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarIdeiaEComentarios();
  }, [id]);

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

      const data = await fetchApi<Comentario[]>(`/ideias/${ideia.ID}/comentarios`);
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
          item.ID === commentId ? { ...item, COMENTARIOS: editingText.trim() } : item,
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

  const isIdeaOwner = user && ideia && Number(ideia.USUARIOS_ID) === Number(user.id);
  const rootComments = comentarios.filter((c) => !c.PARENT_ID);
  const getReplies = (parentId: number) => comentarios.filter((c) => c.PARENT_ID === parentId);

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
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "#07327c" }}></i>
          </div>
        ) : error || !ideia ? (
          <EmptyState
            icon="fa-solid fa-circle-exclamation"
            title="Ideia não encontrada"
            description={error || "A ideia solicitada não foi localizada."}
          />
        ) : (
          <div>
            {/* Card Principal da Ideia */}
            <div
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

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                        <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "#1e3a8a", margin: 0 }}>
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
                          <i className={statusConfig.icon} style={{ fontSize: "10px" }}></i>
                          {ideia.STATUS || "Disponível"}
                        </span>
                      </div>
                    </div>

                    {/* Ações de Edição e Exclusão para o Autor da Ideia */}
                    <div style={{ display: "flex", gap: "10px" }}>
                      {!isIdeaOwner && (
                        <button
                          onClick={() => setIsContactModalOpen(true)}
                          style={{
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
                      )}

                      {isIdeaOwner && (
                        <>
                          <button
                            onClick={handleOpenEditIdeaModal}
                            style={{
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
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "10px", fontSize: "11px", color: "#64748b" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
                        {ideia.ANONIMO ? "Anônimo" : ideia.NOME_AUTOR || "Usuário"}
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
                <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#475569" }}>
                    <i className="fa-regular fa-comment" style={{ fontSize: "14px" }}></i>
                    <span style={{ fontWeight: "bold" }}>{comentarios.length}</span>
                    <small style={{ color: "#64748b", fontSize: "10px" }}>Comentários</small>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#475569" }}>
                    <i className="fa-regular fa-eye" style={{ fontSize: "14px" }}></i>
                    <span style={{ fontWeight: "bold" }}>{(ideia as any).visualizacoes_count || 1}</span>
                    <small style={{ color: "#64748b", fontSize: "10px" }}>Visualizações Reais</small>
                  </div>
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
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#1e3a8a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
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
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                  {rootComments.map((c) => {
                    const isCommentOwner = user && Number(c.USUARIOS_ID) === Number(user.id);
                    const canEditComment = isCommentOwner;
                    const canDeleteComment = isCommentOwner || isIdeaOwner;
                    const isEditingThis = editingCommentId === c.ID;
                    const isDeletingThis = deletingCommentId === c.ID;
                    const replies = getReplies(c.ID);

                    return (
                      <div key={c.ID}>
                        <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "14px 16px", border: "1px solid #f1f5f9" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "bold", color: "#1e3a8a" }}>
                              {c.NOME_AUTOR || "Usuário"}
                            </span>

                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <button
                                type="button"
                                onClick={() => setReplyParentId(replyParentId === c.ID ? null : c.ID)}
                                style={{ background: "none", border: "none", color: "#07327c", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}
                              >
                                Responder
                              </button>

                              {canEditComment && !isEditingThis && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditComment(c)}
                                  style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "12px" }}
                                >
                                  <i className="fa-solid fa-pencil"></i>
                                </button>
                              )}

                              {canDeleteComment && !isEditingThis && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(c.ID)}
                                  disabled={isDeletingThis}
                                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px", opacity: isDeletingThis ? 0.5 : 1 }}
                                >
                                  <i className={isDeletingThis ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash"}></i>
                                </button>
                              )}
                            </div>
                          </div>

                          {isEditingThis ? (
                            <div style={{ marginTop: "8px" }}>
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                style={{ width: "100%", padding: "8px", fontSize: "12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                              />
                              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "6px" }}>
                                <button type="button" onClick={() => setEditingCommentId(null)} style={{ fontSize: "11px" }}>
                                  Cancelar
                                </button>
                                <button type="button" onClick={() => handleSaveEditComment(c.ID)} style={{ background: "#07327c", color: "white", borderRadius: "4px", padding: "4px 10px", fontSize: "11px" }}>
                                  Salvar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p style={{ fontSize: "12px", color: "#334155", margin: 0, lineHeight: "1.5" }}>
                              {c.COMENTARIOS}
                            </p>
                          )}
                        </div>

                        {/* Respostas Aninhadas */}
                        {replies.length > 0 && (
                          <div style={{ marginLeft: "24px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            {replies.map((reply) => {
                              const canDeleteReply = (user && Number(reply.USUARIOS_ID) === Number(user.id)) || isIdeaOwner;
                              const isDeletingReply = deletingCommentId === reply.ID;

                              return (
                                <div key={reply.ID} style={{ background: "#ffffff", borderRadius: "8px", padding: "10px 14px", borderLeft: "4px solid #07327c", borderTop: "1px solid #f1f5f9", borderRight: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                    <span style={{ fontSize: "11px", fontWeight: "bold", color: "#07327c" }}>
                                      {reply.NOME_AUTOR || "Usuário"} (resposta)
                                    </span>
                                    {canDeleteReply && (
                                      <button type="button" onClick={() => handleDeleteComment(reply.ID)} disabled={isDeletingReply} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "11px", opacity: isDeletingReply ? 0.5 : 1 }}>
                                        <i className={isDeletingReply ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash"}></i>
                                      </button>
                                    )}
                                  </div>
                                  <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>
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
              <form onSubmit={handleAddComment} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {replyParentId && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#07327c", fontWeight: "bold" }}>
                    <span>Respondendo ao comentário #{replyParentId}</span>
                    <button type="button" onClick={() => setReplyParentId(null)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>
                      Cancelar resposta
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <textarea
                    placeholder={replyParentId ? "Escreva sua resposta..." : "Escreva seu comentário..."}
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    required
                    style={{ flex: 1, minWidth: "240px", height: "70px", padding: "10px", fontSize: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "inherit" }}
                  />
                  <button
                    type="submit"
                    disabled={submittingComment}
                    style={{ background: "#07327c", color: "white", border: "none", borderRadius: "8px", padding: "0 20px", height: "70px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    {submittingComment ? "Enviando..." : replyParentId ? "Responder" : "Comentar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* Modal de Editar Ideia */}
      {isEditIdeaModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "14px", padding: "24px", maxWidth: "540px", width: "100%" }}>
            <h3 style={{ fontSize: "16px", color: "#1e3a8a", marginBottom: "16px" }}>Editar Ideia</h3>
            <form onSubmit={handleSaveEditIdea}>
              <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Título</label>
              <input type="text" value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginBottom: "14px" }} />

              <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Categoria</label>
                  <select value={editCategoria} onChange={(e) => setEditCategoria(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                    {CATEGORIES_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Status</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Descrição *</label>
              <textarea value={editDescricao} onChange={(e) => setEditDescricao(e.target.value)} required rows={5} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginBottom: "16px", fontFamily: "inherit" }} />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setIsEditIdeaModalOpen(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#f1f5f9" }}>Cancelar</button>
                <button type="submit" disabled={savingIdea} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#07327c", color: "white", fontWeight: "bold" }}>{savingIdea ? "Salvando..." : "Salvar Alterações"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Ideia */}
      {isDeleteModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "14px", padding: "24px", maxWidth: "420px", width: "100%" }}>
            <h3 style={{ fontSize: "16px", color: "#ef4444", margin: "0 0 12px 0" }}>Excluir Ideia</h3>
            <p style={{ fontSize: "13px", color: "#475569", marginBottom: "20px", lineHeight: "1.5" }}>
              Tem certeza que deseja excluir esta ideia? Esta ação não poderá ser desfeita e removerá todos os comentários e salvos associados.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" onClick={() => setIsDeleteModalOpen(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#f1f5f9", cursor: "pointer" }}>Cancelar</button>
              <button type="button" onClick={handleDeleteIdea} disabled={deletingIdea} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#ef4444", color: "white", fontWeight: "bold", cursor: "pointer" }}>{deletingIdea ? "Excluindo..." : "Sim, Excluir Ideia"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Contato / Adotar Ideia */}
      {isContactModalOpen && ideia && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "14px", padding: "24px", maxWidth: "450px", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", color: "#1e3a8a", margin: 0 }}>Adotar Ideia / Contatar Autor</h3>
              <button onClick={() => setIsContactModalOpen(false)} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer" }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {ideia.ANONIMO ? (
              <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.5" }}>
                Esta ideia foi publicada de forma <strong>Anônima</strong>. Deixe um comentário na publicação para demonstrar seu interesse em colaborar!
              </p>
            ) : (
              <div>
                <p style={{ fontSize: "13px", color: "#334155", marginBottom: "14px", lineHeight: "1.5" }}>
                  Você está demonstrando interesse em desenvolver ou colaborar no projeto <strong>{ideia.TITULO}</strong>.
                </p>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "16px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Autor da Ideia:</span>
                  <strong style={{ fontSize: "13px", color: "#1e3a8a" }}>{ideia.NOME_AUTOR}</strong>
                  {ideia.EMAIL_AUTOR && (
                    <span style={{ fontSize: "12px", color: "#475569", display: "block", marginTop: "2px" }}>
                      E-mail: {ideia.EMAIL_AUTOR}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  {ideia.EMAIL_AUTOR && (
                    <a
                      href={`mailto:${ideia.EMAIL_AUTOR}?subject=Interesse na Ideia: ${encodeURIComponent(ideia.TITULO)}`}
                      style={{ background: "#07327c", color: "white", padding: "8px 16px", borderRadius: "6px", textDecoration: "none", fontSize: "12px", fontWeight: "bold" }}
                    >
                      Enviar E-mail ao Autor
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
};
