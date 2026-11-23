import authService, {
  MSG_CONTA_SUSPENSA,
  MSG_EMAIL_NAO_CONFIRMADO,
} from "../services/authService.js";
import confirmacaoEmailService from "../services/confirmacaoEmailService.js";
import { normalizarEmail } from "../utils/validacao.js";
import { COOKIE_OPTIONS, definirCookiesDeSessao } from "../utils/cookiesSessao.js";

// Mensagens que o authService cria de propósito e que podem ser mostradas ao usuário.
const ERROS_DE_REFRESH_CONHECIDOS = new Set([
  "Refresh token não informado",
  "Refresh token inválido ou expirado",
  "Sessão revogada por motivos de segurança",
]);

async function login(req, res) {
  try {
    const { email, senha } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof senha !== "string" ||
      !email.trim() ||
      !senha ||
      email.length > 254 ||
      senha.length > 1000
    ) {
      return res.status(400).json({
        erro: "Email e senha são obrigatórios",
      });
    }

    const { accessToken, refreshToken, usuario } = await authService.login(
      email.trim(),
      senha,
    );

    definirCookiesDeSessao(res, { accessToken, refreshToken });

    return res.status(200).json({
      mensagem: "Login realizado com sucesso",
      usuario,
    });
  } catch (erro) {
    if (erro.message === "Credenciais inválidas") {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    if (erro.message === MSG_EMAIL_NAO_CONFIRMADO) {
      // "codigo" deixa a tela de login oferecer o botão de reenviar o e-mail.
      return res.status(403).json({ erro: MSG_EMAIL_NAO_CONFIRMADO, codigo: "EMAIL_NAO_CONFIRMADO" });
    }

    if (erro.message === MSG_CONTA_SUSPENSA) {
      return res.status(403).json({ erro: MSG_CONTA_SUSPENSA });
    }

    // Qualquer outro erro (banco fora do ar etc.) fica só no log do servidor.
    console.error("Erro ao realizar login:", erro);
    return res.status(500).json({
      erro: "Erro ao realizar login",
    });
  }
}

async function me(req, res) {
  try {
    const { id } = req.user;
    const usuario = await authService.me(id);

    return res.status(200).json({ usuario });
  } catch (erro) {
    return res.status(500).json({
      erro: "Erro ao buscar usuário logado",
    });
  }
}

async function refresh(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    const { accessToken: novoAccessToken, refreshToken: novoRefreshToken } =
      await authService.refresh(refreshToken);

    definirCookiesDeSessao(res, {
      accessToken: novoAccessToken,
      refreshToken: novoRefreshToken,
    });

    return res.status(200).json({
      mensagem: "Token atualizado com sucesso",
    });
  } catch (erro) {
    res.clearCookie("accessToken", COOKIE_OPTIONS);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);

    const mensagem = ERROS_DE_REFRESH_CONHECIDOS.has(erro.message)
      ? erro.message
      : "Refresh token inválido ou expirado";

    if (!ERROS_DE_REFRESH_CONHECIDOS.has(erro.message)) {
      console.error("Erro ao renovar token:", erro);
    }

    return res.status(401).json({ erro: mensagem });
  }
}

async function logout(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    await authService.logout(refreshToken);

    res.clearCookie("accessToken", COOKIE_OPTIONS);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);

    return res.status(200).json({
      mensagem: "Logout realizado com sucesso",
    });
  } catch (erro) {
    res.clearCookie("accessToken", COOKIE_OPTIONS);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);

    return res.status(500).json({
      erro: "Erro ao realizar logout",
    });
  }
}

// O link do e-mail abre a página do site, que chama esta rota (POST, para
// programas de varredura de e-mail não "gastarem" o link só de abri-lo).
async function confirmarEmail(req, res) {
  try {
    const resultado = await confirmacaoEmailService.confirmar(req.body?.token);

    if (!resultado.ok) {
      return res.status(resultado.motivo === "em_uso" ? 409 : 400).json({
        erro:
          resultado.motivo === "em_uso"
            ? "Este e-mail já foi cadastrado por outra conta."
            : "Link inválido ou expirado. Peça um novo na tela de login.",
      });
    }

    return res.status(200).json({
      mensagem: resultado.troca ? "Novo e-mail confirmado." : "E-mail confirmado. Agora é só entrar.",
      troca: resultado.troca,
    });
  } catch (erro) {
    console.error("Erro ao confirmar e-mail:", erro);
    return res.status(500).json({ erro: "Erro ao confirmar e-mail" });
  }
}

// Resposta idêntica exista a conta ou não.
async function reenviarConfirmacao(req, res) {
  try {
    const email = normalizarEmail(req.body?.email);
    if (email) await confirmacaoEmailService.reenviar(email);
  } catch (erro) {
    console.error("Erro ao reenviar confirmação de e-mail:", erro);
  }
  return res.status(200).json({
    mensagem: "Se existir uma conta aguardando confirmação para este e-mail, enviamos um novo link.",
  });
}

export default {
  confirmarEmail,
  reenviarConfirmacao,
  login,
  me,
  refresh,
  logout,
};
