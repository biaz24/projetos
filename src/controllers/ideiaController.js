import ideiaService from "../services/ideiaService.js";

async function criarIdeia(req, res) {
  try {
    const { usuarioId, titulo, descricao, anonimo } = req.body;

    if (!usuarioId || !titulo || !descricao) {
      return res.status(400).json({
        erro: "Usuario, tituloe descrição são obrigatórios",
      });
    }
    await ideiaService.criarIdeia(usuarioId, titulo, descricao, anonimo);

    return res.status(201).json({
      mensagem: "Ideia publicada com sucesso",
    });
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: "Erro ao publicar ideia",
    });
  }
}

// listar ideias
async function listarIdeias(req, res) {
  try {
    const ideias = await ideiaService.listarIdeias();

    return res.status(200).json(ideias);
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: "Erro ao buscar ideias",
    });
  }
}

async function buscarIdeiaPorId(req, res) {
  try {
    const { id } = req.params;
    const ideia = await ideiaService.buscarIdeiaPorId(id);

    if (!ideia) {
      return res.status(404).json({
        erro: "Ideia não encontrada",
      });
    }
    return res.status(200).json(ideia);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: "Erro ao buscar ideia",
    });
  }
}

async function atualizarIdeia(req, res) {
  try {
    const { id } = req.params;
    const { titulo, descricao, anonimo } = req.body;

    if (!titulo || !descricao) {
      return res.status(400).json({
        erro: "Titulo e descrição são obrigatórios",
      });
    }
    const resultado = await ideiaService.atualizarIdeia(
      id,
      titulo,
      descricao,
      anonimo,
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: "Ideia não encontrada",
      });
    }

    return res.status(200).json({
      mensagem: "Ideia atualiazda com sucesso",
    });
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: "Erro ao atualizar ideia 500",
    });
  }
}

async function deletarideia(req, res) {
  try {
    const { id } = req.params;
    const resultado = await ideiaService.deletarideia(id);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: "ideia não encontrada",
      });
    }
    return res.status(200).json({
      mensagem: "Ideia excluida com sucesso",
    });
  } catch (erro) {
    console.error(erro);
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
    console.error(erro);

    return res.status(500).json({
      erro: "Erro ao buscar ideias do usuario",
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
