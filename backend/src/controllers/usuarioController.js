import bcrypt from "bcrypt";
import usuarioService from "../services/usuarioService.js";
import usuarioModel from "../models/usuarioModel.js";
import authService from "../services/authService.js";
import confirmacaoEmailService from "../services/confirmacaoEmailService.js";
import emailService from "../services/emailService.js";
import { definirCookiesDeSessao } from "../utils/cookiesSessao.js";
import {
  textoComLimite,
  normalizarEmail,
  senhaEhForte,
  idPositivo,
  MENSAGEM_SENHA,
} from "../utils/validacao.js";

async function cadastrarUsuario(req, res) {
  try {
    const body = req.body ?? {};

    const nome = textoComLimite(body.nome, { min: 2, max: 100 });
    const email = normalizarEmail(body.email);

    if (!nome || !email || typeof body.senha !== "string" || !body.senha) {
      return res.status(400).json({
        erro: "Informe um nome (2 a 100 caracteres), um e-mail válido e uma senha",
      });
    }

    if (!senhaEhForte(body.senha)) {
      return res.status(400).json({ erro: MENSAGEM_SENHA });
    }

    // LGPD: sem o aceite dos Termos de Uso e da Política de Privacidade não há cadastro.
    if (body.aceitoTermos !== true) {
      return res.status(400).json({
        erro: "Para criar a conta é preciso aceitar os Termos de Uso e a Política de Privacidade.",
      });
    }

    const usuario = await usuarioService.cadastrarUsuario(nome, email, body.senha);

    return res.status(201).json({
      mensagem: "Cadastro feito. Enviamos um link de confirmação para o seu e-mail.",
      usuario,
    });
  } catch (erro) {
    if (erro.message === "E-mail já cadastrado" || erro.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        erro: "E-mail já cadastrado",
      });
    }

    console.error("Erro ao cadastrar usuário:", erro);
    return res.status(500).json({
      erro: "Erro ao cadastrar usuário",
    });
  }
}

// Somente administradores (veja usuarioRoutes.js).
async function listarUsuarios(req, res) {
  try {
    const usuarios = await usuarioService.listarUsuarios();
    return res.status(200).json(usuarios);
  } catch (erro) {
    console.error("Erro ao buscar usuários:", erro);
    return res.status(500).json({
      erro: "Erro ao buscar usuários",
    });
  }
}

async function buscarUsuarioPorId(req, res) {
  try {
    const id = idPositivo(req.params.id);

    if (!id) {
      return res.status(400).json({ erro: "ID do usuário inválido" });
    }

    const usuario = await usuarioService.buscarUsuarioPorId(id);

    if (!usuario) {
      return res.status(404).json({
        erro: "Usuário não encontrado",
      });
    }

    // Os dados completos (e-mail, tipo...) só vão para o próprio usuário ou para um administrador.
    // Os demais recebem apenas o básico.
    const ehOProprio = Number(req.user.id) === id;
    const ehAdmin = req.user.tipo === "admin";

    if (ehOProprio || ehAdmin) {
      return res.status(200).json(usuario);
    }

    return res.status(200).json({ id: usuario.id, nome: usuario.nome });
  } catch (erro) {
    console.error("Erro ao buscar usuário:", erro);
    return res.status(500).json({
      erro: "Erro ao buscar usuário",
    });
  }
}

async function senhaConfere(senha, hash) {
  if (typeof senha !== "string" || !senha || senha.length > 200) return false;
  return bcrypt.compare(senha, hash);
}

async function atualizarUsuario(req, res) {
  try {
    const id = idPositivo(req.params.id);

    if (!id || Number(req.user.id) !== id) {
      return res.status(403).json({
        erro: "Você não tem permissão para alterar este perfil",
      });
    }

    const body = req.body ?? {};
    const nome = textoComLimite(body.nome, { min: 2, max: 100 });
    const email = normalizarEmail(body.email);

    if (!nome || !email) {
      return res.status(400).json({
        erro: "Informe um nome (2 a 100 caracteres) e um e-mail válido",
      });
    }

    // Trocar o e-mail muda como a conta é recuperada: exige a senha atual,
    // para quem pegar uma sessão aberta não conseguir tomar a conta.
    const atual = await usuarioModel.buscarParaModeracao(id);
    if (!atual) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const emailMudou = email !== String(atual.EMAIL).trim().toLowerCase();

    if (emailMudou) {
      if (!(await senhaConfere(body.senhaAtual, atual.SENHA))) {
        return res.status(403).json({
          erro: "Para trocar o e-mail, informe a sua senha atual corretamente.",
        });
      }

      const dono = await usuarioModel.buscarUsuarioPorEmail(email);
      if (dono && Number(dono.ID) !== id) {
        return res.status(409).json({ erro: "E-mail já cadastrado" });
      }
    }

    // O e-mail NÃO muda agora: só depois do clique no link enviado ao endereço novo.
    // (Se fosse trocado direto, um erro de digitação trancaria a pessoa fora da própria conta.)
    const resultado = await usuarioService.atualizarNome(id, nome);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado",
      });
    }

    if (emailMudou) {
      await confirmacaoEmailService.enviarConfirmacao(atual, email);
      // Avisa o endereço antigo: se não foi a pessoa, ela fica sabendo.
      emailService
        .enviarAvisoTrocaEmail(atual.EMAIL, atual.NOME, email)
        .catch((e) => console.error("Falha ao avisar o e-mail antigo:", e.message));
    }

    return res.status(200).json({
      mensagem: "Usuário atualizado com sucesso",
      emailPendente: emailMudou ? email : null,
    });
  } catch (erro) {
    if (erro.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        erro: "E-mail já cadastrado",
      });
    }

    console.error("Erro ao atualizar usuário:", erro);
    return res.status(500).json({
      erro: "Erro ao atualizar usuário",
    });
  }
}

// Trocar a senha estando logada. Exige a senha atual, derruba as outras sessões
// e mantém só a deste aparelho.
async function trocarSenha(req, res) {
  try {
    const id = Number(req.user.id);
    const { senhaAtual, novaSenha } = req.body ?? {};

    if (typeof senhaAtual !== "string" || !senhaAtual || typeof novaSenha !== "string" || !novaSenha) {
      return res.status(400).json({ erro: "Informe a senha atual e a nova senha." });
    }

    if (!senhaEhForte(novaSenha)) {
      return res.status(400).json({ erro: MENSAGEM_SENHA });
    }

    const atual = await usuarioModel.buscarParaModeracao(id);
    if (!atual) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    if (!(await senhaConfere(senhaAtual, atual.SENHA))) {
      return res.status(403).json({ erro: "Senha atual incorreta." });
    }

    if (novaSenha === senhaAtual) {
      return res.status(400).json({ erro: "A nova senha precisa ser diferente da atual." });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 12);
    await usuarioModel.trocarSenha(id, senhaHash, Math.floor(Date.now() / 1000));

    // As sessões antigas morreram; cria uma nova só para este aparelho continuar logado.
    const sessao = await authService.iniciarSessao(atual);
    definirCookiesDeSessao(res, sessao);

    emailService
      .enviarAvisoSenhaAlterada(atual.EMAIL, atual.NOME)
      .catch((e) => console.error("Falha ao avisar a troca de senha:", e.message));

    return res.status(200).json({
      mensagem: "Senha alterada. As outras sessões foram encerradas.",
    });
  } catch (erro) {
    console.error("Erro ao trocar a senha:", erro);
    return res.status(500).json({ erro: "Erro ao trocar a senha" });
  }
}

async function deletarUsuario(req, res) {
  try {
    const id = idPositivo(req.params.id);

    if (!id || Number(req.user.id) !== id) {
      return res.status(403).json({
        erro: "Você não tem permissão para excluir esta conta",
      });
    }

    // Apagar a conta não tem volta: confirma com a senha.
    const atual = await usuarioModel.buscarParaModeracao(id);
    if (!atual) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    if (!(await senhaConfere(req.body?.senha, atual.SENHA))) {
      return res.status(403).json({ erro: "Senha incorreta." });
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
    console.error("Erro ao excluir usuário:", erro);
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
    console.error("Erro ao obter estatísticas do perfil:", erro);
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
  trocarSenha,
  deletarUsuario,
  obterEstatisticasMeuPerfil,
};
