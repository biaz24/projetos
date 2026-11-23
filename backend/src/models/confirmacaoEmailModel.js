import connection from "../database/connection.js";

// Cada linha é um link de confirmação enviado por e-mail.
// EMAIL guarda para QUAL endereço o link foi enviado: assim um link enviado para o
// e-mail antigo nunca confirma um e-mail novo.

async function apagarDoUsuario(usuarioId) {
  await connection.query("DELETE FROM CONFIRMACAO_EMAIL WHERE USUARIOS_ID = ?", [usuarioId]);
}

async function criar(usuarioId, tokenHash, email, expiraAt) {
  await connection.query(
    `INSERT INTO CONFIRMACAO_EMAIL (USUARIOS_ID, TOKEN_HASH, EMAIL, EXPIRA_AT)
     VALUES (?, ?, ?, ?)`,
    [usuarioId, tokenHash, email, expiraAt],
  );
}

async function temLinkAtivo(usuarioId) {
  const [linhas] = await connection.query(
    "SELECT 1 FROM CONFIRMACAO_EMAIL WHERE USUARIOS_ID = ? AND EXPIRA_AT > NOW() LIMIT 1",
    [usuarioId],
  );
  return linhas.length > 0;
}

async function buscarValido(tokenHash) {
  const [linhas] = await connection.query(
    `SELECT ID, USUARIOS_ID, EMAIL
     FROM CONFIRMACAO_EMAIL
     WHERE TOKEN_HASH = ? AND EXPIRA_AT > NOW()
     LIMIT 1`,
    [tokenHash],
  );
  return linhas[0] || null;
}

// Usa o link: só devolve true para UMA chamada (duas pessoas clicando juntas não passam as duas).
async function consumir(id) {
  const [resultado] = await connection.query("DELETE FROM CONFIRMACAO_EMAIL WHERE ID = ?", [id]);
  return resultado.affectedRows === 1;
}

export default { temLinkAtivo, apagarDoUsuario, criar, buscarValido, consumir };
