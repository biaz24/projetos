import connection from "../database/connection.js";

async function curtirIdeia(ideiaId, usuarioId) {
  const [resultado] = await connection.query(
    `INSERT INTO CURTIDAS (IDEIAS_ID, USUARIOS_ID)
     VALUES (?, ?)`,
    [ideiaId, usuarioId],
  );

  return resultado;
}

async function descurtirIdeia(ideiaId, usuarioId) {
  const [resultado] = await connection.query(
    `DELETE FROM CURTIDAS
     WHERE IDEIAS_ID = ? AND USUARIOS_ID = ?`,
    [ideiaId, usuarioId],
  );

  return resultado;
}

async function contarCurtidas(ideiaId) {
  const [[resultado]] = await connection.query(
    `SELECT COUNT(*) AS total
     FROM CURTIDAS
     WHERE IDEIAS_ID = ?`,
    [ideiaId],
  );

  return Number(resultado.total);
}

async function usuarioJaCurtiu(ideiaId, usuarioId) {
  const [linhas] = await connection.query(
    `SELECT ID
     FROM CURTIDAS
     WHERE IDEIAS_ID = ? AND USUARIOS_ID = ?`,
    [ideiaId, usuarioId],
  );

  return linhas.length > 0;
}

async function listarQuemCurtiu(ideiaId) {
  const [linhas] = await connection.query(
    `SELECT 
        u.ID,
        u.NOME
     FROM CURTIDAS c
     JOIN USUARIOS u ON c.USUARIOS_ID = u.ID
     WHERE c.IDEIAS_ID = ?
     ORDER BY c.CREATED_AT DESC`,
    [ideiaId],
  );

  return linhas;
}

export default {
  curtirIdeia,
  descurtirIdeia,
  contarCurtidas,
  usuarioJaCurtiu,
  listarQuemCurtiu,
};
