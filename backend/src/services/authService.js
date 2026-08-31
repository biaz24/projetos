import bcrypt from "bcrypt";
import usuarioService from "./usuarioService.js";
import refreshTokenModel from "../models/refreshTokenModel.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../config/token.js";

async function login(email, senha) {
  const usuario = await usuarioService.buscarUsuarioPorEmail(email);

  if (!usuario) {
    throw new Error("Credenciais inválidas");
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.SENHA);

  if (!senhaCorreta) {
    throw new Error("Credenciais inválidas");
  }

  const payload = { id: usuario.ID, email: usuario.EMAIL };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await refreshTokenModel.salvarRefreshToken(usuario.ID, refreshToken, expiresAt);

  return {
    accessToken,
    refreshToken,
    usuario: {
      id: usuario.ID,
      nome: usuario.NOME,
      email: usuario.EMAIL,
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

  // 1. Remove o token antigo do banco (Token Rotation)
  await refreshTokenModel.apagarPorToken(oldToken);

  // 2. Gera novo par de tokens
  const payload = { id: decoded.id, email: decoded.email };
  const novoAccessToken = generateAccessToken(payload);
  const novoRefreshToken = generateRefreshToken(payload);

  // 3. Salva novo refresh token no banco
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await refreshTokenModel.salvarRefreshToken(decoded.id, novoRefreshToken, expiresAt);

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
  me,
  refresh,
  logout,
};
