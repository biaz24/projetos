import curtidaService from "../services/curtidaService.js";
import ideiaService from "../services/ideiaService.js";
import { idPositivo } from "../utils/validacao.js";

// Só ideias que existem e estão visíveis podem receber curtidas.
async function ideiaExisteEVisivel(ideiaId) {
  const ideia = await ideiaService.buscarIdeiaPorId(ideiaId);
  return Boolean(ideia && (!ideia.VISIBILIDADE || ideia.VISIBILIDADE === "Publica"));
}

async function curtirIdeia(req, res) {
  try {
    const ideiaId = idPositivo((req.body ?? {}).ideiaId);
    const usuarioId = req.user.id;

    if (!ideiaId) {
      return res.status(400).json({
        erro: "ID da ideia é obrigatório",
      });
    }

    if (!(await ideiaExisteEVisivel(ideiaId))) {
      return res.status(404).json({ erro: "Ideia não encontrada" });
    }

    // Regra do projeto: uma curtida por usuário em cada ideia.
    // Curtir de novo não dá erro, só devolve o total atual.
    const jaCurtiu = await curtidaService.usuarioJaCurtiu(ideiaId, usuarioId);

    if (!jaCurtiu) {
      try {
        await curtidaService.curtirIdeia(ideiaId, usuarioId);
      } catch (erroDeInsercao) {
        // Dois cliques ao mesmo tempo: a segunda inserção bate na regra de unicidade do banco.
        if (erroDeInsercao.code !== "ER_DUP_ENTRY") {
          throw erroDeInsercao;
        }
      }
    }

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
    const ideiaId = idPositivo(req.params.ideiaId);
    const usuarioId = req.user.id;

    if (!ideiaId) {
      return res.status(400).json({ erro: "ID da ideia inválido" });
    }

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
    const ideiaId = idPositivo(req.params.ideiaId);
    const usuarioId = req.user.id;

    if (!ideiaId) {
      return res.status(400).json({ erro: "ID da ideia inválido" });
    }

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
    const ideiaId = idPositivo(req.params.ideiaId);

    if (!ideiaId) {
      return res.status(400).json({ erro: "ID da ideia inválido" });
    }

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
    const ideiaId = idPositivo(req.params.ideiaId);

    if (!ideiaId) {
      return res.status(400).json({ erro: "ID da ideia inválido" });
    }

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
