// é o que conversa apenas com o service

import usuarioService from "../services/usuarioService.js";

async function cadastrarUsuario(req, res) {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({
        erro: "Todos os campos são obrigatórios",
      });
    }
    await usuarioService.cadastrarUsuario(nome, email, senha);

    res.status(201).json({
      mensagem: "Usuario cadastrado com sucesso",
    });
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      erro: "erro ao cadastrar usuário",
    });
  }
}

async function listarUsuarios(req, res) {
  try {
    const usuarios = await usuarioService.listarUsuarios();
    return res.status(200).json(usuarios);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: "Erro ao buscar usuario",
    });
  }
}
async function buscarUsuarioPorId(req, res) {
  try {
    const { id } = req.params;
    const usuario = await usuarioService.buscarUsuarioPorId(id);

    if (!usuario) {
      return res.status(404).json({
        erro: "usario não encontrado",
      });
    }
    return res.status(200).json(usuario);
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: "Erro ao buscar usuário",
    });
  }
}

async function atualizarUsuario(req, res) {
  try {
    const { id } = req.params;
    const { nome, email } = req.body;

    if (!nome || !email) {
      return res.status(400).json({
        erro: "Nome e email sao obrigatórios",
      });
    }

    const resultado = await usuarioService.atualizarUsuario(id, nome, email);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: "Usuario não encontrado",
      });
    }
    return res.status(200).json({
      menssagem: "usuario atualizado com sucesso",
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: "Erro ao atualizar usuario",
    });
  }
}

async function deletarUsuario(req, res) {
  try {
    const { id } = req.params;

    const resultado = await usuarioService.deletarUsuario(id);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado",
      });
    }

    return res.status(200).json({
      mensagem: "Usuário excluído com sucesso",
    });
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: "Erro ao excluir usuário",
    });
  }
}

export default {
  cadastrarUsuario,
  listarUsuarios,
  buscarUsuarioPorId,
  atualizarUsuario,
  deletarUsuario,
};
