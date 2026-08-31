import { Router } from "express";
import usuarioController from "../controllers/usuarioController.js";
import autenticarToken from "../middlewares/authMiddleware.js";
import { cadastroLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

router.post("/usuarios", cadastroLimiter, usuarioController.cadastrarUsuario);
router.get("/usuarios/me/stats", autenticarToken, usuarioController.obterEstatisticasMeuPerfil);

router.get("/usuarios", autenticarToken, usuarioController.listarUsuarios);
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
