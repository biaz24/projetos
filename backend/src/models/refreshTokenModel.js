import { createHash } from "node:crypto";
import connection from "../database/connection.js";

function gerarHashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function salvarRefreshToken(usuarioId, token, expiresAt) {
  const tokenHash = gerarHashToken(token);

  await connection.query(
    `INSERT INTO REFRESH_TOKENS (USUARIOS_ID, TOKEN_HASH, EXPIRES_AT)
     VALUES (?, ?, ?)`,
    [usuarioId, tokenHash, expiresAt],
  );
}

async function buscarPorToken(token) {
  const tokenHash = gerarHashToken(token);

  const [linhas] = await connection.query(
    "SELECT * FROM REFRESH_TOKENS WHERE TOKEN_HASH = ?",
    [tokenHash],
  );

  return linhas[0];
}

async function apagarPorToken(token) {
  const tokenHash = gerarHashToken(token);

  await connection.query("DELETE FROM REFRESH_TOKENS WHERE TOKEN_HASH = ?", [
    tokenHash,
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
