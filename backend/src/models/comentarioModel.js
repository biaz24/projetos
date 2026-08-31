import connection from "../database/connection.js";

async function criarComentario(usuarioId, ideiasId, comentarios, parentId = null) {
  const [resultado] = await connection.query(
    `INSERT INTO COMENTARIOS
    (USUARIOS_ID, IDEIAS_ID, COMENTARIOS, PARENT_ID)
    VALUES (?, ?, ?, ?)`,
    [usuarioId, ideiasId, comentarios, parentId ? Number(parentId) : null],
  );
  return resultado;
}

async function buscarComentarioPorId(id) {
  const [comentarios] = await connection.query(
    `SELECT 
      c.ID,
      c.IDEIAS_ID,
      c.USUARIOS_ID,
      c.PARENT_ID,
      c.COMENTARIOS,
      c.CREATED_AT,
      i.USUARIOS_ID as IDEIA_USUARIO_ID
    FROM COMENTARIOS c
    JOIN IDEIAS i ON c.IDEIAS_ID = i.ID
    WHERE c.ID = ?`,
    [id],
  );
  return comentarios[0];
}

async function listarComentariosPorIdeia(ideiasId) {
  const [comentarios] = await connection.query(
    `SELECT 
      c.ID,
      c.IDEIAS_ID,
      c.USUARIOS_ID,
      c.PARENT_ID,
      c.COMENTARIOS,
      c.CREATED_AT,
      u.NOME as NOME_AUTOR
    FROM COMENTARIOS c
    JOIN USUARIOS u ON c.USUARIOS_ID = u.ID
    WHERE c.IDEIAS_ID = ?
    ORDER BY c.CREATED_AT ASC`,
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
  buscarComentarioPorId,
  listarComentariosPorIdeia,
  atualizarComentario,
  deletarComentario,
};
