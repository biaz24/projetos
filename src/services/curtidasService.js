import curtidasModel from "../models/curtidasModel.js";

async function curtirIdeia(usuarioId, ideiaId) {
  const jaCurtiu = await curtidasModel.usuarioJaCurtiu(usuarioId, ideiaId);

  //se ja curtiu vai retornar que ja curtiu se nao
  if (jaCurtiu) {
    throw new Error("Você já curtiu esta ideia");
  }

  //vai curtir a ideia
  return await curtidasModel.curtirIdeia(usuarioId, ideiaId);
}

async function descurtirIdeia(usuarioId, ideiaId) {
  return await curtidasModel.descurtirIdeia(usuarioId, ideiaId);
}

export default {
  curtirIdeia,
  descurtirIdeia,
};
