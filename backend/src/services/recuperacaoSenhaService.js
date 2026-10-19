import crypto from "node:crypto";
import usuarioModel from "../models/usuarioModel.js";
import recuperacaoSenhaModel from "../models/recuperacaoSenhaModel.js";
import emailService from "./emailService.js";
import bcrypt from "bcrypt";

async function solicitarRecuperacao(email) {
  const usuario = await usuarioModel.buscarUsuarioPorEmail(email);

  // Não revela se o e-mail existe no sistema.
  if (!usuario) {
    return;
  }
  await recuperacaoSenhaModel.invalidarTokensAnteriores(usuario.ID);

  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const expiraAt = new Date(Date.now() + 15 * 60 * 1000);

  await recuperacaoSenhaModel.criar(usuario.ID, tokenHash, expiraAt);

  const link = `http://localhost:5173/redefinir-senha?token=${token}`;

  await emailService.enviarEmail(
    usuario.EMAIL,
    "Recuperação de senha",
    `Olá, ${usuario.NOME}!\n\n` +
      `Recebemos uma solicitação para redefinir sua senha.\n\n` +
      `Acesse este link em até 15 minutos:\n${link}\n\n` +
      `Se você não solicitou a recuperação, ignore este e-mail.`,
  );
}

async function redefinirSenha(token, novaSenha) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const senhaHash = await bcrypt.hash(novaSenha, 12);

  return await recuperacaoSenhaModel.consumirTokenEAtualizarSenha(
    tokenHash,
    senhaHash,
  );
}

export default {
  solicitarRecuperacao,
  redefinirSenha,
};
