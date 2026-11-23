import ideiaModel from "../models/ideiaModel.js";

async function criarIdeia(
  usuarioId,
  titulo,
  descricao,
  categoria = "Geral",
  status = "Disponível",
  anonimo = false,
) {
  return await ideiaModel.criarIdeia(
    usuarioId,
    titulo,
    descricao,
    categoria,
    status,
    anonimo,
  );
}

async function listarIdeias(options) {
  return await ideiaModel.listarIdeias(options);
}

async function buscarIdeiaPorId(id, usuarioId = null) {
  const ideia = await ideiaModel.buscarIdeiaPorId(id);

  if (ideia && usuarioId && Number(ideia.USUARIOS_ID) !== Number(usuarioId)) {
    ideiaModel.registrarVisualizacao(id, usuarioId);
  }

  return ideia;
}

async function atualizarIdeia(
  id,
  titulo,
  descricao,
  categoria = "Geral",
  status = "Disponível",
  anonimo = false,
) {
  return await ideiaModel.atualizarIdeia(
    id,
    titulo,
    descricao,
    categoria,
    status,
    anonimo,
  );
}

async function deletarideia(id) {
  return await ideiaModel.deletarideia(id);
}

async function listarideiasPorusuario(usuarioId) {
  return await ideiaModel.listarIdeiasPorUsuario(usuarioId);
}
async function ocultarIdeia(id) {
  return await ideiaModel.ocultarIdeia(id);
}

// ---- Ideias ocultadas pela moderação e reformulação ----

async function listarOcultasDoUsuario(usuarioId) {
  return await ideiaModel.listarOcultasDoUsuario(usuarioId);
}

async function reenviarParaRevisao(id) {
  return await ideiaModel.reenviarParaRevisao(id);
}

async function listarEmRevisao() {
  return await ideiaModel.listarEmRevisao();
}

async function aprovarRevisao(id) {
  return await ideiaModel.aprovarRevisao(id);
}

async function rejeitarRevisao(id, motivo) {
  return await ideiaModel.rejeitarRevisao(id, motivo);
}

export default {
  criarIdeia,
  listarIdeias,
  buscarIdeiaPorId,
  atualizarIdeia,
  deletarideia,
  listarideiasPorusuario,
  ocultarIdeia,
  listarOcultasDoUsuario,
  reenviarParaRevisao,
  listarEmRevisao,
  aprovarRevisao,
  rejeitarRevisao,
};
