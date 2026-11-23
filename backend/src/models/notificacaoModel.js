import connection from "../database/connection.js";

// "conexao" é opcional: serve para criar a notificação DENTRO de uma transação
// (ex.: a moderação conclui a denúncia e a notificação é gravada junto, no mesmo COMMIT).
async function criarNotificacao(
  usuarioId,
  tipo,
  titulo,
  mensagem,
  ideiaId = null,
  conexao = null,
  contatoId = null,
) {
  const executor = conexao ?? connection;

  const [resultado] = await executor.query(
    `INSERT INTO NOTIFICACOES
      (USUARIOS_ID, TIPO, TITULO, MENSAGEM, IDEIAS_ID, CONTATO_ID)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [usuarioId, tipo, String(titulo).slice(0, 150), mensagem, ideiaId, contatoId],
  );

  return resultado;
}

// Cria a notificação sem NUNCA derrubar a ação principal.
// Se a notificação falhar, a decisão da moderação continua valendo (só vai para o log).
// "notificacao" é o objeto { tipo, titulo, mensagem } de utils/mensagensNotificacao.js
async function criarSemFalhar(
  usuarioId,
  notificacao,
  ideiaId = null,
  conexao = null,
  contatoId = null,
) {
  if (!usuarioId || !notificacao) {
    return null;
  }

  try {
    return await criarNotificacao(
      usuarioId,
      notificacao.tipo,
      notificacao.titulo,
      notificacao.mensagem,
      ideiaId,
      conexao,
      contatoId,
    );
  } catch (erro) {
    console.error("Não foi possível criar a notificação:", erro.message);
    return null;
  }
}

async function listarPorUsuario(usuarioId) {
  const [notificacoes] = await connection.query(
    `SELECT
      ID,
      USUARIOS_ID,
      TIPO,
      TITULO,
      MENSAGEM,
      IDEIAS_ID,
      CONTATO_ID,
      LIDA,
      CREATED_AT
     FROM NOTIFICACOES
     WHERE USUARIOS_ID = ?
     ORDER BY CREATED_AT DESC, ID DESC
     LIMIT 50`,
    [usuarioId],
  );

  return notificacoes;
}

async function contarNaoLidas(usuarioId) {
  const [resultado] = await connection.query(
    `SELECT COUNT(*) AS total
     FROM NOTIFICACOES
     WHERE USUARIOS_ID = ?
       AND LIDA = FALSE`,
    [usuarioId],
  );

  return resultado[0].total;
}

async function marcarComoLida(id, usuarioId) {
  const [resultado] = await connection.query(
    `UPDATE NOTIFICACOES
     SET LIDA = TRUE
     WHERE ID = ?
       AND USUARIOS_ID = ?`,
    [id, usuarioId],
  );

  return resultado;
}

async function marcarTodasComoLidas(usuarioId) {
  const [resultado] = await connection.query(
    `UPDATE NOTIFICACOES
     SET LIDA = TRUE
     WHERE USUARIOS_ID = ?
       AND LIDA = FALSE`,
    [usuarioId],
  );

  return resultado;
}

export default {
  criarNotificacao,
  criarSemFalhar,
  listarPorUsuario,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
};
