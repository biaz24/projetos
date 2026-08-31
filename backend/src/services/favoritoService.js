import favoritoModel from "../models/favoritoModel.js";

async function toggleFavorito(usuarioId, ideiaId) {
  const jaFavoritou = await favoritoModel.verificarSeFavoritou(usuarioId, ideiaId);
  if (jaFavoritou) {
    await favoritoModel.desfavoritarIdeia(usuarioId, ideiaId);
    return { salvou: false };
  } else {
    await favoritoModel.favoritarIdeia(usuarioId, ideiaId);
    return { salvou: true };
  }
}

async function listarMeusFavoritos(usuarioId) {
  return await favoritoModel.listarMeusFavoritos(usuarioId);
}

export default {
  toggleFavorito,
  listarMeusFavoritos,
};
