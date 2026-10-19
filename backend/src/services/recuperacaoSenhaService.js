import crypto from "node:crypto";
import bcrypt from "bcrypt";
import usuarioModel from "../models/usuarioModel.js";
import recuperacaoSenhaModel from "../models/recuperacaoSenhaModel.js";
import emailService from "./emailService.js";
import env from "../config/env.js";

async function solicitarRecuperacao(email) {
  const usuario = await usuarioModel.buscarUsuarioPorEmail(email);

  // Resposta segura: não revela se o e-mail existe no sistema
  if (!usuario) {
    return;
  }

  await recuperacaoSenhaModel.invalidarTokensAnteriores(usuario.ID);

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiraAt = new Date(Date.now() + 15 * 60 * 1000);

  await recuperacaoSenhaModel.criar(usuario.ID, tokenHash, expiraAt);

  const link = `${env.frontendUrl}/redefinir-senha?token=${token}`;

  await emailService.enviarEmailRecuperacaoSenha(
    usuario.EMAIL,
    usuario.NOME,
    link,
  );
}

async function validarToken(token) {
  if (typeof token !== "string" || !token.trim()) {
    return false;
  }

  const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");
  const registro = await recuperacaoSenhaModel.buscarTokenValido(tokenHash);

  return Boolean(registro);
}

async function redefinirSenha(token, novaSenha) {
  const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");
  const senhaHash = await bcrypt.hash(novaSenha, 12);

  return await recuperacaoSenhaModel.consumirTokenEAtualizarSenha(
    tokenHash,
    senhaHash,
  );
}

export default {
  solicitarRecuperacao,
  validarToken,
  redefinirSenha,
};
