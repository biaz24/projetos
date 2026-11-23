import connection from "../database/connection.js";

// Conta nova nasce SEM e-mail confirmado (NULL explícito) e já com o aceite dos termos registrado.
async function cadastrarUsuario(nome, email, senha, versaoTermos) {
  const [resultado] = await connection.query(
    `INSERT INTO USUARIOS (NOME, EMAIL, SENHA, EMAIL_CONFIRMADO_EM, TERMOS_ACEITOS_EM, TERMOS_VERSAO)
     VALUES (?, ?, ?, NULL, NOW(), ?)`,
    [nome, email, senha, versaoTermos],
  );
  return resultado;
}

// Cadastro repetido de um e-mail que NUNCA foi confirmado: a conta antiga jamais conseguiu
// entrar, então quem se cadastra de novo assume o cadastro (evita travar o dono verdadeiro do e-mail).
async function refazerCadastroNaoConfirmado(id, nome, senha, versaoTermos) {
  await connection.query(
    `UPDATE USUARIOS
     SET NOME = ?, SENHA = ?, TERMOS_ACEITOS_EM = NOW(), TERMOS_VERSAO = ?, SENHA_ALTERADA_TS = NULL
     WHERE ID = ? AND EMAIL_CONFIRMADO_EM IS NULL`,
    [nome, senha, versaoTermos, id],
  );
}

async function listarUsuarios() {
  const [usuarios] = await connection.query(
    "SELECT ID as id, NOME as nome, EMAIL as email, TIPO as tipo, CREATED_AT as created_at FROM USUARIOS",
  );
  return usuarios;
}

async function buscarUsuarioPorId(id) {
  const [usuarios] = await connection.query(
    "SELECT ID as id, NOME as nome, EMAIL as email, TIPO as tipo, CREATED_AT as created_at FROM USUARIOS WHERE ID = ?",
    [id],
  );
  return usuarios[0];
}

async function atualizarUsuario(id, nome, email) {
  const [resultado] = await connection.query(
    `UPDATE USUARIOS
    SET NOME = ?, EMAIL = ?
    WHERE ID = ?`,
    [nome, email, id],
  );
  return resultado;
}

async function atualizarNome(id, nome) {
  const [resultado] = await connection.query("UPDATE USUARIOS SET NOME = ? WHERE ID = ?", [nome, id]);
  return resultado;
}

async function marcarEmailConfirmado(id) {
  await connection.query("UPDATE USUARIOS SET EMAIL_CONFIRMADO_EM = NOW() WHERE ID = ?", [id]);
}

// Troca de e-mail só vale depois do clique no link enviado ao endereço novo.
async function trocarEmailConfirmado(id, email) {
  await connection.query(
    "UPDATE USUARIOS SET EMAIL = ?, EMAIL_CONFIRMADO_EM = NOW() WHERE ID = ?",
    [email, id],
  );
}

// Troca a senha, derruba todas as sessões e cancela pedidos de "esqueci minha senha" em aberto.
// Tudo ou nada. "agoraTs" é o horário em segundos: tokens emitidos antes dele deixam de valer.
async function trocarSenha(id, senhaHash, agoraTs) {
  const conexao = await connection.getConnection();
  try {
    await conexao.beginTransaction();
    await conexao.query("UPDATE USUARIOS SET SENHA = ?, SENHA_ALTERADA_TS = ? WHERE ID = ?", [
      senhaHash,
      agoraTs,
      id,
    ]);
    await conexao.query("DELETE FROM REFRESH_TOKENS WHERE USUARIOS_ID = ?", [id]);
    await conexao.query(
      "UPDATE RECUPERACAO_SENHA SET USADO = TRUE WHERE USUARIOS_ID = ? AND USADO = FALSE",
      [id],
    );
    await conexao.commit();
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}

async function deletarUsuario(id) {
  const [resultado] = await connection.query(
    "DELETE FROM USUARIOS WHERE ID = ?",
    [id],
  );
  return resultado;
}

async function buscarUsuarioPorEmail(email) {
  const [usuarios] = await connection.query(
    "SELECT * FROM USUARIOS WHERE EMAIL = ?",
    [email],
  );
  return usuarios[0];
}

async function obterEstatisticasUsuario(usuarioId) {
  const [[{ ideias_count }]] = await connection.query(
    "SELECT COUNT(*) as ideias_count FROM IDEIAS WHERE USUARIOS_ID = ?",
    [usuarioId],
  );

  const [[{ comentarios_count }]] = await connection.query(
    "SELECT COUNT(*) as comentarios_count FROM COMENTARIOS WHERE USUARIOS_ID = ?",
    [usuarioId],
  );

  return {
    ideias_count: Number(ideias_count || 0),
    comentarios_count: Number(comentarios_count || 0),
    visualizacoes_count: Number(ideias_count || 0),
  };
}

// Dados para a moderação decidir sobre um usuário (inclui a senha só para a conferência interna).
async function buscarParaModeracao(id) {
  const [usuarios] = await connection.query(
    `SELECT ID, NOME, EMAIL, TIPO, SENHA, BANIDO_EM, MOTIVO_BANIMENTO, EMAIL_CONFIRMADO_EM, CREATED_AT
     FROM USUARIOS WHERE ID = ?`,
    [id],
  );
  return usuarios[0];
}

async function contarConteudo(usuarioId) {
  const [[{ ideias }]] = await connection.query(
    "SELECT COUNT(*) AS ideias FROM IDEIAS WHERE USUARIOS_ID = ?",
    [usuarioId],
  );
  const [[{ comentarios }]] = await connection.query(
    "SELECT COUNT(*) AS comentarios FROM COMENTARIOS WHERE USUARIOS_ID = ?",
    [usuarioId],
  );
  return { ideias: Number(ideias || 0), comentarios: Number(comentarios || 0) };
}

// Bane: marca a conta, derruba as sessões e esconde as ideias públicas. Tudo ou nada.
async function banirUsuario(id, motivo) {
  const conexao = await connection.getConnection();
  try {
    await conexao.beginTransaction();
    await conexao.query(
      "UPDATE USUARIOS SET BANIDO_EM = NOW(), MOTIVO_BANIMENTO = ? WHERE ID = ?",
      [motivo, id],
    );
    await conexao.query("DELETE FROM REFRESH_TOKENS WHERE USUARIOS_ID = ?", [id]);
    await conexao.query(
      `UPDATE IDEIAS
       SET VISIBILIDADE = 'Oculta', MOTIVO_MODERACAO = 'Conta do autor suspensa pela moderação.'
       WHERE USUARIOS_ID = ? AND VISIBILIDADE = 'Publica'`,
      [id],
    );
    await conexao.commit();
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}

// Desfaz só o bloqueio de entrada. As ideias continuam ocultas até alguém revisar.
async function desbanirUsuario(id) {
  await connection.query(
    "UPDATE USUARIOS SET BANIDO_EM = NULL, MOTIVO_BANIMENTO = NULL WHERE ID = ?",
    [id],
  );
}

export default {
  buscarParaModeracao,
  contarConteudo,
  banirUsuario,
  desbanirUsuario,
  cadastrarUsuario,
  refazerCadastroNaoConfirmado,
  atualizarNome,
  marcarEmailConfirmado,
  trocarEmailConfirmado,
  trocarSenha,
  listarUsuarios,
  buscarUsuarioPorId,
  atualizarUsuario,
  deletarUsuario,
  buscarUsuarioPorEmail,
  obterEstatisticasUsuario,
};
