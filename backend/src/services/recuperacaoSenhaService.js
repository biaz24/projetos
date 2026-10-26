import crypto from "node:crypto";
import bcrypt from "bcrypt";
import usuarioModel from "../models/usuarioModel.js";
import recuperacaoSenhaModel from "../models/recuperacaoSenhaModel.js";
import emailService from "./emailService.js";
import env from "../config/env.js";

function gerarHash(token) {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

async function solicitarRecuperacao(email) {
  const usuario = await usuarioModel.buscarUsuarioPorEmail(email);

  // Resposta segura: não revela se o e-mail existe no sistema
  if (!usuario) {
    return;
  }

  await recuperacaoSenhaModel.invalidarTokensAnteriores(usuario.ID);

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = gerarHash(token);
  const expiraAt = new Date(Date.now() + 15 * 60 * 1000);

  await recuperacaoSenhaModel.criar(usuario.ID, tokenHash, expiraAt);

  const link = `${env.frontendUrl}/redefinir-senha?token=${token}`;

  // Sem await: o tempo de resposta não pode mudar conforme o e-mail existir ou não,
  // e uma falha no envio não pode virar um erro visível só para e-mails cadastrados.
  emailService
    .enviarEmailRecuperacaoSenha(usuario.EMAIL, usuario.NOME, link)
    .catch((erro) => {
      console.error("Falha ao enviar e-mail de recuperação:", erro.message);
    });
}

async function validarToken(token) {
  if (typeof token !== "string" || !token.trim()) {
    return false;
  }

  const registro = await recuperacaoSenhaModel.buscarTokenValido(
    gerarHash(token),
  );

  return Boolean(registro);
}

async function redefinirSenha(token, novaSenha) {
  const senhaHash = await bcrypt.hash(novaSenha, 12);

  return await recuperacaoSenhaModel.consumirTokenEAtualizarSenha(
    gerarHash(token),
    senhaHash,
  );
}

export default {
  solicitarRecuperacao,
  validarToken,
  redefinirSenha,
};
