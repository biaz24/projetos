//depois do model vem o service

// Controller
//       ↓
// Service
//       ↓
// Model
//       ↓
// Banco

//vamos usar as funções do Model
// é onde fica as regras de negocio

import bcrypt from "bcrypt";
import usuarioModel from "../models/usuarioModel.js";

async function cadastrarUsuario(nome, email, senha) {
  const senhaCriptografada = await bcrypt.hash(senha, 10);
  return await usuarioModel.cadastrarUsuario(nome, email, senhaCriptografada);
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

export default {
  cadastrarUsuario,
  listarUsuarios,
  buscarUsuarioPorId,
  atualizarUsuario,
  deletarUsuario,
  buscarUsuarioPorEmail,
};
