import rascunhoService from "../services/rascunhoService.js";

async function criarRascunho(req, res) {
  try {
    const usuarioId = req.user.id;
    const { titulo, descricao } = req.body;

    if (!titulo || !descricao) {
      return res.status(400).json({ erro: "Título e descrição são obrigatórios" });
    }

    const resultado = await rascunhoService.criarRascunho(
      usuarioId,
      titulo.trim(),
      descricao.trim(),
    );

    return res.status(201).json({
      mensagem: "Rascunho salvo com sucesso",
      id: resultado.insertId,
    });
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao salvar rascunho" });
  }
}

async function listarMeusRascunhos(req, res) {
  try {
    const usuarioId = req.user.id;
    const rascunhos = await rascunhoService.listarRascunhosPorUsuario(usuarioId);

    return res.status(200).json(rascunhos);
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao buscar rascunhos" });
  }
}

async function atualizarRascunho(req, res) {
  try {
    const usuarioId = req.user.id;
    const { id } = req.params;
    const { titulo, descricao } = req.body;

    const rascunhoExistente = await rascunhoService.buscarPorId(id);
    if (!rascunhoExistente) {
      return res.status(404).json({ erro: "Rascunho não encontrado" });
    }

    if (String(rascunhoExistente.USUARIOS_ID) !== String(usuarioId)) {
      return res.status(403).json({ erro: "Sem permissão para alterar este rascunho" });
    }

    if (!titulo || !descricao) {
      return res.status(400).json({ erro: "Título e descrição são obrigatórios" });
    }

    await rascunhoService.atualizarRascunho(id, titulo, descricao);

    return res.status(200).json({ mensagem: "Rascunho atualizado com sucesso" });
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao atualizar rascunho" });
  }
}

async function deletarRascunho(req, res) {
  try {
    const usuarioId = req.user.id;
    const { id } = req.params;

    const rascunhoExistente = await rascunhoService.buscarPorId(id);
    if (!rascunhoExistente) {
      return res.status(404).json({ erro: "Rascunho não encontrado" });
    }

    if (String(rascunhoExistente.USUARIOS_ID) !== String(usuarioId)) {
      return res.status(403).json({ erro: "Sem permissão para excluir este rascunho" });
    }

    await rascunhoService.deletarRascunho(id);

    return res.status(200).json({ mensagem: "Rascunho excluído com sucesso" });
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao excluir rascunho" });
  }
}

export default {
  criarRascunho,
  listarMeusRascunhos,
  atualizarRascunho,
  deletarRascunho,
};
