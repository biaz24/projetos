import connection from "../database/connection.js";

async function cadastrarUsuario(nome, email, senha) {
  const [resultado] = await connection.query(
    "INSERT INTO USUARIOS (NOME, EMAIL, SENHA) VALUES (?,?,?)",
    [nome, email, senha],
  );
  return resultado;
}

async function listarUsuarios() {
  const [usuarios] = await connection.query(
    "SELECT ID as id, NOME as nome, EMAIL as email, CREATED_AT as created_at FROM USUARIOS",
  );
  return usuarios;
}

async function buscarUsuarioPorId(id) {
  const [usuarios] = await connection.query(
    "SELECT ID as id, NOME as nome, EMAIL as email, CREATED_AT as created_at FROM USUARIOS WHERE ID = ?",
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

export default {
  cadastrarUsuario,
  listarUsuarios,
  buscarUsuarioPorId,
  atualizarUsuario,
  deletarUsuario,
  buscarUsuarioPorEmail,
  obterEstatisticasUsuario,
};
