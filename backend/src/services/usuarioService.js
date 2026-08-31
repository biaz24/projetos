import bcrypt from "bcrypt";
import usuarioModel from "../models/usuarioModel.js";

async function cadastrarUsuario(nome, email, senha) {
  const usuarioExistente = await usuarioModel.buscarUsuarioPorEmail(email);
  if (usuarioExistente) {
    throw new Error("E-mail já cadastrado");
  }

  const senhaCriptografada = await bcrypt.hash(senha, 12);
  const resultado = await usuarioModel.cadastrarUsuario(
    nome,
    email,
    senhaCriptografada,
  );

  return {
    id: resultado.insertId,
    nome,
    email,
  };
}

async function listarUsuarios() {
  return await usuarioModel.listarUsuarios();
}

async function buscarUsuarioPorId(id) {
  return await usuarioModel.buscarUsuarioPorId(id);
}

async function atualizarUsuario(id, nome, email) {
  return await usuarioModel.atualizarUsuario(id, nome, email);
}

async function deletarUsuario(id) {
  return await usuarioModel.deletarUsuario(id);
}

async function buscarUsuarioPorEmail(email) {
  return await usuarioModel.buscarUsuarioPorEmail(email);
}

async function obterEstatisticasUsuario(usuarioId) {
  return await usuarioModel.obterEstatisticasUsuario(usuarioId);
}

export default {
  cadastrarUsuario,
  listarUsuarios,
  buscarUsuarioPorId,
  atualizarUsuario,
  deletarUsuario,
  buscarUsuarioPorEmail,
  obterEstatisticasUsuario,
};
