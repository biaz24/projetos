import curtidaService from "../services/curtidaService.js";

async function curtirIdeia(req, res) {
  try {
    const { ideiaId } = req.body;
    const usuarioId = req.user.id;

    if (!ideiaId) {
      return res.status(400).json({
        erro: "ID da ideia é obrigatório",
      });
    }

    await curtidaService.curtirIdeia(ideiaId, usuarioId);

    const total = await curtidaService.contarCurtidas(ideiaId);

    return res.status(201).json({
      mensagem: "Ideia curtida com sucesso",
      curtido: true,
      total,
    });
  } catch (erro) {
    console.error("Erro ao curtir ideia:", erro);

    return res.status(500).json({
      erro: "Erro ao curtir ideia",
    });
  }
}

async function descurtirIdeia(req, res) {
  try {
    const { ideiaId } = req.params;
    const usuarioId = req.user.id;

    await curtidaService.descurtirIdeia(ideiaId, usuarioId);

    const total = await curtidaService.contarCurtidas(ideiaId);

    return res.status(200).json({
      mensagem: "Curtida removida com sucesso",
      curtido: false,
      total,
    });
  } catch (erro) {
    console.error("Erro ao remover curtida:", erro);

    return res.status(500).json({
      erro: "Erro ao remover curtida",
    });
  }
}

async function verificarCurtida(req, res) {
  try {
    const { ideiaId } = req.params;
    const usuarioId = req.user.id;

    const curtido = await curtidaService.usuarioJaCurtiu(ideiaId, usuarioId);

    return res.status(200).json({
      curtido,
    });
  } catch (erro) {
    console.error("Erro ao verificar curtida:", erro);

    return res.status(500).json({
      erro: "Erro ao verificar curtida",
    });
  }
}

async function listarQuemCurtiu(req, res) {
  try {
    const { ideiaId } = req.params;

    const usuarios = await curtidaService.listarQuemCurtiu(ideiaId);

    return res.status(200).json(usuarios);
  } catch (erro) {
    console.error("Erro ao listar curtidas:", erro);

    return res.status(500).json({
      erro: "Erro ao buscar quem curtiu",
    });
  }
}

async function contarCurtidas(req, res) {
  try {
    const { ideiaId } = req.params;

    const total = await curtidaService.contarCurtidas(ideiaId);

    return res.status(200).json({
      total,
    });
  } catch (erro) {
    console.error("Erro ao contar curtidas:", erro);

    return res.status(500).json({
      erro: "Erro ao contar curtidas",
    });
  }
}

export default {
  curtirIdeia,
  descurtirIdeia,
  verificarCurtida,
  listarQuemCurtiu,
  contarCurtidas,
};
