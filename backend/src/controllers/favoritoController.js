import favoritoService from "../services/favoritoService.js";

async function toggleFavorito(req, res) {
  try {
    const usuarioId = req.user.id;
    const { ideiaId } = req.body;

    if (!ideiaId) {
      return res.status(400).json({ erro: "ID da ideia é obrigatório" });
    }

    const resultado = await favoritoService.toggleFavorito(usuarioId, Number(ideiaId));
    return res.status(200).json({
      mensagem: resultado.salvou ? "Ideia salva com sucesso" : "Ideia removida dos salvos",
      salvou: resultado.salvou,
    });
  } catch (erro) {
    console.error("Erro ao alterar favorito:", erro);
    return res.status(500).json({ erro: "Erro ao alterar favorito" });
  }
}

async function listarMeusFavoritos(req, res) {
  try {
    const usuarioId = req.user.id;
    const favoritos = await favoritoService.listarMeusFavoritos(usuarioId);
    return res.status(200).json(favoritos);
  } catch (erro) {
    console.error("Erro ao listar favoritos:", erro);
    return res.status(500).json({ erro: "Erro ao buscar ideias salvas" });
  }
}

export default {
  toggleFavorito,
  listarMeusFavoritos,
};
