import connection from "../database/connection.js";

async function curtirIdeia(usuarioId, ideiaId) {
  await connection.query(
    "INSERT INTO CURTIDAS (USUARIOS_ID, IDEIAS_ID) VALUES (?, ?)",
    [usuarioId, ideiaId],
  );
}

async function descurtirIdeia(usuarioId, ideiaId) {
  const [resultado] = await connection.query(
    "DELETE FROM CURTIDAS WHERE USUARIOS_ID = ? AND IDEIAS_ID = ?",
    [ideiaId],
  );
  return resultado;
}

async function usuarioJaCurtiu(usuarioId, ideiaId) {
  const [linhas] = await connection.query(
    "SELECT ID FROM CURTIDAS WHERE USUARIOS_ID = ? AND IDEIAS_ID = ?",
    [usuarioId, ideiaId],
  );
  // so retorna se o numero for maior que 0
  return linhas.length > 0;
}
export default {
  curtirIdeia,
  descurtirIdeia,
  usuarioJaCurtiu,
};
