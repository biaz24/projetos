import connection from "../database/connection.js";

async function salvarRefreshToken(usuarioId, token, expiresAt) {
  await connection.query(
    `INSERT INTO REFRESH_TOKENS (USUARIOS_ID, TOKEN, EXPIRES_AT)
    VALUES (?, ?, ?)`,
    [usuarioId, token, expiresAt],
  );
}

async function buscarPorToken(token) {
  const [linhas] = await connection.query(
    "SELECT * FROM REFRESH_TOKENS WHERE TOKEN = ?",
    [token],
  );
  return linhas[0];
}

async function apagarPorToken(token) {
  await connection.query("DELETE FROM REFRESH_TOKENS WHERE TOKEN = ?", [
    token,
  ]);
}

async function apagarTodosDoUsuario(usuarioId) {
  await connection.query("DELETE FROM REFRESH_TOKENS WHERE USUARIOS_ID = ?", [
    usuarioId,
  ]);
}

export default {
  salvarRefreshToken,
  buscarPorToken,
  apagarPorToken,
  apagarTodosDoUsuario,
};
