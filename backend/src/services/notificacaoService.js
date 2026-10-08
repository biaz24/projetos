import notificacaoModel from "../models/notificacaoModel.js";

async function criarNotificacao(usuarioId, tipo, titulo, mensagem) {
  return await notificacaoModel.criarNotificacao(
    usuarioId,
    tipo,
    titulo,
    mensagem,
  );
}

async function listarPorUsuario(usuarioId) {
  return await notificacaoModel.listarPorUsuario(usuarioId);
}

async function contarNaoLidas(usuarioId) {
  return await notificacaoModel.contarNaoLidas(usuarioId);
}

async function marcarComoLida(id, usuarioId) {
  return await notificacaoModel.marcarComoLida(id, usuarioId);
}

async function marcarTodasComoLidas(usuarioId) {
  return await notificacaoModel.marcarTodasComoLidas(usuarioId);
}

export default {
  criarNotificacao,
  listarPorUsuario,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
};
