import recuperacaoSenhaService from "../services/recuperacaoSenhaService.js";

async function solicitarRecuperacao(req, res) {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim() || email.length > 254) {
      return res.status(400).json({
        erro: "Informe um e-mail válido.",
      });
    }

    await recuperacaoSenhaService.solicitarRecuperacao(email.trim());

    return res.status(200).json({
      mensagem:
        "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.",
    });
  } catch (erro) {
    console.error("Erro ao solicitar recuperação de senha:", erro);

    return res.status(500).json({
      erro: "Não foi possível processar a solicitação.",
    });
  }
}

async function redefinirSenha(req, res) {
  try {
    const { token, novaSenha } = req.body;

    if (
      typeof token !== "string" ||
      !token.trim() ||
      typeof novaSenha !== "string" ||
      novaSenha.length < 8 ||
      novaSenha.length > 128
    ) {
      return res.status(400).json({
        erro: "Informe um token e uma senha com pelo menos 8 caracteres.",
      });
    }

    const resultado = await recuperacaoSenhaService.redefinirSenha(
      token,
      novaSenha,
    );

    return res.status(200).json(resultado);
  } catch (erro) {
    if (erro.message === "Token inválido ou expirado.") {
      return res.status(400).json({
        erro: "O link de recuperação é inválido ou expirou.",
      });
    }

    console.error("Erro ao redefinir senha:", erro);

    return res.status(500).json({
      erro: "Não foi possível redefinir a senha.",
    });
  }
}

export default {
  solicitarRecuperacao,
  redefinirSenha,
};
