import ideiaService from "../services/ideiaService.js";

async function criarIdeia(req, res) {
  try {
    const usuarioId = req.user.id;
    const { titulo, descricao, categoria = "Geral", status = "Disponível", anonimo } = req.body;

    if (!descricao || !descricao.trim()) {
      return res.status(400).json({
        erro: "A descrição da ideia é obrigatória",
      });
    }

    const tituloFinal = titulo && titulo.trim() ? titulo.trim() : "Sem título";

    await ideiaService.criarIdeia(
      usuarioId,
      tituloFinal,
      descricao.trim(),
      categoria || "Geral",
      status || "Disponível",
      Boolean(anonimo),
    );

    return res.status(201).json({
      mensagem: "Ideia publicada com sucesso",
    });
  } catch (erro) {
    console.error("Erro ao criar ideia:", erro);
    return res.status(500).json({
      erro: "Erro ao publicar ideia",
    });
  }
}

async function listarIdeias(req, res) {
  try {
    const { page = 1, limit = 10, search = "", categoria = "", status = "" } = req.query;

    const resultado = await ideiaService.listarIdeias({
      page: Number(page),
      limit: Number(limit),
      search: String(search),
      categoria: String(categoria),
      status: String(status),
    });

    return res.status(200).json(resultado);
  } catch (erro) {
    console.error("Erro ao listar ideias:", erro);
    return res.status(500).json({
      erro: "Erro ao buscar ideias",
    });
  }
}

async function buscarIdeiaPorId(req, res) {
  try {
    const { id } = req.params;
    const usuarioId = req.user?.id || null;

    const ideia = await ideiaService.buscarIdeiaPorId(id, usuarioId);

    if (!ideia) {
      return res.status(404).json({
        erro: "Ideia não encontrada",
      });
    }
    return res.status(200).json(ideia);
  } catch (erro) {
    console.error("Erro ao buscar ideia por id:", erro);
    return res.status(500).json({
      erro: "Erro ao buscar ideia",
    });
  }
}

async function atualizarIdeia(req, res) {
  try {
    const { id } = req.params;
    const { titulo, descricao, categoria = "Geral", status = "Disponível", anonimo } = req.body;

    const ideiaExistente = await ideiaService.buscarIdeiaPorId(id);
    if (!ideiaExistente) {
      return res.status(404).json({
        erro: "Ideia não encontrada",
      });
    }

    if (String(ideiaExistente.USUARIOS_ID) !== String(req.user.id)) {
      return res.status(403).json({
        erro: "Você não tem permissão para alterar esta ideia",
      });
    }

    if (!descricao || !descricao.trim()) {
      return res.status(400).json({
        erro: "A descrição da ideia é obrigatória",
      });
    }

    const tituloFinal = titulo && titulo.trim() ? titulo.trim() : "Sem título";

    await ideiaService.atualizarIdeia(
      id,
      tituloFinal,
      descricao.trim(),
      categoria || "Geral",
      status || "Disponível",
      Boolean(anonimo),
    );

    return res.status(200).json({
      mensagem: "Ideia atualizada com sucesso",
    });
  } catch (erro) {
    console.error("Erro ao atualizar ideia:", erro);
    return res.status(500).json({
      erro: "Erro ao atualizar ideia",
    });
  }
}

async function deletarideia(req, res) {
  try {
    const { id } = req.params;
    const ideiaExistente = await ideiaService.buscarIdeiaPorId(id);

    if (!ideiaExistente) {
      return res.status(404).json({
        erro: "Ideia não encontrada",
      });
    }

    if (String(ideiaExistente.USUARIOS_ID) !== String(req.user.id)) {
      return res.status(403).json({
        erro: "Você não tem permissão para excluir esta ideia",
      });
    }

    await ideiaService.deletarideia(id);

    return res.status(200).json({
      mensagem: "Ideia excluída com sucesso",
    });
  } catch (erro) {
    console.error("Erro ao deletar ideia:", erro);
    return res.status(500).json({
      erro: "Erro ao excluir ideia",
    });
  }
}

async function listarideiasPorUsuario(req, res) {
  try {
    const { usuarioId } = req.params;
    const ideias = await ideiaService.listarideiasPorusuario(usuarioId);

    return res.status(200).json(ideias);
  } catch (erro) {
    console.error("Erro ao listar ideias por usuário:", erro);
    return res.status(500).json({
      erro: "Erro ao buscar ideias do usuário",
    });
  }
}

export default {
  criarIdeia,
  listarIdeias,
  buscarIdeiaPorId,
  atualizarIdeia,
  deletarideia,
  listarideiasPorUsuario,
};
