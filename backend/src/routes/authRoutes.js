import { Router } from "express";
import authController from "../controllers/authController.js";
import autenticarToken from "../middlewares/authMiddleware.js";
import {
  loginLimiter,
  loginPorEmailLimiter,
  refreshLimiter,
  confirmarEmailLimiter,
  reenvioConfirmacaoLimiter,
  reenvioPorEmailLimiter,
} from "../middlewares/rateLimiter.js";

const router = Router();

router.post("/auth/login", loginLimiter, loginPorEmailLimiter, authController.login);
router.get("/auth/me", autenticarToken, authController.me);
router.post("/auth/refresh", refreshLimiter, authController.refresh);
router.post("/auth/logout", authController.logout);
router.post("/auth/confirmar-email", confirmarEmailLimiter, authController.confirmarEmail);
router.post(
  "/auth/reenviar-confirmacao",
  reenvioConfirmacaoLimiter,
  reenvioPorEmailLimiter,
  authController.reenviarConfirmacao,
);

export default router;
