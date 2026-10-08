import notificacaoService from "../services/notificacaoService.js";

async function listarNotificacoes(req, res) {
  try {
    const usuarioId = req.user.id;

    const notificacoes = await notificacaoService.listarPorUsuario(usuarioId);

    return res.status(200).json(notificacoes);
  } catch (erro) {
    console.error("Erro ao listar notificações:", erro);

    return res.status(500).json({
      erro: "Erro ao buscar notificações.",
    });
  }
}

async function contarNaoLidas(req, res) {
  try {
    const usuarioId = req.user.id;

    const total = await notificacaoService.contarNaoLidas(usuarioId);

    return res.status(200).json({
      total: Number(total),
    });
  } catch (erro) {
    console.error("Erro ao contar notificações:", erro);

    return res.status(500).json({
      erro: "Erro ao contar notificações não lidas.",
    });
  }
}

async function marcarComoLida(req, res) {
  try {
    const usuarioId = req.user.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        erro: "ID da notificação é obrigatório.",
      });
    }

    const resultado = await notificacaoService.marcarComoLida(id, usuarioId);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: "Notificação não encontrada.",
      });
    }

    return res.status(200).json({
      mensagem: "Notificação marcada como lida.",
    });
  } catch (erro) {
    console.error("Erro ao marcar notificação como lida:", erro);

    return res.status(500).json({
      erro: "Erro ao marcar notificação como lida.",
    });
  }
}

async function marcarTodasComoLidas(req, res) {
  try {
    const usuarioId = req.user.id;

    await notificacaoService.marcarTodasComoLidas(usuarioId);

    return res.status(200).json({
      mensagem: "Todas as notificações foram marcadas como lidas.",
    });
  } catch (erro) {
    console.error("Erro ao marcar todas as notificações como lidas:", erro);

    return res.status(500).json({
      erro: "Erro ao marcar notificações como lidas.",
    });
  }
}

export default {
  listarNotificacoes,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
};
