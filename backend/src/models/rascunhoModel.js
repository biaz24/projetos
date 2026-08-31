import connection from "../database/connection.js";

async function criarRascunho(usuarioId, titulo, descricao) {
  const [resultado] = await connection.query(
    `INSERT INTO RASCUNHO (USUARIOS_ID, TITULO, DESCRICAO) VALUES (?, ?, ?)`,
    [usuarioId, titulo, descricao],
  );
  return resultado;
}

async function listarRascunhosPorUsuario(usuarioId) {
  const [linhas] = await connection.query(
    `SELECT * FROM RASCUNHO WHERE USUARIOS_ID = ? ORDER BY UPDATED_AT DESC`,
    [usuarioId],
  );
  return linhas;
}

async function buscarPorId(id) {
  const [linhas] = await connection.query(
    `SELECT * FROM RASCUNHO WHERE ID = ?`,
    [id],
  );
  return linhas[0];
}

async function atualizarRascunho(id, titulo, descricao) {
  const [resultado] = await connection.query(
    `UPDATE RASCUNHO SET TITULO = ?, DESCRICAO = ? WHERE ID = ?`,
    [titulo, descricao, id],
  );
  return resultado;
}

async function deletarRascunho(id) {
  const [resultado] = await connection.query(
    `DELETE FROM RASCUNHO WHERE ID = ?`,
    [id],
  );
  return resultado;
}

export default {
  criarRascunho,
  listarRascunhosPorUsuario,
  buscarPorId,
  atualizarRascunho,
  deletarRascunho,
};
