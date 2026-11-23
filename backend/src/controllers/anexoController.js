import anexoService from "../services/anexoService.js";
import ideiaService from "../services/ideiaService.js";
import { idPositivo } from "../utils/validacao.js";
import { podeVerIdeia } from "../utils/ideiaPublica.js";

// O dono da ideia é conferido ANTES do envio, em routes/anexoRoutes.js
// (assim quem não é o dono nem chega a gravar arquivo no servidor).
async function enviarAnexo(req, res) {
  try {
    const ideiaId = idPositivo(req.params.ideiaId);

    if (!ideiaId) {
      return res.status(400).json({
        erro: "ID da ideia é obrigatório",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        erro: "Nenhum arquivo foi enviado",
      });
    }

    const arquivo = req.file;

    const caminho = `uploads/${arquivo.filename}`;

    await anexoService.criarAnexo(
      ideiaId,
      arquivo.originalname,
      arquivo.filename,
      caminho,
      arquivo.mimetype,
      arquivo.size,
    );

    return res.status(201).json({
      mensagem: "Arquivo enviado com sucesso",
      anexo: {
        nomeArquivo: arquivo.originalname,
        nomeSalvo: arquivo.filename,
        caminho,
        tipo: arquivo.mimetype,
        tamanho: arquivo.size,
      },
    });
  } catch (erro) {
    console.error("Erro ao enviar anexo:", erro);

    return res.status(500).json({
      erro: "Erro ao enviar arquivo",
    });
  }
}

// Os anexos de uma ideia oculta pela moderação só aparecem para o autor e para administradores.
async function listarAnexosPorIdeia(req, res) {
  try {
    const ideiaId = idPositivo(req.params.ideiaId);

    if (!ideiaId) {
      return res.status(400).json({ erro: "ID da ideia inválido" });
    }

    const ideia = await ideiaService.buscarIdeiaPorId(ideiaId);

    if (!podeVerIdeia(ideia, req.user)) {
      return res.status(404).json({ erro: "Ideia não encontrada" });
    }

    const anexos = await anexoService.listarAnexosPorIdeia(ideiaId);

    return res.status(200).json(anexos);
  } catch (erro) {
    console.error("Erro ao buscar anexos:", erro);

    return res.status(500).json({
      erro: "Erro ao buscar anexos",
    });
  }
}

async function buscarAnexoPorId(req, res) {
  try {
    const id = idPositivo(req.params.id);

    if (!id) {
      return res.status(400).json({ erro: "ID do anexo inválido" });
    }

    const anexo = await anexoService.buscarAnexoPorId(id);

    if (!anexo) {
      return res.status(404).json({
        erro: "Anexo não encontrado",
      });
    }

    const ideia = await ideiaService.buscarIdeiaPorId(anexo.IDEIAS_ID);

    if (!podeVerIdeia(ideia, req.user)) {
      return res.status(404).json({
        erro: "Anexo não encontrado",
      });
    }

    return res.status(200).json(anexo);
  } catch (erro) {
    console.error("Erro ao buscar anexo:", erro);

    return res.status(500).json({
      erro: "Erro ao buscar anexo",
    });
  }
}

export default {
  enviarAnexo,
  listarAnexosPorIdeia,
  buscarAnexoPorId,
};
