import connection from "../database/connection.js";

// É O QUE FALA LOGO COM O BANCO
async function criarIdeia(usuarioId, titulo, descricao, anonimo) {
  await connection.query(
    `INSERT INTO IDEIAS
        (USUARIOS_ID, TITULO, DESCRICAO, ANONIMO) 
        VALUES (?,?,?,?)`,
    [usuarioId, titulo, descricao, anonimo],
  );
}

async function listarIdeias() {
  const [ideias] = await connection.query("SELECT * FROM IDEIAS");

  return ideias;
}

//buscando uma ideia
async function buscarIdeiaPorId(id) {
  const [ideias] = await connection.query("SELECT * FROM IDEIAS WHERE ID = ?", [
    id,
  ]);
  return ideias[0];
}

async function atualizarIdeia(id, titulo, descricao, anonimo) {
  const [resultado] = await connection.query(
    `UPDATE IDEIAS
    SET TITULO = ?, DESCRICAO = ?, ANONIMO =?
    WHERE ID = ?`,
    [titulo, descricao, anonimo, id],
  );
  return resultado;
}

//vamos apagar a ideia
async function deletarideia(id) {
  await connection.query("DELETE FROM COMENTARIOS WHERE IDEIAS_ID = ?", [id]);
  const [resultado] = await connection.query(
    "DELETE FROM IDEIAS WHERE ID = ?",
    [id],
  );
  return resultado;
}

async function listarIdeiasPorUsuario(usuarioId) {
  const [ideias] = await connection.query(
    "SELECT * FROM IDEIAS WHERE USUARIOS_ID = ?",
    [usuarioId],
  );
  return ideias;
}

export default {
  criarIdeia,
  listarIdeias,
  buscarIdeiaPorId,
  atualizarIdeia,
  deletarideia,
  listarIdeiasPorUsuario,
};

//1
