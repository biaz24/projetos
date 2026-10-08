import anexoModel from "../models/anexoModel.js";

async function criarAnexo(
  ideiaId,
  nomeArquivo,
  nomeSalvo,
  caminho,
  tipo,
  tamanho,
) {
  return await anexoModel.criarAnexo(
    ideiaId,
    nomeArquivo,
    nomeSalvo,
    caminho,
    tipo,
    tamanho,
  );
}

async function listarAnexosPorIdeia(ideiaId) {
  return await anexoModel.listarAnexosPorIdeia(ideiaId);
}

async function buscarAnexoPorId(id) {
  return await anexoModel.buscarAnexoPorId(id);
}

async function excluirAnexo(id) {
  return await anexoModel.excluirAnexo(id);
}

export default {
  criarAnexo,
  listarAnexosPorIdeia,
  buscarAnexoPorId,
  excluirAnexo,
};
