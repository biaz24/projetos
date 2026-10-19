import connection from "../database/connection.js";

async function criar(usuarioId, tokenHash, expiraAt) {
  const [resultado] = await connection.query(
    `INSERT INTO RECUPERACAO_SENHA
      (USUARIOS_ID, TOKEN_HASH, EXPIRA_AT)
     VALUES (?, ?, ?)`,
    [usuarioId, tokenHash, expiraAt],
  );

  return resultado;
}

async function buscarTokenValido(tokenHash) {
  const [registros] = await connection.query(
    `SELECT ID, USUARIOS_ID, TOKEN_HASH, EXPIRA_AT, USADO
     FROM RECUPERACAO_SENHA
     WHERE TOKEN_HASH = ?
       AND USADO = FALSE
       AND EXPIRA_AT > NOW()
     LIMIT 1`,
    [tokenHash],
  );

  return registros[0] || null;
}

async function marcarComoUsado(id) {
  const [resultado] = await connection.query(
    `UPDATE RECUPERACAO_SENHA
     SET USADO = TRUE
     WHERE ID = ?
       AND USADO = FALSE`,
    [id],
  );

  return resultado;
}

async function invalidarTokensAnteriores(usuarioId) {
  const [resultado] = await connection.query(
    `UPDATE RECUPERACAO_SENHA
     SET USADO = TRUE
     WHERE USUARIOS_ID = ?
       AND USADO = FALSE`,
    [usuarioId],
  );

  return resultado;
}

async function atualizarSenha(id, senhaHash) {
  const [resultado] = await connection.query(
    "UPDATE USUARIOS SET SENHA = ? WHERE ID = ?",
    [senhaHash, id],
  );

  return resultado;
}

async function consumirTokenEAtualizarSenha(tokenHash, senhaHash) {
  const conn = await connection.getConnection();

  try {
    await conn.beginTransaction();

    const [registros] = await conn.query(
      `SELECT ID, USUARIOS_ID
       FROM RECUPERACAO_SENHA
       WHERE TOKEN_HASH = ?
         AND USADO = FALSE
         AND EXPIRA_AT > NOW()
       LIMIT 1
       FOR UPDATE`,
      [tokenHash],
    );

    const registro = registros[0];

    if (!registro) {
      throw new Error("Token inválido ou expirado.");
    }

    const [resultadoSenha] = await conn.query(
      `UPDATE USUARIOS
       SET SENHA = ?
       WHERE ID = ?`,
      [senhaHash, registro.USUARIOS_ID],
    );

    if (resultadoSenha.affectedRows !== 1) {
      throw new Error("Não foi possível atualizar a senha.");
    }

    const [resultadoToken] = await conn.query(
      `UPDATE RECUPERACAO_SENHA
       SET USADO = TRUE
       WHERE ID = ?
         AND USADO = FALSE`,
      [registro.ID],
    );

    if (resultadoToken.affectedRows !== 1) {
      throw new Error("Token já utilizado.");
    }

    await conn.commit();

    return { mensagem: "Senha redefinida com sucesso." };
  } catch (erro) {
    await conn.rollback();
    throw erro;
  } finally {
    conn.release();
  }
}

export default {
  criar,
  buscarTokenValido,
  marcarComoUsado,
  invalidarTokensAnteriores,
  atualizarSenha,
  consumirTokenEAtualizarSenha,
};
