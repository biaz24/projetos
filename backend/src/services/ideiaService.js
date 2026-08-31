import ideiaModel from "../models/ideiaModel.js";

async function criarIdeia(usuarioId, titulo, descricao, categoria = "Geral", status = "Disponível", anonimo = false) {
  return await ideiaModel.criarIdeia(usuarioId, titulo, descricao, categoria, status, anonimo);
}

async function listarIdeias(options) {
  return await ideiaModel.listarIdeias(options);
}

async function buscarIdeiaPorId(id, usuarioId = null) {
  const ideia = await ideiaModel.buscarIdeiaPorId(id);
  if (ideia) {
    // Registra visualização assincronamente
    ideiaModel.registrarVisualizacao(id, usuarioId);
  }
  return ideia;
}

async function atualizarIdeia(id, titulo, descricao, categoria = "Geral", status = "Disponível", anonimo = false) {
  return await ideiaModel.atualizarIdeia(id, titulo, descricao, categoria, status, anonimo);
}

async function deletarideia(id) {
  return await ideiaModel.deletarideia(id);
}

async function listarideiasPorusuario(usuarioId) {
  return await ideiaModel.listarIdeiasPorUsuario(usuarioId);
}

export default {
  criarIdeia,
  listarIdeias,
  buscarIdeiaPorId,
  atualizarIdeia,
  deletarideia,
  listarideiasPorusuario,
};
