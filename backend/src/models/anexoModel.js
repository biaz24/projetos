import connection from "../database/connection.js";

async function criarAnexo(
  ideiaId,
  nomeArquivo,
  nomeSalvo,
  caminho,
  tipo,
  tamanho,
) {
  const [resultado] = await connection.query(
    `INSERT INTO ANEXOS
      (IDEIAS_ID, NOME_ARQUIVO, NOME_SALVO, CAMINHO, TIPO, TAMANHO)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [ideiaId, nomeArquivo, nomeSalvo, caminho, tipo, tamanho],
  );

  return resultado;
}

async function listarAnexosPorIdeia(ideiaId) {
  const [anexos] = await connection.query(
    `SELECT
      ID,
      IDEIAS_ID,
      NOME_ARQUIVO,
      NOME_SALVO,
      CAMINHO,
      TIPO,
      TAMANHO,
      CREATED_AT
     FROM ANEXOS
     WHERE IDEIAS_ID = ?
     ORDER BY CREATED_AT DESC`,
    [ideiaId],
  );

  return anexos;
}

async function buscarAnexoPorId(id) {
  const [anexos] = await connection.query(
    `SELECT
      ID,
      IDEIAS_ID,
      NOME_ARQUIVO,
      NOME_SALVO,
      CAMINHO,
      TIPO,
      TAMANHO,
      CREATED_AT
     FROM ANEXOS
     WHERE ID = ?`,
    [id],
  );

  return anexos[0];
}

async function excluirAnexo(id) {
  const [resultado] = await connection.query(
    `DELETE FROM ANEXOS
     WHERE ID = ?`,
    [id],
  );

  return resultado;
}

export default {
  criarAnexo,
  listarAnexosPorIdeia,
  buscarAnexoPorId,
  excluirAnexo,
};
