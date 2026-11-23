import notificacaoModel from "../models/notificacaoModel.js";

async function criarNotificacao(
  usuarioId,
  tipo,
  titulo,
  mensagem,
  ideiaId = null,
  contatoId = null,
) {
  return await notificacaoModel.criarNotificacao(
    usuarioId,
    tipo,
    titulo,
    mensagem,
    ideiaId,
    null,
    contatoId,
  );
}

// Versão que nunca lança erro (veja o comentário no model).
// contatoId: conversa a que o aviso se refere (o sininho abre essa conversa).
async function criarSemFalhar(
  usuarioId,
  notificacao,
  ideiaId = null,
  contatoId = null,
) {
  return await notificacaoModel.criarSemFalhar(
    usuarioId,
    notificacao,
    ideiaId,
    null,
    contatoId,
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
  criarSemFalhar,
  listarPorUsuario,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
};
