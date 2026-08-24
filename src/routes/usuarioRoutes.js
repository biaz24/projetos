import { Router } from "express";
// ferramenta que cria rotas

// pegando a função que esta nesse arquivo
import usuarioController from "../controllers/usuarioController.js";
import autenticarToken from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/usuarios", usuarioController.cadastrarUsuario);

// listar e ver perfil de usuário agora exigem estar logado
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
