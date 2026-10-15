import denunciaModel from "../models/denunciaModel.js";
import arquivoService from "./arquivoService.js";

async function criarDenuncia(ideiaId, usuarioId, motivo, descricao) {
  return await denunciaModel.criarDenuncia(
    ideiaId,
    usuarioId,
    motivo,
    descricao,
  );
}

async function listarDenuncias() {
  return await denunciaModel.listarDenuncias();
}

async function buscarDenunciaPorId(id) {
  return await denunciaModel.buscarDenunciaPorId(id);
}

async function listarDenunciasPorIdeia(ideiaId) {
  return await denunciaModel.listarDenunciasPorIdeia(ideiaId);
}

async function atualizarStatus(id, status) {
  return await denunciaModel.atualizarStatus(id, status);
}
async function buscarAutorDaIdeia(ideiaId) {
  return await denunciaModel.buscarAutorDaIdeia(ideiaId);
}
async function salvarRascunho(
  denunciaId,
  adminId,
  resultado,
  medidaAplicada,
  justificativa,
) {
  return await denunciaModel.salvarRascunho(
    denunciaId,
    adminId,
    resultado,
    medidaAplicada,
    justificativa,
  );
}

async function buscarRascunho(denunciaId, adminId) {
  return await denunciaModel.buscarRascunho(denunciaId, adminId);
}

async function concluirAnalise(
  denunciaId,
  adminId,
  resultado,
  medidaAplicada,
  justificativa,
) {
  const resultadoAnalise = await denunciaModel.concluirAnalise(
    denunciaId,
    adminId,
    resultado,
    medidaAplicada,
    justificativa,
  );

  // O banco já confirmou o COMMIT neste ponto.
  if (medidaAplicada === "Excluir ideia") {
    try {
      await arquivoService.excluirArquivos(resultadoAnalise.anexos);
    } catch (erro) {
      console.error(
        "A denúncia foi concluída, mas houve erro ao excluir arquivos físicos:",
        erro,
      );
    }
  }

  return resultadoAnalise.resposta;
}

export default {
  criarDenuncia,
  listarDenuncias,
  buscarDenunciaPorId,
  listarDenunciasPorIdeia,
  atualizarStatus,
  buscarAutorDaIdeia,
  salvarRascunho,
  buscarRascunho,
  concluirAnalise,
};
