import { Router } from "express";
import usuarioController from "../controllers/usuarioController.js";
import autenticarToken from "../middlewares/authMiddleware.js";
import verificarAdmin from "../middlewares/adminMiddleware.js";
import { cadastroLimiter, trocaSenhaLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

router.post("/usuarios", cadastroLimiter, usuarioController.cadastrarUsuario);
router.put("/usuarios/me/senha", autenticarToken, trocaSenhaLimiter, usuarioController.trocarSenha);
router.get("/usuarios/me/stats", autenticarToken, usuarioController.obterEstatisticasMeuPerfil);

// A lista completa de usuários (com e-mails) é só para administradores.
router.get(
  "/usuarios",
  autenticarToken,
  verificarAdmin,
  usuarioController.listarUsuarios,
);
router.get(
  "/usuarios/:id",
  autenticarToken,
  usuarioController.buscarUsuarioPorId,
);
router.put(
  "/usuarios/:id",
  autenticarToken,
  usuarioController.atualizarUsuario,
);
router.delete(
  "/usuarios/:id",
  autenticarToken,
  usuarioController.deletarUsuario,
);

export default router;
