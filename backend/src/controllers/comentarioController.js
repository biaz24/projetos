import comentarioService from "../services/comentarioService.js";
import ideiaService from "../services/ideiaService.js";
import { textoComLimite, idPositivo } from "../utils/validacao.js";
import { protegerComentarios, podeVerIdeia } from "../utils/ideiaPublica.js";

const COMENTARIO_MAX = 2000;

// Só mostra a mensagem do erro quando fomos nós que a criamos de propósito
// (ela tem "status"). Erros inesperados (ex.: do banco de dados) nunca vão para o usuário.
function responderErro(res, erro, mensagemPadrao) {
  if (erro?.status) {
    return res.status(erro.status).json({ erro: erro.message });
  }

  console.error(mensagemPadrao, erro);
  return res.status(500).json({ erro: mensagemPadrao });
}

async function criarComentario(req, res) {
  try {
    const usuarioId = req.user.id;
    const body = req.body ?? {};

    const ideiasId = idPositivo(body.ideiasId);
    const comentarios = textoComLimite(body.comentarios, {
      min: 1,
      max: COMENTARIO_MAX,
    });

    if (!ideiasId || !comentarios) {
      return res.status(400).json({
        erro: `Ideia e comentário são obrigatórios (comentário com até ${COMENTARIO_MAX} caracteres)`,
      });
    }

    let parentId = null;
    if (body.parentId !== undefined && body.parentId !== null && body.parentId !== "") {
      parentId = idPositivo(body.parentId);

      if (!parentId) {
        return res.status(400).json({ erro: "Comentário original inválido" });
      }
    }

    await comentarioService.criarComentario(
      usuarioId,
      ideiasId,
      comentarios,
      parentId,
    );

    return res.status(201).json({
      mensagem: "Comentário publicado com sucesso",
    });
  } catch (erro) {
    return responderErro(res, erro, "Erro ao publicar comentário");
  }
}

async function listarComentariosPorIdeia(req, res) {
  try {
    const id = idPositivo(req.params.id);

    if (!id) {
      return res.status(400).json({ erro: "ID da ideia inválido" });
    }

    // Comentários de uma ideia oculta pela moderação só aparecem para o autor e para administradores.
    const ideia = await ideiaService.buscarIdeiaPorId(id);

    if (!podeVerIdeia(ideia, req.user)) {
      return res.status(404).json({ erro: "Ideia não encontrada" });
    }

    const comentarios = await comentarioService.listarComentariosPorIdeia(id);

    // Se o autor de uma ideia anônima comentar nela, o nome dele fica escondido.
    return res.status(200).json(protegerComentarios(comentarios, req.user.id));
  } catch (erro) {
    return responderErro(res, erro, "Erro ao buscar comentários");
  }
}

async function atualizarComentario(req, res) {
  try {
    const id = idPositivo(req.params.id);
    const usuarioId = req.user.id;
    const comentarios = textoComLimite((req.body ?? {}).comentarios, {
      min: 1,
      max: COMENTARIO_MAX,
    });

    if (!id) {
      return res.status(400).json({ erro: "ID do comentário inválido" });
    }

    if (!comentarios) {
      return res.status(400).json({
        erro: `O comentário é obrigatório (até ${COMENTARIO_MAX} caracteres)`,
      });
    }

    await comentarioService.atualizarComentario(id, usuarioId, comentarios);

    return res.status(200).json({
      mensagem: "Comentário atualizado com sucesso",
    });
  } catch (erro) {
    return responderErro(res, erro, "Erro ao atualizar comentário");
  }
}

async function deletarComentario(req, res) {
  try {
    const id = idPositivo(req.params.id);
    const usuarioId = req.user.id;

    if (!id) {
      return res.status(400).json({ erro: "ID do comentário inválido" });
    }

    await comentarioService.deletarComentario(id, usuarioId);

    return res.status(200).json({
      mensagem: "Comentário excluído com sucesso",
    });
  } catch (erro) {
    return responderErro(res, erro, "Erro ao excluir comentário");
  }
}

export default {
  criarComentario,
  listarComentariosPorIdeia,
  atualizarComentario,
  deletarComentario,
};
