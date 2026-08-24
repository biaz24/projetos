// AQUI É O UNICO QUE CONVERSA COM O BANCO

//FAZENDO A CONEXÃO COM O BANCO
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
    "SELECT ID, NOME, EMAIL FROM USUARIOS",
  );
  return usuarios;
}

async function buscarUsuarioPorId(id) {
  const [usuarios] = await connection.query(
    "SELECT ID, NOME, EMAIL FROM USUARIOS WHERE ID =?",
    [id],
  );
  //vai pegar o unico usuario que esta dentro da lista. primeiro resultado
  return usuarios[0];
}

//atualizar certinho usa o id do usuario
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

export default {
  cadastrarUsuario,
  listarUsuarios,
  buscarUsuarioPorId,
  atualizarUsuario,
  deletarUsuario,
  buscarUsuarioPorEmail,
};

//DEPOIS RETIRAR O CONST E O RETURN

// aqui fica sql
