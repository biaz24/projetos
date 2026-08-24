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
    throw new Error("Usuário não encontrado");
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.SENHA);

  if (!senhaCorreta) {
    throw new Error("Senha incorreta");
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
    },
  };
}

async function me(id) {
  const usuario = await usuarioService.buscarUsuarioPorId(id);

  if (!usuario) {
    throw new Error("Usuário não encontrado");
  }

  return usuario;
}

async function refresh(token) {
  if (!token) {
    throw new Error("Refresh token não informado");
  }

  const decoded = verifyRefreshToken(token);

  const existente = await refreshTokenModel.buscarPorToken(token);
  if (!existente) {
    throw new Error("Refresh token inválido");
  }

  const novoAccessToken = generateAccessToken({
    id: decoded.id,
    email: decoded.email,
  });

  return novoAccessToken;
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
