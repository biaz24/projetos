import ideiaService from "../services/ideiaService.js";
import notificacaoService from "../services/notificacaoService.js";
import logModeracaoModel from "../models/logModeracaoModel.js";
import {
  CATEGORIAS_VALIDAS,
  STATUS_VALIDOS,
  textoComLimite,
  idPositivo,
  paginacaoSegura,
} from "../utils/validacao.js";
import {
  protegerAutor,
  protegerListaDeIdeias,
  ideiaEhAnonima,
  podeVerIdeia,
} from "../utils/ideiaPublica.js";
import {
  notificacaoIdeiaAprovada,
  notificacaoIdeiaRejeitada,
} from "../utils/mensagensNotificacao.js";

const TITULO_MAX = 100; // o banco guarda no máximo 100 caracteres
const DESCRICAO_MAX = 5000; // mesmo limite do formulário do site
const BUSCA_MAX = 100;
const MOTIVO_REJEICAO_MIN = 3;
const MOTIVO_REJEICAO_MAX = 1000;

// Confere e limpa os dados vindos do formulário (criar e editar usam a mesma regra).
// Retorna { dados } se estiver tudo certo ou { erro } com a mensagem para o usuário.
function validarDadosDaIdeia(body) {
  const entrada = body ?? {};

  const descricao = textoComLimite(entrada.descricao, {
    min: 1,
    max: DESCRICAO_MAX,
  });

  if (!descricao) {
    return {
      erro: `A descrição da ideia é obrigatória e pode ter no máximo ${DESCRICAO_MAX} caracteres`,
    };
  }

  let titulo = "Sem título";
  const enviouTitulo =
    entrada.titulo !== undefined &&
    entrada.titulo !== null &&
    String(entrada.titulo).trim() !== "";

  if (enviouTitulo) {
    titulo = textoComLimite(entrada.titulo, { min: 1, max: TITULO_MAX });

    if (!titulo) {
      return { erro: `O título pode ter no máximo ${TITULO_MAX} caracteres` };
    }
  }

  const categoria = entrada.categoria || "Geral";
  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    return { erro: "Categoria inválida" };
  }

  const status = entrada.status || "Disponível";
  if (!STATUS_VALIDOS.includes(status)) {
    return { erro: "Status inválido" };
  }

  const anonimo =
    entrada.anonimo === true ||
    entrada.anonimo === 1 ||
    entrada.anonimo === "1" ||
    entrada.anonimo === "true";

  return { dados: { titulo, descricao, categoria, status, anonimo } };
}

async function criarIdeia(req, res) {
  try {
    const usuarioId = req.user.id;

    const { dados, erro } = validarDadosDaIdeia(req.body);
    if (erro) {
      return res.status(400).json({ erro });
    }

    const resultado = await ideiaService.criarIdeia(
      usuarioId,
      dados.titulo,
      dados.descricao,
      dados.categoria,
      dados.status,
      dados.anonimo,
    );

    return res.status(201).json({
      mensagem: "Ideia publicada com sucesso",
      ideiaId: resultado.insertId,
    });
  } catch (erro) {
    console.error("Erro ao criar ideia:", erro);
    return res.status(500).json({
      erro: "Erro ao publicar ideia",
    });
  }
}

async function listarIdeias(req, res) {
  try {
    const { page, limit } = paginacaoSegura(req.query.page, req.query.limit);

    const texto = (valor, max) =>
      typeof valor === "string" ? valor.slice(0, max) : "";

    const resultado = await ideiaService.listarIdeias({
      page,
      limit,
      search: texto(req.query.search, BUSCA_MAX),
      categoria: texto(req.query.categoria, 50),
      status: texto(req.query.status, 30),
    });

    return res.status(200).json({
      ...resultado,
      // Ideias anônimas não podem revelar o autor, e a lista não precisa do e-mail.
      ideias: protegerListaDeIdeias(resultado.ideias, req.user.id),
    });
  } catch (erro) {
    console.error("Erro ao listar ideias:", erro);
    return res.status(500).json({
      erro: "Erro ao buscar ideias",
    });
  }
}

async function buscarIdeiaPorId(req, res) {
  try {
    const id = idPositivo(req.params.id);

    if (!id) {
      return res.status(400).json({ erro: "ID da ideia inválido" });
    }

    const usuarioId = req.user.id;

    const ideia = await ideiaService.buscarIdeiaPorId(id, usuarioId);

    // Ideia oculta pela moderação (ou em revisão) só pode ser vista
    // pelo próprio autor, para reformular, e pelos administradores.
    if (!podeVerIdeia(ideia, req.user)) {
      return res.status(404).json({
        erro: "Ideia não encontrada",
      });
    }

    // O e-mail do autor não é mais enviado: o contato agora é feito pelo pedido de
    // contato + chat privado (veja contatoController.js).
    return res.status(200).json(protegerAutor(ideia, usuarioId));
  } catch (erro) {
    console.error("Erro ao buscar ideia por id:", erro);
    return res.status(500).json({
      erro: "Erro ao buscar ideia",
    });
  }
}

async function atualizarIdeia(req, res) {
  try {
    const id = idPositivo(req.params.id);

    if (!id) {
      return res.status(400).json({ erro: "ID da ideia inválido" });
    }

    const ideiaExistente = await ideiaService.buscarIdeiaPorId(id);
    if (!ideiaExistente) {
      return res.status(404).json({
        erro: "Ideia não encontrada",
      });
    }

    if (String(ideiaExistente.USUARIOS_ID) !== String(req.user.id)) {
      return res.status(403).json({
        erro: "Você não tem permissão para alterar esta ideia",
      });
    }

    // Enquanto a moderação analisa, o texto não pode mudar por baixo dela.
    if (ideiaExistente.VISIBILIDADE === "EmRevisao") {
      return res.status(409).json({
        erro: "Esta ideia está em revisão. Aguarde a decisão da moderação para editá-la.",
      });
    }

    const { dados, erro } = validarDadosDaIdeia(req.body);
    if (erro) {
      return res.status(400).json({ erro });
    }

    await ideiaService.atualizarIdeia(
      id,
      dados.titulo,
      dados.descricao,
      dados.categoria,
      dados.status,
      dados.anonimo,
    );

    return res.status(200).json({
      mensagem: "Ideia atualizada com sucesso",
    });
  } catch (erro) {
    console.error("Erro ao atualizar ideia:", erro);
    return res.status(500).json({
      erro: "Erro ao atualizar ideia",
    });
  }
}

async function deletarideia(req, res) {
  try {
    const id = idPositivo(req.params.id);

    if (!id) {
      return res.status(400).json({ erro: "ID da ideia inválido" });
    }

    const ideiaExistente = await ideiaService.buscarIdeiaPorId(id);

    if (!ideiaExistente) {
      return res.status(404).json({
        erro: "Ideia não encontrada",
      });
    }

    if (String(ideiaExistente.USUARIOS_ID) !== String(req.user.id)) {
      return res.status(403).json({
        erro: "Você não tem permissão para excluir esta ideia",
      });
    }

    await ideiaService.deletarideia(id);

    return res.status(200).json({
      mensagem: "Ideia excluída com sucesso",
    });
  } catch (erro) {
    console.error("Erro ao deletar ideia:", erro);
    return res.status(500).json({
      erro: "Erro ao excluir ideia",
    });
  }
}

async function listarideiasPorUsuario(req, res) {
  try {
    const usuarioId = idPositivo(req.params.usuarioId);

    if (!usuarioId) {
      return res.status(400).json({ erro: "ID do usuário inválido" });
    }

    let ideias = await ideiaService.listarideiasPorusuario(usuarioId);

    // Se esta lista fosse completa, qualquer pessoa descobriria quais ideias
    // anônimas pertencem a um usuário. Só o próprio usuário vê as anônimas dele.
    const ehOProprioUsuario = Number(req.user.id) === usuarioId;
    if (!ehOProprioUsuario) {
      ideias = ideias.filter((ideia) => !ideiaEhAnonima(ideia));
    }

    return res.status(200).json(protegerListaDeIdeias(ideias, req.user.id));
  } catch (erro) {
    console.error("Erro ao listar ideias por usuário:", erro);
    return res.status(500).json({
      erro: "Erro ao buscar ideias do usuário",
    });
  }
}

// ---------------------------------------------------------------------------
// Ideias ocultadas pela moderação e reformulação
// ---------------------------------------------------------------------------

// "Meu perfil > Minhas ideias ocultadas": só as ideias do próprio usuário.
async function listarMinhasOcultas(req, res) {
  try {
    const ideias = await ideiaService.listarOcultasDoUsuario(req.user.id);

    return res.status(200).json(ideias);
  } catch (erro) {
    console.error("Erro ao listar ideias ocultadas:", erro);
    return res.status(500).json({
      erro: "Erro ao buscar suas ideias ocultadas",
    });
  }
}

// O autor corrigiu a ideia e a envia de novo para a moderação.
async function reenviarIdeia(req, res) {
  try {
    const id = idPositivo(req.params.id);

    if (!id) {
      return res.status(400).json({ erro: "ID da ideia inválido" });
    }

    const ideia = await ideiaService.buscarIdeiaPorId(id);

    if (!ideia) {
      return res.status(404).json({ erro: "Ideia não encontrada" });
    }

    if (Number(ideia.USUARIOS_ID) !== Number(req.user.id)) {
      return res.status(403).json({
        erro: "Você não tem permissão para reenviar esta ideia",
      });
    }

    if (ideia.VISIBILIDADE === "EmRevisao") {
      return res.status(409).json({
        erro: "Esta ideia já está em revisão. Aguarde a decisão da moderação.",
      });
    }

    if (ideia.VISIBILIDADE !== "Oculta") {
      return res.status(409).json({
        erro: "Só é possível reenviar ideias que foram ocultadas pela moderação",
      });
    }

    const resultado = await ideiaService.reenviarParaRevisao(id);

    if (resultado.affectedRows === 0) {
      return res.status(409).json({
        erro: "Esta ideia não está mais oculta",
      });
    }

    return res.status(200).json({
      mensagem: "Ideia reenviada para revisão",
    });
  } catch (erro) {
    console.error("Erro ao reenviar ideia:", erro);
    return res.status(500).json({
      erro: "Erro ao reenviar ideia",
    });
  }
}

// ---------------------------------------------------------------------------
// Rotas de administrador: recebem os dados completos de propósito (moderação).
// ---------------------------------------------------------------------------

async function buscarIdeiaParaAdmin(req, res) {
  try {
    const id = idPositivo(req.params.id);

    if (!id) {
      return res.status(400).json({ erro: "ID da ideia inválido" });
    }

    const ideia = await ideiaService.buscarIdeiaPorId(id);

    if (!ideia) {
      return res.status(404).json({
        erro: "Ideia não encontrada",
      });
    }

    return res.status(200).json(ideia);
  } catch (erro) {
    console.error("Erro ao buscar ideia para administrador:", erro);

    return res.status(500).json({
      erro: "Erro ao buscar detalhes da ideia",
    });
  }
}

const MSG_PROPRIA_REVISAO =
  "Você não pode decidir sobre a sua própria ideia. Peça a outro administrador.";

async function listarRevisoes(req, res) {
  try {
    const ideias = await ideiaService.listarEmRevisao();

    // PROPRIA_IDEIA deixa o site desativar os botões de decisão
    return res.status(200).json(
      ideias.map((i) => ({
        ...i,
        PROPRIA_IDEIA: Number(i.USUARIOS_ID) === Number(req.user.id),
      })),
    );
  } catch (erro) {
    console.error("Erro ao listar ideias em revisão:", erro);
    return res.status(500).json({
      erro: "Erro ao buscar ideias em revisão",
    });
  }
}

async function aprovarRevisao(req, res) {
  try {
    const id = idPositivo(req.params.id);

    if (!id) {
      return res.status(400).json({ erro: "ID da ideia inválido" });
    }

    const ideia = await ideiaService.buscarIdeiaPorId(id);

    if (!ideia) {
      return res.status(404).json({ erro: "Ideia não encontrada" });
    }

    if (Number(ideia.USUARIOS_ID) === Number(req.user.id)) {
      return res.status(403).json({ erro: MSG_PROPRIA_REVISAO });
    }

    const resultado = await ideiaService.aprovarRevisao(id);

    if (resultado.affectedRows === 0) {
      return res.status(409).json({
        erro: "Esta ideia não está aguardando revisão",
      });
    }

    await logModeracaoModel.registrar(req.user.id, "reanalise_aprovada", {
      ideiaId: id,
      detalhe: `Ideia "${ideia.TITULO}" aprovada`,
    });

    await notificacaoService.criarSemFalhar(
      ideia.USUARIOS_ID,
      notificacaoIdeiaAprovada(ideia.TITULO),
      id,
    );

    return res.status(200).json({
      mensagem: "Ideia aprovada e publicada novamente",
    });
  } catch (erro) {
    console.error("Erro ao aprovar ideia:", erro);
    return res.status(500).json({
      erro: "Erro ao aprovar ideia",
    });
  }
}

async function rejeitarRevisao(req, res) {
  try {
    const id = idPositivo(req.params.id);

    if (!id) {
      return res.status(400).json({ erro: "ID da ideia inválido" });
    }

    // O motivo é obrigatório: é o que o autor lê para saber o que ainda precisa ajustar.
    const motivo = textoComLimite((req.body ?? {}).motivo, {
      min: MOTIVO_REJEICAO_MIN,
      max: MOTIVO_REJEICAO_MAX,
    });

    if (!motivo) {
      return res.status(400).json({
        erro: `Explique o motivo (de ${MOTIVO_REJEICAO_MIN} a ${MOTIVO_REJEICAO_MAX} caracteres) para o autor saber o que ajustar`,
      });
    }

    const ideia = await ideiaService.buscarIdeiaPorId(id);

    if (!ideia) {
      return res.status(404).json({ erro: "Ideia não encontrada" });
    }

    if (Number(ideia.USUARIOS_ID) === Number(req.user.id)) {
      return res.status(403).json({ erro: MSG_PROPRIA_REVISAO });
    }

    const resultado = await ideiaService.rejeitarRevisao(id, motivo);

    if (resultado.affectedRows === 0) {
      return res.status(409).json({
        erro: "Esta ideia não está aguardando revisão",
      });
    }

    await logModeracaoModel.registrar(req.user.id, "reanalise_rejeitada", {
      ideiaId: id,
      detalhe: `Ideia "${ideia.TITULO}" rejeitada. Motivo: ${motivo}`,
    });

    await notificacaoService.criarSemFalhar(
      ideia.USUARIOS_ID,
      notificacaoIdeiaRejeitada(ideia.TITULO, motivo),
      id,
    );

    return res.status(200).json({
      mensagem: "Ideia mantida oculta e autor avisado",
    });
  } catch (erro) {
    console.error("Erro ao rejeitar ideia:", erro);
    return res.status(500).json({
      erro: "Erro ao rejeitar ideia",
    });
  }
}

export default {
  criarIdeia,
  listarIdeias,
  buscarIdeiaPorId,
  atualizarIdeia,
  deletarideia,
  listarideiasPorUsuario,
  listarMinhasOcultas,
  reenviarIdeia,
  buscarIdeiaParaAdmin,
  listarRevisoes,
  aprovarRevisao,
  rejeitarRevisao,
};
