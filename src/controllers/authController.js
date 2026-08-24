import authService from "../services/authService.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        erro: "Email e senha são obrigatórios",
      });
    }

    const { accessToken, refreshToken, usuario } = await authService.login(
      email,
      senha,
    );

    res.cookie("accessToken", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutos
    });

    res.cookie("refreshToken", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });

    return res.status(200).json({
      mensagem: "Login realizado com sucesso",
      usuario,
    });
  } catch (erro) {
    console.error(erro);

    return res.status(401).json({
      erro: erro.message || "Erro ao realizar login",
    });
  }
}

async function me(req, res) {
  try {
    const { id } = req.user;
    const usuario = await authService.me(id);

    return res.status(200).json({ usuario });
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: "Erro ao buscar usuário logado",
    });
  }
}

async function refresh(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    const novoAccessToken = await authService.refresh(refreshToken);

    res.cookie("accessToken", novoAccessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });

    return res.status(200).json({
      mensagem: "Token atualizado com sucesso",
    });
  } catch (erro) {
    console.error(erro);

    return res.status(401).json({
      erro: "Refresh token inválido ou expirado",
    });
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
    console.error(erro);

    return res.status(500).json({
      erro: "Erro ao realizar logout",
    });
  }
}

export default {
  login,
  me,
  refresh,
  logout,
};
