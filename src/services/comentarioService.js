import comentarioModel from "../models/comentarioModel.js";

async function criarComentario(usuarioId, ideiasId, comentarios) {
  return await comentarioModel.criarComentario(
    usuarioId,
    ideiasId,
    comentarios,
  );
}

async function listarComentariosPorIdeia(ideiasId) {
  return await comentarioModel.listarComentariosPorIdeia(ideiasId);
}
async function atualizarComentario(id, comentarios) {
  return await comentarioModel.atualizarComentario(id, comentarios);
}

async function deletarComentario(id) {
  return await comentarioModel.deletarComentario(id);
}

export default {
  criarComentario,
  listarComentariosPorIdeia,
  atualizarComentario,
  deletarComentario,
};
