import { Router } from "express";

import moderacaoUsuarioController from "../controllers/moderacaoUsuarioController.js";
import autenticarToken from "../middlewares/authMiddleware.js";
import verificarAdmin from "../middlewares/adminMiddleware.js";
import { penalidadeLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

router.get(
  "/admin/usuarios/:id/resumo",
  autenticarToken,
  verificarAdmin,
  moderacaoUsuarioController.resumo,
);

router.post(
  "/admin/usuarios/:id/penalidade",
  autenticarToken,
  verificarAdmin,
  penalidadeLimiter,
  moderacaoUsuarioController.aplicarPenalidade,
);

router.post(
  "/admin/usuarios/:id/desbanir",
  autenticarToken,
  verificarAdmin,
  penalidadeLimiter,
  moderacaoUsuarioController.desbanir,
);

export default router;
