import usuarioService from "../services/usuarioService.js";

async function cadastrarUsuario(req, res) {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({
        erro: "Todos os campos (nome, email, senha) são obrigatórios",
      });
    }

    if (senha.length < 6) {
      return res.status(400).json({
        erro: "A senha deve ter no mínimo 6 caracteres",
      });
    }

    const usuario = await usuarioService.cadastrarUsuario(nome, email, senha);

    return res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso",
      usuario,
    });
  } catch (erro) {
    if (erro.message === "E-mail já cadastrado") {
      return res.status(409).json({
        erro: erro.message,
      });
    }

    return res.status(500).json({
      erro: "Erro ao cadastrar usuário",
    });
  }
}

async function listarUsuarios(req, res) {
  try {
    const usuarios = await usuarioService.listarUsuarios();
    return res.status(200).json(usuarios);
  } catch (erro) {
    return res.status(500).json({
      erro: "Erro ao buscar usuários",
    });
  }
}

async function buscarUsuarioPorId(req, res) {
  try {
    const { id } = req.params;
    const usuario = await usuarioService.buscarUsuarioPorId(id);

    if (!usuario) {
      return res.status(404).json({
        erro: "Usuário não encontrado",
      });
    }
    return res.status(200).json(usuario);
  } catch (erro) {
    return res.status(500).json({
      erro: "Erro ao buscar usuário",
    });
  }
}

async function atualizarUsuario(req, res) {
  try {
    const { id } = req.params;
    const { nome, email } = req.body;

    if (String(req.user.id) !== String(id)) {
      return res.status(403).json({
        erro: "Você não tem permissão para alterar este perfil",
      });
    }

    if (!nome || !email) {
      return res.status(400).json({
        erro: "Nome e email são obrigatórios",
      });
    }

    const resultado = await usuarioService.atualizarUsuario(id, nome, email);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado",
      });
    }
    return res.status(200).json({
      mensagem: "Usuário atualizado com sucesso",
    });
  } catch (erro) {
    return res.status(500).json({
      erro: "Erro ao atualizar usuário",
    });
  }
}

async function deletarUsuario(req, res) {
  try {
    const { id } = req.params;

    if (String(req.user.id) !== String(id)) {
      return res.status(403).json({
        erro: "Você não tem permissão para excluir esta conta",
      });
    }

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
    return res.status(500).json({
      erro: "Erro ao excluir usuário",
    });
  }
}

async function obterEstatisticasMeuPerfil(req, res) {
  try {
    const usuarioId = req.user.id;
    const stats = await usuarioService.obterEstatisticasUsuario(usuarioId);
    return res.status(200).json(stats);
  } catch (erro) {
    return res.status(500).json({
      erro: "Erro ao obter estatísticas do perfil",
    });
  }
}

export default {
  cadastrarUsuario,
  listarUsuarios,
  buscarUsuarioPorId,
  atualizarUsuario,
  deletarUsuario,
  obterEstatisticasMeuPerfil,
};
