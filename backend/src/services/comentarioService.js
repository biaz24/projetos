import comentarioModel from "../models/comentarioModel.js";

async function criarComentario(usuarioId, ideiasId, comentarios, parentId = null) {
  return await comentarioModel.criarComentario(
    usuarioId,
    ideiasId,
    comentarios,
    parentId,
  );
}

async function listarComentariosPorIdeia(ideiasId) {
  return await comentarioModel.listarComentariosPorIdeia(ideiasId);
}

async function atualizarComentario(id, usuarioId, comentarios) {
  const comentario = await comentarioModel.buscarComentarioPorId(id);

  if (!comentario) {
    const error = new Error("Comentário não encontrado");
    error.status = 404;
    throw error;
  }

  // Apenas o dono do comentário pode editar
  if (Number(comentario.USUARIOS_ID) !== Number(usuarioId)) {
    const error = new Error("Você não tem permissão para editar este comentário");
    error.status = 403;
    throw error;
  }

  return await comentarioModel.atualizarComentario(id, comentarios);
}

async function deletarComentario(id, usuarioId) {
  const comentario = await comentarioModel.buscarComentarioPorId(id);

  if (!comentario) {
    const error = new Error("Comentário não encontrado");
    error.status = 404;
    throw error;
  }

  const ehDonoComentario = Number(comentario.USUARIOS_ID) === Number(usuarioId);
  const ehDonoIdeia = Number(comentario.IDEIA_USUARIO_ID) === Number(usuarioId);

  // Podem excluir: o dono do comentário OU o dono da ideia
  if (!ehDonoComentario && !ehDonoIdeia) {
    const error = new Error("Você não tem permissão para excluir este comentário");
    error.status = 403;
    throw error;
  }

  return await comentarioModel.deletarComentario(id);
}

export default {
  criarComentario,
  listarComentariosPorIdeia,
  atualizarComentario,
  deletarComentario,
};
