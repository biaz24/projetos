import { Router } from "express";
import ideiaController from "../controllers/ideiaController.js";
import autenticarToken from "../middlewares/authMiddleware.js";
import verificarAdmin from "../middlewares/adminMiddleware.js";

const router = Router();

// Regra do projeto: só quem está logado vê as ideias.
router.post("/ideias", autenticarToken, ideiaController.criarIdeia);
router.get("/ideias", autenticarToken, ideiaController.listarIdeias);
router.get("/ideias/:id", autenticarToken, ideiaController.buscarIdeiaPorId);
router.put("/ideias/:id", autenticarToken, ideiaController.atualizarIdeia);
router.delete("/ideias/:id", autenticarToken, ideiaController.deletarideia);

// O autor reenvia para revisão uma ideia que a moderação ocultou.
router.post("/ideias/:id/reenviar", autenticarToken, ideiaController.reenviarIdeia);

// "Minhas ideias ocultadas" (aba do Meu perfil): só o próprio usuário.
router.get(
  "/usuarios/me/ideias-ocultas",
  autenticarToken,
  ideiaController.listarMinhasOcultas,
);

router.get(
  "/usuarios/:usuarioId/ideias",
  autenticarToken,
  ideiaController.listarideiasPorUsuario,
);

// ---- Somente administradores ----
router.get(
  "/admin/ideias/:id",
  autenticarToken,
  verificarAdmin,
  ideiaController.buscarIdeiaParaAdmin,
);

// Ideias que os autores reformularam e reenviaram, aguardando decisão.
router.get(
  "/admin/ideias-revisao",
  autenticarToken,
  verificarAdmin,
  ideiaController.listarRevisoes,
);

router.patch(
  "/admin/ideias/:id/aprovar",
  autenticarToken,
  verificarAdmin,
  ideiaController.aprovarRevisao,
);

router.patch(
  "/admin/ideias/:id/rejeitar",
  autenticarToken,
  verificarAdmin,
  ideiaController.rejeitarRevisao,
);

export default router;
