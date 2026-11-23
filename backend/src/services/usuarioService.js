import bcrypt from "bcrypt";
import usuarioModel from "../models/usuarioModel.js";
import confirmacaoEmailModel from "../models/confirmacaoEmailModel.js";
import confirmacaoEmailService from "./confirmacaoEmailService.js";
import { VERSAO_TERMOS } from "../config/termos.js";

async function cadastrarUsuario(nome, email, senha) {
  const existente = await usuarioModel.buscarUsuarioPorEmail(email);

  // E-mail já tem conta confirmada (ou suspensa): não dá para cadastrar de novo.
  if (existente && (existente.EMAIL_CONFIRMADO_EM || existente.BANIDO_EM)) {
    throw new Error("E-mail já cadastrado");
  }

  // Cadastro ainda dentro do prazo de confirmação (24 h): NÃO é refeito. Quem tentar de novo
  // só recebe o link outra vez. Assim, ninguém troca a senha de um cadastro alheio que está
  // esperando confirmação (se o dono do e-mail clicar, a conta fica com a senha dele, não a de um intruso).
  if (existente && (await confirmacaoEmailModel.temLinkAtivo(existente.ID))) {
    await confirmacaoEmailService.enviarConfirmacao(existente, existente.EMAIL);
    return { id: existente.ID, nome: existente.NOME, email: existente.EMAIL };
  }

  const senhaCriptografada = await bcrypt.hash(senha, 12);
  let id;

  if (existente) {
    // Cadastro antigo que nunca foi confirmado e já expirou (ninguém conseguiu entrar nele): é refeito.
    await usuarioModel.refazerCadastroNaoConfirmado(existente.ID, nome, senhaCriptografada, VERSAO_TERMOS);
    id = existente.ID;
  } else {
    const resultado = await usuarioModel.cadastrarUsuario(nome, email, senhaCriptografada, VERSAO_TERMOS);
    id = resultado.insertId;
  }

  await confirmacaoEmailService.enviarConfirmacao({ ID: id, NOME: nome, EMAIL: email }, email);

  return { id, nome, email };
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

async function atualizarNome(id, nome) {
  return await usuarioModel.atualizarNome(id, nome);
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
  atualizarNome,
  deletarUsuario,
  buscarUsuarioPorEmail,
  obterEstatisticasUsuario,
};
