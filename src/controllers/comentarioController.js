import comentarioService from "../services/comentarioService.js";

async function criarComentario(req, res) {
  try {
    const { usuarioId, ideiasId, comentarios } = req.body;

    if (!usuarioId || !ideiasId || !comentarios) {
      return res.status(400).json({
        erro: "Usuário, ideia e comentário são obrigatórios",
      });
    }

    await comentarioService.criarComentario(usuarioId, ideiasId, comentarios);

    return res.status(201).json({
      mensagem: "Comentário publicado com sucesso",
    });
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: "Erro ao publicar comentário",
    });
  }
}

async function listarComentariosPorIdeia(req, res) {
  try {
    const { id } = req.params;
    const comentarios = await comentarioService.listarComentariosPorIdeia(id);
    return res.status(200).json(comentarios);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: " erro ao buscar comentarios",
    });
  }
}

async function atualizarComentario(req, res) {
  try {
    const { id } = req.params;
    const { comentarios } = req.body;

    if (!comentarios) {
      return res.status(400).json({
        erro: " o comentario é obrigatorio",
      });
    }

    const resultado = await comentarioService.atualizarComentario(
      id,
      comentarios,
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: "comentário nao encontrado",
      });
    }
    return res.status(200).json({
      mensagem: "Comentário atualizado com sucesso",
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: "Erro ao atualizar comentário",
    });
  }
}

async function deletarComentario(req, res) {
  try {
    const { id } = req.params;

    const resultado = await comentarioService.deletarComentario(id);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: "Comentário não encontrado",
      });
    }

    return res.status(200).json({
      mensagem: "Comentário excluído com sucesso",
    });
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: "Erro ao excluir comentário",
    });
  }
}

export default {
  criarComentario,
  listarComentariosPorIdeia,
  atualizarComentario,
  deletarComentario,
};
