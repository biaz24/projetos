import rascunhoService from "../services/rascunhoService.js";
import { textoComLimite, idPositivo } from "../utils/validacao.js";

const TITULO_MAX = 100; // limite da coluna TITULO no banco
const DESCRICAO_MAX = 5000;

// Retorna { titulo, descricao } limpos ou null se algo estiver inválido.
function lerCamposDoRascunho(body) {
  const titulo = textoComLimite((body ?? {}).titulo, { min: 1, max: TITULO_MAX });
  const descricao = textoComLimite((body ?? {}).descricao, { min: 1, max: DESCRICAO_MAX });
  return titulo && descricao ? { titulo, descricao } : null;
}

const MSG_CAMPOS = `Título (até ${TITULO_MAX} caracteres) e descrição (até ${DESCRICAO_MAX}) são obrigatórios`;

async function criarRascunho(req, res) {
  try {
    const usuarioId = req.user.id;
    const campos = lerCamposDoRascunho(req.body);

    if (!campos) {
      return res.status(400).json({ erro: MSG_CAMPOS });
    }

    const resultado = await rascunhoService.criarRascunho(
      usuarioId,
      campos.titulo,
      campos.descricao,
    );

    return res.status(201).json({
      mensagem: "Rascunho salvo com sucesso",
      id: resultado.insertId,
    });
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao salvar rascunho" });
  }
}

async function listarMeusRascunhos(req, res) {
  try {
    const usuarioId = req.user.id;
    const rascunhos = await rascunhoService.listarRascunhosPorUsuario(usuarioId);

    return res.status(200).json(rascunhos);
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao buscar rascunhos" });
  }
}

async function atualizarRascunho(req, res) {
  try {
    const usuarioId = req.user.id;
    const id = idPositivo(req.params.id);

    if (!id) {
      return res.status(400).json({ erro: "ID do rascunho inválido" });
    }

    const rascunhoExistente = await rascunhoService.buscarPorId(id);
    if (!rascunhoExistente) {
      return res.status(404).json({ erro: "Rascunho não encontrado" });
    }

    if (String(rascunhoExistente.USUARIOS_ID) !== String(usuarioId)) {
      return res.status(403).json({ erro: "Sem permissão para alterar este rascunho" });
    }

    const campos = lerCamposDoRascunho(req.body);
    if (!campos) {
      return res.status(400).json({ erro: MSG_CAMPOS });
    }

    await rascunhoService.atualizarRascunho(id, campos.titulo, campos.descricao);

    return res.status(200).json({ mensagem: "Rascunho atualizado com sucesso" });
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao atualizar rascunho" });
  }
}

async function deletarRascunho(req, res) {
  try {
    const usuarioId = req.user.id;
    const id = idPositivo(req.params.id);

    if (!id) {
      return res.status(400).json({ erro: "ID do rascunho inválido" });
    }

    const rascunhoExistente = await rascunhoService.buscarPorId(id);
    if (!rascunhoExistente) {
      return res.status(404).json({ erro: "Rascunho não encontrado" });
    }

    if (String(rascunhoExistente.USUARIOS_ID) !== String(usuarioId)) {
      return res.status(403).json({ erro: "Sem permissão para excluir este rascunho" });
    }

    await rascunhoService.deletarRascunho(id);

    return res.status(200).json({ mensagem: "Rascunho excluído com sucesso" });
  } catch (erro) {
    return res.status(500).json({ erro: "Erro ao excluir rascunho" });
  }
}

export default {
  criarRascunho,
  listarMeusRascunhos,
  atualizarRascunho,
  deletarRascunho,
};
