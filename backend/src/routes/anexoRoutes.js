import express from "express";
import anexoController from "../controllers/anexoController.js";
import autenticarToken from "../middlewares/authMiddleware.js";
import { receberArquivoUnico } from "../middlewares/uploadMiddleware.js";
import ideiaService from "../services/ideiaService.js";
import anexoService from "../services/anexoService.js";
import { idPositivo } from "../utils/validacao.js";

const router = express.Router();

const MAX_ANEXOS_POR_IDEIA = 5;

// Roda ANTES de receber o arquivo. Assim, quem não é dono da ideia
// não consegue nem gravar arquivo no disco do servidor.
async function validarDonoDaIdeia(req, res, next) {
  try {
    const ideiaId = idPositivo(req.params.ideiaId);

    if (!ideiaId) {
      return res.status(400).json({ erro: "ID da ideia inválido" });
    }

    const ideia = await ideiaService.buscarIdeiaPorId(ideiaId);

    if (!ideia) {
      return res.status(404).json({ erro: "Ideia não encontrada" });
    }

    if (Number(ideia.USUARIOS_ID) !== Number(req.user.id)) {
      return res.status(403).json({
        erro: "Você não pode anexar arquivos a uma ideia de outro usuário",
      });
    }

    const anexosExistentes = await anexoService.listarAnexosPorIdeia(ideiaId);

    if (anexosExistentes.length >= MAX_ANEXOS_POR_IDEIA) {
      return res.status(400).json({
        erro: `Cada ideia pode ter no máximo ${MAX_ANEXOS_POR_IDEIA} anexos`,
      });
    }

    return next();
  } catch (erro) {
    return next(erro);
  }
}

router.post(
  "/ideias/:ideiaId/anexos",
  autenticarToken,
  validarDonoDaIdeia,
  receberArquivoUnico("arquivo"),
  anexoController.enviarAnexo,
);

router.get(
  "/ideias/:ideiaId/anexos",
  autenticarToken,
  anexoController.listarAnexosPorIdeia,
);

router.get("/anexos/:id", autenticarToken, anexoController.buscarAnexoPorId);

export default router;
