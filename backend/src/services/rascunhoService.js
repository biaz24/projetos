import rascunhoModel from "../models/rascunhoModel.js";

async function criarRascunho(usuarioId, titulo, descricao) {
  return await rascunhoModel.criarRascunho(usuarioId, titulo, descricao);
}

async function listarRascunhosPorUsuario(usuarioId) {
  return await rascunhoModel.listarRascunhosPorUsuario(usuarioId);
}

async function buscarPorId(id) {
  return await rascunhoModel.buscarPorId(id);
}

async function atualizarRascunho(id, titulo, descricao) {
  return await rascunhoModel.atualizarRascunho(id, titulo, descricao);
}

async function deletarRascunho(id) {
  return await rascunhoModel.deletarRascunho(id);
}

export default {
  criarRascunho,
  listarRascunhosPorUsuario,
  buscarPorId,
  atualizarRascunho,
  deletarRascunho,
};
