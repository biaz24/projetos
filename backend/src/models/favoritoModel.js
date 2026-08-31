import connection from "../database/connection.js";

async function favoritarIdeia(usuarioId, ideiaId) {
  const [resultado] = await connection.query(
    "INSERT IGNORE INTO FAVORITOS (USUARIOS_ID, IDEIAS_ID) VALUES (?, ?)",
    [usuarioId, ideiaId],
  );
  return resultado;
}

async function desfavoritarIdeia(usuarioId, ideiaId) {
  const [resultado] = await connection.query(
    "DELETE FROM FAVORITOS WHERE USUARIOS_ID = ? AND IDEIAS_ID = ?",
    [usuarioId, ideiaId],
  );
  return resultado;
}

async function listarMeusFavoritos(usuarioId) {
  const [ideias] = await connection.query(
    `SELECT 
      i.ID,
      i.USUARIOS_ID,
      i.TITULO,
      i.DESCRICAO,
      COALESCE(i.CATEGORIA, 'Geral') as CATEGORIA,
      COALESCE(i.STATUS, 'Disponível') as STATUS,
      i.ANONIMO,
      i.CREATED_AT,
      u.NOME as NOME_AUTOR,
      u.EMAIL as EMAIL_AUTOR,
      CAST((SELECT COUNT(*) FROM COMENTARIOS com WHERE com.IDEIAS_ID = i.ID) AS SIGNED) as comentarios_count,
      CAST((SELECT COUNT(*) FROM VISUALIZACOES v WHERE v.IDEIAS_ID = i.ID) AS SIGNED) + 1 as visualizacoes_count
    FROM FAVORITOS f
    JOIN IDEIAS i ON f.IDEIAS_ID = i.ID
    JOIN USUARIOS u ON i.USUARIOS_ID = u.ID
    WHERE f.USUARIOS_ID = ?
    ORDER BY f.CREATED_AT DESC`,
    [usuarioId],
  );
  return ideias;
}

async function verificarSeFavoritou(usuarioId, ideiaId) {
  const [rows] = await connection.query(
    "SELECT ID FROM FAVORITOS WHERE USUARIOS_ID = ? AND IDEIAS_ID = ?",
    [usuarioId, ideiaId],
  );
  return rows.length > 0;
}

export default {
  favoritarIdeia,
  desfavoritarIdeia,
  listarMeusFavoritos,
  verificarSeFavoritou,
};
