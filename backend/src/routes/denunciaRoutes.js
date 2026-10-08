import express from "express";
import denunciaController from "../controllers/denunciaController.js";
import autenticarToken from "../middlewares/authMiddleware.js";
import verificarAdmin from "../middlewares/adminMiddleware.js";

const router = express.Router();

// Usuário autenticado pode criar uma denúncia
router.post("/denuncias", autenticarToken, denunciaController.criarDenuncia);

// Apenas administrador pode listar denúncias
router.get(
  "/denuncias",
  autenticarToken,
  verificarAdmin,
  denunciaController.listarDenuncias,
);

// Apenas administrador pode visualizar uma denúncia específica
router.get(
  "/denuncias/:id",
  autenticarToken,
  verificarAdmin,
  denunciaController.buscarDenunciaPorId,
);

// Apenas administrador pode alterar o status
router.patch(
  "/denuncias/:id/status",
  autenticarToken,
  verificarAdmin,
  denunciaController.atualizarStatus,
);
router.put(
  "/denuncias/:id/rascunho",
  autenticarToken,
  verificarAdmin,
  denunciaController.salvarRascunho,
);

router.get(
  "/denuncias/:id/rascunho",
  autenticarToken,
  verificarAdmin,
  denunciaController.buscarRascunho,
);
router.patch(
  "/denuncias/:id/concluir",
  autenticarToken,
  verificarAdmin,
  denunciaController.concluirAnalise,
);
export default router;
