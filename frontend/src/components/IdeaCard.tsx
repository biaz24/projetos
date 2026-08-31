import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ideia, Comentario } from "../types";
import { fetchApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

interface IdeaCardProps {
  ideia: Ideia;
  onToggleSave?: (ideiaId: number, isSaved: boolean) => void;
}

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

export const IdeaCard: React.FC<IdeaCardProps> = ({ ideia, onToggleSave }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const categoryConfig = CATEGORY_MAP[ideia.CATEGORIA || "Geral"] || CATEGORY_MAP.Geral;
  const statusConfig = STATUS_MAP[ideia.STATUS || "Disponível"] || STATUS_MAP.Disponível;

  const commentsCountInitial = Number(ideia.comentarios_count ?? (ideia as any).COMENTARIOS_COUNT ?? 0);

  const [isSaved, setIsSaved] = useState<boolean>(Boolean(ideia.isSaved));
  const [savingBookmark, setSavingBookmark] = useState(false);

  // Estados dos Comentários
  const [showComments, setShowComments] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [replyParentId, setReplyParentId] = useState<number | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [comentariosCount, setComentariosCount] = useState(commentsCountInitial);

  // Estados de Edição e Exclusão Inline
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  const formatData = (dateString?: string) => {
    if (!dateString) return "Publicado recentemente";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Publicado recentemente";
    return `Publicado em ${date.toLocaleDateString("pt-BR")}`;
  };

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (savingBookmark) return;
    setSavingBookmark(true);
    try {
      const res = await fetchApi<{ salvou: boolean }>("/favoritos", {
        method: "POST",
        body: JSON.stringify({ ideiaId: ideia.ID }),
      });

      const nextSaved = Boolean(res.salvou);
      setIsSaved(nextSaved);
      showToast(nextSaved ? "Ideia salva nos favoritos!" : "Ideia removida dos favoritos", "success");
      if (onToggleSave) onToggleSave(ideia.ID, nextSaved);
    } catch (err: any) {
      showToast(err.message || "Erro ao salvar ideia", "error");
    } finally {
      setSavingBookmark(false);
    }
  };

  const handleToggleComments = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showComments) {
      setShowComments(true);
      try {
        setLoadingComments(true);
        const data = await fetchApi<Comentario[]>(`/ideias/${ideia.ID}/comentarios`);
        setComentarios(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao carregar comentários:", err);
      } finally {
        setLoadingComments(false);
      }
    } else {
      setShowComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!novoComentario.trim() || submittingComment) return;

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
      setComentariosCount((prev) => prev + 1);
      showToast("Comentário publicado!", "success");

      const data = await fetchApi<Comentario[]>(`/ideias/${ideia.ID}/comentarios`);
      setComentarios(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err.message || "Erro ao publicar comentário", "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStartEditComment = (c: Comentario) => {
    setEditingCommentId(c.ID);
    setEditingText(c.COMENTARIOS);
  };

  const handleSaveEditComment = async (commentId: number) => {
    if (!editingText.trim() || submittingEdit) return;

    setSubmittingEdit(true);
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
      setSubmittingEdit(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("Deseja realmente excluir este comentário?")) return;

    setDeletingCommentId(commentId);
    try {
      await fetchApi(`/comentarios/${commentId}`, {
        method: "DELETE",
      });

      setComentarios((prev) => prev.filter((item) => item.ID !== commentId));
      setComentariosCount((prev) => Math.max(0, prev - 1));
      showToast("Comentário excluído!", "success");
    } catch (err: any) {
      showToast(err.message || "Erro ao excluir comentário", "error");
    } finally {
      setDeletingCommentId(null);
    }
  };

  // Separação de comentários raiz e respostas
  const rootComments = comentarios.filter((c) => !c.PARENT_ID);
  const getReplies = (parentId: number) => comentarios.filter((c) => c.PARENT_ID === parentId);

  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e6eaf0",
        padding: "20px",
        marginBottom: "16px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* Ícone de Categoria Real */}
        <div
          onClick={() => navigate(`/ideia/${ideia.ID}`)}
          title={`Categoria: ${ideia.CATEGORIA || "Geral"}`}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "10px",
            background: categoryConfig.bg,
            color: categoryConfig.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          <i className={categoryConfig.icon}></i>
        </div>

        {/* Conteúdo Principal */}
        <div style={{ flex: 1, minWidth: "220px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
            <h3
              onClick={() => navigate(`/ideia/${ideia.ID}`)}
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#1e3a8a",
                margin: 0,
                cursor: "pointer",
              }}
            >
              {ideia.TITULO}
            </h3>

            {/* Badge de Categoria */}
            <span
              style={{
                background: categoryConfig.bg,
                color: categoryConfig.color,
                fontSize: "10px",
                fontWeight: "bold",
                padding: "2px 8px",
                borderRadius: "12px",
              }}
            >
              {ideia.CATEGORIA || "Geral"}
            </span>

            {/* Badge de Status */}
            <span
              style={{
                background: statusConfig.bg,
                color: statusConfig.color,
                fontSize: "10px",
                fontWeight: "bold",
                padding: "2px 8px",
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <i className={statusConfig.icon} style={{ fontSize: "9px" }}></i>
              {ideia.STATUS || "Disponível"}
            </span>
          </div>

          <p
            onClick={() => navigate(`/ideia/${ideia.ID}`)}
            style={{
              fontSize: "11px",
              color: "#475569",
              lineHeight: "1.6",
              marginBottom: "12px",
              cursor: "pointer",
            }}
          >
            {ideia.DESCRICAO}
          </p>

          {/* Autor */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "#1e3a8a",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "9px",
              }}
            >
              <i className="fa-solid fa-user"></i>
            </div>
            <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>
              {ideia.ANONIMO ? "Anônimo" : ideia.NOME_AUTOR || "Usuário"}
            </span>
          </div>
        </div>

        {/* Métricas e Ações */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "10px",
            marginLeft: "auto",
          }}
        >
          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            {/* Botão de Favoritar / Salvar */}
            <button
              type="button"
              onClick={handleToggleBookmark}
              disabled={savingBookmark}
              title={isSaved ? "Remover dos salvos" : "Salvar ideia"}
              style={{
                background: "none",
                border: "none",
                cursor: savingBookmark ? "not-allowed" : "pointer",
                color: isSaved ? "#07327c" : "#94a3b8",
                fontSize: "14px",
                padding: "2px",
              }}
            >
              <i className={isSaved ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark"}></i>
            </button>

            {/* Botão de Comentários Interativo */}
            <button
              type="button"
              onClick={handleToggleComments}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                color: showComments ? "#1e3a8a" : "#64748b",
                padding: "4px",
              }}
            >
              <i className="fa-regular fa-comment" style={{ fontSize: "14px" }}></i>
              <span style={{ fontWeight: "bold" }}>{comentariosCount}</span>
            </button>

            {/* Visualizações */}
            <div
              onClick={() => navigate(`/ideia/${ideia.ID}`)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              <i className="fa-regular fa-eye" style={{ fontSize: "14px" }}></i>
              <span style={{ fontWeight: "bold" }}>{(ideia as any).visualizacoes_count || 1}</span>
            </div>
          </div>

          <span style={{ fontSize: "9px", color: "#94a3b8" }}>
            {formatData(ideia.CREATED_AT)}
          </span>
        </div>
      </div>

      {/* Seção Expansível de Comentários com Suporte a Respostas Aninhadas */}
      {showComments && (
        <div
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <h4 style={{ fontSize: "12px", color: "#1e3a8a", marginBottom: "10px" }}>
            Comentários
          </h4>

          {loadingComments ? (
            <p style={{ fontSize: "11px", color: "#64748b" }}>Carregando comentários...</p>
          ) : comentarios.length === 0 ? (
            <p style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "12px" }}>
              Nenhum comentário ainda. Seja o primeiro a comentar!
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
              {rootComments.map((c) => {
                const isCommentOwner = user && Number(c.USUARIOS_ID) === Number(user.id);
                const isIdeaOwner = user && Number(ideia.USUARIOS_ID) === Number(user.id);
                const canEdit = isCommentOwner;
                const canDelete = isCommentOwner || isIdeaOwner;
                const isEditingThis = editingCommentId === c.ID;
                const isDeletingThis = deletingCommentId === c.ID;
                const replies = getReplies(c.ID);

                return (
                  <div key={c.ID}>
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        border: "1px solid #f1f5f9",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "bold", color: "#1e3a8a" }}>
                          {c.NOME_AUTOR || "Usuário"}
                        </span>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => setReplyParentId(replyParentId === c.ID ? null : c.ID)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#07327c",
                              cursor: "pointer",
                              fontSize: "10px",
                              fontWeight: "bold",
                            }}
                          >
                            Responder
                          </button>

                          {canEdit && !isEditingThis && (
                            <button
                              type="button"
                              onClick={() => handleStartEditComment(c)}
                              style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "11px" }}
                            >
                              <i className="fa-solid fa-pencil"></i>
                            </button>
                          )}

                          {canDelete && !isEditingThis && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(c.ID)}
                              disabled={isDeletingThis}
                              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "11px", opacity: isDeletingThis ? 0.5 : 1 }}
                            >
                              <i className={isDeletingThis ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash"}></i>
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditingThis ? (
                        <div style={{ marginTop: "6px" }}>
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            style={{ width: "100%", padding: "6px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                          />
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", marginTop: "6px" }}>
                            <button type="button" onClick={() => setEditingCommentId(null)} style={{ fontSize: "10px" }}>
                              Cancelar
                            </button>
                            <button type="button" onClick={() => handleSaveEditComment(c.ID)} style={{ fontSize: "10px", background: "#07327c", color: "white" }}>
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: "11px", color: "#334155", margin: 0, lineHeight: "1.4" }}>
                          {c.COMENTARIOS}
                        </p>
                      )}
                    </div>

                    {/* Respostas Aninhadas */}
                    {replies.length > 0 && (
                      <div style={{ marginLeft: "20px", marginTop: "6px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        {replies.map((reply) => {
                          const canDeleteReply = (user && Number(reply.USUARIOS_ID) === Number(user.id)) || isIdeaOwner;
                          const isDeletingReply = deletingCommentId === reply.ID;

                          return (
                            <div
                              key={reply.ID}
                              style={{
                                background: "#ffffff",
                                borderRadius: "6px",
                                padding: "8px 12px",
                                borderLeft: "3px solid #07327c",
                                borderTop: "1px solid #f1f5f9",
                                borderRight: "1px solid #f1f5f9",
                                borderBottom: "1px solid #f1f5f9",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                                <span style={{ fontSize: "10px", fontWeight: "bold", color: "#07327c" }}>
                                  {reply.NOME_AUTOR || "Usuário"} (resposta)
                                </span>

                                {canDeleteReply && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(reply.ID)}
                                    disabled={isDeletingReply}
                                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "10px", opacity: isDeletingReply ? 0.5 : 1 }}
                                  >
                                    <i className={isDeletingReply ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash"}></i>
                                  </button>
                                )}
                              </div>
                              <p style={{ fontSize: "10px", color: "#475569", margin: 0 }}>
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

          {/* Formulário de Adicionar Comentário ou Resposta */}
          <form onSubmit={handleAddComment} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {replyParentId && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#07327c", fontWeight: "bold" }}>
                <span>Respondendo ao comentário #{replyParentId}</span>
                <button type="button" onClick={() => setReplyParentId(null)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>
                  Cancelar resposta
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder={replyParentId ? "Escreva sua resposta..." : "Escreva um comentário..."}
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                required
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: "11px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={submittingComment}
                style={{
                  background: "#07327c",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 14px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  cursor: submittingComment ? "not-allowed" : "pointer",
                  opacity: submittingComment ? 0.7 : 1,
                }}
              >
                {submittingComment ? "Enviando..." : replyParentId ? "Responder" : "Comentar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
