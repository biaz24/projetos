import connection from "../database/connection.js";

async function criarComentario(usuarioId, ideiasId, comentarios) {
  await connection.query(
    `INSERT INTO COMENTARIOS
    (USUARIOS_ID, IDEIAS_ID, COMENTARIOS)
    VALUES (?, ?, ?)`,
    [usuarioId, ideiasId, comentarios],
  );
}

async function listarComentariosPorIdeia(ideiasId) {
  const [comentarios] = await connection.query(
    `SELECT * FROM COMENTARIOS
    WHERE IDEIAS_ID = ?`,
    [ideiasId],
  );
  return comentarios;
}

async function atualizarComentario(id, comentarios) {
  const [resultado] = await connection.query(
    `UPDATE COMENTARIOS 
    SET COMENTARIOS = ?
    WHERE ID = ?`,
    [comentarios, id],
  );
  return resultado;
}

async function deletarComentario(id) {
  const [resultado] = await connection.query(
    "DELETE FROM COMENTARIOS WHERE ID = ?",
    [id],
  );
  return resultado;
}

export default {
  criarComentario,
  listarComentariosPorIdeia,
  atualizarComentario,
  deletarComentario,
};
