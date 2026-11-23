import crypto from "node:crypto";
import usuarioModel from "../models/usuarioModel.js";
import confirmacaoEmailModel from "../models/confirmacaoEmailModel.js";
import emailService from "./emailService.js";
import env from "../config/env.js";

const VALIDADE_MS = 24 * 60 * 60 * 1000;

function gerarHash(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Cria o link e manda por e-mail para "emailAlvo".
// - cadastro: emailAlvo é o próprio e-mail da conta
// - troca de e-mail: emailAlvo é o endereço NOVO (a conta só muda quando ele for confirmado)
async function enviarConfirmacao(usuario, emailAlvo) {
  await confirmacaoEmailModel.apagarDoUsuario(usuario.ID);

  const token = crypto.randomBytes(32).toString("hex");
  await confirmacaoEmailModel.criar(
    usuario.ID,
    gerarHash(token),
    emailAlvo,
    new Date(Date.now() + VALIDADE_MS),
  );

  const link = `${env.frontendUrl}/confirmar-email?token=${token}`;
  const troca = emailAlvo !== usuario.EMAIL;

  // Sem await: a resposta não depende do e-mail e uma falha de envio não derruba o cadastro
  // (a pessoa pode pedir o reenvio).
  emailService
    .enviarEmailConfirmacao(emailAlvo, usuario.NOME, link, { troca })
    .catch((erro) => console.error("Falha ao enviar e-mail de confirmação:", erro.message));
}

// Resultado: { ok: true, troca } ou { ok: false, motivo: "invalido" | "em_uso" }
async function confirmar(token) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token.trim())) {
    return { ok: false, motivo: "invalido" };
  }

  const registro = await confirmacaoEmailModel.buscarValido(gerarHash(token.trim()));
  if (!registro) return { ok: false, motivo: "invalido" };

  // Só uma pessoa consegue "gastar" o link
  if (!(await confirmacaoEmailModel.consumir(registro.ID))) {
    return { ok: false, motivo: "invalido" };
  }

  const usuario = await usuarioModel.buscarParaModeracao(registro.USUARIOS_ID);
  if (!usuario || usuario.BANIDO_EM) return { ok: false, motivo: "invalido" };

  if (registro.EMAIL === usuario.EMAIL) {
    await usuarioModel.marcarEmailConfirmado(usuario.ID);
    return { ok: true, troca: false };
  }

  try {
    await usuarioModel.trocarEmailConfirmado(usuario.ID, registro.EMAIL);
  } catch (erro) {
    // Alguém cadastrou este e-mail enquanto o link estava no ar.
    if (erro.code === "ER_DUP_ENTRY") return { ok: false, motivo: "em_uso" };
    throw erro;
  }
  return { ok: true, troca: true };
}

// Reenvio: a resposta é sempre a mesma (não revela se o e-mail tem conta).
async function reenviar(email) {
  const usuario = await usuarioModel.buscarUsuarioPorEmail(email);
  if (!usuario || usuario.BANIDO_EM || usuario.EMAIL_CONFIRMADO_EM) return;
  await enviarConfirmacao(usuario, usuario.EMAIL);
}

export default { enviarConfirmacao, confirmar, reenviar };
