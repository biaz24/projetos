import comentarioService from "../services/comentarioService.js";

async function criarComentario(req, res) {
  try {
    const usuarioId = req.user.id;
    const { ideiasId, comentarios, parentId } = req.body;

    if (!ideiasId || !comentarios || !comentarios.trim()) {
      return res.status(400).json({
        erro: "Ideia e comentário são obrigatórios",
      });
    }

    await comentarioService.criarComentario(
      usuarioId,
      ideiasId,
      comentarios.trim(),
      parentId ? Number(parentId) : null,
    );

    return res.status(201).json({
      mensagem: "Comentário publicado com sucesso",
    });
  } catch (erro) {
    return res.status(erro.status || 500).json({
      erro: erro.message || "Erro ao publicar comentário",
    });
  }
}

async function listarComentariosPorIdeia(req, res) {
  try {
    const { id } = req.params;
    const comentarios = await comentarioService.listarComentariosPorIdeia(id);
    return res.status(200).json(comentarios);
  } catch (erro) {
    return res.status(500).json({
      erro: "Erro ao buscar comentários",
    });
  }
}

async function atualizarComentario(req, res) {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;
    const { comentarios } = req.body;

    if (!comentarios || !comentarios.trim()) {
      return res.status(400).json({
        erro: "O comentário é obrigatório",
      });
    }

    await comentarioService.atualizarComentario(
      id,
      usuarioId,
      comentarios.trim(),
    );

    return res.status(200).json({
      mensagem: "Comentário atualizado com sucesso",
    });
  } catch (erro) {
    return res.status(erro.status || 500).json({
      erro: erro.message || "Erro ao atualizar comentário",
    });
  }
}

async function deletarComentario(req, res) {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    await comentarioService.deletarComentario(id, usuarioId);

    return res.status(200).json({
      mensagem: "Comentário excluído com sucesso",
    });
  } catch (erro) {
    return res.status(erro.status || 500).json({
      erro: erro.message || "Erro ao excluir comentário",
    });
  }
}

export default {
  criarComentario,
  listarComentariosPorIdeia,
  atualizarComentario,
  deletarComentario,
};
