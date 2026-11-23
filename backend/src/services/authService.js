import bcrypt from "bcrypt";
import usuarioService from "./usuarioService.js";
import connection from "../database/connection.js";
import refreshTokenModel from "../models/refreshTokenModel.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../config/token.js";

export const MSG_CONTA_SUSPENSA =
  "Esta conta foi suspensa pela moderação. Se acredita que foi um engano, entre em contato com o suporte.";

export const MSG_EMAIL_NAO_CONFIRMADO =
  "Confirme seu e-mail para entrar. Enviamos um link para a sua caixa de entrada.";

// Hash de mentira, usado quando o e-mail não existe: o servidor gasta o mesmo tempo
// conferindo a senha. Sem isso, "e-mail inexistente" responde bem mais rápido e
// dá para descobrir quem tem conta medindo o tempo de resposta.
let hashFalso = null;
function obterHashFalso() {
  hashFalso ??= bcrypt.hash("senha-que-nunca-sera-usada", 12);
  return hashFalso;
}

// Gera o par de tokens e guarda o refresh token. Usado no login e na troca de senha.
async function iniciarSessao(usuario) {
  const payload = { id: usuario.ID, email: usuario.EMAIL, tipo: usuario.TIPO };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await refreshTokenModel.salvarRefreshToken(usuario.ID, refreshToken, expiresAt);

  return { accessToken, refreshToken };
}

async function login(email, senha) {
  if (typeof senha !== "string" || senha.length === 0 || senha.length > 200) {
    await bcrypt.compare("x", await obterHashFalso());
    throw new Error("Credenciais inválidas");
  }

  const usuario = await usuarioService.buscarUsuarioPorEmail(email);

  if (!usuario) {
    await bcrypt.compare(senha, await obterHashFalso());
    throw new Error("Credenciais inválidas");
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.SENHA);

  if (!senhaCorreta) {
    throw new Error("Credenciais inválidas");
  }

  // Só avisa que a conta está suspensa depois de a senha estar certa (não revela quem tem conta).
  if (usuario.BANIDO_EM) {
    throw new Error(MSG_CONTA_SUSPENSA);
  }

  // Conta nova só entra depois de clicar no link enviado por e-mail.
  if (!usuario.EMAIL_CONFIRMADO_EM) {
    throw new Error(MSG_EMAIL_NAO_CONFIRMADO);
  }

  const { accessToken, refreshToken } = await iniciarSessao(usuario);

  return {
    accessToken,
    refreshToken,
    usuario: {
      id: usuario.ID,
      nome: usuario.NOME,
      email: usuario.EMAIL,
      tipo: usuario.TIPO,
      created_at: usuario.CREATED_AT,
    },
  };
}

async function me(id) {
  const usuario = await usuarioService.buscarUsuarioPorId(id);

  if (!usuario) {
    throw new Error("Usuário não encontrado");
  }

  return {
    id: usuario.id || usuario.ID,
    nome: usuario.nome || usuario.NOME,
    email: usuario.email || usuario.EMAIL,
    tipo: usuario.tipo || usuario.TIPO,
    created_at: usuario.created_at || usuario.CREATED_AT,
  };
}

/**
 * Realiza a rotação do Refresh Token (Token Rotation):
 * - Valida a assinatura JWT do refresh token.
 * - Busca no banco. Se não encontrar (token já usado/revogado), invalida TODAS as sessões do usuário por segurança.
 * - Exclui o token antigo do banco.
 * - Emite um NOVO Access Token E um NOVO Refresh Token.
 * - Salva o novo Refresh Token no banco.
 */
async function refresh(oldToken) {
  if (!oldToken) {
    throw new Error("Refresh token não informado");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(oldToken);
  } catch (err) {
    throw new Error("Refresh token inválido ou expirado");
  }

  const tokenExistente = await refreshTokenModel.buscarPorToken(oldToken);

  if (!tokenExistente) {
    // ALERTA DE SEGURANÇA: Token válido mas que não está no banco (possível reuso/roubo de token!)
    // Revoga todas as sessões do usuário preventivamente.
    await refreshTokenModel.apagarTodosDoUsuario(decoded.id);
    throw new Error("Sessão revogada por motivos de segurança");
  }

  // Conta banida ou apagada não renova sessão.
  const [donos] = await connection.query(
    "SELECT EMAIL, TIPO, BANIDO_EM FROM USUARIOS WHERE ID = ?",
    [decoded.id],
  );
  if (donos.length === 0 || donos[0].BANIDO_EM) {
    await refreshTokenModel.apagarTodosDoUsuario(decoded.id);
    throw new Error("Sessão revogada por motivos de segurança");
  }

  // 1. Remove o token antigo do banco (Token Rotation)
  await refreshTokenModel.apagarPorToken(oldToken);

  // 2. Gera novo par de tokens
  // E-mail e tipo vêm do banco (podem ter mudado desde a emissão do token antigo).
  const payload = {
    id: decoded.id,
    email: donos[0].EMAIL,
    tipo: donos[0].TIPO,
  };
  const novoAccessToken = generateAccessToken(payload);
  const novoRefreshToken = generateRefreshToken(payload);

  // 3. Salva novo refresh token no banco
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await refreshTokenModel.salvarRefreshToken(
    decoded.id,
    novoRefreshToken,
    expiresAt,
  );

  return {
    accessToken: novoAccessToken,
    refreshToken: novoRefreshToken,
  };
}

async function logout(token) {
  if (token) {
    await refreshTokenModel.apagarPorToken(token);
  }
}

export default {
  login,
  iniciarSessao,
  me,
  refresh,
  logout,
};
