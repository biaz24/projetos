import anexoService from "../services/anexoService.js";
import ideiaService from "../services/ideiaService.js";

async function enviarAnexo(req, res) {
  try {
    const { ideiaId } = req.params;
    const usuarioId = req.user.id;

    const ideia = await ideiaService.buscarIdeiaPorId(ideiaId);

    if (!ideia) {
      return res.status(404).json({
        erro: "Ideia não encontrada",
      });
    }

    if (Number(ideia.USUARIOS_ID) !== Number(usuarioId)) {
      return res.status(403).json({
        erro: "Você não pode anexar arquivos a uma ideia de outro usuário",
      });
    }

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

async function listarAnexosPorIdeia(req, res) {
  try {
    const { ideiaId } = req.params;

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
    const { id } = req.params;

    const anexo = await anexoService.buscarAnexoPorId(id);

    if (!anexo) {
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
