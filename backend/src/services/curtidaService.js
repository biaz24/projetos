import curtidaModel from "../models/curtidaModel.js";

async function curtirIdeia(ideiaId, usuarioId) {
  return await curtidaModel.curtirIdeia(ideiaId, usuarioId);
}

async function descurtirIdeia(ideiaId, usuarioId) {
  return await curtidaModel.descurtirIdeia(ideiaId, usuarioId);
}

async function contarCurtidas(ideiaId) {
  return await curtidaModel.contarCurtidas(ideiaId);
}

async function usuarioJaCurtiu(ideiaId, usuarioId) {
  return await curtidaModel.usuarioJaCurtiu(ideiaId, usuarioId);
}

async function listarQuemCurtiu(ideiaId) {
  return await curtidaModel.listarQuemCurtiu(ideiaId);
}

export default {
  curtirIdeia,
  descurtirIdeia,
  contarCurtidas,
  usuarioJaCurtiu,
  listarQuemCurtiu,
};
