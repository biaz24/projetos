import bcrypt from "bcrypt";
import usuarioModel from "../models/usuarioModel.js";
import logModeracaoModel from "../models/logModeracaoModel.js";
import { textoComLimite, ehTexto } from "../utils/validacao.js";

// Medidas extremas contra uma conta: BANIR (a pessoa não entra mais, os dados ficam guardados)
// e EXCLUIR (apaga a conta e tudo que é dela, sem volta).
// Nenhuma das duas acontece de uma vez: o servidor exige várias confirmações juntas.

const ACOES = ["banir", "excluir"];
const MOTIVO_MIN = 20;
const MOTIVO_MAX = 500;

function lerId(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Por que esta medida não pode ser aplicada a este usuário? (null = pode)
function impedimento(admin, alvo) {
  if (!alvo) return { status: 404, erro: "Usuário não encontrado" };
  if (Number(alvo.ID) === Number(admin.ID)) {
    return { status: 403, erro: "Você não pode aplicar esta medida à sua própria conta." };
  }
  if (alvo.TIPO === "admin") {
    return {
      status: 403,
      erro: "Contas de administrador não podem ser banidas ou excluídas por aqui.",
    };
  }
  return null;
}

async function resumo(req, res) {
  try {
    const id = lerId(req.params.id);
    if (!id) return res.status(400).json({ erro: "Usuário inválido" });

    const alvo = await usuarioModel.buscarParaModeracao(id);
    const bloqueio = impedimento({ ID: req.user.id }, alvo);
    if (bloqueio) return res.status(bloqueio.status).json({ erro: bloqueio.erro });

    const conteudo = await usuarioModel.contarConteudo(id);

    return res.status(200).json({
      usuario: {
        id: alvo.ID,
        nome: alvo.NOME,
        banido: Boolean(alvo.BANIDO_EM),
        banido_em: alvo.BANIDO_EM,
        motivo_banimento: alvo.MOTIVO_BANIMENTO,
        created_at: alvo.CREATED_AT,
      },
      conteudo,
    });
  } catch (erro) {
    console.error("Erro ao montar o resumo do usuário:", erro);
    return res.status(500).json({ erro: "Erro ao buscar o usuário" });
  }
}

// Confere a senha do administrador que está pedindo a ação.
async function senhaDoAdminConfere(adminId, senha) {
  if (!ehTexto(senha) || !senha || senha.length > 1000) return false;
  const admin = await usuarioModel.buscarParaModeracao(adminId);
  if (!admin) return false;
  return bcrypt.compare(senha, admin.SENHA);
}

async function aplicarPenalidade(req, res) {
  try {
    const id = lerId(req.params.id);
    if (!id) return res.status(400).json({ erro: "Usuário inválido" });

    const { acao, motivo, confirmacaoNome, senhaAdmin, entendoQueNaoDesfaz, denunciaId } =
      req.body ?? {};

    if (!ACOES.includes(acao)) {
      return res.status(400).json({ erro: "Escolha banir ou excluir." });
    }

    const motivoLimpo = textoComLimite(motivo, { min: MOTIVO_MIN, max: MOTIVO_MAX });
    if (!motivoLimpo) {
      return res.status(400).json({
        erro: `Explique o motivo com ${MOTIVO_MIN} a ${MOTIVO_MAX} caracteres. Ele fica registrado.`,
      });
    }

    if (acao === "excluir" && entendoQueNaoDesfaz !== true) {
      return res.status(400).json({ erro: "Confirme que entende que a exclusão não tem volta." });
    }

    const alvo = await usuarioModel.buscarParaModeracao(id);
    const bloqueio = impedimento({ ID: req.user.id }, alvo);
    if (bloqueio) return res.status(bloqueio.status).json({ erro: bloqueio.erro });

    if (acao === "banir" && alvo.BANIDO_EM) {
      return res.status(409).json({ erro: "Este usuário já está banido." });
    }

    // Confirmação 1: digitar o nome exato da pessoa.
    if (
      !ehTexto(confirmacaoNome) ||
      confirmacaoNome.trim().toLowerCase() !== String(alvo.NOME).trim().toLowerCase()
    ) {
      return res.status(400).json({ erro: "O nome digitado não confere com o do usuário." });
    }

    // Confirmação 2: a senha de quem está decidindo.
    if (!(await senhaDoAdminConfere(req.user.id, senhaAdmin))) {
      return res.status(403).json({ erro: "Sua senha não confere." });
    }

    const conteudo = await usuarioModel.contarConteudo(id);
    // O registro guarda o que era a conta, porque depois de excluída não dá para consultar.
    const detalhe = `${acao === "banir" ? "Banido" : "Excluído"}: usuário #${alvo.ID} (${alvo.NOME}), ` +
      `${conteudo.ideias} ideia(s), ${conteudo.comentarios} comentário(s). Motivo: ${motivoLimpo}`;

    if (acao === "banir") {
      await usuarioModel.banirUsuario(id, motivoLimpo);
    } else {
      await usuarioModel.deletarUsuario(id);
    }

    await logModeracaoModel.registrar(
      req.user.id,
      acao === "banir" ? "usuario_banido" : "usuario_excluido",
      { denunciaId: lerId(denunciaId), detalhe },
    );

    return res.status(200).json({
      mensagem: acao === "banir" ? "Usuário banido." : "Usuário excluído.",
    });
  } catch (erro) {
    console.error("Erro ao aplicar a medida ao usuário:", erro);
    return res.status(500).json({ erro: "Erro ao aplicar a medida" });
  }
}

async function desbanir(req, res) {
  try {
    const id = lerId(req.params.id);
    if (!id) return res.status(400).json({ erro: "Usuário inválido" });

    const alvo = await usuarioModel.buscarParaModeracao(id);
    const bloqueio = impedimento({ ID: req.user.id }, alvo);
    if (bloqueio) return res.status(bloqueio.status).json({ erro: bloqueio.erro });

    if (!alvo.BANIDO_EM) {
      return res.status(409).json({ erro: "Este usuário não está banido." });
    }

    const { senhaAdmin, motivo } = req.body ?? {};
    const motivoLimpo = textoComLimite(motivo, { min: 5, max: MOTIVO_MAX });
    if (!motivoLimpo) {
      return res.status(400).json({ erro: "Explique por que a conta está sendo liberada." });
    }

    if (!(await senhaDoAdminConfere(req.user.id, senhaAdmin))) {
      return res.status(403).json({ erro: "Sua senha não confere." });
    }

    await usuarioModel.desbanirUsuario(id);
    await logModeracaoModel.registrar(req.user.id, "usuario_desbanido", {
      detalhe: `Liberado: usuário #${alvo.ID} (${alvo.NOME}). Motivo: ${motivoLimpo}`,
    });

    return res.status(200).json({ mensagem: "Usuário liberado." });
  } catch (erro) {
    console.error("Erro ao desbanir usuário:", erro);
    return res.status(500).json({ erro: "Erro ao liberar o usuário" });
  }
}

export default { resumo, aplicarPenalidade, desbanir };
