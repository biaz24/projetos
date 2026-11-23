import { Router } from "express";
import recuperacaoSenhaController from "../controllers/recuperacaoSenhaController.js";
import { recuperacaoSenhaLimiter, recuperacaoPorEmailLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

router.post(
  "/esqueci-senha",
  recuperacaoSenhaLimiter,
  recuperacaoPorEmailLimiter,
  recuperacaoSenhaController.solicitarRecuperacao,
);

router.get("/redefinir-senha/validar", recuperacaoSenhaController.validarToken);

router.post(
  "/redefinir-senha",
  recuperacaoSenhaLimiter,
  recuperacaoSenhaController.redefinirSenha,
);

export default router;
