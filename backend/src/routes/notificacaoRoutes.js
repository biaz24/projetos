import { Router } from "express";

import notificacaoController from "../controllers/notificacaoController.js";
import autenticarToken from "../middlewares/authMiddleware.js";

const router = Router();

router.get(
  "/notificacoes",
  autenticarToken,
  notificacaoController.listarNotificacoes,
);

router.get(
  "/notificacoes/nao-lidas",
  autenticarToken,
  notificacaoController.contarNaoLidas,
);

router.patch(
  "/notificacoes/:id/lida",
  autenticarToken,
  notificacaoController.marcarComoLida,
);

router.patch(
  "/notificacoes/lidas",
  autenticarToken,
  notificacaoController.marcarTodasComoLidas,
);

export default router;
