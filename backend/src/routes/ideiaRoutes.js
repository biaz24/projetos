import { Router } from "express";
import ideiaController from "../controllers/ideiaController.js";
import autenticarToken from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/ideias", autenticarToken, ideiaController.criarIdeia);
router.get("/ideias", ideiaController.listarIdeias);
router.get("/ideias/:id", ideiaController.buscarIdeiaPorId);
router.put("/ideias/:id", autenticarToken, ideiaController.atualizarIdeia);
router.delete("/ideias/:id", autenticarToken, ideiaController.deletarideia);

router.get(
  "/usuarios/:usuarioId/ideias",
  ideiaController.listarideiasPorUsuario,
);

export default router;
