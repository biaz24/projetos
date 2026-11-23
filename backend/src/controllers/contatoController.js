import contatoService from "../services/contatoService.js";
import ideiaService from "../services/ideiaService.js";
import notificacaoService from "../services/notificacaoService.js";
import logModeracaoModel from "../models/logModeracaoModel.js";
import { textoComLimite, idPositivo } from "../utils/validacao.js";
import { ideiaEstaPublica } from "../utils/ideiaPublica.js";
import {
  notificacaoContatoPedido,
  notificacaoContatoAceito,
  notificacaoContatoRecusado,
  notificacaoContatoEncerrado,
} from "../utils/mensagensNotificacao.js";

const PEDIDO_MIN = 5;
const MENSAGEM_MAX = 1000;
const MOTIVO_MAX = 100;
const DESCRICAO_MAX = 2000;
const JUSTIFICATIVA_MIN = 3;
const JUSTIFICATIVA_MAX = 1000;
const MAX_PEDIDOS_PENDENTES = 10; // contra spam: quantos pedidos sem resposta uma pessoa pode ter
const NOME_AUTOR_ANONIMO = "Autor anônimo";

const MEDIDAS_CONVERSA = ["Nenhuma", "Encerrar conversa"];

const erroInterno = (res, erro, mensagem) => {
  console.error(mensagem, erro);
  return res.status(500).json({ erro: mensagem });
};

const ehIgual = (a, b) => Number(a) === Number(b);

function souAutorDoContato(contato, usuarioId) {
  return ehIgual(contato.AUTOR_ID, usuarioId);
}

function ehParticipante(contato, usuarioId) {
  return ehIgual(contato.AUTOR_ID, usuarioId) || ehIgual(contato.INTERESSADO_ID, usuarioId);
}

// O que cada participante pode ver sobre a conversa.
// Nunca devolve ids nem e-mails: se a ideia for anônima, o interessado jamais descobre quem é o autor.
function visaoDoContato(contato, usuarioId) {
  const souAutor = souAutorDoContato(contato, usuarioId);

  return {
    ID: contato.ID,
    IDEIAS_ID: contato.IDEIAS_ID,
    IDEIA_TITULO: contato.IDEIA_TITULO,
    STATUS: contato.STATUS,
    PAPEL: souAutor ? "autor" : "interessado",
    OUTRO_NOME: souAutor
      ? contato.INTERESSADO_NOME
      : contato.ANONIMO
        ? NOME_AUTOR_ANONIMO
        : contato.AUTOR_NOME,
    CREATED_AT: contato.CREATED_AT,
    UPDATED_AT: contato.UPDATED_AT,
  };
}

// Devolve o contato se o usuário participa dele; senão responde 404 (não revela que existe).
async function carregarContatoDoParticipante(req, res) {
  const id = idPositivo(req.params.id);

  if (!id) {
    res.status(400).json({ erro: "ID da conversa inválido" });
    return null;
  }

  const contato = await contatoService.buscarPorId(id);

  if (!contato || !ehParticipante(contato, req.user.id)) {
    res.status(404).json({ erro: "Conversa não encontrada" });
    return null;
  }

  return contato;
}

const MENSAGEM_POR_STATUS = {
  Pendente: "Você já enviou um pedido para esta ideia. Aguarde a resposta do autor.",
  Aceito: "Você já tem uma conversa aberta com o autor desta ideia. Veja em Conversas.",
  Recusado: "O autor já respondeu ao seu pedido para esta ideia.",
  Encerrado: "Você já teve uma conversa sobre esta ideia, que foi encerrada.",
};

// ---------------------------------------------------------------- pedido de contato

async function criarContato(req, res) {
  try {
    const usuarioId = req.user.id;
    const body = req.body ?? {};

    const ideiaId = idPositivo(body.ideiaId);
    const texto = textoComLimite(body.mensagem, { min: PEDIDO_MIN, max: MENSAGEM_MAX });

    if (!ideiaId || !texto) {
      return res.status(400).json({
        erro: `Escreva uma mensagem para o autor (de ${PEDIDO_MIN} a ${MENSAGEM_MAX} caracteres)`,
      });
    }

    const ideia = await ideiaService.buscarIdeiaPorId(ideiaId);

    // Ideia oculta ou em revisão não recebe pedidos: ninguém além do autor a enxerga.
    if (!ideia || !ideiaEstaPublica(ideia)) {
      return res.status(404).json({ erro: "Ideia não encontrada" });
    }

    if (ehIgual(ideia.USUARIOS_ID, usuarioId)) {
      return res.status(403).json({ erro: "Você não pode enviar um pedido para a sua própria ideia" });
    }

    const existente = await contatoService.buscarPorIdeiaEInteressado(ideiaId, usuarioId);

    if (existente) {
      return res.status(409).json({
        erro: MENSAGEM_POR_STATUS[existente.STATUS] || MENSAGEM_POR_STATUS.Recusado,
      });
    }

    const pendentes = await contatoService.contarPedidosPendentesDoInteressado(usuarioId);

    if (pendentes >= MAX_PEDIDOS_PENDENTES) {
      return res.status(429).json({
        erro: "Você já tem muitos pedidos aguardando resposta. Espere os autores responderem antes de enviar novos.",
      });
    }

    const contatoId = await contatoService.criarComMensagem({
      ideiaId,
      ideiaTitulo: ideia.TITULO,
      autorId: ideia.USUARIOS_ID,
      interessadoId: usuarioId,
      anonimo: Boolean(ideia.ANONIMO),
      texto,
    });

    const contato = await contatoService.buscarPorId(contatoId);

    await notificacaoService.criarSemFalhar(
      ideia.USUARIOS_ID,
      notificacaoContatoPedido(contato?.INTERESSADO_NOME, ideia.TITULO),
      ideiaId,
      contatoId,
    );

    return res.status(201).json({
      mensagem: "Pedido enviado! Você será avisado quando o autor responder.",
      contatoId,
    });
  } catch (erro) {
    if (erro?.status === 409) {
      return res.status(409).json({ erro: erro.message });
    }

    return erroInterno(res, erro, "Erro ao enviar o pedido de contato");
  }
}

// Mostra, na página da ideia, em que pé está o pedido de quem está logado.
async function meuContatoDaIdeia(req, res) {
  try {
    const ideiaId = idPositivo(req.params.ideiaId);

    if (!ideiaId) {
      return res.status(400).json({ erro: "ID da ideia inválido" });
    }

    const contato = await contatoService.buscarPorIdeiaEInteressado(ideiaId, req.user.id);

    return res.status(200).json({
      contato: contato ? visaoDoContato(contato, req.user.id) : null,
    });
  } catch (erro) {
    return erroInterno(res, erro, "Erro ao buscar o pedido de contato");
  }
}

// ---------------------------------------------------------------- conversas

async function listarContatos(req, res) {
  try {
    const usuarioId = req.user.id;
    const contatos = await contatoService.listarDoUsuario(usuarioId);

    return res.status(200).json(
      contatos.map((contato) => {
        const ultima = String(contato.ULTIMA_MENSAGEM ?? "");

        return {
          ...visaoDoContato(contato, usuarioId),
          ULTIMA_MENSAGEM: ultima.length > 120 ? `${ultima.slice(0, 119)}…` : ultima,
          NAO_LIDAS: Number(contato.NAO_LIDAS) || 0,
        };
      }),
    );
  } catch (erro) {
    return erroInterno(res, erro, "Erro ao listar conversas");
  }
}

async function contarNaoLidas(req, res) {
  try {
    const total = await contatoService.contarNaoLidas(req.user.id);
    return res.status(200).json({ total: Number(total) || 0 });
  } catch (erro) {
    return erroInterno(res, erro, "Erro ao contar mensagens não lidas");
  }
}

async function buscarContato(req, res) {
  try {
    const contato = await carregarContatoDoParticipante(req, res);
    if (!contato) return undefined;

    const usuarioId = req.user.id;
    const mensagens = await contatoService.listarMensagens(contato.ID);

    // Abrir a conversa conta como leitura.
    await contatoService.marcarComoLido(contato, usuarioId);

    return res.status(200).json({
      contato: visaoDoContato(contato, usuarioId),
      mensagens: mensagens.map((m) => ({
        ID: m.ID,
        MINHA: ehIgual(m.REMETENTE_ID, usuarioId),
        TEXTO: m.TEXTO,
        CREATED_AT: m.CREATED_AT,
      })),
    });
  } catch (erro) {
    return erroInterno(res, erro, "Erro ao abrir a conversa");
  }
}

async function aceitar(req, res) {
  return decidirPedido(req, res, "Aceito");
}

async function recusar(req, res) {
  return decidirPedido(req, res, "Recusado");
}

// Só o autor decide, e só enquanto o pedido está pendente.
async function decidirPedido(req, res, novoStatus) {
  try {
    const contato = await carregarContatoDoParticipante(req, res);
    if (!contato) return undefined;

    if (!souAutorDoContato(contato, req.user.id)) {
      return res.status(403).json({ erro: "Só o autor da ideia pode responder ao pedido" });
    }

    const resultado = await contatoService.mudarStatus(contato.ID, ["Pendente"], novoStatus);

    if (resultado.affectedRows === 0) {
      return res.status(409).json({ erro: "Este pedido já foi respondido" });
    }

    const notificacao =
      novoStatus === "Aceito"
        ? notificacaoContatoAceito(contato.IDEIA_TITULO)
        : notificacaoContatoRecusado(contato.IDEIA_TITULO);

    await notificacaoService.criarSemFalhar(
      contato.INTERESSADO_ID,
      notificacao,
      contato.IDEIAS_ID,
      contato.ID,
    );

    return res.status(200).json({
      mensagem: novoStatus === "Aceito" ? "Pedido aceito. A conversa está aberta." : "Pedido recusado.",
      status: novoStatus,
    });
  } catch (erro) {
    return erroInterno(res, erro, "Erro ao responder ao pedido");
  }
}

async function encerrar(req, res) {
  try {
    const contato = await carregarContatoDoParticipante(req, res);
    if (!contato) return undefined;

    const usuarioId = req.user.id;
    const souAutor = souAutorDoContato(contato, usuarioId);

    // Pedido pendente: o autor usa "Recusar"; o interessado pode cancelar o próprio pedido.
    if (contato.STATUS === "Pendente" && souAutor) {
      return res.status(409).json({ erro: "Para dizer não a um pedido, use Recusar" });
    }

    const resultado = await contatoService.mudarStatus(
      contato.ID,
      ["Pendente", "Aceito"],
      "Encerrado",
      usuarioId,
    );

    if (resultado.affectedRows === 0) {
      return res.status(409).json({ erro: "Esta conversa já foi encerrada" });
    }

    // Cancelar o próprio pedido pendente não precisa avisar o autor.
    if (contato.STATUS === "Aceito") {
      await notificacaoService.criarSemFalhar(
        souAutor ? contato.INTERESSADO_ID : contato.AUTOR_ID,
        notificacaoContatoEncerrado(contato.IDEIA_TITULO),
        contato.IDEIAS_ID,
        contato.ID,
      );
    }

    return res.status(200).json({ mensagem: "Conversa encerrada.", status: "Encerrado" });
  } catch (erro) {
    return erroInterno(res, erro, "Erro ao encerrar a conversa");
  }
}

async function enviarMensagem(req, res) {
  try {
    const contato = await carregarContatoDoParticipante(req, res);
    if (!contato) return undefined;

    const texto = textoComLimite((req.body ?? {}).texto, { min: 1, max: MENSAGEM_MAX });

    if (!texto) {
      return res.status(400).json({
        erro: `Escreva uma mensagem de até ${MENSAGEM_MAX} caracteres`,
      });
    }

    if (contato.STATUS !== "Aceito") {
      return res.status(409).json({
        erro:
          contato.STATUS === "Pendente"
            ? "Aguarde o autor aceitar o pedido para conversar"
            : "Esta conversa não está aberta",
      });
    }

    // O banco só grava se a conversa ainda estiver aberta (outra pessoa pode ter encerrado agora há pouco).
    const resultado = await contatoService.inserirMensagem(contato.ID, req.user.id, texto);

    if (resultado.affectedRows === 0) {
      return res.status(409).json({ erro: "Esta conversa não está aberta" });
    }

    return res.status(201).json({ mensagem: "Mensagem enviada" });
  } catch (erro) {
    return erroInterno(res, erro, "Erro ao enviar a mensagem");
  }
}

async function denunciar(req, res) {
  try {
    const contato = await carregarContatoDoParticipante(req, res);
    if (!contato) return undefined;

    const body = req.body ?? {};
    const motivo = textoComLimite(body.motivo, { min: 1, max: MOTIVO_MAX });
    const descricao =
      body.descricao === undefined || body.descricao === null || body.descricao === ""
        ? null
        : textoComLimite(body.descricao, { min: 1, max: DESCRICAO_MAX });

    if (!motivo || (body.descricao && descricao === null)) {
      return res.status(400).json({
        erro: `Informe o motivo (até ${MOTIVO_MAX} caracteres) e, se quiser, uma descrição (até ${DESCRICAO_MAX})`,
      });
    }

    const aberta = await contatoService.buscarDenunciaAbertaDoUsuario(contato.ID, req.user.id);

    if (aberta) {
      return res.status(409).json({ erro: "Você já denunciou esta conversa. Ela está em análise." });
    }

    await contatoService.criarDenuncia(contato.ID, req.user.id, motivo, descricao);

    return res.status(201).json({
      mensagem: "Denúncia enviada. A moderação vai analisar esta conversa.",
    });
  } catch (erro) {
    return erroInterno(res, erro, "Erro ao denunciar a conversa");
  }
}

// ---------------------------------------------------------------- moderação (somente admin)

async function listarDenunciasDeConversas(req, res) {
  try {
    const denuncias = await contatoService.listarDenuncias();

    // Ainda não abre a conversa: só mostra quem denunciou e por quê.
    return res.status(200).json(
      denuncias.map((d) => ({
        ID: d.ID,
        CONTATO_ID: d.CONTATO_ID,
        MOTIVO: d.MOTIVO,
        DESCRICAO: d.DESCRICAO,
        STATUS: d.STATUS,
        MEDIDA: d.MEDIDA,
        ADMIN_NOME: d.ADMIN_NOME,
        CREATED_AT: d.CREATED_AT,
        RESOLVIDA_AT: d.RESOLVIDA_AT,
        IDEIA_TITULO: d.IDEIA_TITULO,
        DENUNCIANTE_NOME: d.DENUNCIANTE_NOME,
        AUTOR_NOME: d.AUTOR_NOME,
        INTERESSADO_NOME: d.INTERESSADO_NOME,
        PROPRIA_CONVERSA:
          ehIgual(d.AUTOR_ID, req.user.id) || ehIgual(d.INTERESSADO_ID, req.user.id),
      })),
    );
  } catch (erro) {
    return erroInterno(res, erro, "Erro ao listar denúncias de conversas");
  }
}

// Única porta para o admin ler uma conversa: tem que existir uma denúncia sobre ela.
// Cada leitura fica registrada no LOG_MODERACAO.
async function abrirDenunciaDeConversa(req, res) {
  try {
    const id = idPositivo(req.params.id);

    if (!id) {
      return res.status(400).json({ erro: "ID da denúncia inválido" });
    }

    const denuncia = await contatoService.buscarDenuncia(id);

    if (!denuncia) {
      return res.status(404).json({ erro: "Denúncia não encontrada" });
    }

    if (ehIgual(denuncia.AUTOR_ID, req.user.id) || ehIgual(denuncia.INTERESSADO_ID, req.user.id)) {
      return res.status(403).json({
        erro: "Você participa desta conversa. Outro administrador precisa analisá-la.",
      });
    }

    const mensagens = await contatoService.listarMensagens(denuncia.CONTATO_ID, 500);

    await logModeracaoModel.registrar(req.user.id, "conversa_lida", {
      detalhe: `Leitura da conversa #${denuncia.CONTATO_ID} por causa da denúncia de conversa #${denuncia.ID}`,
    });

    return res.status(200).json({
      denuncia: {
        ID: denuncia.ID,
        CONTATO_ID: denuncia.CONTATO_ID,
        MOTIVO: denuncia.MOTIVO,
        DESCRICAO: denuncia.DESCRICAO,
        STATUS: denuncia.STATUS,
        MEDIDA: denuncia.MEDIDA,
        JUSTIFICATIVA: denuncia.JUSTIFICATIVA,
        ADMIN_NOME: denuncia.ADMIN_NOME,
        CREATED_AT: denuncia.CREATED_AT,
        RESOLVIDA_AT: denuncia.RESOLVIDA_AT,
        IDEIA_TITULO: denuncia.IDEIA_TITULO,
        DENUNCIANTE_NOME: denuncia.DENUNCIANTE_NOME,
        AUTOR_NOME: denuncia.AUTOR_NOME,
        INTERESSADO_NOME: denuncia.INTERESSADO_NOME,
      },
      mensagens: mensagens.map((m) => ({
        ID: m.ID,
        REMETENTE_NOME: ehIgual(m.REMETENTE_ID, denuncia.AUTOR_ID)
          ? denuncia.AUTOR_NOME
          : denuncia.INTERESSADO_NOME,
        TEXTO: m.TEXTO,
        CREATED_AT: m.CREATED_AT,
      })),
    });
  } catch (erro) {
    return erroInterno(res, erro, "Erro ao abrir a denúncia de conversa");
  }
}

async function resolverDenunciaDeConversa(req, res) {
  try {
    const id = idPositivo(req.params.id);
    const adminId = req.user.id;
    const body = req.body ?? {};

    if (!id) {
      return res.status(400).json({ erro: "ID da denúncia inválido" });
    }

    if (!MEDIDAS_CONVERSA.includes(body.medida)) {
      return res.status(400).json({ erro: "Escolha uma medida válida" });
    }

    const justificativa = textoComLimite(body.justificativa, {
      min: JUSTIFICATIVA_MIN,
      max: JUSTIFICATIVA_MAX,
    });

    if (!justificativa) {
      return res.status(400).json({
        erro: `A justificativa é obrigatória (de ${JUSTIFICATIVA_MIN} a ${JUSTIFICATIVA_MAX} caracteres)`,
      });
    }

    const denuncia = await contatoService.buscarDenuncia(id);

    if (!denuncia) {
      return res.status(404).json({ erro: "Denúncia não encontrada" });
    }

    // Conflito de interesse: o admin não decide sobre uma conversa da qual participa.
    if (ehIgual(denuncia.AUTOR_ID, adminId) || ehIgual(denuncia.INTERESSADO_ID, adminId)) {
      return res.status(403).json({
        erro: "Você participa desta conversa. Outro administrador precisa decidir.",
      });
    }

    const resultado = await contatoService.resolverDenuncia(id, adminId, body.medida, justificativa);

    if (resultado.affectedRows === 0) {
      return res.status(409).json({ erro: "Esta denúncia já foi resolvida" });
    }

    let encerrou = false;

    if (body.medida === "Encerrar conversa") {
      const mudou = await contatoService.mudarStatus(
        denuncia.CONTATO_ID,
        ["Pendente", "Aceito"],
        "Encerrado",
        adminId,
      );

      encerrou = mudou.affectedRows > 0;

      if (encerrou) {
        const aviso = notificacaoContatoEncerrado(denuncia.IDEIA_TITULO, "moderacao");
        await notificacaoService.criarSemFalhar(denuncia.AUTOR_ID, aviso, null, denuncia.CONTATO_ID);
        await notificacaoService.criarSemFalhar(denuncia.INTERESSADO_ID, aviso, null, denuncia.CONTATO_ID);
      }
    }

    await logModeracaoModel.registrar(adminId, "denuncia_conversa_resolvida", {
      detalhe: `Denúncia de conversa #${id} (conversa #${denuncia.CONTATO_ID}): ${body.medida}. ${justificativa}`,
    });

    return res.status(200).json({
      mensagem: "Denúncia resolvida",
      conversaEncerrada: encerrou,
    });
  } catch (erro) {
    return erroInterno(res, erro, "Erro ao resolver a denúncia de conversa");
  }
}

export default {
  criarContato,
  meuContatoDaIdeia,
  listarContatos,
  contarNaoLidas,
  buscarContato,
  aceitar,
  recusar,
  encerrar,
  enviarMensagem,
  denunciar,
  listarDenunciasDeConversas,
  abrirDenunciaDeConversa,
  resolverDenunciaDeConversa,
};
