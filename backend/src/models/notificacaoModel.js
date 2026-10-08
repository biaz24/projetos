import connection from "../database/connection.js";

async function criarNotificacao(usuarioId, tipo, titulo, mensagem) {
  const [resultado] = await connection.query(
    `INSERT INTO NOTIFICACOES
      (USUARIOS_ID, TIPO, TITULO, MENSAGEM)
     VALUES (?, ?, ?, ?)`,
    [usuarioId, tipo, titulo, mensagem],
  );

  return resultado;
}

async function listarPorUsuario(usuarioId) {
  const [notificacoes] = await connection.query(
    `SELECT
      ID,
      USUARIOS_ID,
      TIPO,
      TITULO,
      MENSAGEM,
      LIDA,
      CREATED_AT
     FROM NOTIFICACOES
     WHERE USUARIOS_ID = ?
     ORDER BY CREATED_AT DESC`,
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
  listarPorUsuario,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
};
