import denunciaService from "../services/denunciaService.js";

async function criarDenuncia(req, res) {
  try {
    const { ideiaId, motivo, descricao } = req.body;
    const usuarioId = req.user.id;

    if (!ideiaId || !motivo) {
      return res.status(400).json({
        erro: "Ideia e motivo são obrigatórios",
      });
    }
    const ideia = await denunciaService.buscarAutorDaIdeia(ideiaId);

    if (!ideia) {
      return res.status(404).json({
        erro: "Ideia não encontrada",
      });
    }

    if (Number(ideia.USUARIOS_ID) === Number(usuarioId)) {
      return res.status(403).json({
        erro: "Você não pode denunciar sua própria ideia",
      });
    }

    const resultado = await denunciaService.criarDenuncia(
      ideiaId,
      usuarioId,
      motivo,
      descricao || null,
    );

    return res.status(201).json({
      mensagem: "Denúncia registrada com sucesso",
      denunciaId: resultado.insertId,
    });
  } catch (erro) {
    console.error("Erro ao criar denúncia:", erro);

    return res.status(500).json({
      erro: "Erro ao registrar denúncia",
    });
  }
}

async function listarDenuncias(req, res) {
  try {
    const denuncias = await denunciaService.listarDenuncias();

    return res.status(200).json(denuncias);
  } catch (erro) {
    console.error("Erro ao listar denúncias:", erro);

    return res.status(500).json({
      erro: "Erro ao listar denúncias",
    });
  }
}

async function listarDenunciasPorIdeia(req, res) {
  try {
    const { ideiaId } = req.params;
    const denuncias = await denunciaService.listarDenunciasPorIdeia(ideiaId);

    return res.status(200).json(denuncias);
  } catch (erro) {
    console.error("Erro ao listar histórico de denúncias da ideia:", erro);

    return res.status(500).json({
      erro: "Erro ao buscar histórico de denúncias da ideia",
    });
  }
}

async function buscarDenunciaPorId(req, res) {
  try {
    const { id } = req.params;

    const denuncia = await denunciaService.buscarDenunciaPorId(id);

    if (!denuncia) {
      return res.status(404).json({
        erro: "Denúncia não encontrada",
      });
    }

    if (denuncia.STATUS === "Pendente") {
      await denunciaService.atualizarStatus(id, "Em análise");
      denuncia.STATUS = "Em análise";
    }

    return res.status(200).json(denuncia);
  } catch (erro) {
    console.error("Erro ao buscar denúncia:", erro);

    return res.status(500).json({
      erro: "Erro ao buscar denúncia",
    });
  }
}

async function atualizarStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const statusPermitidos = ["Pendente", "Em análise", "Resolvida"];

    if (!statusPermitidos.includes(status)) {
      return res.status(400).json({
        erro: "Status inválido. Use Pendente, Em análise ou Resolvida.",
      });
    }

    const resultado = await denunciaService.atualizarStatus(id, status);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: "Denúncia não encontrada",
      });
    }

    return res.status(200).json({
      mensagem: "Status da denúncia atualizado com sucesso",
    });
  } catch (erro) {
    console.error("Erro ao atualizar denúncia:", erro);

    return res.status(500).json({
      erro: "Erro ao atualizar denúncia",
    });
  }
}

async function salvarRascunho(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const { resultado, medidaAplicada, justificativa } = req.body;

    // Confirma se a denúncia existe
    const denuncia = await denunciaService.buscarDenunciaPorId(id);

    if (!denuncia) {
      return res.status(404).json({
        erro: "Denúncia não encontrada",
      });
    }

    const resposta = await denunciaService.salvarRascunho(
      id,
      adminId,
      resultado || null,
      medidaAplicada || null,
      justificativa || null,
    );

    return res.status(200).json({
      mensagem: "Rascunho salvo com sucesso",
      atualizado: resposta,
    });
  } catch (erro) {
    console.error("Erro ao salvar rascunho:", erro);

    return res.status(500).json({
      erro: "Erro ao salvar rascunho",
    });
  }
}

async function buscarRascunho(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Confirma se a denúncia existe
    const denuncia = await denunciaService.buscarDenunciaPorId(id);

    if (!denuncia) {
      return res.status(404).json({
        erro: "Denúncia não encontrada",
      });
    }

    const rascunho = await denunciaService.buscarRascunho(id, adminId);

    return res.status(200).json(rascunho);
  } catch (erro) {
    console.error("Erro ao buscar rascunho:", erro);

    return res.status(500).json({
      erro: "Erro ao buscar rascunho",
    });
  }
}
async function concluirAnalise(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const { resultado, medidaAplicada, justificativa } = req.body;

    const resultadosPermitidos = ["Procedente", "Improcedente"];

    const medidasPermitidas = [
      "Nenhuma",
      "Aviso",
      "Ocultar ideia",
      "Excluir ideia",
    ];

    if (!resultadosPermitidos.includes(resultado)) {
      return res.status(400).json({
        erro: "Selecione um resultado válido para a análise.",
      });
    }

    if (!medidasPermitidas.includes(medidaAplicada)) {
      return res.status(400).json({
        erro: "Selecione uma medida válida.",
      });
    }

    if (resultado === "Improcedente" && medidaAplicada !== "Nenhuma") {
      return res.status(400).json({
        erro: "Uma denúncia improcedente não pode receber uma medida punitiva.",
      });
    }
    if (typeof justificativa !== "string" || !justificativa.trim()) {
      return res.status(400).json({
        erro: "A justificativa é obrigatória.",
      });
    }

    const resposta = await denunciaService.concluirAnalise(
      id,
      adminId,
      resultado,
      medidaAplicada,
      justificativa.trim(),
    );

    if (resposta.affectedRows === 0) {
      return res.status(404).json({
        erro: "Não foi possível concluir a denúncia.",
      });
    }

    return res.status(200).json({
      mensagem: "Denúncia concluída com sucesso!",
      status: "Resolvida",
    });
  } catch (erro) {
    console.error("Erro ao concluir análise:", erro);

    if (erro.message === "Denúncia não encontrada.") {
      return res.status(404).json({
        erro: erro.message,
      });
    }

    if (erro.message === "Esta denúncia já foi resolvida.") {
      return res.status(409).json({
        erro: erro.message,
      });
    }

    return res.status(500).json({
      erro: "Erro interno ao concluir a denúncia.",
    });
  }
}
export default {
  criarDenuncia,
  listarDenuncias,
  buscarDenunciaPorId,
  listarDenunciasPorIdeia,
  atualizarStatus,
  buscarRascunho,
  salvarRascunho,
  concluirAnalise,
};
