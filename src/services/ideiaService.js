import ideiaModel from "../models/ideiaModel.js";

async function criarIdeia(usuarioId, titulo, descricao, anonimo) {
  return await ideiaModel.criarIdeia(usuarioId, titulo, descricao, anonimo);
}

async function listarIdeias() {
  return await ideiaModel.listarIdeias();
}

async function buscarIdeiaPorId(id) {
  return await ideiaModel.buscarIdeiaPorId(id);
}
async function atualizarIdeia(id, titulo, descricao, anonimo) {
  return await ideiaModel.atualizarIdeia(id, titulo, descricao, anonimo);
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
//2
